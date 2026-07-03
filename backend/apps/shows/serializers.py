"""Serializers for the shows app."""

from rest_framework import serializers

from .models import Episode, Genre, Season, Show


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ("id", "tmdb_id", "name_en", "name_fa")


class EpisodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Episode
        fields = (
            "id",
            "tmdb_id",
            "number",
            "title",
            "overview",
            "still_path",
            "still_url",
            "air_date",
            "runtime",
        )


class SeasonSerializer(serializers.ModelSerializer):
    episodes = EpisodeSerializer(many=True, read_only=True)

    class Meta:
        model = Season
        fields = (
            "id",
            "tmdb_id",
            "number",
            "name",
            "overview",
            "poster_path",
            "poster_url",
            "air_date",
            "episode_count",
            "episodes",
        )


class ShowListSerializer(serializers.ModelSerializer):
    """Lightweight serializer used in lists / search results."""

    genres = serializers.SlugRelatedField(
        many=True, slug_field="name_en", read_only=True
    )

    class Meta:
        model = Show
        fields = (
            "id",
            "tmdb_id",
            "title",
            "poster_path",
            "poster_url",
            "backdrop_path",
            "backdrop_url",
            "first_air_date",
            "rating",
            "status",
            "genres",
        )


class ShowDetailSerializer(serializers.ModelSerializer):
    """Full representation with seasons."""

    genres = GenreSerializer(many=True, read_only=True)
    seasons = SeasonSerializer(many=True, read_only=True)

    class Meta:
        model = Show
        fields = (
            "id",
            "source",
            "tmdb_id",
            "title",
            "overview",
            "poster_path",
            "poster_url",
            "backdrop_path",
            "backdrop_url",
            "status",
            "first_air_date",
            "rating",
            "vote_count",
            "genres",
            "number_of_seasons",
            "number_of_episodes",
            "seasons",
        )


class ManualEpisodeSerializer(serializers.Serializer):
    """Helper for nested episode input on manual show creation."""

    number = serializers.IntegerField(min_value=1)
    title = serializers.CharField(required=False, allow_blank=True, default="")
    overview = serializers.CharField(required=False, allow_blank=True, default="")
    air_date = serializers.DateField(required=False, allow_null=True)
    runtime = serializers.IntegerField(required=False, allow_null=True, min_value=1)


class ManualSeasonSerializer(serializers.Serializer):
    number = serializers.IntegerField(min_value=1)
    name = serializers.CharField(required=False, allow_blank=True, default="")
    overview = serializers.CharField(required=False, allow_blank=True, default="")
    episodes = ManualEpisodeSerializer(many=True, required=False, default=list)


class ManualShowSerializer(serializers.Serializer):
    """Validates manual (non-TMDB) show submissions."""

    title = serializers.CharField(max_length=255)
    overview = serializers.CharField(required=False, allow_blank=True, default="")
    poster_url = serializers.URLField(required=False, allow_blank=True, default="")
    backdrop_url = serializers.URLField(required=False, allow_blank=True, default="")
    first_air_date = serializers.DateField(required=False, allow_null=True)
    seasons = ManualSeasonSerializer(many=True, required=False, default=list)
