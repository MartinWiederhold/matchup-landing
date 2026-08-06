"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import type { CatalogRacket } from "@/lib/types";
import RacketRadar, { type RadarSeries } from "./RacketRadar";

/**
 * Schläger-Katalog unter /beratung/katalog. Client-Component: Auth-Gate über
 * useAuth(), Reads über den Anon-Client (trägt die Session → RLS „authenticated").
 * Zeigt AUSSCHLIESSLICH die Katalog-Testwerte (Quelle extreme-tennis.fr) — KEINE
 * Umrechnung in die Finder-Achsen aus src/domain/equipment/racket.ts.
 */

// Explizite Spaltenliste (kein select *). numeric-Spalten kommen als String.
const COLUMNS =
  "shop_product_id, name, brand, sku, puissance, controle, confort, prise_deffet, tolerance, maniabilite, stabilite, score, price_minor, price_currency, weight_g, balance_cm, head_size_sqcm, string_pattern, stiffness_ra, inertia, profile, twistweight, length_cm, recoil_weight, plow_through, product_url";

// Die sieben Achsen in fester Reihenfolge (Katalog-Taxonomie).
const AXES = [
  "puissance", "controle", "confort", "prise_deffet", "tolerance", "maniabilite", "stabilite",
] as const;
type AxisCol = (typeof AXES)[number];

// Serien-Farben: A = Matchup-Blau, B = Bernstein (klar unterscheidbar).
const SERIES_COLORS = ["#4b3bf3", "#f59e0b"] as const;

// Technik-Zeilen: Label-Key + Formatter (null = „nicht gepflegt").
const TECH_ROWS: { key: string; get: (r: CatalogRacket) => string | null }[] = [
  { key: "tech_weight", get: (r) => (r.weight_g != null ? `${r.weight_g} g` : null) },
  { key: "tech_balance", get: (r) => (r.balance_cm != null ? `${r.balance_cm} cm` : null) },
  { key: "tech_headSize", get: (r) => (r.head_size_sqcm != null ? `${r.head_size_sqcm} cm²` : null) },
  { key: "tech_pattern", get: (r) => r.string_pattern ?? null },
  { key: "tech_stiffness", get: (r) => (r.stiffness_ra != null ? `${r.stiffness_ra} RA` : null) },
  { key: "tech_inertia", get: (r) => r.inertia ?? null },
  { key: "tech_profile", get: (r) => r.profile ?? null },
  { key: "tech_twistweight", get: (r) => r.twistweight ?? null },
  { key: "tech_length", get: (r) => (r.length_cm != null ? `${r.length_cm} cm` : null) },
  { key: "tech_recoil", get: (r) => r.recoil_weight ?? null },
  { key: "tech_plow", get: (r) => r.plow_through ?? null },
];

// Hat der Schläger alle sieben Testwerte? Nur dann wird gezeichnet.
function hasTestValues(r: CatalogRacket): boolean {
  return AXES.every((a) => r[a] != null);
}
function testValues(r: CatalogRacket): number[] {
  return AXES.map((a) => r[a] as number);
}

// Karten-Formensprache (aus dem Marketing-/tour-Bereich, inline repliziert —
// tourUi liegt unter src/app/tour/** und wird bewusst nicht importiert).
const CARD = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";
const CARD_LG = "rounded-3xl bg-white shadow-sm ring-1 ring-black/5";

