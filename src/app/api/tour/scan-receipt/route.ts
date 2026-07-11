import { NextResponse } from "next/server";
import { getServiceClient, bearerToken } from "@/lib/adminClient";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Beleg-Scan für den Tour-Modus: Foto (base64) → Claude Haiku Vision extrahiert
 * Händler/Betrag/Währung/Kategorie/Datum als JSON. Nur für eingeloggte Nutzer
 * (Bearer-Token), damit die (kostenpflichtige) KI nicht anonym missbraucht wird.
 * Der Betrag wird im UI zwingend vom Nutzer bestätigt (Halluzinationsschutz).
 */
const CATEGORIES = ["hotel", "flight", "coach", "physio", "stringing", "entry_fee", "taxi", "food", "other"];

const PROMPT = `You are extracting structured data from a photo of a receipt or booking confirmation for a professional tennis player. Return ONLY a JSON object (no prose, no markdown) with these fields:
{"merchant": string, "amount": number (total paid), "currency": string (ISO code like EUR, USD, CHF, GBP), "category": one of [${CATEGORIES.join(", ")}], "date": "YYYY-MM-DD" or null}
Pick the single total amount actually paid. Map the merchant/context to the best category (hotel, flight, coach, physio, stringing=racket stringing, entry_fee=tournament entry, taxi=ground transport, food, other). If unsure, use "other". If a field is unreadable, use null.`;

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  // Auth: nur eingeloggte Nutzer.
  const token = bearerToken(req);
  const svc = getServiceClient();
  const { data: userData } = token ? await svc.auth.getUser(token) : { data: { user: null } };
  if (!userData?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { image?: string; media_type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const image = (body.image ?? "").replace(/^data:[^,]+,/, ""); // evtl. data-URL-Präfix entfernen
  const mediaType = body.media_type || "image/jpeg";
  if (!image) return NextResponse.json({ error: "no_image" }, { status: 400 });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: "ai_error", detail: txt.slice(0, 300) }, { status: 502 });
    }
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = (data?.content ?? []).find((b: any) => b.type === "text")?.text ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return NextResponse.json({ error: "parse_failed" }, { status: 502 });
    const parsed = JSON.parse(m[0]) as Record<string, unknown>;
    const category = typeof parsed.category === "string" && CATEGORIES.includes(parsed.category) ? parsed.category : "other";
    return NextResponse.json({
      ok: true,
      merchant: typeof parsed.merchant === "string" ? parsed.merchant : null,
      amount: typeof parsed.amount === "number" ? parsed.amount : Number(parsed.amount) || null,
      currency: typeof parsed.currency === "string" ? parsed.currency.toUpperCase().slice(0, 3) : null,
      category,
      date: typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null,
    });
  } catch (e) {
    return NextResponse.json({ error: "server_error", detail: String(e).slice(0, 200) }, { status: 500 });
  }
}
