"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { useCart, type Cat } from "./cart";
import ProductCard, { type CardData } from "./ProductCard";

/* ──────────────────────────────────────────────────────────────────────────
   Daten
   ────────────────────────────────────────────────────────────────────────── */

type Product = {
  id: number;
  brand: string;
  name: string;
  sub: string;
  price: number;
  badge?: "neu" | "bestseller";
  cat: Cat;
};

const PRODUCTS: Product[] = [
  // Tennis
  { id: 1, brand: "Wilson", name: "Pro Staff 97 V14", sub: "315g · 97in² · 16×19", price: 289, badge: "bestseller", cat: "tennis" },
  { id: 2, brand: "Babolat", name: "Pure Aero", sub: "300g · 100in² · 16×19", price: 269, cat: "tennis" },
  { id: 3, brand: "Head", name: "Speed Pro", sub: "310g · 100in² · 18×20", price: 269, cat: "tennis" },
  { id: 4, brand: "Yonex", name: "EZONE 98", sub: "305g · 98in² · 16×19", price: 269, badge: "neu", cat: "tennis" },
  // Padel
  { id: 5, brand: "Bullpadel", name: "Vertex 04", sub: "365g · Tropfenform · EVA", price: 319, badge: "bestseller", cat: "padel" },
  { id: 6, brand: "Adidas", name: "Metalbone 3.3", sub: "360g · Diamant · Carbon", price: 299, cat: "padel" },
  { id: 7, brand: "Nox", name: "AT10 Genius", sub: "360g · Rund · 18K", price: 289, badge: "neu", cat: "padel" },
  { id: 8, brand: "Head", name: "Speed Motion", sub: "355g · Hybrid · EVA", price: 199, cat: "padel" },
  // Pickleball
  { id: 9, brand: "Joola", name: "Perseus CFS 16", sub: "Carbon · 16mm · 8.0oz", price: 249, badge: "bestseller", cat: "pickleball" },
  { id: 10, brand: "Selkirk", name: "Vanguard Power", sub: "Carbon · 14mm · 7.9oz", price: 229, cat: "pickleball" },
  { id: 11, brand: "CRBN", name: "1X Power Series", sub: "Carbon · 16mm · 8.1oz", price: 199, badge: "neu", cat: "pickleball" },
  { id: 12, brand: "Engage", name: "Pursuit Pro", sub: "Composite · 14mm", price: 179, cat: "pickleball" },
  // Zubehör
  { id: 13, brand: "Wilson", name: "Tennisbälle 4er", sub: "ITF · Allcourt", price: 12, cat: "gear" },
  { id: 14, brand: "Head", name: "Padel-Bälle 3er", sub: "Druckstabil", price: 9, cat: "gear" },
  { id: 15, brand: "Onix", name: "Pickleball-Bälle 6er", sub: "Outdoor · 40 Löcher", price: 18, cat: "gear" },
  { id: 16, brand: "Wilson", name: "Pro Racketbag", sub: "12 Schläger · Thermo", price: 119, badge: "neu", cat: "gear" },
  { id: 18, brand: "Matchup", name: "Overgrip-Set 12er", sub: "Perforiert · Tour", price: 19, badge: "bestseller", cat: "gear" },
];

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

// Shop-Produkt → Karten-Daten (geteilte ProductCard). Preis in der Shop-Form „{n} €".
function toCard(p: Product): CardData {
  return { brand: p.brand, name: p.name, sub: p.sub, priceLabel: `${p.price} €`, cat: p.cat, badge: p.badge };
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

  const shown = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === filter);
  const favorites = PRODUCTS.filter((p) => p.badge);

  // Produkt → Korbzeile. id namespaced ("shop-N"), damit sie nicht mit Alcaraz kollidiert.
  function addToCart(id: number) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (p) add({ id: `shop-${p.id}`, brand: p.brand, name: p.name, price: p.price, cat: p.cat });
  }
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
              <div key={p.id} className="w-[260px] flex-shrink-0 snap-start">
                <ProductCard data={toCard(p)} onAdd={() => addToCart(p.id)} />
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
              <ProductCard key={p.id} data={toCard(p)} onAdd={() => addToCart(p.id)} showBadge showBrand />
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
