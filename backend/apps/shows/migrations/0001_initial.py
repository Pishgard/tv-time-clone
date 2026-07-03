"""Initial migration for the shows app."""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Genre",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "tmdb_id",
                    models.PositiveIntegerField(blank=True, null=True, unique=True),
                ),
                ("name_en", models.CharField(max_length=64)),
                ("name_fa", models.CharField(blank=True, default="", max_length=64)),
            ],
            options={"ordering": ["name_en"]},
        ),
        migrations.CreateModel(
            name="Show",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "source",
                    models.CharField(
                        choices=[("tmdb", "TMDB"), ("manual", "Manual")],
                        default="tmdb",
                        max_length=8,
                    ),
                ),
                (
                    "tmdb_id",
                    models.PositiveIntegerField(blank=True, null=True, unique=True),
                ),
                ("title", models.CharField(max_length=255)),
                ("overview", models.TextField(blank=True, default="")),
                ("poster_path", models.CharField(blank=True, default="", max_length=255)),
                (
                    "backdrop_path",
                    models.CharField(blank=True, default="", max_length=255),
                ),
                ("poster_url", models.URLField(blank=True, default="")),
                ("backdrop_url", models.URLField(blank=True, default="")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("returning", "Returning Series"),
                            ("ended", "Ended"),
                            ("upcoming", "Upcoming"),
                            ("unknown", "Unknown"),
                        ],
                        default="unknown",
                        max_length=12,
                    ),
                ),
                ("first_air_date", models.DateField(blank=True, null=True)),
                ("rating", models.FloatField(default=0)),
                ("vote_count", models.PositiveIntegerField(default=0)),
                ("number_of_seasons", models.PositiveIntegerField(default=0)),
                ("number_of_episodes", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="manual_shows",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "genres",
                    models.ManyToManyField(
                        blank=True, related_name="shows", to="shows.genre"
                    ),
                ),
            ],
            options={"ordering": ["-rating"]},
        ),
        migrations.CreateModel(
            name="Season",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("tmdb_id", models.PositiveIntegerField(blank=True, null=True)),
                ("number", models.PositiveIntegerField()),
                ("name", models.CharField(blank=True, default="", max_length=128)),
                ("overview", models.TextField(blank=True, default="")),
                ("poster_path", models.CharField(blank=True, default="", max_length=255)),
                ("poster_url", models.URLField(blank=True, default="")),
                ("air_date", models.DateField(blank=True, null=True)),
                ("episode_count", models.PositiveIntegerField(default=0)),
                (
                    "show",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="seasons",
                        to="shows.show",
                    ),
                ),
            ],
            options={
                "ordering": ["number"],
                "unique_together": {("show", "number")},
            },
        ),
        migrations.CreateModel(
            name="Episode",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("tmdb_id", models.PositiveIntegerField(blank=True, null=True)),
                ("number", models.PositiveIntegerField()),
                ("title", models.CharField(blank=True, default="", max_length=255)),
                ("overview", models.TextField(blank=True, default="")),
                ("still_path", models.CharField(blank=True, default="", max_length=255)),
                ("still_url", models.URLField(blank=True, default="")),
                ("air_date", models.DateField(blank=True, null=True)),
                ("runtime", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "season",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="episodes",
                        to="shows.season",
                    ),
                ),
            ],
            options={
                "ordering": ["number"],
                "unique_together": {("season", "number")},
            },
        ),
    ]
