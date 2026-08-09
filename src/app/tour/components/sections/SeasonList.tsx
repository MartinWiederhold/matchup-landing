"use client";

import { useCallback, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { minorToEuro } from "@/lib/tourCosts";
import { removeFromSeason, setSeasonStatus, type SeasonEntry, type SeasonStatus } from "@/lib/tourSeason";
import { placeKey } from "../TourDecideBlock";
import { DeadlineCountdown, EntryPath } from "../EntryDeadline";
import type { WorkspaceData } from "../useTourWorkspace";
import SeasonCard from "../../season/components/SeasonCard";

function fmtMondayShort(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(iso + "T00:00:00Z"));
}

/**
 * Die Saison als Liste — kompakte Zeile (Woche, Ort, Kosten, nächste Frist), je Eintrag
 * aufklappbar zur vollen Karte (Fristen, Einschätzung, Status, Entfernen via SeasonCard).
 * Änderungen laufen über die bestehende Datenschicht und lösen ein Neuladen aus (onChanged).
 */
export default function SeasonList({ data, onChanged }: { data: WorkspaceData; onChanged: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const [writeError, setWriteError] = useState(false);
  const now = Date.now();

  const handleRemove = useCallback(async (tournamentId: string) => {
    setWriteError(false);
    try { await removeFromSeason(tournamentId); onChanged(); }
    catch { setWriteError(true); }
  }, [onChanged]);

  const handleStatus = useCallback(async (planId: string, status: SeasonStatus) => {
    setWriteError(false);
    try { await setSeasonStatus(planId, status); onChanged(); }
    catch { setWriteError(true); }
  }, [onChanged]);

  if (data.entries.length === 0) return null;

  return (
    <section>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsSeasonTitle")}</h2>
      {writeError && <p className="mt-2 text-[12px] text-neutral-500">{t("tour.seasonSaveError")}</p>}
      <div className="mt-3 space-y-2">
        {data.entries.map((e, i) => {
          const x = e.tournament;
          const st = data.seasonCost.stations[i];
          const cost = st ? Object.keys(st.subtotal).filter((c) => st.subtotal[c] !== 0).map((c) => `${minorToEuro(st.subtotal[c])} ${c}`).join(" · ") : "";
          const prevPlace = i > 0 ? placeKey(data.entries[i - 1].tournament) : null;
          return (
            <details key={e.planId} className="group rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="text-[12px] font-semibold tabular-nums text-neutral-400">{fmtMondayShort(x.tournament_monday, locale)}</span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-neutral-900">
                  {x.city || t("tour.fieldMissing")}
                  <span className="text-neutral-400">, {x.country ?? "—"}</span>
                </span>
                <span className="rounded-full bg-matchup/10 px-2 py-0.5 text-[11px] font-bold text-matchup">{x.category || "—"}</span>
                {cost && <span className="text-[12px] tabular-nums text-neutral-500">{cost}</span>}
                {/* Countdown zur Meldefrist — ITF zählt herunter, verstrichen wird benannt,
                    Challenger ehrlich als „unbekannt" (nicht geraten). Stichtag aus der Komponente. */}
                <DeadlineCountdown tournament={x} now={now} />
                <span className="text-neutral-300 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="border-t border-black/[0.06] p-3">
                {/* Weg zur Meldung — ehrlich beschriftet, kein Anmelde-Knopf. */}
                <EntryPath tournament={x} />
                <SeasonCard
                  entry={e}
                  prevPlace={prevPlace}
                  onRemove={() => handleRemove(x.id)}
                  onStatusChange={(s) => handleStatus(e.planId, s)}
                />
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
