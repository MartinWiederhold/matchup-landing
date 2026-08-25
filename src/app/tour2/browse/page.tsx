import { redirect } from "next/navigation";

/** Alias — kanonische Fläche ist /tour2/tournaments. */
export default function Tour2BrowseRedirect() {
  redirect("/tour2/tournaments");
}
