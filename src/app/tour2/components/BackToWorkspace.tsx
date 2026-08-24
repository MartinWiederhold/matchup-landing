"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

/**
 * Rückweg von einer /tour-Einzelseite zur Arbeitsfläche. Ersetzt die frühere
 * 8-Tab-Navigation (TourNav): die Einzelseiten bleiben als Deep-Links erreichbar,
 * sind aber nicht mehr der Einstieg.
 */
export default function BackToWorkspace() {
  const t = useT();
  return (
    <div className="mt-6">
      <Link href="/tour2/planner" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-matchup hover:underline">
        ← {t("tour.backToWorkspace")}
      </Link>
    </div>
  );
}
