"use client";

import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { BentoGrid, BentoItem } from "@/components/ui/BentoGrid";
import { BentoSkeleton } from "@/components/ui/Skeleton";
import { Eye, Clock, Play, CheckCircle, Calendar, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Stats {
  episodes_watched: number;
  total_minutes: number;
  total_hours: number;
  shows_watching: number;
  shows_completed: number;
  shows_planned: number;
  top_genres: { name: string; count: number }[];
}

export default function StatsPage() {
  const t = useTranslations("stats");
  const locale = useLocale();
  const router = useRouter();

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => api.get("/api/tracking/stats/").then((r) => r.data),
    retry: false,
    meta: { onError: () => router.push(`/${locale}/auth/login`) },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
        <BentoGrid>
          <BentoSkeleton />
          <BentoSkeleton />
          <BentoSkeleton />
          <BentoSkeleton />
        </BentoGrid>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: t("episodesWatched"),
      value: stats.episodes_watched,
      icon: <Eye size={20} />,
      color: "from-purple-500 to-pink-500",
    },
    {
      label: t("totalHours"),
      value: stats.total_hours,
      icon: <Clock size={20} />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: t("showsWatching"),
      value: stats.shows_watching,
      icon: <Play size={20} />,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: t("showsCompleted"),
      value: stats.shows_completed,
      icon: <CheckCircle size={20} />,
      color: "from-orange-500 to-red-500",
    },
    {
      label: t("showsPlanned"),
      value: stats.shows_planned,
      icon: <Calendar size={20} />,
      color: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Stat cards */}
      <BentoGrid>
        {cards.map((c) => (
          <BentoItem key={c.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">{c.label}</p>
                <p className="text-3xl font-bold mt-2">{c.value}</p>
              </div>
              <div
                className={`p-2.5 rounded-xl bg-gradient-to-br ${c.color} text-white`}
              >
                {c.icon}
              </div>
            </div>
          </BentoItem>
        ))}

        {/* Genres chart */}
        {stats.top_genres.length > 0 && (
          <BentoItem colSpan={3}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={20} className="text-[var(--accent-purple)]" />
              <h2 className="text-lg font-semibold">{t("topGenres")}</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.top_genres}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(124,58,237,0.08)" }}
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "12px",
                      color: "var(--text-primary)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#gradient)"
                    radius={[8, 8, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BentoItem>
        )}
      </BentoGrid>
    </div>
  );
}
