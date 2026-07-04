"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ShowCard } from "@/components/ui/ShowCard";
import { ShowCardSkeleton } from "@/components/ui/Skeleton";
import { TrendingUp, Star, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShowSummary } from "@/lib/types";

type BrowseKind = "popular" | "trending" | "top_rated";

export default function DiscoverPage() {
  const t = useTranslations("discover");
  const locale = useLocale();
  const [kind, setKind] = useState<BrowseKind>("popular");

  const { data, isLoading } = useQuery({
    queryKey: ["browse", kind],
    queryFn: () => api.get(`/api/browse/?kind=${kind}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const results = data?.results || [];

  const tabs: { key: BrowseKind; label: string; icon: React.ReactNode }[] = [
    { key: "popular", label: t("popular"), icon: <Flame size={16} /> },
    { key: "trending", label: t("trending"), icon: <TrendingUp size={16} /> },
    { key: "top_rated", label: t("topRated"), icon: <Star size={16} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setKind(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              kind === key
                ? "bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] text-white"
                : "glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <ShowCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-[var(--text-muted)]">
            {kind === "popular"
              ? "No results from TMDB. Add your API key to the backend .env"
              : "No shows found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((show: ShowSummary, i: number) => (
            <ShowCard key={show.tmdb_id || show.id || i} show={show} />
          ))}
        </div>
      )}
    </div>
  );
}
