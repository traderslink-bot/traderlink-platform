import type { Metadata } from "next";

import { DashboardPanel } from "../../../dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";
import { PlatformNotificationEmailAddressRepository } from "@/src/modules/platform/server/notifications/platform-notification-email-address-repository";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { AccountSettingsLayout } from "../account-settings-layout";
import { NotificationPreferences } from "../notification-preferences";

export const metadata: Metadata = {
  description: "Choose TradersLink push notifications and Discord messages.",
  title: "Notifications | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPreferencesPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const { notificationPreferences, notificationEmailStatus, pressReleasePushChannels } = withReadonlyPlatformDatabase({}, (database) =>
    Object.freeze({
      notificationPreferences: new PlatformNotificationRepository(database).readPreferences(scope),
      notificationEmailStatus: (() => {
        try {
          return new PlatformNotificationEmailAddressRepository(
            database,
            loadPlatformNotificationEmailEncryptionConfiguration(),
          ).readStatus(scope);
        } catch {
          return Object.freeze({
            confirmationExpiresAtUtc: null,
            maskedEmailAddress: null,
            state: "none" as const,
          });
        }
      })(),
      pressReleasePushChannels: new PressReleaseDashboardRepository(database).readPushPreferences(scope),
    }));
  const preferencesKey = JSON.stringify({
    discord: notificationPreferences.discordDmCategories,
    email: notificationPreferences.emailCategories,
    emailState: notificationEmailStatus.state,
    pressRelease: pressReleasePushChannels,
    push: notificationPreferences.webPushCategories,
  });

  return (
    <AccountSettingsLayout
      activeSection="preferences"
      description="Choose which updates TradersLink may send to your devices or through Discord."
      title="Notifications"
    >
      <DashboardPanel title="Notifications">
        <NotificationPreferences
          key={preferencesKey}
          initialDiscordDmCategories={notificationPreferences.discordDmCategories}
          initialEmailCategories={notificationPreferences.emailCategories}
          initialEmailStatus={notificationEmailStatus}
          initialPressReleasePushChannels={pressReleasePushChannels}
          initialWebPushCategories={notificationPreferences.webPushCategories}
        />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
