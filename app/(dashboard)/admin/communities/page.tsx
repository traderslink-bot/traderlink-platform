import { redirect } from "next/navigation";

export default function LegacyCommunitiesAdminPage(): never {
  redirect("/admin/journal/communities");
}
