"use client";

import { useT } from "@/lib/i18n";
import { ProductVisual } from "./productVisual";
import type { Cat } from "./cart";

/* ──────────────────────────────────────────────────────────────────────────
   Geteilte Produktkarte — GENAU dieselbe Darstellung im Shop-Raster (/shop)
   UND auf der Alcaraz-Setup-Seite. Markup 1:1 aus ShopExperience herausgezogen,
   damit die beiden Ansichten nicht wieder auseinanderlaufen. Nur zwei
   Verallgemeinerungen: `priceLabel` ist ein fertiger String (Shop: „269 €",
   Alcaraz: „ca. 217–300 €" / „Preis auf Anfrage") und `onAdd` ist parameterlos.
   ────────────────────────────────────────────────────────────────────────── */

export type CardData = {
  brand: string;
  name: string;
  sub: string;
  priceLabel: string;
  cat: Cat;
  image?: string;                 // expliziter Bildpfad (sonst Kategorie-Platzhalter)
  badge?: "neu" | "bestseller";
};

const BookmarkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export default function ProductCard({
  data,
  onAdd,
  showBadge,
  showBrand,
}: {
  data: CardData;
  onAdd: () => void;
  showBadge?: boolean;
  showBrand?: boolean;
}) {
  const t = useT();
  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-md">
        <ProductVisual cat={data.cat} brand={data.brand} name={data.name} src={data.image} />
        {showBadge && data.badge && (
          <span className="absolute left-2.5 top-2.5 rounded bg-black px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-white">
            {data.badge === "neu" ? t("shop.badgeNew") : t("shop.badgeBestseller")}
          </span>
        )}
        <button
          type="button"
          aria-label={t("shop.bookmarkAria")}
          className="absolute right-2.5 top-2.5 text-neutral-500 opacity-0 transition-opacity hover:text-black group-hover:opacity-100"
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
            onClick={onAdd}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-lg text-white transition-transform hover:scale-110"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
