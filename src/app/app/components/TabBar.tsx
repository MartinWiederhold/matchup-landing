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
      <nav className="pointer-events-auto flex w-full max-w-[400px] items-center justify-between rounded-full bg-white px-3 py-2.5 shadow-[0_16px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/10">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const badge = badges[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              aria-label={tab.label}
              onClick={() => onSelect(tab.key)}
              className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                isActive
                  ? "h-14 w-14 bg-gradient-to-br from-matchup to-indigo-500 text-white shadow-lg"
                  : "h-12 w-12 text-neutral-400"
              }`}
            >
              <svg
                width={isActive ? 22 : 23}
                height={isActive ? 22 : 23}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={tab.icon} />
              </svg>
              {badge > 0 && (
                <span className="absolute right-0 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-matchup px-1 text-[10px] font-bold text-white ring-2 ring-white">
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
