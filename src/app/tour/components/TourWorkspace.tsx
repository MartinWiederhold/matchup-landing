"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { useTourWorkspace } from "./useTourWorkspace";
import SetupPanel from "./setup/SetupPanel";
import NextDeadline from "./sections/NextDeadline";
import SeasonOverview from "./sections/SeasonOverview";
import SeasonList from "./sections/SeasonList";
import MapPreview from "./sections/MapPreview";
import RareStuff from "./sections/RareStuff";

// Merker fürs Überspringen — bewusst NUR localStorage: die Entscheidung gilt für dieses
// Gerät und diesen Browser. Wer am Laptop überspringt, sieht den Trichter am Handy wieder.
// Für den Anfang in Ordnung; dokumentiert, damit es eine bewusste Grenze bleibt.
const SKIP_KEY = "mu_tour_setup_skipped";

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

  // Skip-Merker erst nach dem Mounten aus localStorage lesen (kein Hydration-Mismatch).
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem(SKIP_KEY) === "1") setSkipped(true); } catch { /* egal */ }
  }, []);

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

  // Einrichtung unvollständig und (auf diesem Gerät) nicht übersprungen → geführter Einstieg
  // statt Arbeitsfläche. Ausstieg merkt sich das Überspringen und lädt die Fläche frisch.
  if (!data.setup.complete && !skipped) {
    return (
      <SetupPanel
        onExit={() => {
          try { localStorage.setItem(SKIP_KEY, "1"); } catch { /* egal */ }
          setSkipped(true);
          reload();
        }}
      />
    );
  }

  // Leere Saison (z. B. Einrichtung übersprungen) → Hinweis + Verweis auf den Turnierkalender.
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
    <>
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
    {/* Re-Entry: die Einrichtung (drei Schritte) ist jederzeit wieder aufrufbar. */}
    <div className="mt-6">
      <Link href="/tour/setup" className="text-[12px] font-semibold text-neutral-400 transition-colors hover:text-neutral-700">
        {t("tour.wsEditSetup")}
      </Link>
    </div>
    </>
  );
}
