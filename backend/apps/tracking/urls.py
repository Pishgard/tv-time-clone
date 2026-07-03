"""URL routes for the tracking app."""

from django.urls import path

from . import views

urlpatterns = [
    path(
        "tracking/watchlist/",
        views.WatchListManageView.as_view(),
        name="watchlist-manage",
    ),
    path(
        "tracking/episodes/<int:episode_id>/watch/",
        views.WatchedEpisodeToggleView.as_view(),
        name="episode-toggle",
    ),
    path(
        "tracking/reactions/",
        views.ReactionListCreateView.as_view(),
        name="reaction-list",
    ),
    path("tracking/stats/", views.StatsView.as_view(), name="stats"),
]
