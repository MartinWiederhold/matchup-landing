import { redirect } from "next/navigation";

/** Karte ist keine eigene Fläche — Finder (Liste + Karte). */
export default function Tour2MapRedirect() {
  redirect("/tour2/finder");
}
