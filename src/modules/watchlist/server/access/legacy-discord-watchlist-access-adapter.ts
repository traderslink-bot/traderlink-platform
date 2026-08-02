import "server-only";

import type { NextRequest } from "next/server";

import { getCurrentAcademySession } from "@/app/academy/academy-server-session";
import {
  ACADEMY_SESSION_COOKIE,
  AcademyProgressStore,
  type AcademySession,
} from "@/src/lib/academy/academy-progress-store";

import {
  hasPlatformDiscordPremiumAccess,
  isPremiumWatchlistRoleConfigured,
} from "./platform-discord-watchlist-entitlement";

export type LegacyWatchlistAccessResult =
  | Readonly<{
      ok: true;
      principal: Readonly<{
        kind: "discord_compatibility";
        platformUserId: null;
      }>;
    }>
  | Readonly<{
      ok: false;
      status: 401 | 403 | 503;
      reason:
        | "login_required"
        | "premium_required"
        | "premium_configuration_unavailable";
      error: string;
    }>;

export function hasPremiumWatchlistAccess(session: AcademySession): boolean {
  return hasPlatformDiscordPremiumAccess({
    guildOwner: session.user.guildOwner,
    roleIds: session.user.roleIds,
  });
}

function evaluateLegacySession(
  session: AcademySession | null,
): LegacyWatchlistAccessResult {
  if (!session) {
    return Object.freeze({
      ok: false as const,
      status: 401 as const,
      reason: "login_required" as const,
      error: "Discord login is required to view the live watchlist.",
    });
  }
  if (!isPremiumWatchlistRoleConfigured() && process.env.NODE_ENV === "production") {
    return Object.freeze({
      ok: false as const,
      status: 503 as const,
      reason: "premium_configuration_unavailable" as const,
      error: "Premium watchlist role is not configured.",
    });
  }
  if (!hasPremiumWatchlistAccess(session)) {
    return Object.freeze({
      ok: false as const,
      status: 403 as const,
      reason: "premium_required" as const,
      error: "Premium TradersLink membership is required to view the live watchlist.",
    });
  }
  return Object.freeze({
    ok: true as const,
    principal: Object.freeze({
      kind: "discord_compatibility" as const,
      platformUserId: null,
    }),
  });
}

export async function resolveLegacyDiscordWatchlistPageAccess(): Promise<LegacyWatchlistAccessResult> {
  return evaluateLegacySession(await getCurrentAcademySession());
}

export async function resolveLegacyDiscordWatchlistRequestAccess(
  request: NextRequest,
): Promise<LegacyWatchlistAccessResult> {
  const token = request.cookies.get(ACADEMY_SESSION_COOKIE)?.value;
  const session = await new AcademyProgressStore().getSessionByToken(token);
  return evaluateLegacySession(session);
}
