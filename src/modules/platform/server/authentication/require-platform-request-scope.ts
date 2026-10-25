import "server-only";

import { headers as nextHeaders } from "next/headers";
import { cache } from "react";

import { deriveDevelopmentOwnerJournalScope } from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "../database/platform-migration-contract";
import { withPlatformDatabase } from "../database/open-platform-database";
import { withReadonlyPlatformDatabase } from "../database/open-readonly-platform-database";
import { deriveAuthenticatedUserJournalScope } from "./authenticated-user-journal-scope";
import { validateDevelopmentDashboardRequest } from "./development-dashboard-network-boundary";
import { readJournalAccountSelectionCookie } from "./journal-account-selection-cookie";
import { PlatformDiscordMembershipRepository } from "./platform-discord-membership-repository";
import { PlatformDashboardMemberAccessRepository } from "./platform-dashboard-member-access-repository";
import { resolveTraderLinkDiscordGuildId } from "./platform-discord-configuration";
import { PlatformSessionRepository } from "./platform-session-repository";
import {
  PlatformSessionService,
  TRADERLINK_PLATFORM_SESSION_COOKIE,
} from "./platform-session-service";
import { hasPlatformDiscordPremiumAccess } from "../../../watchlist/server/access/platform-discord-watchlist-entitlement";
import {
  assertMembershipFeature,
  evaluateMembershipFeature,
  hasPlatformMembershipFeature,
} from "../membership/platform-membership-access";

type IdentityTimingPhase = "preflight" | "runtime_open" | "readonly_open" | "session" | "membership" | "journal_scope" | "close";
let lastSlowIdentityTimingAt = Number.NEGATIVE_INFINITY;
let workspaceIdentityLogWindow = { startedAt: 0, count: 0 };

function createIdentityTiming(candidateTraceId: string | null) {
  const traceId = candidateTraceId && /^[0-9a-f-]{36}$/u.test(candidateTraceId)
    ? candidateTraceId : null;
  const started = performance.now();
  const durations: Record<IdentityTimingPhase, number> = {
    preflight: 0, runtime_open: 0, readonly_open: 0, session: 0, membership: 0, journal_scope: 0, close: 0,
  };
  let phase: IdentityTimingPhase = "preflight";
  let phaseStarted = started;
  const next = (value: IdentityTimingPhase) => {
    const now = performance.now();
    durations[phase] += now - phaseStarted;
    phaseStarted = now;
    phase = value;
  };
  return {
    next,
    finish() {
      try {
        const now = performance.now();
        durations[phase] += now - phaseStarted;
        const elapsed = now - started;
        if (traceId) {
          const wallNow = Date.now();
          if (wallNow - workspaceIdentityLogWindow.startedAt >= 60_000) {
            workspaceIdentityLogWindow = { startedAt: wallNow, count: 0 };
          }
          if (workspaceIdentityLogWindow.count >= 20) return;
          workspaceIdentityLogWindow.count += 1;
        } else {
          if (elapsed < 1_000 || now - lastSlowIdentityTimingAt < 60_000) return;
          lastSlowIdentityTimingAt = now;
        }
        console.info("platform_identity_timing", {
          trace_id: traceId,
          total_ms: Math.round(elapsed), preflight_ms: Math.round(durations.preflight),
          runtime_open_ms: Math.round(durations.runtime_open), readonly_open_ms: Math.round(durations.readonly_open),
          session_ms: Math.round(durations.session), membership_ms: Math.round(durations.membership),
          journal_scope_ms: Math.round(durations.journal_scope), close_ms: Math.round(durations.close),
        });
      } catch { /* Diagnostics must not replace an authentication result or failure. */ }
    },
  };
}

export type TraderLinkPlatformRequestIdentity = Readonly<{
  mode: "local_development" | "platform_session";
  sessionId: string | null;
  scope: WorkspaceAccessScope;
  displayName: string | null;
  discord: Readonly<{
    guildOwner: boolean;
    roleIds: readonly string[];
  }> | null;
}>;

type PlatformRequestIdentityOptions = Readonly<{
  environment?: NodeJS.ProcessEnv;
  databasePath?: string;
  forbiddenRepositoryRoots?: readonly string[];
  now?: () => Date;
  membershipFeatures?: readonly string[];
  membershipAnyFeatures?: readonly string[];
}>;

type ResolvePlatformRequestIdentityOptions = PlatformRequestIdentityOptions & Readonly<{
  requireDashboardAccess: boolean;
  requireDiscordMembership?: boolean;
}>;

