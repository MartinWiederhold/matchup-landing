import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, localeForCountry } from "@/lib/i18n/config";

/**
 * Vorstart-Zugangscode (Seiten-Gate) ENTFERNT: Die Seite ist öffentlich ohne Code
 * erreichbar und crawlbar. Der Selbstschutz der nicht-öffentlichen Bereiche bleibt
 * bestehen — /app über den Supabase-Login (AuthScreen), /admin über Login +
 * E-Mail-Allowlist (AdminShell). Compete/Tour bleibt SEPARAT hinter der Warteliste
 * (src/lib/tour.ts, Code 50805080) — das ist hier bewusst NICHT angefasst.
 *
 * Die Middleware setzt jetzt nur noch das Sprach-Cookie anhand des Landes.
 * Der frühere Lock-Screen (/locked) und /api/unlock bleiben ungenutzt im Repo;
 * ein git-Revert dieses Commits reaktiviert das Gate vollständig.
 */

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
  // Kein Zugangscode mehr: alles frei durchlassen, nur das Sprach-Cookie setzen.
  const res = NextResponse.next();
  ensureLocaleCookie(request, res);
  return res;
}

export const config = {
  // Statische Assets / Bilder ausnehmen.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt)$).*)",
  ],
};
