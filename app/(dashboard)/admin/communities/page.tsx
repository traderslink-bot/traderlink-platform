import { requireCommunityOwnerReviewPageIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import { redirect } from "next/navigation";

export default function LegacyCommunitiesAdminPage(): never {
  redirect("/admin/journal/communities");
}
