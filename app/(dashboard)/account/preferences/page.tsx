import type { Metadata } from "next";

import { DashboardPanel } from "../../../dashboard-template";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformAccountProfileReadService } from "@/src/modules/platform/server/identity/platform-account-profile-read-service";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { AccountSettingsLayout } from "../account-settings-layout";
import { NotificationPreferences } from "../notification-preferences";
import { OfflineDataSettings } from "../offline-data-settings";
import { ReportingCurrencySettings } from "../reporting-currency-settings";

export const metadata: Metadata = {
  description: "Manage TraderLink reporting and notification preferences.",
  title: "Preferences | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPreferencesPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const { profile, notificationPreferences } = withReadonlyPlatformDatabase({}, (database) =>
    Object.freeze({
      profile: new PlatformAccountProfileReadService(database).get(scope),
      notificationPreferences: new PlatformNotificationRepository(database).readPreferences(scope),
    }));

  return (
    <AccountSettingsLayout
      activeSection="preferences"
      description="Choose how TraderLink presents your dashboard and which updates may also reach you in Discord."
      title="Preferences"
    >
      <DashboardPanel title="Reporting currency">
        <ReportingCurrencySettings reportingCurrency={profile.reportingCurrency} />
      </DashboardPanel>
      <DashboardPanel title="Notifications">
        <NotificationPreferences initialDiscordDmCategories={notificationPreferences.discordDmCategories} />
      </DashboardPanel>
      <DashboardPanel title="Offline data">
        <OfflineDataSettings
          accountSelectionRef={scope.activeAccountId
            ? currentJournalAccountSelectionRef(scope)
            : null}
          offlineScopeRef={currentPlatformOfflineScopeRef(scope)}
        />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
