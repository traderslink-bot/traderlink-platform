import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `ALTER TABLE journal_execution_versions
ADD COLUMN manual_fee_input_state TEXT
  CHECK (manual_fee_input_state IN ('not_entered', 'entered'));

CREATE INDEX journal_execution_versions_manual_fee_input_state
  ON journal_execution_versions(workspace_id, account_id, manual_fee_input_state);`;

export const journalManualFeeInputStateMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0115_journal_manual_fee_input_state",
  executionOrder: 115,
  statements: Object.freeze([sql]),
});
