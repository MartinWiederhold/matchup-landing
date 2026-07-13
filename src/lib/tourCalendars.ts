/**
 * Offizielle Turnier-Kalender je Circuit/Level/Alter. Fast alle Verbände bieten
 * KEINE offene API — daher verlinken wir direkt auf den passenden offiziellen
 * Kalender (vorgefiltert über die richtige Ziel-URL). Das ist die ehrliche,
 * wartungsarme Abdeckung unter den Top-Pros (ITF, national, Junioren, Senioren, UTR).
 */
export type CalLink = { label: string; url: string; note?: { de: string; en: string } };

export type TourCircuit = {
  id: string;
  sport: "tennis" | "padel";
  label: { de: string; en: string };
  who: { de: string; en: string };
  links: CalLink[];
  /** Optionale Alterskategorien mit je eigener Ziel-URL (Junioren/Senioren). */
  ageBands?: { id: string; label: string; url: string }[];
};

export const AGE_CATEGORIES = ["Open", "U12", "U14", "U16", "U18", "35+", "45+", "55+", "65+"] as const;

export const TOUR_CIRCUITS: TourCircuit[] = [
  {
    id: "pro",
    sport: "tennis",
    label: { de: "Profi (ATP/WTA/Challenger)", en: "Pro (ATP/WTA/Challenger)" },
    who: { de: "Weltrangliste — Grand Slam, Tour und Challenger.", en: "World ranking — Grand Slam, Tour and Challenger." },
    links: [
      { label: "ATP Tour", url: "https://www.atptour.com/en/tournaments" },
      { label: "WTA Tour", url: "https://www.wtatennis.com/tournaments" },
      { label: "ATP Challenger", url: "https://www.atptour.com/en/atp-challenger-tour/challenger-calendar" },
    ],
  },
  {
    id: "itf",
    sport: "tennis",
    label: { de: "ITF World Tennis Tour", en: "ITF World Tennis Tour" },
    who: { de: "Einstieg in die Weltrangliste (Rang ~500–2000). M15/M25, W15–W100.", en: "Entry to the world ranking (rank ~500–2000). M15/M25, W15–W100." },
    links: [
      { label: "ITF Herren-Kalender", url: "https://www.itftennis.com/en/tournament-calendar/mens-world-tennis-tour-calendar/" },
      { label: "ITF Damen-Kalender", url: "https://www.itftennis.com/en/tournament-calendar/womens-world-tennis-tour-calendar/" },
      { label: "IPIN (Anmeldung)", url: "https://www.itftennis.com/en/ipin/", note: { de: "Für ITF-Turniere brauchst du eine IPIN.", en: "You need an IPIN to enter ITF events." } },
    ],
  },
  {
    id: "national_ch",
    sport: "tennis",
    label: { de: "National — Swiss Tennis (R/N)", en: "National — Swiss Tennis (R/N)" },
    who: { de: "Klassierung R9–R1 und N4–N1. Regionale & nationale Turniere, Interclub.", en: "Classification R9–R1 and N4–N1. Regional & national tournaments, Interclub." },
    links: [
      { label: "Turnierwesen Swiss Tennis", url: "https://www.swisstennis.ch/de/wettkampf/turnierwesen/" },
      { label: "tennisplattform.ch (Turniersuche)", url: "https://tennisplattform.ch/" },
      { label: "MyTennis (Login)", url: "https://mytennis.swisstennis.ch/" },
    ],
  },
  {
    id: "juniors",
    sport: "tennis",
    label: { de: "Junioren (nach Alter)", en: "Juniors (by age)" },
    who: { de: "Alterskategorien U12–U18. Tennis Europe (U12–U16) und ITF Junioren (U18).", en: "Age categories U12–U18. Tennis Europe (U12–U16) and ITF Juniors (U18)." },
    links: [
      { label: "Tennis Europe (U12/U14/U16)", url: "https://www.tenniseurope.org/tournaments" },
      { label: "ITF World Tennis Tour Juniors (U18)", url: "https://www.itftennis.com/en/tournament-calendar/world-tennis-tour-juniors-calendar/" },
      { label: "Swiss Junioren (Swiss Tennis)", url: "https://www.swisstennis.ch/de/wettkampf/turnierwesen/" },
    ],
    ageBands: [
      { id: "U12", label: "U12", url: "https://www.tenniseurope.org/tournaments" },
      { id: "U14", label: "U14", url: "https://www.tenniseurope.org/tournaments" },
      { id: "U16", label: "U16", url: "https://www.tenniseurope.org/tournaments" },
      { id: "U18", label: "U18", url: "https://www.itftennis.com/en/tournament-calendar/world-tennis-tour-juniors-calendar/" },
    ],
  },
  {
    id: "seniors",
    sport: "tennis",
    label: { de: "Senioren / Masters (nach Alter)", en: "Seniors / Masters (by age)" },
    who: { de: "ITF World Tennis Masters Tour — Altersbänder ab 30 in 5-Jahres-Schritten.", en: "ITF World Tennis Masters Tour — age bands from 30 in 5-year steps." },
    links: [
      { label: "ITF Masters-Kalender", url: "https://www.itftennis.com/en/tournament-calendar/world-tennis-masters-tour-calendar/" },
      { label: "Senioren Swiss Tennis", url: "https://www.swisstennis.ch/de/wettkampf/turnierwesen/" },
    ],
    ageBands: [
      { id: "35+", label: "35+", url: "https://www.itftennis.com/en/tournament-calendar/world-tennis-masters-tour-calendar/" },
      { id: "45+", label: "45+", url: "https://www.itftennis.com/en/tournament-calendar/world-tennis-masters-tour-calendar/" },
      { id: "55+", label: "55+", url: "https://www.itftennis.com/en/tournament-calendar/world-tennis-masters-tour-calendar/" },
      { id: "65+", label: "65+", url: "https://www.itftennis.com/en/tournament-calendar/world-tennis-masters-tour-calendar/" },
    ],
  },
  {
    id: "utr",
    sport: "tennis",
    label: { de: "UTR (level-basiert)", en: "UTR (level-based)" },
    who: { de: "Turniere & Flex Leagues nach UTR (1–16.5) — alle Alter, immer auf deinem Level.", en: "Tournaments & Flex Leagues by UTR (1–16.5) — any age, always at your level." },
    links: [
      { label: "UTR Sports (Events & Leagues)", url: "https://www.utrsports.net/events" },
    ],
  },
  {
    id: "padel",
    sport: "padel",
    label: { de: "Padel (FIP / Premier Padel)", en: "Padel (FIP / Premier Padel)" },
    who: { de: "FIP Tour (Platinum→Bronze) und Premier Padel, plus nationale Turniere.", en: "FIP Tour (Platinum→Bronze) and Premier Padel, plus national events." },
    links: [
      { label: "FIP Kalender", url: "https://www.padelfip.com/calendar/" },
      { label: "Premier Padel", url: "https://www.premierpadel.com/en/calendar" },
    ],
  },
];
