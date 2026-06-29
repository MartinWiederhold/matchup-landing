import type { SportLanding } from "@/components/seo/SportLandingPage";

/** Top-Städte DACH für lokale Landingpages (Sport × Stadt). */
export const CITIES: { slug: string; name: string }[] = [
  { slug: "zuerich", name: "Zürich" },
  { slug: "bern", name: "Bern" },
  { slug: "basel", name: "Basel" },
  { slug: "genf", name: "Genf" },
  { slug: "lausanne", name: "Lausanne" },
  { slug: "winterthur", name: "Winterthur" },
  { slug: "luzern", name: "Luzern" },
  { slug: "st-gallen", name: "St. Gallen" },
  { slug: "berlin", name: "Berlin" },
  { slug: "muenchen", name: "München" },
  { slug: "hamburg", name: "Hamburg" },
  { slug: "koeln", name: "Köln" },
  { slug: "frankfurt", name: "Frankfurt" },
  { slug: "stuttgart", name: "Stuttgart" },
  { slug: "wien", name: "Wien" },
];

/**
 * Baut aus einer Sport-Basis + Stadt eine lokale Landingpage-Konfiguration.
 * Gibt null zurück, wenn Sport oder Stadt unbekannt sind.
 */
export function cityLanding(
  sportKey: string,
  citySlug: string,
): SportLanding | null {
  const base = SPORT_LANDINGS[sportKey];
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!base || !city) return null;
  const { sport, partnerWord } = base;
  return {
    slug: `${base.slug}/${city.slug}`,
    sport,
    partnerWord,
    h1: `${partnerWord} finden in ${city.name}`,
    intro: `Du suchst einen ${partnerWord} in ${city.name}? Mit Matchup findest du ${sport}-Mitspieler auf deinem Level in ${city.name} und Umgebung — matchen, chatten und das nächste Spiel direkt vereinbaren. Kostenlos und in wenigen Minuten startklar.`,
    heroImg: base.heroImg,
    heroPos: base.heroPos,
    benefits: base.benefits,
    steps: base.steps,
    faq: [
      {
        q: `Wie finde ich einen ${partnerWord} in ${city.name}?`,
        a: `Erstelle ein kostenloses Matchup-Profil, wähle ${sport} und deinen Umkreis um ${city.name} — du siehst sofort passende Spieler in deiner Nähe und kannst dich verbinden.`,
      },
      {
        q: `Gibt es genug ${sport}-Spieler in ${city.name}?`,
        a: `Matchup wächst stetig. Stelle den Umkreis etwas grösser, um in und um ${city.name} mehr Mitspieler zu finden.`,
      },
      ...base.faq.slice(1, 3),
    ],
  };
}

