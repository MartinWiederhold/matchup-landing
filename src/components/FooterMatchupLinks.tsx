"use client";

import Link from "next/link";
import { useState } from "react";
import WaitlistModal from "./WaitlistModal";

/**
 * Die „Matchup"-Spalte der Fußzeile als Client-Komponente: Links, die noch nicht live sind
 * (z. B. Shop), öffnen dasselbe Waitlist-Modal wie im Header — statt auf die Seite zu führen.
 * Der geheime Code im Modal (50805080) leitet weiter auf `href`. Alle Texte kommen als Props
 * (server-seitig übersetzt), damit die Fußzeile im Übrigen Server-Component bleibt.
 */
type FooterLink = { label: string; href: string; waitlist?: boolean };

export default function FooterMatchupLinks({ links }: { links: FooterLink[] }) {
  const [waitlist, setWaitlist] = useState<FooterLink | null>(null);
  const cls = "text-sm text-white/80 transition-colors hover:text-white";

  return (
    <>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            {link.waitlist ? (
              <button type="button" onClick={() => setWaitlist(link)} className={`${cls} text-left`}>
                {link.label}
              </button>
            ) : (
              <Link href={link.href} className={cls}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>

      <WaitlistModal
        open={waitlist !== null}
        feature={waitlist?.label ?? ""}
        secretHref={waitlist?.href ?? "/"}
        onClose={() => setWaitlist(null)}
      />
    </>
  );
}
