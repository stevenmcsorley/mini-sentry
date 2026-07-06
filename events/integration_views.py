"""Manage issue-tracker integrations and create external issues from a group."""
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Integration, IssueLink, Group
from .integrations import get_adapter, ADAPTERS
from .workspaces import resolve_workspace


def _redacted(integration):
    cfg = dict(integration.config or {})
    if cfg.get("token"):
        cfg["token"] = "••••" + str(cfg["token"])[-4:]
    return {
        "id": integration.id,
        "provider": integration.provider,
        "config": cfg,
        "created_at": integration.created_at,
    }


def _scoped_group(request, group_id):
    ws = resolve_workspace(request)
    if not ws:
        raise Http404
    return get_object_or_404(Group, id=group_id, project__workspace=ws)


class IntegrationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ws = resolve_workspace(request)
        items = Integration.objects.filter(workspace=ws).order_by("provider") if ws else []
        return Response({
            "integrations": [_redacted(i) for i in items],
            "available": {k: a.config_fields() for k, a in ADAPTERS.items()},
        })

    def post(self, request):
        ws = resolve_workspace(request)
        if not ws:
            return Response({"detail": "No workspace"}, status=400)
        provider = request.data.get("provider")
        if provider not in ADAPTERS:
            return Response({"detail": "Unknown provider"}, status=400)
        config = request.data.get("config") or {}
        missing = [f for f in ADAPTERS[provider].config_fields() if not config.get(f)]
        if missing:
            return Response({"detail": f"Missing config: {', '.join(missing)}"}, status=400)
        integration, _ = Integration.objects.update_or_create(
            workspace=ws, provider=provider, defaults={"config": config}
        )
        return Response(_redacted(integration), status=201)


class IntegrationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, provider):
        ws = resolve_workspace(request)
        Integration.objects.filter(workspace=ws, provider=provider).delete()
        return Response(status=204)


class GroupCreateIssueView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        group = _scoped_group(request, group_id)
        provider = request.data.get("provider")
        if provider not in ADAPTERS:
            return Response({"detail": "Unknown provider"}, status=400)
        ws = resolve_workspace(request)
        integration = Integration.objects.filter(workspace=ws, provider=provider).first()
        if not integration:
            return Response({"detail": f"No {provider} integration configured"}, status=400)
        # TLS terminates at the Cloudflare tunnel, so build_absolute_uri sees http.
        skylark_url = request.build_absolute_uri("/").rstrip("/").replace("http://", "https://")
        try:
            result = get_adapter(provider).create_issue(group, integration.config, skylark_url)
        except Exception as e:  # noqa: BLE001 - surface any adapter/HTTP error
            # 400 (not 502): Cloudflare replaces any 502 from origin with its own
            # error page, masking the JSON detail the caller needs to see.
            detail = f"{provider} error: {e}"
            resp = getattr(e, "response", None)
            if resp is not None:
                detail = f"{provider} error {resp.status_code}: {resp.text[:400]}"
            return Response({"detail": detail}, status=400)
        link = IssueLink.objects.create(
            group=group,
            provider=provider,
            url=result["url"],
            external_id=result.get("external_id", ""),
            external_key=result.get("external_key", ""),
        )
        return Response(
            {"id": link.id, "provider": provider, "url": link.url, "external_key": link.external_key},
            status=201,
        )


class GroupLinksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = _scoped_group(request, group_id)
        return Response([
            {
                "id": l.id,
                "provider": l.provider,
                "url": l.url,
                "external_key": l.external_key,
                "created_at": l.created_at,
            }
            for l in group.issue_links.order_by("-id")
        ])
