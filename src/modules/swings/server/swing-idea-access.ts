import "server-only";
import { requireTraderLinkPlatformDiscordMemberRequestIdentity, type TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasPlatformDiscordPremiumAccess } from "@/src/modules/watchlist/server/access/platform-discord-watchlist-entitlement";

export async function readSwingIdeaAccess(headers: Headers): Promise<{
  identity: TraderLinkPlatformRequestIdentity | null; premium: boolean;
}> {
  try {
    // Use the existing app's authenticated membership and Premium role.
    // No separate bot dependency, timer, or Swing-only membership requirement.
    const identity = requireTraderLinkPlatformDiscordMemberRequestIdentity(headers);
    return { identity, premium: Boolean(identity.discord && hasPlatformDiscordPremiumAccess(identity.discord)) };
  } catch {
    return { identity: null, premium: false };
  }
}
