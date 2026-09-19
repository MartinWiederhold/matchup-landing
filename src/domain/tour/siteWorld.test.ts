import { describe, it, expect } from "vitest";
import { isOnCampus, pathBetween, projectAround, worldMatchesTournament, type SiteWorld } from "./siteWorld";

const world: SiteWorld = {
  id: "us-open",
  title: "US Open",
  year: 2026,
  origin: { lat: 40.7505, lng: -73.847 },
  match: { nameIncludes: ["us open"], sourceRefIncludes: ["usopen"] },
  nodes: [
    { id: "ashe", kind: "center", name: "Ashe", x: 0, y: 0, z: 0, source: "t" },
    { id: "arm", kind: "court", name: "Armstrong", x: 0, y: 0, z: -90, source: "t" },
    { id: "prac", kind: "practice", name: "Practice", x: 0, y: 0, z: -180, source: "t" },
  ],
  paths: [
    { from: "ashe", to: "arm" },
    { from: "arm", to: "prac" },
  ],
};

describe("worldMatchesTournament", () => {
  it("trifft auf Namen und source_ref, nicht auf andere Turniere", () => {
    expect(worldMatchesTournament(world, { name: "US Open", source_ref: "wta:ny", city: "New York" })).toBe(true);
    expect(worldMatchesTournament(world, { name: "Porto", source_ref: "atp:usopen-qual", city: "Porto" })).toBe(true);
    expect(worldMatchesTournament(world, { name: "Porto", source_ref: "wta:porto", city: "Porto" })).toBe(false);
  });
});

describe("pathBetween", () => {
  it("findet den Weg über die Kanten", () => {
    expect(pathBetween(world, "ashe", "prac")).toEqual(["ashe", "arm", "prac"]);
    expect(pathBetween(world, "ashe", "ashe")).toEqual(["ashe"]);
  });
  it("liefert leer wenn unverbunden", () => {
    expect(pathBetween(world, "ashe", "fehlt")).toEqual([]);
  });
});

describe("projectAround", () => {
  it("legt den Ursprung auf 0/0 und misst Meter", () => {
    const p = projectAround(world, 40.7505, -73.847);
    expect(p.x).toBeCloseTo(0, 0);
    expect(p.z).toBeCloseTo(0, 0);
    expect(p.meters).toBe(0);
    expect(isOnCampus(world, 40.7505, -73.847)).toBe(true);
    expect(isOnCampus(world, 40.78, -73.96)).toBe(false);
  });
});
