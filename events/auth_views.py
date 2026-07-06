"""Simple JWT auth (register / login / me) — mirrors Ossicone's auth model.

Uses Django's built-in User with the email as the username, so login is by
email. Self-service registration is gated by OPEN_SIGNUP (off by default).
"""
import os

from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Workspace, WorkspaceMember

User = get_user_model()


def open_signup() -> bool:
    return os.environ.get("OPEN_SIGNUP", "false").lower() in ("1", "true", "yes")


def user_payload(user) -> dict:
    return {
        "id": user.id,
        "email": user.email or user.username,
        "name": (user.get_full_name() or "").strip() or user.username,
    }


def tokens_for(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=150)
    password = serializers.CharField(min_length=6, write_only=True)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not open_signup():
            return Response(
                {"detail": "Sign-up is disabled on this instance"},
                status=status.HTTP_403_FORBIDDEN,
            )
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"].lower()
        if (
            User.objects.filter(username__iexact=email).exists()
            or User.objects.filter(email__iexact=email).exists()
        ):
            return Response(
                {"detail": "An account with that email already exists"},
                status=status.HTTP_409_CONFLICT,
            )
        user = User.objects.create_user(
            username=email, email=email, password=ser.validated_data["password"]
        )
        name = ser.validated_data["name"].strip()
        if name:
            user.first_name = name[:150]
            user.save(update_fields=["first_name"])
        # Give the new account its own workspace (owner), like Ossicone.
        ws = Workspace.objects.create(name=f"{name or email.split('@')[0]}'s workspace")
        WorkspaceMember.objects.create(workspace=ws, user=user, role="owner")
        return Response(
            {**tokens_for(user), "user": user_payload(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"].lower()
        user = authenticate(username=email, password=ser.validated_data["password"])
        if not user:
            return Response(
                {"detail": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response({**tokens_for(user), "user": user_payload(user)})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(user_payload(request.user))


class AuthConfigView(APIView):
    """Public instance config so the SPA knows whether to offer sign-up."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"openSignup": open_signup()})
