import { redirect } from "next/navigation";

export default function NewMembershipPlanPage() {
  redirect("/admin/journal/memberships?section=Plans&new=1");
}
