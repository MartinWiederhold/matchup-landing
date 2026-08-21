import { describe, it, expect } from "vitest";
import { tourDeadlines, TOUR_RULES_VERSION } from "./deadlines";

// Hilfsfunktion: erwarteter UTC-Zeitpunkt als ISO (14:00 GMT).
const iso1400 = (y: number, mo: number, d: number) =>
  new Date(Date.UTC(y, mo, d, 14, 0, 0)).toISOString();

describe("tourDeadlines – ITF Normalfall", () => {
  // 2025-06-16 ist ein Montag (verifiziert unten via getUTCDay).
  const monday = new Date(Date.UTC(2025, 5, 16));
  const r = tourDeadlines(monday, "itf_wtt");

  it("Eingabe ist tatsächlich ein Montag (kein Fehlercode)", () => {
    expect(monday.getUTCDay()).toBe(1);
    expect(r.notes).toEqual([]);
    expect(r.known).toBe(true);
    expect(r.rulesVersion).toBe(TOUR_RULES_VERSION);
  });

  it("Entry = Do, 18 T vorher, 14:00 UTC", () => {
    expect(r.entry?.toISOString()).toBe(iso1400(2025, 4, 29)); // 2025-05-29
    expect(r.entry?.getUTCDay()).toBe(4); // Donnerstag
  });

  it("Withdrawal = Di, 13 T vorher, 14:00 UTC", () => {
    expect(r.withdrawal?.toISOString()).toBe(iso1400(2025, 5, 3)); // 2025-06-03
    expect(r.withdrawal?.getUTCDay()).toBe(2); // Dienstag
  });

  it("beide Freeze-Varianten (−4 T und −11 T), je Donnerstag 14:00 UTC", () => {
    expect(r.freezeVarianteA?.toISOString()).toBe(iso1400(2025, 5, 12)); // 2025-06-12
    expect(r.freezeVarianteB?.toISOString()).toBe(iso1400(2025, 5, 5)); // 2025-06-05
    expect(r.freezeVarianteA?.getUTCDay()).toBe(4);
    expect(r.freezeVarianteB?.getUTCDay()).toBe(4);
    // Die Varianten liegen genau eine Woche auseinander.
    const diff = (r.freezeVarianteA!.getTime() - r.freezeVarianteB!.getTime()) / 86_400_000;
    expect(diff).toBe(7);
  });
});

describe("tourDeadlines – Jahreswechsel (Januar-Turnier → Dezember-Frist)", () => {
  // 2026-01-05 ist ein Montag.
  const monday = new Date(Date.UTC(2026, 0, 5));
  const r = tourDeadlines(monday, "itf_wtt");

  it("Entry fällt in den Dezember des Vorjahres", () => {
    expect(monday.getUTCDay()).toBe(1);
    expect(r.entry?.toISOString()).toBe(iso1400(2025, 11, 18)); // 2025-12-18
    expect(r.entry?.getUTCFullYear()).toBe(2025);
    expect(r.entry?.getUTCMonth()).toBe(11); // Dezember
  });

  it("Freeze-Variante B liegt ebenfalls im Vorjahr", () => {
    expect(r.freezeVarianteB?.toISOString()).toBe(iso1400(2025, 11, 25)); // 2025-12-25
  });
});

describe("tourDeadlines – Schaltjahr (Frist am 29. Februar 2024)", () => {
  // 2024-03-11 ist ein Montag; −11 T landet exakt auf dem Schalttag 2024-02-29.
  const monday = new Date(Date.UTC(2024, 2, 11));
  const r = tourDeadlines(monday, "itf_wtt");

  it("Freeze-Variante B = 2024-02-29 14:00 UTC (Schalttag)", () => {
    expect(monday.getUTCDay()).toBe(1);
    expect(r.freezeVarianteB?.toISOString()).toBe(iso1400(2024, 1, 29)); // 2024-02-29
  });

  it("Entry = 2024-02-22 (Do), Withdrawal = 2024-02-27 (Di)", () => {
    expect(r.entry?.toISOString()).toBe(iso1400(2024, 1, 22));
    expect(r.withdrawal?.toISOString()).toBe(iso1400(2024, 1, 27));
    expect(r.entry?.getUTCDay()).toBe(4);
    expect(r.withdrawal?.getUTCDay()).toBe(2);
  });
});

describe("tourDeadlines – Challenger: Regeln unbekannt", () => {
  const r = tourDeadlines(new Date(Date.UTC(2025, 5, 16)), "challenger");

  it("gibt keine erfundenen Fristen zurück, sondern null + Code", () => {
    expect(r.known).toBe(false);
    expect(r.entry).toBeNull();
    expect(r.withdrawal).toBeNull();
    expect(r.freezeVarianteA).toBeNull();
    expect(r.freezeVarianteB).toBeNull();
    expect(r.notes).toContain("regel_unbekannt");
    expect(r.rulesVersion).toBe(TOUR_RULES_VERSION);
  });
});

