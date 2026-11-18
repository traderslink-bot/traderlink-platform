import { requireCommunityOwnerReviewAuthenticatedPageIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import type { Metadata } from "next";

import { PartnerChannelReviewDetail } from "./partner-channel-review-detail";

export const metadata: Metadata = { title: "Partner channel review | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PartnerChannelReviewDetailPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  await requireCommunityOwnerReviewAuthenticatedPageIdentity();
  const { communityId } = await params;
  return <PartnerChannelReviewDetail communityId={communityId} />;
}
