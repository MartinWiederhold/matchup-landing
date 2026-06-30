import type { MetadataRoute } from "next";
import { CITIES } from "@/lib/sportLandings";

const BASE = "https://matchup-app.com";
const SPORT_SLUGS = [
  "tennispartner-finden",
  "padelpartner-finden",
  "pickleballpartner-finden",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/find-a-partner", priority: 0.9 },
    ...SPORT_SLUGS.map((s) => ({ path: `/${s}`, priority: 0.9 })),
    { path: "/events", priority: 0.8 },
    { path: "/shop", priority: 0.7 },
    { path: "/beratung", priority: 0.7 },
    { path: "/about", priority: 0.5 },
    // Lokale Städte-Landingpages (Sport × Stadt)
    ...SPORT_SLUGS.flatMap((s) =>
      CITIES.map((c) => ({ path: `/${s}/${c.slug}`, priority: 0.6 })),
    ),
  ];
  return routes.map(({ path, priority }) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  }));
}
