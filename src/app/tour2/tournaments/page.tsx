import { redirect } from "next/navigation";

/** Alias — kanonische Fläche ist /tour2/finder. */
export default function TourTournamentsRedirect() {
  redirect("/tour2/finder");
}
