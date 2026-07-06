"""Manage scoped API tokens for the current workspace (create/list/revoke)."""
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ApiToken
from .workspaces import resolve_workspace


class ApiTokensView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ws = resolve_workspace(request)
        if not ws:
            return Response([])
        tokens = ApiToken.objects.filter(workspace=ws, revoked=False).order_by('-id')
        return Response([
            {
                'id': t.id,
                'name': t.name,
                'token_preview': (t.token[:6] + '…') if t.token else None,
                'last_used_at': t.last_used_at,
                'created_at': t.created_at,
            }
            for t in tokens
        ])

    def post(self, request):
        ws = resolve_workspace(request)
        if not ws:
            return Response({'detail': 'No workspace'}, status=400)
        name = (request.data.get('name') or '').strip() or 'API token'
        token = ApiToken.objects.create(workspace=ws, name=name, created_by=request.user)
        # Return the raw token value ONCE — it is not retrievable later.
        return Response(
            {'id': token.id, 'name': token.name, 'token': token.token, 'created_at': token.created_at},
            status=201,
        )


class ApiTokenDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, token_id):
        ws = resolve_workspace(request)
        token = get_object_or_404(ApiToken, id=token_id, workspace=ws)
        token.revoked = True
        token.save(update_fields=['revoked'])
        return Response(status=204)
