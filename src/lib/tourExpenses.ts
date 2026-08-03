/**
 * Datenschicht für die Ausgabenerfassung der Route /tour/expenses.
 *
 * EIGENE DATEI (nicht tour.ts): /app-Compete und /tour bleiben entkoppelt.
 * Ausschließlich der Anon-Client — nie der Service-Client (RLS wirkt).
 *
 * EINHEIT / KOMPATIBILITÄT (wichtiger Befund, nicht ändern ohne Migration):
 * web.tour_expenses.amount (und tour_prize.amount) ist `numeric` und wird von
 * /app (ExpensesView) in MAJOR UNITS gespeichert — z. B. 49.50, NICHT Cent.
 * Hätten wir Cent (4950) hineingeschrieben, wären ALLE Beträge in /app um den
 * Faktor 100 falsch. Deshalb speichert /tour ebenfalls Major Units: intern
 * rechnen wir in Cent (exakt, ganzzahlig), schreiben aber den Dezimal-String
 * (minorToEuro) ins numeric-Feld. euroToMinor/minorToEuro werden aus tourCosts.ts
 * wiederverwendet (nicht kopiert).
 */

import { supabase } from "@/lib/supabase";
import { euroToMinor, minorToEuro } from "@/lib/tourCosts";

const BUCKET = "tour-receipts";
const EXPENSE_COLUMNS = "id, tournament_id, merchant, amount, currency, category, spent_on, note, receipt_path";

/**
 * DISKRIMINATOR — die EINE Stelle, die die zwei Welten in tournament_id trennt.
 *
 * tournament_id kann eine uuid aus web.tour_tournaments (/tour) ODER ein Slug aus
 * dem /app-Seed-Katalog web.tournaments (z. B. 'halle') sein. Es gibt KEIN Feld,
 * das die Welt markiert — einzig das FORMAT unterscheidet sie.
 *
 * Diese Prüfung erkennt das FORMAT, NICHT die Existenz: eine uuid, deren Turnier
 * soft-gelöscht ist (valid_to gesetzt), bleibt eine uuid — der Name fehlt dann,
 * das ist in Ordnung, solange nichts bricht. /tour schreibt ausschließlich uuids;
 * eine Ausgabe mit Slug (aus /app) wird angezeigt, aber ohne Turniername.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isTourTournamentId(id: string | null | undefined): boolean {
  return id != null && UUID_RE.test(id);
}

export type ExpenseCategory =
  | "hotel" | "flight" | "coach" | "physio" | "stringing" | "entry_fee" | "taxi" | "food" | "other";

export type TourExpense = {
  id: string;
  tournament_id: string | null;
  merchant: string | null;
  amount: string | null; // numeric → via PostgREST als String (Major Units)
  currency: string | null;
  category: string | null;
  spent_on: string | null;
  note: string | null;
  receipt_path: string | null;
};

/**
 * Fürs SUMMIEREN gespeicherter numeric-Werte → Cent. Bewusst `Math.round(Number*100)`:
 * Das ist NICHT die Eingabe-Umrechnung (die läuft strikt über euroToMinor), sondern das
 * RÜCKLESEN bereits gespeicherter Werte (auch /app-Daten, evtl. mit >2 Nachkommastellen).
 * Math.round stellt die exakten Cent aus dem Double wieder her (49.50 → 4949.999… → 4950).
 */
