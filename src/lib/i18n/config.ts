export type Locale = "de" | "en";

export const LOCALES: Locale[] = ["de", "en"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "mu_locale";

/** Länder, die standardmässig Deutsch sehen. Alle anderen → Englisch. */
const DE_COUNTRIES = new Set(["DE", "AT", "CH"]);

export function localeForCountry(country?: string | null): Locale {
  if (country && DE_COUNTRIES.has(country.toUpperCase())) return "de";
  return DEFAULT_LOCALE;
}

export function isLocale(value: unknown): value is Locale {
  return value === "de" || value === "en";
}
