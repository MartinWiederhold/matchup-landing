import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * Live-Profitennis über ESPNs öffentliche Scoreboard-API (kein Key). Inoffiziell → best effort.
 *   /api/tennis → {
 *     updatedAt,
 *     tournament: { name, startDate, endDate, year } | null,
 *     categories: [{ key, label, matches:[Match] }],   // Google-Widget-Style (Einzel + Doppel)
 *     men:   { name, matches:[Match] } | null,          // rückwärtskompatibel
 *     women: { name, matches:[Match] } | null,
 *   }
 * Reine Spielstände (Fakten), Anzeige mit Quelle ESPN. Hinweis: ESPN liefert KEINE
 * Live-Game-Punkte (15/30/40) und keinen Aufschlag → der aktuelle Satz wird hervorgehoben.
 */
const UA = { "User-Agent": "MatchupMap/1.0 (wiederhold.martin@web.de)" };
type Espn = { events?: EspnEvent[] };
type EspnEvent = { name?: string; shortName?: string; major?: boolean; date?: string; endDate?: string; season?: { year?: number }; competitions?: EspnComp[]; groupings?: EspnGrouping[] };
type EspnGrouping = { grouping?: { displayName?: string }; competitions?: EspnComp[] };
type EspnComp = {
  date?: string;
  status?: { type?: { state?: string; shortDetail?: string; description?: string; completed?: boolean } };
  round?: { displayName?: string };
  venue?: { fullName?: string };
  notes?: { headline?: string }[];
  competitors?: EspnCompetitor[];
};
type EspnCompetitor = { winner?: boolean; curatedRank?: { current?: number }; athlete?: { displayName?: string; shortName?: string; flag?: { alt?: string; href?: string } }; linescores?: { value?: number }[] };

export type Match = {
  round: string;
  court: string | null;
  state: "pre" | "in" | "post";
  statusText: string;
  date: string | null;
  players: { name: string; country: string | null; flag: string | null; seed: number | null; sets: number[]; won: boolean }[];
};

const ROUND_DE: [RegExp, string][] = [
  [/final(?!.*(quarter|semi))|\bfinale\b/i, "Finale"],
  [/sem|halbf/i, "Halbfinale"],
  [/quarter|viertel/i, "Viertelfinale"],
  [/round of 16|achtel/i, "Achtelfinale"],
  [/round of 32|3rd round|third/i, "3. Runde"],
  [/round of 64|2nd round|second/i, "2. Runde"],
  [/round of 128|1st round|first/i, "1. Runde"],
];
function roundDe(r: string): string {
  for (const [re, de] of ROUND_DE) if (re.test(r)) return de;
  return r;
}

function player(c: EspnCompetitor) {
  return {
    name: c.athlete?.displayName || c.athlete?.shortName || "—",
    country: c.athlete?.flag?.alt ?? null,
    flag: c.athlete?.flag?.href ?? null,
    seed: c.curatedRank?.current && c.curatedRank.current < 100 ? c.curatedRank.current : null,
    sets: (c.linescores ?? []).map((l) => Math.round(l.value ?? 0)),
    won: !!c.winner,
  };
}

function normComp(comp: EspnComp): Match | null {
  const cs = comp.competitors ?? [];
  if (cs.length < 2 || !cs[0].athlete?.displayName || !cs[1].athlete?.displayName) return null;
  const st = comp.status?.type;
  const state = st?.state === "in" ? "in" : st?.state === "post" || st?.completed ? "post" : "pre";
  const rawRound = comp.round?.displayName || comp.notes?.[0]?.headline || "";
  return {
    round: roundDe(rawRound),
    court: comp.venue?.fullName ?? null,
    state,
    statusText: st?.shortDetail || st?.description || "",
    date: comp.date ?? null,
    players: cs.slice(0, 2).map(player),
  };
}

