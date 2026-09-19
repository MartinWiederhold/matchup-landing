/**
 * Autorisierte Turnier-Welten. v1: nur US Open.
 */

import type { SiteTournamentHint, SiteWorld } from "@/domain/tour/siteWorld";
import { worldMatchesTournament } from "@/domain/tour/siteWorld";
import usOpen from "./us-open.json";

const WORLDS: SiteWorld[] = [usOpen as SiteWorld];

export function authoredWorlds(): SiteWorld[] {
  return WORLDS;
}

export function worldById(id: string): SiteWorld | null {
  return WORLDS.find((w) => w.id === id) ?? null;
}

export function worldForTournament(t: SiteTournamentHint): SiteWorld | null {
  return WORLDS.find((w) => worldMatchesTournament(w, t)) ?? null;
}
