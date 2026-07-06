"""DRF authentication for scoped API tokens: `Authorization: Token <token>`.

Sets request.user to the token's creator and request.auth to the ApiToken, so
workspace scoping can bind to the token's workspace (see workspaces.resolve_workspace).
"""
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import ApiToken

KEYWORD = 'Token'


class ApiTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = request.headers.get('Authorization', '')
        if not header.startswith(KEYWORD + ' '):
            return None  # let other authenticators (JWT) handle it
        key = header[len(KEYWORD) + 1:].strip()
        if not key:
            return None
        try:
            token = ApiToken.objects.select_related('workspace', 'created_by').get(token=key, revoked=False)
        except ApiToken.DoesNotExist:
            raise AuthenticationFailed('Invalid API token')
        if token.created_by is None:
            raise AuthenticationFailed('API token has no owner')
        ApiToken.objects.filter(pk=token.pk).update(last_used_at=timezone.now())
        return (token.created_by, token)

    def authenticate_header(self, request):
        # Ensures DRF returns 401 (not 403) on auth failure — the SPA relies on
        # 401 to drop back to login.
        return KEYWORD
