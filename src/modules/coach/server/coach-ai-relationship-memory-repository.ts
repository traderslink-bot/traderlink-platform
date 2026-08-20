import type Database from "better-sqlite3";

import type {
  CoachAiMeetLinksMemory,
  CoachAiRelationshipMemory,
  CoachAiRelationshipMemoryCategory,
  CoachAiRelationshipMemoryScope,
  CoachAiRelationshipMemorySettings,
  CoachAiRelationshipMemorySourceKind,
  CoachAiRelationshipMemoryView,
  CoachAiRelationshipMemoryWrite,
} from "@/src/modules/coach/contracts/ai-relationship-memory-contracts";
import {
  COACH_AI_RELATIONSHIP_MEMORY_CATEGORIES,
  COACH_AI_RELATIONSHIP_MEMORY_SOURCE_KINDS,
} from "@/src/modules/coach/contracts/ai-relationship-memory-contracts";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

const MEMORY_TEXT_MAX_LENGTH = 500;
const MAX_MEET_LINKS_MEMORIES = 16;
const FORBIDDEN_CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

type VerifiedScopeRow = Readonly<{
  account_id: string;
  account_display_name: string;
}>;

type SettingsRow = Readonly<{
  relationship_memory_enabled: 0 | 1;
  meet_links_state: "not_started" | "completed" | "skipped";
  meet_links_completed_at_utc: string | null;
}>;

type MemoryRow = Readonly<{
  coach_ai_relationship_memory_id: string;
  account_id: string | null;
  scope_kind: "user" | "account";
  account_display_name: string | null;
  category: CoachAiRelationshipMemoryCategory;
  current_version_sequence: number;
  updated_at_utc: string;
  memory_text_private: string;
  source_kind: CoachAiRelationshipMemorySourceKind;
  source_conversation_id: string | null;
  source_conversation_title_private: string | null;
  remembered_at_utc: string;
  review_due_at_utc: string | null;
}>;

type ExistingMemoryRow = Readonly<{
  coach_ai_relationship_memory_id: string;
  account_id: string | null;
  scope_kind: "user" | "account";
  category: CoachAiRelationshipMemoryCategory;
  current_version_sequence: number;
  updated_at_utc: string;
}>;

type SourceRow = Readonly<{ title: string }>;

function normalizeMemoryText(value: unknown): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "memoryText" });
  }
  const text = value.trim();
  if (text.length < 1 || text.length > MEMORY_TEXT_MAX_LENGTH ||
      FORBIDDEN_CONTROL_CHARACTERS.test(text)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "memoryText" });
  }
  return text;
}

function assertCategory(value: unknown): CoachAiRelationshipMemoryCategory {
  if (typeof value !== "string" ||
      !(COACH_AI_RELATIONSHIP_MEMORY_CATEGORIES as readonly string[]).includes(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "memoryCategory" });
  }
  return value as CoachAiRelationshipMemoryCategory;
}

function assertSourceKind(value: unknown): CoachAiRelationshipMemorySourceKind {
  if (typeof value !== "string" ||
      !(COACH_AI_RELATIONSHIP_MEMORY_SOURCE_KINDS as readonly string[]).includes(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "memorySourceKind" });
  }
  return value as CoachAiRelationshipMemorySourceKind;
}

function timestampAfter(candidate: Date, previousUtc: string): Date {
  const previous = Date.parse(previousUtc);
  return candidate.getTime() > previous ? candidate : new Date(previous + 1);
}

export class CoachAiRelationshipMemoryRepository {
  constructor(private readonly database: Database.Database) {}

  private transaction<T>(operation: () => T): T {
    return this.database.inTransaction ? operation() :
      this.database.transaction(operation).immediate();
  }

