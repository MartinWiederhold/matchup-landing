/**
 * Anzeige-Normalisierung für Turnier-Städtenamen.
 *
 * In den Rohdaten stehen manche Städte komplett in Großbuchstaben ("PORTO",
 * "ADANA"), andere in normaler Schreibweise ("Como", "Le Neubourg"). Auf der
 * /tour2-Oberfläche soll ein einheitliches, ruhiges Bild entstehen — aber die
 * DB-Werte bleiben unangetastet (rein Anzeige-Layer).
 *
 * Regel: NUR wenn ein Name komplett in Großbuchstaben vorliegt, wird er in Title
 * Case umgewandelt. Namen mit gemischter Schreibweise (Groß- und Kleinbuchstaben)
 * bleiben unverändert — damit "Le Neubourg" oder "L'Aquila" richtig bleibt und
 * nicht in "Le Neubourg" umgeschrieben wird.
 */

export function displayCity(name: string | null | undefined): string {
  if (!name) return "";
  // Nur Buchstaben zählen; Bindestriche, Apostrophe und Ziffern sind neutral.
  const letters = name.match(/\p{L}/gu);
  if (!letters || letters.length === 0) return name;
  const allUpper = letters.every((c) => c === c.toUpperCase() && c !== c.toLowerCase());
  if (!allUpper) return name;
  // Title Case: erster Buchstabe nach Wortanfang / Leerzeichen / Bindestrich /
  // Apostroph groß, Rest klein. Deckt "SAINT-MARTIN" und "L'AQUILA" korrekt ab.
  return name.toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
}
