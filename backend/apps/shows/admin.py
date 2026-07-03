"""Admin registrations for the shows app."""

from django.contrib import admin

from .models import Episode, Genre, Season, Show


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_fa", "tmdb_id")
    search_fields = ("name_en", "name_fa")


@admin.register(Show)
class ShowAdmin(admin.ModelAdmin):
    list_display = ("title", "source", "status", "rating", "number_of_seasons")
    list_filter = ("source", "status", "genres")
    search_fields = ("title", "overview")
    filter_horizontal = ("genres",)


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ("show", "number", "name", "episode_count")
    list_filter = ("show",)
    search_fields = ("name",)


@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = ("season", "number", "title", "air_date")
    search_fields = ("title",)
