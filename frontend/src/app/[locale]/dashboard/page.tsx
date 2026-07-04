"use client";

import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import api from "@/lib/api";
import { ShowCard } from "@/components/ui/ShowCard";
import { BentoGrid, BentoItem } from "@/components/ui/BentoGrid";
import { BentoSkeleton, ShowCardSkeleton } from "@/components/ui/Skeleton";
import { Play, CheckCircle, Clock, XCircle, Tv } from "lucide-react";

interface WatchlistItem {
  id: number;
  show: {
    id: number;
    tmdb_id?: number;
    title: string;
    poster_path: string;
    poster_url: string;
    backdrop_url: string;
    rating: number;
    first_air_date: string;
    status: string;
    genres: string[];
  };
  status: string;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { user, tokens } = useAuth();
  const locale = useLocale();

  const { data: watchlist, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => api.get("/api/tracking/watchlist/").then((r) => r.data),
    enabled: !!tokens,
  });

  // Group by status
  const watching = watchlist?.filter((i: WatchlistItem) => i.status === "watching") || [];
  const completed = watchlist?.filter((i: WatchlistItem) => i.status === "completed") || [];
  const planned = watchlist?.filter((i: WatchlistItem) => i.status === "plan") || [];

  if (!tokens) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <Tv size={64} className="mx-auto mb-4 text-[var(--accent-purple)]" />
        <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
        <p className="text-[var(--text-secondary)]">{t("noShows")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          {t("title")} {user?.username && <span className="text-[var(--text-secondary)]">— {user.username}</span>}
        </h1>
      </div>

      {isLoading ? (
        <BentoGrid>
          <BentoSkeleton />
          <BentoSkeleton />
          <BentoSkeleton />
        </BentoGrid>
      ) : (
        <>
          {/* Watching */}
          <Section title={t("watching")} icon={<Play size={18} />} count={watching.length}>
            {watching.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {watching.map((item: WatchlistItem) => (
                  <ShowCard key={item.id} show={item.show} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </Section>

          {/* Completed */}
          {completed.length > 0 && (
            <Section title={t("completed")} icon={<CheckCircle size={18} />} count={completed.length}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {completed.map((item: WatchlistItem) => (
                  <ShowCard key={item.id} show={item.show} />
                ))}
              </div>
            </Section>
          )}

          {/* Planned */}
          {planned.length > 0 && (
            <Section title={t("planToWatch")} icon={<Clock size={18} />} count={planned.length}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {planned.map((item: WatchlistItem) => (
                  <ShowCard key={item.id} show={item.show} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[var(--accent-purple)]">{icon}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-[var(--text-muted)]">({count})</span>
      </div>
      {children}
    </section>
  );
}

function EmptyState() {
  const t = useTranslations("dashboard");
  return (
    <div className="glass-card p-8 text-center">
      <p className="text-[var(--text-muted)]">{t("noShows")}</p>
    </div>
  );
}
