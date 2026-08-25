"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { loadSeason, removeFromSeason, setSeasonStatus, type SeasonEntry, type SeasonStatus } from "@/lib/tourSeason";
import { placeKey } from "../../components/TourDecideBlock";
import SeasonCard from "./SeasonCard";

type LoadState = "loading" | "error" | "done";

/**
 * Die eigene Saison als geordnete Liste. Auth-Gate wie im TourBrowser (Session im
 * Browser). Änderungen (Status/Entfernen) laufen optimistisch auf dem lokalen
 * Zustand; die Reisekette (prevPlace) wird beim Rendern aus der aktuellen Liste
 * abgeleitet, sodass ein Entfernen die Anreise-Begründung des Nachbarn korrigiert.
 */
export default function SeasonView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();

  const [entries, setEntries] = useState<SeasonEntry[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [writeError, setWriteError] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    loadSeason()
      .then((e) => { if (!cancel) { setEntries(e); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  // Entfernen — optimistisch; bei Fehler den vorigen Stand wiederherstellen.
  const handleRemove = useCallback(async (planId: string, tournamentId: string) => {
    setWriteError(false);
    let before: SeasonEntry[] = [];
    setEntries((prev) => { before = prev; return prev.filter((e) => e.planId !== planId); });
    try { await removeFromSeason(tournamentId); }
    catch { setEntries(before); setWriteError(true); }
  }, []);

  // Status ändern — optimistisch; bei Fehler zurück.
  const handleStatus = useCallback(async (planId: string, status: SeasonStatus) => {
    setWriteError(false);
    let before: SeasonEntry[] = [];
    setEntries((prev) => { before = prev; return prev.map((e) => (e.planId === planId ? { ...e, status } : e)); });
    try { await setSeasonStatus(planId, status); }
    catch { setEntries(before); setWriteError(true); }
  }, []);

  // ── Auth-Gate (identisch zum TourBrowser) ────────────────────────────────
  if (authLoading) {
    return <p className="mt-10 text-sm text-neutral-500">{t("tour.loading")}</p>;
  }
  if (!user) {
    return (
      <div className="mt-10 rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link
          href="/app"
          className="mt-6 t2-cta"
        >
          {t("tour.loginCta")}
        </Link>
      </div>
    );
  }

  // ── Daten ────────────────────────────────────────────────────────────────
  if (state === "loading") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (state === "error") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loadError")}</p>;

  if (entries.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.seasonEmptyTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.seasonEmptyText")}</p>
        <Link
          href="/tour2/tournaments"
          className="mt-6 t2-cta"
        >
          {t("tour.seasonEmptyCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <p className="text-[13px] font-medium text-neutral-500">{t("tour.seasonCount", { n: entries.length })}</p>
      {writeError && <p className="mt-2 text-[12px] text-neutral-500">{t("tour.seasonSaveError")}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {entries.map((e, i) => (
          <SeasonCard
            key={e.planId}
            entry={e}
            // Vorstation = Ort des vorherigen Eintrags (Ortsschlüssel Land|Stadt); erster Eintrag null.
            prevPlace={i > 0 ? placeKey(entries[i - 1].tournament) : null}
            onRemove={() => handleRemove(e.planId, e.tournament.id)}
            onStatusChange={(s) => handleStatus(e.planId, s)}
          />
        ))}
      </div>
    </div>
  );
}
