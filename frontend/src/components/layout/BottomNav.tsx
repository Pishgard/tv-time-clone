"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Compass, Search, BarChart3, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { key: "dashboard", icon: LayoutDashboard },
  { key: "discover", icon: Compass },
  { key: "search", icon: Search },
  { key: "stats", icon: BarChart3 },
  { key: "activity", icon: Activity },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 glass border-t border-[var(--border-glass)] md:hidden">
      <div className="flex items-center justify-around h-16">
        {links.map(({ key, icon: Icon }) => {
          const href = `/${locale}/${key}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                isActive
                  ? "text-[var(--accent-purple)]"
                  : "text-[var(--text-muted)]",
              )}
            >
              <Icon size={20} />
              <span className="text-[10px]">{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
