import { redirect } from "next/navigation";

export default function TimelineRedirect() {
  redirect("/tour2/season?view=timeline");
}
