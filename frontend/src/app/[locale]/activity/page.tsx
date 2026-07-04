"use client";

import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Eye,
  MessageSquare,
  Heart,
  Play,
  UserPlus,
  Activity as ActivityIcon,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface FeedItem {
  id: number;
  user: {
    id: number;
    username: string;
    avatar: string | null;
  };
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; verb: { en: string; fa: string } }
> = {
  watched: {
    icon: <Eye size={16} />,
    color: "from-blue-500 to-cyan-500",
    verb: { en: "watched", fa: "تماشا کرد" },
  },
  commented: {
    icon: <MessageSquare size={16} />,
    color: "from-purple-500 to-pink-500",
    verb: { en: "commented on", fa: "نظر داد روی" },
  },
  liked_comment: {
    icon: <Heart size={16} />,
    color: "from-rose-500 to-red-500",
    verb: { en: "liked a comment", fa: "نظر را لایک کرد" },
  },
  started_show: {
    icon: <Play size={16} />,
    color: "from-green-500 to-emerald-500",
    verb: { en: "started watching", fa: "شروع به تماشای" },
  },
  followed: {
    icon: <UserPlus size={16} />,
    color: "from-orange-500 to-amber-500",
    verb: { en: "started following", fa: "شروع به دنبال کردن" },
  },
};

export default function ActivityPage() {
  const t = useTranslations("social");
  const locale = useLocale();

  const { data: feed, isLoading } = useQuery<FeedItem[]>({
    queryKey: ["feed"],
    queryFn: () => api.get("/api/feed/").then((r) => r.data),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <ActivityIcon size={22} className="text-[var(--accent-purple)]" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : feed?.length ? (
        <div className="space-y-3">
          {feed.map((item) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.watched;
            const target =
              (item.payload.show as string) ||
              (item.payload.title as string) ||
              (item.payload.username as string) ||
              "";

            return (
              <div key={item.id} className="glass-card p-4 flex items-start gap-3">
                <div
                  className={cn(
                    "p-2 rounded-xl bg-gradient-to-br text-white shrink-0",
                    cfg.color,
                  )}
                >
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{item.user.username}</span>{" "}
                    <span className="text-[var(--text-secondary)]">
                      {cfg.verb[locale as "en" | "fa"]}
                    </span>{" "}
                    {target && (
                      <span className="font-medium">{target}</span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {formatDate(item.created_at, locale)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <ActivityIcon
            size={48}
            className="mx-auto mb-3 text-[var(--text-muted)]"
          />
          <p className="text-[var(--text-muted)]">{t("noActivity")}</p>
        </div>
      )}
    </div>
  );
}
