import type { Cat, CartLine } from "./cart";
import type { TFunction } from "@/lib/i18n";

/* ──────────────────────────────────────────────────────────────────────────
   GEMEINSAME Produktquelle — EINE Wahrheit für Shop-Raster, Alcaraz-Setup und
   die Produktdetailseite (/shop/[slug]). Vorher lagen die Daten in zwei
   getrennten Komponenten; das führte zu zwei Wegen. Ab hier lesen alle hieraus.

   Slug: aus Marke + Name abgeleitet, stabil und lesbar. EINDEUTIGKEIT ist der
   wichtigste Teil — „Babolat Pure Aero" und „Babolat Pure Aero 98" sind
   VERSCHIEDENE Produkte. Eine Kollision wirft beim Modul-Laden (Build/Start),
   BEVOR ein falsches Produkt auf den Bildschirm kommt.
   ────────────────────────────────────────────────────────────────────────── */

export type ProductGroup = "shop" | "alcaraz-core" | "alcaraz-cosmetic";

export type Product = {
  slug: string;
  brand: string;
  name: string;
  cat: Cat;
  group: ProductGroup;
  image?: string;                 // echtes Bild; leer → Kategorie-Platzhalter
  badge?: "neu" | "bestseller";
  // Preis: fester Betrag (Shop) ODER null (auf Anfrage). priceLabelKey (i18n)
  // überschreibt die Anzeige (z. B. Alcaraz-Ranges); price bleibt der Korb-Betrag.
  price: number | null;
  priceLabelKey?: string;
  // Kurz-Datenzeile: Literal (Shop) ODER i18n-Key (Alcaraz).
  sub?: string;
  subKey?: string;
  // Volle Technik (nur wo belegt): i18n mehrzeilig „Label · Wert".
  specsKey?: string;
  // Alcaraz-Kontext.
  setup?: boolean;                // Teil des Alcaraz-Setups (Hinweis + Rückweg)
  warn?: boolean;                 // Spannungswarnung (Saite)
  saleNoteKey?: string;           // Aktions-Hinweis (reduzierter Schuh)
};

// Rohdaten ohne Slug — der Slug wird zentral abgeleitet (unten).
type RawProduct = Omit<Product, "slug">;

