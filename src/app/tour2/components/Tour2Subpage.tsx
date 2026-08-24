import BackToWorkspace from "./BackToWorkspace";

/**
 * Rahmen für /tour2-Werkzeugseiten: dunkler Kopf (lesbar auf dem Shell),
 * Inhalt in heller Fläche — die kopierten Formulare bleiben bedienbar,
 * ohne jedes View-File umzufärben.
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
    <div className={`mx-auto px-4 py-6 pb-28 sm:px-6 ${wide ? "max-w-[1800px]" : "max-w-[1280px]"}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">Matchup Tour</p>
      <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[34px]">{title}</h1>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-neutral-400">{subtitle}</p>
      <BackToWorkspace />
      <div className="mt-6 overflow-hidden border border-white/10 bg-white p-4 text-black sm:p-6">
        {children}
      </div>
    </div>
  );
}
