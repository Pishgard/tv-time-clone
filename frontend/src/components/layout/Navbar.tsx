"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Search,
  Moon,
  Sun,
  Globe,
  LogOut,
  User,
  LayoutDashboard,
  Compass,
  BarChart3,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Navbar() {
  const t = useTranslations("common");
  const nav = useTranslations("nav");
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const switchLocale = () => {
    const next = locale === "en" ? "fa" : "en";
    window.location.href = `/${next}`;
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-[var(--border-glass)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={`/${locale}/dashboard`}
          className="text-xl font-bold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] bg-clip-text text-transparent"
        >
          {t("appName")}
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink href={`/${locale}/dashboard`} icon={<LayoutDashboard size={16} />}>
            {nav("dashboard")}
          </NavLink>
          <NavLink href={`/${locale}/discover`} icon={<Compass size={16} />}>
            {nav("discover")}
          </NavLink>
          <NavLink href={`/${locale}/search`} icon={<Search size={16} />}>
            {nav("search")}
          </NavLink>
          <NavLink href={`/${locale}/stats`} icon={<BarChart3 size={16} />}>
            {nav("stats")}
          </NavLink>
          <NavLink href={`/${locale}/activity`} icon={<Activity size={16} />}>
            {nav("activity")}
          </NavLink>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button onClick={switchLocale} className="p-2 rounded-lg hover:bg-[var(--bg-glass-hover)] transition-colors" title={locale === "en" ? "فارسی" : "English"}>
            <Globe size={18} className="text-[var(--text-secondary)]" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-[var(--bg-glass-hover)] transition-colors"
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-[var(--text-secondary)]" />
            ) : (
              <Moon size={18} className="text-[var(--text-secondary)]" />
            )}
          </button>

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center text-white text-sm font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 glass-card p-2 space-y-1">
                  <Link
                    href={`/${locale}/profile/${user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-glass-hover)] text-sm transition-colors"
                  >
                    <User size={16} />
                    {user.username}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-glass-hover)] text-sm text-red-400 w-full transition-colors"
                  >
                    <LogOut size={16} />
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className="btn-accent text-sm"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
