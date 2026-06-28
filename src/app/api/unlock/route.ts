import { NextResponse } from "next/server";

const GATE_CODE = process.env.SITE_GATE_CODE || "5080";
const GATE_TOKEN = process.env.SITE_GATE_TOKEN || "mu-unlocked-2026";

export async function POST(request: Request) {
  let code = "";
  try {
    const body = await request.json();
    code = String(body?.code ?? "").trim();
  } catch {
    code = "";
  }

  if (code !== GATE_CODE) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("mu_gate", GATE_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
  });
  return res;
}
