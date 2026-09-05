import { notFound } from "next/navigation";

import { CommunityDashboard } from "../../(dashboard)/communities/community-dashboard";
import { DashboardMuiProviders } from "@/app/mui-provider";
import {
  TRADERLINK_COMMUNITY_SECTIONS,
  type TraderLinkCommunitySection,
} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import { createTraderLinkCommunityReviewFixture } from "@/src/modules/communities/server/traderlink-community-review-fixture";

export const dynamic = "force-dynamic";

export default async function CommunitiesPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ appearance?: string }>;
}) {
  if (process.env.RAILWAY_ENVIRONMENT_NAME !== "staging") notFound();

  const requested = (await params).section?.[0] ?? "home";
  const section = TRADERLINK_COMMUNITY_SECTIONS.includes(
    requested as TraderLinkCommunitySection,
  )
    ? (requested as TraderLinkCommunitySection)
    : "home";
  const appearance = (await searchParams).appearance === "dark" ? "dark" : "light";

  return (
    <DashboardMuiProviders appearance={appearance}>
      <CommunityDashboard
        baseOverride="/communities-preview"
        isReview
        section={section}
        snapshot={createTraderLinkCommunityReviewFixture()}
      />
    </DashboardMuiProviders>
  );
}
