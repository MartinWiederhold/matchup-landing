import Link from "next/link";
import MatchupLogo from "./MatchupLogo";
import FooterMatchupLinks from "./FooterMatchupLinks";
import { getT } from "@/lib/i18n/server";

// Instagram-Profil (kanonischer Handle — ohne die Share-Sheet-Tracking-Parameter).
const INSTAGRAM_URL = "https://www.instagram.com/get.matchup/";

export default async function Footer() {
  const t = await getT();

  // „Matchup"-Spalte: Shop ist noch nicht live → öffnet das Waitlist-Modal (wie im Header),
  // statt auf /shop zu führen. Wird von der Client-Komponente FooterMatchupLinks gerendert.
  const matchupCol = {
    title: t("footer.colMatchup"),
    links: [
      { label: t("footer.findPartner"), href: "/find-a-partner" },
      { label: t("footer.shop"), href: "/shop", waitlist: true },
      { label: t("footer.beratung"), href: "/beratung" },
      { label: t("footer.events"), href: "/events" },
      { label: t("footer.about"), href: "/about" },
      { label: t("footer.app"), href: "/app" },
    ],
  };

  const columns = [
    {
      title: t("footer.colLegal"),
      links: [
        { label: t("footer.privacy"), href: "/datenschutz" },
        { label: t("footer.terms"), href: "/agb" },
        { label: t("footer.imprint"), href: "/impressum" },
      ],
    },
    {
      title: t("footer.colFind"),
      links: [
        { label: "Tennis", href: "/tennispartner-finden" },
        { label: "Padel", href: "/padelpartner-finden" },
        { label: "Pickleball", href: "/pickleballpartner-finden" },
      ],
    },
    {
      title: t("footer.colSupport"),
      links: [
        { label: t("footer.helpFaq"), href: "/faq" },
        {
          label: t("footer.contact"),
          href: "mailto:swissflow@bluewin.ch?subject=Matchup%20Support",
        },
        {
          label: t("footer.feedback"),
          href: "mailto:swissflow@bluewin.ch?subject=Matchup%20Feedback",
        },
      ],
    },
  ];

  return (
    <footer className="bg-black px-4 pb-12 pt-20 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <MatchupLogo className="text-3xl" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/60">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Matchup-Spalte (Client): Shop öffnet das Waitlist-Modal statt zu navigieren. */}
          <div>
            <h3 className="text-xs font-bold tracking-[0.18em] text-white/50">
              {matchupCol.title.toUpperCase()}
            </h3>
            <FooterMatchupLinks links={matchupCol.links} />
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold tracking-[0.18em] text-white/50">
                {col.title.toUpperCase()}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.rights")}</p>
          <div className="flex items-center gap-5">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white/60 transition-colors hover:text-white"
            >
              {/* Instagram-Glyph */}
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
              </svg>
            </a>
            <p>{t("footer.region")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
