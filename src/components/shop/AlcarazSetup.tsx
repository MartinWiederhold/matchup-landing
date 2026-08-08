"use client";

import Image from "next/image";
import { useT } from "@/lib/i18n";
import { useCart, type Cat, type CartLine } from "./cart";
import ProductCard, { type CardData } from "./ProductCard";

/* ──────────────────────────────────────────────────────────────────────────
   Alcaraz-Setup-Seite unter /shop/setup/alcaraz.
   Sechs Artikel (drei Kern, drei Kosmetik) — einzeln oder komplett in den
   geteilten Warenkorb. Die Karten nutzen DIESELBE ProductCard wie /shop
   (gleiche Bildfläche, Kartenhöhe, runder Plus-Knopf, Preisform), damit die
   Darstellungen nicht auseinanderlaufen. Die vollständigen technischen Daten
   stehen aufklappbar unter dem Raster (sprengen so nicht die Kartenhöhe), der
   Spannungs-Hinweis ebenfalls als Block unter dem Kern-Raster.
   „Kein Dämpfer“ ist ein Hinweis, kein Produkt. KEIN echter Shop (Demo-Korb).
   ────────────────────────────────────────────────────────────────────────── */

type Article = {
  id: string;
  brand: string;
  name: string;
  cat: Cat;
  priceCart: number | null; // Korb-Preis (null = auf Anfrage). Richtwert, s. Dokument.
  priceKey?: string;        // i18n-Preis-Etikett
  subKey: string;           // i18n kompakte Datenzeile (Karte)
  specsKey: string;         // i18n mehrzeilig „Label · Wert“ (Details unter dem Raster)
  warn?: boolean;           // Spannungswarnung betrifft diesen Artikel (Saite)
  image?: string;           // echtes Bild; leer → markenneutraler Kategorie-Platzhalter
};

const CORE: Article[] = [
  { id: "racket", brand: "Babolat", name: "Pure Aero 98", cat: "tennis", priceCart: 217, priceKey: "price_racket", subKey: "sub_racket", specsKey: "racket_specs" },
  { id: "string", brand: "Babolat", name: "RPM Team 1.30", cat: "gear", priceCart: 13, priceKey: "price_string", subKey: "sub_string", specsKey: "string_specs", warn: true, image: "/shop/setup/alcaraz/string.webp" },
  { id: "overgrip", brand: "Babolat", name: "VS Original Overgrip", cat: "gear", priceCart: 10, priceKey: "price_overgrip", subKey: "sub_overgrip", specsKey: "overgrip_specs", image: "/shop/setup/alcaraz/overgrip.avif" },
];
const COSMETIC: Article[] = [
  { id: "basisgriff", brand: "Babolat", name: "Leder-Basisgriffband", cat: "gear", priceCart: null, subKey: "sub_basisgriff", specsKey: "basisgriff_specs" },
  { id: "shoes", brand: "Nike", name: "Zoom Vapor 12", cat: "apparel", priceCart: 160, priceKey: "price_shoes", subKey: "sub_shoes", specsKey: "shoes_specs" },
  { id: "bag", brand: "Babolat", name: "RH12 Pure Aero Tasche", cat: "gear", priceCart: null, subKey: "sub_bag", specsKey: "bag_specs", image: "/shop/setup/alcaraz/bag.avif" },
];
const ALL = [...CORE, ...COSMETIC];

function toLine(a: Article): CartLine {
  return { id: `alcaraz-${a.id}`, brand: a.brand, name: a.name, price: a.priceCart, cat: a.cat, image: a.image };
}

export default function AlcarazSetup() {
  const t = useT();
  const { add } = useCart();

  const toCard = (a: Article): CardData => ({
    brand: a.brand,
    name: a.name,
    sub: t(`alcaraz.${a.subKey}`),
    priceLabel: a.priceKey ? t(`alcaraz.${a.priceKey}`) : t("alcaraz.priceOnRequest"),
    cat: a.cat,
    image: a.image,
  });

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

      {/* KERN — drei Karten im Shop-Raster */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("alcaraz.coreTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">{t("alcaraz.coreNote")}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CORE.map((a) => <ProductCard key={a.id} data={toCard(a)} onAdd={() => add(toLine(a))} />)}
        </div>

        {/* Spannungs-Hinweis: unter dem Raster, sprengt keine Kartenhöhe */}
        <div className="mt-5 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">{t("alcaraz.tensionWarnTitle")}</p>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-amber-900">{t("alcaraz.tensionWarnText")}</p>
        </div>
      </section>

      {/* KOSMETIK — Shop-Raster */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("alcaraz.cosmeticTitle")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {COSMETIC.map((a) => <ProductCard key={a.id} data={toCard(a)} onAdd={() => add(toLine(a))} />)}
        </div>
      </section>

      {/* TECHNISCHE DATEN — aufklappbar je Artikel (hält die Karten kompakt) */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("alcaraz.techTitle")}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {ALL.map((a) => (
            <details key={a.id} className="rounded-2xl bg-black/[0.02] p-4 ring-1 ring-black/5">
              <summary className="cursor-pointer list-none text-sm font-bold text-neutral-900">
                {a.brand} {a.name}
              </summary>
              <dl className="mt-3 space-y-1">
                {t(`alcaraz.${a.specsKey}`).split("\n").map((row) => {
                  const [label, ...rest] = row.split(" · ");
                  return (
                    <div key={label} className="flex justify-between gap-3 border-t border-black/[0.06] pt-1 text-[12px] first:border-t-0">
                      <dt className="text-neutral-500">{label}</dt>
                      <dd className="text-right font-semibold text-neutral-900">{rest.join(" · ")}</dd>
                    </div>
                  );
                })}
              </dl>
            </details>
          ))}
        </div>
      </section>

      {/* KEIN DÄMPFER — Hinweis, kein Produkt */}
      <section className="mt-12 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
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
