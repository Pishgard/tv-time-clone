"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn, getTMDBImage, formatDate } from "@/lib/utils";
import type { ShowSummary } from "@/lib/types";

interface ShowCardProps {
  show: ShowSummary;
  className?: string;
}

export function ShowCard({ show, className }: ShowCardProps) {
  const t = useTranslations("show");
  const locale = useLocale();
  const href = `/${locale}/show/${show.tmdb_id || show.id}${
    show.tmdb_id ? "?tmdb=1" : ""
  }`;

  const posterSrc =
    show.poster_url ||
    (show.poster_path ? getTMDBImage(show.poster_path) : "/placeholder-poster.svg");

  const genreNames = Array.isArray(show.genres)
    ? show.genres
        .map((g: string | { name_en: string; name_fa: string }) =>
          typeof g === "string" ? g : locale === "fa" ? g.name_fa : g.name_en,
        )
        .slice(0, 2)
    : [];

  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="glass-card overflow-hidden">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-t-[var(--radius-xl)]">
          <Image
            src={posterSrc}
            alt={show.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          />
          {/* Rating badge */}
          {(show.rating ?? 0) > 0 && (
            <div className="absolute top-2 right-2 glass flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              {(show.rating ?? 0).toFixed(1)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          <h3 className="font-semibold text-sm truncate text-[var(--text-primary)]">
            {show.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            {show.first_air_date && (
              <span>{formatDate(show.first_air_date, locale)}</span>
            )}
          </div>
          {genreNames.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {genreNames.map((g) => (
                <span
                  key={g}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-glass)] text-[var(--text-muted)]"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
