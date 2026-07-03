"""Serializers for the tracking app."""

from rest_framework import serializers

from apps.shows.serializers import EpisodeSerializer, ShowListSerializer

from .models import Reaction, WatchedEpisode, WatchListItem


class WatchListItemSerializer(serializers.ModelSerializer):
    show = ShowListSerializer(read_only=True)

    class Meta:
        model = WatchListItem
        fields = ("id", "show", "status", "added_at", "updated_at")


class WatchListItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WatchListItem
        fields = ("show", "status")


class WatchedEpisodeSerializer(serializers.ModelSerializer):
    episode = EpisodeSerializer(read_only=True)

    class Meta:
        model = WatchedEpisode
        fields = ("id", "episode", "watched_at", "rewatches")


class ReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reaction
        fields = ("id", "episode", "type", "created_at")
