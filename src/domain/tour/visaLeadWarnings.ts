/**
 * Vorlaufzeit-Warnung für Reisedokumente (Domain-Schicht, v1).
 *
 *   Bevorstehende Turniere + eigene Reisedokumente (mit NUTZER-Vorlaufzeit lead_weeks)
 *   →  Warnung, wenn ein Turnier NÄHER liegt als der Antrag laut eigener Angabe dauert
 *      UND das Dokument nicht vorhanden ist.
 *
 * Reine Funktion: keine DB, kein Netzwerk, KEINE Systemuhr — der Stichtag `asOf` ist Pflicht.
 * Liegt BEWUSST NEBEN documentWarnings.ts (das Pass/Versicherung je nächster Reise prüft):
 * diese Warnung matcht je Turnier ein Dokument über den Geltungsbereich (travelDocMatch) und
 * lebt allein von der NUTZER-Angabe lead_weeks. Kein belegter Bearbeitungswert — die UI
 * kennzeichnet sie als deine Schätzung. BERNSTEIN, nie rot (Vorausschau, kein eingetretener
 * Zustand). Wer das Dokument schon hat (status 'have'), bekommt keine Warnung.
 */
import { isSchengenCode } from "./schengen";
import { bestDocumentFor } from "./travelDocMatch";
import type { TravelDocStatus } from "@/lib/types";

export const VISA_LEAD_WARNINGS_VERSION = "v1";

const WEEK = 7 * 86_400_000;

export type LeadDoc = { scope: string | null; status: TravelDocStatus; valid_until: string | null; lead_weeks: number | null };
export type LeadTournament = { id: string; city: string | null; country: string | null; monday: string };
export type VisaLeadWarning = { tournamentId: string; city: string | null; dest: string; weeksUntil: number; leadWeeks: number };

function dayMs(iso: string): number {
  return Date.parse(iso + "T00:00:00Z");
}

/**
 * Je bevorstehendem Turnier höchstens eine Warnung. Ausgelöst nur, wenn für das Turnierland
 * ein Dokument mit gesetztem `lead_weeks` und status ≠ 'have' vorliegt und die Wochen bis zum
 * Turnier kleiner sind als die angegebene Vorlaufzeit. Sortiert nach Dringlichkeit.
 */
export function visaLeadWarnings(input: { asOf: string; tournaments: LeadTournament[]; docs: LeadDoc[] }): VisaLeadWarning[] {
  const asOfMs = dayMs(input.asOf);
  if (Number.isNaN(asOfMs)) return [];
  const out: VisaLeadWarning[] = [];
  for (const t of input.tournaments) {
    if (!t.country) continue;
    const ms = dayMs(t.monday);
    if (Number.isNaN(ms) || ms < asOfMs) continue; // nur bevorstehende Turniere
    const doc = bestDocumentFor(input.docs, t.country, isSchengenCode(t.country));
    if (!doc || doc.lead_weeks == null) continue; // nur mit eigener Vorlaufzeit
    if (doc.status === "have") continue; // schon vorhanden → keine Warnung
    const weeksUntil = Math.floor((ms - asOfMs) / WEEK);
    if (weeksUntil < doc.lead_weeks) {
      out.push({ tournamentId: t.id, city: t.city, dest: t.country, weeksUntil, leadWeeks: doc.lead_weeks });
    }
  }
  return out.sort((a, b) => a.weeksUntil - b.weeksUntil);
}
