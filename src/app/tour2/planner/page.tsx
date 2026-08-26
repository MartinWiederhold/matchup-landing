import { redirect } from "next/navigation";

/** Alias — kanonische Fläche ist /tour2/season. */
export default async function Tour2PlannerRedirect({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" && sp.id.length > 0 ? `?id=${encodeURIComponent(sp.id)}` : "";
  redirect(`/tour2/season${id}`);
}
