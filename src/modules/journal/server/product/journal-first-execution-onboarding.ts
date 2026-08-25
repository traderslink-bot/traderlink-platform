import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export type JournalFirstExecutionOnboardingStatus = Readonly<{
  hasAcceptedExecution: boolean;
  hasActiveMoomooConnection: boolean;
}>;

export function readJournalFirstExecutionOnboardingStatus(
  scope: WorkspaceAccessScope,
): JournalFirstExecutionOnboardingStatus {
  return withReadonlyPlatformDatabase({}, (database) => {
    const hasAcceptedExecution = scope.allowedAccountIds.length > 0 && Boolean(
      database.prepare(`
SELECT 1 AS found
FROM journal_executions
WHERE workspace_id = ?
  AND account_id IN (${scope.allowedAccountIds.map(() => "?").join(", ")})
  AND current_state = 'accepted'
LIMIT 1`).get(scope.workspaceId, ...scope.allowedAccountIds),
    );
    const connection = new MoomooConnectionRepository(database).find(scope);
    return Object.freeze({
      hasAcceptedExecution,
      hasActiveMoomooConnection: connection?.state === "active",
    });
  });
}
