"""Workspace scoping helpers — resolve the caller's current workspace and
restrict querysets so users only ever see their own workspace's data.
"""
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied

from .models import Workspace, WorkspaceMember, Project, ApiToken


def user_workspace_ids(user):
    if not getattr(user, "is_authenticated", False):
        return []
    return list(
        WorkspaceMember.objects.filter(user=user).values_list("workspace_id", flat=True)
    )


def resolve_workspace(request):
    """Current workspace from the X-Workspace-Id header (validated against
    membership) or the user's first workspace. None if the user has none.
    API tokens are bound to one workspace and always resolve to it."""
    token = getattr(request, "auth", None)
    if isinstance(token, ApiToken):
        return token.workspace
    ids = user_workspace_ids(getattr(request, "user", None))
    if not ids:
        return None
    header = request.headers.get("X-Workspace-Id")
    if header:
        try:
            wid = int(header)
        except (TypeError, ValueError):
            raise PermissionDenied("Invalid workspace id")
        if wid not in ids:
            raise PermissionDenied("Not a member of that workspace")
        return Workspace.objects.filter(id=wid).first()
    return Workspace.objects.filter(id=ids[0]).first()


def scope_queryset(qs, request, path="project__workspace"):
    """Restrict a queryset to the caller's current workspace (empty if none)."""
    ws = resolve_workspace(request)
    if ws is None:
        return qs.none()
    return qs.filter(**{path: ws})


def get_scoped_project(request, slug):
    """Fetch a project by slug, but only within the caller's current workspace."""
    ws = resolve_workspace(request)
    if ws is None:
        raise Http404
    return get_object_or_404(Project, slug=slug, workspace=ws)
