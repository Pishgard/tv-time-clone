"""Views for the accounts app: registration, profile and user lookup."""

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    PublicUserSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


def _tokens_for(user: User) -> dict:
    """Build the JWT pair for a freshly authenticated user."""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create a user and return tokens."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": UserSerializer(user).read_only, "tokens": _tokens_for(user)},
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    """GET/PATCH /api/me/ — the current user's profile."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserDetailView(generics.RetrieveAPIView):
    """GET /api/users/<username>/ — public profile."""

    queryset = User.objects.all()
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "username"
