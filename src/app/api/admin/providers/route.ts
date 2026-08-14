import { NextResponse } from "next/server";
import { getServiceClient, verifyAdmin, bearerToken } from "@/lib/adminClient";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

/**
 * Admin-Verwaltung der Anbieter (web.service_providers) für redaktionelle Einträge.
 * Alle Schreibzugriffe laufen server-seitig mit service_role NACH verifyAdmin — nie über
 * den Anon-Client. Redaktionelle Einträge tragen source='editorial' und created_by=NULL
 * (Martin ist nicht der Anbieter → keine In-App-Anfrage landet bei ihm, kein Bild).
 * Koordinaten werden aus Stadt+Land über Nominatim geocodet (1 Req/s, aussagekräftiger UA).
 *
 *   GET    /api/admin/providers?q=       → { rows }        (editorial + directory, zum Kuratieren)
 *   POST   /api/admin/providers          → { row, warning? } (anlegen, geocodet)
 *   PATCH  /api/admin/providers          → { row, warning? } (bearbeiten, re-geocodet)
 *   DELETE /api/admin/providers?id=      → { ok }
 */

const CATEGORIES = ["coach", "physio", "stringer", "sc", "mental", "nutrition", "hitting", "tour_companion"];
const UA = "MatchupTour/1.0 (+https://matchup-app.com; wiederhold.martin@web.de)";

// Nominatim-Richtlinie: max. 1 Request/Sekunde. Serialisiert Geocoding-Aufrufe pro warmer
// Instanz — trägt Martin 20 hintereinander ein, warten die Requests brav aufeinander.
let lastGeoAt = 0;
async function geocode(city: string, countryIso: string): Promise<{ lat: number; lng: number } | null> {
  const wait = 1000 - (Date.now() - lastGeoAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastGeoAt = Date.now();
  const p = new URLSearchParams({ q: city.trim(), format: "jsonv2", limit: "1" });
  const iso = countryIso.trim().toLowerCase();
  if (iso) p.set("countrycodes", iso);
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${p.toString()}`, {
      headers: { "User-Agent": UA, "Accept-Language": "en" },
    });
    if (!r.ok) return null;
    const d = (await r.json()) as Array<{ lat: string; lon: string }>;
    const hit = Array.isArray(d) ? d[0] : null;
    if (!hit) return null;
    const lat = Number(hit.lat), lng = Number(hit.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

function normalizeUrl(u: unknown): string | null {
  const s = String(u ?? "").trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

/** Eingabe → DB-Felder. Gibt {fields} oder {error} zurück. */
function parseBody(b: Record<string, unknown>) {
  const name = String(b.name ?? "").trim();
  const category = String(b.category ?? "").trim();
  const city = String(b.city ?? "").trim();
  const country = String(b.country ?? "").trim().toUpperCase();
  if (name.length < 2) return { error: "Name fehlt" };
  if (!CATEGORIES.includes(category)) return { error: "Ungültige Kategorie" };
  if (city.length < 2) return { error: "Stadt fehlt" };
  if (country.length < 2) return { error: "Land (ISO, z. B. CH) fehlt" };
  const priceRaw = b.price_from;
  const price_from = priceRaw === "" || priceRaw == null ? null : Number(priceRaw);
  const languages = Array.isArray(b.languages)
    ? (b.languages as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : String(b.languages ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    fields: {
      name,
      category,
      city,
      country,
      website: normalizeUrl(b.website),
      contact_email: String(b.contact_email ?? "").trim() || null,
      phone: String(b.phone ?? "").trim() || null,
      price_from: price_from != null && Number.isFinite(price_from) ? price_from : null,
      price_unit: price_from != null && Number.isFinite(price_from) ? (String(b.price_unit ?? "hour").trim() || "hour") : null,
      currency: String(b.currency ?? "").trim() || "CHF",
      languages,
    },
  };
}

export async function GET(req: Request) {
  if (!(await verifyAdmin(bearerToken(req)))) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  const svc = getServiceClient();
  let query = svc
    .from("service_providers")
    .select("id,name,category,city,country,website,contact_email,phone,price_from,price_unit,currency,languages,latitude,longitude,source,created_by")
    .in("source", ["editorial", "directory"])
    .order("created_at", { ascending: false })
    .limit(300);
  if (q) query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await verifyAdmin(bearerToken(req)))) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  const parsed = parseBody((await req.json().catch(() => ({}))) as Record<string, unknown>);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const f = parsed.fields;
  const geo = await geocode(f.city, f.country);
  const svc = getServiceClient();
  const { data, error } = await svc
    .from("service_providers")
    .insert({ ...f, latitude: geo?.lat ?? null, longitude: geo?.lng ?? null, source: "editorial", created_by: null })
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ row: data, warning: geo ? null : "Koordinaten nicht gefunden — Eintrag gespeichert, erscheint aber noch nicht im Umkreis. Stadt/Land prüfen." });
}

export async function PATCH(req: Request) {
  if (!(await verifyAdmin(bearerToken(req)))) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });
  const parsed = parseBody(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const f = parsed.fields;
  const geo = await geocode(f.city, f.country); // bei Bearbeitung neu geocoden (Stadt/Land kann sich ändern)
  const svc = getServiceClient();
  const { data, error } = await svc
    .from("service_providers")
    .update({ ...f, latitude: geo?.lat ?? null, longitude: geo?.lng ?? null })
    .eq("id", id)
    .eq("source", "editorial") // nur redaktionelle Einträge über diese Maske ändern
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Nicht gefunden oder nicht redaktionell" }, { status: 404 });
  return NextResponse.json({ row: data, warning: geo ? null : "Koordinaten nicht gefunden — Stadt/Land prüfen." });
}

export async function DELETE(req: Request) {
  if (!(await verifyAdmin(bearerToken(req)))) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  const id = (new URL(req.url).searchParams.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });
  const svc = getServiceClient();
  const { error } = await svc.from("service_providers").delete().eq("id", id).eq("source", "editorial");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
