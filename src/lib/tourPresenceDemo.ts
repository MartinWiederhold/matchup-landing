/**
 * BEISPIEL-Daten für den „Vor Ort"-Reiter (/tour) — REINE ANZEIGE im Code, NIEMALS in
 * web.player_presence geschrieben. Begründung: player_presence ist echt, hängt an Konten,
 * und die Chat-Freigabe (RLS may_match) prüft gegen die Tabelle. Erfundene Zeilen dort
 * erzeugten „Anschreiben"-Knöpfe, die ins Leere führen. Deshalb getrennte, statische Daten
 * hier — klar als Beispiel gekennzeichnet. Das Anklicken öffnet eine SIMULIERTE Profil-/
 * Chat-Vorschau (src/app/tour/components/planner/DemoPlayerSheet.tsx): nichts wird gespeichert,
 * kein Match, kein echter Chat (kein ensureMatch/startTourChat).
 *
 * ABSCHALTBAR über NEXT_PUBLIC_TOUR_PRESENCE_DEMO (Vorgabe AN; "off" blendet aus).
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
  nationality: string; // ISO-3166-1 alpha-2
  gender: "m" | "w";
  age: number;
  homeCity: string; // Heimatort (plausibel zur Nationalität)
  looking: boolean; // sucht Trainingspartner
  lookingRoom: boolean; // sucht Unterkunft
  image: string; // lokaler Pfad unter /public
  // Relative Stärke 0..1 (0 = am stärksten). Der ANGEZEIGTE Rang wird daraus je Turnier-
  // KATEGORIE gebildet (siehe rankForCategory), damit er plausibel zur Turnierstufe passt.
  strength: number;
  // Detailangaben (füllen die neuen player_presence-Felder sofort für die Vorführung).
  surface: string | null; // Belag-Code: 'clay' | 'hard' | 'grass' | 'carpet'
  partnerLevel: string | null; // Niveau-Code (siehe PARTNER_LEVELS)
  partnerDays: string[]; // Wochentag-Codes 'mon'..'sun'
  roomArea: string | null; // Gegend/Ort
  roomCost: string | null; // Kostenanteil (Freitext)
  roomType: string | null; // 'room' | 'apartment'
  roomFromOff: number; // Zimmer ab: Tage relativ zum Turniermontag
  roomToOff: number; // Zimmer bis: Tage relativ zum Turniermontag
};

/** Beispiel-Spieler mit dem für dieses Turnier gebildeten Rang + konkreten Zimmer-Daten. */
export type DemoPlayer = DemoPresence & { rank: number; rankLabel: string; roomFrom: string | null; roomTo: string | null };

// Niveau-Codes für Trainingspartner (Form-Auswahl + Anzeige über i18n tour.level_*).
export const PARTNER_LEVELS = ["ranked", "itf", "ambitious", "casual"] as const;
// Wochentag-Codes (Reihenfolge Mo→So) für die Tage-Auswahl.
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

