"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { loadCostRates, type CostRatesPatch } from "@/lib/tourCosts";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import type { TourCostRates } from "@/lib/types";
import CostRatesForm from "./CostRatesForm";
import SeasonCostBreakdown from "./SeasonCostBreakdown";

// localStorage-Schlüssel für die Nächte-Annahme (reine Client-Bequemlichkeit,
// keine personenbezogenen Daten, kein DB-Thema).
const NIGHTS_KEY = "mu_tour_nights";
type LoadState = "loading" | "error" | "done";

/** Kosten-Seite: oben die Sätze eingeben, darunter die Saison als Reisekette. */
export default function CostsView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();

  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [entries, setEntries] = useState<SeasonEntry[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [nights, setNights] = useState(""); // String, leer = keine Annahme

  // Nächte-Annahme aus localStorage lesen (nur im Browser).
  useEffect(() => {
    try { const v = localStorage.getItem(NIGHTS_KEY); if (v != null) setNights(v); } catch { /* egal */ }
  }, []);
  const onNightsChange = useCallback((v: string) => {
    setNights(v);
    try { localStorage.setItem(NIGHTS_KEY, v); } catch { /* egal */ }
  }, []);

  // Sätze + Saison laden, sobald ein eingeloggter Nutzer feststeht.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    Promise.all([loadCostRates(), loadSeason()])
      .then(([r, e]) => { if (!cancel) { setRates(r); setEntries(e); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  // Nach dem Speichern die Sätze lokal übernehmen, damit die Rechnung sofort nachzieht.
  const handleSaved = useCallback((patch: CostRatesPatch) => {
    setRates((prev) => ({
      user_id: user?.id ?? "",
      ...patch,
      created_at: prev?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }, [user]);

  // Nächte-String → positive Ganzzahl (= Angabe) oder null (= keine Annahme).
  const nightsNum = (() => {
    const n = parseInt(nights.trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  // ── Auth-Gate (identisch zu SeasonView/TourBrowser) ──────────────────────
  if (authLoading) {
    return <p className="mt-10 text-sm text-neutral-500">{t("tour.loading")}</p>;
  }
  if (!user) {
    return (
      <div className="mt-10 rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-6 t2-cta">
          {t("tour.loginCta")}
        </Link>
      </div>
    );
  }

  if (state === "loading") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (state === "error") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loadError")}</p>;

  return (
    <div className="mt-8 space-y-2">
      <CostRatesForm
        rates={rates}
        userId={user.id}
        onSaved={handleSaved}
        nights={nights}
        onNightsChange={onNightsChange}
      />

      {entries.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-6 py-10 text-center">
          <h2 className="text-lg font-bold text-neutral-900">{t("tour.costsEmptyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.costsEmptyText")}</p>
          <Link href="/tour2/tournaments" className="mt-6 t2-cta">
            {t("tour.costsEmptyCta")}
          </Link>
        </div>
      ) : (
        <SeasonCostBreakdown entries={entries} rates={rates} nights={nightsNum} />
      )}
    </div>
  );
}
