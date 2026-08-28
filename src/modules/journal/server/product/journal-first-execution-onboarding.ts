import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { JournalDemoAccountRepository } from "../demo/journal-demo-account-repository";

export type JournalFirstExecutionOnboardingStatus = Readonly<{
  activeAccountIsDemo: boolean;
  demoLifecycleState: "available" | "cleared";
  hasAcceptedExecution: boolean;
  hasActiveMoomooConnection: boolean;
  hasRealAcceptedExecution: boolean;
}>;

export function readJournalFirstExecutionOnboardingStatus(
  scope: WorkspaceAccessScope,
): JournalFirstExecutionOnboardingStatus {
  return withReadonlyPlatformDatabase({}, (database) => {
    const demoAccounts = new JournalDemoAccountRepository(database);
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
      activeAccountIsDemo: demoAccounts.findActiveAccount(scope) !== null,
      demoLifecycleState: demoAccounts.findLifecycleForUser(scope)?.state ?? "available",
      hasAcceptedExecution,
      hasActiveMoomooConnection: connection?.state === "active",
      hasRealAcceptedExecution: demoAccounts.hasRealAcceptedExecution(scope),
    });
  });
}
