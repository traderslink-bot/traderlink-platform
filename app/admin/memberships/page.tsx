import { redirect } from "next/navigation";

export default function MembershipsAdminRedirect() {
  redirect("/admin/journal/memberships");
}
