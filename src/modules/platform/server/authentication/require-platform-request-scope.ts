import "server-only";

import { headers as nextHeaders } from "next/headers";

import { deriveDevelopmentOwnerJournalScope } from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import { platformFailure } from "../database/platform-migration-contract";
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
      const membership = new PlatformDiscordMembershipRepository(database)
        .findCurrent(
          session.userId,
          resolveTraderLinkDiscordGuildId(environment),
        );
      if (!membership) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      if (
        options.requireDashboardAccess &&
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
        scope: deriveAuthenticatedUserJournalScope(
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
