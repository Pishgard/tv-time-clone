"""URL routes for the shows app."""

from django.urls import path

from . import views

urlpatterns = [
    path("shows/", views.ShowListView.as_view(), name="show-list"),
    path("shows/manual/", views.ManualShowCreateView.as_view(), name="show-manual"),
    path("shows/<int:pk>/", views.ShowDetailView.as_view(), name="show-detail"),
    path(
        "shows/<int:show_id>/seasons/<int:number>/",
        views.SeasonDetailView.as_view(),
        name="season-detail",
    ),
    path("browse/", views.BrowseView.as_view(), name="browse"),
]
