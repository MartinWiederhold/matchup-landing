import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * Preis-Proxy für die Saison-Planung (Travelpayouts). Der API-Token bleibt server-seitig
 * (TRAVELPAYOUTS_TOKEN) und wird NIE an den Client gegeben.
 *
 *   /api/prices?type=hotel&city=Paris&country=France&checkIn=2026-05-24&checkOut=2026-06-07
 *   /api/prices?type=flight&origin=FRA&city=Paris&date=2026-05-24
 *
 * Antwort: { configured, price, currency } — price=null wenn keine Daten. Fällt nie hart aus.
 */
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN ?? "";
const MARKER = process.env.NEXT_PUBLIC_TP_MARKER ?? "";
const UA = { "User-Agent": "MatchupMap/1.0 (wiederhold.martin@web.de)" };

async function jget(url: string): Promise<unknown | null> {
  try {
    const r = await fetch(url, { headers: UA, next: { revalidate: 3600 } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/** Stadtname → IATA-Stadtcode über die öffentliche Travelpayouts-Autocomplete (kein Token nötig). */
async function cityIata(city: string): Promise<string | null> {
  const url = `https://autocomplete.travelpayouts.com/places2?locale=en&types[]=city&term=${encodeURIComponent(city)}`;
  const d = (await jget(url)) as { code?: string; type?: string }[] | null;
  const hit = Array.isArray(d) ? d.find((x) => x.type === "city" && x.code) : null;
  return hit?.code ?? null;
}

/** Origin auflösen: ist schon ein IATA-Code (3 Buchstaben) → direkt; sonst als Stadtname
 *  über cityIata. Rückwärtskompatibel — /map übergibt echte IATA-Codes (Länge 3). */
async function resolveIata(codeOrCity: string): Promise<string | null> {
  const s = codeOrCity.trim();
  if (/^[A-Za-z]{3}$/.test(s)) return s.toUpperCase();
  return cityIata(s);
}

async function hotelPrice(city: string, checkIn: string, checkOut: string): Promise<number | null> {
  const q = new URLSearchParams({ location: city, currency: "eur", checkIn, checkOut, limit: "5", token: TOKEN });
  const d = (await jget(`https://engine.hotellook.com/api/v2/cache.json?${q}`)) as { priceFrom?: number; priceAvg?: number }[] | null;
  if (!Array.isArray(d) || !d.length) return null;
  const prices = d.map((h) => h.priceFrom ?? h.priceAvg).filter((n): n is number => typeof n === "number" && n > 0);
  return prices.length ? Math.round(Math.min(...prices)) : null;
}

async function flightPrice(origin: string, city: string, date: string): Promise<number | null> {
  const [orig, dest] = await Promise.all([resolveIata(origin), cityIata(city)]);
  if (!orig || !dest) return null;
  const month = date.slice(0, 7); // YYYY-MM: monatsweit = mehr Treffer im Preis-Cache
  const q = new URLSearchParams({
    origin: orig,
    destination: dest,
    departure_at: month,
    currency: "eur",
    one_way: "true",
    sorting: "price",
    limit: "1",
    token: TOKEN,
    ...(MARKER ? { marker: MARKER } : {}),
  });
  const d = (await jget(`https://api.travelpayouts.com/aviasales/v3/prices_for_dates?${q}`)) as { data?: { price?: number }[] } | null;
  const p = d?.data?.[0]?.price;
  return typeof p === "number" && p > 0 ? Math.round(p) : null;
}

export async function GET(req: Request) {
  if (!TOKEN) return NextResponse.json({ configured: false, price: null, currency: "eur" });
  const u = new URL(req.url);
  const type = u.searchParams.get("type");
  try {
    if (type === "hotel") {
      const city = u.searchParams.get("city") ?? "";
      const checkIn = u.searchParams.get("checkIn") ?? "";
      const checkOut = u.searchParams.get("checkOut") ?? "";
      if (!city || !checkIn || !checkOut) return NextResponse.json({ configured: true, price: null, currency: "eur" });
      return NextResponse.json({ configured: true, price: await hotelPrice(city, checkIn, checkOut), currency: "eur" });
    }
    if (type === "flight") {
      const origin = u.searchParams.get("origin") ?? "";
      const city = u.searchParams.get("city") ?? "";
      const date = u.searchParams.get("date") ?? "";
      if (!origin || !city || !date) return NextResponse.json({ configured: true, price: null, currency: "eur" });
      return NextResponse.json({ configured: true, price: await flightPrice(origin, city, date), currency: "eur" });
    }
    return NextResponse.json({ configured: true, price: null, currency: "eur" });
  } catch {
    return NextResponse.json({ configured: true, price: null, currency: "eur" });
  }
}
