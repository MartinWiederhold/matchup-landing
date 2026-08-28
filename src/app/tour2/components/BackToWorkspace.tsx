"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

/**
 * Rückweg von einer /tour-Einzelseite zur Arbeitsfläche. Ersetzt die frühere
 * 8-Tab-Navigation (TourNav): die Einzelseiten bleiben als Deep-Links erreichbar,
 * sind aber nicht mehr der Einstieg.
 */
export default function BackToWorkspace({ href = "/tour2" }: { href?: string }) {
  const t = useT();
  return (
    <div className="mt-6">
      <Link href={href} className="inline-flex items-center gap-1.5 t2-fs-body-sm font-semibold text-[var(--t2-accent)] hover:underline">
        ← {t("tour.backToWorkspace")}
      </Link>
    </div>
  );
}
