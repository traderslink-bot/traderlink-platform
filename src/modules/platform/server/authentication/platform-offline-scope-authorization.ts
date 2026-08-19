import "server-only";

import { createHash } from "node:crypto";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";

const PLATFORM_OFFLINE_SCOPE_DOMAIN = "traderlink:platform-offline-scope:v1";

declare const platformOfflineScopeRefBrand: unique symbol;

export type PlatformOfflineScopeRef = string & {
  readonly [platformOfflineScopeRefBrand]: true;
};

/**
 * Browser-safe partition key for one signed-in Platform user and workspace.
 * It reveals no raw user, workspace, Discord, broker, or Journal identifier.
 */
export function currentPlatformOfflineScopeRef(
  scope: WorkspaceAccessScope,
): PlatformOfflineScopeRef {
  return createHash("sha256")
    .update(
      `${PLATFORM_OFFLINE_SCOPE_DOMAIN}\n${JSON.stringify([
        scope.userId,
        scope.workspaceId,
      ])}\n`,
      "utf8",
    )
    .digest("hex") as PlatformOfflineScopeRef;
}
