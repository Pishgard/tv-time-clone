"""Models for the tracking app.

Records a user's relationship to shows and episodes:
which shows they follow, which episodes they've watched, and how they
reacted to specific episodes.
"""

from django.conf import settings
from django.db import models

from apps.shows.models import Episode, Show


class WatchListItem(models.Model):
    """A show on a user's list, with a status."""

    class Status(models.TextChoices):
        WATCHING = "watching", "Watching"
        COMPLETED = "completed", "Completed"
        PLAN = "plan", "Plan to Watch"
        DROPPED = "dropped", "Dropped"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="watchlist",
        on_delete=models.CASCADE,
    )
    show = models.ForeignKey(
        Show, related_name="watchlist_items", on_delete=models.CASCADE
    )
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.WATCHING
    )
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "show")
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.user} → {self.show} ({self.status})"


class WatchedEpisode(models.Model):
    """An episode marked as watched by a user."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="watched_episodes",
        on_delete=models.CASCADE,
    )
    episode = models.ForeignKey(
        Episode, related_name="watched_by", on_delete=models.CASCADE
    )
    watched_at = models.DateTimeField(auto_now_add=True)
    rewatches = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("user", "episode")
        ordering = ["-watched_at"]

    def __str__(self) -> str:
        return f"{self.user} watched {self.episode}"


class Reaction(models.Model):
    """A reaction (e.g. 'liked') attached to a specific episode."""

    class Type(models.TextChoices):
        LIKED = "liked", "Liked"
        AMAZING = "amazing", "Amazing"
        FUNNY = "funny", "Funny"
        SAD = "sad", "Sad"
        WOW = "wow", "Wow"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="reactions",
        on_delete=models.CASCADE,
    )
    episode = models.ForeignKey(
        Episode, related_name="reactions", on_delete=models.CASCADE
    )
    type = models.CharField(max_length=12, choices=Type.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "episode", "type")

    def __str__(self) -> str:
        return f"{self.user} {self.type} {self.episode}"
