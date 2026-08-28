import BackToWorkspace from "./BackToWorkspace";

/**
 * Rahmen für /tour2-Werkzeugseiten: ruhiger Kopf, Formulare auf Papier.
 */
export default function Tour2Subpage({
  title,
  subtitle,
  children,
  wide,
  hideBack,
  backHref,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
  hideBack?: boolean;
  backHref?: string;
}) {
  return (
    <div className={`mx-auto px-4 py-8 sm:px-6 ${wide ? "max-w-[1800px]" : "max-w-[1280px]"}`}>
      <p className="t2-label">Matchup Tour</p>
      <h1 className="mt-2 t2-fs-h1 font-bold tracking-tight sm:t2-fs-h1">{title}</h1>
      <p className="mt-3 max-w-2xl t2-fs-body leading-relaxed text-[var(--t2-muted)]">{subtitle}</p>
      {!hideBack && <BackToWorkspace href={backHref} />}
      <div className="mt-6 border-t border-[var(--t2-line)] pt-6 text-[var(--t2-ink)]">
        {children}
      </div>
    </div>
  );
}
