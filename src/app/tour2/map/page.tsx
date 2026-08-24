import { redirect } from "next/navigation";

// Karte ist keine eigene Fläche mehr — Entdecken lebt unter Turniere (Liste + Karte).
export default function Tour2MapRedirect() {
  redirect("/tour2/browse");
}
