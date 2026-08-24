/**
 * Saisonband: die Tennis-Woche (Mo–So) als Einheit. Keine Stundenraster-Logik.
 * Getestet in seasonWeeks.test.ts. KEINE Systemuhr — nowMs als Parameter.
 */

import { mondayOfMs, seasonBounds, classifyDeadline, type DeadlineKind, DAY } from "./timeline";
import { isTightLeg, restDaysBetween } from "./travelBuffer";

export type WeekTournamentIn = {
  id: string;
  monday: string; // ISO YYYY-MM-DD (Turniermontag)
  city: string | null;
  country: string | null;
  category: string | null;
  series: string;
  status: string;
  deadlineKnown: boolean;
  deadlineMs: number | null;
};

export type WeekEventIn = {
  id: string;
  kind: string;
  title: string;
  date: string;
  time: string | null;
};

export type SeasonWeekTournament = WeekTournamentIn & { deadlineKind: DeadlineKind };
export type SeasonWeekEvent = WeekEventIn;

export type WeekInbound = {
  restDays: number;
  tight: boolean;
  cluster: boolean;
  fromId: string;
  toId: string;
};

export type SeasonWeek = {
  monday: string;
  isCurrent: boolean;
  tournaments: SeasonWeekTournament[];
  events: SeasonWeekEvent[];
  inbound: WeekInbound | null;
};

function isoUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function placeOf(country: string | null, city: string | null): string | null {
  if (!country || !city) return null;
  return `${country}|${city}`;
}

function mondayISO(iso: string): string {
  return isoUTC(mondayOfMs(Date.parse(iso + "T00:00:00Z")));
}

/**
 * Baut das Saisonband: jede ISO-Woche zwischen erster und letzter Belegung
 * (Turnier oder Termin), mindestens die Woche um nowMs. Offene Wochen bleiben
 * stehen — sie sind die Pausen, nicht „leere Kalenderzellen".
 */
export function buildSeasonWeeks(input: {
  nowMs: number;
  tournaments: WeekTournamentIn[];
  events: WeekEventIn[];
  bufferDays: number;
}): SeasonWeek[] {
  const { nowMs, tournaments, events, bufferDays } = input;
  const tMondays = tournaments.map((t) => Date.parse(t.monday + "T00:00:00Z"));
  const eMs = events.map((e) => Date.parse(e.date + "T00:00:00Z"));
  const bounds = seasonBounds(tMondays, eMs, nowMs);

  const byMonday = new Map<string, WeekTournamentIn[]>();
  for (const tt of [...tournaments].sort((a, b) => a.monday.localeCompare(b.monday))) {
    const m = mondayISO(tt.monday);
    const a = byMonday.get(m) ?? [];
    a.push(tt);
    byMonday.set(m, a);
  }
  const evByMonday = new Map<string, WeekEventIn[]>();
  for (const ev of events) {
    const m = mondayISO(ev.date);
    const a = evByMonday.get(m) ?? [];
    a.push(ev);
    evByMonday.set(m, a);
  }

  const sortedT = [...tournaments].sort((a, b) => a.monday.localeCompare(b.monday) || a.id.localeCompare(b.id));
  const inboundByMonday = new Map<string, WeekInbound>();
  for (let i = 1; i < sortedT.length; i++) {
    const a = sortedT[i - 1];
    const b = sortedT[i];
    const aMs = Date.parse(a.monday + "T00:00:00Z");
    const bMs = Date.parse(b.monday + "T00:00:00Z");
    const pa = placeOf(a.country, a.city);
    const pb = placeOf(b.country, b.city);
    const cluster = pa != null && pa === pb;
    inboundByMonday.set(mondayISO(b.monday), {
      restDays: restDaysBetween(aMs, bMs),
      tight: isTightLeg(pa, aMs, pb, bMs, bufferDays),
      cluster,
      fromId: a.id,
      toId: b.id,
    });
  }

  const currentMon = isoUTC(mondayOfMs(nowMs));
  const weeks: SeasonWeek[] = [];
  for (let ms = bounds.startMs; ms < bounds.endMs; ms += 7 * DAY) {
    const monday = isoUTC(ms);
    const tts = (byMonday.get(monday) ?? []).map((tt) => ({
      ...tt,
      deadlineKind: classifyDeadline(tt.deadlineKnown, tt.deadlineMs, nowMs),
    }));
    weeks.push({
      monday,
      isCurrent: monday === currentMon,
      tournaments: tts,
      events: evByMonday.get(monday) ?? [],
      inbound: inboundByMonday.get(monday) ?? null,
    });
  }
  return weeks;
}

export type TapeBlock =
  | { kind: "week"; week: SeasonWeek }
  | { kind: "rest"; weeks: SeasonWeek[] };

/**
 * Turnierwochen und belegte/aktuelle Wochen bleiben Karten.
 * Leere Pausen-Wochen ohne Termine werden zu einem Rest-Streifen —
 * Tennis-Zeit ist nicht gleichmäßig, Google-Kalender-Zellen schon.
 */
export function groupTapeWeeks(weeks: SeasonWeek[]): TapeBlock[] {
  const out: TapeBlock[] = [];
  let rest: SeasonWeek[] = [];
  const flush = () => {
    if (rest.length === 0) return;
    out.push({ kind: "rest", weeks: rest });
    rest = [];
  };
  for (const week of weeks) {
    const keep = week.tournaments.length > 0 || week.events.length > 0 || week.isCurrent;
    if (keep) {
      flush();
      out.push({ kind: "week", week });
    } else {
      rest.push(week);
    }
  }
  flush();
  return out;
}

/** ISO-Kalenderwoche des Montags (UTC). */
export function isoWeekNumber(mondayISODate: string): number {
  const d = new Date(mondayISODate + "T00:00:00Z");
  const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const dayNr = new Date(utc).getUTCDay() || 7;
  const thursday = utc + (4 - dayNr) * DAY;
  const yearStart = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1);
  return Math.ceil(((thursday - yearStart) / DAY + 1) / 7);
}
