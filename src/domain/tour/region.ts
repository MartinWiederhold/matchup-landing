/**
 * Zielregion der Tour als ISO-3166-1-alpha-2-Codes (Domain-Schicht).
 *
 * Definition: Europa ∪ Türkei/Tunesien/Ägypten/Marokko — die für einen in Europa
 * stationierten Futures-/Challenger-Spieler realistisch bereisbaren Länder.
 *
 * Diese ISO-Fassung ist die KANONISCHE Liste. In scripts/ existieren zwei ältere,
 * anders geschlüsselte Definitionen derselben Region:
 *   - scripts/wikidata-coverage.mjs          (über Wikidata-QIDs)
 *   - scripts/wikipedia-calendar-coverage.mjs (über englische Ländernamen)
 * Sie sollten später auf diese Datei zusammengeführt werden, damit es nur EINE
 * Wahrheit gibt. Inhaltlich ist die Länderliste hier identisch zu jenen.
 *
 * Bewusst enthalten: Georgien (GE), Armenien (AM) und Aserbaidschan (AZ) zählen zur
 * Region — für einen europäischen Futures-Spieler gut erreichbar. Nicht als Versehen
 * streichen.
 */

export const TARGET_REGION: ReadonlySet<string> = new Set([
  // Europa
  "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IS", "IE", "IT", "XK", "LV", "LI", "LT", "LU", "MT", "MD", "MC",
  "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SE",
  "CH", "UA", "GB",
  // Kaukasus — bewusst zur Region gezählt (siehe Datei-Kommentar).
  "GE", "AM", "AZ",
  // Nordafrika / Vorderasien der Zielregion.
  "TR", "TN", "EG", "MA",
]);

/** Liegt ein Land (ISO-3166-1-alpha-2) in der Zielregion? */
export function isTargetRegion(country: string | null | undefined): boolean {
  return country != null && TARGET_REGION.has(country);
}
