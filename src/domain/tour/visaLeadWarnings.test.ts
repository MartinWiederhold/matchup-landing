import { describe, it, expect } from "vitest";
import { visaLeadWarnings, type LeadDoc, type LeadTournament } from "./visaLeadWarnings";

const asOf = "2026-08-18";
// India-Visum: Nutzer rechnet mit 6 Wochen, hat es noch nicht.
const indiaDoc: LeadDoc = { scope: "IN", status: "none", valid_until: null, lead_weeks: 6 };
const tour = (over: Partial<LeadTournament> = {}): LeadTournament => ({ id: "t1", city: "Pune", country: "IN", monday: "2026-09-15", ...over });

describe("visaLeadWarnings", () => {
  it("warnt, wenn das Turnier näher liegt als die Vorlaufzeit und das Dokument fehlt", () => {
    // 2026-08-18 → 2026-09-15 sind 4 Wochen; Vorlauf 6 → Warnung.
    const w = visaLeadWarnings({ asOf, tournaments: [tour()], docs: [indiaDoc] });
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ tournamentId: "t1", dest: "IN", weeksUntil: 4, leadWeeks: 6 });
  });

  it("warnt NICHT, wenn genug Vorlauf bleibt", () => {
    const w = visaLeadWarnings({ asOf, tournaments: [tour({ monday: "2026-11-30" })], docs: [indiaDoc] });
    expect(w).toHaveLength(0);
  });

  it("warnt NICHT, wenn das Dokument bereits vorhanden ist", () => {
    const have: LeadDoc = { scope: "IN", status: "have", valid_until: "2027-01-01", lead_weeks: 6 };
    expect(visaLeadWarnings({ asOf, tournaments: [tour()], docs: [have] })).toHaveLength(0);
  });

  it("warnt NICHT ohne gesetzte Vorlaufzeit (keine Nutzerangabe → keine Warnung)", () => {
    const noLead: LeadDoc = { scope: "IN", status: "none", valid_until: null, lead_weeks: null };
    expect(visaLeadWarnings({ asOf, tournaments: [tour()], docs: [noLead] })).toHaveLength(0);
  });

  it("ignoriert vergangene Turniere", () => {
    expect(visaLeadWarnings({ asOf, tournaments: [tour({ monday: "2026-07-01" })], docs: [indiaDoc] })).toHaveLength(0);
  });

  it("matcht ein Schengen-Visum über den Raum (ISO2-Land im Schengen-Raum)", () => {
    const schengenDoc: LeadDoc = { scope: "SCHENGEN", status: "applied", valid_until: null, lead_weeks: 8 };
    const w = visaLeadWarnings({ asOf, tournaments: [tour({ id: "fr", city: "Paris", country: "FR", monday: "2026-09-15" })], docs: [schengenDoc] });
    expect(w).toHaveLength(1);
    expect(w[0].dest).toBe("FR");
  });

  it("sortiert nach Dringlichkeit (wenigste Wochen zuerst)", () => {
    const docs = [indiaDoc, { scope: "US", status: "none", valid_until: null, lead_weeks: 10 } as LeadDoc];
    const w = visaLeadWarnings({
      asOf,
      tournaments: [tour({ id: "far", country: "IN", monday: "2026-09-15" }), tour({ id: "near", city: "NY", country: "US", monday: "2026-08-25" })],
      docs,
    });
    expect(w.map((x) => x.tournamentId)).toEqual(["near", "far"]);
  });
});
