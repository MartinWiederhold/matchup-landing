"use client";

import { useT } from "@/lib/i18n";
import { unlockTour } from "@/lib/tour";
import WaitlistScreen from "../WaitlistScreen";

/**
 * Early-Access-Sperre für den Compete-Modus. Zeigt dieselbe Warteliste wie der
 * Earth-Tab (gleiches Design, gleicher Code) — mit 50805080 wird Compete lokal
 * freigeschaltet.
 */
export default function TourGate({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
  const t = useT();
  return (
    <WaitlistScreen
      layout="overlay"
      feature={t("mode.tour")}
      featureKey="Compete"
      onClose={onClose}
      onUnlock={() => { unlockTour(); onUnlock(); }}
    />
  );
}
