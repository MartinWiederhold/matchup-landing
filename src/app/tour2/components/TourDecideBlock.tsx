"use client";

import { useT } from "@/lib/i18n";
import { decideTournament, type ReasonDirection } from "@/domain/tour/decide";
import type { TourTournament } from "@/lib/types";

// Vertrauenswert → drei Wortstufen (keine Prozentzahl, die Messgenauigkeit vortäuscht).
// Schwellen bewusst hier als benannte Konstanten: ≥0.7 belastbar, ≤0.35 kaum belastbar.
const CONFIDENCE_HIGH_MIN = 0.7;
const CONFIDENCE_LOW_MAX = 0.35;
function confidenceKey(v: number): "confidenceHigh" | "confidenceMedium" | "confidenceLow" {
  if (v >= CONFIDENCE_HIGH_MIN) return "confidenceHigh";
  if (v <= CONFIDENCE_LOW_MAX) return "confidenceLow";
  return "confidenceMedium";
}

// Richtung einer Begründung nur als dezente Farbnuance im vorhandenen Palettenrahmen.
// Bewusst KEIN Vorzeichen (+/−): ein Minus liest sich schnell als Fehler. Der einzige
// Akzent (Emerald) markiert das einzig echt Positive; alles andere bleibt in Grautönen.
function dotClass(d: ReasonDirection): string {
  return d === "dafuer" ? "bg-emerald-500" : d === "dagegen" ? "bg-neutral-400" : "bg-neutral-300";
}
function reasonTextClass(d: ReasonDirection): string {
  return d === "dafuer" ? "text-neutral-700" : d === "dagegen" ? "text-neutral-500" : "text-neutral-600";
}

/**
 * Ortsschlüssel EXAKT wie in src/domain/tour/costs.ts: `${country}|${city}`.
 * Nur so gibt es EINE Auffassung davon, was „derselbe Ort" ist — die reine Stadt
 * würde Valencia/ES und Valencia/VE (oder mehrere Córdoba) fälschlich verschmelzen
 * und für einen Transatlantikflug „Anreise entfällt" behaupten.
 */
export function placeKey(x: { country: string | null; city: string | null }): string {
  return `${x.country ?? ""}|${x.city ?? ""}`;
}

/**
 * Einschätzungsblock (Turnier-Entscheider) — geteilt zwischen /tour und /tour/season.
 *
 * `prevPlace`:
 *  - undefined → OHNE cost-Teil (Turnierkalender: eine Liste, keine Reisekette).
 *  - string | null → MIT cost-Teil (Saison): reicht die Vorstation herein. Ohne
 *    Kostensätze (params) greift `kosten_unbekannt` korrekt; bei gleichem Ort wie
 *    die Vorstation erscheint `anreise_entfaellt_gleicher_ort`.
 */
export default function TourDecideBlock({ tournament: x, prevPlace }: { tournament: TourTournament; prevPlace?: string | null }) {
  const t = useT();
  const monday = new Date(x.tournament_monday + "T00:00:00Z");
  const decision = decideTournament({
    tournament: { tournamentMonday: monday, series: x.series, category: x.category, place: placeKey(x) },
    now: new Date(), // aktuelle Zeit entsteht HIER (Client) und geht als Parameter in die reine Domain-Funktion
    ...(prevPlace !== undefined ? { cost: { prevPlace } } : {}),
  });
  const confKey = confidenceKey(decision.confidence);

  return (
    <div className="mt-4 border-t border-black/[0.06] pt-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.decide.title")}</p>
      {/* Ruhige Einordnungszeile + Verlässlichkeit als Wortstufe (keine Prozentzahl) */}
      <p className="mt-1 text-[14px] font-semibold text-neutral-800">{t(`tour.decide.cls.${decision.classification}`)}</p>
      <p className="mt-0.5 text-[11px] text-neutral-400">
        {t("tour.decide.confidenceLabel")}: {t(`tour.decide.${confKey}`)}
      </p>

      {/* Begründungen — knapp, Richtung nur als kleine Farbnuance */}
      {decision.reasons.length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {decision.reasons.map((r) => (
            <li key={r.code} className="flex items-baseline gap-2 text-[12.5px]">
              <span className={`mt-[5px] h-1 w-1 shrink-0 rounded-full ${dotClass(r.direction)}`} />
              <span className={reasonTextClass(r.direction)}>{t(`tour.decide.reason.${r.code}`)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Grenzen dieser Einschätzung — sichtbar, aber unaufgeregt (kein Fehler-Look) */}
      {decision.basisLuecken.length > 0 && (
        <div className="mt-2.5">
          <p className="text-[11px] font-semibold text-neutral-400">{t("tour.decide.lueckenTitle")}</p>
          <ul className="mt-0.5 space-y-0.5">
            {decision.basisLuecken.map((code) => (
              <li key={code} className="text-[11px] leading-relaxed text-neutral-400">{t(`tour.decide.luecke.${code}`)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