// Pool aus zehn Beispiel-Spielern, Frauen/Männer ABWECHSELND — so ist jede Fünfer-Auswahl
// (fünf aufeinanderfolgende ab einem stabilen Startpunkt) automatisch gemischt.
// Kürzel: P = Partner-Detail (Niveau/Tage/Belag), R = Zimmer-Detail (Gegend/Kosten/Typ/Zeitraum).
const POOL: DemoPresence[] = [
  { id: "demo-1", name: "Elena M.", nationality: "ES", gender: "w", age: 22, homeCity: "Valencia", looking: true, lookingRoom: false, strength: 0.2, image: "/seed/tour/w-14679136.jpg", surface: "clay", partnerLevel: "itf", partnerDays: ["mon", "wed", "fri"], roomArea: null, roomCost: null, roomType: null, roomFromOff: 0, roomToOff: 0 }, // Pexels 14679136 · Ismaelabdalnabystudio
  { id: "demo-2", name: "Luca R.", nationality: "IT", gender: "m", age: 25, homeCity: "Torino", looking: false, lookingRoom: true, strength: 0.6, image: "/seed/tour/m-10340627.jpg", surface: null, partnerLevel: null, partnerDays: [], roomArea: "nähe Anlage", roomCost: "~35 €/Nacht", roomType: "room", roomFromOff: -1, roomToOff: 6 }, // Pexels 10340627 · cottonbro
  { id: "demo-3", name: "Sofia K.", nationality: "CZ", gender: "w", age: 20, homeCity: "Brno", looking: true, lookingRoom: true, strength: 0.85, image: "/seed/tour/w-31589110.jpg", surface: "hard", partnerLevel: "ambitious", partnerDays: ["tue", "thu"], roomArea: "Zentrum", roomCost: "50/50", roomType: "apartment", roomFromOff: 0, roomToOff: 7 }, // Pexels 31589110 · Cesar O'Neill
  { id: "demo-4", name: "Jonas H.", nationality: "DE", gender: "m", age: 27, homeCity: "Stuttgart", looking: true, lookingRoom: false, strength: 0.4, image: "/seed/tour/m-28625142.jpg", surface: "clay", partnerLevel: "ranked", partnerDays: ["mon", "tue", "wed"], roomArea: null, roomCost: null, roomType: null, roomFromOff: 0, roomToOff: 0 }, // Pexels 28625142 · holoshuriken
  { id: "demo-5", name: "Marta V.", nationality: "PT", gender: "w", age: 23, homeCity: "Porto", looking: false, lookingRoom: true, strength: 0.1, image: "/seed/tour/w-14625304.jpg", surface: null, partnerLevel: null, partnerDays: [], roomArea: "Strandnähe", roomCost: "~50 €/Nacht", roomType: "room", roomFromOff: -2, roomToOff: 5 }, // Pexels 14625304 · Marcus Queiroga Silva
  { id: "demo-6", name: "Diego S.", nationality: "AR", gender: "m", age: 24, homeCity: "Córdoba", looking: true, lookingRoom: false, strength: 0.7, image: "/seed/tour/m-36400163.jpg", surface: "clay", partnerLevel: "ambitious", partnerDays: ["sat", "sun"], roomArea: null, roomCost: null, roomType: null, roomFromOff: 0, roomToOff: 0 }, // Pexels 36400163 · yurii-borshch
  { id: "demo-7", name: "Nina A.", nationality: "HR", gender: "w", age: 19, homeCity: "Split", looking: true, lookingRoom: true, strength: 0.5, image: "/seed/tour/w-21050425.jpg", surface: "hard", partnerLevel: "itf", partnerDays: ["wed", "fri"], roomArea: "nähe Bahnhof", roomCost: "40/60", roomType: "apartment", roomFromOff: -1, roomToOff: 8 }, // Pexels 21050425 · Anastasia Nagibina
  { id: "demo-8", name: "Tomás B.", nationality: "FR", gender: "m", age: 26, homeCity: "Lyon", looking: false, lookingRoom: true, strength: 0.95, image: "/seed/tour/m-22931874.jpg", surface: null, partnerLevel: null, partnerDays: [], roomArea: "Altstadt", roomCost: "~45 €/Nacht", roomType: "room", roomFromOff: 0, roomToOff: 6 }, // Pexels 22931874 · mutecevvil
  { id: "demo-9", name: "Clara P.", nationality: "PL", gender: "w", age: 21, homeCity: "Wrocław", looking: true, lookingRoom: false, strength: 0.3, image: "/seed/tour/w-12611624.jpg", surface: "clay", partnerLevel: "ambitious", partnerDays: ["mon", "thu"], roomArea: null, roomCost: null, roomType: null, roomFromOff: 0, roomToOff: 0 }, // Pexels 12611624 · Duren Williams
  { id: "demo-10", name: "Marco F.", nationality: "GB", gender: "m", age: 28, homeCity: "Manchester", looking: true, lookingRoom: false, strength: 0.65, image: "/seed/tour/m-4068378.jpg", surface: "hard", partnerLevel: "casual", partnerDays: ["fri", "sat"], roomArea: null, roomCost: null, roomType: null, roomFromOff: 0, roomToOff: 0 }, // Pexels 4068378 · michaeldupuis
];

/** Plausibles Rang-Band je Turnierkategorie (grobe Erfahrungswerte, kein sportliches Urteil). */
function rankBand(category: string | null): [number, number] {
  const c = (category ?? "").toLowerCase();
  if (c.includes("175") || c.includes("125")) return [110, 320]; // höhere Challenger
  if (c.includes("100") || c.includes("75")) return [200, 480]; // mittlere Challenger
  if (c.includes("50") || c.includes("m25")) return [350, 720]; // Challenger 50 / ITF M25
  if (c.includes("m15")) return [650, 1400]; // ITF M15
  return [300, 800]; // unbekannt → mittleres Band
}

/** Angezeigter Rang aus Stärke + Kategorie (stärker = kleinere Zahl). */
function rankForCategory(category: string | null, strength: number): number {
  const [lo, hi] = rankBand(category);
  return Math.round(lo + strength * (hi - lo));
}

/**
 * Fünf Beispiel-Spieler je Turnier — deterministisch (stabil über die tt.id), gemischt.
 * Der Rang wird passend zur Turnier-KATEGORIE gebildet, damit er plausibel wirkt.
 */
export function demoPresenceFor(tournamentId: string, category: string | null, tournamentMonday?: string | null): DemoPlayer[] {
  // Einfacher, stabiler Hash über die ID (kein Zufall → gleiche ID zeigt immer dieselben fünf).
  let h = 0;
  for (let i = 0; i < tournamentId.length; i++) h = (h * 31 + tournamentId.charCodeAt(i)) >>> 0;
  const start = h % POOL.length;
  // Zimmer-Zeitraum konkret aus dem Turniermontag (deterministisch, kein Laufzeit-Clock).
  const mondayMs = tournamentMonday ? Date.parse(tournamentMonday + "T00:00:00Z") : NaN;
  const isoOff = (off: number): string | null =>
    Number.isNaN(mondayMs) ? null : new Date(mondayMs + off * 86_400_000).toISOString().slice(0, 10);
  const out: DemoPlayer[] = [];
  for (let i = 0; i < 5; i++) {
    const m = POOL[(start + i) % POOL.length];
    const rank = rankForCategory(category, m.strength);
    out.push({
      ...m,
      rank,
      rankLabel: `#${rank}`,
      roomFrom: m.lookingRoom ? isoOff(m.roomFromOff) : null,
      roomTo: m.lookingRoom ? isoOff(m.roomToOff) : null,
    });
  }
  return out;
}

/** Beispiel-Anzeige an? Vorgabe AN; NEXT_PUBLIC_TOUR_PRESENCE_DEMO="off" schaltet ab. */
export const TOUR_PRESENCE_DEMO_ON = (process.env.NEXT_PUBLIC_TOUR_PRESENCE_DEMO ?? "on").toLowerCase() !== "off";
