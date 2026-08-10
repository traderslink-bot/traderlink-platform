import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `ALTER TABLE journal_rule_review_versions
ADD COLUMN note_text TEXT NOT NULL DEFAULT ''
CHECK (length(note_text) <= 10000);`;

export const journalRuleReviewNotesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0052_journal_rule_review_notes",
  executionOrder: 52,
  statements: Object.freeze([sql]),
});
