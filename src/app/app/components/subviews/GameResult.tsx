"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT, useLocale } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { FullLoading, SubViewHeader } from "../shared/ui";
import type { GameEvent } from "@/lib/types";

type Player = { id: string; name: string; image: string | null };
type Side = "a" | "b" | null;

export default function GameResult({ gameId }: { gameId: string }) {
  const t = useT();
  const { locale } = useLocale();
  const { profile, closeSubView } = useAppNav();

  const [game, setGame] = useState<GameEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sides, setSides] = useState<Record<string, Side>>({});
  const [score, setScore] = useState("");
  const [winner, setWinner] = useState<"a" | "b">("a");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [myDelta, setMyDelta] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("game_events")
      .select(
        `*, creator:profiles!game_events_created_by_fkey(id, first_name, display_name, profile_image),
         participants:game_participants(status, profile:profiles(id, first_name, display_name, profile_image))`,
      )
      .eq("id", gameId)
      .maybeSingle();
    const g = data as GameEvent | null;
    setGame(g);

    const list: Player[] = [];
    const seen = new Set<string>();
    type LoosePlayer = {
      id: string;
      first_name?: string | null;
      display_name?: string | null;
      profile_image?: string | null;
    };
    const push = (p?: LoosePlayer | null) => {
      if (!p || seen.has(p.id)) return;
      seen.add(p.id);
      list.push({ id: p.id, name: p.first_name || p.display_name || "?", image: p.profile_image ?? null });
    };
    push(g?.creator as LoosePlayer | null | undefined);
    (g?.participants ?? [])
      .filter((p) => p.status === "accepted")
      .forEach((p) => push(p.profile as LoosePlayer | null | undefined));

    // Standard: abwechselnd A/B (1v1 bzw. 2v2)
    const initial: Record<string, Side> = {};
    list.forEach((p, i) => (initial[p.id] = i % 2 === 0 ? "a" : "b"));
    setPlayers(list);
    setSides(initial);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load]);

  const sideA = useMemo(() => players.filter((p) => sides[p.id] === "a"), [players, sides]);
  const sideB = useMemo(() => players.filter((p) => sides[p.id] === "b"), [players, sides]);

  const teamAName = sideA.map((p) => p.name).join(" & ") || t("games.resultTeamA");
  const teamBName = sideB.map((p) => p.name).join(" & ") || t("games.resultTeamB");

  const dateStr = game
    ? new Date(game.date_time).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const cardUrl = useMemo(() => {
    if (!game) return "";
    const p = new URLSearchParams({
      a: teamAName,
      b: teamBName,
      s: score,
      w: winner,
      sport: game.sport,
      loc: game.location || "",
      date: dateStr,
      lang: locale,
    });
    if (myDelta != null) p.set("delta", myDelta > 0 ? `+${myDelta}` : `${myDelta}`);
    return `/api/score-card?${p.toString()}`;
  }, [game, teamAName, teamBName, score, winner, dateStr, locale, myDelta]);

  function cycleSide(id: string) {
    setSides((s) => ({ ...s, [id]: s[id] === "a" ? "b" : s[id] === "b" ? null : "a" }));
  }

  async function save() {
    if (saving) return;
    if (sideA.length === 0 || sideB.length === 0) {
      setError(t("games.resultNeedTeams"));
      return;
    }
    if (!score.trim()) {
      setError(t("games.resultNeedScore"));
      return;
    }
    setError("");
    setSaving(true);
    const { data, error: err } = await supabase
      .from("game_results")
      .insert({
        game_event_id: gameId,
        reporter_id: profile.id,
        side_a: sideA.map((p) => p.id),
        side_b: sideB.map((p) => p.id),
        score: score.trim(),
        winner,
      })
      .select("id")
      .single();
    if (err) {
      setSaving(false);
      // 23505 = Ergebnis für dieses Spiel existiert bereits (unique index)
      setError(err.code === "23505" ? t("games.resultDuplicate") : err.message);
      return;
    }
    // Echtes Rating-Delta des eigenen Profils holen (Trigger lief synchron).
    const { data: rh } = await supabase
      .from("rating_history")
      .select("delta")
      .eq("game_result_id", (data as { id: string }).id)
      .eq("user_id", profile.id)
      .maybeSingle();
    setMyDelta(typeof rh?.delta === "number" ? rh.delta : null);
    setSaving(false);
    setSaved(true);
  }

  async function share() {
    setBusy(true);
    const abs = typeof window !== "undefined" ? window.location.origin + cardUrl : cardUrl;
    const text = t("games.resultShareText", { a: teamAName, b: teamBName, score });
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], "matchup-score.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text });
        setBusy(false);
        return;
      }
    } catch {
      /* Fallback WhatsApp */
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${abs}`)}`, "_blank");
    setBusy(false);
  }

  if (loading || !game) return <FullLoading />;

  // Erfolg → Score-Card + Teilen
  if (saved) {
    return (
      <div className="flex h-full flex-col">
        <SubViewHeader title={t("games.resultSavedTitle")} />
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cardUrl} alt="Score-Card" className="w-full rounded-2xl ring-1 ring-white/10" />
          <p className="text-center text-sm text-zinc-400">{t("games.resultSavedText")}</p>
        </div>
        <div className="shrink-0 space-y-3 border-t border-zinc-800 p-5">
          <button
            type="button"
            onClick={share}
            disabled={busy}
            className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white hover:bg-matchup-hover disabled:opacity-60"
          >
            {t("games.resultShare")}
          </button>
          <button
            type="button"
            onClick={closeSubView}
            className="w-full rounded-full border border-zinc-700 py-3.5 text-sm font-semibold text-zinc-300"
          >
            {t("games.resultDone")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={t("games.resultTitle")} />
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <p className="text-sm text-zinc-400">{t("games.resultIntro")}</p>

        {/* Teams */}
        <div>
          <p className="text-sm font-semibold text-zinc-300">{t("games.resultTeams")}</p>
          <p className="mb-3 text-xs text-zinc-500">{t("games.resultTeamsHint")}</p>
          <div className="space-y-2">
            {players.map((p) => {
              const s = sides[p.id];
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-zinc-900 p-2.5"
                >
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/10">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-400">
                        {p.name[0]}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => cycleSide(p.id)}
                    className={`h-8 w-16 shrink-0 rounded-full text-xs font-bold transition-colors ${
                      s === "a"
                        ? "bg-matchup text-white"
                        : s === "b"
                          ? "bg-sky-500 text-white"
                          : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {s === "a" ? t("games.resultTeamA") : s === "b" ? t("games.resultTeamB") : "—"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score */}
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300">{t("games.resultScore")}</p>
          <input
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder={t("games.resultScorePlaceholder")}
            className="h-12 w-full rounded-xl bg-zinc-800 px-4 text-base outline-none focus:ring-2 focus:ring-matchup"
          />
        </div>

        {/* Gewinner */}
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300">{t("games.resultWinner")}</p>
          <div className="flex rounded-full bg-zinc-800 p-1">
            {(["a", "b"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWinner(w)}
                className={`flex-1 truncate rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  winner === w ? "bg-matchup text-white" : "text-zinc-400"
                }`}
              >
                {w === "a" ? teamAName : teamBName}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-amber-400">{error}</p>}
      </div>

      <div className="shrink-0 border-t border-zinc-800 p-5">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? t("games.resultSaving") : t("games.resultSave")}
        </button>
      </div>
    </div>
  );
}
