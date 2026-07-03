"""Views for the social app."""

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, response, status, views

from .models import Activity, Comment, Follow, Like
from .serializers import (
    ActivitySerializer,
    CommentCreateSerializer,
    CommentSerializer,
    FollowSerializer,
    LikeSerializer,
)

User = get_user_model()


class CommentListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/comments/?episode=<id>"""

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CommentCreateSerializer
        return CommentSerializer

    def get_queryset(self):
        qs = Comment.objects.select_related("user").filter(
            episode_id=self.request.query_params.get("episode")
        )
        return qs

    def perform_create(self, serializer):
        comment = serializer.save(user=self.request.user)
        Activity.objects.create(
            user=self.request.user,
            type=Activity.Type.COMMENTED,
            payload={
                "comment_id": comment.id,
                "episode_id": comment.episode_id,
                "show": comment.episode.show.title,
            },
        )


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/comments/<id>/"""

    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        # Only the author may edit/delete.
        if request.method in ("PUT", "PATCH", "DELETE") and obj.user != request.user:
            self.permission_denied(request)


class LikeToggleView(views.APIView):
    """POST /api/comments/<id>/like/ — toggle like on a comment."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, comment_id):
        try:
            comment = Comment.objects.get(pk=comment_id)
        except Comment.DoesNotExist:
            return response.Response(
                {"detail": "Comment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        like, created = Like.objects.get_or_create(
            user=request.user, comment=comment
        )
        if not created:
            like.delete()
            liked = False
        else:
            Activity.objects.create(
                user=request.user,
                type=Activity.Type.LIKED_COMMENT,
                payload={"comment_id": comment.id},
            )
            liked = True
        return response.Response({"liked": liked, "count": comment.likes.count()})


class FollowToggleView(views.APIView):
    """POST /api/follow/<username>/ — toggle follow on a user."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        try:
            target = User.objects.get(username=username)
        except User.DoesNotExist:
            return response.Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if target == request.user:
            return response.Response(
                {"detail": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        follow, created = Follow.objects.get_or_create(
            follower=request.user, followee=target
        )
        if not created:
            follow.delete()
            following = False
        else:
            Activity.objects.create(
                user=request.user,
                type=Activity.Type.FOLLOWED,
                payload={"username": target.username},
            )
            following = True
        return response.Response(
            {"following": following, "followers_count": target.followers.count()}
        )


class ActivityFeedView(generics.ListAPIView):
    """GET /api/feed/ — activity from users the current user follows."""

    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        following_ids = self.request.user.following.values_list(
            "followee_id", flat=True
        )
        return Activity.objects.filter(user_id__in=list(following_ids))[:50]


class FollowersListView(generics.ListAPIView):
    """GET /api/users/<username>/followers/ — list a user's followers."""

    serializer_class = FollowSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Follow.objects.filter(followee__username=self.kwargs["username"])
