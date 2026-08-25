import { redirect } from "next/navigation";

/** Alias — kanonische Fläche ist /tour2/profile (Wizard-Schritt bleibt per ?step=). */
export default async function Tour2SetupRedirect({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.step ? `?step=${encodeURIComponent(sp.step)}` : "";
  redirect(`/tour2/profile${q}`);
}
