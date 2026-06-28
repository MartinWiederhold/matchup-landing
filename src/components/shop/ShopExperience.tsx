"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import BeratungForm from "./BeratungForm";

/* ──────────────────────────────────────────────────────────────────────────
   Daten
   ────────────────────────────────────────────────────────────────────────── */

type Cat = "tennis" | "padel" | "pickleball" | "gear";

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
  { id: 16, brand: "Matchup", name: "Pro Racketbag", sub: "12 Schläger · Thermo", price: 119, badge: "neu", cat: "gear" },
  { id: 17, brand: "Luxilon", name: "ALU Power Saite", sub: "1.25mm · 200m Rolle", price: 39, cat: "gear" },
  { id: 18, brand: "Matchup", name: "Overgrip-Set 12er", sub: "Perforiert · Tour", price: 19, badge: "bestseller", cat: "gear" },
];

const FILTERS: { key: Cat | "all"; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "tennis", label: "Tennis" },
  { key: "padel", label: "Padel" },
  { key: "pickleball", label: "Pickleball" },
  { key: "gear", label: "Zubehör" },
];

const COLLECTIONS: { title: string; meta: string; cat: Cat; img: string }[] = [
  { title: "Tennis\nSchläger", meta: "Wilson · Babolat · Head", cat: "tennis", img: "/tennis/tennis-2.jpg" },
  { title: "Padel\nSchläger", meta: "Bullpadel · Nox · Adidas", cat: "padel", img: "/padel/padel-1.jpg" },
  { title: "Pickleball\nPaddles", meta: "Joola · Selkirk · CRBN", cat: "pickleball", img: "/pickleball/pickleball-1.jpg" },
  { title: "Zubehör\n& Bälle", meta: "Taschen · Saiten · Griffe", cat: "gear", img: "/tennis/tennis-3.jpg" },
];

