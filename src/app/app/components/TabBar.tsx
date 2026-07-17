"use client";

import type { TabKey } from "./appNav";

export type TabDef = {
  key: TabKey;
  label: string;
  icon: string; // SVG path
};

/**
 * Schwebende, abgesetzte Tab-Bar im Premium-Stil.
 * - rundes, weisses Pill, leicht über dem unteren Rand
 * - aktives Item: gefüllter Gradient-Kreis
 * - beim Runterscrollen zieht sich die Bar leicht zusammen (schmaler)
 *
 * Wichtig gegen „Zucken": Der aktive Zustand animiert NUR transform/opacity
 * (GPU-kompositiert), niemals width/height oder die SVG-Grösse — Layout-
 * Animationen lösen pro Frame ein Reflow aus und wirken wie ein Vibrieren.
 * Jeder Tab sitzt zudem in einem festen 56px-Slot, damit die Nachbarn beim
 * Wechsel nicht verrutschen.
 */
export default function TabBar({
  tabs,
  active,
  onSelect,
  badges,
  hidden,
  compact,
  center,
}: {
  tabs: TabDef[];
  active: TabKey;
  onSelect: (k: TabKey) => void;
  badges: Partial<Record<TabKey, number>>;
  hidden: boolean;
  compact?: boolean;
  center?: { icon: string; label: string; onClick: () => void };
}) {
  const mid = center ? Math.ceil(tabs.length / 2) : tabs.length;
  const leftTabs = tabs.slice(0, mid);
  const rightTabs = center ? tabs.slice(mid) : [];

  const renderTab = (tab: TabDef) => {
    const isActive = active === tab.key;
    const badge = badges[tab.key] ?? 0;
    return (
      <div key={tab.key} className="flex h-14 w-14 shrink-0 items-center justify-center">
        <button
          type="button"
          aria-label={tab.label}
          onClick={() => onSelect(tab.key)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full"
        >
          {/* Gefüllter Kreis — nur Scale/Opacity animiert, kein Layout. */}
          <span
            className={`pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-matchup to-indigo-500 shadow-lg transition-all duration-300 ease-out ${
              isActive ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          />
          <svg
            className={`relative transition-colors duration-300 ${isActive ? "text-white" : "text-neutral-400"}`}
            width={23}
            height={23}
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
            <span className="absolute right-1 top-1 z-10 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-matchup px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </button>
      </div>
    );
  };

  // Beim Runterscrollen leicht schmaler (kleinere Lücken zwischen den Icons).
  const navWidth = compact ? "max-w-[320px]" : "max-w-[400px]";

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(14px,env(safe-area-inset-bottom))] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        hidden ? "translate-y-[160%] opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <nav
        className={`pointer-events-auto flex w-full items-center justify-between rounded-full bg-white px-3 py-2.5 shadow-[0_16px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/10 transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${navWidth}`}
      >
        {center ? (
          <>
            {leftTabs.map(renderTab)}
            <button
              type="button"
              aria-label={center.label}
              onClick={center.onClick}
              className="-mt-8 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-matchup to-indigo-500 text-white shadow-[0_8px_24px_-4px_rgba(107,92,231,0.6)] ring-4 ring-white"
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={center.icon} />
              </svg>
            </button>
            {rightTabs.map(renderTab)}
          </>
        ) : (
          tabs.map(renderTab)
        )}
      </nav>
    </div>
  );
}
