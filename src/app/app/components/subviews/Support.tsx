"use client";

import { useT } from "@/lib/i18n";
import { SubViewHeader } from "../shared/ui";

const SUPPORT_EMAIL = "swissflow@bluewin.ch";

export default function Support() {
  const t = useT();
  const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    t("support.mailSubject"),
  )}`;

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={t("support.title")} />
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-matchup">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </div>
        <h2 className="mt-5 text-xl font-bold text-white">
          {t("support.contactTitle")}
        </h2>
        <p className="mt-2 max-w-xs text-sm text-zinc-400">
          {t("support.contactText")}
        </p>
        <a
          href={href}
          className="mt-8 w-full max-w-xs rounded-full bg-matchup py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-matchup-hover"
        >
          {t("support.contactButton")}
        </a>
      </div>
    </div>
  );
}
