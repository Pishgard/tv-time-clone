"use client";

import { use, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import api from "@/lib/api";
import { getTMDBImage, formatDate, cn } from "@/lib/utils";
import { Star, Calendar, Tv, Plus, Check, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ShowDetail {
  id: number;
  source: string;
  tmdb_id: number | null;
  title: string;
  overview: string;
  poster_path: string;
  poster_url: string;
  backdrop_path: string;
  backdrop_url: string;
  status: string;
  first_air_date: string;
  rating: number;
  vote_count: number;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: { id: number; name_en: string; name_fa: string }[];
  seasons: {
    id: number;
    number: number;
    name: string;
    overview: string;
    episode_count: number;
  }[];
}

const STATUS_OPTIONS = [
  { value: "watching", labelKey: "watching" },
  { value: "completed", labelKey: "completed" },
  { value: "plan", labelKey: "planToWatch" },
  { value: "dropped", labelKey: "dropped" },
] as const;

export default function ShowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("show");
  const td = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const useTmdb = searchParams.get("tmdb") === "1";
  const { tokens } = useAuth();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);

  const endpoint = useTmdb
    ? `/api/shows/${id}/?tmdb=1`
    : `/api/shows/${id}/`;

  const { data: show, isLoading } = useQuery({
    queryKey: ["show", id, useTmdb],
    queryFn: () => api.get(endpoint).then((r) => r.data as ShowDetail),
  });

  // Check if show is already in watchlist
  const { data: watchlist } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => api.get("/api/tracking/watchlist/").then((r) => r.data),
    enabled: !!tokens,
  });

  // Sync current status from watchlist
  const existing = watchlist?.find(
    (w: { show: { id: number }; status: string }) =>
      w.show.id === show?.id || (show?.tmdb_id && w.show.id === show.tmdb_id),
  );
  if (existing && currentStatus === null) {
    setCurrentStatus(existing.status);
  }

  const addToWatchlist = async (status: string) => {
    if (!tokens) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    setAdding(true);
    try {
      await api.post("/api/tracking/watchlist/", {
        show: show?.id,
        status,
      });
      setCurrentStatus(status);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(td(status as "watching"));
    } catch {
      toast.error("Failed to update.");
    } finally {
      setAdding(false);
    }
  };

  if (isLoading || !show) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-64 w-full rounded-2xl bg-[var(--bg-glass)]" />
        <div className="h-8 w-1/2 rounded-lg bg-[var(--bg-glass)]" />
        <div className="h-32 w-full rounded-xl bg-[var(--bg-glass)]" />
      </div>
    );
  }

  const backdrop =
    show.backdrop_url ||
    (show.backdrop_path ? getTMDBImage(show.backdrop_path, "w1280") : null);
  const poster =
    show.poster_url ||
    (show.poster_path ? getTMDBImage(show.poster_path) : "/placeholder-poster.svg");

  return (
    <div>
      {/* Backdrop hero */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        {backdrop ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backdrop}
            alt={show.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/60 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-32 relative space-y-6">
        {/* Header */}
        <div className="flex gap-6 flex-col sm:flex-row">
          {/* Poster */}
          <div className="w-32 md:w-48 shrink-0 aspect-[2/3] rounded-xl overflow-hidden glass-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={poster} alt={show.title} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold">{show.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
              {show.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  {show.rating.toFixed(1)}
                </span>
              )}
              {show.first_air_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {formatDate(show.first_air_date, locale)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Tv size={16} />
                {show.number_of_seasons} {t("seasons")}
              </span>
            </div>

            {/* Genres */}
            {show.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {show.genres.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs px-3 py-1 rounded-full glass text-[var(--text-secondary)]"
                  >
                    {locale === "fa" ? g.name_fa || g.name_en : g.name_en}
                  </span>
                ))}
              </div>
            )}

            {/* Add to list buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {STATUS_OPTIONS.map(({ value, labelKey }) => (
                <button
                  key={value}
                  onClick={() => addToWatchlist(value)}
                  disabled={adding}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    currentStatus === value
                      ? "bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] text-white"
                      : "glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {currentStatus === value ? (
                    <Check size={14} />
                  ) : adding ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  {td(labelKey as "watching")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview */}
        {show.overview && (
          <section className="glass-card p-5">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
              {t("overview")}
            </h2>
            <p className="text-[var(--text-primary)] leading-relaxed">{show.overview}</p>
          </section>
        )}

        {/* Seasons */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("seasons")}</h2>
          <div className="space-y-2">
            {show.seasons
              .filter((s) => s.number > 0)
              .map((season) => (
                <button
                  key={season.id}
                  onClick={() =>
                    router.push(
                      `/${locale}/show/${show.tmdb_id || show.id}/season/${season.number}${
                        useTmdb ? "?tmdb=1" : ""
                      }`,
                    )
                  }
                  className="w-full glass-card p-4 flex items-center justify-between hover:bg-[var(--bg-glass-hover)] transition-all"
                >
                  <div className="text-start">
                    <p className="font-medium">
                      {t("season")} {season.number}
                      {season.name && season.name !== `Season ${season.number}` && (
                        <span className="text-[var(--text-secondary)]"> — {season.name}</span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {season.episode_count} {t("episodes")}
                    </p>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-[var(--text-muted)] rtl:rotate-180"
                  />
                </button>
              ))}
            {show.seasons.filter((s) => s.number > 0).length === 0 && (
              <div className="glass-card p-8 text-center text-[var(--text-muted)]">
                No seasons available.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
