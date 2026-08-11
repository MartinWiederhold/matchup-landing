import { supabase } from "@/lib/supabase";

/**
 * Entfernungen (km) zu den gegebenen Profil-IDs — serverseitig gerechnet über die
 * RPC web.candidate_distances. Rohkoordinaten verlassen die DB NIE (Sicherheitsaudit
 * 2026-08). Fehlt die eigene Position ODER die des Kandidaten, fehlt der Eintrag in
 * der Map (→ „Distanz unbekannt"): der Aufrufer darf solche Profile NICHT still
 * aus dem Feed werfen, sondern ohne Distanz einsortieren.
 */
export async function fetchDistances(ids: string[]): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  if (ids.length === 0) return m;
  const { data } = await supabase.rpc("candidate_distances", { p_ids: ids });
  for (const r of (data as { id: string; distance_km: number | null }[] | null) ?? []) {
    if (typeof r.distance_km === "number") m.set(r.id, r.distance_km);
  }
  return m;
}
