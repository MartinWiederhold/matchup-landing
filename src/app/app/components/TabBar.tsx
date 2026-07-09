"use client";

import type { TabKey } from "./appNav";

export type TabDef = {
  key: TabKey;
  label: string;
  icon: string; // SVG path
};

/**
 * Schwebende, abgesetzte Tab-Bar im Premium-Stil.
 * - rundes, dunkles Pill mit Glas-Effekt, leicht über dem unteren Rand
 * - aktives Item: Indikator oben + Highlight + sanfte Skalierung
 * - blendet beim Runterscrollen weich aus, beim Hochscrollen wieder ein
 */
export default function TabBar({
  tabs,
  active,
  onSelect,
  badges,
  hidden,
}: {
  tabs: TabDef[];
  active: TabKey;
  onSelect: (k: TabKey) => void;
  badges: Partial<Record<TabKey, number>>;
  hidden: boolean;
}) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(14px,env(safe-area-inset-bottom))] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        hidden
          ? "translate-y-[160%] opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <nav className="pointer-events-auto flex items-center gap-1 rounded-[26px] bg-zinc-900/85 p-1.5 shadow-[0_16px_50px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10 backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const badge = badges[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              aria-label={tab.label}
              onClick={() => onSelect(tab.key)}
              className={`relative flex h-12 w-12 items-center justify-center rounded-[18px] transition-colors duration-300 ${
                isActive ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              {/* Indikator oben */}
              <span
                className={`absolute -top-1.5 left-1/2 h-1 -translate-x-1/2 rounded-full bg-white transition-all duration-300 ${
                  isActive ? "w-6 opacity-100" : "w-0 opacity-0"
                }`}
              />
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-all duration-300 ${
                  isActive
                    ? "scale-110 text-white"
                    : "scale-100 text-zinc-500"
                }`}
              >
                <path d={tab.icon} />
              </svg>
              {badge > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-matchup px-1 text-[10px] font-bold text-white ring-2 ring-zinc-900">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
