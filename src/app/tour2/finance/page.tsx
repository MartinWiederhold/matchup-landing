import { redirect } from "next/navigation";

/** Alias — kanonische Fläche ist /tour2/travel. */
export default function FinanceRedirect() {
  redirect("/tour2/travel");
}
