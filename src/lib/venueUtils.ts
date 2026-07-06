import { VENUES, type Venue } from "./mapVenues";

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Slug inkl. Index-Suffix → garantiert eindeutig & einfach auflösbar. */
export function venueSlug(v: Venue, i: number): string {
  return `${slugify(v.name) || "venue"}-${i}`;
}

export function findVenueBySlug(slug: string): { v: Venue; i: number } | null {
  const m = slug.match(/-(\d+)$/);
  if (!m) return null;
  const i = Number(m[1]);
  return VENUES[i] ? { v: VENUES[i], i } : null;
}

export function initials(name: string): string {
  return name
    .replace(/[^A-Za-zÀ-ÿ0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}
