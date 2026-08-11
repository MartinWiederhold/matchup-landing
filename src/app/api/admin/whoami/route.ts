import { NextResponse } from "next/server";
import { verifyAdmin, bearerToken } from "@/lib/adminClient";

export const dynamic = "force-dynamic";

/**
 * Server-seitige Admin-Prüfung für die UI (Punkt 2, Sicherheitsaudit 2026-08). Ersetzt
 * die Client-Allowlist in AdminShell: Der Client entscheidet nicht mehr selbst „bin ich
 * Admin", und die Admin-Adresse verlässt das Server-Env nie (kein NEXT_PUBLIC_ mehr).
 * Gibt NUR ein Boolean zurück, keine Adresse.
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(bearerToken(req));
  return NextResponse.json({ isAdmin: !!admin });
}
