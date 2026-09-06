import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { TraderLinkPlatformDashboardTemplate } from "./dashboard-template";
import {
  requireTraderLinkPlatformDiscordMemberPageIdentity,
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformServerComponentPageIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalAccountService } from "@/src/modules/journal/server/accounts/journal-account-service";
import { JournalDemoAccountRepository } from "@/src/modules/journal/server/demo/journal-demo-account-repository";
import { PwaLifecycle } from "./pwa/pwa-lifecycle";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { MarketHaltAlertRepository } from "@/src/modules/news/server/market-halt-alert-repository";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { hasScannerEarlyAccess } from "@/src/modules/scanner/server/scanner-early-access";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";
import { DashboardMuiProviders } from "./mui-provider";
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";

async function TraderLinkPlatformDashboardFrameContent({
  children,
  loginReturnTo = "/workspace",
  watchlistMemberAccess = false,
}: {
  children: ReactNode;
  loginReturnTo?: string;
  watchlistMemberAccess?: boolean;
}) {
  let identity;
  try {
    identity = watchlistMemberAccess
      ? await requireTraderLinkPlatformDiscordMemberPageIdentity()
      : await requireTraderLinkPlatformServerComponentPageIdentity();
  } catch (error) {
    if (
      process.env.NODE_ENV === "production" &&
      isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_DASHBOARD_ACCESS_DENIED"
    ) {
      redirect("/access-required");
    }
    if (
      process.env.NODE_ENV === "production" &&
      isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED"
    ) {
      redirect(`/api/auth/discord/login?returnTo=${encodeURIComponent(loginReturnTo)}`);
    }
    throw error;
  }
  const scope = identity.scope;
  const canReadPressReleases = hasPressReleaseDashboardAccess(identity);
  const scannerEarlyAccess = hasScannerEarlyAccess(identity);
  const watchlistAdminNavigationAccess = hasWatchlistDashboardNavigationAccess(identity);
  const readAtUtc = createCanonicalUtcTimestamp();
  const dashboardContext = withReadonlyPlatformDatabase({}, (database) => {
    const activeAccount = scope.activeAccountId
      ? new JournalAccountService(new JournalAccountRepository(database))
        .requireAccountRecord(scope, scope.activeAccountId)
      : null;
    const marketHaltAlerts = new MarketHaltAlertRepository(database);
    const communityRepository = new TraderLinkCommunityRepository(database);
    const communityAccess = communityRepository.listForUser(scope.userId)
      .map((community) => ({
        community,
        access: communityRepository.resolveAccess(community.communityId, scope.userId),
      }))
      .filter((entry) => entry.access.capabilities.includes("community.view"));
    const firstCommunity = communityAccess[0] ?? null;
    const firstCoachingCommunity = communityAccess.find((entry) =>
      entry.access.capabilities.includes("community.coaching.view") ||
      entry.access.capabilities.includes("community.coaching.offer"),
    ) ?? null;
    return Object.freeze({
      activeAccount,
      activeDemoAccount: new JournalDemoAccountRepository(database).findActiveAccount(scope),
      appearance: new PlatformUserPreferenceRepository(database).getActiveWorkspaceAppearance(scope),
      marketHaltAlerts: marketHaltAlerts.read(scope),
      mutedMarketHaltTickers: marketHaltAlerts.listMutedTickers({
        readAtUtc,
        scope,
      }),
      notifications: new PlatformNotificationRepository(database).list(scope, 5),
      pressReleaseUnreadCounts: canReadPressReleases
        ? new PressReleaseDashboardRepository(database).unreadCounts(scope)
        : null,
      communityNavigationHref: firstCommunity
        ? `/communities/${firstCommunity.community.slug}`
        : null,
      coachingNavigationHref: firstCoachingCommunity
        ? `/communities/${firstCoachingCommunity.community.slug}/coaching`
        : null,
      communityWatchlistsNavigationAccess: communityAccess.some((entry) =>
        entry.access.capabilities.includes("community.watchlists.view") ||
        entry.access.capabilities.includes("community.watchlists.share_own") ||
        entry.access.capabilities.includes("community.watchlists.publish_staff"),
      ),
    });
  });
  const accountSelectionRef = scope.activeAccountId
    ? currentJournalAccountSelectionRef(scope)
    : null;
  const demoAccountSelectionRef = dashboardContext.activeDemoAccount
    ? accountSelectionRef
    : null;
  const offlineScopeRef = currentPlatformOfflineScopeRef(scope);
  return (
    <DashboardMuiProviders
      appearance={dashboardContext.appearance}
      key={`${offlineScopeRef}:${accountSelectionRef ?? "platform"}`}
    >
      <>
        <TraderLinkPlatformDashboardTemplate
          accountCurrency={dashboardContext.activeAccount?.baseCurrency ?? null}
          accountSelectionRef={accountSelectionRef}
          accountTimezone={dashboardContext.activeAccount?.tradingTimezone ?? null}
          appearance={dashboardContext.appearance}
          demoAccountSelectionRef={demoAccountSelectionRef}
          initialMarketHaltAlertsEnabled={dashboardContext.marketHaltAlerts.enabled}
          initialMutedMarketHaltTickers={dashboardContext.mutedMarketHaltTickers}
          notifications={dashboardContext.notifications}
          offlineScopeRef={offlineScopeRef}
          pressReleaseUnreadCounts={dashboardContext.pressReleaseUnreadCounts}
          scannerEarlyAccess={scannerEarlyAccess}
          watchlistMemberNavigationAccess
          watchlistAdminNavigationAccess={watchlistAdminNavigationAccess}
          communityNavigationHref={dashboardContext.communityNavigationHref}
          coachingNavigationHref={dashboardContext.coachingNavigationHref}
          communityWatchlistsNavigationAccess={dashboardContext.communityWatchlistsNavigationAccess}
        >
          {children}
        </TraderLinkPlatformDashboardTemplate>
        <PwaLifecycle
          accountSelectionRef={accountSelectionRef}
          offlineScopeRef={offlineScopeRef}
        />
      </>
    </DashboardMuiProviders>
  );
}

export function TraderLinkPlatformDashboardFrame({
  children,
  loginReturnTo = "/workspace",
  watchlistMemberAccess = false,
}: {
  children: ReactNode;
  loginReturnTo?: string;
  watchlistMemberAccess?: boolean;
}) {
  return (
    <TraderLinkPlatformDashboardFrameContent
      loginReturnTo={loginReturnTo}
      watchlistMemberAccess={watchlistMemberAccess}
    >
      {children}
    </TraderLinkPlatformDashboardFrameContent>
  );
}
