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
  website: string | null;
  contact_email: string | null;
  phone: string | null;
  source: string | null; // seed | directory | self | editorial
  created_by: string | null;
};

/** Anbieter laden — optional gefiltert nach Kategorie/Stadt. */
export async function loadProviders(
  opts: { city?: string | null; category?: ServiceCategory | null; limit?: number } = {},
): Promise<ServiceProvider[]> {
  let q = supabase
    .from("service_providers")
    .select("*")
    // Echte Anbieter zuerst: 'directory' < 'self' < 'seed' (alphabetisch), dann nach Rating.
    .order("source", { ascending: true })
    .order("rating", { ascending: false, nullsFirst: false });
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.city && opts.city.trim()) q = q.ilike("city", `%${opts.city.trim()}%`);
  const { data } = await q.limit(opts.limit ?? 60);
  return (data as ServiceProvider[]) ?? [];
}

/**
 * Anbieter „in deiner Nähe": streng nach Stadt. Kein Fallback auf fremde Städte —
 * eine Stadt ohne Anbieter liefert leer (Aufrufer zeigt „noch keine Services hier").
 * Nur ganz ohne Stadtangabe werden alle Anbieter gezeigt.
 */
export async function loadProvidersNear(city: string | null, limit = 60): Promise<{ rows: ServiceProvider[]; exact: boolean }> {
  if (city && city.trim()) {
    return { rows: await loadProviders({ city, limit }), exact: true };
  }
  return { rows: await loadProviders({ limit }), exact: false };
}

export type ProviderNear = ServiceProvider & { distance_km: number };

/**
 * Anbieter im Umkreis (km) um eine Koordinate — für die Turnier-Ansicht in /tour.
 * Grob per Bounding-Box vorfiltern (skaliert), dann Haversine-Distanz exakt rechnen,
 * auf den Radius kappen und nach Nähe sortieren. Ein Besaiter 200 km weg taucht nicht auf.
 */
export async function loadProvidersNearCoords(lat: number, lng: number, radiusKm: number): Promise<ProviderNear[]> {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(0.15, Math.cos((lat * Math.PI) / 180)));
  const { data } = await supabase
    .from("service_providers")
    .select("*")
    .gte("latitude", lat - dLat).lte("latitude", lat + dLat)
    .gte("longitude", lng - dLng).lte("longitude", lng + dLng)
    .limit(300);
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  return ((data as ServiceProvider[]) ?? [])
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => {
      const dPhi = rad(p.latitude! - lat), dLam = rad(p.longitude! - lng);
      const a = Math.sin(dPhi / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(p.latitude!)) * Math.sin(dLam / 2) ** 2;
      return { ...p, distance_km: 2 * R * Math.asin(Math.sqrt(a)) };
    })
    .filter((p) => p.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
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

/* ── Einzel-Anbieter + Reviews ────────────────────────────── */
export async function loadProvider(id: string): Promise<ServiceProvider | null> {
  const { data } = await supabase.from("service_providers").select("*").eq("id", id).maybeSingle();
  return (data as ServiceProvider | null) ?? null;
}

export type ProviderReview = {
  id: string;
  user_id: string;
  rating: number;
  text: string | null;
  created_at: string;
  author: { first_name: string | null; profile_image: string | null } | null;
};

export async function loadReviews(providerId: string): Promise<ProviderReview[]> {
  const { data } = await supabase
    .from("provider_reviews")
    .select("id,user_id,rating,text,created_at, author:profiles!provider_reviews_user_id_fkey(first_name,profile_image)")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((r) => ({ ...r, author: Array.isArray(r.author) ? r.author[0] ?? null : r.author ?? null }));
}

export async function submitReview(providerId: string, userId: string, rating: number, text: string): Promise<void> {
  await supabase.from("provider_reviews").upsert(
    { provider_id: providerId, user_id: userId, rating, text: text.trim() || null },
    { onConflict: "provider_id,user_id" },
  );
}

export async function deleteReview(providerId: string, userId: string): Promise<void> {
  await supabase.from("provider_reviews").delete().eq("provider_id", providerId).eq("user_id", userId);
}

/* ── Anfragen (Buchungswunsch, ohne Zahlung) ──────────────── */
export type ServiceRequest = {
  id: string;
  provider_id: string;
  status: string; // open | confirmed | declined | done
  note: string | null;
  created_at: string;
  provider: ServiceProvider | null;
};

/** IDs der Anbieter, an die der Nutzer bereits eine Anfrage gestellt hat. */
export async function loadRequestedIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("service_requests").select("provider_id").eq("user_id", userId);
  return new Set((data as { provider_id: string }[] ?? []).map((r) => r.provider_id));
}

