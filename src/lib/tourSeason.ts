/**
 * Datenschicht für den Saisonplan der Route /tour (web.tour_season_plan).
 *
 * BEWUSST EIGENE DATEI (nicht in src/lib/tour.ts): /app-Compete und /tour bleiben
 * entkoppelt. Ausschließlich der Anon-Client (RLS wirkt, wird NICHT umgangen) —
 * nie der Service-Client. Explizite Spaltenlisten, kein select *.
 *
 * Zeilen-Scoping übernimmt die RLS-Policy tour_season_plan_own (auth.uid() =
 * user_id) für Lesen UND Schreiben; die Funktionen filtern nicht zusätzlich nach
 * user_id (außer beim Insert, wo WITH CHECK den Wert verlangt).
 */

import { supabase } from "@/lib/supabase";
import type { TourSeasonPlanEntry, TourEntryEvent, TourDecision, TourTournament } from "@/lib/types";

// Explizite Spaltenlisten (kein select *).
const PLAN_COLUMNS = "id, user_id, tournament_id, status, alternate_position, fee_paid, decision, note, created_at, updated_at";
const TOURNAMENT_COLUMNS =
  "id, source_ref, tournament_monday, series, category, category_recognized, name, city, country, latitude, longitude, surface, indoor, prize_money, prize_currency, website, status, valid_from, valid_to, created_at, updated_at";
const EVENT_COLUMNS = "id, user_id, plan_id, observed_at, status, alternate_position, note, created_at";

export type SeasonStatus = TourSeasonPlanEntry["status"]; // = TourEntryStatus (8 Werte)

/** Ein Saisoneintrag: Planzeile + verbundenes Turnier + Soft-Delete-Kennzeichen. */
export type SeasonEntry = {
  planId: string;
  status: SeasonStatus;
  decision: TourSeasonPlanEntry["decision"];
  alternatePosition: number | null; // aktuelle Nachrücker-Position (nur bei status='alternate')
  feePaid: boolean;
  note: string | null;
  addedAt: string; // created_at der Planzeile
  tournament: TourTournament;
  tournamentInactive: boolean; // valid_to gesetzt → Turnier soft-gelöscht
};

/**
 * Alle Saisoneinträge des Nutzers, mit den Turnierdaten verbunden.
 *
 * ZWEI ABFRAGEN statt Embed: hält die expliziten Spaltenlisten sauber und gibt
 * volle Kontrolle über das Soft-Delete-Kennzeichen. Soft-gelöschte Turniere
 * (valid_to gesetzt) werden NICHT herausgefiltert — die Planzeile bleibt erhalten
 * und wird über `tournamentInactive` markiert, damit die UI sie erklären kann.
 *
 * Sortierung deterministisch: tournament_monday → created_at der Planzeile → planId.
 */
export async function loadSeason(): Promise<SeasonEntry[]> {
  const { data: plan, error } = await supabase.from("tour_season_plan").select(PLAN_COLUMNS);
  if (error) throw error;
  const rows = (plan as TourSeasonPlanEntry[]) ?? [];
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.tournament_id))];
  // Bewusst OHNE valid_to-Filter: auch soft-gelöschte Turniere laden, um sie zu markieren.
  const { data: tours, error: e2 } = await supabase.from("tour_tournaments").select(TOURNAMENT_COLUMNS).in("id", ids);
  if (e2) throw e2;
  const byId = new Map((tours as TourTournament[] ?? []).map((t) => [t.id, t]));

  const entries: SeasonEntry[] = [];
  for (const r of rows) {
    const t = byId.get(r.tournament_id);
    if (!t) continue; // Turnier nicht auffindbar (via FK unwahrscheinlich) → still überspringen
    entries.push({
      planId: r.id,
      status: r.status,
      decision: r.decision,
      alternatePosition: r.alternate_position,
      feePaid: r.fee_paid,
      note: r.note,
      addedAt: r.created_at,
      tournament: t,
      tournamentInactive: t.valid_to != null,
    });
  }

  entries.sort(
    (a, b) =>
      a.tournament.tournament_monday.localeCompare(b.tournament.tournament_monday) ||
      a.addedAt.localeCompare(b.addedAt) ||
      a.planId.localeCompare(b.planId),
  );
  return entries;
}

/** IDs der aktuell aufgenommenen Turniere — für den Aufnehmen-Knopf in der Liste. */
export async function loadSeasonTournamentIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from("tour_season_plan").select("tournament_id");
  if (error) throw error;
  return new Set(((data as { tournament_id: string }[]) ?? []).map((r) => r.tournament_id));
}

/** Rohe Planzeilen des Nutzers (Status/Position/Gebühr je Turnier) — für die Saisonliste
 *  + den Entry-Status im Detail. Benannte Spalten, RLS scoped auf die eigenen Zeilen. */
export async function loadSeasonPlanRows(): Promise<TourSeasonPlanEntry[]> {
  const { data, error } = await supabase.from("tour_season_plan").select(PLAN_COLUMNS);
  if (error) throw error;
  return (data as TourSeasonPlanEntry[]) ?? [];
}

/** Turniere zu einer ID-Liste (für die Pipeline). Ohne valid_to-Filter — inaktive werden
 *  über valid_to markiert; benannte Spalten. Leere Liste → leeres Ergebnis (kein Query). */
export async function loadTournamentsByIds(ids: string[]): Promise<TourTournament[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("tour_tournaments").select(TOURNAMENT_COLUMNS).in("id", ids);
  if (error) throw error;
  return (data as TourTournament[]) ?? [];
}

