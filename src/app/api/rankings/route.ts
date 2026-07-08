import { NextResponse } from "next/server";

export const maxDuration = 30;

/**
 * Live-Rankings (ATP/WTA) für Namens-Autofill im Spielerprofil.
 * Quelle: öffentliche Datensätze von Jeff Sackmann (GitHub, kein Key). Tages-Cache.
 *   /api/rankings?name=alcaraz&tour=atp  → { date, tour, results:[{name, rank, ioc}] }
 * Ohne Quelle/Treffer → { date:null, results:[] } (UI: manuell eintragen).
 */
const UA = { "User-Agent": "MatchupMap/1.0 (wiederhold.martin@web.de)" };
const SRC: Record<string, { rankings: string; players: string }> = {
  atp: {
    rankings: "https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv",
    players: "https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv",
  },
  wta: {
    rankings: "https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_rankings_current.csv",
    players: "https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_players.csv",
  },
};

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, "").trim();
}

async function text(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: UA, next: { revalidate: 86400 } }); // 1 Tag
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = norm(u.searchParams.get("name") ?? "");
  const tour = (u.searchParams.get("tour") ?? "atp").toLowerCase() === "wta" ? "wta" : "atp";
  if (q.length < 2) return NextResponse.json({ date: null, tour, results: [] });

  const src = SRC[tour];
  const [rankCsv, playerCsv] = await Promise.all([text(src.rankings), text(src.players)]);
  if (!rankCsv || !playerCsv) return NextResponse.json({ date: null, tour, results: [], error: "source_unavailable" });

  // aktuelles Datum + Rang je player_id (nur der jüngste ranking_date)
  const rlines = rankCsv.trim().split("\n");
  let latest = "";
  for (let i = 1; i < rlines.length; i++) {
    const d = rlines[i].slice(0, rlines[i].indexOf(","));
    if (d > latest) latest = d;
  }
  const rankById = new Map<string, number>();
  for (let i = 1; i < rlines.length; i++) {
    const c = rlines[i].split(",");
    if (c[0] === latest) rankById.set(c[2], parseInt(c[1], 10));
  }

  // Namen für gerankte Spieler (players.csv: player_id,name_first,name_last,hand,dob,ioc,...)
  const plines = playerCsv.trim().split("\n");
  const out: { name: string; rank: number; ioc: string; n: string }[] = [];
  for (let i = 1; i < plines.length; i++) {
    const c = plines[i].split(",");
    const rank = rankById.get(c[0]);
    if (rank == null) continue;
    const name = `${c[1] ?? ""} ${c[2] ?? ""}`.trim();
    out.push({ name, rank, ioc: (c[5] ?? "").toUpperCase(), n: norm(name) });
  }

  const results = out
    .filter((p) => p.n.includes(q))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 8)
    .map(({ name, rank, ioc }) => ({ name, rank, ioc }));

  const fmtDate = latest.length === 8 ? `${latest.slice(0, 4)}-${latest.slice(4, 6)}-${latest.slice(6, 8)}` : latest;
  return NextResponse.json({ date: fmtDate, tour, results });
}
