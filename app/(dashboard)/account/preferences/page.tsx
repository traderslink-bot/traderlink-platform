import type { Metadata } from "next";

import { DashboardPanel } from "../../../dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { AccountSettingsLayout } from "../account-settings-layout";
import { NotificationPreferences } from "../notification-preferences";

export const metadata: Metadata = {
  description: "Choose TraderLink push notifications and Discord messages.",
  title: "Notifications | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPreferencesPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const { notificationPreferences, pressReleasePushChannels } = withReadonlyPlatformDatabase({}, (database) =>
    Object.freeze({
      notificationPreferences: new PlatformNotificationRepository(database).readPreferences(scope),
      pressReleasePushChannels: new PressReleaseDashboardRepository(database).readPushPreferences(scope),
    }));

  return (
    <AccountSettingsLayout
      activeSection="preferences"
      description="Choose which updates TraderLink may send to your devices or through Discord."
      title="Notifications"
    >
      <DashboardPanel title="Notifications">
        <NotificationPreferences
          initialDiscordDmCategories={notificationPreferences.discordDmCategories}
          initialPressReleasePushChannels={pressReleasePushChannels}
          initialWebPushCategories={notificationPreferences.webPushCategories}
        />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
