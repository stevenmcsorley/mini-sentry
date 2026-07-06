"""Project tracking overview — a single manifest of everything a project tracks,
for humans (the UI panel) and the MCP (project_overview tool). GET reads the
manifest; PATCH updates the human-written description so context persists.
"""
from collections import Counter

from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project, Event, Group, Release, AlertRule, Integration, IssueLink, TrackingItem
from .workspaces import resolve_workspace


def _tracking_dict(t):
    return {
        "id": t.id,
        "source": t.source,
        "kind": t.kind,
        "detail": t.detail,
        "location": t.location,
        "status": t.status,
        "origin": t.origin,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
    }

# Cap how many recent events we scan when deriving sources — keeps it cheap on the Pi.
SAMPLE = 2000


def _scoped_project(request, slug):
    ws = resolve_workspace(request)
    if not ws:
        raise Http404
    return get_object_or_404(Project, slug=slug, workspace=ws)


def _sources(project):
    """Derive what's actually sending data from a sample of recent events."""
    events = (
        Event.objects.filter(project=project)
        .order_by("-received_at")
        .values("environment", "level", "payload", "tags")[:SAMPLE]
    )
    events = list(events)
    envs = Counter()
    levels = Counter()
    platforms = Counter()
    tag_keys = Counter()
    for e in events:
        if e["environment"]:
            envs[e["environment"]] += 1
        if e["level"]:
            levels[e["level"]] += 1
        payload = e["payload"] or {}
        # Common SDK fields that identify the sending stack.
        plat = payload.get("platform") or payload.get("sdk") or payload.get("logger")
        if isinstance(plat, dict):
            plat = plat.get("name")
        if plat:
            platforms[str(plat)] += 1
        tags = e["tags"] or []
        if isinstance(tags, list):
            for t in tags:
                if isinstance(t, dict) and t.get("key"):
                    tag_keys[str(t["key"])] += 1
                elif isinstance(t, str) and ":" in t:
                    tag_keys[t.split(":", 1)[0]] += 1
        elif isinstance(tags, dict):
            for k in tags:
                tag_keys[str(k)] += 1
    return {
        "sampled_events": len(events),
        "environments": [k for k, _ in envs.most_common()],
        "levels": dict(levels),
        "platforms": [k for k, _ in platforms.most_common(10)],
        "tag_keys": [k for k, _ in tag_keys.most_common(15)],
    }


def _overview(project, workspace):
    groups = Group.objects.filter(project=project)
    last_event = (
        Event.objects.filter(project=project).order_by("-received_at").values_list("received_at", flat=True).first()
    )
    first_event = (
        Event.objects.filter(project=project).order_by("received_at").values_list("received_at", flat=True).first()
    )
    releases = list(
        Release.objects.filter(project=project).order_by("-created_at").values_list("version", flat=True)[:10]
    )
    rules = list(AlertRule.objects.filter(project=project).values("name", "active", "target_type"))
    integrations = list(
        Integration.objects.filter(workspace=workspace).values_list("provider", flat=True)
    ) if workspace else []
    links_total = IssueLink.objects.filter(group__project=project).count()

    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "slug": project.slug,
            "description": project.description or "",
            "ingest_token": project.ingest_token,
            "created_at": project.created_at,
        },
        "stats": {
            "events_total": Event.objects.filter(project=project).count(),
            "groups_total": groups.count(),
            "groups_unresolved": groups.filter(status=Group.STATUS_UNRESOLVED).count(),
            "first_event_at": first_event,
            "last_event_at": last_event,
        },
        "sources": _sources(project),
        "tracking": [_tracking_dict(t) for t in project.tracking_items.exclude(status="removed").order_by("source", "id")],
        "releases": releases,
        "alert_rules": rules,
        "integrations": integrations,
        "external_links_total": links_total,
        "ingest_endpoint": f"/api/events/ingest/token/{project.ingest_token}/",
    }


class ProjectOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        project = _scoped_project(request, slug)
        return Response(_overview(project, resolve_workspace(request)))

    def patch(self, request, slug):
        project = _scoped_project(request, slug)
        if "description" in request.data:
            project.description = str(request.data.get("description") or "")[:5000]
            project.save(update_fields=["description"])
        return Response(_overview(project, resolve_workspace(request)))


class ProjectTrackingView(APIView):
    """The declared-monitors inventory for a project (what SHOULD be tracked)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        project = _scoped_project(request, slug)
        items = project.tracking_items.order_by("source", "id")
        return Response([_tracking_dict(t) for t in items])

    def post(self, request, slug):
        project = _scoped_project(request, slug)
        kind = (request.data.get("kind") or "").strip()
        if not kind:
            return Response({"detail": "kind is required"}, status=400)
        item = TrackingItem.objects.create(
            project=project,
            source=request.data.get("source") or "other",
            kind=kind[:200],
            detail=str(request.data.get("detail") or "")[:2000],
            location=str(request.data.get("location") or "")[:300],
            status=request.data.get("status") or "active",
            origin=request.data.get("origin") or "human",
        )
        return Response(_tracking_dict(item), status=201)


class ProjectTrackingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, slug, item_id):
        project = _scoped_project(request, slug)
        return get_object_or_404(TrackingItem, id=item_id, project=project)

    def patch(self, request, slug, item_id):
        item = self._get(request, slug, item_id)
        for f, cap in (("source", 20), ("kind", 200), ("detail", 2000), ("location", 300), ("status", 20), ("origin", 20)):
            if f in request.data:
                setattr(item, f, str(request.data.get(f) or "")[:cap])
        item.save()
        return Response(_tracking_dict(item))

    def delete(self, request, slug, item_id):
        item = self._get(request, slug, item_id)
        item.delete()
        return Response(status=204)
