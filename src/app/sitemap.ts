import type { MetadataRoute } from "next";

const BASE = "https://matchup-app.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/find-a-partner", priority: 0.9 },
    { path: "/tennispartner-finden", priority: 0.9 },
    { path: "/padelpartner-finden", priority: 0.9 },
    { path: "/pickleballpartner-finden", priority: 0.9 },
    { path: "/events", priority: 0.8 },
    { path: "/shop", priority: 0.7 },
    { path: "/beratung", priority: 0.7 },
  ];
  return routes.map(({ path, priority }) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  }));
}
