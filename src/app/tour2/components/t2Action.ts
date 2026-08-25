/**
 * Domain `actionBoard.ts` hardcodet /tour/setup|schengen|points|wildcards|finance|pipeline.
 * Mapping nur in der /tour2-UI — die Domain bleibt für /tour unverändert.
 * Kanonische fünf Flächen: Home, Turniere, Saison, Kalender, Profil.
 */

export function tour2ActionHref(href: string): string {
  if (!href.startsWith("/tour/") || href.startsWith("/tour2/")) return href;
  const rest = href.slice("/tour/".length);
  const path = rest.split("?")[0];
  const qs = rest.slice(path.length);
  if (path === "pipeline" || path === "season" || path === "") return `/tour2/planner${qs}`;
  if (path === "setup") return `/tour2/profile${qs}`;
  if (path === "browse" || path === "map") return `/tour2/tournaments${qs}`;
  return `/tour2/${rest}`;
}

export function tour2PlannerTournamentHref(id: string): string {
  return `/tour2/planner?id=${encodeURIComponent(id)}`;
}
