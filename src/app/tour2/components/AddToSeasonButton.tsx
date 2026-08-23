"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { addToSeason, removeFromSeason } from "@/lib/tourSeason";

/**
 * Zurückhaltender Knopf: Turnier in die Saison aufnehmen bzw. wieder entfernen.
 *
 * Der Zustand (`inSeason`) liegt beim Elter (die Liste), damit ohne vollständiges
 * Neuladen umgeschaltet werden kann. OPTIMISTISCH: der Elter schaltet sofort um;
 * schlägt das Schreiben fehl, springt der Knopf über `onChange(!next)` zurück —
 * die Liste zeigt nie einen Zustand, den die Datenbank nicht hat.
 */
export default function AddToSeasonButton({
  tournamentId,
  userId,
  inSeason,
  onChange,
}: {
  tournamentId: string;
  userId: string;
  inSeason: boolean;
  onChange: (next: boolean) => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !inSeason;
    setError(false);
    setBusy(true);
    onChange(next); // optimistisch umschalten
    try {
      if (next) await addToSeason(userId, tournamentId);
      else await removeFromSeason(tournamentId);
    } catch {
      onChange(!next); // zurückspringen — DB hat den Zustand nicht
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-black/[0.06] pt-3">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={inSeason}
        className={
          inSeason
            ? "inline-flex items-center gap-1.5 rounded-full border border-matchup/30 bg-matchup/10 px-3.5 py-1.5 text-[12px] font-semibold text-matchup transition-colors hover:bg-matchup/15 disabled:opacity-50"
            : "inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3.5 py-1.5 text-[12px] font-semibold text-neutral-700 transition-colors hover:border-black/30 disabled:opacity-50"
        }
      >
        {inSeason ? t("tour.inSeason") : t("tour.addToSeason")}
      </button>
      {error && <p className="mt-2 text-[12px] text-neutral-500">{t("tour.seasonSaveError")}</p>}
    </div>
  );
}
