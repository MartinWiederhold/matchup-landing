import { redirect } from "next/navigation";

/** Alte Saisonliste — der Verlauf lebt unter /tour2/planner. */
export default function Tour2SeasonRedirect() {
  redirect("/tour2/planner");
}
