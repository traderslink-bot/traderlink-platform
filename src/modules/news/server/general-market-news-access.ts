import "server-only";
import type { TraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
/** Exactly two stable Platform identities. No display-name, role or development bypass. */
export function hasGeneralMarketNewsAccess(
  identity: Pick<TraderLinkPlatformRequestIdentity, "scope"> | null,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  const ids = environment.TRADERLINK_GENERAL_NEWS_USER_IDS?.split(",").map(id => id.trim()) ?? [];
  return ids.length === 2 && new Set(ids).size === 2 && ids.every(id => uuid.test(id)) &&
    identity !== null && ids.includes(identity.scope.userId);
}
