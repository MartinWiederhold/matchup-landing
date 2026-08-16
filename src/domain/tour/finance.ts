/**
 * Turnier-Bilanz + Saison-Kennzahlen — die reine Rechnung.
 *
 * Kein Netz, keine DB. Alle Beträge in CENT (ganzzahlig, exakt). PROJEKTREGEL: NIE
 * währungsübergreifend addieren — jede Summe ist ein Objekt { Währung → Cent }.
 *
 * Die Bilanz je Turnier: Ausgaben (nach Posten) gegen Einnahmen (Preisgeld aus tour_prize
 * PLUS Zusatzposten aus tour_income), Saldo je Währung. Die Kennzahlen laufen über die
 * Saison. „Kosten je ATP-Punkt" trägt bewusst die BASIS mit (auf wie vielen erfassten
 * Turnieren sie beruht) — sonst wirkt eine Erfassungslücke wie ein gutes Ergebnis. Ohne
 * erfasste Ergebnisse (oder ohne zählende Punkte) wird NICHT geteilt: costPerPoint = null.
 *
 * Keine bestehende Domain-Datei geändert — points.ts liefert die Punkte extern (countingTotal).
 */

/** Geld je Währung, in Cent. Nie währungsübergreifend addiert. */
export type Money = Record<string, number>;

const add = (m: Money, currency: string, minor: number) => { m[currency] = (m[currency] ?? 0) + minor; };
const isoWeekKey = (mondayIso: string) => mondayIso.slice(0, 10); // Turniermontag identifiziert die Woche

export type ExpenseItem = { tournamentId: string | null; amountMinor: number; currency: string; category: string };
export type PrizeItem = { tournamentId: string; amountMinor: number; currency: string };
export type IncomeItem = { tournamentId: string | null; amountMinor: number; currency: string; kind: string };

export type TournamentBalance = {
  tournamentId: string;
  expensesByCategory: { category: string; byCurrency: Money }[];
  expensesTotal: Money;
  prize: Money;            // Preisgeld (tour_prize)
  incomeByKind: { kind: string; byCurrency: Money }[]; // Zusatzeinnahmen (tour_income)
  incomeExtraTotal: Money; // Zusatz ohne Preisgeld
  incomeTotal: Money;      // Preisgeld + Zusatz
  balance: Money;          // incomeTotal − expensesTotal, je Währung
};

export type SeasonMetrics = {
  currencies: string[];        // alle vorkommenden Währungen (sortiert)
  expensesTotal: Money;
  prizeTotal: Money;
  incomeTotal: Money;
  balance: Money;
  tournamentsWithExpenses: number; // Basis für „Kosten je Turnier" UND „Kosten je Punkt"
  weeksWithExpenses: number;
  points: number;
  hasResults: boolean;
  costPerPoint: Money | null;      // null, wenn points === 0 (kein Teilen durch null)
  costPerTournament: Money;        // {} wenn keine erfassten Turniere
  costPerWeek: Money;
  prizeToCost: Record<string, number>; // Preisgeld/Kosten je Währung (nur wo Kosten > 0)
};

export type FinanceInput = {
  expenses: ExpenseItem[];
  prizes: PrizeItem[];
  income: IncomeItem[];
  mondayByTournament: Record<string, string>; // tournamentId → ISO-Montag (für Wochenzählung)
  points: number;       // countingTotal aus scorePoints
  hasResults: boolean;  // wurden überhaupt Match-Ergebnisse erfasst?
};

function totalOf(money: Money[]): Money {
  const out: Money = {};
  for (const m of money) for (const c of Object.keys(m)) add(out, c, m[c]);
  return out;
}

