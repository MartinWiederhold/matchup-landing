import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/adminClient";
import { TOURNAMENTS, TOURNAMENT_URL, TOURNAMENT_PRIZE, TIER_META } from "@/lib/tournaments";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Turnier-Sync:
 *  1) Schreibt den gepflegten (öffentlich recherchierten, verifizierten) Kalender idempotent
 *     in web.tournaments (source='sync') und entfernt verwaiste sync-Zeilen.
 *  2) Weg B (best effort, additiv): entdeckt weitere Turniere aus Wikipedias öffentlicher
 *     ATP-Saisontabelle und legt NUR neue an (source='wikipedia'). Überschreibt NIE die
 *     verifizierten sync-Zeilen; Fehler brechen den Kern-Sync nicht ab.
 *
 * Schutz: mit gesetztem CRON_SECRET nur via Vercel-Cron-Header oder ?secret=.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

const WIKI_YEAR = 2026;
const MON: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const TIER_MAP: Record<string, string> = { "Grand Slam": "GS", "ATP Finals": "ATP1000", "ATP Masters 1000": "ATP1000", "ATP 1000": "ATP1000", "ATP 500": "ATP500", "ATP 250": "ATP250" };
const SURF_MAP: Record<string, string> = { Hard: "Hartplatz", Clay: "Sand", Grass: "Rasen", Carpet: "Hartplatz" };

