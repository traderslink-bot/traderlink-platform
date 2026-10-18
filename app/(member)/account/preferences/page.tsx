import { PlatformMembershipCatalogRepository, isPlatformMembershipCatalogAvailable } from "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { PLATFORM_NOTIFICATION_CATEGORIES } from "@/src/modules/platform/contracts/platform-notification-contracts";
import { canReceiveMembershipNotification } from "@/src/modules/platform/server/membership/membership-notification-access";
import { MarketHaltAlertRepository } from "@/src/modules/news/server/market-halt-alert-repository";
import type { Metadata } from "next";

import { DashboardPanel } from "../../../dashboard-template";
import { requireTraderLinkPlatformAuthenticatedPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";
import { PlatformNotificationEmailAddressRepository } from "@/src/modules/platform/server/notifications/platform-notification-email-address-repository";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";
import { AccountSettingsLayout } from "../../../(dashboard)/account/account-settings-layout";
import { AppearanceSettings } from "../../../(dashboard)/account/appearance-settings";
import { NotificationPreferences } from "../../../(dashboard)/account/notification-preferences";
import { WatchlistPublicationNotificationStore } from "@/src/modules/watchlist/server/notifications/watchlist-publication-notification-store";
import { ReverseSplitNotificationPanel } from "../../../(dashboard)/reverse-splits/notification-panel";

export const metadata: Metadata = {
  description: "Choose TradersLink appearance, push notifications and Discord messages.",
  title: "Preferences | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPreferencesPage() {
  const { scope } = await requireTraderLinkPlatformAuthenticatedPageIdentity();
  const { upgradePlans, allowedCategories, allowHalts, allowPressReleases, allowWatchlist, marketHaltAlertsEnabled, appearance, notificationPreferences, notificationEmailStatus, pressReleasePushChannels, watchlistPreferences } = withReadonlyPlatformDatabase({}, (database) =>
    Object.freeze({
      upgradePlans: Object.fromEntries([...PLATFORM_NOTIFICATION_CATEGORIES, "market_halt", "press_release", "watchlist"].map(category => [
        category, isPlatformMembershipCatalogAvailable(database) ? new PlatformMembershipCatalogRepository(database)
          .readPublicPlans(`notifications.${category}`).map(plan => plan.name) : [],
      ])),
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
    // Reset when authorization/destination readiness changes, not after a save.
    // A save must preserve feedback and unsaved choices in the other channels.
    allowedCategories, allowHalts, allowPressReleases, allowWatchlist,
    emailState: notificationEmailStatus.state,
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
          upgradePlans={upgradePlans}
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
