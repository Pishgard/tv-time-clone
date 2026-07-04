import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as "en" | "fa")) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const isRtl = locale === "fa";

  return (
    <NextIntlClientProvider messages={messages}>
      <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 pb-20 md:pb-0">{children}</main>
        <BottomNav />
      </div>
    </NextIntlClientProvider>
  );
}
