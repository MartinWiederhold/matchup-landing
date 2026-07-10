"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import MatchesList from "./MatchesList";
import GroupsList from "./GroupsList";
import CommunityFeed from "./CommunityFeed";

type Sub = "matches" | "groups" | "feed";

export default function MatchesTab() {
  const t = useT();
  const [sub, setSub] = useState<Sub>("matches");

  const tabs: { key: Sub; label: string }[] = [
    { key: "matches", label: t("matches.tabMatches") },
    { key: "groups", label: t("matches.tabGroups") },
    { key: "feed", label: t("matches.tabFeed") },
  ];

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 flex shrink-0 border-b border-black/10 bg-white/80 backdrop-blur-xl">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSub(t.key)}
            className={`flex-1 border-b-2 py-3.5 text-sm font-semibold transition-colors ${
              sub === t.key
                ? "border-matchup text-neutral-900"
                : "border-transparent text-neutral-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>
        {sub === "matches" && <MatchesList />}
        {sub === "groups" && <GroupsList />}
        {sub === "feed" && <CommunityFeed />}
      </div>
    </div>
  );
}
