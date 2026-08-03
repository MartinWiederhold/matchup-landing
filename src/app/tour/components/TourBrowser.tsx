"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { isTargetRegion } from "@/domain/tour/region";
import type { TourTournament } from "@/lib/types";
import TournamentCard from "./TournamentCard";

// Explizite Spaltenliste (kein select *).
const COLUMNS =
  "id, source_ref, tournament_monday, series, category, category_recognized, name, city, country, latitude, longitude, surface, indoor, prize_money, prize_currency, website, status, valid_from, valid_to, created_at, updated_at";

type LoadState = "loading" | "error" | "done";

// Basis-Stil der Filter-Chips (unverändertes Muster).
const chipClass = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
    active ? "border-matchup bg-matchup text-white" : "border-black/15 text-neutral-600 hover:border-black/30"
  }`;

/**
 * Ein Filter-Chip mit dezenter Trefferzahl. Bei 0 Treffern (kann nur bei einer
 * ausgewählten Option auftreten) steht statt der Zahl ein „leer"-Hinweis, damit
 * die Option abwählbar bleibt und als tot erkennbar ist.
 */
function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  const t = useT();
  return (
    <button type="button" className={chipClass(active)} onClick={onClick}>
      {label}
      <span className={`ml-1 font-normal ${active ? "text-white/70" : "text-neutral-400"}`}>
        {count > 0 ? count : t("tour.filterEmpty")}
      </span>
    </button>
  );
}

export default function TourBrowser() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [rows, setRows] = useState<TourTournament[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [countryFilter, setCountryFilter] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [showRest, setShowRest] = useState(false); // Aufklapper „Weitere Länder"

  // Turniere laden, sobald ein eingeloggter Nutzer feststeht (RLS: nur authenticated).
  useEffect(() => {
    if (authLoading || !user) return;
    let cancel = false;
    setState("loading");
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("tour_tournaments")
      .select(COLUMNS)
      .is("valid_to", null)
      .gte("tournament_monday", today)
      .order("tournament_monday", { ascending: true })
      .order("country", { ascending: true })
      .then(({ data, error }) => {
        if (cancel) return;
        if (error) { setState("error"); return; }
        setRows((data as TourTournament[]) ?? []);
        setState("done");
      });
    return () => { cancel = true; };
  }, [authLoading, user]);

  // Länder-Klartext (für Sortierung der Filter-Chips).
  const countryName = (code: string) => {
    const n = t(`tour.country.${code}`);
    return n.startsWith("tour.country.") ? code : n;
  };

  // Verfügbare Filterwerte aus den geladenen Daten.
  const countries = useMemo(
    () => [...new Set(rows.map((r) => r.country).filter((c): c is string => !!c))]
      .sort((a, b) => countryName(a).localeCompare(countryName(b), locale)),
    [rows, locale],
  );
  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter((c): c is string => !!c))]
      .sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const filtered = useMemo(
    () => rows.filter(
      (r) =>
        (countryFilter.size === 0 || (r.country != null && countryFilter.has(r.country))) &&
        (categoryFilter.size === 0 || (r.category != null && categoryFilter.has(r.category))),
    ),
    [rows, countryFilter, categoryFilter],
  );

  // Trefferzahl je Land: berücksichtigt die KATEGORIE-Auswahl (leer = alle), aber NICHT
  // die Länder-Auswahl — sonst zählt der Chip etwas anderes als das, was der Klick bewirkt.
  const countByCountry = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (r.country == null) continue;
      if (categoryFilter.size > 0 && !(r.category != null && categoryFilter.has(r.category))) continue;
      m.set(r.country, (m.get(r.country) ?? 0) + 1);
    }
    return m;
  }, [rows, categoryFilter]);

  // Spiegelbildlich: Trefferzahl je Kategorie berücksichtigt die LÄNDER-Auswahl, nicht die eigene.
  const countByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (r.category == null) continue;
      if (countryFilter.size > 0 && !(r.country != null && countryFilter.has(r.country))) continue;
      m.set(r.category, (m.get(r.category) ?? 0) + 1);
    }
    return m;
  }, [rows, countryFilter]);

  // Sichtbar ist eine Option mit Treffern ODER wenn sie aktuell ausgewählt ist
  // (dann bleibt sie trotz 0 Treffern sichtbar, damit sie abwählbar ist).
  const visibleCategories = useMemo(
    () => categories.filter((c) => (countByCategory.get(c) ?? 0) > 0 || categoryFilter.has(c)),
    [categories, countByCategory, categoryFilter],
  );
  const visibleCountries = useMemo(
    () => countries.filter((c) => (countByCountry.get(c) ?? 0) > 0 || countryFilter.has(c)),
    [countries, countByCountry, countryFilter],
  );

  // Länder der Zielregion zuerst; der Rest liegt hinter dem Aufklapper.
  // Ausgewählte Rest-Länder bleiben immer sichtbar (sonst nicht abwählbar).
  const regionCountries = useMemo(() => visibleCountries.filter((c) => isTargetRegion(c)), [visibleCountries]);
  const restAll = useMemo(() => visibleCountries.filter((c) => !isTargetRegion(c)), [visibleCountries]);
  const restSelected = useMemo(() => restAll.filter((c) => countryFilter.has(c)), [restAll, countryFilter]);
  const restCollapsible = useMemo(() => restAll.filter((c) => !countryFilter.has(c)), [restAll, countryFilter]);

  function toggle(set: Set<string>, value: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value); else next.add(value);
    setter(next);
  }

  // ── Auth-Gate ──────────────────────────────────────────────────────────
  if (authLoading) {
    return <p className="mt-10 text-sm text-neutral-500">{t("tour.loading")}</p>;
  }
  if (!user) {
    return (
      <div className="mt-10 rounded-2xl border border-black/[0.08] bg-black/[0.02] px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link
          href="/app"
          className="mt-6 inline-flex rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
        >
          {t("tour.loginCta")}
        </Link>
      </div>
    );
  }

  // ── Daten ──────────────────────────────────────────────────────────────
  return (
    <div className="mt-8">
      {/* Filter */}
      <div className="space-y-3 rounded-2xl bg-black/[0.035] p-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.filterCategory")}</p>
          <div className="flex flex-wrap gap-2">
            {visibleCategories.map((c) => (
              <FilterChip key={c} label={c} count={countByCategory.get(c) ?? 0} active={categoryFilter.has(c)} onClick={() => toggle(categoryFilter, c, setCategoryFilter)} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.filterCountry")}</p>
          {/* Höhe durch max-h-40-Scrollbox gedeckelt: der Aufklapper fügt nur scrollbaren
              Inhalt hinzu, die Filterleiste springt dadurch nicht in der Höhe. */}
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
            {/* Zielregion zuerst, danach bereits ausgewählte Rest-Länder (immer sichtbar) */}
            {regionCountries.map((c) => (
              <FilterChip key={c} label={countryName(c)} count={countByCountry.get(c) ?? 0} active={countryFilter.has(c)} onClick={() => toggle(countryFilter, c, setCountryFilter)} />
            ))}
            {restSelected.map((c) => (
              <FilterChip key={c} label={countryName(c)} count={countByCountry.get(c) ?? 0} active onClick={() => toggle(countryFilter, c, setCountryFilter)} />
            ))}
            {showRest && restCollapsible.map((c) => (
              <FilterChip key={c} label={countryName(c)} count={countByCountry.get(c) ?? 0} active={countryFilter.has(c)} onClick={() => toggle(countryFilter, c, setCountryFilter)} />
            ))}
          </div>
          {restCollapsible.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRest((v) => !v)}
              className="mt-2 text-[12px] font-semibold text-matchup hover:underline"
            >
              {showRest ? t("tour.filterCountriesFewer") : t("tour.filterCountriesMore", { n: restCollapsible.length })}
            </button>
          )}
        </div>
        {(countryFilter.size > 0 || categoryFilter.size > 0) && (
          <button
            type="button"
            onClick={() => { setCountryFilter(new Set()); setCategoryFilter(new Set()); }}
            className="text-[12px] font-semibold text-matchup hover:underline"
          >
            {t("tour.filterReset")}
          </button>
        )}
      </div>

      {/* Ergebnis */}
      {state === "loading" && <p className="mt-8 text-sm text-neutral-500">{t("tour.loading")}</p>}
      {state === "error" && <p className="mt-8 text-sm text-neutral-500">{t("tour.loadError")}</p>}
      {state === "done" && (
        <>
          <p className="mt-6 text-[13px] font-medium text-neutral-500">{t("tour.resultCount", { n: filtered.length })}</p>
          {filtered.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-black/[0.035] px-5 py-8 text-center text-sm text-neutral-500">{t("tour.empty")}</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {filtered.map((x) => <TournamentCard key={x.id} tournament={x} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
