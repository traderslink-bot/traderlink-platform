import { notFound } from "next/navigation";

import { CommunityDashboard } from "../../(dashboard)/communities/community-dashboard";
import {
  TRADERLINK_COMMUNITY_SECTIONS,
  type TraderLinkCommunitySection,
} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import { createTraderLinkCommunityReviewFixture } from "@/src/modules/communities/server/traderlink-community-review-fixture";

export const dynamic = "force-dynamic";

export default async function CommunitiesPreviewPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  if (process.env.RAILWAY_ENVIRONMENT_NAME !== "staging") notFound();

  const requested = (await params).section?.[0] ?? "home";
  const section = TRADERLINK_COMMUNITY_SECTIONS.includes(
    requested as TraderLinkCommunitySection,
  )
    ? (requested as TraderLinkCommunitySection)
    : "home";

  return (
    <CommunityDashboard
      baseOverride="/communities-preview"
      isReview
      section={section}
      snapshot={createTraderLinkCommunityReviewFixture()}
    />
  );
}
