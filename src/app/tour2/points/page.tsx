import { redirect } from "next/navigation";

/** Alias — kanonische Fläche ist /tour2/ranking. */
export default function PointsRedirect() {
  redirect("/tour2/ranking");
}
