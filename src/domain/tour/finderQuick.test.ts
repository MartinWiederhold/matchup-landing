import { describe, it, expect } from "vitest";
import {
  finderCircuit, isNextNWeeks, isOnMyRoute, isLowTravelCost, venueCounts, isClusterVenue,
  isDeadlineOpen, ON_ROUTE_KM, addUtcDays,
} from "./finderQuick";
import type { TourTournament } from "@/lib/types";

function tt(p: Partial<TourTournament>): TourTournament {
  return {
    id: "x", source_ref: "itf:m-itf-tun-2025-032", tournament_monday: "2026-06-15",
    series: "itf_wtt", category: "M15", category_recognized: true, name: null,
    city: "Tunis", country: "TN", latitude: 36.8, longitude: 10.18, surface: "clay",
    indoor: false, prize_money: null, prize_currency: null, website: null,
    status: "confirmed", valid_from: "2026-01-01", valid_to: null,
    created_at: "", updated_at: "",
    ...p,
  };
}

describe("finderCircuit", () => {
  it("W15 ist ITF Damen, M25 ITF Herren", () => {
    expect(finderCircuit(tt({ category: "W15" }))).toBe("itf_w");
    expect(finderCircuit(tt({ category: "M25" }))).toBe("itf_m");
  });
  it("Serie schlägt Kategorie", () => {
    expect(finderCircuit(tt({ series: "wta", category: "WTA 250" }))).toBe("wta");
    expect(finderCircuit(tt({ series: "challenger", category: "Challenger 75" }))).toBe("challenger");
    expect(finderCircuit(tt({ series: "itf_juniors", category: "J100" }))).toBe("juniors");
  });
  it("ohne Kategorie aus source_ref", () => {
    expect(finderCircuit(tt({ category: null, source_ref: "itf:w-itf-esp-2026-001" }))).toBe("itf_w");
  });
  it("unbekannt bleibt null", () => {
    expect(finderCircuit(tt({ series: "itf_wtt", category: null, source_ref: "other:xyz" }))).toBeNull();
  });
});

describe("Schnellfilter", () => {
  it("nächste 4 Wochen", () => {
    expect(isNextNWeeks("2026-09-14", "2026-08-26", 4)).toBe(true);
    expect(isNextNWeeks("2026-10-05", "2026-08-26", 4)).toBe(false);
    expect(isNextNWeeks("2026-08-24", "2026-08-26", 4)).toBe(false);
  });
  it("auf der Route: gleicher Ort und 60-km-Schwelle", () => {
    const season = [tt({ latitude: 36.8, longitude: 10.18 })];
    expect(isOnMyRoute(tt({ latitude: 36.85, longitude: 10.2 }), season)).toBe(true);
    expect(isOnMyRoute(tt({ latitude: 48.2, longitude: 16.37 }), season)).toBe(false);
    expect(ON_ROUTE_KM).toBe(60);
  });
  it("günstige Anreise = gleicher placeKey", () => {
    const season = [tt({ city: "Monastir", country: "TN" })];
    expect(isLowTravelCost(tt({ city: "Monastir", country: "TN" }), season)).toBe(true);
    expect(isLowTravelCost(tt({ city: "Tunis", country: "TN" }), season)).toBe(false);
  });
  it("Cluster = Ort kommt mindestens zweimal vor", () => {
    const rows = [tt({ city: "A", country: "ES" }), tt({ id: "b", city: "A", country: "ES" }), tt({ id: "c", city: "B", country: "ES" })];
    const c = venueCounts(rows);
    expect(isClusterVenue(rows[0], c)).toBe(true);
    expect(isClusterVenue(rows[2], c)).toBe(false);
  });
  it("Meldeschluss offen nur mit bekanntem Entry in der Zukunft", () => {
    // 2026-06-15 Montag → ITF Entry Do −18
    const now = Date.parse("2026-05-20T00:00:00Z");
    expect(isDeadlineOpen(tt({ tournament_monday: "2026-06-15", series: "itf_wtt" }), now)).toBe(true);
    expect(isDeadlineOpen(tt({ tournament_monday: "2026-06-15", series: "itf_wtt" }), Date.parse("2026-06-14T00:00:00Z"))).toBe(false);
    expect(isDeadlineOpen(tt({ series: "challenger" }), now)).toBe(false);
  });
  it("addUtcDays über Monatsgrenze", () => {
    expect(addUtcDays("2026-08-26", 7)).toBe("2026-09-02");
  });
});
