"use client";

/**
 * Besucher-Hülle — gleiches Raster wie /tour2 (Leiste, Tabs, Bleed),
 * aber nur Besucher-Ziele. Kein Saison-Profil, kein Wettkampf-Mehr.
 */

import { useEffect, useState, type ReactNode, type UIEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT, useLocale, type Locale } from "@/lib/i18n";
import Tour2TabBar, { type T2Tab } from "@/app/tour2/components/shell/Tour2TabBar";

const PRIMARY = [
  { key: "overview", href: "/tournaments", match: (p: string) => p === "/tournaments", label: "navGrounds" as const },
  { key: "finder", href: "/tournaments/find", match: (p: string) => p.startsWith("/tournaments/find"), label: "navFind" as const },
  { key: "season", href: "/tournaments/guide", match: (p: string) => p.startsWith("/tournaments/guide"), label: "navGuide" as const },
] as const;

function Icon({ name }: { name: (typeof PRIMARY)[number]["key"] }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, "aria-hidden": true as const };
  if (name === "overview") return <svg {...p}><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></svg>;
  if (name === "finder") return <svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.2 4.2" /></svg>;
  return <svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
}

function LangSwitch() {
  const { locale, setLocale } = useLocale();
  const options: Locale[] = ["de", "en"];
  return (
    <div className="inline-flex items-center rounded-full bg-[var(--t2-surface)] p-0.5 t2-fs-meta font-bold">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setLocale(opt)}
          aria-pressed={locale === opt}
          className={`rounded-full px-1.5 py-0.5 uppercase tracking-wide transition-colors ${
            locale === opt ? "bg-[var(--t2-ink)] text-[var(--t2-on-accent)]" : "text-[var(--t2-muted)] hover:text-[var(--t2-ink)]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function VisitorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/tournaments";
  const t = useT();
  const [moreOpen, setMoreOpen] = useState(false);
  const [navCompact, setNavCompact] = useState(false);
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  const bleed = pathname === "/tournaments";
  const current = PRIMARY.find((a) => a.match(pathname));
  const headerKey = current?.label ?? "navGrounds";
  const year = new Date().getFullYear();

  const railLink = (a: (typeof PRIMARY)[number]) => {
    const active = a.match(pathname);
    return (
      <Link
        key={a.key}
        href={a.href}
        className={`t2-rail-item ${active ? "is-on" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        <Icon name={a.key} />
        <span className="t2-rail-label">{t(`tournaments.${a.label}`)}</span>
      </Link>
    );
  };

  const tabs: T2Tab[] = [
    { key: "overview", href: "/tournaments", label: t("tournaments.navGrounds"), icon: "overview" },
    { key: "finder", href: "/tournaments/find", label: t("tournaments.navFind"), icon: "finder" },
    { key: "season", href: "/tournaments/guide", label: t("tournaments.navGuide"), icon: "season" },
    { key: "more", label: t("tournaments.more"), icon: "more" },
  ];

  return (
    <div className="t2-root t2-shell is-dense">
      <aside className="t2-rail t2-rail-desk">
        <Link href="/tournaments" className="t2-rail-brand">
          <span className="t2-rail-mark" aria-hidden>M</span>
          <span className="t2-rail-word">{t("tournaments.brand")}</span>
        </Link>
        <nav className="t2-rail-nav" aria-label={t("tournaments.brand")}>
          {PRIMARY.map(railLink)}
        </nav>
        <div className="t2-rail-foot">
          <p className="t2-rail-season">{year}</p>
          <div className="t2-rail-tools">
            <LangSwitch />
          </div>
        </div>
      </aside>
      <div className="t2-workspace">
        <header className="t2-mhead md:hidden">
          <span className="t2-rail-mark" aria-hidden>M</span>
          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-[-0.02em]">{t(`tournaments.${headerKey}`)}</p>
        </header>
        <main
          className={bleed ? "t2-workspace-main is-bleed" : "t2-workspace-main"}
          onScroll={(e: UIEvent<HTMLElement>) => setNavCompact((e.currentTarget.scrollTop || 0) > 24)}
        >
          {children}
        </main>
        <Tour2TabBar tabs={tabs} active={current?.key ?? "overview"} compact={navCompact} dense onMore={() => setMoreOpen((o) => !o)} />
        {moreOpen && (
          <div className="fixed inset-0 z-[35] md:hidden" onClick={() => setMoreOpen(false)}>
            <div
              className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-[var(--t2-on-accent)] px-5 pt-4 pb-[max(5rem,calc(4rem+env(safe-area-inset-bottom)))] shadow-[0_-12px_40px_rgba(0,0,0,0.18)] ring-1 ring-black/10"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="t2-section-title">{t("tournaments.more")}</p>
              <p className="mt-1 t2-fs-micro text-[var(--t2-muted)]">{t("tournaments.moreLead")}</p>
              <div className="mt-4 flex items-center justify-between px-1 py-2">
                <span className="t2-fs-body-sm font-semibold text-[var(--t2-muted)]">{t("tournaments.langLabel")}</span>
                <LangSwitch />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
