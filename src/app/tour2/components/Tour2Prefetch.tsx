"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getTourCatalog } from "@/lib/tourCatalogCache";

/**
 * Wärmt den Katalog nur auf Finder/Saison — Overview braucht ihn nicht.
 */
export default function Tour2Prefetch({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const path = usePathname() || "";
  const need = ["/tour2/finder", "/tour2/tournaments", "/tour2/browse", "/tour2/map", "/tour2/season", "/tour2/planner"].some((r) => path.startsWith(r));
  useEffect(() => {
    if (loading || !user || !need) return;
    void getTourCatalog().catch(() => { /* Fläche zeigt den Fehler selbst */ });
  }, [loading, user, need]);
  return children;
}
