"""Models for the shows app.

The data model is *hybrid*: shows can either be sourced from TMDB
(`source='tmdb'`) or added manually by a user (`source='manual'`).
TMDB-sourced rows are created on demand and cached in the DB so the
upstream API is only hit once per show.
"""

from django.db import models


class Genre(models.Model):
    """A genre, with localised names for both supported languages."""

    tmdb_id = models.PositiveIntegerField(unique=True, null=True, blank=True)
    name_en = models.CharField(max_length=64)
    name_fa = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        ordering = ["name_en"]

    def __str__(self) -> str:
        return self.name_en


class Show(models.Model):
    """A TV show."""

    class Source(models.TextChoices):
        TMDB = "tmdb", "TMDB"
        MANUAL = "manual", "Manual"

    class Status(models.TextChoices):
        RETURNING = "returning", "Returning Series"
        ENDED = "ended", "Ended"
        UPCOMING = "upcoming", "Upcoming"
        UNKNOWN = "unknown", "Unknown"

    source = models.CharField(
        max_length=8, choices=Source.choices, default=Source.TMDB
    )
    tmdb_id = models.PositiveIntegerField(unique=True, null=True, blank=True)
    title = models.CharField(max_length=255)
    overview = models.TextField(blank=True, default="")
    poster_path = models.CharField(max_length=255, blank=True, default="")
    backdrop_path = models.CharField(max_length=255, blank=True, default="")
    poster_url = models.URLField(blank=True, default="")
    backdrop_url = models.URLField(blank=True, default="")
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.UNKNOWN
    )
    first_air_date = models.DateField(null=True, blank=True)
    rating = models.FloatField(default=0)
    vote_count = models.PositiveIntegerField(default=0)
    genres = models.ManyToManyField(Genre, related_name="shows", blank=True)
    number_of_seasons = models.PositiveIntegerField(default=0)
    number_of_episodes = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="manual_shows",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-rating"]

    def __str__(self) -> str:
        return self.title


class Season(models.Model):
    show = models.ForeignKey(
        Show, related_name="seasons", on_delete=models.CASCADE
    )
    tmdb_id = models.PositiveIntegerField(null=True, blank=True)
    number = models.PositiveIntegerField()
    name = models.CharField(max_length=128, blank=True, default="")
    overview = models.TextField(blank=True, default="")
    poster_path = models.CharField(max_length=255, blank=True, default="")
    poster_url = models.URLField(blank=True, default="")
    air_date = models.DateField(null=True, blank=True)
    episode_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["number"]
        unique_together = ("show", "number")

    def __str__(self) -> str:
        return f"{self.show.title} - S{self.number}"


class Episode(models.Model):
    season = models.ForeignKey(
        Season, related_name="episodes", on_delete=models.CASCADE
    )
    tmdb_id = models.PositiveIntegerField(null=True, blank=True)
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=255, blank=True, default="")
    overview = models.TextField(blank=True, default="")
    still_path = models.CharField(max_length=255, blank=True, default="")
    still_url = models.URLField(blank=True, default="")
    air_date = models.DateField(null=True, blank=True)
    runtime = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["number"]
        unique_together = ("season", "number")

    def __str__(self) -> str:
        return f"{self.season}E{self.number:02d} - {self.title}"

    @property
    def show(self) -> Show:
        return self.season.show
