// Reine Datenliste der Compete-Features — bewusst OHNE "use client", damit sie
// sowohl von Server-Komponenten (/compete-Seite) als auch vom Client-Modul
// CompletePicture importiert werden kann. Ein Daten-Export aus einem
// "use client"-Modul käme in Server-Komponenten nur als Client-Referenz-Proxy
// an (kein echtes Array) → `.map` würde crashen.
export type CompeteFeature = { key: string; stat: string };

export const COMPETE_FEATURES: CompeteFeature[] = [
  { key: "competeSeason", stat: "12 Events" },
  { key: "competeTournament", stat: "+CHF 4.2k" },
  { key: "competeRanking", stat: "72% in" },
  { key: "competeTeam", stat: "Team of 4" },
];
