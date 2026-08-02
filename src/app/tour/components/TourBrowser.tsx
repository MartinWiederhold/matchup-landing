"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import type { TourTournament } from "@/lib/types";
import TournamentCard from "./TournamentCard";

// Explizite Spaltenliste (kein select *).
const COLUMNS =
  "id, source_ref, tournament_monday, series, category, category_recognized, name, city, country, latitude, longitude, surface, indoor, prize_money, prize_currency, website, status, valid_from, valid_to, created_at, updated_at";

type LoadState = "loading" | "error" | "done";

export default function TourBrowser() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [rows, setRows] = useState<TourTournament[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [countryFilter, setCountryFilter] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());

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
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
      active ? "border-matchup bg-matchup text-white" : "border-black/15 text-neutral-600 hover:border-black/30"
    }`;

  return (
    <div className="mt-8">
      {/* Filter */}
      <div className="space-y-3 rounded-2xl bg-black/[0.035] p-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.filterCategory")}</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} type="button" className={chip(categoryFilter.has(c))} onClick={() => toggle(categoryFilter, c, setCategoryFilter)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.filterCountry")}</p>
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
            {countries.map((c) => (
              <button key={c} type="button" className={chip(countryFilter.has(c))} onClick={() => toggle(countryFilter, c, setCountryFilter)}>
                {countryName(c)}
              </button>
            ))}
          </div>
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
