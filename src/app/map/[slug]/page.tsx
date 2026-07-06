import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  type Venue,
  VENUE_SELECT,
  SPORT_COLOR,
  SPORT_LABEL,
  CAT_LABEL,
  WEEKDAYS,
  initials,
  primarySport,
} from "@/lib/venuesDb";

export const dynamic = "force-dynamic";

async function getVenue(slug: string): Promise<Venue | null> {
  const { data } = await supabase
    .from("venues")
    .select(VENUE_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  return (data as Venue | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVenue(slug);
  return {
    title: v ? `${v.name} – Matchup Map` : "Matchup Map",
    robots: { index: false, follow: false },
  };
}

const AMENITY_LABEL: Record<string, string> = {
  restaurant: "Restaurant / Bar",
  showers: "Duschen",
  parking: "Parkplatz",
  proshop: "Pro-Shop",
  ballmachine: "Ballmaschine",
  coaching: "Trainer / Schule",
  wallball: "Trainingswand",
  transit: "ÖV-Anbindung",
};

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const v = await getVenue(slug);
  if (!v) notFound();
  const color = SPORT_COLOR[primarySport(v)] ?? SPORT_COLOR.tennis;

  const facts: { label: string; value: string }[] = [];
  const courts =
    (v.courts_indoor ?? 0) + (v.courts_outdoor ?? 0) || null;
  if (courts)
    facts.push({
      label: "Plätze",
      value: [
        v.courts_indoor ? `${v.courts_indoor} Indoor` : "",
        v.courts_outdoor ? `${v.courts_outdoor} Outdoor` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    });
  if (v.surfaces?.length) facts.push({ label: "Belag", value: v.surfaces.join(", ") });
  if (v.floodlight != null)
    facts.push({ label: "Flutlicht", value: v.floodlight ? "Ja" : "Nein" });
  if (v.member_count) facts.push({ label: "Mitglieder", value: String(v.member_count) });
  if (v.founded) facts.push({ label: "Gegründet", value: String(v.founded) });
  if (v.guest_access != null)
    facts.push({ label: "Gäste", value: v.guest_access ? "Willkommen" : "Nur Mitglieder" });
  if (v.guest_fee) facts.push({ label: "Gastgebühr", value: v.guest_fee });
  if (v.court_price) facts.push({ label: "Platzmiete", value: v.court_price });
  if (v.membership_fee) facts.push({ label: "Mitgliedschaft", value: v.membership_fee });
  if (v.season) facts.push({ label: "Saison", value: v.season });

  return (
    <div className="min-h-dvh bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-xl">
        <a href="/map" className="text-sm text-white/50 hover:text-white">
          ← Zurück zur Karte
        </a>

        <div className="mt-6 flex items-center gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-lg font-extrabold text-black"
            style={{ border: `3px solid ${color}` }}
          >
            {v.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(v.name)
            )}
          </span>
          <div>
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: color, color: "#fff" }}
            >
              {v.sports.map((s) => SPORT_LABEL[s] ?? s).join(" · ")}
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{v.name}</h1>
            <p className="text-sm text-white/50">
              {CAT_LABEL[v.category] ?? v.category}
              {v.city ? ` · ${v.city}` : ""}
              {v.verified ? " · ✓ verifiziert" : ""}
            </p>
          </div>
        </div>

        {v.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.cover_url} alt="" className="mt-5 h-48 w-full rounded-2xl object-cover" />
        )}

        {v.description && (
          <p className="mt-5 text-sm leading-relaxed text-white/75">{v.description}</p>
        )}

        {facts.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            {facts.map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between border-b border-white/5 px-4 py-3 text-sm last:border-0"
              >
                <span className="text-white/50">{f.label}</span>
                <span className="text-right font-semibold">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {v.opening_hours && Object.keys(v.opening_hours).length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">
              Öffnungszeiten
            </h2>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {WEEKDAYS.map((d) => (
                <div
                  key={d.key}
                  className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 text-sm last:border-0"
                >
                  <span className="text-white/50">{d.label}</span>
                  <span className="font-medium">
                    {v.opening_hours?.[d.key] || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {v.amenities?.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">
              Ausstattung
            </h2>
            <div className="flex flex-wrap gap-2">
              {v.amenities.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                >
                  {AMENITY_LABEL[a] ?? a}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {v.booking_url && (
            <a
              href={v.booking_url}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center rounded-full bg-matchup py-3 text-sm font-bold text-white hover:bg-matchup-hover"
            >
              Platz buchen →
            </a>
          )}
          {v.website && (
            <a
              href={v.website}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center rounded-full border border-white/15 py-3 text-sm font-semibold text-white/90 hover:bg-white/5"
            >
              Website öffnen
            </a>
          )}
          <div className="flex gap-3">
            {v.phone && (
              <a
                href={`tel:${v.phone}`}
                className="flex flex-1 items-center justify-center rounded-full border border-white/15 py-3 text-sm font-semibold text-white/90 hover:bg-white/5"
              >
                Anrufen
              </a>
            )}
            {v.lat != null && v.lng != null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center rounded-full border border-white/15 py-3 text-sm font-semibold text-white/90 hover:bg-white/5"
              >
                Google Maps
              </a>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">Matchup Map</p>
      </div>
    </div>
  );
}
