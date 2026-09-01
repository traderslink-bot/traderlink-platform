import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { JournalDemoAccountRepository } from "@/src/modules/journal/server/demo/journal-demo-account-repository";
import { JournalRoundTripRepository } from "@/src/modules/journal/server/round-trips/journal-round-trip-repository";
import { hasWorkspaceTradeLibraryProjectionSchema } from "./workspace-trade-library-projection";

type RevisionRow = Readonly<{ projection_revision_id: string }>;
type CurrentExecutionRow = Readonly<{ has_current_execution: number }>;

function activeAccountId(scope: WorkspaceAccessScope): string | null {
  return scope.activeAccountId && scope.allowedAccountIds.includes(scope.activeAccountId)
    ? scope.activeAccountId
    : null;
}

function hasProjectionRevision(
  database: Database.Database,
  workspaceId: string,
  accountId: string,
): boolean {
  return Boolean(database.prepare(`SELECT projection_revision_id
FROM journal_workspace_trade_library_projection_revisions
WHERE workspace_id = ? AND account_id = ?`).get(workspaceId, accountId) as RevisionRow | undefined);
}

function hasCurrentExecution(
  database: Database.Database,
  workspaceId: string,
  accountId: string,
): boolean {
  return (database.prepare(`SELECT EXISTS(
  SELECT 1 FROM journal_executions
  WHERE workspace_id = ? AND account_id = ?
    AND current_state IN ('accepted', 'needs_decision')
) AS has_current_execution`).get(workspaceId, accountId) as CurrentExecutionRow)
    .has_current_execution !== 0;
}

/**
 * Repairs the one legacy state where a selected Demo account has canonical
 * executions but predates the derived Workspace trade-library revision. This
 * is intentionally not a Journal write path: it can only rebuild the selected
 * Demo account's derived projection and revision.
 */
export function materializeMissingDemoWorkspaceTradeLibraryProjection(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  refreshedAtUtc: string,
): boolean {
  const accountId = activeAccountId(scope);
  if (!accountId || !hasWorkspaceTradeLibraryProjectionSchema(database) ||
      !new JournalDemoAccountRepository(database).findActiveAccount(scope) ||
      hasProjectionRevision(database, scope.workspaceId, accountId) ||
      !hasCurrentExecution(database, scope.workspaceId, accountId)) {
    return false;
  }

  const repository = new JournalRoundTripRepository(database);
  return repository.immediate(() => {
    if (hasProjectionRevision(database, scope.workspaceId, accountId) ||
        !hasCurrentExecution(database, scope.workspaceId, accountId)) return false;

    repository.refreshWorkspaceTradeLibraryProjection({
      accountId,
      userId: scope.userId,
      workspaceId: scope.workspaceId,
      workspaceRole: scope.workspaceRole,
    }, refreshedAtUtc);
    return true;
  });
}

export function recoverLegacyDemoWorkspaceTradeLibraryProjection(
  scope: WorkspaceAccessScope,
  now: Date = new Date(),
): boolean {
  return withPlatformDatabase({ mode: "runtime" }, (database) =>
    materializeMissingDemoWorkspaceTradeLibraryProjection(
      database,
      scope,
      now.toISOString(),
    ));
}
