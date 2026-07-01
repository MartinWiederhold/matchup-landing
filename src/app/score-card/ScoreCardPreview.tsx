"use client";

import { useMemo, useState } from "react";

/**
 * Interne Vorschau- & Teilen-Seite für die Score-Card.
 * Zeigt das per next/og generierte Bild live und teilt es 1-Klick
 * (navigator.share mit Bilddatei, Fallback WhatsApp-Link).
 */
export default function ScoreCardPreview() {
  const [teamA, setTeamA] = useState("Martin");
  const [teamB, setTeamB] = useState("Luca");
  const [score, setScore] = useState("6:3 6:4");
  const [winner, setWinner] = useState<"a" | "b">("a");
  const [sport, setSport] = useState("padel");
  const [loc, setLoc] = useState("Padel Zone Zürich");
  const [busy, setBusy] = useState(false);

  const query = useMemo(() => {
    const p = new URLSearchParams({
      a: teamA,
      b: teamB,
      s: score,
      w: winner,
      sport,
      loc,
      date: "12. Juli 2026",
      delta: winner === "a" ? "+12" : "-9",
      lang: "de",
    });
    return p.toString();
  }, [teamA, teamB, score, winner, sport, loc]);

  const imgUrl = `/api/score-card?${query}`;

  async function share() {
    setBusy(true);
    const abs =
      typeof window !== "undefined" ? window.location.origin + imgUrl : imgUrl;
    const text = `${teamA} vs ${teamB} — ${score} · gespielt auf Matchup 🎾`;
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const file = new File([blob], "matchup-score.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
      };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text });
        setBusy(false);
        return;
      }
    } catch {
      /* fällt unten auf WhatsApp-Link zurück */
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text} ${abs}`)}`,
      "_blank",
    );
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-neutral-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="text-center text-2xl font-bold tracking-tight">
          Matchup Score-Card
        </h1>
        <p className="mt-1 text-center text-sm text-white/50">
          Vorschau · jedes gespielte Match → teilbares Bild mit Deep-Link
        </p>

        {/* Card-Bild */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgUrl}
          alt="Score-Card"
          className="mt-6 w-full rounded-3xl ring-1 ring-white/10"
        />

        {/* Steuerung */}
        <div className="mt-6 space-y-4 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Team A" value={teamA} onChange={setTeamA} />
            <Field label="Team B" value={teamB} onChange={setTeamB} />
          </div>
          <Field label="Score (Sätze mit Leerzeichen)" value={score} onChange={setScore} />
          <Field label="Ort" value={loc} onChange={setLoc} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/45">
                Gewinner
              </p>
              <div className="flex rounded-full bg-white/10 p-1">
                {(["a", "b"] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWinner(w)}
                    className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition-colors ${
                      winner === w ? "bg-white text-black" : "text-white/60"
                    }`}
                  >
                    {w === "a" ? teamA || "A" : teamB || "B"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/45">
                Sportart
              </p>
              <div className="flex rounded-full bg-white/10 p-1">
                {["tennis", "padel", "pickleball"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSport(s)}
                    className={`flex-1 rounded-full py-1.5 text-[11px] font-semibold capitalize transition-colors ${
                      sport === s ? "bg-white text-black" : "text-white/60"
                    }`}
                  >
                    {s === "pickleball" ? "Pickle" : s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={share}
          disabled={busy}
          className="mt-5 w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover disabled:opacity-60"
        >
          {busy ? "Öffne Teilen…" : "Score-Card teilen"}
        </button>
        <a
          href={imgUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-center text-xs text-white/40 underline"
        >
          Bild in neuem Tab öffnen
        </a>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/45">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3.5 text-base text-white outline-none focus:border-matchup"
      />
    </label>
  );
}
