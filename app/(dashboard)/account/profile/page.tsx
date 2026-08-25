import type { Metadata } from "next";

import { DashboardPanel } from "../../../dashboard-template";
import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { AccountSettingsLayout } from "../account-settings-layout";
import { CommunityProfileSettingsEditor } from "./community-profile-settings";

export const metadata: Metadata = {
  description: "Review your TradersLink profile and sign-in access.",
  title: "Profile | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountProfilePage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const communityProfile = withReadonlyPlatformDatabase({}, (database) =>
    new CommunityWatchlistRepository(database).getOwnProfileSettings(scope.userId));

  return (
    <AccountSettingsLayout
      activeSection="profile"
      description="Choose the Community profile shown with your watchlists."
      title="Profile"
    >
      <DashboardPanel title="Community profile">
        <CommunityProfileSettingsEditor initial={communityProfile} />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
