"use client";

import Link from "next/link";
import { t2markNavStart } from "@/app/tour2/t2mark";

/**
 * Untere Tableiste für /tour2 unter 768px — dasselbe Muster wie /app:
 * schwebende Pille, fester 56px-Slot je Tab, Safe-Area, kein Layout-Zucken.
 */

export type T2Tab = {
  key: string;
  label: string;
  href?: string;
  icon: "overview" | "finder" | "season" | "ranking" | "more";
  badge?: number | null;
};

function Glyph({ name }: { name: T2Tab["icon"] }) {
  const p = { width: 23, height: 23, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "overview") return <svg {...p}><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></svg>;
  if (name === "finder") return <svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.2 4.2" /></svg>;
  if (name === "season") return <svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
  if (name === "ranking") return <svg {...p}><path d="M5 19V10M12 19V5M19 19v-7" /></svg>;
  return <svg {...p}><path d="M5 7h14M5 12h14M5 17h8" /></svg>;
}

export default function Tour2TabBar({
  tabs,
  active,
  compact,
  onMore,
}: {
  tabs: T2Tab[];
  active: string;
  compact?: boolean;
  onMore: () => void;
}) {
  return (
    <div
      className={`t2-tabs pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(14px,env(safe-area-inset-bottom))] md:hidden ${
        compact ? "t2-tabs-compact" : ""
      }`}
    >
      <nav
        className={`pointer-events-auto flex w-full items-center justify-between rounded-full bg-[var(--t2-on-accent)] px-3 py-2.5 shadow-[0_16px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/10 transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          compact ? "max-w-[320px]" : "max-w-[400px]"
        }`}
        aria-label="Tour"
      >
        {tabs.map((tab) => {
          const on = active === tab.key;
          const inner = (
            <>
              <span
                className={`pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-matchup to-indigo-500 shadow-lg transition-all duration-300 ease-out ${
                  on ? "scale-100 opacity-100" : "scale-50 opacity-0"
                }`}
              />
              <span className={`relative ${on ? "text-[var(--t2-on-accent)]" : "text-[var(--t2-text-soft)]"}`}>
                <Glyph name={tab.icon} />
              </span>
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute right-1 top-1 z-10 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[var(--t2-accent)] px-1 t2-fs-meta font-bold text-[var(--t2-on-accent)] ring-2 ring-white">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
            </>
          );
          const slot = "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full";
          if (tab.key === "more") {
            return (
              <button key={tab.key} type="button" aria-label={tab.label} aria-current={on ? "page" : undefined} onClick={onMore} className={slot}>
                {inner}
              </button>
            );
          }
          return (
            <Link key={tab.key} href={tab.href ?? "/tour2"} aria-label={tab.label} aria-current={on ? "page" : undefined} className={slot} onClick={() => t2markNavStart()}>
              {inner}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
