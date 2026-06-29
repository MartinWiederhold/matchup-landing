import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Globaler Zugangsschutz: Die ganze Seite ist hinter einem Code (Standard 5080)
 * versteckt. Ohne gültiges Cookie wird jede Seite serverseitig auf den
 * Lock-Screen umgeschrieben — es wird also kein Inhalt ausgeliefert.
 *
 * Code/Token sind über Env-Variablen überschreibbar (SITE_GATE_CODE / _TOKEN).
 */
const GATE_TOKEN = process.env.SITE_GATE_TOKEN || "mu-unlocked-2026";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lock-Screen, Entsperr- und Versions-Endpoint sind immer erreichbar.
  if (
    pathname === "/locked" ||
    pathname.startsWith("/api/unlock") ||
    pathname.startsWith("/api/version")
  ) {
    return NextResponse.next();
  }

  const unlocked = request.cookies.get("mu_gate")?.value === GATE_TOKEN;
  if (unlocked) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/locked";
  return NextResponse.rewrite(url);
}

export const config = {
  // Statische Assets / Bilder ausnehmen, damit der Lock-Screen geladen werden kann.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt)$).*)",
  ],
};
