import "server-only";

import { createHash } from "node:crypto";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export type JournalDataDecisionNoticeSummary = Readonly<{
  evidenceRef: string | null;
  pendingCount: number;
}>;

export function readJournalDataDecisionNoticeSummary(
  scope: WorkspaceAccessScope,
): JournalDataDecisionNoticeSummary {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return withReadonlyPlatformDatabase({}, (database) => {
    const rows = database.prepare<[string, string], Readonly<{
      decision_id: string;
      revision: number;
      issue_code: string;
      effect_code: string;
      updated_at_utc: string;
    }>>(`SELECT decision_id, revision, issue_code, effect_code, updated_at_utc
FROM journal_data_decisions
WHERE workspace_id = ? AND account_id = ? AND state = 'pending'
ORDER BY decision_id`).all(scope.workspaceId, accountId);
    if (rows.length === 0) {
      return Object.freeze({ evidenceRef: null, pendingCount: 0 });
    }
    return Object.freeze({
      evidenceRef: createHash("sha256")
        .update(JSON.stringify(rows.map((row) => [
          row.decision_id,
          row.revision,
          row.issue_code,
          row.effect_code,
          row.updated_at_utc,
        ])))
        .digest("hex"),
      pendingCount: rows.length,
    });
  });
}

export function readJournalDataDecisionNoticeRef(
  scope: WorkspaceAccessScope,
): string | null {
  return readJournalDataDecisionNoticeSummary(scope).evidenceRef;
}
