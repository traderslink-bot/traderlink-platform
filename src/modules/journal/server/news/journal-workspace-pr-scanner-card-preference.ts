import Database from "better-sqlite3";

import { narrowWorkspaceAccessToAccount, type WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export type WorkspacePrScannerCardPreference = Readonly<{
  revision: number | null;
  showInWorkspace: boolean;
}>;

function invalid(): never {
  return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "showInWorkspace" });
}

function conflict(): never {
  return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT", { field: "workspacePrScannerCard" });
}

function expectedRevision(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) invalid();
  return value;
}

function activeAccountScope(scope: WorkspaceAccessScope) {
  if (!scope.activeAccountId) return platformFailure("TRADERLINK_ACCOUNT_SELECTION_CONFLICT");
  return narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
}

export class JournalWorkspacePrScannerCardPreferenceService {
  constructor(private readonly database: Database.Database) {}

  read(scope: WorkspaceAccessScope): WorkspacePrScannerCardPreference {
    const account = activeAccountScope(scope);
    const row = this.database.prepare(`SELECT show_in_workspace, revision
FROM journal_workspace_pr_scanner_card_preferences
WHERE workspace_id = ? AND account_id = ? AND user_id = ?`).get(
      account.workspaceId,
      account.accountId,
      account.userId,
    ) as Readonly<{ revision: number; show_in_workspace: number }> | undefined;
    return Object.freeze({
      revision: row ? Number(row.revision) : null,
      // Preserve the already-released Workspace scanner card until a trader
      // explicitly turns it off in the scanner panel.
      showInWorkspace: row ? row.show_in_workspace === 1 : true,
    });
  }

  save(
    scope: WorkspaceAccessScope,
    input: Readonly<{ expectedRevision: unknown; now?: Date; showInWorkspace: unknown }>,
  ): WorkspacePrScannerCardPreference {
    if (typeof input.showInWorkspace !== "boolean") invalid();
    const expected = expectedRevision(input.expectedRevision);
    return this.database.transaction(() => {
      const account = activeAccountScope(scope);
      const current = this.read(scope);
      if (current.revision !== expected) conflict();
      const at = createCanonicalUtcTimestamp(input.now);
      if (current.revision === null) {
        this.database.prepare(`INSERT INTO journal_workspace_pr_scanner_card_preferences (
  workspace_id, account_id, user_id, show_in_workspace, revision, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 1, ?, ?)`).run(
          account.workspaceId,
          account.accountId,
          account.userId,
          input.showInWorkspace ? 1 : 0,
          at,
          at,
        );
      } else if (this.database.prepare(`UPDATE journal_workspace_pr_scanner_card_preferences
SET show_in_workspace = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND user_id = ? AND revision = ?`).run(
        input.showInWorkspace ? 1 : 0,
        current.revision + 1,
        at,
        account.workspaceId,
        account.accountId,
        account.userId,
        current.revision,
      ).changes !== 1) {
        conflict();
      }
      return this.read(scope);
    }).immediate();
  }
}
