import { supabase } from "@/lib/supabase";

/** Service-Marktplatz: Anbieter (Coaches, Hitting Partners, Stringer, Physio …). */
export type ServiceCategory =
  | "coach" | "hitting" | "stringer" | "physio" | "sc" | "mental" | "nutrition" | "tour_companion";

export type ServiceProvider = {
  id: string;
  name: string;
  category: ServiceCategory;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  price_from: number | null;
  price_unit: string | null; // hour | session | stringing | week | year
  currency: string | null;
  rating: number | null;
  reviews_count: number;
  level: string | null;
  languages: string[];
  bio: string | null;
  image_url: string | null;
  sponsor: string | null;
  verified: string | null; // z. B. "tour_certified"
  travels: boolean;
  sports: string[];
};

/** Anbieter laden — optional gefiltert nach Kategorie/Stadt. */
export async function loadProviders(
  opts: { city?: string | null; category?: ServiceCategory | null; limit?: number } = {},
): Promise<ServiceProvider[]> {
  let q = supabase
    .from("service_providers")
    .select("*")
    .order("rating", { ascending: false, nullsFirst: false });
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.city && opts.city.trim()) q = q.ilike("city", `%${opts.city.trim()}%`);
  const { data } = await q.limit(opts.limit ?? 60);
  return (data as ServiceProvider[]) ?? [];
}

/**
 * Anbieter „in deiner Nähe": erst nach Stadt, bei 0 Treffern Fallback auf alle
 * (im MVP nur Zürich geseedet). So sieht der Nutzer immer Angebote.
 */
export async function loadProvidersNear(city: string | null, limit = 60): Promise<{ rows: ServiceProvider[]; exact: boolean }> {
  if (city && city.trim()) {
    const rows = await loadProviders({ city, limit });
    if (rows.length) return { rows, exact: true };
  }
  return { rows: await loadProviders({ limit }), exact: false };
}

/* ── Favoriten ────────────────────────────────────────────── */
export async function loadFavoriteIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("service_favorites").select("provider_id").eq("user_id", userId);
  return new Set((data as { provider_id: string }[] ?? []).map((r) => r.provider_id));
}

export async function toggleFavorite(userId: string, providerId: string, on: boolean): Promise<void> {
  if (on) await supabase.from("service_favorites").insert({ user_id: userId, provider_id: providerId });
  else await supabase.from("service_favorites").delete().eq("user_id", userId).eq("provider_id", providerId);
}

/** Favorisierte Anbieter laden. */
export async function loadFavoriteProviders(userId: string): Promise<ServiceProvider[]> {
  const ids = await loadFavoriteIds(userId);
  if (ids.size === 0) return [];
  const { data } = await supabase.from("service_providers").select("*").in("id", [...ids]).order("rating", { ascending: false, nullsFirst: false });
  return (data as ServiceProvider[]) ?? [];
}
