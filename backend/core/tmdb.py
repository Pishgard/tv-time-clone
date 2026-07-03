"""TMDB API client.

A thin wrapper around The Movie Database API. Results are cached in the
database (as Show/Season/Episode rows) so we avoid hammering the upstream
API on repeated requests. If no API key is configured, all calls return
empty results and the app falls back to locally-stored (manual) data.
"""

from __future__ import annotations

from typing import Any

import requests
from django.conf import settings


class TMDBError(Exception):
    """Raised when TMDB returns an unexpected response."""


class TMDBClient:
    """Minimal TMDB v3 client used by the shows app."""

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or getattr(settings, "TMDB_API_KEY", "")
        self.base_url = getattr(settings, "TMDB_BASE_URL", "https://api.themoviedb.org/3")
        self.image_base = getattr(
            settings, "TMDB_IMAGE_BASE_URL", "https://image.tmdb.org/t/p"
        )

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    # ------------------------------------------------------------------
    # Low-level request helper
    # ------------------------------------------------------------------
    def _get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self.available:
            return {}
        params = {**(params or {}), "api_key": self.api_key}
        try:
            response = requests.get(
                f"{self.base_url}{path}", params=params, timeout=10
            )
            response.raise_for_status()
            return response.json()
        except (requests.RequestException, ValueError) as exc:
            raise TMDBError(str(exc)) from exc

    # ------------------------------------------------------------------
    # Image URL helpers
    # ------------------------------------------------------------------
    def image_url(self, path: str | None, size: str = "w500") -> str | None:
        if not path:
            return None
        return f"{self.image_base}/{size}{path}"

    def backdrop_url(self, path: str | None, size: str = "w1280") -> str | None:
        if not path:
            return None
        return f"{self.image_base}/{size}{path}"

    # ------------------------------------------------------------------
    # Endpoints
    # ------------------------------------------------------------------
    def search_tv(self, query: str, page: int = 1) -> dict[str, Any]:
        return self._get("/search/tv", {"query": query, "page": page})

    def popular(self, page: int = 1) -> dict[str, Any]:
        return self._get("/tv/popular", {"page": page})

    def trending(self, window: str = "week", page: int = 1) -> dict[str, Any]:
        return self._get(f"/trending/tv/{window}", {"page": page})

    def top_rated(self, page: int = 1) -> dict[str, Any]:
        return self._get("/tv/top_rated", {"page": page})

    def tv_details(self, tmdb_id: int) -> dict[str, Any]:
        return self._get(
            f"/tv/{tmdb_id}", {"append_to_response": "credits,external_ids"}
        )

    def season_details(self, tmdb_id: int, season_number: int) -> dict[str, Any]:
        return self._get(f"/tv/{tmdb_id}/season/{season_number}")


# Singleton used across the app
tmdb = TMDBClient()
