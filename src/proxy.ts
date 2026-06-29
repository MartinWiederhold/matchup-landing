import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, localeForCountry } from "@/lib/i18n/config";

/**
 * Globaler Zugangsschutz: Die ganze Seite ist hinter einem Code (Standard 5080)
 * versteckt. Ohne gültiges Cookie wird jede Seite serverseitig auf den
 * Lock-Screen umgeschrieben — es wird also kein Inhalt ausgeliefert.
 *
 * Code/Token sind über Env-Variablen überschreibbar (SITE_GATE_CODE / _TOKEN).
 */
const GATE_TOKEN = process.env.SITE_GATE_TOKEN || "mu-unlocked-2026";

/**
 * Setzt — falls noch nicht vorhanden — das Sprach-Cookie anhand des Landes
 * (Vercel-Geo-Header). DE/AT/CH → Deutsch, sonst Englisch. Eine manuelle
 * Auswahl (bereits gesetztes Cookie) wird nie überschrieben.
 */
function ensureLocaleCookie(request: NextRequest, response: NextResponse) {
  if (request.cookies.get(LOCALE_COOKIE)) return;
  const country = request.headers.get("x-vercel-ip-country");
  response.cookies.set(LOCALE_COOKIE, localeForCountry(country), {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lock-Screen, Entsperr- und Versions-Endpoint sind immer erreichbar.
  if (
    pathname === "/locked" ||
    pathname.startsWith("/api/unlock") ||
    pathname.startsWith("/api/version")
  ) {
    const res = NextResponse.next();
    ensureLocaleCookie(request, res);
    return res;
  }

  const unlocked = request.cookies.get("mu_gate")?.value === GATE_TOKEN;
  if (unlocked) {
    const res = NextResponse.next();
    ensureLocaleCookie(request, res);
    return res;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/locked";
  const res = NextResponse.rewrite(url);
  ensureLocaleCookie(request, res);
  return res;
}

export const config = {
  // Statische Assets / Bilder ausnehmen, damit der Lock-Screen geladen werden kann.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt)$).*)",
  ],
};
