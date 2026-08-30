import "server-only";

import type { NextRequest } from "next/server";

import {
  requireTraderLinkPlatformPageIdentity,
  requireTraderLinkPlatformRequestIdentity,
  requireTraderLinkPlatformDiscordMemberPageIdentity,
  requireTraderLinkPlatformDiscordMemberRequestIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "./watchlist-dashboard-navigation-access";
import { readWatchlistVisibility } from "./watchlist-visibility-service";

export type WatchlistAccessResult =
  | Readonly<{
      ok: true;
      principal: Readonly<{
        kind: "platform_user" | "watchlist_owner";
        platformUserId: string;
      }>;
    }>
  | Readonly<{
      ok: false;
      status: 401 | 403 | 404;
      reason:
        | "login_required"
        | "local_boundary_denied"
        | "visibility_disabled";
      error: string;
    }>;

function isLocalDevelopmentRuntime(): boolean {
  return process.env.NODE_ENV === "development" && process.env.VERCEL_ENV === undefined;
}

function localDenied(): WatchlistAccessResult {
  return Object.freeze({
    ok: false as const,
    status: 403 as const,
    reason: "local_boundary_denied" as const,
    error: "Local Watchlist access is unavailable outside the protected review server.",
  });
}

function loginRequired(): WatchlistAccessResult {
  return Object.freeze({
    ok: false as const,
    status: 401 as const,
    reason: "login_required" as const,
    error: "Discord login is required to view the live watchlist.",
  });
}

function visibilityDisabled(): WatchlistAccessResult {
  return Object.freeze({
    ok: false as const,
    status: 404 as const,
    reason: "visibility_disabled" as const,
    error: "Watchlist is unavailable.",
  });
}

function isWatchlistOwner(identity: TraderLinkPlatformRequestIdentity): boolean {
  try {
    return hasWatchlistDashboardNavigationAccess(identity);
  } catch {
    return false;
  }
}

function evaluateIdentity(
  identity: TraderLinkPlatformRequestIdentity,
): WatchlistAccessResult {
  if (isWatchlistOwner(identity)) {
    return Object.freeze({
      ok: true as const,
      principal: Object.freeze({
        kind: "watchlist_owner" as const,
        platformUserId: identity.scope.userId,
      }),
    });
  }
  const visibility = readWatchlistVisibility();
  if (visibility.status !== "available" || !visibility.memberVisible) {
    return visibilityDisabled();
  }
  return Object.freeze({
    ok: true as const,
    principal: Object.freeze({
      kind: "platform_user" as const,
      platformUserId: identity.scope.userId,
    }),
  });
}

async function authorizeOwnerPageAccess(): Promise<WatchlistAccessResult | null> {
  try {
    const identity = await requireTraderLinkPlatformPageIdentity();
    if (!isWatchlistOwner(identity)) return null;
    return Object.freeze({
      ok: true as const,
      principal: Object.freeze({
        kind: "watchlist_owner" as const,
        platformUserId: identity.scope.userId,
      }),
    });
  } catch {
    return null;
  }
}

function authorizeOwnerRequestAccess(request: NextRequest): WatchlistAccessResult | null {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    if (!isWatchlistOwner(identity)) return null;
    return Object.freeze({
      ok: true as const,
      principal: Object.freeze({
        kind: "watchlist_owner" as const,
        platformUserId: identity.scope.userId,
      }),
    });
  } catch {
    return null;
  }
}

export async function authorizeWatchlistPageAccess(): Promise<WatchlistAccessResult> {
  try {
    return evaluateIdentity(await requireTraderLinkPlatformDiscordMemberPageIdentity());
  } catch {
    const ownerAccess = await authorizeOwnerPageAccess();
    if (ownerAccess) return ownerAccess;
    return isLocalDevelopmentRuntime() ? localDenied() : loginRequired();
  }
}

export async function authorizeWatchlistRequest(
  request: NextRequest,
): Promise<WatchlistAccessResult> {
  try {
    return evaluateIdentity(
      requireTraderLinkPlatformDiscordMemberRequestIdentity(request.headers),
    );
  } catch {
    const ownerAccess = authorizeOwnerRequestAccess(request);
    if (ownerAccess) return ownerAccess;
    return isLocalDevelopmentRuntime() ? localDenied() : loginRequired();
  }
}