const rank = (m: Match) => (m.state === "in" ? 0 : m.state === "post" ? 1 : 2);
function sortMatches(a: Match, b: Match) {
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  return (b.date ?? "").localeCompare(a.date ?? ""); // neueste zuerst
}
const keyOf = (m: Match) => m.players.map((p) => p.name).sort().join("|");

/** Matches einer Gruppierung (nach displayName) aus einem Event. */
function groupingMatches(ev: EspnEvent, displayName: string): Match[] {
  const out: Match[] = [];
  for (const g of ev.groupings ?? []) {
    if ((g.grouping?.displayName ?? "").toLowerCase() !== displayName.toLowerCase()) continue;
    for (const c of g.competitions ?? []) { const m = normComp(c); if (m) out.push(m); }
  }
  return out;
}

async function fetchBoard(league: "atp" | "wta", date?: string): Promise<EspnEvent[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/tennis/${league}/scoreboard${date ? `?dates=${date}` : ""}`;
    const r = await fetch(url, { headers: UA, next: { revalidate: 25 } });
    if (!r.ok) return [];
    return ((await r.json()) as Espn).events ?? [];
  } catch {
    return [];
  }
}
/** Grösstes/aktuelles Turnier: bevorzugt Grand Slam (major). */
function pickMajor(events: EspnEvent[]): EspnEvent | null {
  const withMatches = events
    .map((e) => ({ e, n: (e.groupings ?? []).reduce((s, g) => s + (g.competitions?.length ?? 0), 0) + (e.competitions?.length ?? 0) }))
    .filter((x) => x.n > 0);
  withMatches.sort((a, b) => (b.e.major ? 1 : 0) - (a.e.major ? 1 : 0) || b.n - a.n);
  return withMatches[0]?.e ?? null;
}

const CATS: { key: string; label: string; dn: string }[] = [
  { key: "ms", label: "Herren Einzel", dn: "Men's Singles" },
  { key: "ws", label: "Damen Einzel", dn: "Women's Singles" },
  { key: "md", label: "Herren Doppel", dn: "Men's Doubles" },
  { key: "wd", label: "Damen Doppel", dn: "Women's Doubles" },
  { key: "xd", label: "Mixed-Doppel", dn: "Mixed Doubles" },
];

export async function GET() {
  const [atp, wta] = await Promise.all([fetchBoard("atp"), fetchBoard("wta")]);
  const evAtp = pickMajor(atp);
  const evWta = pickMajor(wta);
  const meta = evAtp || evWta;

  const categories = CATS.map((cat) => {
    const merged = new Map<string, Match>();
    for (const ev of [evAtp, evWta]) {
      if (!ev) continue;
      for (const m of groupingMatches(ev, cat.dn)) {
        const k = keyOf(m);
        const prev = merged.get(k);
        // Live/vollständigere Version bevorzugen (post > in > pre laut rank)
        if (!prev || rank(m) < rank(prev)) merged.set(k, m);
      }
    }
    // Anstehende Partien (live/angesetzt) NIE wegschneiden — sie sind das Relevanteste
    // (z. B. das morgige Finale). Danach beendete nach Datum absteigend auffüllen.
    const all = Array.from(merged.values());
    const upcoming = all.filter((m) => m.state !== "post");
    const done = all.filter((m) => m.state === "post").sort(sortMatches);
    const matches = [...upcoming, ...done].slice(0, 140);
    return { key: cat.key, label: cat.label, matches };
  }).filter((c) => c.matches.length > 0);

  const ms = categories.find((c) => c.key === "ms");
  const ws = categories.find((c) => c.key === "ws");

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    tournament: meta
      ? { name: meta.name || meta.shortName || "", startDate: meta.date ?? null, endDate: meta.endDate ?? null, year: meta.season?.year ?? null }
      : null,
    categories,
    men: ms ? { name: meta?.name ?? "", matches: ms.matches } : null,
    women: ws ? { name: meta?.name ?? "", matches: ws.matches } : null,
  });
}
