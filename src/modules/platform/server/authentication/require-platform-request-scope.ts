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
}>;

type ResolvePlatformRequestIdentityOptions = PlatformRequestIdentityOptions & Readonly<{
  requireDashboardAccess: boolean;
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
  const environment = options.environment ?? process.env;
  const selectionRef = readJournalAccountSelectionCookie(requestHeaders);
  const developmentBoundary = validateDevelopmentDashboardRequest(
    requestHeaders,
    environment,
  );
  if (developmentBoundary.ok) {
    return withReadonlyPlatformDatabase(options, (database) => Object.freeze({
      mode: "local_development" as const,
      sessionId: null,
      scope: deriveDevelopmentOwnerJournalScope(
        database,
        undefined,
        selectionRef,
      ).scope,
      displayName: null,
      discord: null,
    }));
  }
  if (environment.NODE_ENV !== "production") {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  const token = readSingleCookie(
    requestHeaders,
    TRADERLINK_PLATFORM_SESSION_COOKIE,
  );
  if (!token) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  return withPlatformDatabase(
    { ...options, environment, mode: "runtime" },
    (database) => {
      const session = new PlatformSessionService(
        new PlatformSessionRepository(database),
        { now: options.now },
      ).resolve(token);
      if (!session || session.authProvider !== "discord") {
        platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      }
      const memberships = new PlatformDiscordMembershipRepository(database);
      const configuredMembership = memberships.findCurrent(
        session.userId,
        resolveTraderLinkDiscordGuildId(environment),
      );
      const communityGuild = database.prepare(`SELECT community.discord_guild_id
FROM traderlink_communities community
JOIN traderlink_community_memberships member
  ON member.community_id = community.community_id
WHERE member.user_id = ?
  AND member.status = 'active'
  AND community.status IN ('setup', 'active')
ORDER BY member.discord_verified_at_utc DESC
LIMIT 1`).get(session.userId) as { discord_guild_id: string } | undefined;
      const membership = configuredMembership ?? (communityGuild
        ? memberships.findCurrent(session.userId, communityGuild.discord_guild_id)
        : null);
      if (!membership) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      if (
        options.requireDashboardAccess &&
        !communityGuild &&
        !new PlatformDashboardMemberAccessRepository(database)
          .read().allowAllDiscordMembers &&
        !hasPlatformDiscordPremiumAccess({
          guildOwner: membership.guildOwner,
          roleIds: membership.roleIds,
        }, environment)
      ) {
        platformFailure("TRADERLINK_DASHBOARD_ACCESS_DENIED");
      }
      return Object.freeze({
        mode: "platform_session" as const,
        sessionId: session.sessionId,
        scope: derivePlatformSessionJournalScope(
          database,
          session.userId,
          selectionRef,
        ),
        displayName: session.displayName,
        discord: Object.freeze({
          guildOwner: membership.guildOwner,
          roleIds: membership.roleIds,
        }),
      });
    },
  );
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
