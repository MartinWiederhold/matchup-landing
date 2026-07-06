import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VENUES } from "@/lib/mapVenues";
import { venueSlug, findVenueBySlug, initials } from "@/lib/venueUtils";

const SPORT_COLOR: Record<string, string> = {
  tennis: "#4b3bf3",
  padel: "#10b981",
  pickleball: "#f59e0b",
};
const SPORT_LABEL: Record<string, string> = {
  tennis: "Tennis",
  padel: "Padel",
  pickleball: "Pickleball",
};
const CAT_LABEL: Record<string, string> = {
  club: "Club",
  public: "Öffentlich",
  private: "Privat",
  hotel: "Hotel",
};

export const dynamicParams = false;

export function generateStaticParams() {
  return VENUES.map((v, i) => ({ slug: venueSlug(v, i) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hit = findVenueBySlug(slug);
  return {
    title: hit ? `${hit.v.name} – Matchup Map` : "Matchup Map",
    robots: { index: false, follow: false },
  };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hit = findVenueBySlug(slug);
  if (!hit) notFound();
  const { v } = hit;
  const color = SPORT_COLOR[v.sport];

  const rows: { label: string; value: string }[] = [
    { label: "Sportart", value: SPORT_LABEL[v.sport] },
    { label: "Typ", value: CAT_LABEL[v.category] },
    ...(v.city ? [{ label: "Ort", value: v.city }] : []),
    { label: "Koordinaten", value: `${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}` },
  ];

  return (
    <div className="min-h-dvh bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-xl">
        <a href="/map" className="text-sm text-white/50 hover:text-white">
          ← Zurück zur Karte
        </a>

        <div className="mt-6 flex items-center gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-lg font-extrabold text-black"
            style={{ border: `3px solid ${color}` }}
          >
            {initials(v.name)}
          </span>
          <div>
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: color, color: "#fff" }}
            >
              {SPORT_LABEL[v.sport]}
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{v.name}</h1>
            <p className="text-sm text-white/50">
              {CAT_LABEL[v.category]}
              {v.city ? ` · ${v.city}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between border-b border-white/5 px-4 py-3 text-sm last:border-0"
            >
              <span className="text-white/50">{r.label}</span>
              <span className="font-semibold">{r.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {v.website && (
            <a
              href={v.website}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center rounded-full bg-matchup py-3 text-sm font-bold text-white hover:bg-matchup-hover"
            >
              Website öffnen →
            </a>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center rounded-full border border-white/15 py-3 text-sm font-semibold text-white/90 hover:bg-white/5"
          >
            In Google Maps öffnen
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Daten aus OpenStreetMap · Matchup Map (Vorschau)
        </p>
      </div>
    </div>
  );
}