const SERVICES: {
  num: string;
  title: string;
  lead: string;
  img: string;
  rows: [string, string][];
  note: string;
}[] = [
  {
    num: "01",
    title: "Besaitungs-Service",
    lead: "Schläger einschicken — frisch besaitet zurück, auf Tour-Niveau.",
    img: "/shop/service-stringing.jpg",
    rows: [
      ["Express-Besaitung", "24h · 25 €"],
      ["Express + Premium-Saite", "24h · 39 €"],
      ["Standard-Besaitung", "3–5 Tage · 19 €"],
      ["Hybrid-Besaitung", "3–5 Tage · 29 €"],
    ],
    note: "Alle gängigen Saiten am Lager: Luxilon, Babolat RPM, Head Hawk, Solinco & mehr. Dein digitales Spieler-Profil speichert dein Setup für die nächste Besaitung.",
  },
  {
    num: "02",
    title: "Test & Verleih",
    lead: "Testen statt raten — finde deinen Schläger auf dem Platz.",
    img: "/shop/service-rental.jpg",
    rows: [
      ["Einzel-Demo", "3 Tage · 9 €"],
      ["Vergleichs-Set (2 Schläger)", "5 Tage · 19 €"],
      ["Demo-Flat", "2 Schläger/Monat · 29 €"],
    ],
    note: "Über 100 Demo-Schläger von Wilson, Babolat, Head, Nox & Joola — frei Haus geliefert. Die Leihgebühr wird beim Kauf voll angerechnet.",
  },
  {
    num: "03",
    title: "Beratung & Fitting",
    lead: "Persönlich, ehrlich, fundiert — wir finden den Schläger für dein Spiel.",
    img: "/shop/service-consult.jpg",
    rows: [
      ["Schnell-Beratung", "15 Min · kostenlos"],
      ["Video-Fitting", "30 Min · 39 €"],
      ["Custom-Setup", "60 Min · 99 €"],
    ],
    note: "Spielstil-Analyse, Gewicht, Balance, Swingweight und Griffstärke — komplett online per Video. Dein vollständiges Setup-Profil wird digital gespeichert.",
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   Platzhalter-Grafik für Produktbilder (noch keine echten Produktfotos)
   ────────────────────────────────────────────────────────────────────────── */

function productImage(cat: Cat, brand: string): string | undefined {
  if (cat === "tennis")
    return brand === "Yonex" ? "/shop/tennis-racket.png" : "/shop/babolat-racket.png";
  if (cat === "padel") return "/shop/padel-racket.png";
  return undefined;
}

function ProductVisual({
  cat,
  brand,
  dense,
}: {
  cat: Cat;
  brand: string;
  dense?: boolean;
}) {
  const img = productImage(cat, brand);
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-200 ${
        dense ? "p-2" : "p-5"
      }`}
    >
      {img ? (
        <Image
          src={img}
          alt={brand}
          fill
          sizes={dense ? "64px" : "(max-width:1024px) 50vw, 25vw"}
          className={`object-contain ${dense ? "p-1" : "p-5"} transition-transform duration-500 group-hover:scale-105`}
        />
      ) : (
        <RacketGlyph cat={cat} className="h-2/3 w-2/3 text-neutral-300" />
      )}
      {!dense && (
        <span className="absolute bottom-3 left-0 right-0 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          {brand}
        </span>
      )}
    </div>
  );
}

function RacketGlyph({ cat, className }: { cat: Cat; className?: string }) {
  if (cat === "gear") {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
        <circle cx="32" cy="30" r="18" stroke="currentColor" strokeWidth="2.5" />
        <path d="M20 30h24M32 18v24M24 22l16 16M40 22L24 38" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (cat === "pickleball") {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
        <rect x="18" y="6" width="28" height="36" rx="8" stroke="currentColor" strokeWidth="2.5" />
        <path d="M30 42h4v16h-4z" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="27" cy="20" r="1.6" fill="currentColor" />
        <circle cx="37" cy="20" r="1.6" fill="currentColor" />
        <circle cx="32" cy="28" r="1.6" fill="currentColor" />
      </svg>
    );
  }
  // tennis & padel — Schläger
  const rx = cat === "padel" ? 13 : 11;
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <ellipse cx="32" cy="22" rx={rx} ry={cat === "padel" ? 15 : 14} stroke="currentColor" strokeWidth="2.5" />
      <path d="M30 37h4l1 21h-6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      {cat === "tennis" && (
        <path
          d="M24 22h16M32 9v26M27 12l10 20M37 12L27 32"
          stroke="currentColor"
          strokeWidth="1"
        />
      )}
      {cat === "padel" && (
        <g>
          <circle cx="27" cy="18" r="1.4" fill="currentColor" />
          <circle cx="37" cy="18" r="1.4" fill="currentColor" />
          <circle cx="32" cy="25" r="1.4" fill="currentColor" />
          <circle cx="27" cy="28" r="1.4" fill="currentColor" />
          <circle cx="37" cy="28" r="1.4" fill="currentColor" />
        </g>
      )}
    </svg>
  );
}

const BookmarkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

/* ──────────────────────────────────────────────────────────────────────────
   Hauptkomponente
   ────────────────────────────────────────────────────────────────────────── */

export default function ShopExperience() {
  const [filter, setFilter] = useState<Cat | "all">("all");
  const [cart, setCart] = useState<{ id: number; qty: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [beratungOpen, setBeratungOpen] = useState(false);
  const hscroll = useRef<HTMLDivElement>(null);

  const shown = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === filter);
  const favorites = PRODUCTS.filter((p) => p.badge);

  const cartItems = useMemo(
    () =>
      cart
        .map((c) => {
          const p = PRODUCTS.find((x) => x.id === c.id);
          return p ? { ...p, qty: c.qty } : null;
        })
        .filter(Boolean) as (Product & { qty: number })[],
    [cart],
  );
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cartItems.reduce((s, c) => s + c.price * c.qty, 0);

  function addToCart(id: number) {
    setCart((prev) => {
      const ex = prev.find((c) => c.id === id);
      return ex
        ? prev.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c))
        : [...prev, { id, qty: 1 }];
    });
    setCartOpen(true);
  }
  function removeFromCart(id: number) {
    setCart((prev) => prev.filter((c) => c.id !== id));
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
      {/* Mini-Warenkorb-Trigger (sticky) */}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
      >
        Warenkorb
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-black">
          {count}
        </span>
      </button>

      {/* HERO */}
      <section className="relative flex h-[68vh] min-h-[460px] items-center justify-center overflow-hidden">
        <Image
          src="/tennis/tennis-1.jpg"
          alt="Matchup Shop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 70%" }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <h1 className="relative z-10 px-6 text-center text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
          Matchup Shop
        </h1>
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between gap-4 p-5 sm:p-8">
          <div className="flex max-w-lg items-center gap-5 rounded-sm bg-neutral-900/80 px-6 py-5 text-sm font-light leading-relaxed text-white backdrop-blur">
            <span>
              Premium-Equipment für Tennis, Padel &amp; Pickleball. Schläger,
              Besaitung, Verleih &amp; persönliche Beratung — alles online an
              einem Ort.
            </span>
            <a
              href="#shop"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/40 text-lg transition-colors hover:bg-white hover:text-black"
            >
              ↓
            </a>
          </div>
        </div>
      </section>

      {/* WEEKLY FAVORITES */}
      <section className="px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader title="Beliebt diese Woche">
            <PillButton onClick={() => selectFilter("all")}>Alle Schläger ansehen</PillButton>
          </SectionHeader>
          <div className="mb-8 h-px w-full bg-neutral-200" />
          <div
            ref={hscroll}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {favorites.map((p) => (
              <div key={p.id} className="w-[260px] flex-shrink-0 snap-start">
                <ProductCard product={p} onAdd={addToCart} />
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
          <SectionHeader title="Unsere Kategorien" />
          <div className="mb-8 h-px w-full bg-neutral-200" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {COLLECTIONS.map((c) => (
              <button
                key={c.cat}
                type="button"
                onClick={() => selectFilter(c.cat)}
                className="group relative aspect-[3/4] overflow-hidden rounded-md bg-neutral-100 text-left"
              >
                <Image
                  src={c.img}
                  alt={c.title.replace("\n", " ")}
                  fill
                  sizes="(max-width:1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
                <span className="absolute left-5 top-5 whitespace-pre-line text-2xl font-bold leading-tight tracking-tight text-white drop-shadow sm:text-3xl">
                  {c.title}
                </span>
                <span className="absolute bottom-4 left-5 text-[11px] font-medium text-white/90 drop-shadow">
                  {c.meta}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FULL SHOP GRID */}
      <section id="shop" className="px-4 pb-20 pt-6 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Alle Produkte</h2>
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
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
            {shown.length} Ergebnisse
          </p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} showBadge showBrand />
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-black px-4 py-20 text-white sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Unsere Services</h2>
          <p className="mb-14 mt-4 text-base font-light text-neutral-400">
            Drei Säulen, ein Ziel: dein bestes Spiel.
          </p>
          <div className="space-y-16">
            {SERVICES.map((s, i) => (
              <div
                key={s.num}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-12 ${
                  i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-[16/11] overflow-hidden rounded-xl">
                  <Image
                    src={s.img}
                    alt={s.title}
                    fill
                    sizes="(max-width:1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="mb-3 text-xs font-semibold tracking-[0.12em] text-neutral-500">
                    {s.num}
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">{s.title}</h3>
                  <p className="mb-6 mt-2 text-sm leading-relaxed text-neutral-300">
                    {s.lead}
                  </p>
                  <div className="mb-5">
                    {s.rows.map(([l, r]) => (
                      <div
                        key={l}
                        className="flex justify-between border-b border-white/10 py-2.5 text-[13px]"
                      >
                        <span className="text-neutral-300">{l}</span>
                        <span className="font-medium text-white">{r}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-light leading-relaxed text-neutral-500">
                    {s.note}
                  </p>
                  {s.num === "03" && (
                    <button
                      type="button"
                      onClick={() => setBeratungOpen(true)}
                      className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black transition-colors hover:bg-neutral-200"
                    >
                      Kostenlose Beratung anfragen →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BERATUNGS-FORMULAR */}
      <BeratungForm open={beratungOpen} onClose={() => setBeratungOpen(false)} />

      {/* CART DRAWER */}
      <div
        onClick={() => setCartOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/35 transition-opacity ${
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed bottom-0 right-0 top-0 z-[61] flex w-full max-w-[400px] flex-col bg-white transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h3 className="text-lg font-bold tracking-tight">Warenkorb ({count})</h3>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-sm transition-colors hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6">
          {cartItems.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-400">
              Dein Warenkorb ist leer
            </p>
          ) : (
            cartItems.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 border-b border-neutral-100 py-4"
              >
                <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded">
                  <ProductVisual cat={c.cat} brand={c.brand} dense />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-[0.06em] text-neutral-500">
                    {c.brand}
                  </div>
                  <div className="my-0.5 text-[13px] font-medium">
                    {c.name}
                    {c.qty > 1 && ` (${c.qty}×)`}
                  </div>
                  <div className="text-sm font-semibold">{c.price * c.qty} €</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(c.id)}
                  className="text-neutral-400 transition-colors hover:text-black"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="border-t border-neutral-200 px-6 py-5">
            <div className="mb-4 flex justify-between text-[15px]">
              <span>Summe</span>
              <span className="font-bold">{total} €</span>
            </div>
            <button
              type="button"
              onClick={() => alert("Checkout-Demo — danke für deinen Einkauf! 🎾")}
              className="h-12 w-full rounded-full bg-black text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Zur Kasse
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Bausteine
   ────────────────────────────────────────────────────────────────────────── */

function ProductCard({
  product: p,
  onAdd,
  showBadge,
  showBrand,
}: {
  product: Product;
  onAdd: (id: number) => void;
  showBadge?: boolean;
  showBrand?: boolean;
}) {
  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-md">
        <ProductVisual cat={p.cat} brand={p.brand} />
        {showBadge && p.badge && (
          <span className="absolute left-2.5 top-2.5 rounded bg-black px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-white">
            {p.badge === "neu" ? "Neu" : "Bestseller"}
          </span>
        )}
        <button
          type="button"
          aria-label="Merken"
          className="absolute right-2.5 top-2.5 text-neutral-500 opacity-0 transition-opacity hover:text-black group-hover:opacity-100"
        >
          <BookmarkIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="pt-2.5">
        {showBrand && (
          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
            {p.brand}
          </div>
        )}
        <div className="text-sm font-medium">{p.name}</div>
        <div className="text-[11px] text-neutral-500">{p.sub}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[15px] font-semibold">{p.price} €</span>
          <button
            type="button"
            aria-label={`${p.name} in den Warenkorb`}
            onClick={() => onAdd(p.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-lg text-white transition-transform hover:scale-110"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

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
