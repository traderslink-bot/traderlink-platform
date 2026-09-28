import "server-only";

import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { isMembershipAccessDenied } from "@/src/modules/platform/server/membership/platform-membership-access";

import {
  requireTraderLinkPlatformAuthenticatedPageIdentity,
  requireTraderLinkPlatformAuthenticatedRequestIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";

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
      status: 401 | 403;
      reason:
        | "login_required"
        | "local_boundary_denied"
        | "membership_required";
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
    return evaluateIdentity(await requireTraderLinkPlatformAuthenticatedPageIdentity({ membershipFeatures: ["watchlist.access"] }));
  } catch (error) {
    if (isMembershipAccessDenied(error)) redirect("/plans");
    return isLocalDevelopmentRuntime() ? localDenied() : loginRequired();
  }
}

export async function authorizeWatchlistRequest(
  request: Pick<NextRequest, "headers">,
  identityOptions: Parameters<typeof requireTraderLinkPlatformAuthenticatedRequestIdentity>[1] = {},
): Promise<WatchlistAccessResult> {
  try {
    return evaluateIdentity(
      requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers, { ...identityOptions, membershipFeatures: ["watchlist.access"] }),
    );
  } catch (error) {
    if (isMembershipAccessDenied(error)) return { ok: false, status: 403, reason: "membership_required", error: "Your current plans do not include Watchlist access. Review Plans or contact the owner." };
    return isLocalDevelopmentRuntime() ? localDenied() : loginRequired();
  }
}