export function amountToMinor(numericStr: string | null): number {
  if (numericStr == null || numericStr.trim() === "") return 0;
  const n = Number(numericStr);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Alle Ausgaben des Nutzers (RLS + expliziter user-Filter) + Namen NUR für uuid-Turniere. */
export async function loadExpenses(userId: string): Promise<{ rows: TourExpense[]; names: Map<string, string> }> {
  const { data, error } = await supabase
    .from("tour_expenses")
    .select(EXPENSE_COLUMNS)
    .eq("user_id", userId) // explizit: die Agent-Policy würde sonst fremde Zeilen mitliefern
    .order("spent_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data as TourExpense[]) ?? [];

  const uuids = [...new Set(rows.map((r) => r.tournament_id).filter((id): id is string => isTourTournamentId(id)))];
  const names = new Map<string, string>();
  if (uuids.length) {
    const { data: ts, error: e2 } = await supabase.from("tour_tournaments").select("id, city, country, name").in("id", uuids);
    if (e2) throw e2;
    for (const t of (ts as { id: string; city: string | null; country: string | null; name: string | null }[]) ?? []) {
      names.set(t.id, t.city ? `${t.city}${t.country ? ", " + t.country : ""}` : t.name ?? t.id);
    }
  }
  return { rows, names };
}

export type ExpenseInput = {
  amountMinor: number; // Cent (aus euroToMinor)
  currency: string;
  merchant: string;
  category: ExpenseCategory;
  spent_on: string; // ISO-Datum
  tournament_id: string | null; // uuid aus der eigenen Saison oder null
  note: string | null;
  receipt_path: string | null;
};

/** Ausgabe anlegen. Betrag wird als Major-Unit-Dezimalstring gespeichert (siehe Datei-Doku). */
export async function addExpense(userId: string, input: ExpenseInput): Promise<void> {
  const { error } = await supabase.from("tour_expenses").insert({
    user_id: userId,
    tournament_id: input.tournament_id,
    merchant: input.merchant,
    amount: minorToEuro(input.amountMinor), // Cent → "49.50" (exakt, kein Fließkomma)
    currency: input.currency,
    category: input.category,
    spent_on: input.spent_on || null,
    note: input.note,
    receipt_path: input.receipt_path,
  });
  if (error) throw error;
}

/**
 * Ausgabe löschen. MU-017a: die Belegdatei wird ZUERST über die Storage-API
 * gelöscht. Schlägt das fehl, brechen wir LAUT ab (Zeile bleibt) — so entsteht
 * kein verwaistes, sensibles Bild und kein stiller Fehlschlag.
 */
export async function removeExpense(exp: TourExpense): Promise<void> {
  if (exp.receipt_path) {
    const { error: sErr } = await supabase.storage.from(BUCKET).remove([exp.receipt_path]);
    if (sErr) throw new Error("receipt_delete_failed");
  }
  const { error } = await supabase.from("tour_expenses").delete().eq("id", exp.id);
  if (error) throw error;
}

/** Preisgeld je Turnier laden (Map tournament_id → {amount, currency}). */
export async function loadPrizes(userId: string): Promise<Map<string, { amount: string | null; currency: string | null }>> {
  const { data, error } = await supabase.from("tour_prize").select("tournament_id, amount, currency").eq("user_id", userId);
  if (error) throw error;
  const m = new Map<string, { amount: string | null; currency: string | null }>();
  for (const p of (data as { tournament_id: string; amount: string | null; currency: string | null }[]) ?? []) {
    m.set(p.tournament_id, { amount: p.amount, currency: p.currency });
  }
  return m;
}

/** Preisgeld setzen (Upsert auf user_id + tournament_id). Betrag als Major Units. */
export async function savePrize(userId: string, tournamentId: string, amountInput: string, currency: string): Promise<void> {
  const cents = euroToMinor(amountInput); // null bei leer/ungültig → Preisgeld geleert
  const amount = cents == null ? null : minorToEuro(cents);
  const { error } = await supabase.from("tour_prize").upsert(
    { user_id: userId, tournament_id: tournamentId, amount, currency: currency.toUpperCase().slice(0, 3), updated_at: new Date().toISOString() },
    { onConflict: "user_id,tournament_id" },
  );
  if (error) throw error;
}

/**
 * Belegfoto in den EIGENEN Ordner hochladen. Dateiname ZUFÄLLIG (nicht der
 * Originalname — der könnte Klarnamen o. Ä. enthalten). Gibt den Pfad zurück.
 */
export async function uploadReceipt(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw error;
  return path;
}

/**
 * Kurzlebiger signierter Link für ein Belegfoto (privat, nie öffentlich).
 * 300 s gültig — überlebt ein Neuladen im neuen Tab, ohne dauerhaft zu sein.
 */
export async function signedReceiptUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) throw error ?? new Error("sign_failed");
  return data.signedUrl;
}
