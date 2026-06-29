import MatchupLogo from "./MatchupLogo";
import { getT } from "@/lib/i18n/server";

export default async function Footer() {
  const t = await getT();

  const columns = [
    {
      title: t("footer.colMatchup"),
      links: [
        { label: t("footer.findPartner"), href: "/find-a-partner" },
        { label: t("footer.shop"), href: "/shop" },
        { label: t("footer.beratung"), href: "/beratung" },
        { label: t("footer.events"), href: "/events" },
        { label: t("footer.app"), href: "/app" },
      ],
    },
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
        { label: t("footer.contact"), href: "mailto:hello@matchup.ch" },
        { label: t("footer.feedback"), href: "#" },
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

          {columns.map((col) => (
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
          <p>{t("footer.rights")}</p>
          <p>{t("footer.region")}</p>
        </div>
      </div>
    </footer>
  );
}
