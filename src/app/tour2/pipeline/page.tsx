import { redirect } from "next/navigation";

export default function PipelineRedirect() {
  redirect("/tour2/season?view=weeks");
}
