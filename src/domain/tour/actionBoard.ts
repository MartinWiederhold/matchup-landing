/**
 * Morgen-Dashboard / Handlungsbedarf für die Tour (Domain-Schicht, v1).
 *
 *   Bereits berechnete Modul-Ausgaben (Fristen, Dokumente, Schengen, Punkte-Verfall,
 *   Alternate-Trend, Wildcards, Budget) + Stichtag
 *   →  die drei Kopf-Blöcke (Spieler / Aktuell / Nächste Wochen) und die geordnete
 *      Ampel-Liste „Handlungsbedarf" — NUR, was Handlung erfordert.
 *
 * Reine Funktion: keine DB, kein Netzwerk, KEINE Systemuhr — der Stichtag `asOf` ist Pflicht.
 * Baut NICHTS Neues: nutzt die vorhandenen reinen Module (tourDeadlines, alternateTrend) und
 * bekommt die schweren Nutzer-Auswertungen (documentWarnings, schengenUsage, pointsForecast)
 * als fertige Zusammenfassungen herein. Rückgaben tragen nur Codes/Parameter, keine Sätze.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FARBREGEL — NICHT AUFWEICHEN:
 * ROT gilt AUSSCHLIESSLICH für BEREITS EINGETRETENE Zustände: Frist verpasst, Dokument
 * abgelaufen, Schengen überschritten, Einreise gesperrt. NIEMALS für „läuft morgen ab".
 * Sobald Rot auch Bevorstehendes markiert, verliert es seine Bedeutung — dann ist alles rot.
 * Bevorstehendes ist BERNSTEIN. (Dieselbe Zurückhaltung wie im übrigen /tour.)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * JEDER Punkt trägt ein `target` — den Weg zur Erledigung. Ein Handlungsbedarf ohne Weg zur
 * Handlung wäre eine Mahnung, kein Werkzeug.
 */

import { tourDeadlines, type TourSeries } from "./deadlines";
import { alternateTrend } from "./entryTrend";
import type { VisaLeadWarning } from "./visaLeadWarnings";

export const ACTION_BOARD_VERSION = "v1";

const DAY = 86_400_000;
const ENTRY_SOON_DAYS = 7; // Meldefrist „naht"
const WITHDRAW_SOON_DAYS = 5; // Rückzugsfrist „naht"
const WILDCARD_STALE_DAYS = 14; // Anfrage ohne Antwort „seit längerem"
const SCHENGEN_NEAR_LEFT = 14; // Rest-Tage im Schengen-Fenster
const DECISION_SOON_DAYS = 14; // Entscheidung nur für die nächsten ~2 Wochen anmahnen

// Status, die „gemeldet/im Feld" bedeuten (Rückzug + Gebühr relevant); Vorlage aus reminders.ts.
const ENTERED = new Set(["entered", "main_draw", "qualifying", "alternate", "confirmed"]);
// „raus" — kein Handlungsbedarf mehr.
const OUT = new Set(["withdrawn", "cancelled"]);

export type ActionSeverity = "red" | "amber";
export type ActionKind =
  | "entry_missed" | "entry_deadline" | "withdrawal_deadline" | "fee_unpaid"
  | "doc_expired" | "doc_expiring" | "schengen_exceeded" | "schengen_near"
  | "entry_banned" | "points_expiring" | "wildcard_no_answer"
  | "alternate_moving" | "decision_open" | "budget_over" | "tournament_inactive"
  | "visa_lead";

/** Weg zur Erledigung: ein Saison-Turnier im Planer öffnen ODER eine Route aufrufen. */
export type ActionTarget = { type: "tournament"; id: string } | { type: "route"; href: string };

export type ActionItem = {
  kind: ActionKind;
  severity: ActionSeverity;
  target: ActionTarget;
  sort: number; // interner Sortierschlüssel (aufsteigend): Rest-Tage; negativ = überfällig
  params: Record<string, string | number>; // für i18n (city, date, days, points, dest, n …)
};

// ── Eingaben ──────────────────────────────────────────────────────────────────
export type BoardTournament = {
  id: string;
  city: string | null;
  country: string | null; // ISO2
  monday: string; // ISO-Datum (Turniermontag)
  series: TourSeries;
  status: string; // TourEntryStatus
  alternatePosition: number | null;
  feePaid: boolean;
  decision: string | null; // play|wait|fallback|open
  inactive: boolean; // valid_to gesetzt
  alternateObs: { observedAt: string; alternatePosition: number | null }[];
};

export type BoardDocWarning = { kind: string; severity: "error" | "warn"; date?: string; days?: number; destination?: string | null; ruleOfThumb?: boolean };
export type BoardWildcard = { tournamentName: string; tournamentId: string | null; requestedOn: string | null; outcome: string | null };
export type BoardPoints = { total: number; nextExpiry: { date: string; points: number } | null; expiringSoon: { date: string; points: number } | null } | null;

