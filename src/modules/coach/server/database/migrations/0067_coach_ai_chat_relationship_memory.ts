import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string, nullable = false): string {
  const expression = `length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${expression}${nullable ? ")" : ")"})`;
}

const sql = `CREATE TABLE coach_ai_relationship_memory_settings (
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  relationship_memory_enabled INTEGER NOT NULL DEFAULT 1
    CHECK (relationship_memory_enabled IN (0, 1)),
  meet_links_state TEXT NOT NULL DEFAULT 'not_started'
    CHECK (meet_links_state IN ('not_started', 'completed', 'skipped')),
  meet_links_completed_at_utc TEXT ${utcCheck("meet_links_completed_at_utc", true)},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  PRIMARY KEY (user_id, workspace_id),
  CHECK ((meet_links_state = 'completed' AND meet_links_completed_at_utc IS NOT NULL)
    OR (meet_links_state IN ('not_started', 'skipped') AND meet_links_completed_at_utc IS NULL)),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE coach_ai_relationship_memories (
  coach_ai_relationship_memory_id TEXT PRIMARY KEY
    ${uuidCheck("coach_ai_relationship_memory_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT ${uuidCheck("account_id")},
  scope_kind TEXT NOT NULL CHECK (scope_kind IN ('user', 'account')),
  category TEXT NOT NULL CHECK (category IN (
    'preferred_name', 'experience', 'trading_approach', 'markets_products',
    'setups', 'current_focus', 'emotional_pattern', 'routine',
    'learning_goal', 'preference', 'other'
  )),
  state TEXT NOT NULL CHECK (state IN ('active', 'forgotten')),
  current_version_sequence INTEGER NOT NULL CHECK (current_version_sequence >= 0),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  forgotten_at_utc TEXT ${utcCheck("forgotten_at_utc", true)},
  CHECK ((scope_kind = 'user' AND account_id IS NULL)
    OR (scope_kind = 'account' AND account_id IS NOT NULL)),
  CHECK ((state = 'active' AND current_version_sequence >= 1 AND forgotten_at_utc IS NULL)
    OR (state = 'forgotten' AND current_version_sequence = 0 AND forgotten_at_utc IS NOT NULL)),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_relationship_memories_user_list
ON coach_ai_relationship_memories(
  user_id, workspace_id, state, scope_kind, account_id, updated_at_utc DESC
);

CREATE TABLE coach_ai_relationship_memory_versions (
  coach_ai_relationship_memory_version_id TEXT PRIMARY KEY
    ${uuidCheck("coach_ai_relationship_memory_version_id")},
  coach_ai_relationship_memory_id TEXT NOT NULL
    ${uuidCheck("coach_ai_relationship_memory_id")},
  version_sequence INTEGER NOT NULL CHECK (version_sequence >= 1),
  memory_text_private TEXT NOT NULL CHECK (
    length(trim(memory_text_private)) BETWEEN 1 AND 500
    AND memory_text_private NOT GLOB '*[' || char(0) || '-' || char(8)
      || char(11) || char(12) || char(14) || '-' || char(31) || char(127) || ']*'
  ),
  source_kind TEXT NOT NULL CHECK (source_kind IN (
    'meet_links', 'direct_request', 'approved_suggestion',
    'memory_surface', 'user_edit', 'reconfirmation'
  )),
  source_conversation_id TEXT ${uuidCheck("source_conversation_id")},
  source_message_id TEXT ${uuidCheck("source_message_id")},
  source_conversation_title_private TEXT CHECK (
    source_conversation_title_private IS NULL OR
    length(trim(source_conversation_title_private)) BETWEEN 1 AND 160
  ),
  state TEXT NOT NULL CHECK (state IN ('current', 'superseded')),
  remembered_at_utc TEXT NOT NULL ${utcCheck("remembered_at_utc")},
  review_due_at_utc TEXT ${utcCheck("review_due_at_utc", true)},
  superseded_at_utc TEXT ${utcCheck("superseded_at_utc", true)},
  UNIQUE (coach_ai_relationship_memory_id, version_sequence),
  CHECK ((source_conversation_id IS NULL AND source_message_id IS NULL
      AND source_conversation_title_private IS NULL)
    OR (source_conversation_id IS NOT NULL
      AND source_conversation_title_private IS NOT NULL)),
  CHECK ((state = 'current' AND superseded_at_utc IS NULL)
    OR (state = 'superseded' AND superseded_at_utc IS NOT NULL)),
  FOREIGN KEY (coach_ai_relationship_memory_id)
    REFERENCES coach_ai_relationship_memories(coach_ai_relationship_memory_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (source_conversation_id)
    REFERENCES coach_ai_chat_conversations(coach_ai_chat_conversation_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (source_message_id)
    REFERENCES coach_ai_chat_messages(coach_ai_chat_message_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX coach_ai_relationship_memory_versions_one_current
ON coach_ai_relationship_memory_versions(coach_ai_relationship_memory_id)
WHERE state = 'current';

CREATE TABLE coach_ai_relationship_memory_events (
  coach_ai_relationship_memory_event_id TEXT PRIMARY KEY
    ${uuidCheck("coach_ai_relationship_memory_event_id")},
  coach_ai_relationship_memory_id TEXT NOT NULL
    ${uuidCheck("coach_ai_relationship_memory_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT ${uuidCheck("account_id")},
  event_kind TEXT NOT NULL CHECK (event_kind IN (
    'created', 'updated', 'reconfirmed', 'forgotten'
  )),
  version_sequence INTEGER CHECK (version_sequence IS NULL OR version_sequence >= 1),
  occurred_at_utc TEXT NOT NULL ${utcCheck("occurred_at_utc")},
  CHECK ((event_kind = 'forgotten' AND version_sequence IS NULL)
    OR (event_kind <> 'forgotten' AND version_sequence IS NOT NULL)),
  FOREIGN KEY (coach_ai_relationship_memory_id)
    REFERENCES coach_ai_relationship_memories(coach_ai_relationship_memory_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_relationship_memory_events_memory_order
ON coach_ai_relationship_memory_events(
  coach_ai_relationship_memory_id, occurred_at_utc, coach_ai_relationship_memory_event_id
);

CREATE TRIGGER coach_ai_relationship_memory_settings_scope
BEFORE INSERT ON coach_ai_relationship_memory_settings
WHEN NOT EXISTS (
  SELECT 1 FROM platform_users user
  JOIN platform_workspace_memberships membership
    ON membership.user_id = user.user_id AND membership.workspace_id = NEW.workspace_id
  JOIN platform_workspaces workspace ON workspace.workspace_id = membership.workspace_id
  WHERE user.user_id = NEW.user_id AND user.status = 'active'
    AND workspace.status = 'active' AND membership.status = 'active'
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_settings_scope_required'); END;

CREATE TRIGGER coach_ai_relationship_memory_settings_update_guard
BEFORE UPDATE ON coach_ai_relationship_memory_settings
WHEN NEW.user_id IS NOT OLD.user_id OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc <= OLD.updated_at_utc
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_settings_update_invalid'); END;

CREATE TRIGGER coach_ai_relationship_memory_settings_no_delete
BEFORE DELETE ON coach_ai_relationship_memory_settings
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_settings_required'); END;

CREATE TRIGGER coach_ai_relationship_memories_scope
BEFORE INSERT ON coach_ai_relationship_memories
WHEN NOT EXISTS (
  SELECT 1 FROM platform_users user
  JOIN platform_workspace_memberships membership
    ON membership.user_id = user.user_id AND membership.workspace_id = NEW.workspace_id
  JOIN platform_workspaces workspace ON workspace.workspace_id = membership.workspace_id
  LEFT JOIN journal_accounts account
    ON account.account_id = NEW.account_id AND account.workspace_id = NEW.workspace_id
  WHERE user.user_id = NEW.user_id AND user.status = 'active'
    AND workspace.status = 'active' AND membership.status = 'active'
    AND (NEW.scope_kind = 'user' OR (account.account_id IS NOT NULL AND account.status = 'active'))
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_scope_required'); END;

CREATE TRIGGER coach_ai_relationship_memories_update_guard
BEFORE UPDATE ON coach_ai_relationship_memories
WHEN NEW.coach_ai_relationship_memory_id IS NOT OLD.coach_ai_relationship_memory_id
  OR NEW.user_id IS NOT OLD.user_id OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.account_id IS NOT OLD.account_id OR NEW.scope_kind IS NOT OLD.scope_kind
  OR NEW.category IS NOT OLD.category OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR OLD.state = 'forgotten' OR NEW.updated_at_utc <= OLD.updated_at_utc
  OR NOT ((NEW.state = 'active' AND NEW.current_version_sequence > OLD.current_version_sequence)
    OR (NEW.state = 'forgotten' AND NEW.current_version_sequence = 0
      AND NEW.forgotten_at_utc IS NOT NULL))
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_update_invalid'); END;

CREATE TRIGGER coach_ai_relationship_memories_no_delete
BEFORE DELETE ON coach_ai_relationship_memories
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_audit_required'); END;

CREATE TRIGGER coach_ai_relationship_memory_versions_scope
BEFORE INSERT ON coach_ai_relationship_memory_versions
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_relationship_memories memory
  WHERE memory.coach_ai_relationship_memory_id = NEW.coach_ai_relationship_memory_id
    AND memory.state = 'active'
    AND memory.current_version_sequence = NEW.version_sequence
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_version_scope_required'); END;

CREATE TRIGGER coach_ai_relationship_memory_versions_update_guard
BEFORE UPDATE ON coach_ai_relationship_memory_versions
WHEN NEW.coach_ai_relationship_memory_version_id IS NOT OLD.coach_ai_relationship_memory_version_id
  OR NEW.coach_ai_relationship_memory_id IS NOT OLD.coach_ai_relationship_memory_id
  OR NEW.version_sequence IS NOT OLD.version_sequence
  OR NEW.memory_text_private IS NOT OLD.memory_text_private
  OR NEW.source_kind IS NOT OLD.source_kind
  OR NEW.source_conversation_id IS NOT OLD.source_conversation_id
  OR NEW.source_message_id IS NOT OLD.source_message_id
  OR NEW.source_conversation_title_private IS NOT OLD.source_conversation_title_private
  OR NEW.remembered_at_utc IS NOT OLD.remembered_at_utc
  OR NEW.review_due_at_utc IS NOT OLD.review_due_at_utc
  OR OLD.state <> 'current' OR NEW.state <> 'superseded'
  OR NEW.superseded_at_utc IS NULL
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_version_update_invalid'); END;

CREATE TRIGGER coach_ai_relationship_memory_versions_forget_delete
BEFORE DELETE ON coach_ai_relationship_memory_versions
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_relationship_memories memory
  WHERE memory.coach_ai_relationship_memory_id = OLD.coach_ai_relationship_memory_id
    AND memory.state = 'forgotten'
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_version_delete_invalid'); END;

CREATE TRIGGER coach_ai_relationship_memory_events_scope
BEFORE INSERT ON coach_ai_relationship_memory_events
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_relationship_memories memory
  WHERE memory.coach_ai_relationship_memory_id = NEW.coach_ai_relationship_memory_id
    AND memory.user_id = NEW.user_id AND memory.workspace_id = NEW.workspace_id
    AND memory.account_id IS NEW.account_id
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_event_scope_required'); END;

CREATE TRIGGER coach_ai_relationship_memory_events_no_update
BEFORE UPDATE ON coach_ai_relationship_memory_events
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_event_immutable'); END;

CREATE TRIGGER coach_ai_relationship_memory_events_no_delete
BEFORE DELETE ON coach_ai_relationship_memory_events
BEGIN SELECT RAISE(ABORT, 'coach_ai_relationship_memory_event_history_required'); END;`;

export const coachAiChatRelationshipMemoryMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0067_coach_ai_chat_relationship_memory",
  executionOrder: 67,
  statements: Object.freeze([sql]),
});
