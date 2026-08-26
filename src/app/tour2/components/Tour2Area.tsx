import type { ReactNode } from "react";

/**
 * Dashboard-Gerüst der sieben Flächen — wie Overview: Titel, Kennzahlen-Karten,
 * Hauptspalte, rechte Kontextspalte 260px.
 */

export function T2Kpi({
  label,
  children,
  note,
  extra,
  compact,
}: {
  label: string;
  children: ReactNode;
  note?: ReactNode;
  extra?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="t2-dash-card">
      <p className="t2-kicker">{label}</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className={compact ? "min-w-0 flex-1" : "text-[clamp(1.45rem,3vw,1.95rem)] font-semibold tracking-[-0.03em] tabular-nums"}>{children}</div>
        {extra}
      </div>
      {note && <div className="mt-1.5 text-[12px] leading-relaxed text-[var(--t2-muted)]">{note}</div>}
    </div>
  );
}

export function T2AsideBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="t2-dash-card">
      <h2 className="t2-kicker">{title}</h2>
      <div className="mt-2 text-[13px] leading-relaxed">{children}</div>
    </section>
  );
}

export default function Tour2Area({
  title,
  lead,
  kpis,
  aside,
  children,
  fill,
}: {
  title: string;
  lead: string;
  kpis?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  fill?: boolean;
}) {
  return (
    <div className={`t2-overview ${fill ? "flex min-h-0 flex-1 flex-col" : ""}`}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t2-display text-[clamp(1.7rem,3.4vw,2.15rem)]">{title}</h1>
          <p className="t2-lead mt-1.5 max-w-xl">{lead}</p>
        </div>
      </header>
      {kpis && <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{kpis}</div>}
      <div className={`mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_260px] ${fill ? "min-h-0 flex-1" : ""}`}>
        <div className={`min-w-0 ${fill ? "flex min-h-0 flex-col" : ""}`}>{children}</div>
        {aside && <aside className="space-y-3 xl:w-[260px]">{aside}</aside>}
      </div>
    </div>
  );
}
