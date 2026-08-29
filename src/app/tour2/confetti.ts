// Kleiner Konfetti-Effekt für echte Erfolge (Belohnungs-Moment beim Aufnehmen
// eines Turniers in die Saison o. Ä.). DOM-Partikel über die Web Animations API,
// keine Dependency. Respektiert prefers-reduced-motion → dann No-Op.
// Farben aus den Akzent-/Belag-Rollen, damit es zum Designsystem passt.

const COLORS = ["#5B4BF5", "#F26B3A", "#2E93F0", "#35B96A", "#E8930B", "#9B5DE5"];

export function burstConfetti(x?: number, y?: number, count = 24): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const cx = x ?? window.innerWidth / 2;
  const cy = y ?? window.innerHeight * 0.28;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.style.cssText = [
      "position:fixed", "top:0", "left:0", "z-index:9999",
      "width:8px", "height:8px", "border-radius:2px", "pointer-events:none",
      `background:${COLORS[i % COLORS.length]}`,
    ].join(";");
    document.body.appendChild(p);

    const ang = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 120;
    const dx = cx + Math.cos(ang) * dist;
    const dy = cy + Math.sin(ang) * dist - 30;
    const rot = Math.random() * 720 - 360;

    const anim = p.animate(
      [
        { transform: `translate(${cx}px, ${cy}px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${dx}px, ${dy + 160}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 500, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
    );
    const cleanup = () => p.remove();
    anim.onfinish = cleanup;
    anim.oncancel = cleanup;
  }
}
