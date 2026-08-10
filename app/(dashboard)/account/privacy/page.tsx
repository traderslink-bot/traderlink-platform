import type { Metadata } from "next";

import { DashboardPanel } from "../../../dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformAccountProfileReadService } from "@/src/modules/platform/server/identity/platform-account-profile-read-service";
import { AccountErasureControls } from "../account-erasure-controls";
import { AccountSettingsLayout } from "../account-settings-layout";

export const metadata: Metadata = {
  description: "Permanently delete TraderLink data when you choose to leave.",
  title: "Privacy | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPrivacyPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const profile = withReadonlyPlatformDatabase({}, (database) =>
    new PlatformAccountProfileReadService(database).get(scope));
  const activeAccount = profile.journalAccounts.find((account) => account.active) ?? null;

  return (
    <AccountSettingsLayout
      activeSection="privacy"
      description="Control the permanent deletion of a Trade Tracker account or your entire TraderLink account."
      title="Privacy"
    >
      <DashboardPanel title="Delete data">
        <AccountErasureControls activeAccount={activeAccount} />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