export type BoardInput = {
  asOf: string;
  tournaments: BoardTournament[];
  banned: string[]; // ISO2 gesperrte Zielländer
  docWarnings: BoardDocWarning[];
  schengen: { exceeds: boolean; used: number; left: number } | null;
  points: BoardPoints;
  wildcards: BoardWildcard[];
  budgetOver: { amountMinor: number; currency: string } | null; // >0 = über Budget
  visaLead?: VisaLeadWarning[]; // Vorlaufzeit-Warnungen (Nutzerangabe), optional
};

// ── Ausgaben ──────────────────────────────────────────────────────────────────
export type BoardCurrent = { id: string; city: string | null; country: string | null; status: string } | null;
export type BoardWeek = { id: string; city: string | null; country: string | null; monday: string; status: string; decision: string | null };
export type ActionBoard = {
  rulesVersion: string;
  player: { total: number; nextExpiry: { date: string; points: number } | null } | null;
  current: BoardCurrent;
  upcoming: BoardWeek[];
  actions: ActionItem[];
  clear: boolean; // actions leer → „heute nichts zu tun"
};

function dayMs(iso: string): number {
  return Date.parse(iso + "T00:00:00Z");
}
/** Volle Tage zwischen zwei Zeitpunkten (abgerundet). „in X Tagen" zählt ganze Tage: eine
 *  Frist in 4 Tagen + 14 h ist „in 4 Tagen", nicht 5. Bei Überfälligkeit entsprechend negativ. */
function diffDays(aMs: number, bMs: number): number {
  return Math.floor((aMs - bMs) / DAY);
}

/**
 * Baut das Dashboard. `asOf` als ISO-Datum (Pflicht). Reihenfolge der actions: ROT vor
 * BERNSTEIN; innerhalb nach `sort` aufsteigend (überfälligstes bzw. nächstes zuerst).
 */
