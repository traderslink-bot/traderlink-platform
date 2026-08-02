import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import {
  deriveJournalAccountSelectionRef,
  resolveJournalAccountSelection,
  type JournalAccountSelectionRef,
} from "../../contracts/journal-account-selection";
import { platformFailure } from "../database/platform-migration-contract";

export function currentJournalAccountSelectionRef(
  scope: WorkspaceAccessScope,
): JournalAccountSelectionRef {
  if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  return deriveJournalAccountSelectionRef(scope.workspaceId, scope.activeAccountId);
}

export function requireExpectedJournalAccountSelection(
  scope: WorkspaceAccessScope,
  expectedSelectionRef: unknown,
): JournalAccountSelectionRef {
  const expected = resolveJournalAccountSelection(
    scope.workspaceId,
    expectedSelectionRef,
    scope.allowedAccountIds.map((accountId) => Object.freeze({ accountId })),
  );
  if (!scope.activeAccountId || expected.accountId !== scope.activeAccountId) {
    platformFailure("TRADERLINK_ACCOUNT_SELECTION_CONFLICT");
  }
  return expected.selectionRef;
}
