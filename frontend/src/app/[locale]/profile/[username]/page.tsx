"use client";

import { use, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ShowCard } from "@/components/ui/ShowCard";
import { ShowCardSkeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { UserPlus, UserCheck, Settings, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface Profile {
  id: number;
  username: string;
  avatar: string | null;
  bio: string;
  is_private: boolean;
  followers_count: number;
  following_count: number;
}

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

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const t = useTranslations("profile");
  const ts = useTranslations("social");
  const td = useTranslations("dashboard");
  const locale = useLocale();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [following, setFollowing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["user", username],
    queryFn: () => api.get(`/api/auth/users/${username}/`).then((r) => r.data),
  });

  // Only fetch watchlist if viewing own profile or non-private profile
  const isOwn = currentUser?.username === username;
  const canSeeList = isOwn || !profile?.is_private;

  const { data: watchlist } = useQuery<WatchlistItem[]>({
    queryKey: ["watchlist", username],
    queryFn: () => api.get("/api/tracking/watchlist/").then((r) => r.data),
    enabled: canSeeList && isOwn, // Only own list for MVP
  });

  const toggleFollow = async () => {
    try {
      const { data } = await api.post(`/api/follow/${username}/`);
      setFollowing(data.following);
      queryClient.invalidateQueries({ queryKey: ["user", username] });
      toast.success(data.following ? ts("follow") : ts("unfollow"));
    } catch {
      toast.error("Failed.");
    }
  };

  const saveBio = async () => {
    try {
      await api.patch("/api/me/", { bio });
      queryClient.invalidateQueries({ queryKey: ["user", username] });
      setEditing(false);
      toast.success("Saved");
    } catch {
      toast.error("Failed to save.");
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="skeleton h-40" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShowCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const filtered =
    filter === "all"
      ? watchlist
      : watchlist?.filter((w) => w.status === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile header */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {profile.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              {isOwn ? (
                <button
                  onClick={() => {
                    setBio(profile.bio);
                    setEditing(true);
                  }}
                  className="glass px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-[var(--bg-glass-hover)]"
                >
                  <Settings size={14} />
                  {t("editProfile")}
                </button>
              ) : (
                <button
                  onClick={toggleFollow}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${
                    following
                      ? "glass text-[var(--text-secondary)]"
                      : "btn-accent"
                  }`}
                >
                  {following ? (
                    <>
                      <UserCheck size={14} />
                      {ts("unfollow")}
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      {ts("follow")}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-3">
              <Stat value={profile.followers_count} label={ts("followers")} />
              <Stat value={profile.following_count} label={ts("following")} />
            </div>
          </div>
        </div>

        {/* Bio */}
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)] resize-none"
              rows={3}
              placeholder={t("bio")}
            />
            <div className="flex gap-2">
              <button onClick={saveBio} className="btn-accent text-sm">
                {t("editProfile")}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="glass px-4 py-2 rounded-xl text-sm hover:bg-[var(--bg-glass-hover)]"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          profile.bio && (
            <p className="text-sm text-[var(--text-secondary)]">{profile.bio}</p>
          )
        )}
        {!profile.bio && !editing && (
          <p className="text-sm text-[var(--text-muted)]">{t("noBio")}</p>
        )}
      </div>

      {/* Watchlist */}
      {canSeeList ? (
        <section className="space-y-4">
          {/* Filter tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold">{t("watchlist")}</h2>
            {isOwn && (
              <div className="flex gap-1.5">
                {["all", "watching", "completed", "plan"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filter === s
                        ? "bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] text-white"
                        : "glass text-[var(--text-secondary)]"
                    }`}
                  >
                    {s === "all" ? "All" : td(s as "watching")}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filtered && filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <ShowCard key={item.id} show={item.show} />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-[var(--text-muted)]">
              {td("noShows")}
            </div>
          )}
        </section>
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-[var(--text-muted)]">
            {locale === "fa" ? "این پروفایل خصوصی است" : "This profile is private"}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <span className="font-bold">{value}</span>{" "}
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}
