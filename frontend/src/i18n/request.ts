import { getRequestConfig } from "next-intl/server";

const locales = ["en", "fa"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) || "en";

  // Validate that the incoming locale is supported
  if (!locales.includes(locale as (typeof locales)[number])) {
    locale = "en";
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