/** ALLE Beobachtungen des Nutzers (RLS scoped), chronologisch — für den Trend je Eintrag.
 *  EINE Abfrage; die UI gruppiert client-seitig nach plan_id. */
export async function loadAllEntryEvents(): Promise<TourEntryEvent[]> {
  const { data, error } = await supabase
    .from("tour_entry_events")
    .select(EVENT_COLUMNS)
    .order("observed_at", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as TourEntryEvent[]) ?? [];
}

/**
 * Turnier in die Saison aufnehmen. Idempotent: ein bereits vorhandenes Turnier
 * (UNIQUE-Verstoß 23505) ist KEIN Fehler. JEDER andere Fehler — insbesondere ein
 * RLS-Verstoß (42501) — wird geworfen und darf NICHT als „schon vorhanden"
 * durchrutschen; der Nutzer muss ihn sehen.
 */
export async function addToSeason(userId: string, tournamentId: string): Promise<void> {
  const { error } = await supabase.from("tour_season_plan").insert({ user_id: userId, tournament_id: tournamentId });
  if (error && error.code !== "23505") throw error;
}

/** Turnier aus der Saison entfernen (RLS beschränkt auf eigene Zeilen). */
export async function removeFromSeason(tournamentId: string): Promise<void> {
  const { error } = await supabase.from("tour_season_plan").delete().eq("tournament_id", tournamentId);
  if (error) throw error;
}

/**
 * GANZE Saison leeren — alle Planzeilen des Nutzers löschen (Reset nach „Saison planen").
 * Explizit auf user_id gefiltert (zusätzlich zur RLS); die UI ruft dies NUR nach einer
 * Sicherheitsabfrage auf (Datenverlust-Lehre MU-037: ein Klick löschte kuratierte Einträge).
 */
export async function clearSeason(userId: string): Promise<void> {
  const { error } = await supabase.from("tour_season_plan").delete().eq("user_id", userId);
  if (error) throw error;
}

/**
 * Status eines Eintrags ändern (schlicht, für das ältere /tour/season-Dropdown).
 * Die Alternate-Position ist NUR bei status='alternate' zulässig (DB-Cross-Check) →
 * bei jedem anderen Status wird sie auf null gesetzt, damit das Update nie am Check scheitert.
 */
export async function setSeasonStatus(planId: string, status: SeasonStatus): Promise<void> {
  const patch = status === "alternate" ? { status } : { status, alternate_position: null };
  const { error } = await supabase.from("tour_season_plan").update(patch).eq("id", planId);
  if (error) throw error;
}

/**
 * Entry-Status + Alternate-Position gemeinsam setzen (neues /tour-Management). Position
 * NUR bei 'alternate' — sonst null (spiegelt den DB-Cross-Check). Aktualisiert die Planzeile
 * (aktueller Stand); den VERLAUF schreibt logEntryEvent separat.
 */
export async function setEntryStatus(planId: string, status: SeasonStatus, alternatePosition?: number | null): Promise<void> {
  const alt = status === "alternate" ? (alternatePosition ?? null) : null;
  const { error } = await supabase.from("tour_season_plan").update({ status, alternate_position: alt }).eq("id", planId);
  if (error) throw error;
}

/** Meldegebühr-Flag setzen. */
export async function setFeePaid(planId: string, paid: boolean): Promise<void> {
  const { error } = await supabase.from("tour_season_plan").update({ fee_paid: paid }).eq("id", planId);
  if (error) throw error;
}

/** Entscheidung je Turnier setzen (Wochen-Pipeline): play|wait|fallback|open. */
export async function setDecision(planId: string, decision: TourDecision): Promise<void> {
  const { error } = await supabase.from("tour_season_plan").update({ decision }).eq("id", planId);
  if (error) throw error;
}

/**
 * Eine Beobachtung in den Verlauf schreiben (web.tour_entry_events, append-only). Der
 * Spieler hält fest, was er im IPIN sah. Position nur bei 'alternate'. observed_at leer →
 * DB-Default (heute). user_id ist Pflicht (RLS WITH CHECK verlangt auth.uid() = user_id).
 */
export async function logEntryEvent(
  userId: string,
  planId: string,
  obs: { status: SeasonStatus; alternatePosition?: number | null; observedAt?: string; note?: string | null },
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: userId,
    plan_id: planId,
    status: obs.status,
    alternate_position: obs.status === "alternate" ? (obs.alternatePosition ?? null) : null,
    note: obs.note?.trim() ? obs.note.trim() : null,
  };
  if (obs.observedAt) row.observed_at = obs.observedAt;
  const { error } = await supabase.from("tour_entry_events").insert(row);
  if (error) throw error;
}

/** Verlauf eines Saisoneintrags, chronologisch (ältester zuerst). */
export async function loadEntryEvents(planId: string): Promise<TourEntryEvent[]> {
  const { data, error } = await supabase
    .from("tour_entry_events")
    .select(EVENT_COLUMNS)
    .eq("plan_id", planId)
    .order("observed_at", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as TourEntryEvent[]) ?? [];
}

/** Eine Fehl-Beobachtung entfernen (append-only kennt kein Update — löschen + neu erfassen). */
export async function deleteEntryEvent(id: string): Promise<void> {
  const { error } = await supabase.from("tour_entry_events").delete().eq("id", id);
  if (error) throw error;
}

/** Notiz setzen (leerer String → null, damit „keine Notiz" sauber bleibt). */
export async function setSeasonNote(planId: string, note: string): Promise<void> {
  const clean = note.trim();
  const { error } = await supabase.from("tour_season_plan").update({ note: clean === "" ? null : clean }).eq("id", planId);
  if (error) throw error;
}