function isoDate(d: string, year = WIKI_YEAR): string | null {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(d);
  if (!m) return null;
  const mo = MON[m[2].slice(0, 3)];
  if (!mo) return null;
  return `${year}-${String(mo).padStart(2, "0")}-${String(parseInt(m[1], 10)).padStart(2, "0")}`;
}
function cleanCity(s: string): string {
  let c = s.trim();
  if (c.includes("|")) c = c.split("|").pop()!;
  c = c.replace(/\[\[|\]\]/g, "").replace(/\s*\(.*?\)\s*/g, "").trim();
  return c;
}
function normCity(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
}
function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function endFrom(start: string): string {
  return new Date(Date.parse(start) + 6 * 86400000).toISOString().slice(0, 10);
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function geocode(city: string, country: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const u = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: `${city}, ${country}`, format: "json", limit: "1" })}`;
    const r = await fetch(u, { headers: { "User-Agent": "MatchupMap/1.0 (wiederhold.martin@web.de)" } });
    const d = (await r.json()) as { lat: string; lon: string }[];
    if (d?.[0]) return { lat: Math.round(parseFloat(d[0].lat) * 1e6) / 1e6, lng: Math.round(parseFloat(d[0].lon) * 1e6) / 1e6 };
  } catch {}
  return null;
}

type Parsed = { id: string; name: string; city: string; country: string; tier: string; surface: string; start: string; end: string; prize: number | null };

function parseWikipedia(txt: string): Parsed[] {
  const dateCells: { pos: number; d: string }[] = [];
  for (const m of txt.matchAll(/\|(?:rowspan=\d+\|)?(\d{1,2}\s+[A-Za-z]{3,9})(?:<br\s*\/?>\s*\d{1,2}\s+[A-Za-z]{3,9})?\s*\|\|/g)) {
    dateCells.push({ pos: m.index ?? 0, d: m[1] });
  }
  const pat = /\[\[20\d\d\s+[^\]|]+\|([^\]]+)\]\]<br\s*\/?>\s*(\[\[[^\]]+\]\]|[^<,]+?),\s*([^<]+?)<br\s*\/?>\s*(Grand Slam|ATP Finals|ATP Masters 1000|ATP 1000|ATP 500|ATP 250)<br\s*\/?>\s*(Hard|Clay|Grass|Carpet)/g;
  const byName: Record<string, Parsed> = {};
  for (const m of txt.matchAll(pat)) {
    const pos = m.index ?? 0;
    let start: string | null = null;
    for (const dc of dateCells) if (dc.pos < pos) start = isoDate(dc.d);
    const tier = TIER_MAP[m[4].trim()];
    const surf = SURF_MAP[m[5]];
    if (!start || !tier || !surf) continue;
    const name = m[1].trim();
    const city = cleanCity(m[2]);
    const country = m[3].trim();
    if (!city || !country) continue;
    const pm = /\$([\d,]+)/.exec(txt.slice(m.index! + m[0].length, m.index! + m[0].length + 90));
    const prize = pm ? Math.round((parseInt(pm[1].replace(/,/g, ""), 10) * 0.92) / 100) * 100 : null;
    byName[name] = { id: slugify(name), name, city, country, tier, surface: surf, start, end: endFrom(start), prize };
  }
  return Object.values(byName);
}

async function runSync() {
  const svc = getServiceClient();
  const now = new Date().toISOString();
  const rows = TOURNAMENTS.map((t) => ({
    id: t.id, name: t.name, city: t.city, country: t.country, lat: t.lat, lng: t.lng,
    tier: t.tier, surface: t.surface, indoor: t.indoor, start_date: t.start, end_date: t.end,
    url: t.url ?? TOURNAMENT_URL[t.id] ?? null, prize: t.prize ?? TOURNAMENT_PRIZE[t.id] ?? TIER_META[t.tier].prize,
    source: "sync", status: "active", updated_at: now,
  }));
  const { error } = await svc.from("tournaments").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);

  // verwaiste 'sync'-Zeilen entfernen (robust per Diff); 'wikipedia'-Zeilen bleiben
  const canon = new Set(rows.map((r) => r.id));
  const { data: existing } = await svc.from("tournaments").select("id,city,lat,lng,start_date,source");
  const orphans = (existing ?? []).filter((r) => r.source === "sync" && !canon.has(r.id as string)).map((r) => r.id as string);
  if (orphans.length) await svc.from("tournaments").delete().in("id", orphans);

  return { synced: rows.length, existing: existing ?? [] };
}

async function discover(existing: { id: string; city: string | null; lat: number | null; lng: number | null; start_date: string | null }[]) {
  const res = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(WIKI_YEAR + " ATP Tour")}&prop=wikitext&format=json&formatversion=2`, {
    headers: { "User-Agent": "MatchupMap/1.0 (wiederhold.martin@web.de)" },
  });
  const txt = (await res.json())?.parse?.wikitext as string | undefined;
  if (!txt) return { discovered: 0, added: 0 };
  const parsed = parseWikipedia(txt);

  // 1. Vorfilter (billig): gleiche Stadt+Monat oder gleiche id → sicher Duplikat, kein Geocode nötig
  const have = new Set(existing.filter((r) => r.city && r.start_date).map((r) => `${normCity(r.city!)}-${r.start_date!.slice(5, 7)}`));
  const haveIds = new Set(existing.map((r) => r.id));
  const candidates = parsed.filter((p) => !have.has(`${normCity(p.city)}-${p.start.slice(5, 7)}`) && !haveIds.has(p.id));
  const existingGeo = existing.filter((r) => r.lat != null && r.lng != null && r.start_date);

  const svc = getServiceClient();
  let added = 0;
  for (const p of candidates.slice(0, 12)) {
    const geo = await geocode(p.city, p.country);
    if (!geo) continue;
    // 2. Geo-Nähe-Dedup: gleiche Location (≤60 km) + ±12 Tage → selbes Turnier (fängt DE/EN-Namen)
    const pStart = Date.parse(p.start);
    const dup = existingGeo.some(
      (r) => haversineKm(geo.lat, geo.lng, r.lat!, r.lng!) < 60 && Math.abs(Date.parse(r.start_date!) - pStart) < 12 * 86400000,
    );
    if (dup) continue;
    const { error } = await svc.from("tournaments").upsert(
      [{ id: p.id, name: p.name, city: p.city, country: p.country, lat: geo.lat, lng: geo.lng, tier: p.tier, surface: p.surface, indoor: false, start_date: p.start, end_date: p.end, url: null, prize: p.prize ?? TIER_META[p.tier as keyof typeof TIER_META].prize, source: "wikipedia", status: "active", updated_at: new Date().toISOString() }],
      { onConflict: "id" },
    );
    if (!error) added++;
  }
  return { discovered: parsed.length, added };
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { synced, existing } = await runSync();
    let wiki = { discovered: 0, added: 0 };
    try {
      wiki = await discover(existing);
    } catch (e) {
      wiki = { discovered: -1, added: 0 };
      console.error("wiki discover failed", e);
    }
    return NextResponse.json({ ok: true, synced, wiki, at: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export const POST = GET;
