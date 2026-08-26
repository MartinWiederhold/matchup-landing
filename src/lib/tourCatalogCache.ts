/**
 * Sitzungs-Cache für den aktiven Turnierkatalog (tour2).
 *
 * Der Bestand ändert sich täglich (Import), nicht minütlich. Ein Tab hält eine
 * Kopie: erster Aufruf lädt paginiert, jeder weitere in derselben Sitzung
 * bekommt dasselbe Array (Referenz). Inflight-Dedup, falls Home prefetch und
 * Turniere/Saison gleichzeitig anfragen.
 *
 * Verfall: Tab-Reload / neuer JS-Kontext. Kein TTL — ein geöffneter Tab über
 * Mitternacht sieht den Stand vom ersten Load, bis neu geladen wird.
 * invalidateTourCatalog() nur für Tests oder nach einem bewussten Re-Import.
 *
 * Beobachtung: einzelne PostgREST-Seiten können unter Last von ~0,5 s auf
 * mehrere Sekunden schwanken (eine Seite >3 s gemessen). Das ist Last auf
 * der API, nicht die Client-Schleife. Falls es wiederkommt: kleinere
 * pageSize in fetchAllPaged oder Index auf (valid_to, id) prüfen — nicht
 * raten, erst messen.
 */
import { loadActiveTournaments } from "@/lib/tourPlanner";
import type { TourTournament } from "@/lib/types";

let cached: TourTournament[] | null = null;
let inflight: Promise<TourTournament[]> | null = null;

export function peekTourCatalog(): TourTournament[] | null {
  return cached;
}

export function invalidateTourCatalog(): void {
  cached = null;
  inflight = null;
}

export function getTourCatalog(): Promise<TourTournament[]> {
  if (cached) {
    mark("catalog:hit", cached.length);
    return Promise.resolve(cached);
  }
  if (!inflight) {
    const t0 = typeof performance !== "undefined" ? performance.now() : 0;
    inflight = loadActiveTournaments()
      .then((rows) => {
        cached = rows;
        inflight = null;
        mark("catalog:fetch", rows.length, Math.round((typeof performance !== "undefined" ? performance.now() : 0) - t0));
        return rows;
      })
      .catch((err) => {
        inflight = null;
        throw err;
      });
  }
  return inflight;
}

function mark(step: string, n: number, ms?: number) {
  try {
    const rec = { step, n, ms: ms ?? 0, href: typeof location !== "undefined" ? location.pathname : "", at: Date.now() };
    const prev = JSON.parse(sessionStorage.getItem("mu_t2_marks") ?? "[]") as unknown[];
    prev.push(rec);
    sessionStorage.setItem("mu_t2_marks", JSON.stringify(prev.slice(-40)));
  } catch { /* kein sessionStorage (SSR/Tests) */ }
}
