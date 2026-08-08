"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { useCart } from "./cart";
import { ProductVisual } from "./productVisual";
import { productLine, productPriceLabel, productSub, type Product } from "./products";

/* ──────────────────────────────────────────────────────────────────────────
   Produktdetailseite (/shop/[slug]). Liest ein Produkt aus der gemeinsamen
   Quelle (products.ts). Zeigt das Bild groß, Marke/Name/Preis, die vollständigen
   technischen Daten (die früher unten auf der Alcaraz-Seite standen), „In den
   Warenkorb". Bei Alcaraz-Artikeln: Setup-Hinweis + Rückweg; bei der Saite die
   Spannungswarnung (dort, wo die Entscheidung fällt). Handy: Bild oben, Daten
   darunter — Desktop zweispaltig.
   ────────────────────────────────────────────────────────────────────────── */

export default function ProductDetail({ product: p }: { product: Product }) {
  const t = useT();
  const { add } = useCart();

  const specs = p.specsKey
    ? t(p.specsKey).split("\n").map((row) => {
        const [label, ...rest] = row.split(" · ");
        return { label, value: rest.join(" · ") };
      })
    : [];

  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12 lg:px-12">
      <Link href="/shop" className="text-xs font-semibold text-neutral-500 hover:text-black">
        ← {t("shop.detailBackToShop")}
      </Link>

      {/* Handy: Bild oben, Daten darunter. Desktop: zwei Spalten. */}
      <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* BILD groß */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
          <ProductVisual cat={p.cat} brand={p.brand} name={p.name} src={p.image} />
        </div>

        {/* DATEN */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">{p.brand}</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">{p.name}</h1>
          <div className="mt-3 text-2xl font-bold text-neutral-900">{productPriceLabel(p, t)}</div>
          {p.saleNoteKey && <p className="mt-1 text-xs font-semibold text-amber-600">{t(p.saleNoteKey)}</p>}
          {p.setup && <p className="mt-1 text-xs text-neutral-400">{t("alcaraz.priceStand")}</p>}

          <button
            type="button"
            onClick={() => add(productLine(p))}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-black px-8 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            {t("shop.detailAddToCart")}
          </button>

          {/* Alcaraz-Kontext: Teil des Setups + Rückweg */}
          {p.setup && (
            <div className="mt-5 rounded-2xl bg-black/[0.03] p-4 ring-1 ring-black/5">
              <p className="text-sm font-semibold text-neutral-900">{t("alcaraz.setupPart")}</p>
              <Link href="/shop/setup/alcaraz" className="mt-1 inline-flex text-sm font-semibold text-matchup hover:underline">
                {t("alcaraz.backToSetup")} →
              </Link>
            </div>
          )}

          {/* Saite: Spannungswarnung — dort, wo die Entscheidung fällt */}
          {p.warn && (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">{t("alcaraz.tensionWarnTitle")}</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">{t("alcaraz.tensionWarnText")}</p>
            </div>
          )}

          {/* Technische Daten */}
          <div className="mt-8">
            <h2 className="text-sm font-bold text-neutral-900">{t("shop.detailTechTitle")}</h2>
            {specs.length > 0 ? (
              <dl className="mt-3 space-y-1">
                {specs.map((s) => (
                  <div key={s.label} className="flex justify-between gap-4 border-t border-black/[0.06] pt-1.5 text-[13px] first:border-t-0">
                    <dt className="text-neutral-500">{s.label}</dt>
                    <dd className="text-right font-semibold text-neutral-900">{s.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              // Shop-Produkte ohne Detailspecs: die vorhandene Kurzzeile (nichts erfunden).
              <p className="mt-2 text-sm text-neutral-600">{productSub(p, t)}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
