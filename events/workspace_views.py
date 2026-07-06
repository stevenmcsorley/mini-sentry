"""Workspace management API: list/create, current (rename/delete), members
(roles), and invites (create/inspect/accept). Mirrors Ossicone's model.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Workspace, WorkspaceMember, WorkspaceInvite
from .workspaces import resolve_workspace
from .auth_views import tokens_for, user_payload

User = get_user_model()
INVITE_TTL_DAYS = 14


def _membership(workspace_id, user):
    return WorkspaceMember.objects.filter(workspace_id=workspace_id, user=user).first()


def _require_manager(request, workspace):
    m = _membership(workspace.id, request.user)
    if not m or m.role not in ("owner", "admin"):
        raise PermissionDenied("Workspace admin access required")
    return m


def _ws_payload(ws, role=None):
    return {"id": ws.id, "name": ws.name, "role": role, "created_at": ws.created_at}


def _find_user_by_email(email):
    return (
        User.objects.filter(username__iexact=email).first()
        or User.objects.filter(email__iexact=email).first()
    )


class WorkspacesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        members = (
            WorkspaceMember.objects.filter(user=request.user)
            .select_related("workspace").order_by("id")
        )
        return Response([_ws_payload(m.workspace, m.role) for m in members])

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        if len(name) < 2:
            return Response({"detail": "Name must be at least 2 characters"}, status=400)
        if WorkspaceMember.objects.filter(user=request.user, role="owner").exists():
            return Response(
                {"detail": "Each account can own one workspace. Use a different email to create another."},
                status=400,
            )
        ws = Workspace.objects.create(name=name)
        WorkspaceMember.objects.create(workspace=ws, user=request.user, role="owner")
        return Response(_ws_payload(ws, "owner"), status=201)


class CurrentWorkspaceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ws = resolve_workspace(request)
        if not ws:
            return Response({"detail": "No workspace"}, status=404)
        m = _membership(ws.id, request.user)
        return Response(_ws_payload(ws, m.role if m else None))

    def patch(self, request):
        ws = resolve_workspace(request)
        if not ws:
            return Response({"detail": "No workspace"}, status=404)
        _require_manager(request, ws)
        name = (request.data.get("name") or "").strip()
        if name:
            ws.name = name
            ws.save(update_fields=["name"])
        m = _membership(ws.id, request.user)
        return Response(_ws_payload(ws, m.role if m else None))

    def delete(self, request):
        ws = resolve_workspace(request)
        if not ws:
            return Response(status=204)
        m = _membership(ws.id, request.user)
        if not m or m.role != "owner":
            raise PermissionDenied("Only an owner can delete a workspace")
        ws.delete()  # cascades projects -> events
        return Response(status=204)


class MembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ws = resolve_workspace(request)
        if not ws:
            return Response([])
        members = (
            WorkspaceMember.objects.filter(workspace=ws).select_related("user").order_by("id")
        )
        return Response([
            {
                "id": m.id,
                "role": m.role,
                "user": {
                    "id": m.user.id,
                    "email": m.user.email or m.user.username,
                    "name": (m.user.get_full_name() or "").strip() or m.user.username,
                },
                "joined_at": m.created_at,
            }
            for m in members
        ])


class MemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, member_id):
        ws = resolve_workspace(request)
        _require_manager(request, ws)
        m = get_object_or_404(WorkspaceMember, id=member_id, workspace=ws)
        role = request.data.get("role")
        if role not in ("owner", "admin", "member"):
            return Response({"detail": "Invalid role"}, status=400)
        if m.role == "owner" and role != "owner":
            owners = WorkspaceMember.objects.filter(workspace=ws, role="owner").count()
            if owners <= 1:
                return Response({"detail": "A workspace needs at least one owner"}, status=400)
        m.role = role
        m.save(update_fields=["role"])
        return Response({"id": m.id, "role": m.role})

    def delete(self, request, member_id):
        ws = resolve_workspace(request)
        _require_manager(request, ws)
        m = get_object_or_404(WorkspaceMember, id=member_id, workspace=ws)
        if m.user_id == request.user.id:
            return Response({"detail": "You cannot remove yourself"}, status=400)
        if m.role == "owner":
            return Response({"detail": "Owners cannot be removed — change their role first"}, status=403)
        m.delete()
        return Response(status=204)


class InvitesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ws = resolve_workspace(request)
        _require_manager(request, ws)
        invites = WorkspaceInvite.objects.filter(workspace=ws, accepted_at__isnull=True).order_by("-id")
        return Response([
            {
                "id": i.id, "email": i.email, "role": i.role, "token": i.token,
                "expires_at": i.expires_at, "created_at": i.created_at,
            }
            for i in invites
        ])

    def post(self, request):
        ws = resolve_workspace(request)
        _require_manager(request, ws)
        email = (request.data.get("email") or "").strip().lower()
        role = request.data.get("role", "member")
        if not email:
            return Response({"detail": "Email required"}, status=400)
        if role not in ("admin", "member"):
            return Response({"detail": "Invite as admin or member"}, status=400)
        existing = _find_user_by_email(email)
        if existing and _membership(ws.id, existing):
            return Response({"detail": "That person is already a member"}, status=400)
        inv = WorkspaceInvite.objects.create(
            workspace=ws, email=email, role=role, invited_by=request.user,
            expires_at=timezone.now() + timedelta(days=INVITE_TTL_DAYS),
        )
        return Response(
            {"id": inv.id, "email": inv.email, "role": inv.role, "token": inv.token, "expires_at": inv.expires_at},
            status=201,
        )


class InviteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, invite_id):
        ws = resolve_workspace(request)
        _require_manager(request, ws)
        inv = get_object_or_404(WorkspaceInvite, id=invite_id, workspace=ws)
        inv.delete()
        return Response(status=204)


class InviteInspectView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        inv = get_object_or_404(WorkspaceInvite, token=token)
        return Response({
            "workspace_name": inv.workspace.name,
            "email": inv.email,
            "role": inv.role,
            "account_exists": _find_user_by_email(inv.email) is not None,
            "accepted": bool(inv.accepted_at),
            "expired": bool(inv.expires_at and inv.expires_at < timezone.now()),
        })


class InviteAcceptView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, token):
        inv = get_object_or_404(WorkspaceInvite, token=token)
        if inv.accepted_at:
            return Response({"detail": "Invite already used"}, status=400)
        if inv.expires_at and inv.expires_at < timezone.now():
            return Response({"detail": "Invite has expired"}, status=400)
        from django.contrib.auth import authenticate

        user = _find_user_by_email(inv.email)
        if user:
            # Existing account: verify the password before joining + issuing a
            # session, so the invite link alone can't impersonate the account.
            authed = authenticate(username=user.username, password=request.data.get("password") or "")
            if not authed:
                return Response({"detail": "Enter your account password to accept this invite"}, status=401)
            user = authed
        else:
            name = (request.data.get("name") or "").strip()
            password = request.data.get("password") or ""
            if not name or len(password) < 6:
                return Response({"detail": "Name and a 6+ character password are required"}, status=400)
            user = User.objects.create_user(
                username=inv.email.lower(), email=inv.email.lower(), password=password
            )
            user.first_name = name[:150]
            user.save(update_fields=["first_name"])
        WorkspaceMember.objects.get_or_create(
            workspace=inv.workspace, user=user, defaults={"role": inv.role}
        )
        inv.accepted_at = timezone.now()
        inv.save(update_fields=["accepted_at"])
        return Response({**tokens_for(user), "user": user_payload(user)})
