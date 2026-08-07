import Image from "next/image";
import type { Cat } from "./cart";

/* ──────────────────────────────────────────────────────────────────────────
   Platzhalter-Grafik für Produktbilder (noch keine echten Produktfotos).
   1:1 aus ShopExperience.tsx herausgezogen, damit sowohl das Shop-Grid als auch
   der Warenkorb-Drawer (CartUI) und die Alcaraz-Setup-Seite dieselbe Darstellung
   nutzen. Zusätzlich: optionaler `src`-Override, damit später ein echtes Bild je
   Artikel eingesetzt werden kann, ohne den Platzhalter-Mechanismus zu verlieren.
   ────────────────────────────────────────────────────────────────────────── */

export function productImage(cat: Cat, brand: string, name = ""): string | undefined {
  if (cat === "tennis")
    return brand === "Yonex" ? "/shop/tennis-racket.png" : "/shop/babolat-racket.png";
  if (cat === "padel") return "/shop/padel-racket.png";
  if (cat === "pickleball") return "/shop/pickleball-paddle.png";
  // Bekleidung & Zubehör: nach Produktname
  const n = name.toLowerCase();
  if (n.includes("herren")) return "/shop/pullover-herren.png";
  if (n.includes("damen") || n.includes("frau")) return "/shop/pullover-frau.png";
  if (n.includes("grip")) return "/shop/grips.png";
  if (n.includes("ball") || n.includes("bälle")) return "/shop/balls.png";
  if (n.includes("bag") || n.includes("tasche")) return "/shop/bag.png";
  return undefined;
}

// Vollformat-Fotos (Lifestyle/Produktfoto mit eigenem Hintergrund) -> object-cover
const COVER_IMAGES = new Set([
  "/shop/pullover-herren.png",
  "/shop/pullover-frau.png",
  "/shop/bag.png",
]);

export function ProductVisual({
  cat,
  brand,
  name,
  dense,
  src,
}: {
  cat: Cat;
  brand: string;
  name?: string;
  dense?: boolean;
  src?: string; // expliziter Bildpfad (gewinnt über die Kategorie-Logik)
}) {
  const img = src ?? productImage(cat, brand, name);
  const cover = img ? COVER_IMAGES.has(img) : false;

  // Vollformat-Foto (Pullover, Tasche): randlos füllen
  if (img && cover) {
    return (
      <div className="relative h-full w-full bg-neutral-100">
        <Image
          src={img}
          alt={brand}
          fill
          sizes={dense ? "64px" : "(max-width:1024px) 50vw, 25vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

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

export function RacketGlyph({ cat, className }: { cat: Cat; className?: string }) {
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
        <path d="M24 22h16M32 9v26M27 12l10 20M37 12L27 32" stroke="currentColor" strokeWidth="1" />
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
