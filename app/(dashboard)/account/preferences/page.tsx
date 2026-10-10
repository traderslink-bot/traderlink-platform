import { PLATFORM_NOTIFICATION_CATEGORIES } from "@/src/modules/platform/contracts/platform-notification-contracts";
import { canReceiveMembershipNotification } from "@/src/modules/platform/server/membership/membership-notification-access";
import { MarketHaltAlertRepository } from "@/src/modules/news/server/market-halt-alert-repository";
import type { Metadata } from "next";

import { DashboardPanel } from "../../../dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";
import { PlatformNotificationEmailAddressRepository } from "@/src/modules/platform/server/notifications/platform-notification-email-address-repository";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";
import { AccountSettingsLayout } from "../account-settings-layout";
import { AppearanceSettings } from "../appearance-settings";
import { NotificationPreferences } from "../notification-preferences";
import { WatchlistPublicationNotificationStore } from "@/src/modules/watchlist/server/notifications/watchlist-publication-notification-store";
import { ReverseSplitNotificationPanel } from "../../reverse-splits/notification-panel";

export const metadata: Metadata = {
  description: "Choose TradersLink appearance, push notifications and Discord messages.",
  title: "Preferences | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPreferencesPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const { allowedCategories, allowHalts, allowPressReleases, allowWatchlist, marketHaltAlertsEnabled, appearance, notificationPreferences, notificationEmailStatus, pressReleasePushChannels, watchlistPreferences } = withReadonlyPlatformDatabase({}, (database) =>
    Object.freeze({
      allowedCategories: PLATFORM_NOTIFICATION_CATEGORIES.filter(category => canReceiveMembershipNotification(database, scope.userId, category)),
      allowHalts: canReceiveMembershipNotification(database, scope.userId, "market_halt"),
      allowPressReleases: canReceiveMembershipNotification(database, scope.userId, "press_release"),
      allowWatchlist: canReceiveMembershipNotification(database, scope.userId, "watchlist"),
      marketHaltAlertsEnabled: new MarketHaltAlertRepository(database).read(scope).enabled,
      watchlistPreferences: new WatchlistPublicationNotificationStore(database).readPreferences(scope.userId),
      appearance: new PlatformUserPreferenceRepository(database).getActiveWorkspaceAppearance(scope),
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
    allowedCategories, allowHalts, allowPressReleases, allowWatchlist, marketHaltAlertsEnabled,
    discord: notificationPreferences.discordDmCategories,
    email: notificationPreferences.emailCategories,
    emailState: notificationEmailStatus.state,
    pressRelease: pressReleasePushChannels,
    push: notificationPreferences.webPushCategories,
    watchlist: watchlistPreferences,
  });

  return (
    <AccountSettingsLayout
      activeSection="preferences"
      description="Choose your dashboard appearance and which updates TradersLink may send to your devices or through Discord."
      title="Preferences"
    >
      <DashboardPanel title="Appearance">
        <AppearanceSettings appearance={appearance} />
      </DashboardPanel>
      <DashboardPanel title="Notifications">
        <NotificationPreferences
          key={preferencesKey}
          allowedCategories={allowedCategories}
          allowHalts={allowHalts}
          allowPressReleases={allowPressReleases}
          allowWatchlist={allowWatchlist}
          initialMarketHaltAlertsEnabled={marketHaltAlertsEnabled}
          initialDiscordDmCategories={notificationPreferences.discordDmCategories}
          initialEmailCategories={notificationPreferences.emailCategories}
          initialEmailStatus={notificationEmailStatus}
          initialPressReleasePushChannels={pressReleasePushChannels}
          initialWebPushCategories={notificationPreferences.webPushCategories}
          initialWatchlistPreferences={watchlistPreferences}
        />
        <ReverseSplitNotificationPanel />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