function readSingleCookie(requestHeaders: Headers, name: string): string | null {
  const encoded = requestHeaders.get("cookie");
  if (!encoded) return null;
  const prefix = `${name}=`;
  const values = encoded.split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(prefix))
    .map((part) => part.slice(prefix.length));
  if (values.length === 0) return null;
  if (values.length !== 1 || !values[0]) {
    platformFailure("TRADERLINK_AUTH_SESSION_INVALID");
  }
  try {
    return decodeURIComponent(values[0]);
  } catch {
    platformFailure("TRADERLINK_AUTH_SESSION_INVALID");
  }
}

function derivePlatformSessionJournalScope(
  database: Parameters<typeof deriveAuthenticatedUserJournalScope>[0],
  userId: string,
  selectionRef: ReturnType<typeof readJournalAccountSelectionCookie>,
): WorkspaceAccessScope {
  try {
    return deriveAuthenticatedUserJournalScope(database, userId, selectionRef);
  } catch (error) {
    const staleSelection = selectionRef !== null &&
      isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_ACCOUNT_ACCESS_DENIED" &&
      error.safeContext.reason === "journal_account_selection_ref_invalid";
    if (!staleSelection) throw error;

    // Browser selection is advisory for an authenticated page request. Re-derive
    // the deterministic active-account fallback from this user's current scope.
    return deriveAuthenticatedUserJournalScope(database, userId, null);
  }
}

function resolveTraderLinkPlatformRequestIdentity(
  requestHeaders: Headers,
  options: ResolvePlatformRequestIdentityOptions,
): TraderLinkPlatformRequestIdentity {
  const timing = createIdentityTiming(requestHeaders.get("x-traderlink-speed-id"));
  try {
  const environment = options.environment ?? process.env;
  const selectionRef = readJournalAccountSelectionCookie(requestHeaders);
  const developmentBoundary = validateDevelopmentDashboardRequest(
    requestHeaders,
    environment,
  );
  if (developmentBoundary.ok) {
    timing.next("readonly_open");
    return withReadonlyPlatformDatabase(options, (database) => {
      timing.next("journal_scope");
      const scope = deriveDevelopmentOwnerJournalScope(database, undefined, selectionRef).scope;
      timing.next("close");
      return Object.freeze({ mode: "local_development" as const, sessionId: null, scope, displayName: null, discord: null });
    });
  }
  if (environment.NODE_ENV !== "production" && !(
    environment.NODE_ENV === "development" &&
    environment.TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_SESSIONS === "true"
  )) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  const token = readSingleCookie(
    requestHeaders,
    TRADERLINK_PLATFORM_SESSION_COOKIE,
  );
  if (!token) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  timing.next("runtime_open");
  return withPlatformDatabase(
    { ...options, environment, mode: "runtime" },
    (database) => {
      timing.next("session");
      const session = new PlatformSessionService(
        new PlatformSessionRepository(database),
        { now: options.now },
      ).resolve(token);
      if (!session || !["discord", "google", "email"].includes(session.authProvider)) {
        platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      }
      timing.next("membership");
      const discordConnected = Boolean(database.prepare("SELECT 1 FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").get(session.userId));
      const membership = discordConnected ? new PlatformDiscordMembershipRepository(database)
        .findCurrent(
          session.userId,
          resolveTraderLinkDiscordGuildId(environment),
        ) : null;
      const membershipDashboardAccess = hasPlatformMembershipFeature(
        database,
        session.userId,
        "dashboard.access",
      );
      if (options.requireDashboardAccess) {
        assertMembershipFeature(database, session.userId, "dashboard.access");
      }
      for (const feature of options.membershipFeatures ?? []) {
        assertMembershipFeature(database, session.userId, feature);
      }
      if (
        options.membershipAnyFeatures?.length &&
        !options.membershipAnyFeatures.some((feature) =>
          evaluateMembershipFeature(database, session.userId, feature).allowed)
      ) {
        assertMembershipFeature(database, session.userId, options.membershipAnyFeatures[0]);
      }
      if (
        !membership &&
        options.requireDiscordMembership !== false &&
        !membershipDashboardAccess
      ) {
        platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      }
      if (
        options.requireDashboardAccess &&
        !membershipDashboardAccess &&
        !new PlatformDashboardMemberAccessRepository(database)
          .read().allowAllDiscordMembers &&
        !hasPlatformDiscordPremiumAccess({
          guildOwner: membership?.guildOwner ?? false,
          roleIds: membership?.roleIds ?? [],
        }, environment)
      ) {
        platformFailure("TRADERLINK_DASHBOARD_ACCESS_DENIED");
      }
      timing.next("journal_scope");
      const scope = derivePlatformSessionJournalScope(database, session.userId, selectionRef);
      timing.next("close");
      return Object.freeze({
        mode: "platform_session" as const,
        sessionId: session.sessionId,
        scope,
        displayName: session.displayName,
        discord: membership ? Object.freeze({
          guildOwner: membership.guildOwner,
          roleIds: membership.roleIds,
        }) : null,
      });
    },
  );
  } finally {
    timing.finish();
  }
}

