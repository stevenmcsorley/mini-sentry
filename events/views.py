from rest_framework import viewsets, mixins, status
from rest_framework.pagination import LimitOffsetPagination
import os
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from django.db.models import F
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from .models import Event, Project, Group, Release, AlertRule, AlertTarget, Session, ReleaseDeployment, Comment
from .serializers import (
    EventSerializer,
    ProjectSerializer,
    GroupSerializer,
    ReleaseSerializer,
    ArtifactSerializer,
    AlertRuleSerializer,
    AlertTargetSerializer,
    SessionSerializer,
    ReleaseDeploymentSerializer,
    CommentSerializer,
)
from django.conf import settings
from .tasks import process_event
from .grouping import compute_fingerprint
from .ratelimit import check_rate_limit
from .kafka import publish_event
from .ch import query_events, query_session_series, query_events_series_by_level, query_top_groups
from .symbolication import symbolicate_frames_for_release


class ProjectViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Project.objects.all().order_by("-id")
    serializer_class = ProjectSerializer


class EventViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Event.objects.all().order_by("-received_at")
    serializer_class = EventSerializer
    class EventPagination(LimitOffsetPagination):
        default_limit = int(os.environ.get("API_PAGE_SIZE", "50"))
        max_limit = int(os.environ.get("API_MAX_PAGE_SIZE", "1000"))
    pagination_class = EventPagination

    def get_queryset(self):
        qs = super().get_queryset()
        project = self.request.query_params.get("project")
        if project:
            qs = qs.filter(project__slug=project)
        level = self.request.query_params.get("level")
        if level:
            qs = qs.filter(level=level)
        env = self.request.query_params.get("environment")
        if env:
            qs = qs.filter(environment=env)
        rel = self.request.query_params.get("release")
        if rel:
            qs = qs.filter(release__version=rel)
        # Optional absolute time range filtering
        from_param = self.request.query_params.get("from")
        to_param = self.request.query_params.get("to")
        if from_param:
            dt = parse_datetime(from_param)
            if dt:
                qs = qs.filter(received_at__gte=dt)
        if to_param:
            dt = parse_datetime(to_param)
            if dt:
                qs = qs.filter(received_at__lte=dt)

        q = self.request.query_params.get("q")
        if q:
            tokens = [t for t in q.split() if t]
            text_terms = []
            for t in tokens:
                if ":" in t:
                    k, v = t.split(":", 1)
                elif " is " in t:
                    k, v = t.split(" is ", 1)
                else:
                    k, v = None, None
                if k:
                    k = k.lower()
                    if k in ("level", "severity"):
                        qs = qs.filter(level=v)
                    elif k in ("env", "environment"):
                        qs = qs.filter(environment=v)
                    elif k == "release":
                        qs = qs.filter(release__version=v)
                    elif k == "message":
                        qs = qs.filter(message__icontains=v)
                else:
                    text_terms.append(t)
            if text_terms:
                from django.db.models import Q
                qobj = Q()
                for term in text_terms:
                    qobj |= Q(message__icontains=term)
                qs = qs.filter(qobj)
        return qs

    def _normalize_level(self, payload: dict) -> str:
        """Derive a normalized level from common fields.
        Priority: payload.level -> payload.severity/severity_text -> payload.extra.level -> payload.extra.severity -> severity_number -> 'error'
        Maps warn/warning to 'warning'; debug/trace -> 'info'; fatal -> 'error'.
        """
        def map_text(v: str | None) -> str | None:
            if not v:
                return None
            t = str(v).strip().lower()
            if t in {"warn", "warning"}:
                return "warning"
            if t in {"err", "error", "fatal"}:
                return "error"
            if t in {"info", "log", "notice", "debug", "trace"}:
                return "info"
            return t

        level = (
            map_text(payload.get("level"))
            or map_text(payload.get("severity"))
            or map_text(payload.get("severity_text"))
            or map_text((payload.get("extra") or {}).get("level"))
            or map_text((payload.get("extra") or {}).get("severity"))
        )
        if not level:
            try:
                sev_num = int(payload.get("severity_number")) if payload.get("severity_number") is not None else None
            except Exception:
                sev_num = None
            if sev_num is not None:
                # OpenTelemetry: 1-4 trace, 5-8 debug, 9-12 info, 13-16 warn, 17-20 error, 21-24 fatal
                if 13 <= sev_num <= 16:
                    level = "warning"
                elif 17 <= sev_num <= 24:
                    level = "error"
                else:
                    level = "info"
        return level or "error"

    @action(detail=False, methods=["post"], url_path="ingest/(?P<project_slug>[^/.]+)")
    def ingest(self, request, project_slug=None):
        project = get_object_or_404(Project, slug=project_slug)
        # Rate limit by project slug
        allowed, remaining = check_rate_limit(f"project:{project.slug}", settings.RATE_LIMIT_EVENTS_PER_MINUTE)
        if not allowed:
            return Response({"detail": "Rate limit exceeded"}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        payload = request.data or {}
        message = payload.get("message", "")
        level = self._normalize_level(payload)
        release = self._get_or_create_release(project, payload)
        env = payload.get("environment", "production")
        stack = payload.get("stack")
        frames = payload.get("frames")
        group = self._get_or_create_group(project, message, level)
        event = Event.objects.create(
            project=project,
            group=group,
            message=message,
            level=level,
            payload=payload,
            release=release,
            environment=env,
            stack=stack,
            tags=payload.get("tags", []),
        )
        # Inline symbolication (best-effort)
        try:
            if release and (frames or stack):
                sym = symbolicate_frames_for_release(release, frames, stack)
                event.symbolicated = {"frames": sym}
                event.save(update_fields=["symbolicated"])
        except Exception as e:
            print(f"Kafka publish error: {e}")
            import traceback
            traceback.print_exc()
        # Kick off async processing (stub)
        try:
            process_event.delay(event.id)
        except Exception:
            # If Celery broker is not ready, we still ingest synchronously
            from .alerts import evaluate_alerts_for_event
            try:
                evaluate_alerts_for_event(event)
            except Exception:
                pass
        # Publish to Kafka for ClickHouse pipeline
        try:
            publish_event(
                {
                    "id": event.id,
                    "event_id": event.id,
                    "project": project.slug,
                    "message": message,
                    "level": level,
                    "environment": env,
                    "fingerprint": group.fingerprint if group else None,
                    "title": group.title if group else None,
                    "received_at": event.received_at.isoformat(),
                }
            )
        except Exception as e:
            print(f"Kafka publish error: {e}")
            import traceback
            traceback.print_exc()
        
        # Publish to WebSocket channels for real-time updates
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            import time
            
            channel_layer = get_channel_layer()
            print(f"📡 [WebSocket] Channel layer available: {channel_layer is not None}")
            
            if channel_layer:
                event_data = {
                    "type": "new_event",
                    "event_id": event.id,
                    "project": project.slug,
                    "message": message,
                    "level": level,
                    "environment": env,
                    "fingerprint": group.fingerprint if group else None,
                    "timestamp": int(time.time() * 1000),
                }
                print(f"📡 [WebSocket] Publishing event to group 'events_{project.slug}': {event_data}")
                
                async_to_sync(channel_layer.group_send)(
                    f"events_{project.slug}",
                    event_data
                )
                print(f"✅ [WebSocket] Event published successfully")
            else:
                print("❌ [WebSocket] No channel layer available")
        except Exception as e:
            print(f"❌ [WebSocket] Publish error: {e}")
            import traceback
            traceback.print_exc()
        return Response(EventSerializer(event).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="clickhouse")
    def clickhouse_events(self, request):
        project_slug = request.query_params.get("project")
        limit = int(request.query_params.get("limit", "100"))
        if not project_slug:
            return Response({"detail": "project required"}, status=400)
        try:
            rows = query_events(project_slug, limit)
        except Exception as e:
            return Response({"detail": f"clickhouse error: {e}"}, status=500)
        # Return as plain list
        data = [
            {
                "id": r[0],
                "project": r[1],
                "level": r[2],
                "fingerprint": r[3],
                "title": r[4],
                "message": r[5],
                "received_at": str(r[6]),
            }
            for r in rows
        ]
        return Response(data)

    @action(detail=False, methods=["post"], url_path="ingest/token/(?P<token>[^/.]+)")
    def ingest_with_token(self, request, token=None):
        project = get_object_or_404(Project, ingest_token=token)
        # Rate limit by token
        allowed, remaining = check_rate_limit(f"token:{project.ingest_token}", settings.RATE_LIMIT_EVENTS_PER_MINUTE)
        if not allowed:
            return Response({"detail": "Rate limit exceeded"}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        payload = request.data or {}
        message = payload.get("message", "")
        level = self._normalize_level(payload)
        release = self._get_or_create_release(project, payload)
        env = payload.get("environment", "production")
        stack = payload.get("stack")
        frames = payload.get("frames")
        group = self._get_or_create_group(project, message, level)
        event = Event.objects.create(
            project=project,
            group=group,
            message=message,
            level=level,
            payload=payload,
            release=release,
            environment=env,
            stack=stack,
            tags=payload.get("tags", []),
        )
        try:
            if release and (frames or stack):
                sym = symbolicate_frames_for_release(release, frames, stack)
                event.symbolicated = {"frames": sym}
                event.save(update_fields=["symbolicated"])
        except Exception as e:
            print(f"Kafka publish error: {e}")
            import traceback
            traceback.print_exc()
        try:
            process_event.delay(event.id)
        except Exception:
            from .alerts import evaluate_alerts_for_event
            try:
                evaluate_alerts_for_event(event)
            except Exception:
                pass
        try:
            publish_event(
                {
                    "id": event.id,
                    "event_id": event.id,
                    "project": project.slug,
                    "message": message,
                    "level": level,
                    "environment": env,
                    "fingerprint": group.fingerprint if group else None,
                    "title": group.title if group else None,
                    "received_at": event.received_at.isoformat(),
                }
            )
        except Exception as e:
            print(f"Kafka publish error: {e}")
            import traceback
            traceback.print_exc()
        
        # Publish to WebSocket channels for real-time updates
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            import time
            
            channel_layer = get_channel_layer()
            print(f"📡 [WebSocket] Channel layer available: {channel_layer is not None}")
            
            if channel_layer:
                event_data = {
                    "type": "new_event",
                    "event_id": event.id,
                    "project": project.slug,
                    "message": message,
                    "level": level,
                    "environment": env,
                    "fingerprint": group.fingerprint if group else None,
                    "timestamp": int(time.time() * 1000),
                }
                print(f"📡 [WebSocket] Publishing event to group 'events_{project.slug}': {event_data}")
                
                async_to_sync(channel_layer.group_send)(
                    f"events_{project.slug}",
                    event_data
                )
                print(f"✅ [WebSocket] Event published successfully")
            else:
                print("❌ [WebSocket] No channel layer available")
        except Exception as e:
            print(f"❌ [WebSocket] Publish error: {e}")
            import traceback
            traceback.print_exc()
        return Response(EventSerializer(event).data, status=status.HTTP_201_CREATED)

    def _get_or_create_release(self, project: Project, payload: dict):
        version = (payload or {}).get("release")
        environment = (payload or {}).get("environment", "production")
        if not version:
            return None
        rel, _ = Release.objects.get_or_create(
            project=project,
            version=version,
            environment=environment,
        )
        return rel

    def _get_or_create_group(self, project: Project, message: str, level: str) -> Group:
        fingerprint, title = compute_fingerprint(message, level)
        now = timezone.now()
        group, created = Group.objects.get_or_create(
            project=project, fingerprint=fingerprint,
            defaults={"title": title, "level": level, "first_seen": now, "last_seen": now, "count": 1},
        )
        if not created:
            # Check if group was resolved - if so, reopen it (Sentry regression logic)
            updates = {
                "last_seen": now,
                "level": level,
                "count": F("count") + 1,
            }
            
            # Handle status transitions for new events (Sentry-style logic)
            if group.status == Group.STATUS_RESOLVED:
                # Resolved issues reopen on new events (regression)
                updates["status"] = Group.STATUS_UNRESOLVED
                updates["resolved_at"] = None
            # Note: Ignored issues stay ignored (they're meant to be muted)
                
            Group.objects.filter(id=group.id).update(**updates)
            group.refresh_from_db(fields=["count", "last_seen", "level", "status", "resolved_at"])
        return group


class GroupViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = GroupSerializer
    queryset = Group.objects.all().order_by("-last_seen")

    def get_queryset(self):
        qs = super().get_queryset()
        project = self.request.query_params.get("project")
        if project:
            qs = qs.filter(project__slug=project)
        # Optional absolute time range filter on last_seen
        from django.utils.dateparse import parse_datetime as _parse_dt
        from_param = self.request.query_params.get("from")
        to_param = self.request.query_params.get("to")
        if from_param:
            dt = _parse_dt(from_param)
            if dt:
                qs = qs.filter(last_seen__gte=dt)
        if to_param:
            dt = _parse_dt(to_param)
            if dt:
                qs = qs.filter(last_seen__lte=dt)
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        q = self.request.query_params.get("q")
        if q:
            tokens = [t for t in q.split() if t]
            text_terms = []
            for t in tokens:
                if ":" in t:
                    k, v = t.split(":", 1)
                elif " is " in t:
                    k, v = t.split(" is ", 1)
                else:
                    k, v = None, None
                if k:
                    k = k.lower()
                    if k == "status":
                        qs = qs.filter(status=v)
                    elif k == "assignee":
                        qs = qs.filter(assignee__iexact=v)
                    elif k == "title":
                        qs = qs.filter(title__icontains=v)
                else:
                    text_terms.append(t)
            if text_terms:
                from django.db.models import Q
                qobj = Q()
                for term in text_terms:
                    qobj |= Q(title__icontains=term)
                qs = qs.filter(qobj)
        return qs

    @action(detail=True, methods=["post"])  # /groups/{id}/resolve/
    def resolve(self, request, pk=None):
        g = self.get_object()
        g.status = Group.STATUS_RESOLVED
        g.resolved_at = timezone.now()
        g.save(update_fields=["status", "resolved_at"])
        return Response(GroupSerializer(g).data)

    @action(detail=True, methods=["post"])  # /groups/{id}/unresolve/
    def unresolve(self, request, pk=None):
        g = self.get_object()
        g.status = Group.STATUS_UNRESOLVED
        g.resolved_at = None
        g.save(update_fields=["status", "resolved_at"])
        return Response(GroupSerializer(g).data)

    @action(detail=True, methods=["post"])  # /groups/{id}/ignore/
    def ignore(self, request, pk=None):
        g = self.get_object()
        g.status = Group.STATUS_IGNORED
        g.save(update_fields=["status"])
        return Response(GroupSerializer(g).data)

    @action(detail=True, methods=["post"])  # /groups/{id}/assign/
    def assign(self, request, pk=None):
        g = self.get_object()
        assignee = request.data.get("assignee", "")
        g.assignee = assignee
        g.save(update_fields=["assignee"])
        return Response(GroupSerializer(g).data)

    @action(detail=True, methods=["post"])  # /groups/{id}/bookmark/
    def bookmark(self, request, pk=None):
        g = self.get_object()
        g.is_bookmarked = True
        g.save(update_fields=["is_bookmarked"])
        return Response({"ok": True})

    @action(detail=True, methods=["post"], url_path="unbookmark")
    def unbookmark(self, request, pk=None):
        g = self.get_object()
        g.is_bookmarked = False
        g.save(update_fields=["is_bookmarked"])
        return Response({"ok": True})

    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments(self, request, pk=None):
        g = self.get_object()
        if request.method == "GET":
            return Response(CommentSerializer(g.comments.all().order_by("-created_at"), many=True).data)
        data = request.data or {}
        data["group"] = g.id
        ser = CommentSerializer(data=data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=201)


class ReleaseViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ReleaseSerializer
    queryset = Release.objects.all().order_by("-created_at")

    def get_queryset(self):
        qs = super().get_queryset()
        project = self.request.query_params.get("project")
        if project:
            qs = qs.filter(project__slug=project)
        return qs

    @action(detail=True, methods=["get", "post"], url_path="artifacts")
    def artifacts(self, request, pk=None):
        release = self.get_object()
        if request.method == "GET":
            artifacts = release.artifacts.all().order_by("-created_at")
            return Response(ArtifactSerializer(artifacts, many=True).data)
        # POST create artifact (expects JSON body with name, content, content_type)
        data = request.data or {}
        payload = {
            "release": release.id,
            "name": data.get("name", "artifact.json"),
            "content": data.get("content", "{}"),
            "content_type": data.get("content_type", "application/json"),
        }
        # Derive file_name/checksum if possible
        import hashlib, json as _json
        try:
            payload["checksum"] = hashlib.sha256(payload["content"].encode("utf-8")).hexdigest()
        except Exception as e:
            print(f"Kafka publish error: {e}")
            import traceback
            traceback.print_exc()
        try:
            obj = _json.loads(payload["content"]) if isinstance(payload["content"], str) else None
            if isinstance(obj, dict):
                if obj.get("file"):
                    payload["file_name"] = str(obj.get("file"))
        except Exception as e:
            print(f"Kafka publish error: {e}")
            import traceback
            traceback.print_exc()
        serializer = ArtifactSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)


class SymbolicateView(APIView):
    def post(self, request):
        data = request.data or {}
        project_slug = data.get("project")
        version = data.get("release")
        environment = data.get("environment", "production")
        frames = data.get("frames")
        stack = data.get("stack")
        project = get_object_or_404(Project, slug=project_slug)
        release = get_object_or_404(Release, project=project, version=version, environment=environment)
        out = symbolicate_frames_for_release(release, frames, stack)
        return Response({"frames": out})


class AlertRuleViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = AlertRuleSerializer
    queryset = AlertRule.objects.all().order_by("-id")

    def get_queryset(self):
        qs = super().get_queryset()
        project = self.request.query_params.get("project")
        if project:
            qs = qs.filter(project__slug=project)
        return qs

    @action(detail=True, methods=["post"], url_path="snooze")
    def snooze(self, request, pk=None):
        from django.utils import timezone
        rule = self.get_object()
        group_id = request.data.get("group")
        minutes = int(request.data.get("minutes", 60))
        if not group_id:
            return Response({"detail": "group required"}, status=400)
        group = get_object_or_404(Group, id=group_id, project=rule.project)
        until = timezone.now() + timezone.timedelta(minutes=minutes)
        from .models import AlertState
        AlertState.objects.update_or_create(rule=rule, group=group, defaults={"suppress_until": until})
        return Response({"ok": True, "suppress_until": until.isoformat()})

    @action(detail=True, methods=["post"], url_path="unsnooze")
    def unsnooze(self, request, pk=None):
        rule = self.get_object()
        group_id = request.data.get("group")
        if not group_id:
            return Response({"detail": "group required"}, status=400)
        group = get_object_or_404(Group, id=group_id, project=rule.project)
        from .models import AlertState
        AlertState.objects.filter(rule=rule, group=group).update(suppress_until=None)
        return Response({"ok": True})

    @action(detail=True, methods=["get", "post"], url_path="targets")
    def targets(self, request, pk=None):
        rule = self.get_object()
        if request.method == "GET":
            return Response(AlertTargetSerializer(rule.targets.all(), many=True).data)
        # POST create target
        data = request.data or {}
        data["rule"] = rule.id
        ser = AlertTargetSerializer(data=data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=201)

    @action(detail=False, methods=["get"], url_path="by-group/(?P<group_id>[^/.]+)")
    def by_group(self, request, group_id=None):
        group = get_object_or_404(Group, id=group_id)
        rules = AlertRule.objects.filter(project=group.project).order_by("-id")
        return Response(AlertRuleSerializer(rules, many=True).data)


class SessionIngestView(APIView):
    def post(self, request, token: str):
        project = get_object_or_404(Project, ingest_token=token)
        payload = request.data or {}
        version = payload.get("release")
        environment = payload.get("environment", "production")
        sess_id = payload.get("session_id")
        status = payload.get("status", "init")
        duration_ms = int(payload.get("duration_ms", 0) or 0)
        user = payload.get("user", "")
        if not sess_id:
            return Response({"detail": "session_id required"}, status=400)
        release = None
        if version:
            release, _ = Release.objects.get_or_create(project=project, version=version, environment=environment)
        obj, created = Session.objects.get_or_create(
            project=project, session_id=sess_id,
            defaults={
                "release": release,
                "environment": environment,
                "status": status,
                "duration_ms": duration_ms,
                "user": user,
            }
        )
        if not created:
            obj.release = release or obj.release
            obj.environment = environment
            obj.status = status
            obj.duration_ms = duration_ms or obj.duration_ms
            obj.user = user or obj.user
            obj.updated_at = timezone.now()
            obj.save()
        # Publish to Kafka for ClickHouse rollups
        try:
            from .kafka import publish_session
            publish_session({
                "project": project.slug,
                "release": version or "",
                "environment": environment,
                "status": status,
                "session_id": sess_id,
                "user": user,
                "duration_ms": duration_ms,
                "started_at": (obj.started_at or timezone.now()).isoformat(),
            })
        except Exception as e:
            print(f"Kafka publish error: {e}")
            import traceback
            traceback.print_exc()
        return Response(SessionSerializer(obj).data, status=201 if created else 200)


class ReleaseHealthView(APIView):
    def get(self, request):
        from django.db.models import Count, Q
        project_slug = request.query_params.get("project")
        if not project_slug:
            return Response({"detail": "project required"}, status=400)
        project = get_object_or_404(Project, slug=project_slug)
        qs = Session.objects.filter(project=project)
        agg = (
            qs.values("release__version", "environment")
            .annotate(total=Count("id"), crashed=Count("id", filter=Q(status="crashed")))
            .order_by("-total")
        )
        out = []
        for row in agg:
            total = row["total"] or 0
            crashed = row["crashed"] or 0
            crash_free = 100.0 if total == 0 else round(100.0 * (total - crashed) / total, 2)
            out.append(
                {
                    "version": row["release__version"],
                    "environment": row["environment"],
                    "total_sessions": total,
                    "crashed_sessions": crashed,
                    "crash_free_rate": crash_free,
                }
            )
        return Response(out)


class ReleaseHealthSeriesView(APIView):
    def get(self, request):
        from django.db import connection
        project_slug = request.query_params.get("project")
        if not project_slug:
            return Response({"detail": "project required"}, status=400)
        project = get_object_or_404(Project, slug=project_slug)
        env = request.query_params.get("environment")
        version = request.query_params.get("version")
        rng = request.query_params.get("range", "24h")  # e.g., 1h, 24h, 7d
        interval = request.query_params.get("interval", "5m")  # 1m,5m,1h
        backend = request.query_params.get("backend", "pg")

        def parse_range(s: str):
            if s.endswith('h'):
                return int(s[:-1]) * 60
            if s.endswith('d'):
                return int(s[:-1]) * 60 * 24
            if s.endswith('m'):
                return int(s[:-1])
            return 60

        def parse_bucket(s: str):
            if s.endswith('h'):
                return ('hour', int(s[:-1]))
            if s.endswith('m'):
                return ('minute', int(s[:-1]))
            if s.endswith('d'):
                return ('day', int(s[:-1]))
            return ('minute', 5)

        minutes = parse_range(rng)
        unit, step = parse_bucket(interval)

        if backend == 'ch':
            try:
                rows = query_session_series(project.slug, minutes=minutes, bucket=interval)
                out = [
                    {"bucket": str(r[0]), "total": int(r[1]), "crashed": int(r[2])}
                    for r in rows
                ]
                return Response(out)
            except Exception as e:
                return Response({"detail": f"clickhouse error: {e}"}, status=500)

        where = ["project_id = %s", "started_at >= NOW() - INTERVAL '%s minutes'"]
        params = [project.id, minutes]
        if env:
            where.append("environment = %s")
            params.append(env)
        if version:
            where.append("(SELECT version FROM events_release WHERE id = release_id) = %s")
            params.append(version)

        # Build date_trunc unit
        trunc_unit = 'minute' if unit == 'minute' else ('hour' if unit == 'hour' else 'day')
        sql = f"""
            SELECT date_trunc('{trunc_unit}', started_at) AS bucket,
                   COUNT(*) AS total,
                   SUM(CASE WHEN status = 'crashed' THEN 1 ELSE 0 END) AS crashed
            FROM events_session
            WHERE {' AND '.join(where)}
            GROUP BY 1
            ORDER BY 1
        """
        with connection.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        out = [
            {"bucket": r[0].isoformat(), "total": int(r[1]), "crashed": int(r[2])}
            for r in rows
        ]
        return Response(out)


class DeploymentViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ReleaseDeploymentSerializer
    queryset = ReleaseDeployment.objects.all().order_by("-date_started")

    def get_queryset(self):
        qs = super().get_queryset()
        project = self.request.query_params.get("project")
        if project:
            qs = qs.filter(project__slug=project)
        return qs


class EventSeriesView(APIView):
    def get(self, request):
        project_slug = request.query_params.get("project")
        if not project_slug:
            return Response({"detail": "project required"}, status=400)
        rng = request.query_params.get("range", "1h")
        interval = request.query_params.get("interval", "5m")
        backend = request.query_params.get("backend", "ch")
        from_param = request.query_params.get("from")
        to_param = request.query_params.get("to")
        env_param = request.query_params.get("env")

        def parse_range(s: str):
            if s.endswith('h'):
                return int(s[:-1]) * 60
            if s.endswith('d'):
                return int(s[:-1]) * 60 * 24
            if s.endswith('m'):
                return int(s[:-1])
            return 60

        minutes = parse_range(rng)
        if backend == 'ch':
            try:
                if from_param and to_param:
                    rows = query_events_series_by_level(project_slug, bucket=interval, from_iso=from_param, to_iso=to_param, environment=env_param)
                else:
                    rows = query_events_series_by_level(project_slug, minutes=minutes, bucket=interval, environment=env_param)
                return Response(rows)
            except Exception as e:
                return Response({"detail": f"clickhouse error: {e}"}, status=500)
        # PG fallback: aggregate by date_trunc
        from django.db.models.functions import TruncMinute, TruncHour
        from django.db.models import Count
        trunc = TruncHour('received_at') if interval == '1h' else TruncMinute('received_at')
        qs = Event.objects.filter(project__slug=project_slug)
        if env_param:
            qs = qs.filter(environment=env_param)
        if from_param:
            from django.utils.dateparse import parse_datetime
            dt = parse_datetime(from_param)
            if dt:
                qs = qs.filter(received_at__gte=dt)
        if to_param:
            from django.utils.dateparse import parse_datetime
            dt = parse_datetime(to_param)
            if dt:
                qs = qs.filter(received_at__lte=dt)
        if not from_param and not to_param:
            qs = qs.filter(received_at__gte=timezone.now()-timezone.timedelta(minutes=minutes))
        agg = qs.annotate(bucket=trunc).values('bucket', 'level').annotate(c=Count('id')).order_by('bucket')
        out = {}
        for row in agg:
            key = row['bucket'].isoformat()
            if key not in out:
                out[key] = {"bucket": key, "error": 0, "warning": 0, "info": 0}
            out[key][row['level']] = row['c']
        return Response(list(out.values()))


class TopGroupsView(APIView):
    def get(self, request):
        project_slug = request.query_params.get("project")
        if not project_slug:
            return Response({"detail": "project required"}, status=400)
        rng = request.query_params.get("range", "24h")
        limit = int(request.query_params.get("limit", "10"))
        backend = request.query_params.get("backend", "ch")
        from_param = request.query_params.get("from")
        to_param = request.query_params.get("to")

        def parse_range(s: str):
            if s.endswith('h'):
                return int(s[:-1]) * 60
            if s.endswith('d'):
                return int(s[:-1]) * 60 * 24
            if s.endswith('m'):
                return int(s[:-1])
            return 60

        minutes = parse_range(rng)
        if backend == 'ch':
            try:
                if from_param and to_param:
                    rows = query_top_groups(project_slug, limit=limit, from_iso=from_param, to_iso=to_param)
                else:
                    rows = query_top_groups(project_slug, minutes=minutes, limit=limit)
                data = [{"fingerprint": r[0], "title": r[1], "count": int(r[2])} for r in rows]
                return Response(data)
            except Exception as e:
                return Response({"detail": f"clickhouse error: {e}"}, status=500)
        # PG fallback
        from django.db.models import Count
        qs = Event.objects.filter(project__slug=project_slug)
        if from_param:
            from django.utils.dateparse import parse_datetime
            dt = parse_datetime(from_param)
            if dt:
                qs = qs.filter(received_at__gte=dt)
        if to_param:
            from django.utils.dateparse import parse_datetime
            dt = parse_datetime(to_param)
            if dt:
                qs = qs.filter(received_at__lte=dt)
        if not from_param and not to_param:
            qs = qs.filter(received_at__gte=timezone.now()-timezone.timedelta(minutes=minutes))
        agg = qs.values('group__fingerprint', 'group__title').annotate(c=Count('id')).order_by('-c')[:limit]
        data = [{"fingerprint": r['group__fingerprint'], "title": r['group__title'], "count": r['c']} for r in agg]
        return Response(data)


# SSE implementation removed - replaced with WebSocket + Redis for better reliability
