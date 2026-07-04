"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ShowCard } from "@/components/ui/ShowCard";
import { ShowCardSkeleton } from "@/components/ui/Skeleton";
import { Search as SearchIcon } from "lucide-react";
import type { ShowSummary } from "@/lib/types";

export default function SearchPage() {
  const tc = useTranslations("common");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => api.get(`/api/shows/?search=${encodeURIComponent(debounced)}`).then((r) => r.data),
    enabled: debounced.length >= 2,
  });

  const localResults = data?.results || [];
  const tmdbResults = data?.tmdb_results || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Search input */}
      <div className="relative max-w-xl mx-auto">
        <SearchIcon
          size={20}
          className="absolute top-1/2 start-4 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${tc("search")}…`}
          className="w-full ps-12 pe-4 py-4 rounded-2xl glass border-[var(--border-glass)] bg-[var(--bg-glass)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] transition-all text-lg"
          autoFocus
        />
      </div>

      {/* Results */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShowCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && localResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Library</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {localResults.map((show: ShowSummary, i: number) => (
              <ShowCard key={show.id || i} show={show} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && tmdbResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">TMDB</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tmdbResults.map((show: ShowSummary, i: number) => (
              <ShowCard key={show.tmdb_id || i} show={show} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && debounced.length >= 2 && localResults.length === 0 && tmdbResults.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-[var(--text-muted)]">No results found for &quot;{debounced}&quot;</p>
        </div>
      )}

      {debounced.length < 2 && (
        <div className="glass-card p-12 text-center">
          <SearchIcon size={48} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-[var(--text-secondary)]">
            {locale === "fa" ? "برای جستجو حداقل ۲ حرف وارد کنید" : "Type at least 2 characters to search"}
          </p>
        </div>
      )}
    </div>
  );
}
