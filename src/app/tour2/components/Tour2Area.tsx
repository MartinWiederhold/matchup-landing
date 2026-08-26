import type { ReactNode } from "react";

/**
 * Gemeinsamer Aufbau der sieben Flächen: Titel, eine Zeile Erklärung,
 * Kennzahlen, Hauptinhalt, schmale rechte Kontextspalte.
 */
export default function Tour2Area({
  title,
  lead,
  kpis,
  aside,
  children,
}: {
  title: string;
  lead: string;
  kpis?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8 md:py-12">
      <p className="t2-kicker">Matchup Tour</p>
      <h1 className="t2-display mt-2 text-[clamp(1.75rem,4vw,2.4rem)]">{title}</h1>
      <p className="t2-lead mt-3 max-w-2xl">{lead}</p>
      {kpis && <div className="mt-8">{kpis}</div>}
      <div className={`mt-10 grid gap-10 ${aside ? "lg:grid-cols-[minmax(0,1fr)_16rem]" : ""}`}>
        <div className="min-w-0">{children}</div>
        {aside && (
          <aside className="space-y-8 border-t border-[var(--t2-line)] pt-8 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
            {aside}
          </aside>
        )}
      </div>
    </div>
  );
}
