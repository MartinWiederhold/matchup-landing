import { NextResponse } from "next/server";

// Immer frisch ausliefern — gibt die Build-Kennung des AKTUELLEN Deploys zurück.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { id: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
