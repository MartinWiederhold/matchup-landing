import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import BackToWorkspace from "../components/BackToWorkspace";
import SchengenView from "./components/SchengenView";

// Server Component (Standard). Kein "— Matchup"-Suffix — das Root-Layout hängt es an.
// Das bestehende src/app/tour/layout.tsx (AuthProvider) umschließt diese Route mit.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.schengenSeoTitle"),
    description: t("tour.schengenSeoDescription"),
    alternates: { canonical: "/tour/schengen" },
    // Interner, login-pflichtiger Bereich → nicht indexieren.
    robots: { index: false, follow: false },
  };
}

export default async function SchengenPage() {
  const t = await getT();
  return (
    <main className="mx-auto max-w-[1000px] px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-matchup">Matchup Tour</p>
      <h1 className="mt-3 text-[32px] font-extrabold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl">
        {t("tour.schengenTitle")}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-500">{t("tour.schengenSubtitle")}</p>

      <BackToWorkspace />

      {/* Auth-Gate + Daten laufen client-seitig (Session liegt im Browser). */}
      <SchengenView />
    </main>
  );
}
