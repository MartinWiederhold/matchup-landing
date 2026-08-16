/**
 * Datenschicht für die Route /tour/form (Leistungsauswertung): erfasste Matches
 * (web.tour_events, kind='match') → Match-Liste + Belag/Kategorie/Saison für den reinen
 * Rechner (src/domain/tour/performance.ts).
 *
 * EIGENE DATEI, nur Anon-Client — nie Service-Client (RLS wirkt). Explizite Spaltenlisten,
 * kein select *. Diese Datei fasst NUR Lesen an; sie ändert nichts an web.tour_events
 * (das gehört /tour/calendar bzw. /app).
 *
 * BELAG-LÜCKE (bewusst, benannt): Der Belag steht in tour_tournaments und ist nur über
 * eine uuid-tournament_id (/tour) verknüpfbar. /app speichert Slugs — dort gibt es keinen
 * Belag. Solche Matches bekommen surface=null → der Rechner führt sie im Eimer „unknown",
 * statt sie stillschweigend zu verwerfen. Die Gesamtquote zählt sie trotzdem mit.
 *
 * GEGNERSTÄRKE: bewusst NICHT hier. `tour_events.opponent` ist Freitext (Name), es gibt
 * kein Rang-Feld → Siegquote nach Gegnerstärke ist nicht berechenbar (Backlog MU-039).
 */

import { supabase } from "@/lib/supabase";
import { isTourTournamentId } from "@/lib/tourExpenses";
import type { PerfMatch } from "@/domain/tour/performance";

type MatchRow = { tournament_id: string | null; won: boolean | null; event_date: string | null };
type TourRow = {
  id: string;
  tournament_monday: string;
  surface: string | null;
  category: string | null;
  category_recognized: boolean;
  name: string | null;
  city: string | null;
  country: string | null;
};

/** Jahr aus einem ISO-Datum (YYYY-…); null bei leer/ungültig. Deterministisch, keine Systemuhr. */
function yearOf(iso: string | null): number | null {
  if (!iso || iso.length < 4) return null;
  const y = Number(iso.slice(0, 4));
  return Number.isInteger(y) ? y : null;
}

export type PerformanceData = {
  matches: PerfMatch[];
  /** uuid → Belag (oder null), für „Punkte je Belag": die Belag-Zuordnung der bewerteten Ergebnisse. */
  surfaceByTournament: Map<string, string | null>;
};

/**
 * Lädt die Matches des Nutzers und reichert sie mit Belag/Kategorie/Saison an.
 * JEDE Match-Zeile ist EIN PerfMatch (die Quote rechnet je Match, nicht je Turnier —
 * anders als der Punkte-Rechner, der je Turnier auf ein terminales Ergebnis verdichtet).
 * scorePoints/loadPointsData bleiben getrennt (die UI kombiniert für „Punkte je Belag").
 */
export async function loadPerformance(userId: string): Promise<PerformanceData> {
  const { data, error } = await supabase
    .from("tour_events")
    .select("tournament_id, won, event_date")
    .eq("user_id", userId)
    .eq("kind", "match");
  if (error) throw error;
  const matches = (data as MatchRow[]) ?? [];
  if (matches.length === 0) return { matches: [], surfaceByTournament: new Map() };

  // Turnierdaten (Belag, Kategorie, Anzeigename, Montag) für die verknüpften uuids.
  const uuids = [...new Set(matches.map((m) => m.tournament_id).filter((id): id is string => isTourTournamentId(id)))];
  const byId = new Map<string, TourRow>();
  if (uuids.length) {
    const { data: ts, error: e2 } = await supabase
      .from("tour_tournaments")
      .select("id, tournament_monday, surface, category, category_recognized, name, city, country")
      .in("id", uuids);
    if (e2) throw e2;
    for (const t of (ts as TourRow[]) ?? []) byId.set(t.id, t);
  }

  const surfaceByTournament = new Map<string, string | null>();
  for (const [id, t] of byId) surfaceByTournament.set(id, t.surface);

  const perf: PerfMatch[] = matches.map((m) => {
    const t = m.tournament_id && byId.get(m.tournament_id);
    const name = t ? (t.city ? `${t.city}${t.country ? ", " + t.country : ""}` : t.name ?? t.id) : (m.tournament_id ?? "—");
    // Belag nur bei uuid-Turnieren; Slug/unbekannt → null (Eimer „unknown").
    const surface = t ? t.surface : null;
    // Kategorie nur, wenn erkannt (sonst Freitext-Rauschen → unbekannt).
    const category = t && t.category_recognized ? t.category : null;
    // Saison: Jahr des Matches; ersatzweise das Jahr der Turnierwoche.
    const season = yearOf(m.event_date) ?? (t ? yearOf(t.tournament_monday) : null);
    return { won: m.won, surface, category, season, tournamentId: m.tournament_id ?? "—", tournamentName: name };
  });

  return { matches: perf, surfaceByTournament };
}
