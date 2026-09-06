import { notFound } from "next/navigation";

import { CommunityDashboard } from "../../(dashboard)/communities/community-dashboard";
import { DashboardMuiProviders } from "@/app/mui-provider";
import {
  TRADERLINK_COMMUNITY_SECTIONS,
  type TraderLinkCommunitySection,
} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import { createTraderLinkCommunityReviewFixture, type TraderLinkCommunityReviewRole } from "@/src/modules/communities/server/traderlink-community-review-fixture";

export const dynamic = "force-dynamic";

export default async function CommunitiesPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ appearance?: string }>;
}) {
  if (process.env.RAILWAY_ENVIRONMENT_NAME !== "staging") notFound();

  const parts=(await params).section??[];
  const roles:readonly TraderLinkCommunityReviewRole[]=["owner","admin","coach","contributor","member","student"];
  const role=roles.includes(parts[0] as TraderLinkCommunityReviewRole)?parts[0] as TraderLinkCommunityReviewRole:"owner";
  const requested = roles.includes(parts[0] as TraderLinkCommunityReviewRole)?parts[1]??"home":parts[0]??"home";
  const section = TRADERLINK_COMMUNITY_SECTIONS.includes(
    requested as TraderLinkCommunitySection,
  )
    ? (requested as TraderLinkCommunitySection)
    : "home";
  const appearance = (await searchParams).appearance === "dark" ? "dark" : "light";

  return (
    <DashboardMuiProviders appearance={appearance}>
      <CommunityDashboard
        baseOverride={`/communities-preview/${role}`}
        isReview
        section={section}
        snapshot={createTraderLinkCommunityReviewFixture(role)}
      />
    </DashboardMuiProviders>
  );
}
