"""Services that bridge TMDB responses and the local database.

These helpers are the single place where TMDB payloads are translated
into Show/Season/Episode rows. They keep the views thin and make the
hybrid (TMDB + manual) data model work transparently.
"""

from __future__ import annotations

from typing import Any, Iterable

from django.utils.dateparse import parse_date

from core.tmdb import tmdb

from .models import Episode, Genre, Season, Show


# ---------------------------------------------------------------------------
# Genre helpers
# ---------------------------------------------------------------------------
_GENRE_CACHE: dict[int, Genre] = {}


def _get_or_create_genre(tmdb_id: int, name_en: str) -> Genre:
    genre = _GENRE_CACHE.get(tmdb_id)
    if genre:
        return genre
    genre, _ = Genre.objects.get_or_create(
        tmdb_id=tmdb_id, defaults={"name_en": name_en}
    )
    _GENRE_CACHE[tmdb_id] = genre
    return genre


# ---------------------------------------------------------------------------
# Image URL helpers
# ---------------------------------------------------------------------------
def _poster(poster_path: str | None) -> str:
    url = tmdb.image_url(poster_path, "w500")
    return url or ""


def _backdrop(backdrop_path: str | None) -> str:
    url = tmdb.backdrop_url(backdrop_path, "w1280")
    return url or ""


def _still(still_path: str | None) -> str:
    url = tmdb.image_url(still_path, "w500")
    return url or ""


# ---------------------------------------------------------------------------
# Status mapping
# ---------------------------------------------------------------------------
def _map_status(status_str: str) -> str:
    mapping = {
        "Returning Series": Show.Status.RETURNING,
        "Ended": Show.Status.ENDED,
        "Canceled": Show.Status.ENDED,
        "Pilot": Show.Status.UPCOMING,
        "In Production": Show.Status.UPCOMING,
        "Planned": Show.Status.UPCOMING,
    }
    return mapping.get(status_str, Show.Status.UNKNOWN)


# ---------------------------------------------------------------------------
# Show sync
# ---------------------------------------------------------------------------
def sync_show_from_tmdb(tmdb_id: int) -> Show | None:
    """Fetch full show details from TMDB and persist them locally.

    Returns the (created or updated) Show, or None if TMDB is unavailable
    or the request failed.
    """
    try:
        data = tmdb.tv_details(tmdb_id)
    except Exception:
        return None
    if not data:
        return None

    show, _ = Show.objects.update_or_create(
        tmdb_id=tmdb_id,
        defaults={
            "source": Show.Source.TMDB,
            "title": data.get("name") or data.get("original_name") or "",
            "overview": data.get("overview", ""),
            "poster_path": data.get("poster_path", "") or "",
            "backdrop_path": data.get("backdrop_path", "") or "",
            "poster_url": _poster(data.get("poster_path")),
            "backdrop_url": _backdrop(data.get("backdrop_path")),
            "status": _map_status(data.get("status", "")),
            "first_air_date": parse_date(data.get("first_air_date") or ""),
            "rating": data.get("vote_average", 0) or 0,
            "vote_count": data.get("vote_count", 0) or 0,
            "number_of_seasons": data.get("number_of_seasons", 0) or 0,
            "number_of_episodes": data.get("number_of_episodes", 0) or 0,
        },
    )

    # Genres
    genre_ids = []
    for g in data.get("genres", []):
        genre = _get_or_create_genre(g.get("id"), g.get("name", ""))
        genre_ids.append(genre.id)
    if genre_ids:
        show.genres.set(genre_ids)

    # Seasons + episodes
    for season_payload in data.get("seasons", []):
        _sync_season(show, season_payload)

    return show


def _sync_season(show: Show, payload: dict[str, Any]) -> Season | None:
    season_number = payload.get("season_number")
    if season_number is None:
        return None

    season, _ = Season.objects.update_or_create(
        show=show,
        number=season_number,
        defaults={
            "tmdb_id": payload.get("id"),
            "name": payload.get("name", ""),
            "overview": payload.get("overview", ""),
            "poster_path": payload.get("poster_path", "") or "",
            "poster_url": _poster(payload.get("poster_path")),
            "air_date": parse_date(payload.get("air_date") or ""),
            "episode_count": payload.get("episode_count", 0) or 0,
        },
    )

    # Only fetch full episode list when the season has episodes and isn't
    # a future/empty season.
    if payload.get("episode_count", 0) and show.tmdb_id:
        _sync_season_episodes(show, season)

    return season


def _sync_season_episodes(show: Show, season: Season) -> None:
    if not show.tmdb_id:
        return
    try:
        data = tmdb.season_details(show.tmdb_id, season.number)
    except Exception:
        return
    if not data:
        return

    for ep_payload in data.get("episodes", []):
        Episode.objects.update_or_create(
            season=season,
            number=ep_payload.get("episode_number"),
            defaults={
                "tmdb_id": ep_payload.get("id"),
                "title": ep_payload.get("name", ""),
                "overview": ep_payload.get("overview", ""),
                "still_path": ep_payload.get("still_path", "") or "",
                "still_url": _still(ep_payload.get("still_path")),
                "air_date": parse_date(ep_payload.get("air_date") or ""),
                "runtime": ep_payload.get("runtime"),
            },
        )


# ---------------------------------------------------------------------------
# Search / browse helpers
# ---------------------------------------------------------------------------
def search_tmdb(query: str) -> list[dict[str, Any]]:
    """Return a list of lightweight show dicts from a TMDB search.

    Used for live search before anything is persisted.
    """
    if not tmdb.available or not query:
        return []
    try:
        data = tmdb.search_tv(query)
    except Exception:
        return []
    results = []
    for item in data.get("results", []):
        results.append(
            {
                "tmdb_id": item.get("id"),
                "title": item.get("name") or item.get("original_name") or "",
                "overview": item.get("overview", ""),
                "poster_path": item.get("poster_path", "") or "",
                "poster_url": _poster(item.get("poster_path")),
                "backdrop_path": item.get("backdrop_path", "") or "",
                "backdrop_url": _backdrop(item.get("backdrop_path")),
                "first_air_date": item.get("first_air_date") or "",
                "rating": item.get("vote_average", 0) or 0,
            }
        )
    return results


def browse_tmdb(kind: str = "popular", page: int = 1) -> list[dict[str, Any]]:
    """Return browse results from TMDB (popular / trending / top_rated)."""
    fetchers = {
        "popular": tmdb.popular,
        "trending": tmdb.trending,
        "top_rated": tmdb.top_rated,
    }
    fetcher = fetchers.get(kind, tmdb.popular)
    try:
        data = fetcher(page=page) if kind != "trending" else fetcher(page=page)
    except Exception:
        return []
    results = []
    for item in data.get("results", []):
        results.append(
            {
                "tmdb_id": item.get("id"),
                "title": item.get("name") or item.get("original_name") or "",
                "overview": item.get("overview", ""),
                "poster_path": item.get("poster_path", "") or "",
                "poster_url": _poster(item.get("poster_path")),
                "backdrop_path": item.get("backdrop_path", "") or "",
                "backdrop_url": _backdrop(item.get("backdrop_path")),
                "first_air_date": item.get("first_air_date") or "",
                "rating": item.get("vote_average", 0) or 0,
            }
        )
    return results


def ensure_show_from_tmdb_id(tmdb_id: int) -> Show | None:
    """Return a local Show for a TMDB id, syncing from TMDB if missing."""
    show = Show.objects.filter(tmdb_id=tmdb_id).first()
    if show:
        return show
    return sync_show_from_tmdb(tmdb_id)
