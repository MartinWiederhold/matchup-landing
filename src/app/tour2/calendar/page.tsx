import { redirect } from "next/navigation";

export default function CalendarRedirect() {
  redirect("/tour2/season?view=calendar");
}
