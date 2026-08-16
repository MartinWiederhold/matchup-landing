import { describe, it, expect } from "vitest";
import { buildActionBoard, type BoardInput, type BoardTournament, type ActionItem } from "./actionBoard";

const ASOF = "2026-08-16";
const base: BoardTournament = {
  id: "t", city: "Wien", country: "AT", monday: "2026-09-07", series: "itf_wtt",
  status: "planned", alternatePosition: null, feePaid: true, decision: "play", inactive: false, alternateObs: [],
};
const T = (o: Partial<BoardTournament>): BoardTournament => ({ ...base, ...o });
const IN = (o: Partial<BoardInput>): BoardInput => ({
  asOf: ASOF, tournaments: [], banned: [], docWarnings: [], schengen: null, points: null, wildcards: [], budgetOver: null, ...o,
});
const kinds = (a: ActionItem[]) => a.map((x) => x.kind);
const find = (a: ActionItem[], k: string) => a.find((x) => x.kind === k);

describe("buildActionBoard – Fristen", () => {
  it("Meldefrist verpasst → ROT (bereits eingetreten)", () => {
    // Montag 2026-08-24 → Entry 2026-08-06 (< asOf), Status planned → verpasst.
    const b = buildActionBoard(IN({ tournaments: [T({ monday: "2026-08-24" })] }));
    const m = find(b.actions, "entry_missed")!;
    expect(m.severity).toBe("red");
    expect(m.target).toEqual({ type: "tournament", id: "t" });
  });

  it("Meldefrist naht (in 4 Tagen) → BERNSTEIN, NICHT rot", () => {
    // Montag 2026-09-07 → Entry 2026-08-20 (asOf+4).
    const b = buildActionBoard(IN({ tournaments: [T({ monday: "2026-09-07" })] }));
    const e = find(b.actions, "entry_deadline")!;
    expect(e.severity).toBe("amber");
    expect(e.params.days).toBe(4);
  });

  it("Rot-Präzisierung: Frist MORGEN ist Bernstein, nicht Rot", () => {
    // Entry morgen (asOf+1): Montag = asOf + 19 Tage = 2026-09-04.
    const b = buildActionBoard(IN({ tournaments: [T({ monday: "2026-09-04" })] }));
    expect(find(b.actions, "entry_deadline")!.severity).toBe("amber");
    expect(find(b.actions, "entry_missed")).toBeUndefined();
  });

  it("bewusst zurückgestellt (decision=wait) → keine Frist-Mahnung", () => {
    const b = buildActionBoard(IN({ tournaments: [T({ monday: "2026-08-24", decision: "wait" })] }));
    expect(find(b.actions, "entry_missed")).toBeUndefined();
  });

  it("Rückzugsfrist naht bei gemeldetem Turnier → BERNSTEIN", () => {
    // Montag 2026-08-31 → Withdrawal 2026-08-18 (asOf+2), Status entered.
    const b = buildActionBoard(IN({ tournaments: [T({ monday: "2026-08-31", status: "entered" })] }));
    expect(find(b.actions, "withdrawal_deadline")!.severity).toBe("amber");
  });
});

describe("buildActionBoard – Status/Gebühr/Sperre", () => {
  it("Meldegebühr offen bei gemeldetem Turnier → BERNSTEIN", () => {
    const b = buildActionBoard(IN({ tournaments: [T({ monday: "2026-11-02", status: "main_draw", feePaid: false })] }));
    expect(find(b.actions, "fee_unpaid")!.severity).toBe("amber");
  });

  it("Einreise gesperrt bei geplantem Turnier → ROT", () => {
    const b = buildActionBoard(IN({ tournaments: [T({ id: "x", monday: "2026-11-02", country: "RU" })], banned: ["RU"] }));
    const banned = find(b.actions, "entry_banned")!;
    expect(banned.severity).toBe("red");
    expect(banned.target).toEqual({ type: "tournament", id: "x" });
  });

  it("Alternate bewegt sich → BERNSTEIN mit Richtung", () => {
    const b = buildActionBoard(IN({ tournaments: [T({ status: "alternate", alternatePosition: 7, alternateObs: [
      { observedAt: "2026-08-12", alternatePosition: 12 }, { observedAt: "2026-08-15", alternatePosition: 7 },
    ] })] }));
    const alt = find(b.actions, "alternate_moving")!;
    expect(alt.severity).toBe("amber");
    expect(alt.params.dir).toBe("up");
  });
});

