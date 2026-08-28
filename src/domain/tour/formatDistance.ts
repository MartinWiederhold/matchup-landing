/**
 * Einheitliche Distanz-Anzeige für /tour2. Nimmt Kilometer als Zahl und liefert
 * einen anzeigefertigen Text. Zwei Rundungsstufen:
 *   < 10 km  → eine Nachkommastelle („4.2 km")
 *   ≥ 10 km  → ganze Kilometer („1 234 km")
 *
 * Die Rundung ist mathematisch (`Math.round`), nicht kaufmännisch/bankers —
 * ausreichend genau für Reise-Kilometer, deterministisch testbar.
 *
 * NaN und negative Werte gelten als „nicht bekannt" und werden auf einen
 * einzelnen Bindestrich abgebildet, damit die UI nicht mit einer Zahl lügt.
 */

export function formatDistanceKm(km: number, locale: string = "de-CH"): string {
  if (!Number.isFinite(km) || km < 0) return "—";
  if (km < 10) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(km)} km`;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(km))} km`;
}
