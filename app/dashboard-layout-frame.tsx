import { isCommunityReviewDiscordGuild } from "@/src/modules/communities/server/community-review-discord-guild";
import { readCommunityHistoryEntry } from "@/src/modules/communities/contracts/community-history-entry";
import { headers } from "next/headers";
import { DiscordConnectionNotice } from "./discord-connection-notice";
import { readMembershipDiscordConnection } from "@/src/modules/platform/server/membership/membership-discord-connection";
import { evaluateMembershipFeature, hasJournalWorkspaceAccess } from "@/src/modules/platform/server/membership/platform-membership-access";
import { hasOwnerMarketDataAccess } from "@/src/modules/level-analysis/server/owner-market-data-access";
import { hasGeneralMarketNewsAccess } from "@/src/modules/news/server/general-market-news-access";
import type { ReactNode } from "react";
import { isPlatformSignedInLandingPath, PLATFORM_ENTRY_PATH } from "@/src/modules/platform/contracts/platform-home-page";
import { loginReturnTo as safeLoginReturnTo } from "@/src/modules/platform/server/authentication/platform-login-http";
import { notFound, redirect } from "next/navigation";

import { TraderLinkPlatformDashboardTemplate } from "./dashboard-template";
import {
  requireTraderLinkPlatformAuthenticatedPageIdentity,
  requireTraderLinkPlatformBillingPageIdentity,
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformServerComponentPageIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalAccountService } from "@/src/modules/journal/server/accounts/journal-account-service";
import { JournalDemoAccountRepository } from "@/src/modules/journal/server/demo/journal-demo-account-repository";
import { JOURNAL_DEMO_CURRENT_VERSION_ID } from "@/src/modules/journal/server/demo/journal-demo-current-version";
import { DashboardDemoSetup } from "./demo-session-activation";
import { PwaLifecycle } from "./pwa/pwa-lifecycle";
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

type FrameTimingPhase = "headers" | "identity" | "connection" | "context";
let lastSlowFrameTimingAt = Number.NEGATIVE_INFINITY;
let workspaceFrameLogWindow = { startedAt: 0, count: 0 };

function createFrameTiming() {
  const frameStartedEpochMs = Date.now();
  const started = performance.now();
  const durations: Record<FrameTimingPhase, number> = { headers: 0, identity: 0, connection: 0, context: 0 };
  let phase: FrameTimingPhase | null = "headers";
  let phaseStarted = started;
  let traceId: string | null = null;
  let proxyToFrameMs: number | null = null;
  let proxyEntryEpochMs: number | null = null;
  let edgeRequestStartEpochMs: number | null = null;
  let railwayRequestId: string | null = null;
  const next = (value: FrameTimingPhase | null) => {
    const now = performance.now();
    if (phase !== null) durations[phase] += now - phaseStarted;
    phaseStarted = now;
    phase = value;
  };
  return {
    next,
    setCorrelation(id: string | null, proxyStartedAt: string | null,
      edgeStartedAt: string | null, railwayId: string | null) {
      if (!id || !/^[0-9a-f-]{36}$/u.test(id)) return;
      traceId = id;
      const start = Number(proxyStartedAt);
      const elapsed = Date.now() - start;
      if (Number.isSafeInteger(start) && elapsed >= 0 && elapsed <= 600_000) {
        proxyEntryEpochMs = start;
        proxyToFrameMs = elapsed;
        const edgeRaw = edgeStartedAt?.trim() ?? "";
        const edgeStart = Number(edgeRaw);
        if (/^\d{13}$/u.test(edgeRaw) && Number.isSafeInteger(edgeStart) &&
          start - edgeStart >= 0 && start - edgeStart <= 600_000) {
          edgeRequestStartEpochMs = edgeStart;
        }
        if (railwayId && /^[A-Za-z0-9_-]{12,64}$/u.test(railwayId)) {
          railwayRequestId = railwayId;
        }
      }
    },
    finish() {
      try {
        next(null);
        const now = performance.now();
        const total = now - started;
        const frameMeasuredEndEpochMs = Date.now();
        if (traceId) {
          const wallNow = Date.now();
          if (wallNow - workspaceFrameLogWindow.startedAt >= 60_000) {
            workspaceFrameLogWindow = { startedAt: wallNow, count: 0 };
          }
          if (workspaceFrameLogWindow.count >= 20) return;
          workspaceFrameLogWindow.count += 1;
        } else {
          if (total < 1_000 || now - lastSlowFrameTimingAt < 60_000) return;
          lastSlowFrameTimingAt = now;
        }
        console.info("dashboard_frame_timing", {
          trace_id: traceId,
          proxy_entry_epoch_ms: proxyEntryEpochMs,
          edge_request_start_epoch_ms: edgeRequestStartEpochMs,
          railway_request_id: railwayRequestId,
          frame_start_epoch_ms: frameStartedEpochMs,
          frame_measured_end_epoch_ms: frameMeasuredEndEpochMs,
          proxy_to_frame_ms: proxyToFrameMs,
          total_ms: Math.round(total),
          headers_ms: Math.round(durations.headers),
          identity_ms: Math.round(durations.identity),
          connection_ms: Math.round(durations.connection),
          context_ms: Math.round(durations.context),
        });
      } catch { /* Diagnostics must not replace a response, redirect or error. */ }
    },
  };
}

