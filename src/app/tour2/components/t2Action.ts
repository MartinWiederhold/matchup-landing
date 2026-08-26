/**
 * Domain `actionBoard.ts` hardcodet /tour/setup|schengen|points|wildcards|finance|pipeline.
 * Mapping nur in der /tour2-UI — die Domain bleibt für /tour unverändert.
 */

export const T2_FINDER = "/tour2/finder";
export const T2_SEASON = "/tour2/season";
export const T2_RANKING = "/tour2/ranking";

export function tour2ActionHref(href: string): string {
  if (!href.startsWith("/tour/") || href.startsWith("/tour2/")) return href;
  const rest = href.slice("/tour/".length);
  const path = rest.split("?")[0];
  const qs = rest.slice(path.length);
  if (path === "pipeline" || path === "season" || path === "") return `${T2_SEASON}${qs}`;
  if (path === "setup") return `/tour2/profile${qs}`;
  if (path === "browse" || path === "map") return `${T2_FINDER}${qs}`;
  if (path === "wildcards") return `/tour2/network${qs}`;
  if (path === "finance") return `/tour2/travel${qs}`;
  if (path === "points") return `${T2_RANKING}${qs}`;
  return `/tour2/${rest}`;
}

export function tour2PlannerTournamentHref(id: string): string {
  return `${T2_SEASON}?id=${encodeURIComponent(id)}`;
}
