import { PressReleaseSavedViewRepository } from "@/src/modules/news/server/press-release-saved-view-repository";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { evaluateMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";
import { PlatformMembershipCatalogRepository, isPlatformMembershipCatalogAvailable } from "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { PLATFORM_NOTIFICATION_CATEGORIES } from "@/src/modules/platform/contracts/platform-notification-contracts";
import { canReceiveMembershipNotification } from "@/src/modules/platform/server/membership/membership-notification-access";
import { MarketHaltAlertRepository } from "@/src/modules/news/server/market-halt-alert-repository";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { DashboardPanel } from "../../../dashboard-template";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";
import { PlatformNotificationEmailAddressRepository } from "@/src/modules/platform/server/notifications/platform-notification-email-address-repository";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";
import { AccountSettingsLayout } from "../../../(dashboard)/account/account-settings-layout";
import { readPlatformHomeAccess } from "@/src/modules/platform/server/identity/platform-home-page-access";
import { HomePageSettings } from "../../../(dashboard)/account/home-page-settings";
import { AppearanceSettings } from "../../../(dashboard)/account/appearance-settings";
import { NotificationPreferences } from "../../../(dashboard)/account/notification-preferences";
import { WatchlistPublicationNotificationStore } from "@/src/modules/watchlist/server/notifications/watchlist-publication-notification-store";
import { ReverseSplitNotificationPanel } from "../../../(dashboard)/reverse-splits/notification-panel";

export const metadata: Metadata = {
  description: "Set your home page, appearance and notifications.",
  title: "Preferences | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPreferencesPage() {
  const requestHeaders = await headers();
  const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(requestHeaders);
  const { scope } = identity;
  const { savedNewsViews, allowSavedNewsFilters, upgradePlans, allowedCategories, allowHalts, allowPressReleases, allowWatchlist, marketHaltAlertsEnabled, appearance, homePage, homePages, notificationPreferences, notificationEmailStatus, pressReleasePushChannels, watchlistPreferences } = withReadonlyPlatformDatabase({}, (database) => {
    const { homePages } = readPlatformHomeAccess(database, identity, requestHeaders);

    return Object.freeze({
      savedNewsViews: new PressReleaseSavedViewRepository(database).list(scope.userId),
      allowSavedNewsFilters: hasPressReleaseDashboardAccess(identity) && evaluateMembershipFeature(database,scope.userId,"news.filters_sorting").allowed,
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
      homePage: homePages.welcome ? new PlatformUserPreferenceRepository(database).getActiveUserHomePage(scope.userId) : null,
      homePages,
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
    });
  });
  const preferencesKey = JSON.stringify({
    // Reset when authorization/destination readiness changes, not after a save.
    // A save must preserve feedback and unsaved choices in the other channels.
    allowedCategories, allowHalts, allowPressReleases, allowWatchlist,
    emailState: notificationEmailStatus.state,
  });

  return (
    <AccountSettingsLayout
      activeSection="preferences"
      description={homePage ? "Set your home page, dashboard appearance and notifications." : "Set your dashboard appearance and notifications."}
      firstPanel={homePage ? (
        <DashboardPanel title="Home page">
          <HomePageSettings available={homePages} homePage={homePage} />
        </DashboardPanel>
      ) : null}
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
          initialSavedNewsViews={savedNewsViews}
          allowSavedNewsFilters={allowSavedNewsFilters}
          initialWebPushCategories={notificationPreferences.webPushCategories}
          initialWatchlistPreferences={watchlistPreferences}
        />
        <ReverseSplitNotificationPanel identity={identity} />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