  private verifiedScope(scope: WorkspaceAccessScope): VerifiedScopeRow {
    if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const row = this.database.prepare<[string, string, string], VerifiedScopeRow>(`SELECT
  account.account_id, account.display_name AS account_display_name
FROM platform_users user
JOIN platform_workspace_memberships membership
  ON membership.user_id = user.user_id AND membership.workspace_id = ?
JOIN platform_workspaces workspace ON workspace.workspace_id = membership.workspace_id
JOIN journal_accounts account
  ON account.account_id = ? AND account.workspace_id = workspace.workspace_id
WHERE user.user_id = ? AND user.status = 'active' AND workspace.status = 'active'
  AND membership.status = 'active' AND account.status = 'active'`).get(
      scope.workspaceId,
      scope.activeAccountId,
      scope.userId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return row;
  }

  private normalizeScope(
    scope: WorkspaceAccessScope,
    requested: CoachAiRelationshipMemoryScope,
    verified: VerifiedScopeRow,
  ): Readonly<{ kind: "user" | "account"; accountId: string | null }> {
    if (requested.kind === "user") return Object.freeze({ kind: "user", accountId: null });
    assertCanonicalUuidV4(requested.accountId, "memoryAccountId");
    if (requested.accountId !== verified.account_id ||
        !scope.allowedAccountIds.includes(requested.accountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    return Object.freeze({ kind: "account", accountId: requested.accountId });
  }

  private settings(scope: WorkspaceAccessScope): CoachAiRelationshipMemorySettings {
    const row = this.database.prepare<[string, string], SettingsRow>(`SELECT
  relationship_memory_enabled, meet_links_state, meet_links_completed_at_utc
FROM coach_ai_relationship_memory_settings
WHERE user_id = ? AND workspace_id = ?`).get(scope.userId, scope.workspaceId);
    return Object.freeze({
      enabled: row ? row.relationship_memory_enabled === 1 : true,
      meetLinksState: row?.meet_links_state ?? "not_started",
      meetLinksCompletedAtUtc: row?.meet_links_completed_at_utc ?? null,
    });
  }

  private memoryRecord(row: MemoryRow, now: Date): CoachAiRelationshipMemory {
    const scope: CoachAiRelationshipMemoryScope = row.scope_kind === "user"
      ? Object.freeze({ kind: "user" })
      : Object.freeze({ kind: "account", accountId: row.account_id! });
    return Object.freeze({
      memoryId: row.coach_ai_relationship_memory_id,
      scope,
      scopeLabel: row.scope_kind === "user"
        ? "Across TradersLink"
        : `${row.account_display_name ?? "Journal account"} only`,
      category: row.category,
      text: row.memory_text_private,
      versionSequence: row.current_version_sequence,
      sourceKind: row.source_kind,
      sourceConversationId: row.source_conversation_id,
      sourceConversationTitle: row.source_conversation_title_private,
      rememberedAtUtc: row.remembered_at_utc,
      reviewDueAtUtc: row.review_due_at_utc,
      needsReview: row.review_due_at_utc !== null && Date.parse(row.review_due_at_utc) <= now.getTime(),
      updatedAtUtc: row.updated_at_utc,
    });
  }

  read(scope: WorkspaceAccessScope, now = new Date()): CoachAiRelationshipMemoryView {
    const verified = this.verifiedScope(scope);
    const rows = this.database.prepare<[string, string, string], MemoryRow>(`SELECT
  memory.coach_ai_relationship_memory_id, memory.account_id, memory.scope_kind,
  account.display_name AS account_display_name, memory.category,
  memory.current_version_sequence, memory.updated_at_utc,
  version.memory_text_private, version.source_kind, version.source_conversation_id,
  version.source_conversation_title_private, version.remembered_at_utc,
  version.review_due_at_utc
FROM coach_ai_relationship_memories memory
JOIN coach_ai_relationship_memory_versions version
  ON version.coach_ai_relationship_memory_id = memory.coach_ai_relationship_memory_id
 AND version.version_sequence = memory.current_version_sequence AND version.state = 'current'
LEFT JOIN journal_accounts account ON account.account_id = memory.account_id
WHERE memory.user_id = ? AND memory.workspace_id = ? AND memory.state = 'active'
  AND (memory.scope_kind = 'user' OR memory.account_id = ?)
ORDER BY CASE memory.scope_kind WHEN 'user' THEN 0 ELSE 1 END,
  memory.updated_at_utc DESC, memory.coach_ai_relationship_memory_id`).all(
      scope.userId,
      scope.workspaceId,
      verified.account_id,
    );
    return Object.freeze({
      settings: this.settings(scope),
      currentAccount: Object.freeze({
        accountId: verified.account_id,
        displayName: verified.account_display_name,
      }),
      memories: Object.freeze(rows.map((row) => this.memoryRecord(row, now))),
    });
  }

  private upsertSettings(
    scope: WorkspaceAccessScope,
    patch: Readonly<{
      enabled?: boolean;
      meetLinksState?: "not_started" | "completed" | "skipped";
    }>,
    now: Date,
  ): CoachAiRelationshipMemorySettings {
    this.verifiedScope(scope);
    const existing = this.database.prepare<[string, string], SettingsRow & Readonly<{
      updated_at_utc: string;
    }>>(`SELECT relationship_memory_enabled, meet_links_state,
  meet_links_completed_at_utc, updated_at_utc
FROM coach_ai_relationship_memory_settings WHERE user_id = ? AND workspace_id = ?`).get(
      scope.userId,
      scope.workspaceId,
    );
    const timestamp = createCanonicalUtcTimestamp(existing
      ? timestampAfter(now, existing.updated_at_utc)
      : now);
    const enabled = patch.enabled ?? (existing?.relationship_memory_enabled !== 0);
    const meetLinksState = patch.meetLinksState ?? existing?.meet_links_state ?? "not_started";
    const completedAt = meetLinksState === "completed"
      ? existing?.meet_links_completed_at_utc ?? timestamp
      : null;
    this.database.prepare(`INSERT INTO coach_ai_relationship_memory_settings (
  user_id, workspace_id, relationship_memory_enabled, meet_links_state,
  meet_links_completed_at_utc, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(user_id, workspace_id) DO UPDATE SET
  relationship_memory_enabled = excluded.relationship_memory_enabled,
  meet_links_state = excluded.meet_links_state,
  meet_links_completed_at_utc = excluded.meet_links_completed_at_utc,
  updated_at_utc = excluded.updated_at_utc`).run(
      scope.userId,
      scope.workspaceId,
      enabled ? 1 : 0,
      meetLinksState,
      completedAt,
      timestamp,
      timestamp,
    );
    return Object.freeze({ enabled, meetLinksState, meetLinksCompletedAtUtc: completedAt });
  }

  setEnabled(
    scope: WorkspaceAccessScope,
    enabled: boolean,
    now = new Date(),
  ): CoachAiRelationshipMemorySettings {
    if (typeof enabled !== "boolean") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "memoryEnabled" });
    }
    return this.transaction(() => this.upsertSettings(scope, { enabled }, now));
  }

