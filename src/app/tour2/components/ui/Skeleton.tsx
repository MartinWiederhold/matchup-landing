/**
 * Ladezustand — Platzhalter in Kartenform. Statisch, ohne Zuck-Animation
 * (kein Shimmer, kein Pulsieren), damit die Wartezeit sich ruhig anfühlt.
 * Größe wird über width/height oder Tailwind-Klassen gesteuert.
 *
 * NICHT für endgültige Leerzustände — dafür EmptyState.
 */
export type SkeletonProps = {
  width?: string;   // z. B. "100%" oder "8rem"
  height?: string;  // z. B. "1rem"
  className?: string;
  rounded?: "sm" | "md" | "full";
};

export function Skeleton({ width = "100%", height = "1rem", className = "", rounded = "sm" }: SkeletonProps) {
  const radius =
    rounded === "full" ? "var(--t2-radius-full)"
      : rounded === "md" ? "var(--t2-radius-md)"
        : "var(--t2-radius-sm)";
  return (
    <div
      aria-hidden
      className={`inline-block ${className}`}
      style={{ width, height, borderRadius: radius, background: "var(--t2-surface-muted)" }}
    />
  );
}