// ── Slug-Bildung: „Marke Name" → kebab-case, Diakritika entfernt ────────────
export function slugify(brand: string, name: string): string {
  return `${brand}-${name}`
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // Diakritika (é, ô …) entfernen
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Shop-Produkte (die bestehenden 17, unverändert) ─────────────────────────
const SHOP_RAW: RawProduct[] = [
  // Tennis
  { brand: "Wilson", name: "Pro Staff 97 V14", sub: "315g · 97in² · 16×19", price: 289, badge: "bestseller", cat: "tennis", group: "shop" },
  { brand: "Babolat", name: "Pure Aero", sub: "300g · 100in² · 16×19", price: 269, cat: "tennis", group: "shop" },
  { brand: "Head", name: "Speed Pro", sub: "310g · 100in² · 18×20", price: 269, cat: "tennis", group: "shop" },
  { brand: "Yonex", name: "EZONE 98", sub: "305g · 98in² · 16×19", price: 269, badge: "neu", cat: "tennis", group: "shop" },
  // Padel
  { brand: "Bullpadel", name: "Vertex 04", sub: "365g · Tropfenform · EVA", price: 319, badge: "bestseller", cat: "padel", group: "shop" },
  { brand: "Adidas", name: "Metalbone 3.3", sub: "360g · Diamant · Carbon", price: 299, cat: "padel", group: "shop" },
  { brand: "Nox", name: "AT10 Genius", sub: "360g · Rund · 18K", price: 289, badge: "neu", cat: "padel", group: "shop" },
  { brand: "Head", name: "Speed Motion", sub: "355g · Hybrid · EVA", price: 199, cat: "padel", group: "shop" },
  // Pickleball
  { brand: "Joola", name: "Perseus CFS 16", sub: "Carbon · 16mm · 8.0oz", price: 249, badge: "bestseller", cat: "pickleball", group: "shop" },
  { brand: "Selkirk", name: "Vanguard Power", sub: "Carbon · 14mm · 7.9oz", price: 229, cat: "pickleball", group: "shop" },
  { brand: "CRBN", name: "1X Power Series", sub: "Carbon · 16mm · 8.1oz", price: 199, badge: "neu", cat: "pickleball", group: "shop" },
  { brand: "Engage", name: "Pursuit Pro", sub: "Composite · 14mm", price: 179, cat: "pickleball", group: "shop" },
  // Zubehör
  { brand: "Wilson", name: "Tennisbälle 4er", sub: "ITF · Allcourt", price: 12, cat: "gear", group: "shop" },
  { brand: "Head", name: "Padel-Bälle 3er", sub: "Druckstabil", price: 9, cat: "gear", group: "shop" },
  { brand: "Onix", name: "Pickleball-Bälle 6er", sub: "Outdoor · 40 Löcher", price: 18, cat: "gear", group: "shop" },
  { brand: "Wilson", name: "Pro Racketbag", sub: "12 Schläger · Thermo", price: 119, badge: "neu", cat: "gear", group: "shop" },
  { brand: "Matchup", name: "Overgrip-Set 12er", sub: "Perforiert · Tour", price: 19, badge: "bestseller", cat: "gear", group: "shop" },
];

// ── Alcaraz-Setup ────────────────────────────────────────────────────────────
// BILDHERKUNFT: Produktbilder unter /shop/setup/alcaraz/ stammen von tennis-point.ch;
// laut Auftraggeber besteht eine Nutzungserlaubnis. Werte 1:1 aus alcaraz-setup.md
// bzw. (Schuhe) nike.com. i18n-Keys sind voll qualifiziert (Namespace „alcaraz").
const ALCARAZ_CORE_RAW: RawProduct[] = [
  { brand: "Babolat", name: "Pure Aero 98", cat: "tennis", group: "alcaraz-core", setup: true, price: 217, priceLabelKey: "alcaraz.price_racket", subKey: "alcaraz.sub_racket", specsKey: "alcaraz.racket_specs" },
  { brand: "Babolat", name: "RPM Team 1.30", cat: "gear", group: "alcaraz-core", setup: true, warn: true, price: 13, priceLabelKey: "alcaraz.price_string", subKey: "alcaraz.sub_string", specsKey: "alcaraz.string_specs", image: "/shop/setup/alcaraz/string.webp" },
  { brand: "Babolat", name: "VS Original Overgrip", cat: "gear", group: "alcaraz-core", setup: true, price: 10, priceLabelKey: "alcaraz.price_overgrip", subKey: "alcaraz.sub_overgrip", specsKey: "alcaraz.overgrip_specs", image: "/shop/setup/alcaraz/overgrip.webp" },
];
const ALCARAZ_COSMETIC_RAW: RawProduct[] = [
  // Leder-Basisgriffband ENTFERNT — Alcaraz nutzt keins.
  // Drei Schuhvarianten (nike.com), mit echten Produktbildern. Preise mit Datenstand; reduzierter Preis nur mit Aktions-Hinweis.
  { brand: "Nike", name: "Vapor 12 Hartplatz", cat: "apparel", group: "alcaraz-cosmetic", setup: true, price: 169.99, priceLabelKey: "alcaraz.price_shoe_hard", subKey: "alcaraz.sub_shoe_hard", specsKey: "alcaraz.shoe_hard_specs", image: "/shop/setup/alcaraz/shoe-hard.avif" },
  { brand: "Nike", name: "Vapor 12 Hypersmash", cat: "apparel", group: "alcaraz-cosmetic", setup: true, price: 179.99, priceLabelKey: "alcaraz.price_shoe_hyper", subKey: "alcaraz.sub_shoe_hyper", specsKey: "alcaraz.shoe_hyper_specs", image: "/shop/setup/alcaraz/shoe-hyper.avif" },
  { brand: "Nike", name: "Zoom Vapor 12 PRM", cat: "apparel", group: "alcaraz-cosmetic", setup: true, price: 118.99, priceLabelKey: "alcaraz.price_shoe_prm", subKey: "alcaraz.sub_shoe_prm", specsKey: "alcaraz.shoe_prm_specs", saleNoteKey: "alcaraz.shoe_sale_note", image: "/shop/setup/alcaraz/shoe-prm.avif" },
  { brand: "Babolat", name: "RH12 Pure Aero Tasche", cat: "gear", group: "alcaraz-cosmetic", setup: true, price: null, subKey: "alcaraz.sub_bag", specsKey: "alcaraz.bag_specs", image: "/shop/setup/alcaraz/bag.webp" },
];

// ── Slug ableiten + EINDEUTIGKEIT erzwingen (wirft bei Kollision) ────────────
function withSlugs(raws: RawProduct[]): Product[] {
  return raws.map((r) => ({ ...r, slug: slugify(r.brand, r.name) }));
}

export const SHOP_PRODUCTS: Product[] = withSlugs(SHOP_RAW);
export const ALCARAZ_CORE: Product[] = withSlugs(ALCARAZ_CORE_RAW);
export const ALCARAZ_COSMETIC: Product[] = withSlugs(ALCARAZ_COSMETIC_RAW);
export const PRODUCTS: Product[] = [...SHOP_PRODUCTS, ...ALCARAZ_CORE, ...ALCARAZ_COSMETIC];

// Läuft beim Import (Build/Start): doppelter Slug = harter Fehler, kein falsches Produkt.
const bySlug = new Map<string, Product>();
for (const p of PRODUCTS) {
  const prev = bySlug.get(p.slug);
  if (prev) {
    throw new Error(
      `Doppelter Produkt-Slug "${p.slug}": „${prev.brand} ${prev.name}" und „${p.brand} ${p.name}". ` +
        `Slugs müssen eindeutig sein — sonst zeigt /shop/${p.slug} das falsche Produkt.`,
    );
  }
  bySlug.set(p.slug, p);
}

// ── Zugriff ──────────────────────────────────────────────────────────────────
export function getProduct(slug: string): Product | undefined {
  return bySlug.get(slug);
}
export function productHref(p: Product): string {
  return `/shop/${p.slug}`;
}
// Warenkorb-Zeile: id = slug → Raster UND Detailseite treffen DIESELBE Zeile.
export function productLine(p: Product): CartLine {
  return { id: p.slug, brand: p.brand, name: p.name, price: p.price, cat: p.cat, image: p.image };
}
export function productSub(p: Product, t: TFunction): string {
  return p.sub ?? (p.subKey ? t(p.subKey) : "");
}
export function productPriceLabel(p: Product, t: TFunction): string {
  if (p.priceLabelKey) return t(p.priceLabelKey);
  if (p.price == null) return t("shop.priceOnRequest");
  return `${p.price} €`;
}
