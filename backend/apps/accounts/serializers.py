"""Serializers for the accounts app."""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Public-ish user representation."""

    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "avatar",
            "bio",
            "preferred_language",
            "is_private",
            "followers_count",
            "following_count",
        )
        read_only_fields = ("id", "followers_count", "following_count")
        extra_kwargs = {"email": {"write_only": True}}

    def get_followers_count(self, obj: User) -> int:
        return obj.followers.count()

    def get_following_count(self, obj: User) -> int:
        return obj.following.count()


class PublicUserSerializer(serializers.ModelSerializer):
    """User fields visible to others (no email)."""

    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "avatar",
            "bio",
            "is_private",
            "followers_count",
            "following_count",
        )

    def get_followers_count(self, obj: User) -> int:
        return obj.followers.count()

    def get_following_count(self, obj: User) -> int:
        return obj.following.count()


class RegisterSerializer(serializers.ModelSerializer):
    """Handles sign-up: validates password and creates the user."""

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2", "preferred_language")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
