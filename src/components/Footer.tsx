import MatchupLogo from "./MatchupLogo";

const COLUMNS = [
  {
    title: "Matchup",
    links: [
      { label: "Find a Partner", href: "/find-a-partner" },
      { label: "Shop", href: "/shop" },
      { label: "Beratung", href: "/beratung" },
      { label: "Events", href: "/events" },
      { label: "App", href: "/app" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "AGB", href: "/agb" },
      { label: "Impressum", href: "/impressum" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Hilfe & FAQ", href: "/faq" },
      { label: "Kontakt", href: "mailto:hello@matchup.ch" },
      { label: "Feedback", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-black px-4 pb-12 pt-20 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <MatchupLogo className="text-3xl" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/60">
              Matchup verbindet Spieler für Tennis, Padel und Pickleball. Matche,
              chatte und organisiere Spiele in deiner Nähe.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold tracking-[0.18em] text-white/50">
                {col.title.toUpperCase()}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Matchup. Alle Rechte vorbehalten.</p>
          <p>Schweiz (Deutsch)</p>
        </div>
      </div>
    </footer>
  );
}
