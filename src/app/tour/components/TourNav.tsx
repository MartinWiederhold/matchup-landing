"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n";

/**
 * Navigation zwischen den /tour-Seiten. Eigene Adressen statt Tabs, damit sie am
 * Laptop merk- und teilbar sind. Die aktuelle Seite ist über `usePathname()`
 * erkennbar (Akzentfarbe + aria-current).
 *
 * Auf dem Handy EINZEILIG horizontal scrollbar (kein Umbruch auf zwei Zeilen —
 * das kostet vertikalen Platz und wirkt wie eine untergeordnete Ebene, obwohl alle
 * Einträge gleichrangig sind). Scrollbalken versteckt, Wischen funktioniert. Beim
 * Laden wird die aktive Seite nach links gescrollt, falls sie weiter rechts liegt.
 */
export default function TourNav() {
  const t = useT();
  const path = usePathname() ?? "";
  const navRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Unterrouten; /tour (Turnierkalender) ist aktiv, wenn keine davon passt.
  const SUB = ["/tour/season", "/tour/costs", "/tour/expenses", "/tour/schengen", "/tour/calendar", "/tour/map", "/tour/points"];
  const items = [
    { href: "/tour", label: t("tour.navCalendar"), active: !SUB.some((p) => path.startsWith(p)) },
    { href: "/tour/season", label: t("tour.navSeason"), active: path.startsWith("/tour/season") },
    { href: "/tour/costs", label: t("tour.navCosts"), active: path.startsWith("/tour/costs") },
    { href: "/tour/expenses", label: t("tour.navExpenses"), active: path.startsWith("/tour/expenses") },
    { href: "/tour/schengen", label: t("tour.navSchengen"), active: path.startsWith("/tour/schengen") },
    { href: "/tour/calendar", label: t("tour.navEvents"), active: path.startsWith("/tour/calendar") },
    { href: "/tour/map", label: t("tour.navMap"), active: path.startsWith("/tour/map") },
    { href: "/tour/points", label: t("tour.navPoints"), active: path.startsWith("/tour/points") },
  ];

  // Aktive Seite sichtbar machen — nur horizontal (kein vertikaler Seiten-Sprung).
  useEffect(() => {
    const nav = navRef.current;
    const act = activeRef.current;
    if (!nav || !act) return;
    const delta = act.getBoundingClientRect().left - nav.getBoundingClientRect().left;
    nav.scrollLeft += delta - 16; // aktive Seite ~16px vom linken Rand
  }, [path]);

  return (
    <nav
      ref={navRef}
      className="mt-6 flex gap-6 overflow-x-auto whitespace-nowrap border-b border-black/[0.08] pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          ref={it.active ? activeRef : undefined}
          aria-current={it.active ? "page" : undefined}
          className={`shrink-0 text-[13px] font-semibold transition-colors ${it.active ? "text-matchup" : "text-neutral-500 hover:text-neutral-800"}`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
