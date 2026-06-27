import MatchupLogo from "./MatchupLogo";

const COLUMNS = [
  {
    title: "Support",
    links: ["Hilfecenter", "Mitgliedschaft verwalten", "Bestellung verfolgen", "Kontakt"],
  },
  {
    title: "Unternehmen",
    links: ["Über uns", "Karriere", "Presse", "MATCHUP für Unternehmen"],
  },
  {
    title: "Rechtliches",
    links: ["Datenschutz", "AGB", "Cookie-Richtlinie", "Barrierefreiheit"],
  },
  {
    title: "Partner",
    links: ["Affiliate-Programm", "Botschafter", "Mannschaften", "Wiederverkäufer"],
  },
];

export default function Footer() {
  return (
    <footer className="bg-black px-4 pb-12 pt-20 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <MatchupLogo className="text-3xl" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/60">
              Unsere Mission bei MATCHUP ist es, menschliche Leistung und
              Healthspan zu entfalten.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold tracking-[0.18em] text-white/50">
                {col.title.toUpperCase()}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {2026} MATCHUP, Inc. Alle Rechte vorbehalten. (Klon zu Demozwecken)</p>
          <p>Schweiz (Deutsch)</p>
        </div>
      </div>
    </footer>
  );
}
