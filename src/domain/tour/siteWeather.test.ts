import { describe, it, expect } from "vitest";
import { campusSunDir, sunDirScene, weatherKindFromCode, weatherLook } from "./siteWeather";

describe("weatherKindFromCode", () => {
  it("ordnet WMO-Codes wie Open-Meteo", () => {
    expect(weatherKindFromCode(0)).toBe("sun");
    expect(weatherKindFromCode(2)).toBe("cloudsun");
    expect(weatherKindFromCode(45)).toBe("cloud");
    expect(weatherKindFromCode(61)).toBe("rain");
  });
});

describe("weatherLook", () => {
  it("macht Regen dunkler und nass", () => {
    const wet = weatherLook(80);
    expect(wet.rain).toBe(true);
    expect(wet.sun).toBeLessThan(weatherLook(0).sun);
  });
  it("hält den Tag wolkenlos und sonniger als Regen", () => {
    expect(weatherLook(0).cloudCover).toBe(0);
    expect(weatherLook(2).cloudCover).toBe(0);
    expect(weatherLook(0).sun).toBeGreaterThan(weatherLook(80).sun);
    expect(weatherLook(0).horizon.length).toBeGreaterThan(0);
  });
});

describe("sunDirScene", () => {
  it("legt Flushing-Mittag im Juni in den Süden, hoch am Himmel", () => {
    const noon = sunDirScene(40.7505, -73.847, new Date("2026-06-21T16:00:00Z"));
    expect(noon.elevation).toBeGreaterThan(1.0);
    expect(noon.y).toBeGreaterThan(0.8);
    expect(noon.z).toBeGreaterThan(0.2);
  });
  it("legt Flushing-Mitternacht unter den Horizont", () => {
    const night = sunDirScene(40.7505, -73.847, new Date("2026-06-21T04:00:00Z"));
    expect(night.elevation).toBeLessThan(0);
    expect(weatherLook(0, night.elevation).sun).toBeLessThan(0.2);
  });
});

describe("campusSunDir", () => {
  it("lässt Flushing-Mitternacht nicht schwarz werden", () => {
    const lit = campusSunDir(40.7505, -73.847, new Date("2026-06-21T04:00:00Z"));
    expect(lit.elevation).toBeGreaterThan(0.8);
    expect(weatherLook(2, lit.elevation).sky).not.toMatch(/^#1/);
  });
});
