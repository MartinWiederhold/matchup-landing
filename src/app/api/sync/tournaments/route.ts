import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/adminClient";
import { TOURNAMENTS, TOURNAMENT_URL, TOURNAMENT_PRIZE, TIER_META } from "@/lib/tournaments";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Turnier-Sync: schreibt den gepflegten (öffentlich recherchierten) Turnierkalender
 * idempotent in die DB (web.tournaments). Läuft täglich per Vercel-Cron und hält die
 * Daten selbstheilend aktuell; neue Turniere wachsen einfach über diese eine Quelle.
 *
 * Schutz: Wenn CRON_SECRET gesetzt ist, muss der Aufruf entweder den Vercel-Cron-Header
 * `Authorization: Bearer <CRON_SECRET>` oder `?secret=<CRON_SECRET>` mitbringen.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // ohne konfiguriertes Secret offen (Dev/erstes Seeding)
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

async function runSync() {
  const svc = getServiceClient();
  const now = new Date().toISOString();
  const rows = TOURNAMENTS.map((t) => ({
    id: t.id,
    name: t.name,
    city: t.city,
    country: t.country,
    lat: t.lat,
    lng: t.lng,
    tier: t.tier,
    surface: t.surface,
    indoor: t.indoor,
    start_date: t.start,
    end_date: t.end,
    url: TOURNAMENT_URL[t.id] ?? null,
    prize: TOURNAMENT_PRIZE[t.id] ?? TIER_META[t.tier].prize,
    source: "sync",
    status: "active",
    updated_at: now,
  }));
  const { error } = await svc.from("tournaments").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);

  // Verwaiste 'sync'-Zeilen entfernen (Kalender geändert). Robust per Diff + .in-Delete,
  // damit keine alten IDs als Doppel-Marker hängen bleiben. 'wikipedia'-Zeilen bleiben unberührt.
  const canon = new Set(rows.map((r) => r.id));
  const { data: existing } = await svc.from("tournaments").select("id").eq("source", "sync");
  const orphans = (existing ?? []).map((r) => r.id as string).filter((id) => !canon.has(id));
  if (orphans.length) await svc.from("tournaments").delete().in("id", orphans);

  return rows.length;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const synced = await runSync();
    return NextResponse.json({ ok: true, synced, at: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export const POST = GET;
