import { redirect } from "next/navigation";

/** Alias — kanonische Fläche ist /tour2/network. */
export default function WildcardsRedirect() {
  redirect("/tour2/network");
}
