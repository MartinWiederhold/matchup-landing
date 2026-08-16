/**
 * Datenschicht für die zusätzlichen Einnahmen der Turnier-Bilanz (web.tour_income).
 * Anon-Client, RLS wirkt (owner + agent-read). GLEICHE Einheiten-Konvention wie
 * tour_expenses/tour_prize: amount ist numeric in HAUPTWÄHRUNG (49.50), intern rechnen
 * wir in Cent. euroToMinor/minorToEuro aus tourCosts, amountToMinor aus tourExpenses
 * (wiederverwendet, nicht kopiert). Preisgeld liegt getrennt in tour_prize.
 */
import { supabase } from "@/lib/supabase";
import { minorToEuro } from "@/lib/tourCosts";

export type IncomeKind = "sponsor" | "federation" | "club" | "bonus" | "other";

export type TourIncomeRow = {
  id: string;
  tournament_id: string | null;
  kind: string;
  amount: string | null; // numeric → String (Major Units)
  currency: string | null;
  received_on: string | null;
  note: string | null;
};

const INCOME_COLUMNS = "id, tournament_id, kind, amount, currency, received_on, note";

/** Alle Zusatz-Einnahmen des Nutzers (RLS + expliziter user-Filter, wie loadExpenses). */
export async function loadIncome(userId: string): Promise<TourIncomeRow[]> {
  const { data, error } = await supabase
    .from("tour_income")
    .select(INCOME_COLUMNS)
    .eq("user_id", userId)
    .order("received_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as TourIncomeRow[]) ?? [];
}

export type IncomeInput = {
  amountMinor: number; // Cent (aus euroToMinor)
  currency: string;
  kind: IncomeKind;
  tournament_id: string | null;
  received_on: string; // ISO-Datum oder ""
  note: string | null;
};

/** Einnahme anlegen. Betrag als Major-Unit-Dezimalstring (Konvention der geteilten Tabellen). */
export async function addIncome(userId: string, input: IncomeInput): Promise<void> {
  const { error } = await supabase.from("tour_income").insert({
    user_id: userId,
    tournament_id: input.tournament_id,
    kind: input.kind,
    amount: minorToEuro(input.amountMinor),
    currency: input.currency.toUpperCase().slice(0, 3),
    received_on: input.received_on || null,
    note: input.note,
  });
  if (error) throw error;
}

/** Einnahme löschen (eigene Zeile, RLS). */
export async function removeIncome(id: string): Promise<void> {
  const { error } = await supabase.from("tour_income").delete().eq("id", id);
  if (error) throw error;
}
