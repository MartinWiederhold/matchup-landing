import { describe, it, expect } from "vitest";
import { mondayOfMs, seasonBounds, xForMs, weekBar, totalWidth, initialFocusMs, classifyDeadline, DAY } from "./timeline";

// Bezugsmontage (UTC): 2026-02-02, -09, -16.
const MON1 = Date.UTC(2026, 1, 2);
const MON2 = Date.UTC(2026, 1, 9);
const MON3 = Date.UTC(2026, 1, 16);

describe("mondayOfMs", () => {
  it("Montag bleibt Montag", () => {
    expect(mondayOfMs(MON1)).toBe(MON1);
  });
  it("Mittwoch/Sonntag fallen auf ihren Montag zurück", () => {
    expect(mondayOfMs(MON1 + 2 * DAY)).toBe(MON1); // Mi
    expect(mondayOfMs(MON1 + 6 * DAY)).toBe(MON1); // So
  });
});

describe("seasonBounds", () => {
  it("Grenzen aus den Daten (Montag des frühesten bis Ende der spätesten Woche)", () => {
    const b = seasonBounds([MON1, MON3], [MON2 + 3 * DAY], Date.UTC(2025, 0, 1));
    expect(b.startMs).toBe(MON1);
    expect(b.endMs).toBe(MON3 + 7 * DAY);
  });
  it("ohne Daten: die Woche um jetzt", () => {
    const b = seasonBounds([], [], MON2 + 2 * DAY);
    expect(b.startMs).toBe(MON2);
    expect(b.endMs).toBe(MON2 + 7 * DAY);
  });
});

describe("xForMs / weekBar / totalWidth", () => {
  it("x skaliert linear mit px/Tag", () => {
    expect(xForMs(MON1, MON1, 10)).toBe(0);
    expect(xForMs(MON1 + 3 * DAY, MON1, 10)).toBe(30);
  });
  it("Wochenbalken ist 7 Tage breit", () => {
    expect(weekBar(MON2, MON1, 10)).toEqual({ left: 70, width: 70 });
  });
  it("Gesamtbreite = Bereich in Tagen × px/Tag", () => {
    expect(totalWidth(MON1, MON1 + 14 * DAY, 10)).toBe(140);
  });
});

describe("initialFocusMs — Sprung zum nächsten Turnier, nicht zu heute", () => {
  it("heute vor der Saison ⇒ erstes Turnier (nicht heute)", () => {
    const now = Date.UTC(2025, 7, 1); // August, Saison ab Februar 2026
    expect(initialFocusMs(now, [MON2, MON1, MON3])).toBe(MON1);
  });
  it("mitten in der Saison ⇒ laufende/nächste Woche (Sonntag ≥ heute)", () => {
    const now = MON2 + 2 * DAY; // in Woche 2
    expect(initialFocusMs(now, [MON1, MON2, MON3])).toBe(MON2);
  });
  it("alle vorbei ⇒ letztes Turnier", () => {
    const now = MON3 + 30 * DAY;
    expect(initialFocusMs(now, [MON1, MON2, MON3])).toBe(MON3);
  });
  it("ohne Turniere ⇒ heute", () => {
    expect(initialFocusMs(MON1, [])).toBe(MON1);
  });
});

describe("classifyDeadline", () => {
  it("bevorstehend, wenn die Frist in der Zukunft liegt", () => {
    expect(classifyDeadline(true, MON2, MON1)).toBe("upcoming");
  });
  it("verstrichen, wenn die Frist vorbei ist", () => {
    expect(classifyDeadline(true, MON1, MON2)).toBe("passed");
  });
  it("unbekannt bei fehlender Frist (Challenger) — nicht als „keine Frist nötig“", () => {
    expect(classifyDeadline(false, null, MON1)).toBe("unknown");
    expect(classifyDeadline(true, null, MON1)).toBe("unknown");
  });
});
