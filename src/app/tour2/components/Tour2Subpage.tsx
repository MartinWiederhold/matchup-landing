import BackToWorkspace from "./BackToWorkspace";

/**
 * Rahmen für /tour2-Werkzeugseiten: ruhiger Kopf, Formulare auf Papier.
 */
export default function Tour2Subpage({
  title,
  subtitle,
  children,
  wide,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`mx-auto px-4 py-8 pb-28 sm:px-6 ${wide ? "max-w-[1800px]" : "max-w-[1280px]"}`}>
      <p className="t2-kicker">Matchup Tour</p>
      <h1 className="mt-2 text-[1.75rem] font-bold tracking-tight sm:text-[2rem]">{title}</h1>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--t2-muted)]">{subtitle}</p>
      <BackToWorkspace />
      <div className="mt-6 border-t border-[var(--t2-line)] pt-6 text-[var(--t2-ink)]">
        {children}
      </div>
    </div>
  );
}
