/**
 * Einheitliche Geldformatierung für /tour2. Nimmt Minor-Einheiten (Cent) und
 * die Währung, liefert eine anzeigefertige Zeichenkette wie „€1'234" oder
 * „$1,234". Locale-abhängig für Tausendertrenner und Symbol-Position, aber
 * OHNE Nachkommastellen: die App zeigt Beträge gerundet auf ganze Einheiten.
 *
 * Reine Funktion — kein Zugriff auf globale Uhren, keine Seiteneffekte. Damit
 * deterministisch testbar. Die tabellarische Ziffern-Anzeige läuft über CSS
 * (`.t2-num` / `font-variant-numeric: tabular-nums`), nicht über den String.
 */

export function formatMoney(amountMinor: number, currency: string, locale: string = "de-CH"): string {
  const value = amountMinor / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
