"""URL routes for the social app."""

from django.urls import path

from . import views

urlpatterns = [
    path("comments/", views.CommentListCreateView.as_view(), name="comment-list"),
    path(
        "comments/<int:pk>/",
        views.CommentDetailView.as_view(),
        name="comment-detail",
    ),
    path(
        "comments/<int:comment_id>/like/",
        views.LikeToggleView.as_view(),
        name="comment-like",
    ),
    path(
        "follow/<str:username>/",
        views.FollowToggleView.as_view(),
        name="follow-toggle",
    ),
    path("feed/", views.ActivityFeedView.as_view(), name="feed"),
    path(
        "users/<str:username>/followers/",
        views.FollowersListView.as_view(),
        name="followers",
    ),
]
