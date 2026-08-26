/**
 * Tagesblick Overview: heute und morgen aus drei Quellen, ohne erfundene Felder.
 * Uhr nur aus event_time; Slot bleibt Block (kein Umrechnen in Minuten);
 * Physio nur als tour_events-Zeile; Person nur bei Match-Gegner oder Slot-Zusage.
 */

import { TIME_BLOCKS, isTimeBlock, weekDates } from "./trainingSlots";

export type GlanceEvent = {
  id: string;
  kind: string;
  title: string;
  event_date: string;
  event_time: string | null;
  opponent: string | null;
};

export type GlanceTournament = {
  id: string;
  monday: string;
  city: string | null;
};

export type GlanceMeeting = {
  id: string;
  date: string;
  block: string;
  partnerName: string | null;
  tournamentId: string;
};

export type GlanceRow = {
  id: string;
  date: string;
  source: "tournament" | "event" | "slot";
  sort: string;
  eventKind: string | null;
  title: string;
  clock: string | null;
  block: string | null;
  personName: string | null;
  city: string | null;
  href: string;
};

const BLOCK_SORT: Record<string, string> = Object.fromEntries(
  TIME_BLOCKS.map((b, i) => [b.code, `1-${String(i).padStart(2, "0")}`]),
);

export function addIsoDays(iso: string, n: number): string {
  const ms = Date.parse(iso + "T00:00:00Z");
  if (Number.isNaN(ms)) return iso;
  return new Date(ms + n * 86_400_000).toISOString().slice(0, 10);
}

function coversDay(monday: string, iso: string): boolean {
  return weekDates(monday).includes(iso);
}

function clockOf(raw: string | null): string | null {
  if (!raw) return null;
  const hhmm = raw.slice(0, 5);
  return /^\d{2}:\d{2}$/.test(hhmm) ? hhmm : null;
}

/** Zusagen, an denen der Betrachter hängt — pending/declined fallen raus. */
export function acceptedMeetingsForViewer(
  viewerId: string,
  slots: { id: string; user_id: string; slot_date: string; time_block: string; tournament_id: string }[],
  responses: { slot_id: string; responder_id: string; status: string }[],
): { slotId: string; date: string; block: string; partnerId: string; tournamentId: string }[] {
  const out: { slotId: string; date: string; block: string; partnerId: string; tournamentId: string }[] = [];
  const bySlot = new Map<string, { slot_id: string; responder_id: string; status: string }[]>();
  for (const r of responses) {
    const a = bySlot.get(r.slot_id);
    if (a) a.push(r);
    else bySlot.set(r.slot_id, [r]);
  }
  for (const s of slots) {
    const acc = (bySlot.get(s.id) ?? []).filter((r) => r.status === "accepted");
    if (s.user_id === viewerId) {
      for (const r of acc) {
        out.push({ slotId: s.id, date: s.slot_date, block: s.time_block, partnerId: r.responder_id, tournamentId: s.tournament_id });
      }
    } else if (acc.some((r) => r.responder_id === viewerId)) {
      out.push({ slotId: s.id, date: s.slot_date, block: s.time_block, partnerId: s.user_id, tournamentId: s.tournament_id });
    }
  }
  return out;
}

function sortKey(row: Pick<GlanceRow, "source" | "clock" | "block">): string {
  if (row.source === "tournament") return "0";
  if (row.clock) return `2-${row.clock}`;
  if (row.block && BLOCK_SORT[row.block]) return BLOCK_SORT[row.block];
  return "9";
}

export function buildDayGlance(input: {
  todayISO: string;
  events: GlanceEvent[];
  tournaments: GlanceTournament[];
  meetings: GlanceMeeting[];
}): { date: string; rows: GlanceRow[] }[] {
  const days = [input.todayISO, addIsoDays(input.todayISO, 1)];
  const daySet = new Set(days);
  const groups: { date: string; rows: GlanceRow[] }[] = days.map((date) => ({ date, rows: [] }));
  const bucket = (date: string) => groups.find((g) => g.date === date);

  for (const tt of input.tournaments) {
    for (const date of days) {
      if (!coversDay(tt.monday, date)) continue;
      const row: GlanceRow = {
        id: `t-${tt.id}-${date}`,
        date,
        source: "tournament",
        sort: "",
        eventKind: null,
        title: tt.city?.trim() || "",
        clock: null,
        block: null,
        personName: null,
        city: tt.city?.trim() || null,
        href: `/tour2/season?id=${encodeURIComponent(tt.id)}`,
      };
      row.sort = sortKey(row);
      bucket(date)?.rows.push(row);
    }
  }

  for (const e of input.events) {
    if (!daySet.has(e.event_date)) continue;
    const clock = clockOf(e.event_time);
    const opponent = e.kind === "match" && e.opponent?.trim() ? e.opponent.trim() : null;
    const row: GlanceRow = {
      id: `e-${e.id}`,
      date: e.event_date,
      source: "event",
      sort: "",
      eventKind: e.kind,
      title: e.title.trim(),
      clock,
      block: null,
      personName: opponent,
      city: null,
      href: "/tour2/calendar",
    };
    row.sort = sortKey(row);
    bucket(e.event_date)?.rows.push(row);
  }

  for (const m of input.meetings) {
    if (!daySet.has(m.date)) continue;
    const block = isTimeBlock(m.block) ? m.block : null;
    const row: GlanceRow = {
      id: `s-${m.id}`,
      date: m.date,
      source: "slot",
      sort: "",
      eventKind: "training",
      title: "",
      clock: null,
      block,
      personName: m.partnerName?.trim() || null,
      city: null,
      href: `/tour2/season?id=${encodeURIComponent(m.tournamentId)}`,
    };
    row.sort = sortKey(row);
    bucket(m.date)?.rows.push(row);
  }

  for (const g of groups) g.rows.sort((a, b) => a.sort.localeCompare(b.sort) || a.id.localeCompare(b.id));
  return groups;
}