  setMeetLinksSkipped(
    scope: WorkspaceAccessScope,
    now = new Date(),
  ): CoachAiRelationshipMemorySettings {
    return this.transaction(() => this.upsertSettings(scope, { meetLinksState: "skipped" }, now));
  }

  private sourceTitle(
    scope: WorkspaceAccessScope,
    accountId: string,
    conversationId: string | null,
    messageId: string | null,
  ): string | null {
    if (conversationId === null && messageId === null) return null;
    if (conversationId === null) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "sourceConversationId" });
    }
    assertCanonicalUuidV4(conversationId, "sourceConversationId");
    if (messageId !== null) assertCanonicalUuidV4(messageId, "sourceMessageId");
    const row = this.database.prepare<[string, string, string, string, string, string], SourceRow>(`SELECT conversation.title
FROM coach_ai_chat_conversations conversation
LEFT JOIN coach_ai_chat_messages message
  ON message.coach_ai_chat_message_id = ?
 AND message.coach_ai_chat_conversation_id = conversation.coach_ai_chat_conversation_id
 AND message.user_id = conversation.user_id AND message.workspace_id = conversation.workspace_id
 AND message.account_id = conversation.account_id
WHERE conversation.coach_ai_chat_conversation_id = ?
  AND conversation.user_id = ? AND conversation.workspace_id = ?
  AND conversation.account_id = ?
  AND (? IS NULL OR message.coach_ai_chat_message_id IS NOT NULL)`).get(
      messageId,
      conversationId,
      scope.userId,
      scope.workspaceId,
      accountId,
      messageId,
    );
    if (!row) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "memorySource" });
    return row.title;
  }

  private insertMemory(
    scope: WorkspaceAccessScope,
    input: CoachAiRelationshipMemoryWrite,
    verified: VerifiedScopeRow,
    now: Date,
  ): CoachAiRelationshipMemory {
    const normalizedScope = this.normalizeScope(scope, input.scope, verified);
    const category = assertCategory(input.category);
    const sourceKind = assertSourceKind(input.sourceKind);
    const text = normalizeMemoryText(input.text);
    const reviewDueAt = input.reviewDueAtUtc ?? null;
    if (reviewDueAt !== null) assertCanonicalUtcTimestamp(reviewDueAt, "reviewDueAtUtc");
    const sourceConversationId = input.sourceConversationId ?? null;
    const sourceMessageId = input.sourceMessageId ?? null;
    const sourceTitle = this.sourceTitle(
      scope,
      verified.account_id,
      sourceConversationId,
      sourceMessageId,
    );
    const timestamp = createCanonicalUtcTimestamp(now);
    const memoryId = createCanonicalUuidV4();
    const versionId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO coach_ai_relationship_memories (
  coach_ai_relationship_memory_id, user_id, workspace_id, account_id,
  scope_kind, category, state, current_version_sequence,
  created_at_utc, updated_at_utc, forgotten_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, NULL)`).run(
      memoryId,
      scope.userId,
      scope.workspaceId,
      normalizedScope.accountId,
      normalizedScope.kind,
      category,
      timestamp,
      timestamp,
    );
    this.database.prepare(`INSERT INTO coach_ai_relationship_memory_versions (
  coach_ai_relationship_memory_version_id, coach_ai_relationship_memory_id,
  version_sequence, memory_text_private, source_kind, source_conversation_id,
  source_message_id, source_conversation_title_private, state,
  remembered_at_utc, review_due_at_utc, superseded_at_utc
) VALUES (?, ?, 1, ?, ?, ?, ?, ?, 'current', ?, ?, NULL)`).run(
      versionId,
      memoryId,
      text,
      sourceKind,
      sourceConversationId,
      sourceMessageId,
      sourceTitle,
      timestamp,
      reviewDueAt,
    );
    this.insertEvent(scope, memoryId, normalizedScope.accountId, "created", 1, timestamp);
    return Object.freeze({
      memoryId,
      scope: input.scope,
      scopeLabel: normalizedScope.kind === "user"
        ? "Across TradersLink"
        : `${verified.account_display_name} only`,
      category,
      text,
      versionSequence: 1,
      sourceKind,
      sourceConversationId,
      sourceConversationTitle: sourceTitle,
      rememberedAtUtc: timestamp,
      reviewDueAtUtc: reviewDueAt,
      needsReview: reviewDueAt !== null && Date.parse(reviewDueAt) <= now.getTime(),
      updatedAtUtc: timestamp,
    });
  }

  private insertEvent(
    scope: WorkspaceAccessScope,
    memoryId: string,
    accountId: string | null,
    eventKind: "created" | "updated" | "reconfirmed" | "forgotten",
    versionSequence: number | null,
    occurredAtUtc: string,
  ): void {
    this.database.prepare(`INSERT INTO coach_ai_relationship_memory_events (
  coach_ai_relationship_memory_event_id, coach_ai_relationship_memory_id,
  user_id, workspace_id, account_id, event_kind, version_sequence, occurred_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      createCanonicalUuidV4(),
      memoryId,
      scope.userId,
      scope.workspaceId,
      accountId,
      eventKind,
      versionSequence,
      occurredAtUtc,
    );
  }

  create(
    scope: WorkspaceAccessScope,
    input: CoachAiRelationshipMemoryWrite,
    now = new Date(),
  ): CoachAiRelationshipMemory {
    return this.transaction(() => {
      const verified = this.verifiedScope(scope);
      if (!this.settings(scope).enabled) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "memoryDisabled" });
      }
      return this.insertMemory(scope, input, verified, now);
    });
  }

  completeMeetLinks(
    scope: WorkspaceAccessScope,
    memories: readonly CoachAiMeetLinksMemory[],
    now = new Date(),
  ): CoachAiRelationshipMemoryView {
    if (!Array.isArray(memories) || memories.length > MAX_MEET_LINKS_MEMORIES) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "meetLinksMemories" });
    }
    return this.transaction(() => {
      const verified = this.verifiedScope(scope);
      if (!this.settings(scope).enabled) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "memoryDisabled" });
      }
      for (const memory of memories) {
        this.insertMemory(scope, { ...memory, sourceKind: "meet_links" }, verified, now);
      }
      this.upsertSettings(scope, { meetLinksState: "completed" }, now);
      return this.read(scope, now);
    });
  }

  private existingMemory(
    scope: WorkspaceAccessScope,
    memoryId: string,
  ): ExistingMemoryRow {
    assertCanonicalUuidV4(memoryId, "memoryId");
    const row = this.database.prepare<[string, string, string], ExistingMemoryRow>(`SELECT
  coach_ai_relationship_memory_id, account_id, scope_kind, category,
  current_version_sequence, updated_at_utc
FROM coach_ai_relationship_memories
WHERE coach_ai_relationship_memory_id = ? AND user_id = ? AND workspace_id = ?
  AND state = 'active'`).get(memoryId, scope.userId, scope.workspaceId);
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    if (row.account_id !== null && !scope.allowedAccountIds.includes(row.account_id)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    return row;
  }

  update(
    scope: WorkspaceAccessScope,
    memoryId: string,
    input: Readonly<{
      text: string;
      reviewDueAtUtc?: string | null;
      reconfirm?: boolean;
    }>,
    now = new Date(),
  ): CoachAiRelationshipMemoryView {
    return this.transaction(() => {
      this.verifiedScope(scope);
      const existing = this.existingMemory(scope, memoryId);
      const text = normalizeMemoryText(input.text);
      const reviewDueAt = input.reviewDueAtUtc ?? null;
      if (reviewDueAt !== null) assertCanonicalUtcTimestamp(reviewDueAt, "reviewDueAtUtc");
      const timestamp = createCanonicalUtcTimestamp(timestampAfter(now, existing.updated_at_utc));
      const nextSequence = existing.current_version_sequence + 1;
      this.database.prepare(`UPDATE coach_ai_relationship_memory_versions
SET state = 'superseded', superseded_at_utc = ?
WHERE coach_ai_relationship_memory_id = ? AND state = 'current'`).run(timestamp, memoryId);
      this.database.prepare(`UPDATE coach_ai_relationship_memories
SET current_version_sequence = ?, updated_at_utc = ?
WHERE coach_ai_relationship_memory_id = ? AND state = 'active'`).run(
        nextSequence,
        timestamp,
        memoryId,
      );
      const sourceKind = input.reconfirm ? "reconfirmation" : "user_edit";
      this.database.prepare(`INSERT INTO coach_ai_relationship_memory_versions (
  coach_ai_relationship_memory_version_id, coach_ai_relationship_memory_id,
  version_sequence, memory_text_private, source_kind, source_conversation_id,
  source_message_id, source_conversation_title_private, state,
  remembered_at_utc, review_due_at_utc, superseded_at_utc
) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 'current', ?, ?, NULL)`).run(
        createCanonicalUuidV4(),
        memoryId,
        nextSequence,
        text,
        sourceKind,
        timestamp,
        reviewDueAt,
      );
      this.insertEvent(
        scope,
        memoryId,
        existing.account_id,
        input.reconfirm ? "reconfirmed" : "updated",
        nextSequence,
        timestamp,
      );
      return this.read(scope, new Date(timestamp));
    });
  }

  forget(
    scope: WorkspaceAccessScope,
    memoryId: string,
    now = new Date(),
  ): CoachAiRelationshipMemoryView {
    return this.transaction(() => {
      this.verifiedScope(scope);
      const existing = this.existingMemory(scope, memoryId);
      const timestamp = createCanonicalUtcTimestamp(timestampAfter(now, existing.updated_at_utc));
      this.database.prepare(`UPDATE coach_ai_relationship_memories
SET state = 'forgotten', current_version_sequence = 0,
  updated_at_utc = ?, forgotten_at_utc = ?
WHERE coach_ai_relationship_memory_id = ? AND state = 'active'`).run(
        timestamp,
        timestamp,
        memoryId,
      );
      this.database.prepare(`DELETE FROM coach_ai_relationship_memory_versions
WHERE coach_ai_relationship_memory_id = ?`).run(memoryId);
      this.insertEvent(scope, memoryId, existing.account_id, "forgotten", null, timestamp);
      return this.read(scope, new Date(timestamp));
    });
  }

  forgetAll(
    scope: WorkspaceAccessScope,
    now = new Date(),
  ): CoachAiRelationshipMemoryView {
    return this.transaction(() => {
      const current = this.read(scope, now);
      let cursor = now;
      for (const memory of current.memories) {
        this.forget(scope, memory.memoryId, cursor);
        cursor = new Date(cursor.getTime() + 1);
      }
      return this.read(scope, cursor);
    });
  }
}
