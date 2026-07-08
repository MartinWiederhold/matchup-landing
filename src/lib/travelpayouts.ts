// Travelpayouts-Affiliate-Deep-Links (Hotellook = Hotels, Aviasales = Flüge, Localrent = Mietwagen).
// Aktiv, sobald NEXT_PUBLIC_TP_MARKER gesetzt ist – sonst sauberer Fallback auf Booking/Google
// (keine Provision, aber funktionierende Links). Reine URL-Bausteine, keine Secrets.

const MARKER = process.env.NEXT_PUBLIC_TP_MARKER ?? "";
export const tpActive = MARKER.length > 0;

type Stop = { city: string; country: string; start: string; end: string };

/** Hotels am Turnierort (Ort + Check-in/out vorausgefüllt). */
export function hotelUrl(t: Stop): string {
  const place = encodeURIComponent(`${t.city}, ${t.country}`);
  if (!tpActive) {
    return `https://www.booking.com/searchresults.html?ss=${place}&checkin=${t.start}&checkout=${t.end}&group_adults=1&no_rooms=1`;
  }
  const q = new URLSearchParams({
    destination: `${t.city}, ${t.country}`,
    checkIn: t.start,
    checkOut: t.end,
    adults: "1",
    marker: MARKER,
    currency: "eur",
    locale: "de",
  });
  return `https://search.hotellook.com/hotels?${q}`;
}

/** Flüge zum Turnierort (ab Heimatflughafen, falls im Profil hinterlegt). */
export function flightUrl(t: Stop, homeAirport?: string): string {
  if (!tpActive) {
    const q = homeAirport ? `Flug ${homeAirport} nach ${t.city} am ${t.start}` : `Flug nach ${t.city} am ${t.start}`;
    return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
  }
  const q = new URLSearchParams({ marker: MARKER, currency: "eur", locale: "de" });
  if (homeAirport) q.set("origin_iata", homeAirport.toUpperCase());
  q.set("destination", t.city);
  q.set("depart_date", t.start);
  return `https://www.aviasales.com/search?${q}`;
}

// --- Echte Preise über die server-seitige /api/prices-Route (Token bleibt geheim) ---
export type LivePrice = { configured: boolean; price: number | null };

async function getPrice(params: Record<string, string>): Promise<LivePrice> {
  try {
    const r = await fetch(`/api/prices?${new URLSearchParams(params)}`);
    if (!r.ok) return { configured: false, price: null };
    const d = (await r.json()) as { configured?: boolean; price?: number | null };
    return { configured: !!d.configured, price: typeof d.price === "number" ? d.price : null };
  } catch {
    return { configured: false, price: null };
  }
}

export function hotelPriceQuery(t: Stop): Promise<LivePrice> {
  return getPrice({ type: "hotel", city: t.city, country: t.country, checkIn: t.start, checkOut: t.end });
}

export function flightPriceQuery(t: Stop, homeAirport?: string): Promise<LivePrice> {
  if (!homeAirport) return Promise.resolve({ configured: true, price: null });
  return getPrice({ type: "flight", origin: homeAirport, city: t.city, date: t.start });
}

/** Mietwagen am Turnierort. */
export function carUrl(t: Stop): string {
  if (!tpActive) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Mietwagen ${t.city}`)}`;
  }
  const q = new URLSearchParams({ marker: MARKER, currency: "eur", locale: "de", city: t.city });
  return `https://localrent.com/?${q}`;
}
