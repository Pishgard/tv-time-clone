"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    preferred_language: locale,
  });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (form.password.length < 8) errs.push(t("passwordMin"));
    if (form.password !== form.password2) errs.push(t("passwordMatch"));
    if (errs.length) {
      setErrors(errs);
      return;
    }
    try {
      await register(form);
      toast.success(tc("register") + "!");
      router.push(`/${locale}/dashboard`);
    } catch {
      toast.error("Registration failed. Try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] bg-clip-text text-transparent">
            {t("registerTitle")}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">{t("registerSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {errors.map((err) => (
            <p key={err} className="text-red-400 text-sm">{err}</p>
          ))}

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
              {t("username")}
            </label>
            <input
              required
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
              {t("email")}
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
              {t("password")}
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
              {t("confirmPassword")}
            </label>
            <input
              type="password"
              required
              value={form.password2}
              onChange={(e) => update("password2", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
              {t("language")}
            </label>
            <select
              value={form.preferred_language}
              onChange={(e) => update("preferred_language", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors"
            >
              <option value="en">English</option>
              <option value="fa">فارسی</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-accent w-full flex items-center justify-center gap-2 py-3"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : t("registerBtn")}
          </button>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            {t("hasAccount")}{" "}
            <Link
              href={`/${locale}/auth/login`}
              className="text-[var(--accent-purple)] hover:underline"
            >
              {tc("login")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
