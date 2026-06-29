import { supabase } from "./supabase";
import type { Club } from "./types";

/** Länder, in denen wir aktuell Clubs unterstützen. Rest = „coming soon". */
export const SUPPORTED_COUNTRIES = ["DE", "CH"] as const;
export const SUPPORTED_COUNTRY_NAMES: Record<string, string> = {
  DE: "Deutschland",
  CH: "Schweiz",
};
const COUNTRY_NAMES: Record<string, string> = {
  ...SUPPORTED_COUNTRY_NAMES,
  US: "USA",
  AT: "Österreich",
  FR: "Frankreich",
  IT: "Italien",
  ES: "Spanien",
  GB: "Grossbritannien",
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code?.toUpperCase()] ?? code;
}

export function isSupportedCountry(code: string | null | undefined): boolean {
  return !!code && SUPPORTED_COUNTRIES.includes(code.toUpperCase() as never);
}

/**
 * Live-Clubsuche (Name, Stadt ODER Adresse) in der echten Clubs-DB (web.clubs).
 * Ist ein unterstütztes Land (DE/CH) angegeben, wird auf dieses Land
 * eingeschränkt — sonst auf alle unterstützten Länder.
 */
export async function searchClubs(
  query: string,
  country?: string | null,
  limit = 12,
): Promise<Club[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const c = country?.toUpperCase();
  let qb = supabase.from("clubs").select("*");
  // Land angegeben → darauf einschränken; sonst weltweit suchen.
  if (c) qb = qb.eq("country", c);
  // Klammern/Kommas würden den PostgREST-OR-Filter zerlegen → entfernen.
  const safe = q.replace(/[(),]/g, " ").trim();
  const { data } = await qb
    .or(`name.ilike.%${safe}%,city.ilike.%${safe}%,address.ilike.%${safe}%`)
    .order("name")
    .limit(limit);
  return (data as Club[]) ?? [];
}

/** Ergebnis aus der Live-Suche (OSM) — noch ohne DB-Id (`_osm` markiert). */
export type ClubCandidate = Club & { _osm?: boolean };

// Heuristik: sieht der OSM-Treffer nach einem (Sport-)Club aus?
const CLUB_RE =
  /club|tennis|padel|pickle|squash|sport|halle|center|centre|academy|arena|\btc\b|\btv\b|\btg\b/i;

/**
 * Weltweite Live-Clubsuche über OpenStreetMap (Nominatim, kostenlos, kein Key).
 * Region wird über die Nutzer-Koordinaten bevorzugt (viewbox), aber nicht
 * erzwungen. Ergebnisse sind Kandidaten ohne DB-Id — beim Auswählen via
 * saveClubCandidate() dauerhaft in die DB übernehmen.
 */
export async function searchClubsLive(
  query: string,
  opts: { lat?: number | null; lng?: number | null } = {},
): Promise<ClubCandidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    q,
    format: "json",
    addressdetails: "1",
    namedetails: "1",
    limit: "12",
  });
  if (opts.lat != null && opts.lng != null) {
    const d = 1.2; // ~130 km Box — Region bevorzugen
    params.set(
      "viewbox",
      `${opts.lng - d},${opts.lat + d},${opts.lng + d},${opts.lat - d}`,
    );
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      { headers: { "Accept-Language": "de" } },
    );
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (r) => r.class === "leisure" || CLUB_RE.test(r.display_name || ""),
      )
      .map((r): ClubCandidate => {
        const a = r.address ?? {};
        const city =
          a.city || a.town || a.village || a.municipality || a.county || null;
        const street = [a.road, a.house_number].filter(Boolean).join(" ");
        const address =
          [street, [a.postcode, city].filter(Boolean).join(" ")]
            .filter(Boolean)
            .join(", ") ||
          (r.display_name?.split(",").slice(0, 2).join(",").trim() ?? null);
        return {
          id: "",
          name: r.namedetails?.name || r.display_name?.split(",")[0] || "Club",
          city,
          canton: null,
          state: null,
          country: (a.country_code ?? "").toUpperCase(),
          latitude: parseFloat(r.lat),
          longitude: parseFloat(r.lon),
          address,
          _osm: true,
        };
      })
      .filter((c) => c.country && !Number.isNaN(c.latitude)); // ohne Land/Koord. nicht speicherbar
  } catch {
    return [];
  }
}

/**
 * Übernimmt einen OSM-Kandidaten dauerhaft in web.clubs (falls noch nicht da)
 * und gibt den Club mit DB-Id zurück. So wächst die Clubs-DB durch Nutzung.
 */
export async function saveClubCandidate(
  c: ClubCandidate,
): Promise<Club | null> {
  const existing = await searchClubs(c.name, c.country, 5);
  const dup = existing.find(
    (x) => x.name.toLowerCase() === c.name.toLowerCase(),
  );
  if (dup) return dup;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : undefined;
  const { data } = await supabase
    .from("clubs")
    .insert({
      ...(id ? { id } : {}),
      name: c.name,
      city: c.city,
      address: c.address,
      country: c.country,
      latitude: c.latitude,
      longitude: c.longitude,
    })
    .select()
    .single();
  return (data as Club) ?? null;
}

type GeoResult = {
  lat: number;
  lng: number;
  country: string; // ISO-2, z.B. "DE"
  city: string;
  displayName: string;
};

/**
 * Verifiziert einen Club über Nominatim (OpenStreetMap). Kostenlos, kein Key.
 * Gibt Koordinaten + Land zurück, falls die Adresse real existiert.
 */
export async function geocodeClub(
  name: string,
  city: string,
): Promise<GeoResult | null> {
  const query = `${name}, ${city}`.trim();
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query,
      )}&format=json&addressdetails=1&limit=1`,
      { headers: { "Accept-Language": "de" } },
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const r = data[0];
    return {
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      country: (r.address?.country_code ?? "").toUpperCase(),
      city:
        r.address?.city ||
        r.address?.town ||
        r.address?.village ||
        r.address?.municipality ||
        city,
      displayName: r.display_name,
    };
  } catch {
    return null;
  }
}

export type AddClubResult =
  | { status: "added"; club: Club }
  | { status: "not_found" }
  | { status: "unsupported_country"; country: string }
  | { status: "error" };

/**
 * Verifiziert + nimmt einen neuen Club auf, falls er real existiert und in
 * einem unterstützten Land liegt. Danach ist er für ALLE Nutzer auswählbar.
 */
export async function addClub(
  name: string,
  city: string,
): Promise<AddClubResult> {
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || city.trim().length < 2) {
    return { status: "not_found" };
  }

  // 1) Schon vorhanden? (Doppelte vermeiden)
  const existing = await searchClubs(trimmedName, null, 5);
  const dup = existing.find(
    (c) => c.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  if (dup) return { status: "added", club: dup };

  // 2) Verifizieren via Geocoding (weltweit erlaubt)
  const geo = await geocodeClub(trimmedName, city);
  if (!geo) return { status: "not_found" };

  // 3) Aufnehmen
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : undefined;
  const { data, error } = await supabase
    .from("clubs")
    .insert({
      ...(id ? { id } : {}),
      name: trimmedName,
      city: geo.city,
      country: geo.country,
      latitude: geo.lat,
      longitude: geo.lng,
    })
    .select()
    .single();

  if (error || !data) return { status: "error" };
  return { status: "added", club: data as Club };
}
