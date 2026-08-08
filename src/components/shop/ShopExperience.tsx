"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT, type TFunction } from "@/lib/i18n";
import { useCart, type Cat } from "./cart";
import ProductCard, { type CardData } from "./ProductCard";
import { SHOP_PRODUCTS, productHref, productLine, productSub, productPriceLabel, type Product } from "./products";

/* ──────────────────────────────────────────────────────────────────────────
   Daten — die 17 Shop-Produkte kommen jetzt aus der gemeinsamen Quelle
   (products.ts), damit Raster und Detailseite EINE Wahrheit teilen.
   ────────────────────────────────────────────────────────────────────────── */

const FILTERS: { key: Cat | "all"; labelKey: string }[] = [
  { key: "all", labelKey: "shop.filterAll" },
  { key: "tennis", labelKey: "shop.filterTennis" },
  { key: "padel", labelKey: "shop.filterPadel" },
  { key: "pickleball", labelKey: "shop.filterPickleball" },
  { key: "gear", labelKey: "shop.filterGear" },
];

const COLLECTIONS: {
  titleKey: string;
  metaKey: string;
  cat: Cat;
  img: string;
}[] = [
  { titleKey: "shop.collectionTennisTitle", metaKey: "shop.collectionTennisMeta", cat: "tennis", img: "/tennis/tennis-2.jpg" },
  { titleKey: "shop.collectionPadelTitle", metaKey: "shop.collectionPadelMeta", cat: "padel", img: "/padel/padel-1.jpg" },
  { titleKey: "shop.collectionPickleballTitle", metaKey: "shop.collectionPickleballMeta", cat: "pickleball", img: "/pickleball/pickleball-1.jpg" },
  { titleKey: "shop.collectionGearTitle", metaKey: "shop.collectionGearMeta", cat: "gear", img: "/tennis/tennis-3.jpg" },
];

// Shop-Produkt → Karten-Daten (geteilte ProductCard).
function toCard(p: Product, t: TFunction): CardData {
  return { brand: p.brand, name: p.name, sub: productSub(p, t), priceLabel: productPriceLabel(p, t), cat: p.cat, image: p.image, badge: p.badge };
}

/* ──────────────────────────────────────────────────────────────────────────
   Hauptkomponente — Warenkorb liegt jetzt im geteilten Context (cart.tsx);
   Sticky-Button + Drawer rendert das Shop-Layout über CartUI. Bedienung und
   Darstellung des Shops bleiben unverändert.
   ────────────────────────────────────────────────────────────────────────── */

export default function ShopExperience() {
  const t = useT();
  const { add } = useCart();
  const [filter, setFilter] = useState<Cat | "all">("all");
  const hscroll = useRef<HTMLDivElement>(null);

  const shown = filter === "all" ? SHOP_PRODUCTS : SHOP_PRODUCTS.filter((p) => p.cat === filter);
  const favorites = SHOP_PRODUCTS.filter((p) => p.badge);

  function selectFilter(cat: Cat | "all") {
    setFilter(cat);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }
  function scrollFav(dir: 1 | -1) {
    hscroll.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  }

  return (
    <>
      {/* HERO */}
      <section className="relative flex h-[68vh] min-h-[460px] items-center justify-center overflow-hidden">
        <Image
          src="/shop/hero.jpg"
          alt={t("shop.heroAlt")}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 40%" }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <h1 className="relative z-10 px-6 text-center text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
          {t("shop.heroTitle")}
        </h1>
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between gap-4 p-5 sm:p-8">
          <div className="flex max-w-lg items-center gap-5 rounded-sm bg-neutral-900/80 px-6 py-5 text-sm font-light leading-relaxed text-white backdrop-blur">
            <span>{t("shop.heroText")}</span>
            <a
              href="#shop"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/40 text-lg transition-colors hover:bg-white hover:text-black"
            >
              ↓
            </a>
          </div>
        </div>
      </section>

      {/* DEZENTER HINWEIS: Alcaraz-Setup-Seite */}
      <section className="px-4 pt-8 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <Link
            href="/shop/setup/alcaraz"
            className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-neutral-50 px-5 py-3.5 text-sm transition-colors hover:border-neutral-400"
          >
            <span className="text-neutral-700">
              <span className="font-semibold text-neutral-900">{t("shop.setupHintTitle")}</span>
              <span className="ml-2 text-neutral-500">{t("shop.setupHintText")}</span>
            </span>
            <span aria-hidden className="shrink-0 font-semibold">→</span>
          </Link>
        </div>
      </section>

      {/* WEEKLY FAVORITES */}
      <section className="px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader title={t("shop.favoritesTitle")}>
            <PillButton onClick={() => selectFilter("all")}>{t("shop.viewAllRackets")}</PillButton>
          </SectionHeader>
          <div className="mb-8 h-px w-full bg-neutral-200" />
          <div
            ref={hscroll}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {favorites.map((p) => (
              <div key={p.slug} className="w-[260px] flex-shrink-0 snap-start">
                <ProductCard data={toCard(p, t)} href={productHref(p)} onAdd={() => add(productLine(p))} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <RoundButton onClick={() => scrollFav(-1)}>←</RoundButton>
            <RoundButton onClick={() => scrollFav(1)}>→</RoundButton>
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader title={t("shop.categoriesTitle")} />
          <div className="mb-8 h-px w-full bg-neutral-200" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {COLLECTIONS.map((c) => {
              const title = t(c.titleKey);
              return (
                <button
                  key={c.cat}
                  type="button"
                  onClick={() => selectFilter(c.cat)}
                  className="group relative aspect-[3/4] overflow-hidden rounded-md bg-neutral-100 text-left"
                >
                  <Image
                    src={c.img}
                    alt={title.replace("\n", " ")}
                    fill
                    sizes="(max-width:1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
                  <span className="absolute left-5 top-5 whitespace-pre-line text-2xl font-bold leading-tight tracking-tight text-white drop-shadow sm:text-3xl">
                    {title}
                  </span>
                  <span className="absolute bottom-4 left-5 text-[11px] font-medium text-white/90 drop-shadow">
                    {t(c.metaKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FULL SHOP GRID */}
      <section id="shop" className="px-4 pb-20 pt-6 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{t("shop.allProductsTitle")}</h2>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`h-9 rounded-full border px-4 text-xs font-medium transition-colors ${
                    filter === f.key
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 bg-white text-black hover:border-black"
                  }`}
                >
                  {t(f.labelKey)}
                </button>
              ))}
            </div>
          </div>
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
            {t("shop.resultsCount", { count: shown.length })}
          </p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.slug} data={toCard(p, t)} href={productHref(p)} onAdd={() => add(productLine(p))} showBadge showBrand />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Bausteine
   ────────────────────────────────────────────────────────────────────────── */

function SectionHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{title}</h2>
      {children}
    </div>
  );
}

function PillButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center rounded-full border-[1.5px] border-black px-7 text-[13px] transition-colors hover:bg-black hover:text-white"
    >
      {children}
    </button>
  );
}

function RoundButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 text-base transition-colors hover:bg-neutral-100"
    >
      {children}
    </button>
  );
}