async function TraderLinkPlatformDashboardFrameContent({
  children,
  loginReturnTo = PLATFORM_ENTRY_PATH,
  watchlistMemberAccess = false,
  billingMemberAccess = false,
}: {
  children: ReactNode;
  loginReturnTo?: string;
  watchlistMemberAccess?: boolean;
  billingMemberAccess?: boolean;
}) {
  const timing = createFrameTiming();
  try {
  const requestHeaders = await headers();
  const requestPath = requestHeaders.get("x-traderlink-page-path");
  const historyEntry = readCommunityHistoryEntry(requestHeaders);
  if (historyEntry === "invalid") notFound();
  timing.setCorrelation(
    requestHeaders.get("x-traderlink-speed-id"),
    requestHeaders.get("x-traderlink-speed-start-ms"),
    requestHeaders.get("x-request-start"),
    requestHeaders.get("x-railway-request-id"),
  );
  timing.next("identity");
  const communityRecoverySlug = requestPath?.match(/^\/communities\/([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\/recovery\/?$/u)?.[1];
  const communityRecovery = communityRecoverySlug !== undefined
    && communityRecoverySlug.length >= 3 && communityRecoverySlug.length <= 80;
  let identity;
  try {
    identity = (billingMemberAccess || isPlatformSignedInLandingPath(requestPath))
      ? await requireTraderLinkPlatformBillingPageIdentity()
      : watchlistMemberAccess
      ? await requireTraderLinkPlatformAuthenticatedPageIdentity({
          membershipFeatures: ["watchlist.access"],
        })
      : communityRecovery || historyEntry
      ? await requireTraderLinkPlatformAuthenticatedPageIdentity()
      : await requireTraderLinkPlatformServerComponentPageIdentity();
  } catch (error) {
    if (
      process.env.NODE_ENV === "production" &&
      isTraderLinkPlatformError(error) &&
      error.safeContext.reason === "membership_feature_required"
    ) {
      redirect("/plans");
    }
    if (
      isTraderLinkPlatformError(error) && (
        error.safeContext.reason === "dashboard_membership_required" ||
        (process.env.NODE_ENV === "production" && error.code === "TRADERLINK_DASHBOARD_ACCESS_DENIED")
      )
    ) {
      const returnTo = safeLoginReturnTo(requestHeaders.get("x-traderlink-page-return-to"), loginReturnTo);
      redirect(`/access-required?returnTo=${encodeURIComponent(returnTo)}`);
    }
    if (
      (process.env.NODE_ENV === "production" ||
        (process.env.NODE_ENV === "development" &&
          process.env.TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_SESSIONS === "true")) &&
      isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED"
    ) {
      const returnTo = safeLoginReturnTo(requestHeaders.get("x-traderlink-page-return-to"), loginReturnTo);
      redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    throw error;
  }
  const scope = identity.scope;
  timing.next("connection");
  const discordConnection = identity.mode === "platform_session"
    ? withReadonlyPlatformDatabase({}, database => readMembershipDiscordConnection(database, scope.userId)) : null;
  timing.next(null);
  const canReadPressReleases = hasPressReleaseDashboardAccess(identity);
  const scannerEarlyAccess = hasScannerEarlyAccess(identity);
  const ownerMarketDataAccess = hasOwnerMarketDataAccess(identity);
  const generalMarketNewsAccess = hasGeneralMarketNewsAccess(identity);
  const watchlistAdminNavigationAccess = hasWatchlistDashboardNavigationAccess(identity);
  const readAtUtc = createCanonicalUtcTimestamp();
  timing.next("context");
  const dashboardContext = withReadonlyPlatformDatabase({}, (database) => {
    const demos = new JournalDemoAccountRepository(database);
    const demo = demos.findAccountForUser(scope);
    const activeDemoAccount = demos.findActiveAccount(scope);
    const demoAvailable = scope.workspaceRole === "owner" && demos.findLifecycleForUser(scope)?.state !== "cleared";
    const demoActivationPending = identity.mode === "platform_session" && demoAvailable &&
      (!demo || (demo.demoPackVersionId !== JOURNAL_DEMO_CURRENT_VERSION_ID && !demos.findPackApplication({
        accountId: demo.accountId, workspaceId: scope.workspaceId, demoPackVersionId: JOURNAL_DEMO_CURRENT_VERSION_ID,
      })) || demos.hasPendingIndicatorAnalysis(scope));
    let autoOpenDemo = null;
    if (demoAvailable && scope.activeAccountId && !activeDemoAccount && !demos.hasRealAcceptedExecution(scope)) {
      const journal = identity.mode === "local_development" || hasJournalWorkspaceAccess(database, scope.userId);
      autoOpenDemo = {
        journal,
        analyzer: journal || evaluateMembershipFeature(database, scope.userId, "analytics.access").allowed,
      };
    }
    const activeAccount = scope.activeAccountId
      ? new JournalAccountService(new JournalAccountRepository(database))
        .requireAccountRecord(scope, scope.activeAccountId)
      : null;
    const marketHaltAlerts = new MarketHaltAlertRepository(database);
    const communityRepository = new TraderLinkCommunityRepository(database);
    const communityAccess = (watchlistAdminNavigationAccess ? communityRepository.listForUser(scope.userId) : [])
      .filter((community) => isCommunityReviewDiscordGuild(community.discordGuildId))
      .map((community) => ({
        community,
        access: communityRepository.resolveAccess(community.communityId, scope.userId),
      }))
      .filter((entry) => entry.access.capabilities.includes("community.view"));
    const firstCommunity = communityAccess[0] ?? null;
    const defaultCommunityHref = firstCommunity ? `/communities/${firstCommunity.community.slug}` : "/communities";
    const independentCoachingAvailable=Boolean(database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_coaching_contexts'").get());
    const firstCoachingCommunity = communityAccess.find((entry) =>
      entry.access.capabilities.includes("community.coaching.view") ||
      entry.access.capabilities.includes("community.coaching.offer"),
    ) ?? null;
    return Object.freeze({
      demoActivationPending,
      autoOpenDemo,
      activeAccount,
      activeDemoAccount,
      appearance: new PlatformUserPreferenceRepository(database).getActiveWorkspaceAppearance(scope),
      marketHaltAlerts: marketHaltAlerts.read(scope),
      mutedMarketHaltTickers: marketHaltAlerts.listMutedTickers({
        readAtUtc,
        scope,
      }),
      notifications: new PlatformNotificationRepository(database).list(scope, 5),
      communityNavigationHref: watchlistAdminNavigationAccess ? defaultCommunityHref : null,
      coachingNavigationHref: independentCoachingAvailable?'/coaching':firstCoachingCommunity
        ? `/communities/${firstCoachingCommunity.community.slug}/coaching`
        : null,
    });
  });
  timing.next(null);
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
          deferPressReleaseUnreadCounts={canReadPressReleases}
          scannerEarlyAccess={scannerEarlyAccess}
          watchlistMemberNavigationAccess
          ownerMarketDataAccess={ownerMarketDataAccess}
          generalMarketNewsAccess={generalMarketNewsAccess}
        watchlistAdminNavigationAccess={watchlistAdminNavigationAccess}
          communityNavigationHref={dashboardContext.communityNavigationHref}
          partnerChannelsNavigationAccess={process.env.PARTNER_ALERT_REQUEST_RUNTIME_ENABLED === "true"}
          coachingNavigationHref={dashboardContext.coachingNavigationHref}
        >
          {discordConnection && requestPath !== "/account/login" ? <DiscordConnectionNotice required={discordConnection.required} connected={discordConnection.connected} joined={discordConnection.joined} /> : null}
          <DashboardDemoSetup
            autoOpenDemo={dashboardContext.autoOpenDemo}
            ensureDemo={dashboardContext.demoActivationPending}
            scopeRef={offlineScopeRef}
          >
            {children}
          </DashboardDemoSetup>
        </TraderLinkPlatformDashboardTemplate>
        <PwaLifecycle
          accountSelectionRef={accountSelectionRef}
          offlineScopeRef={offlineScopeRef}
        />
      </>
    </DashboardMuiProviders>
  );
  } finally {
    timing.finish();
  }
}

export function TraderLinkPlatformDashboardFrame({
  children,
  loginReturnTo = PLATFORM_ENTRY_PATH,
  watchlistMemberAccess = false,
  billingMemberAccess = false,
}: {
  children: ReactNode;
  loginReturnTo?: string;
  watchlistMemberAccess?: boolean;
  billingMemberAccess?: boolean;
}) {
  return (
    <TraderLinkPlatformDashboardFrameContent
      loginReturnTo={loginReturnTo}
      watchlistMemberAccess={watchlistMemberAccess}
      billingMemberAccess={billingMemberAccess}
    >
      {children}
    </TraderLinkPlatformDashboardFrameContent>
  );
}