/** Anfrage anlegen (idempotent — bestehende bleibt bestehen). */
export async function createRequest(userId: string, providerId: string, note?: string): Promise<void> {
  await supabase.from("service_requests").upsert(
    { user_id: userId, provider_id: providerId, note: note?.trim() || null },
    { onConflict: "user_id,provider_id", ignoreDuplicates: true },
  );
}

export async function cancelRequest(userId: string, providerId: string): Promise<void> {
  await supabase.from("service_requests").delete().eq("user_id", userId).eq("provider_id", providerId);
}

/** Alle Anfragen des Nutzers inkl. Anbieter-Daten (neueste zuerst). */
export async function loadRequests(userId: string): Promise<ServiceRequest[]> {
  const { data } = await supabase
    .from("service_requests")
    .select("id,provider_id,status,note,created_at, provider:service_providers!service_requests_provider_id_fkey(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((r) => ({ ...r, provider: Array.isArray(r.provider) ? r.provider[0] ?? null : r.provider ?? null }));
}

/* ── Self-Listing (Anbieter tragen sich selbst ein) ───────── */
export type NewListing = {
  name: string;
  category: ServiceCategory;
  sport: string;
  city: string;
  level: string;
  bio: string;
  website: string;
  contact_email: string;
  price_from: number | null;
  price_unit: string; // hour | session | stringing | week | year
  currency: string;
  image_url: string | null; // selbst hochgeladenes Foto (Bucket provider-images) — MU-035: nur mit Einwilligung
};

/** URL normalisieren: fehlendes Schema → https:// voranstellen (sonst relativer Link). */
function normalizeUrl(u: string): string | null {
  const s = u.trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

/** Eigenen Anbieter-Eintrag anlegen (source='self', is_seed=false). */
export async function createProviderListing(userId: string, l: NewListing): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("service_providers")
    .insert({
      name: l.name.trim(),
      category: l.category,
      sports: [l.sport],
      city: l.city.trim() || null,
      country: "CH",
      level: l.level.trim() || null,
      bio: l.bio.trim() || null,
      website: normalizeUrl(l.website),
      contact_email: l.contact_email.trim() || null,
      price_from: l.price_from,
      price_unit: l.price_from != null ? l.price_unit : null,
      currency: l.currency,
      image_url: l.image_url,
      source: "self",
      is_seed: false,
      created_by: userId,
    })
    .select("id")
    .maybeSingle();
  return (data as { id: string } | null) ?? null;
}

/* ── Anbieter-Foto (öffentlicher Bucket provider-images, Ordner je Nutzer) ── */
const PROVIDER_IMAGES_BUCKET = "provider-images";

/**
 * Selbst hochgeladenes Anbieter-Foto in den EIGENEN Ordner legen (RLS erlaubt nur
 * <user_id>/…). Gibt die öffentliche URL zurück (für image_url) oder null bei Fehler.
 */
export async function uploadProviderImage(userId: string, file: File): Promise<string | null> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PROVIDER_IMAGES_BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (error) return null;
  return supabase.storage.from(PROVIDER_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Ein hochgeladenes Anbieter-Foto wieder entfernen (RLS: nur eigener Ordner). */
export async function deleteProviderImage(publicUrl: string): Promise<void> {
  const marker = `/${PROVIDER_IMAGES_BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  if (i < 0) return;
  await supabase.storage.from(PROVIDER_IMAGES_BUCKET).remove([publicUrl.slice(i + marker.length)]);
}

/** Eigene Anbieter-Einträge des Nutzers. */
export async function loadMyListings(userId: string): Promise<ServiceProvider[]> {
  const { data } = await supabase.from("service_providers").select("*").eq("created_by", userId).order("name");
  return (data as ServiceProvider[]) ?? [];
}

export async function deleteListing(userId: string, id: string): Promise<void> {
  await supabase.from("service_providers").delete().eq("id", id).eq("created_by", userId);
}