export const SPORT_LANDINGS: Record<string, SportLanding> = {
  "tennispartner-finden": {
    slug: "tennispartner-finden",
    sport: "Tennis",
    partnerWord: "Tennispartner",
    h1: "Tennispartner finden in deiner Nähe",
    intro:
      "Du suchst einen Tennispartner auf deinem Level? Mit Matchup findest du Mitspieler für Einzel oder Doppel in deiner Umgebung — gefiltert nach Spielstärke, Alter und Entfernung. Match, chatte und vereinbare dein nächstes Spiel direkt in der App.",
    heroImg: "/tennis/tennis-1.jpg",
    heroPos: "center 30%",
    benefits: [
      {
        title: "Partner auf deinem Level",
        text: "Filtere nach Spielstärke und Rating, damit jedes Match fordernd und fair ist.",
      },
      {
        title: "Einzel & Doppel organisieren",
        text: "Finde einen Gegner fürs Einzel oder gleich drei Mitspieler fürs Doppel.",
      },
      {
        title: "Plätze & Clubs in der Nähe",
        text: "Entdecke Tennisplätze und Clubs in deiner Region und verabrede dich dort.",
      },
      {
        title: "Verifizierte Profile",
        text: "Echte Spieler statt Fake-Profile — sicher und mit Moderation.",
      },
    ],
    steps: [
      { title: "Profil erstellen", text: "Sportart, Level und Umkreis angeben — in unter 3 Minuten." },
      { title: "Entdecken & matchen", text: "Passende Tennisspieler in deiner Nähe ansehen und verbinden." },
      { title: "Spielen", text: "Im Chat ein Match vereinbaren, Platz buchen und auf den Court." },
    ],
    faq: [
      {
        q: "Wie finde ich einen Tennispartner in meiner Nähe?",
        a: "Erstelle ein kostenloses Matchup-Profil, gib deine Sportart, dein Level und deinen Umkreis an — du siehst sofort passende Tennisspieler in deiner Region und kannst dich verbinden.",
      },
      {
        q: "Ist Matchup kostenlos?",
        a: "Ja, das Erstellen eines Profils und das Finden von Spielpartnern ist kostenlos.",
      },
      {
        q: "Kann ich nach Spielstärke filtern?",
        a: "Ja. Du kannst nach Level, Alter, Entfernung und Sportart filtern, damit die Matches zu dir passen.",
      },
      {
        q: "Funktioniert das auch für Doppel?",
        a: "Absolut — du kannst offene Spiele für Einzel oder Doppel erstellen oder bestehenden Spielen beitreten.",
      },
    ],
  },
  "padelpartner-finden": {
    slug: "padelpartner-finden",
    sport: "Padel",
    partnerWord: "Padelpartner",
    h1: "Padelpartner finden in deiner Nähe",
    intro:
      "Padel spielt man zu viert — mit Matchup findest du in Sekunden die passenden Mitspieler. Filtere nach Level und Entfernung, tritt offenen Spielen bei oder organisiere selbst eine Partie auf dem Court in deiner Nähe.",
    heroImg: "/padel/padel-1.jpg",
    benefits: [
      {
        title: "Schnell vier Spieler zusammen",
        text: "Finde in Sekunden die fehlenden Mitspieler für deine Padel-Partie.",
      },
      {
        title: "Offene Spiele beitreten",
        text: "Tritt Spielen anderer bei oder erstelle dein eigenes offenes Match.",
      },
      {
        title: "Padel-Community & Treffs",
        text: "Vernetze dich mit der wachsenden Padel-Szene in deiner Region.",
      },
      {
        title: "Level-Matching",
        text: "Spiele gegen Gegner, die zu deinem Können passen.",
      },
    ],
    steps: [
      { title: "Profil erstellen", text: "Level und Umkreis festlegen — kostenlos und schnell." },
      { title: "Mitspieler matchen", text: "Padel-Spieler in deiner Nähe entdecken und verbinden." },
      { title: "Court buchen & spielen", text: "Partie vereinbaren und gemeinsam aufschlagen." },
    ],
    faq: [
      {
        q: "Wie finde ich Padelpartner in meiner Nähe?",
        a: "Mit einem kostenlosen Matchup-Profil siehst du passende Padel-Spieler in deiner Region und kannst dich sofort für ein Match verbinden.",
      },
      {
        q: "Brauche ich für Padel immer vier Spieler?",
        a: "Padel wird meist im Doppel (vier Spieler) gespielt. Über Matchup findest du schnell die fehlenden Mitspieler oder trittst offenen Spielen bei.",
      },
      {
        q: "Kostet die Nutzung etwas?",
        a: "Nein, Profil erstellen und Padelpartner finden ist kostenlos.",
      },
      {
        q: "Finde ich auch Anfänger zum Padel-Spielen?",
        a: "Ja — über den Level-Filter findest du Spieler von Anfänger bis Fortgeschritten.",
      },
    ],
  },
  "pickleballpartner-finden": {
    slug: "pickleballpartner-finden",
    sport: "Pickleball",
    partnerWord: "Pickleballpartner",
    h1: "Pickleballpartner finden in deiner Nähe",
    intro:
      "Pickleball ist schnell gelernt und macht zu zweit oder zu viert am meisten Spass. Mit Matchup findest du Mitspieler in deiner Nähe — egal ob Einsteiger oder Profi — und organisierst spontane Matches mit wenigen Klicks.",
    heroImg: "/pickleball/pickleball-1.jpg",
    benefits: [
      {
        title: "Einsteiger & Profis verbinden",
        text: "Finde Mitspieler für jedes Level — perfekt zum Einstieg oder für ambitionierte Matches.",
      },
      {
        title: "Spontane Matches",
        text: "Organisiere kurzfristig Spiele in deiner Umgebung.",
      },
      {
        title: "Lokale Events entdecken",
        text: "Finde Pickleball-Treffs, Events und Turniere in deiner Nähe.",
      },
      {
        title: "Einfach & sicher",
        text: "Verifizierte Profile und einfache Organisation direkt in der App.",
      },
    ],
    steps: [
      { title: "Profil erstellen", text: "Level und Umkreis angeben — kostenlos in wenigen Minuten." },
      { title: "Entdecken & matchen", text: "Pickleball-Spieler in deiner Nähe finden und verbinden." },
      { title: "Spielen", text: "Match vereinbaren und gemeinsam auf den Court." },
    ],
    faq: [
      {
        q: "Wie finde ich Pickleballpartner in meiner Nähe?",
        a: "Erstelle ein kostenloses Matchup-Profil und du siehst sofort passende Pickleball-Spieler in deiner Region zum Verbinden.",
      },
      {
        q: "Ist Pickleball für Anfänger geeignet?",
        a: "Ja, Pickleball ist schnell zu lernen. Über Matchup findest du Mitspieler auf deinem Level — auch andere Einsteiger.",
      },
      {
        q: "Was kostet Matchup?",
        a: "Profil erstellen und Pickleballpartner finden ist kostenlos.",
      },
      {
        q: "Kann ich auch Events finden?",
        a: "Ja, du kannst lokale Pickleball-Events und Treffs entdecken oder selbst eines organisieren.",
      },
    ],
  },
};