describe("buildActionBoard – Dokumente / Schengen / Punkte / Wildcard", () => {
  it("Dokument abgelaufen → ROT, läuft ab → BERNSTEIN, jeweils → /tour/setup", () => {
    const b = buildActionBoard(IN({ docWarnings: [
      { kind: "passport_expired", severity: "error", date: "2026-01-01" },
      { kind: "insurance_expiring", severity: "warn", date: "2026-09-30", days: 45 },
    ] }));
    expect(find(b.actions, "doc_expired")!.severity).toBe("red");
    expect(find(b.actions, "doc_expiring")!.severity).toBe("amber");
    expect(find(b.actions, "doc_expired")!.target).toEqual({ type: "route", href: "/tour/setup" });
  });

  it("Schengen überschritten → ROT, knapp → BERNSTEIN", () => {
    expect(find(buildActionBoard(IN({ schengen: { exceeds: true, used: 95, left: 0 } })).actions, "schengen_exceeded")!.severity).toBe("red");
    expect(find(buildActionBoard(IN({ schengen: { exceeds: false, used: 80, left: 10 } })).actions, "schengen_near")!.severity).toBe("amber");
  });

  it("Punkte verfallen demnächst → BERNSTEIN → /tour/points; Spieler-Block trägt Stand", () => {
    const b = buildActionBoard(IN({ points: { total: 133, nextExpiry: { date: "2026-08-31", points: 8 }, expiringSoon: { date: "2026-08-31", points: 8 } } }));
    expect(find(b.actions, "points_expiring")!.target).toEqual({ type: "route", href: "/tour/points" });
    expect(b.player).toEqual({ total: 133, nextExpiry: { date: "2026-08-31", points: 8 } });
  });

  it("Wildcard-Anfrage ohne Antwort seit >14 Tagen → BERNSTEIN; frisch/beantwortet → nichts", () => {
    const stale = buildActionBoard(IN({ wildcards: [{ tournamentName: "Wien", tournamentId: null, requestedOn: "2026-07-20", outcome: "pending" }] }));
    expect(find(stale.actions, "wildcard_no_answer")!.severity).toBe("amber");
    const fresh = buildActionBoard(IN({ wildcards: [{ tournamentName: "Wien", tournamentId: null, requestedOn: "2026-08-10", outcome: "pending" }] }));
    expect(find(fresh.actions, "wildcard_no_answer")).toBeUndefined();
    const answered = buildActionBoard(IN({ wildcards: [{ tournamentName: "Wien", tournamentId: null, requestedOn: "2026-07-01", outcome: "granted" }] }));
    expect(find(answered.actions, "wildcard_no_answer")).toBeUndefined();
  });
});

describe("buildActionBoard – Ordnung, Kopf-Blöcke, Leerstand", () => {
  it("ROT steht vor BERNSTEIN", () => {
    const b = buildActionBoard(IN({
      tournaments: [T({ id: "soon", monday: "2026-09-07" })], // amber entry_deadline
      schengen: { exceeds: true, used: 95, left: 0 }, // red
    }));
    expect(b.actions[0].severity).toBe("red");
    expect(b.actions[b.actions.length - 1].severity).toBe("amber");
  });

  it("Aktuell = Turnier dieser Woche; Nächste Wochen = die folgenden", () => {
    const b = buildActionBoard(IN({ tournaments: [
      T({ id: "now", monday: "2026-08-10", decision: "wait" }), // enthält asOf (10.–16.08.)
      T({ id: "next", monday: "2026-08-24", decision: "wait" }),
    ] }));
    expect(b.current?.id).toBe("now");
    expect(b.upcoming.map((w) => w.id)).toEqual(["next"]);
  });

  it("nichts zu tun → clear true, keine actions", () => {
    const b = buildActionBoard(IN({ tournaments: [T({ monday: "2026-08-10", decision: "wait", status: "confirmed", feePaid: true })] }));
    expect(b.actions).toEqual([]);
    expect(b.clear).toBe(true);
  });

  it("ungültiger Stichtag → leeres Board, kein Werfen", () => {
    const b = buildActionBoard(IN({ asOf: "kaputt", tournaments: [T({})] }));
    expect(b.clear).toBe(true);
    expect(b.current).toBeNull();
  });
});
