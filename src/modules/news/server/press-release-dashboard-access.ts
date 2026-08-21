import "server-only";

import type { TraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { hasPlatformDiscordPremiumAccess } from "../../watchlist/server/access/platform-discord-watchlist-entitlement";

export function hasPressReleaseDashboardAccess(
  identity: TraderLinkPlatformRequestIdentity,
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  if (identity.mode === "local_development") return true;
  return identity.discord !== null && hasPlatformDiscordPremiumAccess(
    identity.discord,
    environment,
  );
}
