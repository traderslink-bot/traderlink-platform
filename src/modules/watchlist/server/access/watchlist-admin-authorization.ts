import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformAdminAuditRepository } from "@/src/modules/platform/server/administration/platform-admin-audit-repository";
import { consumeJournalAdminRateLimit } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { hasWatchlistDashboardNavigationAccess } from "./watchlist-dashboard-navigation-access";

const digest = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

/** Watchlist authority is its existing active Discord allowlist, not a Journal grant.
 * The identity still comes from the real Platform session/development boundary.
 * Mutation handlers retain their independent same-origin/CSRF checks.
 */
export function withWatchlistAdminDatabase<T>(
  requestHeaders: Headers,
  operation: (database: Database.Database, scope: Readonly<{ userId: string }>) => T,
  options: Readonly<{
    environment?: NodeJS.ProcessEnv;
    databasePath?: string;
    forbiddenRepositoryRoots?: readonly string[];
    now?: () => Date;
  }> = {},
): T {
  const environment = options.environment ?? process.env;
  const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(requestHeaders, {
    ...options, environment,
  });
  consumeJournalAdminRateLimit({
    category: "access", environment, headers: requestHeaders,
    now: options.now, userId: identity.scope.userId,
  });
  const allowed = hasWatchlistDashboardNavigationAccess(identity, { ...options, environment });
  return withPlatformDatabase({ ...options, environment, mode: "runtime" }, database => {
    const supplied = requestHeaders.get("x-request-id");
    const correlation = supplied && supplied.length <= 200 && !/[\u0000-\u001f\u007f]/u.test(supplied)
      ? supplied : randomUUID();
    new PlatformAdminAuditRepository(database).append({
      actorKind: "platform_user",
      actorUserId: identity.scope.userId,
      actorRole: "authenticated_user",
      action: allowed ? "admin_access_allowed" : "admin_access_denied",
      targetKind: "authority",
      targetRefSha256: digest("watchlist_administration"),
      outcome: allowed ? "success" : "denied",
      reasonCode: allowed ? "configured_watchlist_owner" : "watchlist_owner_not_configured",
      correlationRefSha256: digest(`traderlink-admin-request-v1\u001f${correlation}`),
      previewReceiptSha256: null,
      details: { boundary: "watchlist_administration" },
      createdAtUtc: createCanonicalUtcTimestamp(options.now?.() ?? new Date()),
    });
    if (!allowed) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    return operation(database, Object.freeze({ userId: identity.scope.userId }));
  });
}
