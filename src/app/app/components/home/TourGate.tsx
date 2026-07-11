"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { TOUR_CODE, unlockTour } from "@/lib/tour";
import WaitlistModal from "@/components/WaitlistModal";

/**
 * Early-Access-Sperre für den Tour-Modus. Zeigt eine Warteliste-Meldung; mit dem
 * internen Code wird Tour lokal freigeschaltet (nur für Tests). Vollflächig,
 * mockup2-Design.
 */
export default function TourGate({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
  const t = useT();
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [waitlist, setWaitlist] = useState(false);

  function submit() {
    if (code.trim() === TOUR_CODE) {
      unlockTour();
      onUnlock();
    } else {
      setWrong(true);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] mx-auto flex max-w-[430px] flex-col bg-white">
      <header className="flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3">
        <button type="button" onClick={onClose} className="text-sm font-medium text-neutral-500">
          {t("common.close")}
        </button>
        <span className="text-sm font-bold text-neutral-900">{t("mode.tour")}</span>
        <span className="w-10" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-matchup to-indigo-500 text-white">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
        <h1 className="text-[22px] font-bold tracking-tight text-neutral-900">{t("mode.tourLockedTitle")}</h1>
        <p className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-neutral-500">{t("mode.tourLockedSub")}</p>

        <div className="mt-7 w-full max-w-[300px]">
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setWrong(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            inputMode="numeric"
            placeholder={t("mode.tourCodePlaceholder")}
            className={`w-full rounded-xl bg-black/[0.04] px-4 py-3 text-center text-[15px] tracking-widest outline-none focus:ring-1 ${wrong ? "ring-1 ring-red-400" : "focus:ring-matchup"}`}
          />
          {wrong && <p className="mt-1.5 text-[12px] text-red-500">{t("mode.tourCodeWrong")}</p>}
          <button
            type="button"
            onClick={submit}
            className="mt-2.5 w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white"
          >
            {t("mode.tourUnlockCta")}
          </button>
        </div>

        <div className="my-5 flex w-full max-w-[300px] items-center gap-3">
          <div className="h-px flex-1 bg-black/10" />
          <span className="text-[11px] text-neutral-400">{t("mode.or")}</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <button
          type="button"
          onClick={() => setWaitlist(true)}
          className="w-full max-w-[300px] rounded-full border border-black/10 py-3.5 text-sm font-bold text-neutral-700"
        >
          {t("mode.tourWaitlistCta")}
        </button>
      </div>

      <WaitlistModal open={waitlist} feature={t("mode.tour")} onClose={() => setWaitlist(false)} />
    </div>
  );
}
