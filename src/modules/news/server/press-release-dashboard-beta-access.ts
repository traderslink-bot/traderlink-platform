import "server-only";

import type { TraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { hasPlatformDiscordPremiumAccess } from "../../watchlist/server/access/platform-discord-watchlist-entitlement";

export const TRADERLINK_PLATFORM_PRESS_RELEASE_ACCESS_ENV =
  "TRADERLINK_PLATFORM_PRESS_RELEASE_ACCESS" as const;

export type TraderLinkPlatformPressReleaseAccess =
  | "all_discord_members"
  | "premium";

type PressReleaseDiscordMembership = Readonly<{
  guildOwner: boolean;
  roleIds: readonly string[];
}>;

const defaultPressReleaseAccessEnvironment = Object.freeze({
  NODE_ENV: process.env.NODE_ENV,
  TRADERLINK_PLATFORM_PRESS_RELEASE_ACCESS:
    process.env.TRADERLINK_PLATFORM_PRESS_RELEASE_ACCESS,
});

export function resolveTraderLinkPlatformPressReleaseAccess(
  environment: Readonly<Partial<Record<
    "NODE_ENV" | typeof TRADERLINK_PLATFORM_PRESS_RELEASE_ACCESS_ENV,
    string | undefined
  >>> = defaultPressReleaseAccessEnvironment,
): TraderLinkPlatformPressReleaseAccess {
  return environment[TRADERLINK_PLATFORM_PRESS_RELEASE_ACCESS_ENV] === "all_discord_members"
    ? "all_discord_members"
    : "premium";
}

export function hasPressReleaseDashboardDiscordAccess(
  membership: PressReleaseDiscordMembership,
  environment?: NodeJS.ProcessEnv,
): boolean {
  return resolveTraderLinkPlatformPressReleaseAccess(environment) === "all_discord_members" ||
    hasPlatformDiscordPremiumAccess(membership, environment);
}

export function hasPressReleaseDashboardAccess(
  identity: TraderLinkPlatformRequestIdentity,
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  if (identity.mode === "local_development") return true;
  return identity.discord !== null && hasPressReleaseDashboardDiscordAccess(
    identity.discord,
    environment,
  );
}
