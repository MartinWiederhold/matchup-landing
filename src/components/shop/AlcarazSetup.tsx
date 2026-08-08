"use client";

import Image from "next/image";
import { useT, type TFunction } from "@/lib/i18n";
import { useCart } from "./cart";
import ProductCard, { type CardData } from "./ProductCard";
import {
  ALCARAZ_CORE,
  ALCARAZ_COSMETIC,
  productHref,
  productLine,
  productSub,
  productPriceLabel,
  type Product,
} from "./products";

/* ──────────────────────────────────────────────────────────────────────────
   Alcaraz-Setup-Seite unter /shop/setup/alcaraz.
   Karten kommen aus der gemeinsamen Quelle (products.ts) und nutzen dieselbe
   ProductCard wie /shop — jede verlinkt auf ihre Detailseite (/shop/[slug]),
   wo die vollständigen technischen Daten stehen. Der frühere Abschnitt
   „Technische Daten" unten ENTFÄLLT dadurch. „Kein Dämpfer" bleibt ein Hinweis.
   ────────────────────────────────────────────────────────────────────────── */

const ALL = [...ALCARAZ_CORE, ...ALCARAZ_COSMETIC];

function toCard(p: Product, t: TFunction): CardData {
  return {
    brand: p.brand,
    name: p.name,
    sub: productSub(p, t),
    priceLabel: productPriceLabel(p, t),
    cat: p.cat,
    image: p.image,
  };
}

export default function AlcarazSetup() {
  const t = useT();
  const { add } = useCart();

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 lg:px-12">
      {/* KOPF */}
      <section className="grid gap-8 pt-10 sm:pt-14 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">{t("alcaraz.eyebrow")}</p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">{t("alcaraz.title")}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-600">{t("alcaraz.intro")}</p>
          <p className="mt-3 text-xs text-neutral-400">{t("alcaraz.priceStand")} · {t("alcaraz.buyway")}</p>
          <button
            type="button"
            onClick={() => ALL.forEach((p) => add(productLine(p)))}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            {t("alcaraz.addAll")}
          </button>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100 lg:aspect-[3/4]">
          <Image src="/beratung/pros/alcaraz.jpg" alt="Carlos Alcaraz" fill priority sizes="(max-width:1024px) 100vw, 360px" className="object-cover" />
        </div>
      </section>

      {/* KERN — drei Karten im Shop-Raster, verlinkt auf die Detailseite */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("alcaraz.coreTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">{t("alcaraz.coreNote")}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {ALCARAZ_CORE.map((p) => (
            <ProductCard key={p.slug} data={toCard(p, t)} href={productHref(p)} onAdd={() => add(productLine(p))} />
          ))}
        </div>

        {/* Spannungs-Hinweis: unter dem Kern-Raster (gleicher i18n-Text wie auf der
            Saiten-Detailseite → eine Textquelle). */}
        <div className="mt-5 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">{t("alcaraz.tensionWarnTitle")}</p>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-amber-900">{t("alcaraz.tensionWarnText")}</p>
        </div>
      </section>

      {/* KOSMETIK — Shop-Raster (Basisgriffband + 3 Schuhe + Tasche) */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("alcaraz.cosmeticTitle")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {ALCARAZ_COSMETIC.map((p) => (
            <ProductCard key={p.slug} data={toCard(p, t)} href={productHref(p)} onAdd={() => add(productLine(p))} />
          ))}
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
