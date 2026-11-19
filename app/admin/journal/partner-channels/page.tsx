import { requireCommunityOwnerReviewAuthenticatedPageIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import type { Metadata } from "next";

import { PartnerChannelReview } from "./partner-channel-review";

export const metadata: Metadata = { title: "Partner channel review | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PartnerChannelReviewPage() {
  await requireCommunityOwnerReviewAuthenticatedPageIdentity();
  return <PartnerChannelReview />;
}
