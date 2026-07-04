"use client";

import { cn } from "@/lib/utils";
import { Check, Play } from "lucide-react";
import { motion } from "framer-motion";

interface EpisodeRowProps {
  number: number;
  title: string;
  overview?: string;
  airDate?: string;
  runtime?: number;
  stillUrl?: string;
  isWatched: boolean;
  onToggle: () => void;
  locale?: string;
}

export function EpisodeRow({
  number,
  title,
  overview,
  airDate,
  runtime,
  stillUrl,
  isWatched,
  onToggle,
}: EpisodeRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: number * 0.03 }}
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer group",
        "hover:bg-[var(--bg-glass-hover)]",
        isWatched && "opacity-60",
      )}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <button
        className={cn(
          "mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
          isWatched
            ? "bg-[var(--accent-purple)] border-[var(--accent-purple)]"
            : "border-[var(--text-muted)] group-hover:border-[var(--accent-purple)]",
        )}
      >
        {isWatched ? (
          <Check size={14} className="text-white" />
        ) : (
          <Play size={10} className="text-[var(--text-muted)] group-hover:text-[var(--accent-purple)]" />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] font-mono">
            E{number.toString().padStart(2, "0")}
          </span>
          <span className="text-sm font-medium truncate text-[var(--text-primary)]">
            {title || `Episode ${number}`}
          </span>
          {runtime && (
            <span className="text-xs text-[var(--text-muted)]">{runtime}m</span>
          )}
        </div>
        {overview && (
          <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
            {overview}
          </p>
        )}
      </div>
    </motion.div>
  );
}
