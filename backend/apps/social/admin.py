"""Admin registrations for the social app."""

from django.contrib import admin

from .models import Activity, Comment, Follow, Like


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("user", "episode", "is_spoiler", "created_at")
    list_filter = ("is_spoiler",)
    search_fields = ("user__username", "body")


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("user", "comment", "created_at")


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("follower", "followee", "created_at")


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "created_at")
    list_filter = ("type",)
