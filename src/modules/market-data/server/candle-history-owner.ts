import "server-only";

import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { readProtectedInitialOwnerDiscordSubject } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export function hasCandleHistoryOwnerAccess(identity: TraderLinkPlatformRequestIdentity): boolean {
  if (identity.mode === "local_development" || identity.discord?.guildOwner) return true;
  const subject = readProtectedInitialOwnerDiscordSubject();
  if (!subject) return false;
  return withReadonlyPlatformDatabase({}, database => !!database.prepare(`
    SELECT 1 FROM platform_auth_identities WHERE user_id = ? AND auth_provider = 'discord'
    AND auth_subject = ? AND status = 'active'`).get(identity.scope.userId, subject));
}
