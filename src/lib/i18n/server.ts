import { cookies, headers } from "next/headers";
import {
  isLocale,
  localeForCountry,
  LOCALE_COOKIE,
  type Locale,
} from "./config";
import { translate } from "./core";

/**
 * Ermittelt die Locale serverseitig: bevorzugt das gesetzte Cookie
 * (manuelle Wahl), sonst Vercel-Geo-Header (Land), sonst Default (en).
 */
export async function getLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  const country = (await headers()).get("x-vercel-ip-country");
  return localeForCountry(country);
}

export async function getT() {
  const locale = await getLocale();
  return (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}
