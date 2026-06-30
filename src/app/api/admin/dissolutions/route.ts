import { NextResponse } from "next/server";
import { getServiceClient, verifyAdmin, bearerToken } from "@/lib/adminClient";

export const dynamic = "force-dynamic";

/** Aufgelöste Matches / Blocks inkl. Gründe — nur für Admins (service_role). */
export async function GET(request: Request) {
  const admin = await verifyAdmin(bearerToken(request));
  if (!admin) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }
  const svc = getServiceClient();
  const { data, error } = await svc
    .from("match_dissolutions")
    .select("id, action, reason, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ entries: data ?? [] });
}
