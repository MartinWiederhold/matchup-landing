/**
 * BEISPIEL-Daten für den „Vor Ort"-Reiter (/tour) — REINE ANZEIGE im Code, NIEMALS in
 * web.player_presence geschrieben. Begründung: player_presence ist echt, hängt an Konten,
 * und die Chat-Freigabe (RLS may_match) prüft gegen die Tabelle. Erfundene Zeilen dort
 * erzeugten „Anschreiben"-Knöpfe, die ins Leere führen. Deshalb getrennte, statische Daten
 * hier — klar als Beispiel gekennzeichnet, ohne Anschreiben-/Kontakt-Knopf (er würde scheitern).
 *
 * ABSCHALTBAR über NEXT_PUBLIC_TOUR_PRESENCE_DEMO (Vorgabe AN; "off" blendet aus) — zum
 * Vorführen da, verschwindet, wenn echte Nutzer kommen.
 *
 * ── BILDER: Pexels ────────────────────────────────────────────────────────────────────────
 * Pexels-Lizenz: kommerzielle Nutzung erlaubt, KEINE Namensnennung nötig. LOKAL abgelegt in
 * /public/seed/tour (kein Hotlink — fremde Server, fremde Kontrolle, MU-035-Lehre).
 * Pexels-Bedingungen zu ABGEBILDETEN PERSONEN (am 2026-08-16 geprüft, wörtlich):
 *   • „Identifiable people may not appear in a bad light or in a way that is offensive."
 *   • „Don't imply endorsement of your product by people or brands on the imagery."
 * → Es sind echte Menschen. Die BEISPIEL-Kennzeichnung ist daher nicht nur Projektregel,
 *   sondern die Lizenz-Absicherung: Wir zeigen ausdrücklich KEINE echten Nutzer und
 *   suggerieren keine Befürwortung durch die Abgebildeten. Pexels garantiert keine
 *   Model-Releases; die klare Demo-Auszeichnung ist die Minderung. Foto-ID + Fotograf
 *   stehen je Zeile unten.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */

export type DemoPresence = {
  id: string;
  name: string;
  rankLabel: string;
  nationality: string; // ISO-3166-1 alpha-2
  gender: "m" | "w";
  looking: boolean; // sucht Trainingspartner
  lookingRoom: boolean; // sucht Unterkunft
  image: string; // lokaler Pfad unter /public
};

// Pool aus zehn Beispiel-Spielern, Frauen/Männer ABWECHSELND — so ist jede Fünfer-Auswahl
// (fünf aufeinanderfolgende ab einem stabilen Startpunkt) automatisch gemischt.
const POOL: DemoPresence[] = [
  { id: "demo-1", name: "Elena M.", rankLabel: "#412", nationality: "ES", gender: "w", looking: true, lookingRoom: false, image: "/seed/tour/w-14679136.jpg" }, // Pexels 14679136 · Ismaelabdalnabystudio
  { id: "demo-2", name: "Luca R.", rankLabel: "#880", nationality: "IT", gender: "m", looking: false, lookingRoom: true, image: "/seed/tour/m-10340627.jpg" }, // Pexels 10340627 · cottonbro
  { id: "demo-3", name: "Sofia K.", rankLabel: "#305", nationality: "CZ", gender: "w", looking: true, lookingRoom: true, image: "/seed/tour/w-31589110.jpg" }, // Pexels 31589110 · Cesar O'Neill
  { id: "demo-4", name: "Jonas H.", rankLabel: "#1150", nationality: "DE", gender: "m", looking: true, lookingRoom: false, image: "/seed/tour/m-28625142.jpg" }, // Pexels 28625142 · holoshuriken
  { id: "demo-5", name: "Marta V.", rankLabel: "#740", nationality: "PT", gender: "w", looking: false, lookingRoom: true, image: "/seed/tour/w-14625304.jpg" }, // Pexels 14625304 · Marcus Queiroga Silva
  { id: "demo-6", name: "Diego S.", rankLabel: "#520", nationality: "AR", gender: "m", looking: true, lookingRoom: false, image: "/seed/tour/m-36400163.jpg" }, // Pexels 36400163 · yurii-borshch
  { id: "demo-7", name: "Nina A.", rankLabel: "#965", nationality: "HR", gender: "w", looking: true, lookingRoom: true, image: "/seed/tour/w-21050425.jpg" }, // Pexels 21050425 · Anastasia Nagibina
  { id: "demo-8", name: "Tomás B.", rankLabel: "#1340", nationality: "FR", gender: "m", looking: false, lookingRoom: true, image: "/seed/tour/m-22931874.jpg" }, // Pexels 22931874 · mutecevvil
  { id: "demo-9", name: "Clara P.", rankLabel: "#610", nationality: "PL", gender: "w", looking: true, lookingRoom: false, image: "/seed/tour/w-12611624.jpg" }, // Pexels 12611624 · Duren Williams
  { id: "demo-10", name: "Marco F.", rankLabel: "#825", nationality: "GB", gender: "m", looking: true, lookingRoom: false, image: "/seed/tour/m-4068378.jpg" }, // Pexels 4068378 · michaeldupuis
];

/** Fünf Beispiel-Spieler je Turnier — deterministisch (stabil über die tt.id), gemischt. */
export function demoPresenceFor(tournamentId: string): DemoPresence[] {
  // Einfacher, stabiler Hash über die ID (kein Zufall → gleiche ID zeigt immer dieselben fünf).
  let h = 0;
  for (let i = 0; i < tournamentId.length; i++) h = (h * 31 + tournamentId.charCodeAt(i)) >>> 0;
  const start = h % POOL.length;
  const out: DemoPresence[] = [];
  for (let i = 0; i < 5; i++) out.push(POOL[(start + i) % POOL.length]);
  return out;
}

/** Beispiel-Anzeige an? Vorgabe AN; NEXT_PUBLIC_TOUR_PRESENCE_DEMO="off" schaltet ab. */
export const TOUR_PRESENCE_DEMO_ON = (process.env.NEXT_PUBLIC_TOUR_PRESENCE_DEMO ?? "on").toLowerCase() !== "off";
