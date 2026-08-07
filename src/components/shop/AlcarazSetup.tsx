"use client";

import Image from "next/image";
import { useT } from "@/lib/i18n";
import { useCart, type Cat, type CartLine } from "./cart";
import { ProductVisual } from "./productVisual";

/* ──────────────────────────────────────────────────────────────────────────
   Alcaraz-Setup-Seite unter /shop/setup/alcaraz.
   Sechs Artikel (drei Kern, drei Kosmetik) — einzeln oder komplett in den
   geteilten Warenkorb. Werte 1:1 aus dem Dokument (i18n-Namespace „alcaraz“).
   „Kein Dämpfer“ ist ein Hinweis, kein Produkt. KEIN echter Shop: Kaufweg ist
   der Demo-Warenkorb.
   ────────────────────────────────────────────────────────────────────────── */

type Article = {
  id: string;
  brand: string;
  name: string;
  cat: Cat;
  priceCart: number | null; // Korb-Preis (null = auf Anfrage). Richtwert, s. Dokument.
  priceKey?: string;        // i18n-Preis-Etikett auf der Karte
  specsKey: string;         // i18n mehrzeilig „Label · Wert“
  warn?: boolean;           // Spannungswarnung an dieser Karte (nur Saite)
  image?: string;           // späterer Bildpfad; leer → Kategorie-Platzhalter
};

const CORE: Article[] = [
  { id: "racket", brand: "Babolat", name: "Pure Aero 98", cat: "tennis", priceCart: 217, priceKey: "price_racket", specsKey: "racket_specs" },
  { id: "string", brand: "Babolat", name: "RPM Team 1.30", cat: "gear", priceCart: 13, priceKey: "price_string", specsKey: "string_specs", warn: true },
  { id: "overgrip", brand: "Babolat", name: "VS Original Overgrip", cat: "gear", priceCart: 10, priceKey: "price_overgrip", specsKey: "overgrip_specs" },
];
const COSMETIC: Article[] = [
  { id: "basisgriff", brand: "Babolat", name: "Leder-Basisgriffband", cat: "gear", priceCart: null, specsKey: "basisgriff_specs" },
  { id: "shoes", brand: "Nike", name: "Zoom Vapor 12", cat: "apparel", priceCart: 160, priceKey: "price_shoes", specsKey: "shoes_specs" },
  { id: "bag", brand: "Babolat", name: "RH12 Pure Aero Tasche", cat: "gear", priceCart: null, specsKey: "bag_specs" },
];
const ALL = [...CORE, ...COSMETIC];

function toLine(a: Article): CartLine {
  return { id: `alcaraz-${a.id}`, brand: a.brand, name: a.name, price: a.priceCart, cat: a.cat, image: a.image };
}

export default function AlcarazSetup() {
  const t = useT();
  const { add } = useCart();

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-24 sm:px-6 lg:px-12">
      {/* KOPF */}
      <section className="grid gap-8 pt-10 sm:pt-14 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">{t("alcaraz.eyebrow")}</p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">{t("alcaraz.title")}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-600">{t("alcaraz.intro")}</p>
          <p className="mt-3 text-xs text-neutral-400">{t("alcaraz.priceStand")}</p>
          <button
            type="button"
            onClick={() => ALL.forEach((a) => add(toLine(a)))}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            {t("alcaraz.addAll")}
          </button>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100 lg:aspect-[3/4]">
          <Image src="/beratung/pros/alcaraz.jpg" alt="Carlos Alcaraz" fill priority sizes="(max-width:1024px) 100vw, 360px" className="object-cover" />
        </div>
      </section>

      {/* KERN */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("alcaraz.coreTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">{t("alcaraz.coreNote")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE.map((a) => <ArticleCard key={a.id} a={a} core onAdd={() => add(toLine(a))} t={t} />)}
        </div>
      </section>

      {/* KOSMETIK */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("alcaraz.cosmeticTitle")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COSMETIC.map((a) => <ArticleCard key={a.id} a={a} onAdd={() => add(toLine(a))} t={t} />)}
        </div>
      </section>

      {/* KEIN DÄMPFER — Hinweis, kein Produkt */}
      <section className="mt-14 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
        <h3 className="text-base font-bold text-neutral-900">{t("alcaraz.damperTitle")}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">{t("alcaraz.damperText")}</p>
      </section>

      {/* UNSICHERHEITEN */}
      <section className="mt-10">
        <h3 className="text-base font-bold text-neutral-900">{t("alcaraz.uncertaintiesTitle")}</h3>
        <ul className="mt-3 space-y-2">
          {["unc_prostock", "unc_cross", "unc_overgrip", "unc_damper"].map((k) => (
            <li key={k} className="flex gap-2 text-sm leading-relaxed text-neutral-600">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
              <span>{t(`alcaraz.${k}`)}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

// ── Artikel-Karte ──────────────────────────────────────────────────────────
function ArticleCard({
  a, core, onAdd, t,
}: {
  a: Article;
  core?: boolean;
  onAdd: () => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const specs = t(a.specsKey).split("\n").map((row) => {
    const [label, ...rest] = row.split(" · ");
    return { label, value: rest.join(" · ") };
  });
  const priceText = a.priceKey ? t(`alcaraz.${a.priceKey}`) : t("alcaraz.priceOnRequest");

  return (
    <div className={`group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ${core ? "ring-2 ring-black" : "ring-black/10"}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <ProductVisual cat={a.cat} brand={a.brand} name={a.name} src={a.image} />
        {core && (
          <span className="absolute left-2.5 top-2.5 rounded bg-black px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-white">
            {t("alcaraz.coreBadge")}
          </span>
        )}
        <span className="absolute right-2.5 top-2.5 rounded bg-white/85 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-neutral-600">
          {t(`alcaraz.cat_${a.cat}`)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">{a.brand}</div>
        <div className="text-sm font-bold text-neutral-900">{a.name}</div>

        <dl className="mt-3 space-y-1">
          {specs.map((s) => (
            <div key={s.label} className="flex justify-between gap-3 border-t border-black/[0.06] pt-1 text-[12px] first:border-t-0">
              <dt className="text-neutral-500">{s.label}</dt>
              <dd className="text-right font-semibold text-neutral-900">{s.value}</dd>
            </div>
          ))}
        </dl>

        {/* Spannungswarnung — nur an der Saiten-Karte, wo die Entscheidung fällt */}
        {a.warn && (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">{t("alcaraz.tensionWarnTitle")}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-amber-900">{t("alcaraz.tensionWarnText")}</p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-neutral-900">{priceText}</span>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-9 items-center justify-center rounded-full bg-black px-4 text-xs font-semibold text-white transition-transform hover:scale-105"
          >
            {t("alcaraz.addOne")}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-neutral-400">{t("alcaraz.buyway")}</p>
      </div>
    </div>
  );
}
