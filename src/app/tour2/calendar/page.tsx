import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { EYEBROW } from "@/app/tour2/components/tourUi";
import BackToWorkspace from "../components/BackToWorkspace";
import CalendarWeek from "./components/CalendarWeek";

// Server Component (Standard). Vollbreiter, randarmer Rahmen — der Wochenkalender nutzt die
// Breite. Das tour/layout.tsx (AuthProvider) umschließt diese Route mit.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.calSeoTitle"),
    description: t("tour.calSeoDescription"),
    alternates: { canonical: "/tour2/calendar" },
    robots: { index: false, follow: false },
  };
}

export default async function CalendarPage() {
  const t = await getT();
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
      <p className={EYEBROW}>Matchup Tour</p>
      <h1 className="mt-3 text-[28px] font-extrabold leading-[1.05] tracking-tight text-neutral-900 sm:text-4xl">{t("tour.calTitle")}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-neutral-500">{t("tour.calSubtitle")}</p>
      <BackToWorkspace />
      <CalendarWeek />
    </main>
  );
}
