/** Kurze Messpunkte für /tour2 (sessionStorage mu_t2_marks). */

export function t2markNavStart() {
  try {
    sessionStorage.setItem("mu_t2_nav0", String(performance.now()));
  } catch { /* egal */ }
}

export function t2markArea(area: string) {
  try {
    const now = performance.now();
    const nav0 = parseFloat(sessionStorage.getItem("mu_t2_nav0") ?? "");
    const switchMs = Number.isFinite(nav0) ? Math.round(now - nav0) : undefined;
    sessionStorage.removeItem("mu_t2_nav0");
    const rec = { step: `area:${area}`, ms: Math.round(now), switchMs, href: location.pathname, at: Date.now() };
    const prev = JSON.parse(sessionStorage.getItem("mu_t2_marks") ?? "[]") as unknown[];
    prev.push(rec);
    sessionStorage.setItem("mu_t2_marks", JSON.stringify(prev.slice(-40)));
  } catch { /* egal */ }
}
