/**
 * Formatiert einen ISO-Timestamp relativ ("vor 2 Min.", "vor 3 Std.", "Gestern", etc.)
 */
export function timeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Jetzt";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  if (diffHrs < 24) return `vor ${diffHrs} Std.`;
  if (diffDays < 7) return `vor ${diffDays} T.`;
  return new Date(isoString).toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Formatiert Distanz: "0.3 km", "12 km", "142 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * Formatiert Datum für Events: "Sa, 28. Juni 2026 · 10:00"
 */
export function formatEventDate(isoString: string): string {
  const d = new Date(isoString);
  const day = d.toLocaleDateString("de-CH", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

/**
 * Prüft ob ein User online ist (last_active < 2 Minuten)
 */
export function isOnline(lastActive: string | null): boolean {
  if (!lastActive) return false;
  return Date.now() - new Date(lastActive).getTime() < 2 * 60 * 1000;
}

/**
 * Skill-Level auf Deutsch
 */
export function skillLabel(level: string): string {
  const map: Record<string, string> = {
    beginner: "Anfänger",
    intermediate: "Fortgeschritten",
    advanced: "Advanced",
    competitive: "Wettkampf",
  };
  return map[level] || level;
}

/**
 * Sport-Icon
 */
export function sportIcon(sport: string): string {
  const map: Record<string, string> = {
    tennis: "🎾",
    padel: "🏸",
    pickleball: "🏓",
  };
  return map[sport] || "🎾";
}

/**
 * Sport-Label auf Deutsch (Anzeige)
 */
export function sportLabel(sport: string): string {
  const map: Record<string, string> = {
    tennis: "Tennis",
    padel: "Padel",
    pickleball: "Pickleball",
  };
  return map[sport] || sport;
}
