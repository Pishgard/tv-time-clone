"""Serializers for the social app."""

from rest_framework import serializers

from apps.accounts.serializers import PublicUserSerializer

from .models import Activity, Comment, Follow, Like


class LikeSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)

    class Meta:
        model = Like
        fields = ("id", "user", "created_at")


class CommentSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    liked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            "id",
            "user",
            "body",
            "is_spoiler",
            "created_at",
            "updated_at",
            "likes_count",
            "liked_by_me",
        )

    def get_likes_count(self, obj: Comment) -> int:
        return obj.likes.count()

    def get_liked_by_me(self, obj: Comment) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(user=request.user).exists()


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ("episode", "body", "is_spoiler")


class FollowSerializer(serializers.ModelSerializer):
    follower = PublicUserSerializer(read_only=True)
    followee = PublicUserSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ("id", "follower", "followee", "created_at")


class ActivitySerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = ("id", "user", "type", "payload", "created_at")
