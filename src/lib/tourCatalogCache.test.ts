import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/tourPlanner", () => ({
  loadActiveTournaments: vi.fn(),
}));

import { loadActiveTournaments } from "@/lib/tourPlanner";
import { getTourCatalog, peekTourCatalog, invalidateTourCatalog } from "./tourCatalogCache";

const load = vi.mocked(loadActiveTournaments);

describe("tourCatalogCache", () => {
  beforeEach(() => {
    invalidateTourCatalog();
    load.mockReset();
  });

  it("lädt einmal und liefert danach dieselbe Referenz", async () => {
    const rows = [{ id: "a" }] as never;
    load.mockResolvedValue(rows);
    const a = await getTourCatalog();
    const b = await getTourCatalog();
    expect(load).toHaveBeenCalledTimes(1);
    expect(a).toBe(rows);
    expect(b).toBe(rows);
    expect(peekTourCatalog()).toBe(rows);
  });

  it("dedupliziert parallele Aufrufe", async () => {
    let release: (v: never[]) => void = () => {};
    load.mockReturnValue(new Promise((res) => { release = res; }));
    const p1 = getTourCatalog();
    const p2 = getTourCatalog();
    expect(load).toHaveBeenCalledTimes(1);
    release([{ id: "x" }] as never);
    const [a, b] = await Promise.all([p1, p2]);
    expect(a).toBe(b);
  });
});
