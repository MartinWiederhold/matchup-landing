"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

/**
 * Schlichte Navigation zwischen den /tour-Seiten. Eigene Adressen statt Tabs,
 * damit sie am Laptop merk- und teilbar sind. Die aktuelle Seite ist über
 * `usePathname()` erkennbar (Akzentfarbe + aria-current).
 */
export default function TourNav() {
  const t = useT();
  const path = usePathname();
  const isSeason = path?.startsWith("/tour/season") ?? false;
  const isCosts = path?.startsWith("/tour/costs") ?? false;
  const isExpenses = path?.startsWith("/tour/expenses") ?? false;
  const isCalendar = !isSeason && !isCosts && !isExpenses; // /tour selbst

  const cls = (active: boolean) =>
    `text-[13px] font-semibold transition-colors ${active ? "text-matchup" : "text-neutral-500 hover:text-neutral-800"}`;

  return (
    <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-black/[0.08] pb-3">
      <Link href="/tour" className={cls(isCalendar)} aria-current={isCalendar ? "page" : undefined}>
        {t("tour.navCalendar")}
      </Link>
      <Link href="/tour/season" className={cls(isSeason)} aria-current={isSeason ? "page" : undefined}>
        {t("tour.navSeason")}
      </Link>
      <Link href="/tour/costs" className={cls(isCosts)} aria-current={isCosts ? "page" : undefined}>
        {t("tour.navCosts")}
      </Link>
      <Link href="/tour/expenses" className={cls(isExpenses)} aria-current={isExpenses ? "page" : undefined}>
        {t("tour.navExpenses")}
      </Link>
    </nav>
  );
}
