import { NextResponse } from "next/server";
import { getServiceClient, verifyAdmin, bearerToken } from "@/lib/adminClient";

export const dynamic = "force-dynamic";

/**
 * Liefert ALLE Community-Posts (nur für Admins), inkl. Autor und Bild — für die
 * Moderation. Gelesen mit service_role, damit auch club-interne Posts sichtbar
 * sind. ?withImages=1 filtert auf Posts mit Bild.
 */
export async function GET(request: Request) {
  const admin = await verifyAdmin(bearerToken(request));
  if (!admin) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }
  const svc = getServiceClient();
  const url = new URL(request.url);
  const onlyImages = url.searchParams.get("withImages") === "1";

  let q = svc
    .from("community_posts")
    .select("id, content, image_url, club_id, likes_count, comments_count, created_at, author_id")
    .order("created_at", { ascending: false })
    .limit(500);
  if (onlyImages) q = q.not("image_url", "is", null);

  const { data: posts, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Autoren in einem Rutsch nachladen (kein FK-Join nötig).
  const ids = [...new Set((posts ?? []).map((p) => p.author_id).filter(Boolean))];
  const authorMap: Record<string, { first_name: string | null; profile_image: string | null; city: string | null }> = {};
  if (ids.length) {
    const { data: authors } = await svc
      .from("profiles")
      .select("id, first_name, profile_image, city")
      .in("id", ids);
    for (const a of authors ?? []) {
      authorMap[a.id as string] = {
        first_name: a.first_name as string | null,
        profile_image: a.profile_image as string | null,
        city: a.city as string | null,
      };
    }
  }

  const rows = (posts ?? []).map((p) => ({ ...p, author: authorMap[p.author_id] ?? null }));
  return NextResponse.json({ posts: rows });
}
