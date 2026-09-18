import type { ReactNode } from "react";

/**
 * Flächen-Gerüst: Titel + Lead, optionale Kennzahlen, optionale Kontextspalte.
 * Seite (page): fließt mit. Workspace: füllt die Shell-Höhe.
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
      <p className="t2-label">{label}</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className={compact ? "min-w-0 flex-1" : "t2-fs-display font-semibold tracking-[-0.03em] tabular-nums"}>{children}</div>
        {extra}
      </div>
      {note && <div className="mt-1.5 t2-fs-micro leading-relaxed text-[var(--t2-muted)]">{note}</div>}
    </div>
  );
}

export function T2AsideBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="t2-dash-card">
      <h2 className="t2-section-title">{title}</h2>
      <div className="mt-2 t2-fs-body-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default function Tour2Area({
  title,
  lead,
  status,
  kpis,
  aside,
  children,
  fill,
}: {
  title: string;
  lead?: string;
  status?: ReactNode;
  kpis?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  fill?: boolean;
}) {
  return (
    <div className={`t2-overview ${fill ? "flex min-h-0 flex-1 flex-col max-xl:min-h-min max-xl:flex-none" : ""}`}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t2-display t2-fs-display">{title}</h1>
          {status ? (
            <div className="mt-1.5 max-w-2xl t2-fs-body-sm text-[var(--t2-muted)]">{status}</div>
          ) : lead ? (
            <p className="t2-lead mt-1.5 max-w-xl">{lead}</p>
          ) : null}
        </div>
      </header>
      {kpis && <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{kpis}</div>}
      {aside ? (
        <div className={`mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_260px] ${fill ? "xl:min-h-0 xl:flex-1 xl:grid-rows-1 xl:items-stretch" : ""}`}>
          <div className={`min-w-0 ${fill ? "max-xl:min-h-[520px] xl:flex xl:min-h-0 xl:flex-col" : ""}`}>{children}</div>
          <aside className="space-y-3 xl:w-[260px]">{aside}</aside>
        </div>
      ) : (
        <div className={`mt-5 min-w-0 ${fill ? "flex min-h-0 flex-1 flex-col max-xl:min-h-[520px]" : ""}`}>{children}</div>
      )}
    </div>
  );
}
