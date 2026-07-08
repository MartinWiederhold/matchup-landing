import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, localeForCountry } from "@/lib/i18n/config";

/**
 * Zugangsschutz NUR noch für die nicht-öffentlichen Bereiche: die eingeloggte
 * Webapp (/app) und das Admin (/admin). Die Marketing-Seiten (Startseite,
 * /find-a-partner, /events, /shop, /beratung) sind öffentlich & crawlbar —
 * sonst kann Google nichts indexieren.
 *
 * Code/Token sind über Env-Variablen überschreibbar (SITE_GATE_CODE / _TOKEN).
 */
const GATE_TOKEN = process.env.SITE_GATE_TOKEN || "mu-unlocked-2026";

/** Die GESAMTE Seite ist hinter dem Code-Gate — nur der Lock-Screen selbst und
 *  der Freischalt-Endpoint müssen erreichbar bleiben, damit man den Code eingeben
 *  kann. Alles andere (inkl. Startseite) verlangt den Zugangscode. */
function isProtected(pathname: string): boolean {
  if (
    pathname === "/locked" ||
    pathname.startsWith("/api/unlock") ||
    pathname.startsWith("/api/qr/scan") || // QR-Scan-Zähler muss auch ohne Code erreichbar sein
    pathname.startsWith("/api/sync") || // Cron/Sync-Endpoint muss ohne Gate erreichbar sein
    pathname.startsWith("/api/prices") || // Preis-Proxy (Travelpayouts) für /map darf nicht geblockt werden
    pathname.startsWith("/api/pois") || // POI-Proxy (OpenStreetMap) für /map darf nicht geblockt werden
    pathname.startsWith("/reset-password") // Passwort-Reset-Link aus der Mail muss offen sein
  )
    return false;
  return true;
}

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

  // Öffentliche Marketing-Seiten + Lock-/Unlock-/Version-Endpoints: frei.
  if (!isProtected(pathname)) {
    const res = NextResponse.next();
    ensureLocaleCookie(request, res);
    return res;
  }

  // Geschützt (/app, /admin): gültiges Gate-Cookie nötig.
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
