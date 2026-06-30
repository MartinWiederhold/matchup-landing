"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";

const APP_URL = "https://matchup-app.com";

export default function InviteFriends() {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const shareText = t("profile.shareText");
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `${shareText} ${APP_URL}`,
  )}`;

  async function nativeShare() {
    const nav = navigator as Navigator & {
      share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title: "Matchup", text: shareText, url: APP_URL });
        return;
      } catch {
        return; // Nutzer hat abgebrochen
      }
    }
    window.open(whatsapp, "_blank", "noopener,noreferrer");
  }

  function copy() {
    navigator.clipboard?.writeText(APP_URL).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-matchup/25 to-zinc-900 p-5 ring-1 ring-matchup/30">
      <h3 className="text-base font-bold">{t("profile.inviteTitle")}</h3>
      <p className="mt-1 text-sm text-zinc-300">{t("profile.inviteText")}</p>
      <button
        type="button"
        onClick={nativeShare}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-matchup py-3 text-sm font-bold text-white transition-colors hover:bg-matchup-hover"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {t("profile.shareButton")}
      </button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-full bg-[#25D366] py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          {t("profile.shareWhatsapp")}
        </a>
        <button
          type="button"
          onClick={copy}
          className="rounded-full border border-zinc-700 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          {copied ? t("profile.linkCopied") : t("profile.copyLink")}
        </button>
      </div>
    </div>
  );
}