export function requireTraderLinkPlatformRequestIdentity(
  requestHeaders: Headers,
  options: PlatformRequestIdentityOptions = {},
): TraderLinkPlatformRequestIdentity {
  return resolveTraderLinkPlatformRequestIdentity(requestHeaders, {
    ...options,
    requireDashboardAccess: true,
  });
}

export function requireTraderLinkPlatformDiscordMemberRequestIdentity(
  requestHeaders: Headers,
  options: PlatformRequestIdentityOptions = {},
): TraderLinkPlatformRequestIdentity {
  return resolveTraderLinkPlatformRequestIdentity(requestHeaders, {
    ...options,
    requireDashboardAccess: false,
  });
}

/** Stable signed-in identity; each standalone feature supplies its own commercial policy. */
export function requireTraderLinkPlatformAuthenticatedRequestIdentity(
  requestHeaders: Headers,
  options: PlatformRequestIdentityOptions = {},
): TraderLinkPlatformRequestIdentity {
  return resolveTraderLinkPlatformRequestIdentity(requestHeaders, {
    ...options,
    requireDashboardAccess: false,
    requireDiscordMembership: false,
  });
}

export async function requireTraderLinkPlatformAuthenticatedPageIdentity(
  options: Omit<PlatformRequestIdentityOptions, "environment"> = {},
): Promise<TraderLinkPlatformRequestIdentity> {
  return requireTraderLinkPlatformAuthenticatedRequestIdentity(await nextHeaders(), {
    ...options,
    environment: process.env,
  });
}

/** Billing requires a stable account, not a paid plan or Discord role. */
export const requireTraderLinkPlatformBillingRequestIdentity =
  requireTraderLinkPlatformAuthenticatedRequestIdentity;

export async function requireTraderLinkPlatformBillingPageIdentity(): Promise<
  TraderLinkPlatformRequestIdentity
> {
  return requireTraderLinkPlatformBillingRequestIdentity(await nextHeaders(), {
    environment: process.env,
  });
}

export function requireTraderLinkPlatformRequestScope(
  requestHeaders: Headers,
  options: Parameters<typeof requireTraderLinkPlatformRequestIdentity>[1] = {},
): WorkspaceAccessScope {
  return requireTraderLinkPlatformRequestIdentity(requestHeaders, options).scope;
}

// This is intentionally a zero-argument React Server Component cache. It
// shares one authenticated identity snapshot only within a single RSC render;
// React clears it before the next request. Do not use it from Server Actions
// or route handlers, which must continue through the explicit request/page
// resolvers below.
const requireCurrentServerComponentDashboardIdentity = cache(
  async (): Promise<TraderLinkPlatformRequestIdentity> =>
    requireTraderLinkPlatformRequestIdentity(await nextHeaders(), {
      environment: process.env,
    }),
);

export async function requireTraderLinkPlatformServerComponentPageIdentity(): Promise<
  TraderLinkPlatformRequestIdentity
> {
  return requireCurrentServerComponentDashboardIdentity();
}

export async function requireTraderLinkPlatformServerComponentPageScope(): Promise<
  WorkspaceAccessScope
> {
  return (await requireCurrentServerComponentDashboardIdentity()).scope;
}

export async function requireTraderLinkPlatformPageIdentity(
  options: Omit<PlatformRequestIdentityOptions, "environment"> = {},
): Promise<TraderLinkPlatformRequestIdentity> {
  return requireTraderLinkPlatformRequestIdentity(await nextHeaders(), {
    ...options,
    environment: process.env,
  });
}

export async function requireTraderLinkPlatformDiscordMemberPageIdentity(
  options: Omit<PlatformRequestIdentityOptions, "environment"> = {},
): Promise<TraderLinkPlatformRequestIdentity> {
  return requireTraderLinkPlatformDiscordMemberRequestIdentity(await nextHeaders(), {
    ...options,
    environment: process.env,
  });
}

export async function requireTraderLinkPlatformPageScope(
  options: Parameters<typeof requireTraderLinkPlatformPageIdentity>[0] = {},
): Promise<WorkspaceAccessScope> {
  return (await requireTraderLinkPlatformPageIdentity(options)).scope;
}

export {
  currentJournalAccountSelectionRef,
  requireExpectedJournalAccountSelection,
} from "./journal-account-selection-authorization";
