import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/adminClient";

export const dynamic = "force-dynamic";

/** Scan-Statistik: Gesamt / Heute / letzte 7 Tage. */
export async function GET() {
  const svc = getServiceClient();
  const now = new Date();
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();

  const [total, today, week] = await Promise.all([
    svc.from("qr_scans").select("*", { count: "exact", head: true }),
    svc.from("qr_scans").select("*", { count: "exact", head: true }).gte("scanned_at", startToday),
    svc.from("qr_scans").select("*", { count: "exact", head: true }).gte("scanned_at", weekAgo),
  ]);

  return NextResponse.json({
    total: total.count ?? 0,
    today: today.count ?? 0,
    week: week.count ?? 0,
  });
}

/** Scans zurücksetzen – nur mit Bestätigungscode 5080. */
export async function POST(request: Request) {
  let body: { code?: string } = {};
  try {
    body = await request.json();
  } catch {
    // leerer Body
  }
  if (String(body.code ?? "") !== "5080") {
    return NextResponse.json({ error: "Falscher Code" }, { status: 403 });
  }
  const svc = getServiceClient();
  const { error } = await svc.from("qr_scans").delete().not("id", "is", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
