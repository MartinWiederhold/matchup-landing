"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { ProductVisual } from "./productVisual";
import type { Cat } from "./cart";

/* ──────────────────────────────────────────────────────────────────────────
   Geteilte Produktkarte — GENAU dieselbe Darstellung im Shop-Raster (/shop)
   UND auf der Alcaraz-Setup-Seite. `priceLabel` ist ein fertiger String,
   `onAdd` parameterlos.

   Klickbar zur Detailseite über einen „Stretched-Link" (absolut über der Karte,
   z-10). Der runde „+"-Knopf und das Merken-Icon liegen DARÜBER (z-20) — ein
   Klick darauf legt nur in den Warenkorb bzw. tut nichts und navigiert NICHT.
   (Klassische Falle: Knopf über Link löst beides aus; hier durch die z-Ebenen
   und den e2e-Test abgesichert.)
   ────────────────────────────────────────────────────────────────────────── */

export type CardData = {
  brand: string;
  name: string;
  sub: string;
  priceLabel: string;
  cat: Cat;
  image?: string;
  badge?: "neu" | "bestseller";
};

const BookmarkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export default function ProductCard({
  data,
  href,
  onAdd,
  showBadge,
  showBrand,
}: {
  data: CardData;
  href?: string;                  // Ziel der Detailseite (Stretched-Link)
  onAdd: () => void;
  showBadge?: boolean;
  showBrand?: boolean;
}) {
  const t = useT();
  return (
    <div className="group relative">
      {/* Stretched-Link: deckt die ganze Karte ab (z-10). Bild/Name/Preis liegen
          darunter (z-auto) → Klick darauf navigiert. */}
      {href && <Link href={href} aria-label={data.name} className="absolute inset-0 z-10 rounded-md" />}

      <div className="relative aspect-[3/4] overflow-hidden rounded-md">
        <ProductVisual cat={data.cat} brand={data.brand} name={data.name} src={data.image} />
        {showBadge && data.badge && (
          <span className="absolute left-2.5 top-2.5 z-20 rounded bg-black px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-white">
            {data.badge === "neu" ? t("shop.badgeNew") : t("shop.badgeBestseller")}
          </span>
        )}
        <button
          type="button"
          aria-label={t("shop.bookmarkAria")}
          onClick={(e) => e.preventDefault()}
          className="absolute right-2.5 top-2.5 z-20 text-neutral-500 opacity-0 transition-opacity hover:text-black group-hover:opacity-100"
        >
          <BookmarkIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="pt-2.5">
        {showBrand && (
          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
            {data.brand}
          </div>
        )}
        <div className="text-sm font-medium">{data.name}</div>
        <div className="text-[11px] text-neutral-500">{data.sub}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[15px] font-semibold">{data.priceLabel}</span>
          <button
            type="button"
            aria-label={t("shop.addToCartAria", { name: data.name })}
            onClick={(e) => {
              // Nur Warenkorb, NICHT navigieren: der Knopf liegt über dem Link (z-20).
              e.preventDefault();
              e.stopPropagation();
              onAdd();
            }}
            className="relative z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black text-lg text-white transition-transform hover:scale-110"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
