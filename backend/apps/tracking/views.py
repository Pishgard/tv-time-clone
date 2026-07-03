"""Views for the tracking app."""

from django.db.models import Count, Sum
from rest_framework import generics, permissions, response, status, views

from apps.social.models import Activity
from apps.shows.models import Episode

from .models import Reaction, WatchedEpisode, WatchListItem
from .serializers import (
    ReactionSerializer,
    WatchedEpisodeSerializer,
    WatchListItemCreateSerializer,
    WatchListItemSerializer,
)


class WatchListManageView(views.APIView):
    """GET /api/tracking/watchlist/ — current user's list.
    POST /api/tracking/watchlist/ — add or update an item (upsert).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get("status")
        qs = request.user.watchlist.select_related("show")
        if status_filter:
            qs = qs.filter(status=status_filter)
        serializer = WatchListItemSerializer(qs, many=True)
        return response.Response(serializer.data)

    def post(self, request):
        serializer = WatchListItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        show = serializer.validated_data["show"]
        new_status = serializer.validated_data["status"]
        item, created = WatchListItem.objects.update_or_create(
            user=request.user,
            show=show,
            defaults={"status": new_status},
        )
        if created and new_status == WatchListItem.Status.WATCHING:
            Activity.objects.create(
                user=request.user,
                type=Activity.Type.STARTED_SHOW,
                payload={"show_id": show.id, "title": show.title},
            )
        return response.Response(
            WatchListItemSerializer(item).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        show_id = request.data.get("show")
        deleted, _ = WatchListItem.objects.filter(
            user=request.user, show_id=show_id
        ).delete()
        return response.Response({"deleted": deleted})


class WatchedEpisodeToggleView(views.APIView):
    """POST /api/tracking/episodes/<id>/watch/ — toggle watched state.

    Body: {"watched": true|false} (defaults to toggling current state).
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, episode_id):
        try:
            episode = Episode.objects.get(pk=episode_id)
        except Episode.DoesNotExist:
            return response.Response(
                {"detail": "Episode not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        watched_flag = request.data.get("watched")
        existing = WatchedEpisode.objects.filter(
            user=request.user, episode=episode
        ).first()

        if watched_flag is None:
            # toggle
            if existing:
                existing.delete()
                is_watched = False
            else:
                WatchedEpisode.objects.create(user=request.user, episode=episode)
                Activity.objects.create(
                    user=request.user,
                    type=Activity.Type.WATCHED,
                    payload={
                        "episode_id": episode.id,
                        "title": episode.title,
                        "show": episode.show.title,
                    },
                )
                is_watched = True
        elif watched_flag:
            if not existing:
                WatchedEpisode.objects.create(user=request.user, episode=episode)
                Activity.objects.create(
                    user=request.user,
                    type=Activity.Type.WATCHED,
                    payload={
                        "episode_id": episode.id,
                        "title": episode.title,
                        "show": episode.show.title,
                    },
                )
            is_watched = True
        else:
            if existing:
                existing.delete()
            is_watched = False

        return response.Response({"episode": episode.id, "watched": is_watched})


class ReactionListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/tracking/reactions/"""

    serializer_class = ReactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reaction.objects.filter(
            episode_id=self.request.query_params.get("episode")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StatsView(views.APIView):
    """GET /api/tracking/stats/ — personal watching statistics."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        watched = user.watched_episodes.select_related("episode__season__show")
        episodes_watched = watched.count()
        total_minutes = (
            watched.aggregate(total=Sum("episode__runtime"))["total"] or 0
        )

        # Shows grouped by status
        watchlist = user.watchlist.values("status").annotate(
            count=Count("id")
        )
        by_status = {item["status"]: item["count"] for item in watchlist}

        # Top genres among watched episodes' shows
        genres = (
            watched.values("episode__season__show__genres__name_en")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        top_genres = [
            {"name": g["episode__season__show__genres__name_en"] or "Unknown", "count": g["count"]}
            for g in genres[:8]
            if g["episode__season__show__genres__name_en"]
        ]

        return response.Response(
            {
                "episodes_watched": episodes_watched,
                "total_minutes": total_minutes,
                "total_hours": round(total_minutes / 60, 1),
                "shows_watching": by_status.get(WatchListItem.Status.WATCHING, 0),
                "shows_completed": by_status.get(WatchListItem.Status.COMPLETED, 0),
                "shows_planned": by_status.get(WatchListItem.Status.PLAN, 0),
                "top_genres": top_genres,
            }
        )
