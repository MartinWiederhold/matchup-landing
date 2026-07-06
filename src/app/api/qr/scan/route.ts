import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/adminClient";

export const dynamic = "force-dynamic";

/**
 * Öffentlicher QR-Scan-Endpoint (im Gate ausgenommen): zählt den Scan in
 * web.qr_scans und leitet danach zur Webapp weiter. Zählfehler brechen den
 * Redirect nie ab – der Nutzer landet immer in der App.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = `${url.origin}/app`;
  try {
    const svc = getServiceClient();
    await svc.from("qr_scans").insert({
      ua: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      ref: url.searchParams.get("ref"),
    });
  } catch {
    // Zählfehler ignorieren – Weiterleitung hat Vorrang
  }
  return NextResponse.redirect(target, 302);
}