/** Bilanz je Turnier (nur Turniere mit tournament_id — allgemeine Posten fließen nur in die Saison). */
export function tournamentBalances(input: Pick<FinanceInput, "expenses" | "prizes" | "income">): TournamentBalance[] {
  const ids = new Set<string>();
  for (const e of input.expenses) if (e.tournamentId) ids.add(e.tournamentId);
  for (const p of input.prizes) if (p.tournamentId) ids.add(p.tournamentId);
  for (const i of input.income) if (i.tournamentId) ids.add(i.tournamentId);

  const out: TournamentBalance[] = [];
  for (const id of ids) {
    // Ausgaben nach Posten (Kategorie → Währung → Cent).
    const catMap = new Map<string, Money>();
    for (const e of input.expenses) {
      if (e.tournamentId !== id) continue;
      const m = catMap.get(e.category) ?? {};
      add(m, e.currency, e.amountMinor);
      catMap.set(e.category, m);
    }
    const expensesByCategory = [...catMap.entries()].map(([category, byCurrency]) => ({ category, byCurrency }));
    const expensesTotal = totalOf(expensesByCategory.map((x) => x.byCurrency));

    const prize: Money = {};
    for (const p of input.prizes) if (p.tournamentId === id) add(prize, p.currency, p.amountMinor);

    const kindMap = new Map<string, Money>();
    for (const i of input.income) {
      if (i.tournamentId !== id) continue;
      const m = kindMap.get(i.kind) ?? {};
      add(m, i.currency, i.amountMinor);
      kindMap.set(i.kind, m);
    }
    const incomeByKind = [...kindMap.entries()].map(([kind, byCurrency]) => ({ kind, byCurrency }));
    const incomeExtraTotal = totalOf(incomeByKind.map((x) => x.byCurrency));
    const incomeTotal = totalOf([prize, incomeExtraTotal]);

    const balance: Money = {};
    for (const c of new Set([...Object.keys(incomeTotal), ...Object.keys(expensesTotal)])) {
      balance[c] = (incomeTotal[c] ?? 0) - (expensesTotal[c] ?? 0);
    }
    out.push({ tournamentId: id, expensesByCategory, expensesTotal, prize, incomeByKind, incomeExtraTotal, incomeTotal, balance });
  }
  // Deterministisch nach id.
  return out.sort((a, b) => (a.tournamentId < b.tournamentId ? -1 : a.tournamentId > b.tournamentId ? 1 : 0));
}

/** Saison-Kennzahlen (je Währung; Punkte-Kennzahl mit Basis + Null-Schutz). */
export function seasonMetrics(input: FinanceInput): SeasonMetrics {
  const expensesTotal = totalOf(input.expenses.map((e) => ({ [e.currency]: e.amountMinor })));
  const prizeTotal = totalOf(input.prizes.map((p) => ({ [p.currency]: p.amountMinor })));
  const incomeExtra = totalOf(input.income.map((i) => ({ [i.currency]: i.amountMinor })));
  const incomeTotal = totalOf([prizeTotal, incomeExtra]);
  const balance: Money = {};
  for (const c of new Set([...Object.keys(incomeTotal), ...Object.keys(expensesTotal)])) balance[c] = (incomeTotal[c] ?? 0) - (expensesTotal[c] ?? 0);

  // Basis: nur Turniere MIT erfassten Ausgaben (die schmeichelhafte Zahl kommt sonst von Lücken).
  const tournamentsWithExpenses = new Set(input.expenses.map((e) => e.tournamentId).filter((x): x is string => !!x));
  const weeks = new Set([...tournamentsWithExpenses].map((id) => input.mondayByTournament[id]).filter((m): m is string => !!m).map(isoWeekKey));
  const nT = tournamentsWithExpenses.size;
  const nW = weeks.size;

  const perScalar = (total: Money, n: number): Money => {
    if (n <= 0) return {};
    const out: Money = {};
    for (const c of Object.keys(total)) out[c] = Math.round(total[c] / n);
    return out;
  };
  const costPerPoint = input.points > 0 ? perScalar(expensesTotal, input.points) : null; // kein Teilen durch null
  const prizeToCost: Record<string, number> = {};
  for (const c of Object.keys(expensesTotal)) if (expensesTotal[c] > 0 && prizeTotal[c] != null) prizeToCost[c] = prizeTotal[c] / expensesTotal[c];

  const currencies = [...new Set([...Object.keys(expensesTotal), ...Object.keys(incomeTotal)])].sort();
  return {
    currencies, expensesTotal, prizeTotal, incomeTotal, balance,
    tournamentsWithExpenses: nT, weeksWithExpenses: nW,
    points: input.points, hasResults: input.hasResults,
    costPerPoint, costPerTournament: perScalar(expensesTotal, nT), costPerWeek: perScalar(expensesTotal, nW), prizeToCost,
  };
}
