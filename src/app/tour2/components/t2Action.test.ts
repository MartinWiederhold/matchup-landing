import { describe, expect, it } from "vitest";
import { tour2ActionHref, tour2PlannerTournamentHref } from "./t2Action";

describe("tour2ActionHref", () => {
  it("mappt Domain-Routen /tour/* auf kanonische /tour2-Flächen", () => {
    expect(tour2ActionHref("/tour/setup")).toBe("/tour2/profile");
    expect(tour2ActionHref("/tour/setup?step=2")).toBe("/tour2/profile?step=2");
    expect(tour2ActionHref("/tour/browse")).toBe("/tour2/tournaments");
    expect(tour2ActionHref("/tour/map")).toBe("/tour2/tournaments");
    expect(tour2ActionHref("/tour/season")).toBe("/tour2/planner");
    expect(tour2ActionHref("/tour/schengen")).toBe("/tour2/schengen");
    expect(tour2ActionHref("/tour/points")).toBe("/tour2/points");
    expect(tour2ActionHref("/tour/wildcards")).toBe("/tour2/wildcards");
    expect(tour2ActionHref("/tour/finance")).toBe("/tour2/finance");
  });

  it("leitet pipeline auf den Saison-Planer", () => {
    expect(tour2ActionHref("/tour/pipeline")).toBe("/tour2/planner");
    expect(tour2ActionHref("/tour/")).toBe("/tour2/planner");
  });

  it("lässt /tour2 und fremde Pfade unverändert", () => {
    expect(tour2ActionHref("/tour2/setup")).toBe("/tour2/setup");
    expect(tour2ActionHref("https://example.com")).toBe("https://example.com");
  });
});

describe("tour2PlannerTournamentHref", () => {
  it("öffnet das Turnier im Planer", () => {
    expect(tour2PlannerTournamentHref("abc")).toBe("/tour2/planner?id=abc");
    expect(tour2PlannerTournamentHref("a b")).toBe("/tour2/planner?id=a%20b");
  });
});
