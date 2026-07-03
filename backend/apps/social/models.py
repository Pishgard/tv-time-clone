"""Models for the social app.

Captures user interactions around episodes: comments with likes and a
follow graph between users. An Activity feed entry is created whenever
something noteworthy happens (comment, follow, watched episode, ...).
"""

from django.conf import settings
from django.db import models

from apps.shows.models import Episode


class Comment(models.Model):
    """A comment posted by a user on a specific episode."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="comments",
        on_delete=models.CASCADE,
    )
    episode = models.ForeignKey(
        Episode, related_name="comments", on_delete=models.CASCADE
    )
    body = models.TextField(max_length=2000)
    is_spoiler = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user} on {self.episode}"


class Like(models.Model):
    """A like on a comment."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="likes",
        on_delete=models.CASCADE,
    )
    comment = models.ForeignKey(
        Comment, related_name="likes", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "comment")

    def __str__(self) -> str:
        return f"{self.user} likes {self.comment.id}"


class Follow(models.Model):
    """A directed follow edge: follower -> followee."""

    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="following",
        on_delete=models.CASCADE,
    )
    followee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="followers",
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "followee")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.follower} → {self.followee}"


class Activity(models.Model):
    """A line in the social feed.

    Denormalised on purpose so the feed stays cheap to render.
    """

    class Type(models.TextChoices):
        WATCHED = "watched", "Watched an episode"
        COMMENTED = "commented", "Commented on an episode"
        LIKED_COMMENT = "liked_comment", "Liked a comment"
        STARTED_SHOW = "started_show", "Started a show"
        FOLLOWED = "followed", "Followed a user"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="activities",
        on_delete=models.CASCADE,
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    # Lightweight JSON payload describing the target (avoiding generic FKs)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "activities"

    def __str__(self) -> str:
        return f"{self.user} {self.type}"
