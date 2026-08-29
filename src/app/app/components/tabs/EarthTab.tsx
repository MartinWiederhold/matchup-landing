"use client";

import { useEffect } from "react";

/**
 * Play-Modus „Welt"-Tab (Globus): öffnet direkt die Weltkarte (/map).
 *
 * Die frühere Vorstart-Warteliste entfällt — die Karte ist im Play-Modus für
 * alle eingeloggten Nutzer freigegeben. EarthTab wird ausschließlich im
 * Play-Modus gerendert (AppShell: `isTour ? <CompeteMap /> : <EarthTab />`),
 * der Compete-Modus nutzt weiterhin die separat gegatete CompeteMap.
 */
export default function EarthTab() {
  useEffect(() => {
    window.location.href = "/map";
  }, []);

  // Neutraler Platzhalter im App-Hintergrund während der Weiterleitung — keine
  // Warteliste mehr.
  return <div className="min-h-[100dvh] bg-black" aria-hidden />;
}
