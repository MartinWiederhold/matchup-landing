"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { COMPETE_EARLY_ACCESS_OPEN } from "@/lib/tour";
import WaitlistScreen from "../WaitlistScreen";

/**
 * Earth-/Weltkarte-Tab: noch nicht freigeschaltet → Vollbild-Warteliste.
 * Code 50805080 statt E-Mail → freischalten (localStorage) und weiter zur /map.
 */
export default function EarthTab() {
  const t = useT();

  // Freischalt-Entscheidung SYNCHRON beim ersten Render treffen. Vorher wurde
  // die Warteliste bedingungslos gerendert und erst im useEffect (nach dem
  // Paint) auf /map umgeleitet — dadurch blitzte die Warteliste bei bereits
  // freigeschalteten Nutzern für ~0,5 s auf. Der useState-Initializer läuft
  // clientseitig beim Mount (EarthTab mountet erst nach Tab-Klick), das
  // localStorage ist da verfügbar; try/catch fängt jeden Edge-Fall ab.
  const [redirecting] = useState<boolean>(() => {
    if (COMPETE_EARLY_ACCESS_OPEN) return true;
    try { return localStorage.getItem("mu_earth_unlocked") === "1"; } catch { return false; }
  });

  useEffect(() => {
    if (redirecting) window.location.href = "/map";
  }, [redirecting]);

  // Während der Weiterleitung KEIN Warteliste-Flackern — nur ein neutraler,
  // blockierender Platzhalter im App-Hintergrund, bis /map lädt.
  if (redirecting) {
    return <div className="min-h-[100dvh] bg-black" aria-hidden />;
  }

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
