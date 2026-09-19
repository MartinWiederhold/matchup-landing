import { describe, it, expect } from "vitest";
import { weatherKindFromCode, weatherLook } from "./siteWeather";

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
});
