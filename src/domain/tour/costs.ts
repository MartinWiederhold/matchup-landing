/**
 * Saison-Kostenrechner als REISEKETTE (Domain-Schicht, v1).
 *
 *   Geordnete Stationen + Kostensätze  →  Posten je Station + Summe je Währung
 *   + eingesparte Anreisen gegenüber isolierter Rechnung
 *
 * Reine Funktion: keine DB, kein Netzwerk, KEINE Systemzeit (kein `new Date()`/
 * `Date.now()`). Gleiche Eingabe ⇒ gleiches Ergebnis (per Unit-Test abgesichert).
 * Rückgaben tragen nur Codes, keine Sätze — Übersetzung passiert in der UI.
 *
 * Kernidee (der eigentliche Wert): Eine Anreise fällt NUR an, wenn sich der Ort
 * gegenüber der Vorstation ändert. Drei Wochen am selben Ort (Monastir/Antalya/
 * Sharm) kosten einmal Anreise, nicht dreimal.
 *
 * Geld: ausschließlich GANZZAHLIGE Minor Units (z. B. Cent) — keine Fließkomma-
 * Zwischenwerte, damit keine Rundungsfehler entstehen. Es wird NICHT umgerechnet;
 * mehrere Währungen werden getrennt je Währung summiert (nie zusammenaddiert).
 * Fehlt ein Pflicht-Kostensatz, wird der Posten als „unbekannt" ausgewiesen, nie geschätzt.
 */

export const COST_RULES_VERSION = "v1";

/** Betrag als ganzzahlige Minor Units (z. B. Cent) plus Währungscode. */
export type Money = { amount: number; currency: string };

/** Eine geplante Station der Saison. */
export type Station = {
  place: string; // Ortsschlüssel (z. B. "TN|Monastir"); es zählt NUR die Gleichheit
  nights: number; // ganzzahlig >= 0
  entryFee?: Money | null; // optionale Meldegebühr
};

/** Kostensätze. arrival/perNight/foodPerDay sind Pflicht (fehlend → Posten unbekannt);
 *  coachPerWeek ist optional (fehlend → kein Coach-Posten). */
export type CostParams = {
  arrival?: Money | null; // Kosten einer Anreise zu einem NEUEN Ort
  perNight?: Money | null; // Kosten pro Nacht
  foodPerDay?: Money | null; // Tagespauschale Verpflegung
  coachPerWeek?: Money | null; // optionaler Coach-Anteil pro Woche
};

export type ItemCode = "arrival" | "lodging" | "food" | "coach" | "entry";

/** Ein Einzelposten: entweder bekannt (Betrag+Währung) oder als unbekannt markiert. */
export type LineItem =
  | { code: ItemCode; amount: number; currency: string; unknown?: false }
  | { code: "arrival" | "lodging" | "food"; unknown: true };

/** Summe je Währung: Währungscode → ganzzahlige Minor Units. Nie währungsübergreifend addiert. */
export type MoneyBag = Record<string, number>;

export type StationResult = {
  place: string;
  arrivalCharged: boolean; // Anreise fällt an (Ortswechsel ggü. Vorstation bzw. erste Station)
  items: LineItem[];
  subtotal: MoneyBag; // Summe der bekannten Posten dieser Station, je Währung
  hasUnknown: boolean; // mindestens ein Posten unbekannt (fehlender Pflichtsatz)
};

export type SeasonCost = {
  rulesVersion: string;
  stations: StationResult[];
  total: MoneyBag; // Gesamtsumme über die Kette, je Währung
  currencies: string[]; // vorkommende Währungen, sortiert
  multiCurrency: boolean; // true bei > 1 Währung
  arrivalsCharged: number; // tatsächliche Anreisen (Kette)
  arrivalsIsolated: number; // Anreisen bei isolierter Rechnung (= Anzahl Stationen)
  arrivalsSaved: number; // eingesparte Anreisen (isoliert − Kette)
  hasUnknown: boolean; // irgendein Pflichtsatz fehlte
  notes: string[]; // Codes: "leere_kette", "mehrwaehrung", "unbekannte_posten"
};

