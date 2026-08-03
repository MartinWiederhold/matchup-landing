/**
 * Datenschicht für die Kostensätze der Route /tour/costs (web.tour_cost_rates).
 *
 * EIGENE DATEI (nicht tour.ts): /app-Compete und /tour bleiben entkoppelt.
 * Ausschließlich der Anon-Client — nie der Service-Client (RLS wirkt).
 *
 * Beträge liegen in der DB als ganzzahlige Minor Units (Cent), exakt wie
 * src/domain/tour/costs.ts rechnet. Die Umrechnung Euro↔Cent lebt HIER, damit die
 * Komponente keine eigene Rechnung führt — und sie bleibt ganzzahlig (kein
 * `parseFloat * 100`, das Rundungsfehler erzeugt: 19,99 € → 1998,999… Cent).
 */

import { supabase } from "@/lib/supabase";
import type { TourCostRates } from "@/lib/types";

const COLUMNS =
  "user_id, arrival_minor, per_night_minor, food_per_day_minor, coach_per_week_minor, currency, created_at, updated_at";

/**
 * Vorschlagswerte als PLATZHALTER-Startpunkt in Cent — NIE als DB-Default und NIE
 * vorausgefüllt in ein Feld (sonst nicht mehr von echter Eingabe unterscheidbar).
 *
 * KEINE QUELLE: Diese Zahlen sind grobe Orientierung (Größenordnung) für einen
 * Budget-Spieler in der Zielregion, KEIN belegter Fakt. Sie dienen nur als
 * Anhaltspunkt beim ersten Ausfüllen und werden vom Nutzer überschrieben.
 * Coach fehlt bewusst: dafür gibt es keine belastbare Größenordnung (0 bis mehrere
 * Hundert € je nach Setup) → dieses Feld bekommt keinen Vorschlag.
 */
export const SUGGESTED_RATES_MINOR = {
  arrival: 12000, // ~120 €
  perNight: 5000, // ~50 €
  foodPerDay: 3000, // ~30 €
} as const;

/** Auswahl gängiger Währungen der Zielregion (ISO 4217). Keine Umrechnung. */
export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "TRY", "PLN", "CZK", "SEK", "NOK", "DKK", "RON", "MAD", "TND", "EGP"] as const;

/**
 * Euro-Eingabe (String) → ganzzahlige Cent, ODER null bei leer/ungültig.
 * Ganzzahlig durch String-Zerlegung statt Fließkomma: Euro- und Cent-Teil getrennt.
 * Erlaubt Komma oder Punkt, höchstens zwei Nachkommastellen.
 */
export function euroToMinor(input: string): number | null {
  const s = input.trim().replace(",", ".");
  if (s === "") return null;
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null; // ungültig → null (Aufrufer behandelt das)
  const [whole, frac = ""] = s.split(".");
  const cents = (frac + "00").slice(0, 2); // auf zwei Stellen auffüllen
  return Number(whole) * 100 + Number(cents);
}

/** Cent → Euro-Anzeige-String (ganzzahlig zerlegt), z. B. 4950 → "49.50", 5000 → "50". */
export function minorToEuro(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const euro = Math.floor(abs / 100);
  const cents = abs % 100;
  return cents === 0 ? `${sign}${euro}` : `${sign}${euro}.${String(cents).padStart(2, "0")}`;
}

/** Die Kostensätze des Nutzers (oder null, wenn noch keine gespeichert sind). */
export async function loadCostRates(): Promise<TourCostRates | null> {
  const { data, error } = await supabase.from("tour_cost_rates").select(COLUMNS).maybeSingle();
  if (error) throw error;
  return (data as TourCostRates | null) ?? null;
}

/** Zu speichernde Werte: Beträge in Cent (null = unbekannt) + Währung. */
export type CostRatesPatch = {
  arrival_minor: number | null;
  per_night_minor: number | null;
  food_per_day_minor: number | null;
  coach_per_week_minor: number | null;
  currency: string | null;
};

/** Kostensätze speichern (Upsert auf user_id — höchstens eine Zeile je Nutzer). */
export async function saveCostRates(userId: string, patch: CostRatesPatch): Promise<void> {
  const { error } = await supabase
    .from("tour_cost_rates")
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
}
