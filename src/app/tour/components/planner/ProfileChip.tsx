"use client";

import { useT } from "@/lib/i18n";
import type { PlannerProfile } from "@/lib/tourPlanner";

/**
 * Profil-Chip oben rechts. Erscheint, sobald Schritt 1 ausgefüllt ist
 * (Wohnort gesetzt). Zeigt Name, Ranking, Wohnort.
 */
export default function ProfileChip({ profile }: { profile: PlannerProfile }) {
  const t = useT();
  const parts = [
    profile.ranking != null ? t("tour.plChipRank", { n: profile.ranking }) : null,
    profile.city ?? null,
  ].filter(Boolean);
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-black/5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-matchup text-[11px] font-bold text-white">
        {(profile.firstName ?? "?").slice(0, 1).toUpperCase()}
      </span>
      <span className="text-[13px] font-bold text-neutral-900">{profile.firstName ?? "—"}</span>
      {parts.length > 0 && <span className="text-[12px] text-neutral-400">· {parts.join(" · ")}</span>}
    </div>
  );
}