/** Addiert einen Betrag in den nach Währung getrennten Beutel (reine Integer-Addition). */
function addToBag(bag: MoneyBag, m: Money): void {
  bag[m.currency] = (bag[m.currency] ?? 0) + m.amount;
}

/**
 * Berechnet die Kosten einer Saison als Reisekette.
 *
 * @param stations  geordnete Stationen (Reihenfolge = Reiseabfolge)
 * @param params    Kostensätze (mit Währung)
 */
export function computeSeasonCost(stations: Station[], params: CostParams): SeasonCost {
  const notes: string[] = [];
  const total: MoneyBag = {};
  const results: StationResult[] = [];
  let arrivalsCharged = 0;
  let anyUnknown = false;

  if (stations.length === 0) {
    return {
      rulesVersion: COST_RULES_VERSION,
      stations: [], total: {}, currencies: [], multiCurrency: false,
      arrivalsCharged: 0, arrivalsIsolated: 0, arrivalsSaved: 0,
      hasUnknown: false, notes: ["leere_kette"],
    };
  }

  let prevPlace: string | null = null;
  for (const st of stations) {
    // Anreise: erste Station immer, sonst nur bei Ortswechsel.
    const arrivalCharged = prevPlace === null || st.place !== prevPlace;
    if (arrivalCharged) arrivalsCharged++;

    const items: LineItem[] = [];
    const subtotal: MoneyBag = {};
    let stationUnknown = false;

    const known = (code: ItemCode, amount: number, currency: string) => {
      items.push({ code, amount, currency });
      subtotal[currency] = (subtotal[currency] ?? 0) + amount;
      addToBag(total, { amount, currency });
    };
    const unknown = (code: "arrival" | "lodging" | "food") => {
      items.push({ code, unknown: true });
      stationUnknown = true;
    };

    // Anreise (Pflichtsatz).
    if (arrivalCharged) {
      if (params.arrival) known("arrival", params.arrival.amount, params.arrival.currency);
      else unknown("arrival");
    }

    // Unterkunft: Nächte × Satz/Nacht (nur bei > 0 Nächten).
    if (st.nights > 0) {
      if (params.perNight) known("lodging", params.perNight.amount * st.nights, params.perNight.currency);
      else unknown("lodging");
    }

    // Verpflegung: Tagespauschale × Tage. Annahme: 1 Verpflegungstag je Nacht.
    if (st.nights > 0) {
      if (params.foodPerDay) known("food", params.foodPerDay.amount * st.nights, params.foodPerDay.currency);
      else unknown("food");
    }

    // Coach (OPTIONAL): fehlt der Satz → kein Posten (nicht „unbekannt").
    // Ganze Wochen, aufgerundet, damit keine Fließkommazahl entsteht.
    if (params.coachPerWeek && st.nights > 0) {
      const weeks = Math.ceil(st.nights / 7);
      known("coach", params.coachPerWeek.amount * weeks, params.coachPerWeek.currency);
    }

    // Meldegebühr (OPTIONAL je Station).
    if (st.entryFee) known("entry", st.entryFee.amount, st.entryFee.currency);

    if (stationUnknown) anyUnknown = true;
    results.push({ place: st.place, arrivalCharged, items, subtotal, hasUnknown: stationUnknown });
    prevPlace = st.place;
  }

  const currencies = Object.keys(total).sort();
  const multiCurrency = currencies.length > 1;
  if (multiCurrency) notes.push("mehrwaehrung");
  if (anyUnknown) notes.push("unbekannte_posten");

  const arrivalsIsolated = stations.length; // isoliert: jede Station eine eigene Anreise
  return {
    rulesVersion: COST_RULES_VERSION,
    stations: results,
    total,
    currencies,
    multiCurrency,
    arrivalsCharged,
    arrivalsIsolated,
    arrivalsSaved: arrivalsIsolated - arrivalsCharged,
    hasUnknown: anyUnknown,
    notes,
  };
}
