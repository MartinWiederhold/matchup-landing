/**
 * Datenschicht für die tatsächlichen Aufenthalte der Route /tour/schengen
 * (web.tour_stays). Eingabe für src/domain/tour/schengen.ts.
 *
 * EIGENE DATEI, nur Anon-Client — nie Service-Client (RLS wirkt).
 *
 * KERN: bestätigt (confirmed=true) gegen vorgeschlagen (false). NUR bestätigte
 * Aufenthalte dürfen in die 90/180-Rechnung eingehen — sonst zurück zu MU-018
 * (Unterschätzung bei einer Regel, deren Verletzung eine Einreisesperre nach sich
 * zieht). `confirmed` bedeutet durchgehend „gilt für die Rechnung", unabhängig von
 * der Herkunft (manuell oder Vorschlag).
 */

import { supabase } from "@/lib/supabase";
import { loadSeason } from "@/lib/tourSeason";
import type { TourStay } from "@/lib/types";

const COLUMNS = "id, user_id, country, entry_date, exit_date, confirmed, source_ref, note, created_at, updated_at";
const DAY = 86_400_000;

/** ISO-Datum + n Tage (UTC). `new Date(ms)` ist deterministisch (kein Laufzeit-Clock). */
function addDaysISO(iso: string, n: number): string {
  return new Date(Date.parse(iso + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);
}

/** Aufenthalte des Nutzers, chronologisch (RLS + expliziter user-Filter). */
export async function loadStays(userId: string): Promise<TourStay[]> {
  const { data, error } = await supabase
    .from("tour_stays")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("entry_date", { ascending: true });
  if (error) throw error;
  return (data as TourStay[]) ?? [];
}

export type StayInput = {
  country: string; // ISO-3166-1-alpha-2
  entry_date: string; // ISO
  exit_date: string | null; // ISO oder null = läuft noch
  note: string | null;
  confirmed: boolean; // aus dem Häkchen „zählt für die Rechnung" — bewusste Zustimmung
};

/** Manuellen Aufenthalt anlegen. `confirmed` kommt aus dem Formular-Häkchen,
 *  NICHT automatisch true: Bestätigen heißt „geprüft", nicht „eingegeben". */
export async function addStay(userId: string, input: StayInput): Promise<void> {
  const { error } = await supabase.from("tour_stays").insert({
    user_id: userId,
    country: input.country.toUpperCase().slice(0, 2),
    entry_date: input.entry_date,
    exit_date: input.exit_date,
    confirmed: input.confirmed,
    note: input.note,
    // source_ref bleibt null → manueller Aufenthalt (kein Idempotenz-Schlüssel).
  });
  if (error) throw error;
}

export type StayPatch = { country: string; entry_date: string; exit_date: string | null; note: string | null };

/** Aufenthalt ändern (Land/Daten/Notiz). */
export async function updateStay(id: string, patch: StayPatch): Promise<void> {
  const { error } = await supabase
    .from("tour_stays")
    .update({
      country: patch.country.toUpperCase().slice(0, 2),
      entry_date: patch.entry_date,
      exit_date: patch.exit_date,
      note: patch.note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

/** Aufenthalt bestätigen — ab jetzt zählt er für die 90/180-Rechnung. */
export async function confirmStay(id: string): Promise<void> {
  const { error } = await supabase.from("tour_stays").update({ confirmed: true, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

/** Aufenthalt löschen. */
export async function removeStay(id: string): Promise<void> {
  const { error } = await supabase.from("tour_stays").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Erzeugt Aufenthalts-VORSCHLÄGE (confirmed=false) aus dem Saisonplan.
 *
 * Ableitung: Turniere nach Montag sortiert; aufeinanderfolgende Turniere im SELBEN
 * Land (nächster Montag ≤ 7 Tage nach dem vorigen) werden zu EINEM durchgehenden
 * Aufenthalt zusammengefasst. Datumsspanne = Montag der ersten Woche bis Sonntag
 * (Montag + 6) der letzten Woche — die REALE Wochengrenze, keine erfundene Dauer;
 * der Nutzer korrigiert/bestätigt sie.
 *
 * Idempotenz: source_ref = `season:<ISO>:<erster-Montag>` (stabil je Cluster). Der
 * partielle Unique-Index verhindert Doppel; hier zusätzlich VORFILTER gegen die
 * bestehenden source_ref, damit ein zweiter Klick sauber nichts anlegt (kein Fehler).
 *
 * @returns Anzahl NEU angelegter Vorschläge.
 */
export async function generateSuggestions(userId: string): Promise<number> {
  const season = await loadSeason(); // nach Turniermontag sortiert

  type Cluster = { country: string; firstMonday: string; lastMonday: string };
  const clusters: Cluster[] = [];
  for (const e of season) {
    const country = e.tournament.country;
    const monday = e.tournament.tournament_monday;
    if (!country) continue; // ohne Land kein Vorschlag (kein Fehler)
    const last = clusters[clusters.length - 1];
    const contiguous =
      last != null &&
      last.country === country &&
      Date.parse(monday + "T00:00:00Z") - Date.parse(last.lastMonday + "T00:00:00Z") <= 7 * DAY;
    if (contiguous && last) last.lastMonday = monday;
    else clusters.push({ country, firstMonday: monday, lastMonday: monday });
  }
  if (clusters.length === 0) return 0;

  // Vorfilter: bestehende source_ref laden.
  const { data: existing, error: e1 } = await supabase
    .from("tour_stays")
    .select("source_ref")
    .eq("user_id", userId)
    .not("source_ref", "is", null);
  if (e1) throw e1;
  const have = new Set(((existing as { source_ref: string }[]) ?? []).map((r) => r.source_ref));

  const rows = clusters
    .map((c) => ({
      user_id: userId,
      country: c.country,
      entry_date: c.firstMonday,
      exit_date: addDaysISO(c.lastMonday, 6), // Sonntag der letzten Woche
      confirmed: false, // Vorschlag: zählt noch nicht
      source_ref: `season:${c.country}:${c.firstMonday}`,
      note: null,
    }))
    .filter((r) => !have.has(r.source_ref));
  if (rows.length === 0) return 0;

  const { error: e2 } = await supabase.from("tour_stays").insert(rows);
  if (e2) {
    // 23505 = Unique-Verstoß bei echtem Race (Doppelklick) → idempotent, kein Fehler.
    if ((e2 as { code?: string }).code === "23505") return 0;
    throw e2;
  }
  return rows.length;
}
