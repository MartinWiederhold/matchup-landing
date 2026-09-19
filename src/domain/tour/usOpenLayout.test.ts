import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { nodeById, type SiteWorld } from "./siteWorld";

const world = JSON.parse(
  readFileSync(new URL("../../app/tour2/worlds/us-open.json", import.meta.url), "utf8"),
) as SiteWorld;

function dist(a: string, b: string): number {
  const na = nodeById(world, a);
  const nb = nodeById(world, b);
  if (!na || !nb) throw new Error(`${a}/${b}`);
  return Math.hypot(nb.x - na.x, nb.z - na.z);
}

describe("US-Open-Lage gegen Grounds Map", () => {
  it("setzt Armstrong NNO an Ashe, nicht weit nördlich", () => {
    const arm = nodeById(world, "armstrong");
    const ashe = nodeById(world, "ashe");
    expect(arm && ashe).toBeTruthy();
    if (!arm || !ashe) return;
    expect(arm.x).toBeGreaterThan(ashe.x);
    expect(arm.z).toBeLessThan(ashe.z);
    const d = dist("ashe", "armstrong");
    expect(d).toBeGreaterThan(55);
    expect(d).toBeLessThan(95);
  });

  it("legt Grandstand westlich und Stadium 17 östlich", () => {
    const gs = nodeById(world, "grandstand");
    const c17 = nodeById(world, "court17");
    const ashe = nodeById(world, "ashe");
    expect(gs && c17 && ashe).toBeTruthy();
    if (!gs || !c17 || !ashe) return;
    expect(gs.x).toBeLessThan(ashe.x - 100);
    expect(c17.x).toBeGreaterThan(ashe.x + 120);
    expect(c17.z).toBeGreaterThan(ashe.z);
  });

  it("hält Food Village zwischen Ashe und 17, nördlich der Südreihe", () => {
    const fv = nodeById(world, "food-village");
    const c12 = nodeById(world, "court12");
    const c15 = nodeById(world, "court15");
    expect(fv && c12 && c15).toBeTruthy();
    if (!fv || !c12 || !c15) return;
    expect(fv.x).toBeGreaterThan(40);
    expect(fv.x).toBeLessThan(120);
    expect(fv.z).toBeLessThan(c12.z);
    expect(c15.z).toBeGreaterThan(c12.z);
  });
});
