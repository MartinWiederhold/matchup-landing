import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * Live-Profitennis (Herren + Damen) über ESPNs öffentliche Scoreboard-API (kein Key).
 * Inoffiziell → best effort, 60s gecacht. Reine Spielstände (Fakten), Anzeige mit Quelle ESPN.
 *   /api/tennis  → { tournament, round, updatedAt, men:[Match], women:[Match] }
 */
const UA = { "User-Agent": "MatchupMap/1.0 (wiederhold.martin@web.de)" };
type Espn = { events?: EspnEvent[] };
type EspnEvent = { name?: string; shortName?: string; major?: boolean; endDate?: string; competitions?: EspnComp[]; groupings?: { grouping?: { displayName?: string }; competitions?: EspnComp[] }[] };
type EspnComp = {
  date?: string;
  status?: { type?: { state?: string; shortDetail?: string; description?: string; completed?: boolean } };
  round?: { displayName?: string };
  notes?: { headline?: string }[];
  competitors?: EspnCompetitor[];
};
type EspnCompetitor = { winner?: boolean; curatedRank?: { current?: number }; athlete?: { displayName?: string; shortName?: string; flag?: { alt?: string } }; linescores?: { value?: number }[] };

export type Match = {
  round: string;
  state: "pre" | "in" | "post";
  statusText: string;
  players: { name: string; country: string | null; seed: number | null; sets: number[]; won: boolean }[];
};

function player(c: EspnCompetitor) {
  return {
    name: c.athlete?.displayName || c.athlete?.shortName || "—",
    country: c.athlete?.flag?.alt ?? null,
    seed: c.curatedRank?.current && c.curatedRank.current < 100 ? c.curatedRank.current : null,
    sets: (c.linescores ?? []).map((l) => Math.round(l.value ?? 0)),
    won: !!c.winner,
  };
}

function normComp(comp: EspnComp, groupName?: string): Match | null {
  const cs = comp.competitors ?? [];
  if (cs.length < 2 || !cs[0].athlete?.displayName || !cs[1].athlete?.displayName) return null;
  const st = comp.status?.type;
  const state = st?.state === "in" ? "in" : st?.state === "post" || st?.completed ? "post" : "pre";
  const round = comp.round?.displayName || comp.notes?.[0]?.headline || groupName || "";
  return { round, state, statusText: st?.shortDetail || st?.description || "", players: cs.slice(0, 2).map(player) };
}

function collect(ev: EspnEvent): Match[] {
  const out: Match[] = [];
  for (const c of ev.competitions ?? []) { const m = normComp(c); if (m) out.push(m); }
  for (const g of ev.groupings ?? []) {
    const gn = g.grouping?.displayName;
    if (gn && /doubles/i.test(gn)) continue; // Fokus Einzel
    for (const c of g.competitions ?? []) { const m = normComp(c, gn); if (m) out.push(m); }
  }
  // Live zuerst, dann laufend/beendet
  const rank = (m: Match) => (m.state === "in" ? 0 : m.state === "post" ? 1 : 2);
  return out.sort((a, b) => rank(a) - rank(b)).slice(0, 40);
}

async function tour(league: "atp" | "wta"): Promise<{ name: string; matches: Match[] } | null> {
  try {
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/tennis/${league}/scoreboard`, { headers: UA, next: { revalidate: 60 } });
    if (!r.ok) return null;
    const d = (await r.json()) as Espn;
    const events = d.events ?? [];
    // grösstes/aktuelles Turnier: bevorzugt Grand Slam (major), sonst mit den meisten Matches
    const scored = events.map((e) => ({ e, n: collect(e).length })).filter((x) => x.n > 0);
    scored.sort((a, b) => (b.e.major ? 1 : 0) - (a.e.major ? 1 : 0) || b.n - a.n);
    const top = scored[0];
    if (!top) return null;
    return { name: top.e.name || top.e.shortName || "", matches: collect(top.e) };
  } catch {
    return null;
  }
}

export async function GET() {
  const [men, women] = await Promise.all([tour("atp"), tour("wta")]);
  const tournament = men?.name || women?.name || null;
  if (!tournament) return NextResponse.json({ tournament: null, men: [], women: [] });
  return NextResponse.json({
    tournament,
    updatedAt: new Date().toISOString(),
    men: men?.matches ?? [],
    women: women?.matches ?? [],
  });
}
