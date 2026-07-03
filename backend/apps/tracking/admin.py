"""Admin registrations for the tracking app."""

from django.contrib import admin

from .models import Reaction, WatchedEpisode, WatchListItem


@admin.register(WatchListItem)
class WatchListItemAdmin(admin.ModelAdmin):
    list_display = ("user", "show", "status", "updated_at")
    list_filter = ("status",)
    search_fields = ("user__username", "show__title")


@admin.register(WatchedEpisode)
class WatchedEpisodeAdmin(admin.ModelAdmin):
    list_display = ("user", "episode", "watched_at", "rewatches")
    search_fields = ("user__username",)


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ("user", "episode", "type", "created_at")
    list_filter = ("type",)
