import { redirect } from "next/navigation";

/** Karte ist keine eigene Fläche — Turniere (Liste + Karte). */
export default function Tour2MapRedirect() {
  redirect("/tour2/tournaments");
}