describe("tourDeadlines – Junioren: Standardgrad (J100), §39", () => {
  // 2025-06-16 ist ein Montag.
  const monday = new Date(Date.UTC(2025, 5, 16));
  const r = tourDeadlines(monday, "itf_juniors", "J100");

  it("Serie bekannt, unter-13-Hinweis immer gesetzt", () => {
    expect(r.known).toBe(true);
    expect(r.notes).toContain("unter_13_nicht_meldeberechtigt");
    expect(r.notes).not.toContain("entry_grad_unbekannt");
    expect(r.rulesVersion).toBe(TOUR_RULES_VERSION);
  });

  it("Entry = Di, 20 T vorher (§39 i), 14:00 UTC — anders als WTT (Do −18)", () => {
    expect(r.entry?.toISOString()).toBe(iso1400(2025, 4, 27)); // 2025-05-27
    expect(r.entry?.getUTCDay()).toBe(2); // Dienstag
  });

  it("Withdrawal = Di, 13 T vorher (§39 i) — stimmt NUR ZUFÄLLIG mit WTT überein", () => {
    expect(r.withdrawal?.toISOString()).toBe(iso1400(2025, 5, 3)); // 2025-06-03
    expect(r.withdrawal?.getUTCDay()).toBe(2); // Dienstag
  });

  it("Freeze = Mi vor der Turnierwoche (§39 vi), eindeutig (keine Variante B)", () => {
    expect(r.freezeVarianteA?.toISOString()).toBe(iso1400(2025, 5, 11)); // 2025-06-11
    expect(r.freezeVarianteA?.getUTCDay()).toBe(3); // Mittwoch
    expect(r.freezeVarianteB).toBeNull();
  });
});

describe("tourDeadlines – Junioren: J500/Grand Slam = Meldeschluss UNBEKANNT", () => {
  const monday = new Date(Date.UTC(2025, 5, 16));

  it("J500: Entry null + Code, Withdrawal/Freeze bleiben bekannt", () => {
    const r = tourDeadlines(monday, "itf_juniors", "J500");
    expect(r.known).toBe(true);
    expect(r.entry).toBeNull();
    expect(r.notes).toContain("entry_unbekannt_j500_gs");
    expect(r.withdrawal?.getUTCDay()).toBe(2);
    expect(r.freezeVarianteA?.getUTCDay()).toBe(3);
  });

  it("Grand Slam (Langform + ITF-Kürzel JGS): Entry null + selber Code", () => {
    for (const g of ["Junior Grand Slam", "JGS"]) {
      const r = tourDeadlines(monday, "itf_juniors", g);
      expect(r.entry).toBeNull();
      expect(r.notes).toContain("entry_unbekannt_j500_gs");
    }
  });

  it("unbekanntes Kürzel (z. B. GC): Entry null, aber grad_unbekannt (kein j500_gs, kein Raten)", () => {
    const r = tourDeadlines(monday, "itf_juniors", "GC");
    expect(r.entry).toBeNull();
    expect(r.notes).toContain("entry_grad_unbekannt");
  });

  it("ohne Grad: Entry null + entry_grad_unbekannt (nichts geraten)", () => {
    const r = tourDeadlines(monday, "itf_juniors");
    expect(r.entry).toBeNull();
    expect(r.notes).toContain("entry_grad_unbekannt");
  });
});

describe("tourDeadlines – Determinismus", () => {
  it("gleiche Eingabe → exakt gleiches Ergebnis", () => {
    const monday = new Date(Date.UTC(2025, 8, 22)); // Montag
    const a = tourDeadlines(monday, "itf_wtt");
    const b = tourDeadlines(monday, "itf_wtt");
    expect(a).toEqual(b);
    expect(a.rulesVersion).toBe(TOUR_RULES_VERSION);
  });
});

describe("tourDeadlines – WTA-Haupttour (Section III.A.2.a.i)", () => {
  // 2026-03-02 ist ein Montag; −28 Tage = 2026-02-02 (ebenfalls Montag).
  const monday = new Date(Date.UTC(2026, 2, 2));
  const r = tourDeadlines(monday, "wta");

  it("Entry = Montag − 28 T (4 Wochen), OHNE Uhrzeit (kein 14:00 GMT erfunden)", () => {
    expect(r.known).toBe(true);
    expect(r.entry?.toISOString().slice(0, 10)).toBe("2026-02-02");
    expect(r.entry?.getUTCHours()).toBe(0); // Datum ohne Uhrzeit — WTA-Regel nennt keine
    expect(r.entry?.getUTCDay()).toBe(1); // Montag
  });

  it("Vorbehalt + fehlende Uhrzeit als Codes; Withdrawal/Freeze null (unbelegt)", () => {
    expect(r.notes).toContain("entry_ohne_uhrzeit_wta");
    expect(r.notes).toContain("entry_kann_abweichen_wta");
    expect(r.notes).toContain("rueckzug_freeze_unbelegt_wta");
    expect(r.withdrawal).toBeNull();
    expect(r.freezeVarianteA).toBeNull();
    expect(r.freezeVarianteB).toBeNull();
  });
});
