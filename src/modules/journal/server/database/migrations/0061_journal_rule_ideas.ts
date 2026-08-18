import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 9, 1) = '-' AND substr(${column}, 14, 1) = '-'
    AND substr(${column}, 19, 1) = '-' AND substr(${column}, 24, 1) = '-'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB
    '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

function sha256Check(column: string): string {
  return `CHECK (length(${column}) = 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^0-9a-f]*')`;
}

const sql = `CREATE TABLE journal_rule_ideas (
  rule_idea_id TEXT PRIMARY KEY ${uuidCheck("rule_idea_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  template_id TEXT NOT NULL CHECK (length(template_id) BETWEEN 1 AND 96 AND template_id NOT GLOB '*[^a-z0-9_]*'),
  current_version_id TEXT NOT NULL ${uuidCheck("current_version_id")},
  disposition TEXT NOT NULL CHECK (disposition IN ('available', 'saved_for_later', 'not_for_me', 'added')),
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, rule_idea_id),
  UNIQUE (workspace_id, account_id, template_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, rule_idea_id, current_version_id) REFERENCES journal_rule_idea_versions(workspace_id, account_id, rule_idea_id, rule_idea_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE UNIQUE INDEX journal_rule_ideas_one_available
  ON journal_rule_ideas(workspace_id, account_id) WHERE disposition = 'available';
CREATE INDEX journal_rule_ideas_account_updated
  ON journal_rule_ideas(workspace_id, account_id, updated_at_utc DESC, rule_idea_id);

CREATE TABLE journal_rule_idea_versions (
  rule_idea_version_id TEXT PRIMARY KEY ${uuidCheck("rule_idea_version_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  rule_idea_id TEXT NOT NULL ${uuidCheck("rule_idea_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  event_kind TEXT NOT NULL CHECK (event_kind IN ('issued', 'reissued', 'saved_for_later', 'not_for_me', 'added')),
  disposition TEXT NOT NULL CHECK (disposition IN ('available', 'saved_for_later', 'not_for_me', 'added')),
  evidence_version TEXT NOT NULL CHECK (evidence_version = 'journal_rule_idea_evidence_v1'),
  evidence_json TEXT NOT NULL CHECK (length(evidence_json) BETWEEN 2 AND 262144 AND json_valid(evidence_json) AND json_type(evidence_json) = 'object'),
  evidence_sha256 TEXT NOT NULL ${sha256Check("evidence_sha256")},
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, rule_idea_id, version_number),
  UNIQUE (workspace_id, account_id, rule_idea_id, rule_idea_version_id),
  FOREIGN KEY (workspace_id, account_id, rule_idea_id) REFERENCES journal_rule_ideas(workspace_id, account_id, rule_idea_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_rule_idea_versions_account_issued
  ON journal_rule_idea_versions(workspace_id, account_id, created_at_utc DESC, rule_idea_version_id)
  WHERE event_kind IN ('issued', 'reissued');

CREATE TRIGGER journal_rule_ideas_no_delete BEFORE DELETE ON journal_rule_ideas
BEGIN SELECT RAISE(ABORT, 'journal_rule_idea_history_required'); END;
CREATE TRIGGER journal_rule_idea_versions_no_update BEFORE UPDATE ON journal_rule_idea_versions
BEGIN SELECT RAISE(ABORT, 'journal_rule_idea_version_immutable'); END;
CREATE TRIGGER journal_rule_idea_versions_no_delete BEFORE DELETE ON journal_rule_idea_versions
BEGIN SELECT RAISE(ABORT, 'journal_rule_idea_version_immutable'); END;`;

export const journalRuleIdeasMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0061_journal_rule_ideas",
  executionOrder: 61,
  statements: Object.freeze([sql]),
});
