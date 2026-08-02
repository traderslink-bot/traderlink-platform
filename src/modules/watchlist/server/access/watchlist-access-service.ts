import "server-only";

import type { NextRequest } from "next/server";

import {
  requireTraderLinkPlatformPageIdentity,
  requireTraderLinkPlatformRequestIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import {
  hasPlatformDiscordPremiumAccess,
  isPremiumWatchlistRoleConfigured,
} from "./platform-discord-watchlist-entitlement";

export type WatchlistAccessResult =
  | Readonly<{
      ok: true;
      principal: Readonly<{
        kind: "platform_user";
        platformUserId: string;
      }>;
    }>
  | Readonly<{
      ok: false;
      status: 401 | 403 | 503;
      reason:
        | "login_required"
        | "premium_required"
        | "premium_configuration_unavailable"
        | "local_boundary_denied";
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

function evaluateIdentity(
  identity: TraderLinkPlatformRequestIdentity,
): WatchlistAccessResult {
  if (identity.mode === "platform_session") {
    if (!isPremiumWatchlistRoleConfigured()) {
      return Object.freeze({
        ok: false as const,
        status: 503 as const,
        reason: "premium_configuration_unavailable" as const,
        error: "Premium watchlist role is not configured.",
      });
    }
    if (
      identity.discord === null ||
      !hasPlatformDiscordPremiumAccess(identity.discord)
    ) {
      return Object.freeze({
        ok: false as const,
        status: 403 as const,
        reason: "premium_required" as const,
        error: "Premium TradersLink membership is required to view the live watchlist.",
      });
    }
  }
  return Object.freeze({
    ok: true as const,
    principal: Object.freeze({
      kind: "platform_user" as const,
      platformUserId: identity.scope.userId,
    }),
  });
}

export async function authorizeWatchlistPageAccess(): Promise<WatchlistAccessResult> {
  try {
    return evaluateIdentity(await requireTraderLinkPlatformPageIdentity());
  } catch {
    return isLocalDevelopmentRuntime() ? localDenied() : loginRequired();
  }
}

export async function authorizeWatchlistRequest(
  request: NextRequest,
): Promise<WatchlistAccessResult> {
  try {
    return evaluateIdentity(
      requireTraderLinkPlatformRequestIdentity(request.headers),
    );
  } catch {
    return isLocalDevelopmentRuntime() ? localDenied() : loginRequired();
  }
}
