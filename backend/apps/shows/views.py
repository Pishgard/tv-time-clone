"""Views for the shows app."""

from django.db import transaction
from rest_framework import generics, permissions, response, status
from rest_framework.views import APIView

from . import services
from .models import Episode, Season, Show
from .serializers import (
    EpisodeSerializer,
    ManualShowSerializer,
    ShowDetailSerializer,
    ShowListSerializer,
)


class ShowListView(generics.ListAPIView):
    """GET /api/shows/ — list locally-stored shows, with optional search.

    When the request carries a `search` query param and the local DB has no
    matches, the view falls back to a TMDB live search so the frontend can
    show TMDB results before the user opens a detail page.
    """

    serializer_class = ShowListSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        query = request.query_params.get("search", "").strip()

        # Local search first.
        qs = Show.objects.all()
        if query:
            qs = qs.filter(title__icontains=query)

        local_page = self.paginate_queryset(qs)
        local_data = self.get_serializer(local_page, many=True).data

        # If nothing local, try TMDB live search for discoverability.
        tmdb_results = []
        if query and len(local_data) == 0:
            tmdb_results = services.search_tmdb(query)

        paginated = self.get_paginated_response(local_data)
        paginated.data["tmdb_results"] = tmdb_results
        return paginated


class ShowDetailView(generics.RetrieveAPIView):
    """GET /api/shows/<id>/ — show detail. Accepts both local and TMDB ids.

    Pass `?tmdb=1` to look up by TMDB id (the show will be synced from TMDB
    on first access and cached locally).
    """

    serializer_class = ShowDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        pk = self.kwargs["pk"]
        use_tmdb = self.request.query_params.get("tmdb") in ("1", "true", "True")
        if use_tmdb:
            show = services.ensure_show_from_tmdb_id(int(pk))
            if show:
                return show
            raise Show.DoesNotExist
        return Show.objects.get(pk=pk)


class BrowseView(APIView):
    """GET /api/browse/?kind=popular|trending|top_rated&page=1

    Returns TMDB browse results. These are *not* persisted; they're meant
    for the discover page. Clicking a result opens the detail view which
    triggers a sync.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        kind = request.query_params.get("kind", "popular")
        page = int(request.query_params.get("page", 1))
        results = services.browse_tmdb(kind=kind, page=page)
        return response.Response({"results": results, "kind": kind, "page": page})


class SeasonDetailView(generics.RetrieveAPIView):
    """GET /api/shows/<show_id>/seasons/<number>/ — a season with episodes."""

    serializer_class = None  # set below
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        show_id = int(kwargs["show_id"])
        number = int(kwargs["number"])
        from .serializers import SeasonSerializer

        season = Season.objects.get(show_id=show_id, number=number)
        serializer = SeasonSerializer(season)
        return response.Response(serializer.data)


class ManualShowCreateView(APIView):
    """POST /api/shows/manual/ — create a manual (non-TMDB) show."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ManualShowSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            show = Show.objects.create(
                source=Show.Source.MANUAL,
                title=data["title"],
                overview=data.get("overview", ""),
                poster_url=data.get("poster_url", ""),
                backdrop_url=data.get("backdrop_url", ""),
                first_air_date=data.get("first_air_date"),
                created_by=request.user,
                status=Show.Status.UNKNOWN,
            )
            for season_data in data.get("seasons", []):
                season = Season.objects.create(
                    show=show,
                    number=season_data["number"],
                    name=season_data.get("name", ""),
                    overview=season_data.get("overview", ""),
                    episode_count=len(season_data.get("episodes", [])),
                )
                for ep in season_data.get("episodes", []):
                    Episode.objects.create(
                        season=season,
                        number=ep["number"],
                        title=ep.get("title", ""),
                        overview=ep.get("overview", ""),
                        air_date=ep.get("air_date"),
                        runtime=ep.get("runtime"),
                    )

        return response.Response(
            ShowDetailSerializer(show).data, status=status.HTTP_201_CREATED
        )
