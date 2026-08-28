import { formatMoney } from "@/domain/tour/formatMoney";

/**
 * Geldbetrag — einheitliche Anzeige eines Minor-Betrags (Cent) mit Währung
 * und tabellarischen Ziffern. Die eigentliche Formatierung liegt in
 * src/domain/tour/formatMoney; diese Komponente ist nur das Vor-Ort-Anzeigen.
 *
 * NICHT für Beträge ohne Währungskontext (z. B. rein technische Zähler)
 * verwenden — dafür reicht ein `<span className="tabular-nums">…</span>`.
 */
export type MoneyProps = {
  amountMinor: number;
  currency: string;
  locale?: string;
  className?: string;
};

export function Money({ amountMinor, currency, locale, className = "" }: MoneyProps) {
  return <span className={`tabular-nums ${className}`}>{formatMoney(amountMinor, currency, locale)}</span>;
}
