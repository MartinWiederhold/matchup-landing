import { DEFAULT_LOCALE, type Locale } from "./config";
import { messages } from "./messages";

export type { Locale };

function lookup(locale: Locale, key: string): unknown {
  const parts = key.split(".");
  let cur: unknown = messages[locale];
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

/**
 * Übersetzt einen Punkt-Pfad (z. B. "header.findPartner") für die Locale.
 * Fällt auf die Default-Locale und zuletzt auf den Key selbst zurück.
 * Platzhalter im Format {name} werden aus vars ersetzt.
 */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let value = lookup(locale, key);
  if (value == null) value = lookup(DEFAULT_LOCALE, key);
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] != null ? String(vars[k]) : `{${k}}`,
  );
}

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;
