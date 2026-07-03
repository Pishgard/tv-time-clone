"""Seed command: loads demo data so the app is usable without TMDB.

Run with:  python manage.py seed
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.shows.models import Episode, Genre, Season, Show
from apps.tracking.models import WatchListItem, WatchedEpisode

User = get_user_model()


def _show(title, overview, status, rating, year, genres_en):
    genres = []
    for name_en in genres_en:
        g, _ = Genre.objects.get_or_create(name_en=name_en)
        genres.append(g)
    show, _ = Show.objects.get_or_create(
        title=title,
        defaults={
            "source": Show.Source.MANUAL,
            "overview": overview,
            "status": status,
            "rating": rating,
            "first_air_date": timezone.datetime(year, 1, 1).date(),
            "number_of_seasons": 1,
            "number_of_episodes": 6,
        },
    )
    for g in genres:
        show.genres.add(g)
    return show


def _seasons(show, seasons_def):
    for s_number, s_name, episodes_def in seasons_def:
        season, _ = Season.objects.get_or_create(
            show=show, number=s_number, defaults={"name": s_name, "episode_count": len(episodes_def)}
        )
        for e_number, e_title, e_overview in episodes_def:
            Episode.objects.get_or_create(
                season=season, number=e_number,
                defaults={"title": e_title, "overview": e_overview},
            )


class Command(BaseCommand):
    help = "Seed the database with demo users and a few sample shows."

    def handle(self, *args, **options):
        # --- Demo users ---
        demo, created = User.objects.get_or_create(
            username="demo",
            defaults={
                "email": "demo@example.com",
                "preferred_language": "en",
                "bio": "Just a demo user exploring shows.",
            },
        )
        if created:
            demo.set_password("demo12345")
            demo.save()
            self.stdout.write(self.style.SUCCESS("Created demo user (demo / demo12345)"))

        ali, _ = User.objects.get_or_create(
            username="ali",
            defaults={
                "email": "ali@example.com",
                "preferred_language": "fa",
                "bio": "فان سریال‌های علمی‌تخیلی",
            },
        )
        if not ali.password:
            ali.set_password("ali12345")
            ali.save()

        # --- Shows ---
        severance = _show(
            "Severance",
            "Mark leads a team of office workers whose memories have been surgically "
            "divided between their work and personal lives.",
            Show.Status.RETURNING, 8.7, 2022,
            ["Drama", "Sci-Fi", "Mystery"],
        )
        _seasons(severance, [
            (1, "Season 1", [
                (1, "Good News About Hell", "Mark and his team discover a mystery."),
                (2, "Half Loop", "Helly contemplates her options."),
                (3, "In Perpetuity", "The team tries a new tactic."),
            ]),
        ])

        stranger = _show(
            "Stranger Things",
            "When a young boy vanishes, a small town uncovers a mystery involving "
            "secret experiments, terrifying supernatural forces and one strange girl.",
            Show.Status.RETURNING, 8.6, 2016,
            ["Drama", "Sci-Fi", "Horror"],
        )
        _seasons(stranger, [
            (1, "Season 1", [
                (1, "The Vanishing of Will Byers", "Will goes missing on his way home."),
                (2, "The Weirdo on Maple Street", "The boys find Eleven."),
            ]),
        ])

        breaking = _show(
            "Breaking Bad",
            "A high school chemistry teacher diagnosed with cancer turns to a life "
            "of crime, producing and selling methamphetamine.",
            Show.Status.ENDED, 9.5, 2008,
            ["Drama", "Crime", "Thriller"],
        )
        _seasons(breaking, [
            (1, "Season 1", [
                (1, "Pilot", "Walter White gets a cancer diagnosis."),
                (2, "Cat's in the Bag...", "Walt and Jesse deal with the aftermath."),
            ]),
        ])

        theboys = _show(
            "The Boys",
            "A group of vigilantes set out to take down corrupt superheroes who "
            "abuse their powers.",
            Show.Status.RETURNING, 8.7, 2019,
            ["Action", "Drama", "Sci-Fi"],
        )
        _seasons(theboys, [
            (1, "Season 1", [
                (1, "The Name of the Game", "Hughie loses someone close."),
                (2, "Cherry", "The Boys start to form."),
            ]),
        ])

        # --- Demo tracking data ---
        if not demo.watchlist.exists():
            WatchListItem.objects.create(user=demo, show=severance, status=WatchListItem.Status.WATCHING)
            WatchListItem.objects.create(user=demo, show=theboys, status=WatchListItem.Status.WATCHING)
            WatchListItem.objects.create(user=demo, show=breaking, status=WatchListItem.Status.COMPLETED)
            WatchListItem.objects.create(user=demo, show=stranger, status=WatchListItem.Status.PLAN)

            # Mark a couple of episodes watched
            ep1 = Episode.objects.get(season__show=severance, season__number=1, number=1)
            ep2 = Episode.objects.get(season__show=severance, season__number=1, number=2)
            bb_ep1 = Episode.objects.get(season__show=breaking, season__number=1, number=1)
            for ep in (ep1, ep2, bb_ep1):
                WatchedEpisode.objects.get_or_create(user=demo, episode=ep)

        self.stdout.write(self.style.SUCCESS("Seed complete ✓"))
