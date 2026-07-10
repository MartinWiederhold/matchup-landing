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
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const tabs: { key: Sub; label: string }[] = [
    { key: "matches", label: t("matches.tabMatches") },
    { key: "groups", label: t("matches.tabGroups") },
    { key: "feed", label: t("matches.tabFeed") },
  ];

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl">
        {/* Kopf: Titel + Suche */}
        <header className="flex items-center justify-between px-5 pb-1 pt-3">
          <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-900">Chat</h1>
          <button
            type="button"
            onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setQuery(""); }}
            aria-label={t("discover.filter")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.04] text-neutral-700 ring-1 ring-black/10"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
          </button>
        </header>

        {searchOpen && (
          <div className="px-5 pb-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("matches.searchPlaceholder")}
              className="w-full rounded-full bg-black/[0.05] px-4 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
            />
          </div>
        )}

        {/* Reiter */}
        <div className="flex border-b border-black/10">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              type="button"
              onClick={() => setSub(tb.key)}
              className={`flex-1 border-b-2 py-3 text-sm font-semibold transition-colors ${
                sub === tb.key ? "border-matchup text-neutral-900" : "border-transparent text-neutral-400"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {sub === "matches" && <MatchesList search={query} />}
        {sub === "groups" && <GroupsList />}
        {sub === "feed" && <CommunityFeed />}
      </div>
    </div>
  );
}
