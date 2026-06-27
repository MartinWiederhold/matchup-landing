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

/** Live-Clubsuche (Name ODER Stadt) — nur unterstützte Länder (DE/CH). */
export async function searchClubs(query: string, limit = 12): Promise<Club[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data } = await supabase
    .from("clubs")
    .select("*")
    .in("country", SUPPORTED_COUNTRIES as unknown as string[])
    .or(`name.ilike.%${q}%,city.ilike.%${q}%`)
    .order("name")
    .limit(limit);
  return (data as Club[]) ?? [];
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
  const existing = await searchClubs(trimmedName, 5);
  const dup = existing.find(
    (c) => c.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  if (dup) return { status: "added", club: dup };

  // 2) Verifizieren via Geocoding
  const geo = await geocodeClub(trimmedName, city);
  if (!geo) return { status: "not_found" };
  if (!isSupportedCountry(geo.country)) {
    return { status: "unsupported_country", country: geo.country };
  }

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
