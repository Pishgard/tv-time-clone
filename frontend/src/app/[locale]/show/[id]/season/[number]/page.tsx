"use client";

import { use, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { EpisodeRow } from "@/components/ui/EpisodeRow";
import { EpisodeRowSkeleton } from "@/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Episode {
  id: number;
  number: number;
  title: string;
  overview: string;
  still_url: string;
  air_date: string;
  runtime: number | null;
}

interface SeasonDetail {
  id: number;
  number: number;
  name: string;
  overview: string;
  episodes: Episode[];
}

interface WatchedItem {
  episode: { id: number };
}

export default function SeasonPage({
  params,
}: {
  params: Promise<{ id: string; number: string }>;
}) {
  const { id, number } = use(params);
  const t = useTranslations("show");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const useTmdb = searchParams.get("tmdb") === "1";
  const queryClient = useQueryClient();

  const [watchedIds, setWatchedIds] = useState<Set<number>>(new Set());

  // First get the show detail to resolve local id, then fetch season
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ["show", id, useTmdb],
    queryFn: async () => {
      const endpoint = useTmdb ? `/api/shows/${id}/?tmdb=1` : `/api/shows/${id}/`;
      return api.get(endpoint).then((r) => r.data);
    },
  });

  const showId = show?.id;

  const { data: season, isLoading: seasonLoading } = useQuery({
    queryKey: ["season", showId, number],
    queryFn: () =>
      api.get(`/api/shows/${showId}/seasons/${number}/`).then((r) => r.data as SeasonDetail),
    enabled: !!showId,
  });

  // Fetch watched episodes for this user (best-effort; ignore errors when not authed)
  const { data: watched } = useQuery({
    queryKey: ["watched-episodes"],
    queryFn: () => api.get("/api/tracking/watchlist/").then(() => {
      // We use a dedicated query below for actual watched episodes.
      return null;
    }),
    enabled: false,
    retry: false,
  });
  void watched;

  // Mark episodes watched via the watched_episodes endpoint. Since we don't
  // have a list endpoint exposed yet, derive from stats activity. For MVP,
  // track locally in state and sync to backend on toggle.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = JSON.parse(localStorage.getItem("tvtime_watched") || "[]");
    setWatchedIds(new Set(stored));
  }, []);

  const persistWatched = (ids: Set<number>) => {
    localStorage.setItem("tvtime_watched", JSON.stringify([...ids]));
  };

  const toggleEpisode = async (episodeId: number) => {
    const next = new Set(watchedIds);
    const willWatch = !next.has(episodeId);
    if (willWatch) next.add(episodeId);
    else next.delete(episodeId);
    setWatchedIds(next);
    persistWatched(next);

    // Optimistic update — try backend, ignore failure (offline / unauth)
    try {
      await api.post(`/api/tracking/episodes/${episodeId}/watch/`, {
        watched: willWatch,
      });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    } catch {
      // silent: keep optimistic local state
    }
  };

  const loading = showLoading || seasonLoading;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {t("season")} {number}
      </button>

      {/* Header */}
      {season && (
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {season.name || `${t("season")} ${number}`}
          </h1>
          {season.overview && (
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              {season.overview}
            </p>
          )}
        </div>
      )}

      {/* Episodes list */}
      <div className="space-y-1">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <EpisodeRowSkeleton key={i} />)
        ) : season?.episodes.length ? (
          season.episodes.map((ep) => (
            <EpisodeRow
              key={ep.id}
              number={ep.number}
              title={ep.title}
              overview={ep.overview}
              airDate={ep.air_date}
              runtime={ep.runtime ?? undefined}
              stillUrl={ep.still_url}
              isWatched={watchedIds.has(ep.id)}
              onToggle={() => toggleEpisode(ep.id)}
              locale={locale}
            />
          ))
        ) : (
          <div className="glass-card p-8 text-center text-[var(--text-muted)]">
            No episodes in this season yet.
          </div>
        )}
      </div>
    </div>
  );
}
