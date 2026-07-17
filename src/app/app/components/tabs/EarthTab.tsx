"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n";
import { COMPETE_EARLY_ACCESS_OPEN } from "@/lib/tour";
import WaitlistScreen from "../WaitlistScreen";

/**
 * Earth-/Weltkarte-Tab: noch nicht freigeschaltet → Vollbild-Warteliste.
 * Code 50805080 statt E-Mail → freischalten (localStorage) und weiter zur /map.
 */
export default function EarthTab() {
  const t = useT();

  useEffect(() => {
    // TEMP: bei offenem Early Access direkt zur Karte (kein Code nötig).
    if (COMPETE_EARLY_ACCESS_OPEN) { window.location.href = "/map"; return; }
    try {
      if (localStorage.getItem("mu_earth_unlocked") === "1") window.location.href = "/map";
    } catch { /* ignore */ }
  }, []);

  return (
    <WaitlistScreen
      feature={t("app.earthFeature")}
      featureKey="Earth"
      onUnlock={() => {
        try { localStorage.setItem("mu_earth_unlocked", "1"); } catch { /* ignore */ }
        window.location.href = "/map";
      }}
    />
  );
}