export default function RacketCatalog() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [rackets, setRackets] = useState<CatalogRacket[]>([]);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string | null>(null); // null = alle Marken
  const [selected, setSelected] = useState<number[]>([]);   // shop_product_ids, max 2 (Reihenfolge = Farbe)
  const [note, setNote] = useState<string | null>(null);    // z. B. „max. zwei"

  // Laden — nur wenn eingeloggt (sonst Gate).
  useEffect(() => {
    if (!user) return;
    let alive = true;
    setStatus("loading");
    supabase
      .from("rackets")
      .select(COLUMNS)
      .is("valid_to", null)
      .order("brand", { ascending: true })
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data) { setStatus("error"); return; }
        setRackets(data as unknown as CatalogRacket[]);
        setStatus("ready");
      });
    return () => { alive = false; };
  }, [user]);

  // Marken + Trefferzahl je Marke (über den GESAMTbestand, unabhängig von der Suche —
  // wie die Turnier-Filter in /tour: Zahl = Auswahlhilfe, nicht Rateei).
  const brandCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rackets) { const b = r.brand ?? "—"; m.set(b, (m.get(b) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [rackets]);

  // Gefilterte Liste: Marke + Namenssuche.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rackets.filter((r) => {
      if (brand && (r.brand ?? "—") !== brand) return false;
      if (q && !(r.name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rackets, brand, query]);

  const selectedRackets = useMemo(
    () => selected.map((id) => rackets.find((r) => r.shop_product_id === id)).filter(Boolean) as CatalogRacket[],
    [selected, rackets],
  );

  function toggle(id: number) {
    setNote(null);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) { setNote(t("catalog.compareFull")); return prev; }
      return [...prev, id];
    });
  }

  const axisLabel = (a: AxisCol) => t(`catalog.axis_${a}`);

  // ── Gates ────────────────────────────────────────────────────────────────
  if (authLoading) return <p className="mt-10 text-sm text-neutral-500">{t("catalog.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-8 rounded-2xl bg-black/[0.02] px-6 py-10 text-center ring-1 ring-black/5">
        <h2 className="text-lg font-bold text-neutral-900">{t("catalog.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("catalog.loginRequiredText")}</p>
        <Link href="/app" className="mt-6 inline-flex rounded-full bg-matchup px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover">
          {t("catalog.loginCta")}
        </Link>
      </div>
    );
  }
  if (status === "loading") return <p className="mt-8 text-sm text-neutral-500">{t("catalog.loading")}</p>;
  if (status === "error") return <p className="mt-8 text-sm text-neutral-500">{t("catalog.loadError")}</p>;

  // ── Inhalt ───────────────────────────────────────────────────────────────
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      {/* LINKS: Suche + Marken-Filter + Liste */}
      <div className="flex min-w-0 flex-col gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("catalog.searchPlaceholder")}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm ring-1 ring-black/5 outline-none placeholder:text-neutral-400 focus:ring-matchup/40"
        />

        {/* Marken-Chips mit Trefferzahl */}
        <div className="flex flex-wrap gap-1.5">
          <BrandChip active={brand === null} label={t("catalog.brandAll")} count={rackets.length} onClick={() => setBrand(null)} />
          {brandCounts.map(([b, n]) => (
            <BrandChip key={b} active={brand === b} label={b} count={n} onClick={() => setBrand(b)} />
          ))}
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-neutral-500">
            {t("catalog.resultCount", { n: filtered.length, total: rackets.length })}
          </span>
          {selected.length > 0 && (
            <button onClick={() => { setSelected([]); setNote(null); }} className="text-xs font-semibold text-matchup hover:underline">
              {t("catalog.clearSelection")}
            </button>
          )}
        </div>
        {note && <p className="px-1 text-xs font-semibold text-amber-600">{note}</p>}

        {/* Liste */}
        <ul className="flex max-h-[70vh] flex-col gap-1.5 overflow-y-auto pr-1">
          {filtered.length === 0 && <li className="px-1 py-6 text-sm text-neutral-500">{t("catalog.noResults")}</li>}
          {filtered.map((r) => {
            const pos = selected.indexOf(r.shop_product_id);
            const isSel = pos >= 0;
            return (
              <li key={r.shop_product_id}>
                <button
                  onClick={() => toggle(r.shop_product_id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left ring-1 transition-colors ${
                    isSel ? "bg-matchup/[0.06] ring-matchup/30" : "bg-white ring-black/5 hover:bg-black/[0.02]"
                  }`}
                >
                  {/* Farbpunkt bei Auswahl (= Diagramm-Farbe) */}
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: isSel ? SERIES_COLORS[pos] : "transparent", boxShadow: isSel ? "none" : "inset 0 0 0 1px rgba(0,0,0,0.15)" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-neutral-900">{r.name ?? `#${r.shop_product_id}`}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{r.brand ?? "—"}</span>
                  </span>
                  {!hasTestValues(r) && (
                    <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                      {t("catalog.onlyTech")}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* RECHTS: Detail */}
      <div className="min-w-0">
        {selectedRackets.length === 0 ? (
          <div className={`${CARD_LG} px-6 py-16 text-center`}>
            <h2 className="text-lg font-bold text-neutral-900">{t("catalog.pickTitle")}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("catalog.pickText")}</p>
          </div>
        ) : (
          <Detail rackets={selectedRackets} axisLabel={axisLabel} t={t} locale={locale} />
        )}
      </div>
    </div>
  );
}

// ── Marken-Chip mit Trefferzahl ───────────────────────────────────────────
function BrandChip({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-colors ${
        active ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/5 hover:bg-black/[0.03]"
      }`}
    >
      <span>{label}</span>
      <span className={active ? "text-white/70" : "text-neutral-400"}>{count}</span>
    </button>
  );
}

// ── Detail: Diagramm (Handy: oben) + Werte-Tabelle, darunter Technik + Preis ──
function Detail({
  rackets, axisLabel, t, locale,
}: {
  rackets: CatalogRacket[];
  axisLabel: (a: AxisCol) => string;
  t: (k: string, v?: Record<string, string | number>) => string;
  locale: string;
}) {
  const withValues = rackets.filter(hasTestValues);
  const series: RadarSeries[] = withValues.map((r, i) => ({
    id: String(r.shop_product_id),
    label: r.name ?? `#${r.shop_product_id}`,
    color: SERIES_COLORS[rackets.indexOf(r)] ?? SERIES_COLORS[0],
    values: testValues(r),
  }));
  const axes = AXES.map((a) => ({ key: a, label: axisLabel(a) }));

  const fmtPrice = (r: CatalogRacket) =>
    r.price_minor != null
      ? new Intl.NumberFormat(locale, { style: "currency", currency: r.price_currency || "EUR" }).format(r.price_minor / 100)
      : t("catalog.notMaintained");

  return (
    <div className="flex flex-col gap-6">
      {/* Kopf: Legende der ausgewählten Schläger */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {rackets.map((r, i) => (
          <div key={r.shop_product_id} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SERIES_COLORS[i] }} />
            <div className="leading-tight">
              <p className="text-[13px] font-extrabold text-neutral-900">{r.name ?? `#${r.shop_product_id}`}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{r.brand ?? "—"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Diagramm + Werte-Tabelle: Handy untereinander, ab lg nebeneinander */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${CARD} p-5`}>
          {series.length > 0 ? (
            <>
              <RacketRadar axes={axes} series={series} />
              <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-400">{t("catalog.radarNote")}</p>
            </>
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-4 text-center">
              <h3 className="text-sm font-bold text-neutral-900">{t("catalog.noTestValuesTitle")}</h3>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-500">{t("catalog.noTestValuesNote")}</p>
            </div>
          )}
        </div>

        {/* Werte-Tabelle (Testwerte) */}
        <div className={`${CARD} p-5`}>
          <h3 className="text-sm font-bold text-neutral-900">{t("catalog.valuesTitle")}</h3>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {AXES.map((a) => (
                <tr key={a} className="border-t border-black/[0.06] first:border-t-0">
                  <th scope="row" className="py-1.5 text-left text-[12px] font-semibold text-neutral-500">{axisLabel(a)}</th>
                  {rackets.map((r, i) => (
                    <td key={r.shop_product_id} className="py-1.5 text-right text-[13px] font-bold tabular-nums" style={{ color: r[a] != null ? SERIES_COLORS[i] : undefined }}>
                      {r[a] != null ? r[a] : t("catalog.notMaintained")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technik + Preis (volle Breite) */}
      <div className={`${CARD} p-5`}>
        <h3 className="text-sm font-bold text-neutral-900">{t("catalog.techTitle")}</h3>
        <table className="mt-3 w-full text-sm">
          <tbody>
            <tr className="border-b border-black/[0.06]">
              <th scope="row" className="py-1.5 text-left text-[12px] font-semibold text-neutral-500">{t("catalog.price")}</th>
              {rackets.map((r) => (
                <td key={r.shop_product_id} className="py-1.5 text-right text-[13px] font-extrabold text-neutral-900 tabular-nums">{fmtPrice(r)}</td>
              ))}
            </tr>
            {TECH_ROWS.map((row) => (
              <tr key={row.key} className="border-t border-black/[0.06]">
                <th scope="row" className="py-1.5 text-left text-[12px] font-semibold text-neutral-500">{t(`catalog.${row.key}`)}</th>
                {rackets.map((r) => (
                  <td key={r.shop_product_id} className="py-1.5 text-right text-[13px] font-bold text-neutral-900 tabular-nums">
                    {row.get(r) ?? t("catalog.notMaintained")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Produktseiten-Links */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
          {rackets.map((r) => r.product_url && (
            <a key={r.shop_product_id} href={r.product_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-matchup hover:underline">
              {t("catalog.productPage")} — {r.brand ?? r.shop_product_id}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