export function buildActionBoard(input: BoardInput): ActionBoard {
  const asOfMs = dayMs(input.asOf);
  if (Number.isNaN(asOfMs)) {
    return { rulesVersion: ACTION_BOARD_VERSION, player: null, current: null, upcoming: [], actions: [], clear: true };
  }
  const bannedSet = new Set(input.banned.map((c) => c.toUpperCase()));
  const actions: ActionItem[] = [];
  const push = (kind: ActionKind, severity: ActionSeverity, target: ActionTarget, sort: number, params: Record<string, string | number> = {}) =>
    actions.push({ kind, severity, target, sort, params });

  // ── Kopf: Aktuell (Turnier dieser Woche) + Nächste Wochen ─────────────────────
  const withMs = input.tournaments
    .map((t) => ({ t, ms: dayMs(t.monday) }))
    .filter((x) => !Number.isNaN(x.ms))
    .sort((a, b) => a.ms - b.ms);

  const currentEntry = withMs.find((x) => x.ms <= asOfMs && asOfMs <= x.ms + 6 * DAY) ?? null;
  const current: BoardCurrent = currentEntry
    ? { id: currentEntry.t.id, city: currentEntry.t.city, country: currentEntry.t.country, status: currentEntry.t.status }
    : null;
  const upcoming: BoardWeek[] = withMs
    .filter((x) => x.ms > asOfMs && x.t.id !== currentEntry?.t.id)
    .slice(0, 3)
    .map((x) => ({ id: x.t.id, city: x.t.city, country: x.t.country, monday: x.t.monday, status: x.t.status, decision: x.t.decision }));

  // ── Handlungsbedarf je Turnier ────────────────────────────────────────────────
  for (const { t, ms } of withMs) {
    const out = OUT.has(t.status);
    const entered = ENTERED.has(t.status);
    const held = t.decision === "wait" || t.decision === "fallback"; // bewusst nicht gemeldet
    const tgt: ActionTarget = { type: "tournament", id: t.id };

    // Einreise gesperrt (ROT — harte Sperre, bereits geltender Zustand).
    if (!out && t.country && bannedSet.has(t.country.toUpperCase())) {
      push("entry_banned", "red", tgt, -2, { city: t.city ?? "", dest: t.country });
    }

    // Turnier nicht mehr verfügbar (BERNSTEIN — ersetzen/entfernen).
    if (t.inactive && !out) push("tournament_inactive", "amber", tgt, 50, { city: t.city ?? "" });

    // Fristen (nur ITF bekannt).
    const dl = tourDeadlines(new Date(ms), t.series);
    if (dl.known && dl.entry && t.status === "planned" && !held) {
      const d = diffDays(dl.entry.getTime(), asOfMs);
      if (dl.entry.getTime() < asOfMs) {
        // Meldefrist VERPASST (ROT — bereits eingetreten).
        push("entry_missed", "red", tgt, d, { city: t.city ?? "", date: dl.entry.toISOString().slice(0, 10) });
      } else if (d <= ENTRY_SOON_DAYS) {
        // Meldefrist NAHT (BERNSTEIN — bevorstehend, nie rot).
        push("entry_deadline", "amber", tgt, d, { city: t.city ?? "", days: d });
      }
    }
    if (dl.known && dl.withdrawal && entered) {
      const d = diffDays(dl.withdrawal.getTime(), asOfMs);
      if (dl.withdrawal.getTime() >= asOfMs && d <= WITHDRAW_SOON_DAYS) {
        push("withdrawal_deadline", "amber", tgt, d, { city: t.city ?? "", days: d });
      }
    }

    // Meldegebühr offen bei gemeldetem Turnier (BERNSTEIN).
    if (entered && !t.feePaid) push("fee_unpaid", "amber", tgt, 10, { city: t.city ?? "" });

    // Alternate bewegt sich (BERNSTEIN).
    if (t.status === "alternate") {
      const tr = alternateTrend(t.alternateObs, input.asOf);
      if (tr.kind === "up" || tr.kind === "down") {
        push("alternate_moving", "amber", tgt, 15, { city: t.city ?? "", dir: tr.kind, delta: Math.abs(tr.delta), pos: t.alternatePosition ?? 0 });
      }
    }

    // Entscheidung offen für ein Turnier der nächsten ~2 Wochen (BERNSTEIN).
    if ((t.decision === "open" || t.decision == null) && t.status === "planned" && !out) {
      const d = diffDays(ms, asOfMs);
      if (d >= 0 && d <= DECISION_SOON_DAYS) push("decision_open", "amber", { type: "route", href: "/tour/pipeline" }, d, { city: t.city ?? "" });
    }
  }

  // ── Dokumente (documentWarnings) ──────────────────────────────────────────────
  for (const w of input.docWarnings) {
    if (w.severity === "error") {
      // Abgelaufen (ROT — bereits eingetreten).
      const d = w.date ? diffDays(dayMs(w.date), asOfMs) : -1;
      push("doc_expired", "red", { type: "route", href: "/tour/setup" }, d, { kind: w.kind, date: w.date ?? "" });
    } else {
      // Läuft ab / zu kurz (BERNSTEIN).
      push("doc_expiring", "amber", { type: "route", href: "/tour/setup" }, w.days ?? 30, { kind: w.kind, date: w.date ?? "", days: w.days ?? 0, dest: w.destination ?? "", ruleOfThumb: w.ruleOfThumb ? 1 : 0 });
    }
  }

  // ── Reisedokument: Antrag dauert länger als bis zum Turnier (BERNSTEIN, Nutzerangabe) ──
  // Vorausschau, kein eingetretener Zustand → nie rot. Weg zur Handlung: das Turnier öffnen
  // (dort stehen Einreise-Zeile + Antragslink). Sort = Wochen bis zum Turnier (nächstes zuerst).
  for (const v of input.visaLead ?? []) {
    push("visa_lead", "amber", { type: "tournament", id: v.tournamentId }, v.weeksUntil, { city: v.city ?? "", dest: v.dest, weeks: v.weeksUntil, lead: v.leadWeeks });
  }

  // ── Schengen ──────────────────────────────────────────────────────────────────
  if (input.schengen) {
    if (input.schengen.exceeds) {
      // Überschritten (ROT — bereits eingetreten).
      push("schengen_exceeded", "red", { type: "route", href: "/tour/schengen" }, -1, { used: input.schengen.used, over: input.schengen.used - 90 });
    } else if (input.schengen.left <= SCHENGEN_NEAR_LEFT) {
      push("schengen_near", "amber", { type: "route", href: "/tour/schengen" }, input.schengen.left, { left: input.schengen.left });
    }
  }

  // ── Punkte verfallen demnächst (BERNSTEIN) ─────────────────────────────────────
  if (input.points?.expiringSoon) {
    const e = input.points.expiringSoon;
    const d = diffDays(dayMs(e.date), asOfMs);
    push("points_expiring", "amber", { type: "route", href: "/tour/points" }, Number.isNaN(d) ? 28 : d, { points: e.points, date: e.date });
  }

  // ── Wildcard-Anfrage ohne Antwort seit längerem (BERNSTEIN) ─────────────────────
  for (const wc of input.wildcards) {
    const open = wc.outcome == null || wc.outcome === "pending";
    if (!open || !wc.requestedOn) continue;
    const age = diffDays(asOfMs, dayMs(wc.requestedOn));
    if (age >= WILDCARD_STALE_DAYS) {
      const tgt: ActionTarget = wc.tournamentId ? { type: "route", href: "/tour/wildcards" } : { type: "route", href: "/tour/wildcards" };
      push("wildcard_no_answer", "amber", tgt, 25, { name: wc.tournamentName, days: age });
    }
  }

  // ── Über Budget (BERNSTEIN) ─────────────────────────────────────────────────────
  if (input.budgetOver && input.budgetOver.amountMinor > 0) {
    push("budget_over", "amber", { type: "route", href: "/tour/finance" }, 40, { amount: input.budgetOver.amountMinor, currency: input.budgetOver.currency });
  }

  // Reihenfolge: ROT vor BERNSTEIN, innerhalb nach sort aufsteigend (dann kind für Stabilität).
  actions.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "red" ? -1 : 1;
    return a.sort - b.sort || a.kind.localeCompare(b.kind);
  });

  return {
    rulesVersion: ACTION_BOARD_VERSION,
    player: input.points ? { total: input.points.total, nextExpiry: input.points.nextExpiry } : null,
    current,
    upcoming,
    actions,
    clear: actions.length === 0,
  };
}
