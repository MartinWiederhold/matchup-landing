"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { useTourWorkspace } from "./useTourWorkspace";
import NextDeadline from "./sections/NextDeadline";
import SeasonOverview from "./sections/SeasonOverview";
import SeasonList from "./sections/SeasonList";
import MapPreview from "./sections/MapPreview";
import RareStuff from "./sections/RareStuff";

/**
 * Die EINE Arbeitsfläche unter /tour. EIN Auth-Gate, EIN gebündelter Load
 * (useTourWorkspace), danach das Dashboard von oben nach unten:
 *   nächste Meldefrist → Saisonüberblick → (Handy: Karte) → Saison-Liste → Selteneres.
 * Am Laptop liegt die Karte in einer schmaleren zweiten Spalte rechts oben.
 *
 * Der geführte Einrichtungs-Trichter (drei Schritte) folgt in Schritt 2; bis dahin
 * zeigt eine leere Saison einen Hinweis mit Verweis auf den Turnierkalender.
 */
export default function TourWorkspace() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();

  // Stichtag = heute, einmal beim Mounten erzeugt (lokaler Kalendertag).
  const [asOf] = useState(() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });
  const { status, data, reload } = useTourWorkspace(user?.id ?? null, asOf);

  if (authLoading) return <p className="mt-10 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className="mt-10 rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-6 inline-flex rounded-full bg-matchup px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover">
          {t("tour.loginCta")}
        </Link>
      </div>
    );
  }
  if (status === "loading") return <p className="mt-8 text-sm text-neutral-500">{t("tour.loading")}</p>;
  if (status === "error" || !data) return <p className="mt-8 text-sm text-neutral-500">{t("tour.loadError")}</p>;

  // Leere Saison → Hinweis + Verweis auf den Turnierkalender (Setup-Trichter folgt in Schritt 2).
  if (data.entries.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.wsEmptyTitle")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{t("tour.wsEmptyText")}</p>
        <Link href="/tour/browse" className="mt-6 inline-flex rounded-full bg-matchup px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover">
          {t("tour.wsEmptyCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {/* Hauptspalte */}
      <div className="space-y-6">
        <NextDeadline entries={data.entries} />
        <SeasonOverview data={data} />
        {/* Handy: Karte direkt unter dem Überblick (das Erste, was man sieht). */}
        <div className="lg:hidden"><MapPreview entries={data.entries} /></div>
        <SeasonList data={data} onChanged={reload} />
        <RareStuff />
      </div>
      {/* Laptop: schmalere zweite Spalte rechts oben mit der Kartenvorschau. */}
      <div className="hidden lg:block">
        <MapPreview entries={data.entries} />
      </div>
    </div>
  );
}
