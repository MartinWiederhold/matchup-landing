"use client";

import { useState } from "react";
import MatchesList from "./MatchesList";
import GroupsList from "./GroupsList";
import CommunityFeed from "./CommunityFeed";

type Sub = "matches" | "groups" | "feed";

export default function MatchesTab() {
  const [sub, setSub] = useState<Sub>("matches");

  const tabs: { key: Sub; label: string }[] = [
    { key: "matches", label: "Matches" },
    { key: "groups", label: "Gruppen" },
    { key: "feed", label: "Feed" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 border-b border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSub(t.key)}
            className={`flex-1 border-b-2 py-3.5 text-sm font-semibold transition-colors ${
              sub === t.key
                ? "border-matchup text-white"
                : "border-transparent text-zinc-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {sub === "matches" && <MatchesList />}
        {sub === "groups" && <GroupsList />}
        {sub === "feed" && <CommunityFeed />}
      </div>
    </div>
  );
}
