import { describe, it, expect } from "vitest";
import { tournamentBalances, seasonMetrics, type FinanceInput } from "./finance";

const e = (tournamentId: string | null, amountMinor: number, currency: string, category: string) => ({ tournamentId, amountMinor, currency, category });
const p = (tournamentId: string, amountMinor: number, currency: string) => ({ tournamentId, amountMinor, currency });
const inc = (tournamentId: string | null, amountMinor: number, currency: string, kind: string) => ({ tournamentId, amountMinor, currency, kind });

describe("tournamentBalances – Bilanz je Turnier", () => {
  it("Ausgaben nach Posten, Einnahmen (Preisgeld + Zusatz), Saldo je Währung", () => {
    const bal = tournamentBalances({
      expenses: [e("A", 30000, "EUR", "flight"), e("A", 20000, "EUR", "hotel")],
      prizes: [p("A", 40000, "EUR")],
      income: [inc("A", 15000, "EUR", "sponsor")],
    });
    expect(bal).toHaveLength(1);
    const a = bal[0];
    expect(a.expensesTotal).toEqual({ EUR: 50000 });
    expect(a.prize).toEqual({ EUR: 40000 });
    expect(a.incomeExtraTotal).toEqual({ EUR: 15000 });
    expect(a.incomeTotal).toEqual({ EUR: 55000 });
    expect(a.balance).toEqual({ EUR: 5000 }); // 55000 − 50000
    expect(a.expensesByCategory.find((c) => c.category === "flight")?.byCurrency).toEqual({ EUR: 30000 });
  });

  it("NIE währungsübergreifend addiert: EUR und USD bleiben getrennt", () => {
    const bal = tournamentBalances({
      expenses: [e("A", 10000, "EUR", "flight"), e("A", 8000, "USD", "hotel")],
      prizes: [p("A", 5000, "USD")],
      income: [],
    });
    expect(bal[0].expensesTotal).toEqual({ EUR: 10000, USD: 8000 });
    expect(bal[0].balance).toEqual({ EUR: -10000, USD: -3000 }); // je Währung getrennt
  });

  it("allgemeine Posten ohne tournament_id erzeugen keine Turnier-Bilanz", () => {
    const bal = tournamentBalances({ expenses: [e(null, 10000, "EUR", "other")], prizes: [], income: [inc(null, 5000, "EUR", "bonus")] });
    expect(bal).toEqual([]);
  });
});

const base = (over: Partial<FinanceInput> = {}): FinanceInput => ({
  expenses: [], prizes: [], income: [], mondayByTournament: {}, points: 0, hasResults: false, ...over,
});

describe("seasonMetrics – Kennzahlen", () => {
  it("Kosten je Punkt NUR wenn Punkte > 0 (sonst null, kein Teilen durch null)", () => {
    const noPts = seasonMetrics(base({ expenses: [e("A", 60000, "EUR", "flight")], points: 0, hasResults: false }));
    expect(noPts.costPerPoint).toBeNull();
    const withPts = seasonMetrics(base({ expenses: [e("A", 60000, "EUR", "flight")], points: 30, hasResults: true }));
    expect(withPts.costPerPoint).toEqual({ EUR: 2000 }); // 60000 / 30
  });

  it("Basis: Kosten je Punkt/Turnier beruhen auf der Zahl der erfassten Turniere", () => {
    const m = seasonMetrics(base({
      expenses: [e("A", 30000, "EUR", "flight"), e("B", 30000, "EUR", "flight")],
      mondayByTournament: { A: "2026-03-02", B: "2026-03-16" },
      points: 20, hasResults: true,
    }));
    expect(m.tournamentsWithExpenses).toBe(2);
    expect(m.weeksWithExpenses).toBe(2);
    expect(m.costPerTournament).toEqual({ EUR: 30000 }); // 60000 / 2
    expect(m.costPerWeek).toEqual({ EUR: 30000 });
    expect(m.costPerPoint).toEqual({ EUR: 3000 }); // 60000 / 20
  });

  it("hasResults=false wird durchgereicht (UI sagt: keine Ergebnisse erfasst)", () => {
    expect(seasonMetrics(base({ expenses: [e("A", 1000, "EUR", "food")] })).hasResults).toBe(false);
  });

  it("Preisgeld/Kosten je Währung; ohne Kosten kein Verhältnis", () => {
    const m = seasonMetrics(base({ expenses: [e("A", 40000, "EUR", "flight")], prizes: [p("A", 20000, "EUR")] }));
    expect(m.prizeToCost).toEqual({ EUR: 0.5 });
    const noCost = seasonMetrics(base({ prizes: [p("A", 20000, "EUR")] }));
    expect(noCost.prizeToCost).toEqual({});
  });

  it("Saison-Saldo je Währung getrennt", () => {
    const m = seasonMetrics(base({
      expenses: [e("A", 10000, "EUR", "flight"), e("B", 5000, "USD", "hotel")],
      prizes: [p("A", 12000, "EUR")], income: [inc("A", 1000, "USD", "sponsor")],
    }));
    expect(m.balance).toEqual({ EUR: 2000, USD: -4000 });
    expect(m.currencies).toEqual(["EUR", "USD"]);
  });
});
