import { headers } from "next/headers";
import { DiscordConnectionNotice } from "./discord-connection-notice";
import { readMembershipDiscordConnection } from "@/src/modules/platform/server/membership/membership-discord-connection";
import { hasOwnerMarketDataAccess } from "@/src/modules/level-analysis/server/owner-market-data-access";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

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
import { DemoSessionActivation } from "./demo-session-activation";
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

type FrameTimingPhase = "headers" | "identity" | "connection" | "context";
let lastSlowFrameTimingAt = Number.NEGATIVE_INFINITY;
let workspaceFrameLogWindow = { startedAt: 0, count: 0 };

function createFrameTiming() {
  const started = performance.now();
  const durations: Record<FrameTimingPhase, number> = { headers: 0, identity: 0, connection: 0, context: 0 };
  let phase: FrameTimingPhase | null = "headers";
  let phaseStarted = started;
  let traceId: string | null = null;
  let proxyToFrameMs: number | null = null;
  const next = (value: FrameTimingPhase | null) => {
    const now = performance.now();
    if (phase !== null) durations[phase] += now - phaseStarted;
    phaseStarted = now;
    phase = value;
  };
  return {
    next,
    setCorrelation(id: string | null, proxyStartedAt: string | null) {
      if (!id || !/^[0-9a-f-]{36}$/u.test(id)) return;
      traceId = id;
      const start = Number(proxyStartedAt);
      const elapsed = Date.now() - start;
      if (Number.isSafeInteger(start) && elapsed >= 0 && elapsed <= 600_000) {
        proxyToFrameMs = elapsed;
      }
    },
    finish() {
      try {
        next(null);
        const now = performance.now();
        const total = now - started;
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
  loginReturnTo = "/workspace",
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
  timing.setCorrelation(
    requestHeaders.get("x-traderlink-speed-id"),
    requestHeaders.get("x-traderlink-speed-start-ms"),
  );
  timing.next("identity");
  const workspaceLanding = requestPath === "/workspace" || requestPath === "/workspace/";
  let identity;
  try {
    identity = (billingMemberAccess || workspaceLanding)
      ? await requireTraderLinkPlatformBillingPageIdentity()
      : watchlistMemberAccess
      ? await requireTraderLinkPlatformAuthenticatedPageIdentity({
          membershipFeatures: ["watchlist.access"],
        })
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
      process.env.NODE_ENV === "production" &&
      isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_DASHBOARD_ACCESS_DENIED"
    ) {
      redirect("/access-required");
    }
    if (
      (process.env.NODE_ENV === "production" ||
        (process.env.NODE_ENV === "development" &&
          process.env.TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_SESSIONS === "true")) &&
      isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED"
    ) {
      redirect(`/login?returnTo=${encodeURIComponent(requestPath?.startsWith("/account/") ? requestPath : loginReturnTo)}`);
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
  const watchlistAdminNavigationAccess = hasWatchlistDashboardNavigationAccess(identity);
  const readAtUtc = createCanonicalUtcTimestamp();
  timing.next("context");
  const dashboardContext = withReadonlyPlatformDatabase({}, (database) => {
    const demos = new JournalDemoAccountRepository(database);
    const demo = demos.findAccountForUser(scope);
    const demoActivationPending = identity.mode === "platform_session" && scope.workspaceRole === "owner" &&
      demos.findLifecycleForUser(scope)?.state !== "cleared" &&
      (!demo || (demo.demoPackVersionId !== JOURNAL_DEMO_CURRENT_VERSION_ID && !demos.findPackApplication({
        accountId: demo.accountId, workspaceId: scope.workspaceId, demoPackVersionId: JOURNAL_DEMO_CURRENT_VERSION_ID,
      })) || demos.hasPendingIndicatorAnalysis(scope));
    const activeAccount = scope.activeAccountId
      ? new JournalAccountService(new JournalAccountRepository(database))
        .requireAccountRecord(scope, scope.activeAccountId)
      : null;
    const marketHaltAlerts = new MarketHaltAlertRepository(database);
    return Object.freeze({
      demoActivationPending,
      activeAccount,
      activeDemoAccount: new JournalDemoAccountRepository(database).findActiveAccount(scope),
      appearance: new PlatformUserPreferenceRepository(database).getActiveWorkspaceAppearance(scope),
      marketHaltAlerts: marketHaltAlerts.read(scope),
      mutedMarketHaltTickers: marketHaltAlerts.listMutedTickers({
        readAtUtc,
        scope,
      }),
      notifications: new PlatformNotificationRepository(database).list(scope, 5),
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
        watchlistAdminNavigationAccess={watchlistAdminNavigationAccess}
        >
          {discordConnection && requestPath !== "/account/login" ? <DiscordConnectionNotice required={discordConnection.required} connected={discordConnection.connected} joined={discordConnection.joined} /> : null}
          {children}
        </TraderLinkPlatformDashboardTemplate>
        <PwaLifecycle
          accountSelectionRef={accountSelectionRef}
          offlineScopeRef={offlineScopeRef}
        />
          {dashboardContext.demoActivationPending ? <DemoSessionActivation scopeRef={offlineScopeRef} /> : null}
      </>
    </DashboardMuiProviders>
  );
  } finally {
    timing.finish();
  }
}

export function TraderLinkPlatformDashboardFrame({
  children,
  loginReturnTo = "/workspace",
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
