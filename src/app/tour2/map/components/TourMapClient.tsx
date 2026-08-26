"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";

// MapLibre braucht window/document → nur im Browser laden (kein SSR).
// Muster übernommen von src/app/map/MapClient.tsx (die Datei selbst nicht angefasst).
const TourMapView = dynamic(() => import("./TourMapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] min-h-[380px] items-center justify-center rounded-2xl border border-[var(--t2-line)] bg-[var(--t2-surface)] text-sm text-[var(--t2-muted)]">
      …
    </div>
  ),
});

type LoadState = "loading" | "error" | "done";

// Kalendertag in UTC formatieren.
function fmtMonday(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
}

export default function TourMapClient() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [entries, setEntries] = useState<SeasonEntry[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    loadSeason()
      .then((e) => { if (!cancel) { setEntries(e); setState("done"); } })
      .catch(() => { if (!cancel) setState("error"); });
    return () => { cancel = true; };
  }, [authLoading, user]);

  const countryName = (code: string | null) => {
    if (!code) return t("tour.fieldMissing");
    const n = t(`tour.country.${code}`);
    return n.startsWith("tour.country.") ? code : n;
  };

  // ── Auth-Gate (wie SeasonView) ───────────────────────────────────────────
  if (authLoading) return <p className="mt-10 text-sm text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-10 t2-panel bg-[var(--t2-surface)] px-6 py-10 text-center">
        <h2 className="t2-h2 text-lg text-[var(--t2-ink)]">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--t2-muted)]">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-6 t2-cta">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (state === "loading") return <p className="mt-8 text-sm text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  if (state === "error") return <p className="mt-8 text-sm text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  // Leere Saison → Hinweis + Verweis, keine leere Weltkarte.
  if (entries.length === 0) {
    return (
      <div className="mt-8 t2-panel bg-[var(--t2-surface)] px-6 py-10 text-center">
        <h2 className="t2-h2 text-lg text-[var(--t2-ink)]">{t("tour.mapEmptyTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--t2-muted)]">{t("tour.mapEmptyText")}</p>
        <Link href="/tour2/finder" className="mt-6 t2-cta">{t("tour.mapEmptyCta")}</Link>
      </div>
    );
  }

  const withCoords = entries.filter((e) => e.tournament.latitude != null && e.tournament.longitude != null);
  const noCoords = entries.filter((e) => e.tournament.latitude == null || e.tournament.longitude == null);

  return (
    <div className="mt-8 space-y-5">
      {withCoords.length > 0 ? (
        <TourMapView entries={withCoords} />
      ) : (
        <p className="rounded-2xl bg-[var(--t2-surface)] px-5 py-8 text-center text-sm text-[var(--t2-muted)]">{t("tour.mapAllNoCoords")}</p>
      )}

      {/* Turniere ohne Koordinaten: nicht stillschweigend weglassen, sondern listen. */}
      {noCoords.length > 0 && (
        <section>
          <h2 className="t2-kicker">{t("tour.mapNoCoordsTitle")}</h2>
          <p className="mt-1 text-[12px] text-[var(--t2-muted)]">{t("tour.mapNoCoordsText")}</p>
          <ul className="mt-2 divide-y divide-[var(--t2-line)] rounded-2xl border border-[var(--t2-line)] bg-[var(--t2-paper)]">
            {noCoords.map((e) => (
              <li key={e.planId} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                <span className="text-[14px] font-semibold text-[var(--t2-ink)]">
                  {e.tournament.city || t("tour.fieldMissing")}
                  <span className="text-[var(--t2-muted)]">, {countryName(e.tournament.country)}</span>
                </span>
                <span className="text-[12px] text-[var(--t2-muted)]">
                  {e.tournament.category || t("tour.fieldMissing")} · {t("tour.mondayLabel")} {fmtMonday(e.tournament.tournament_monday, locale)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
