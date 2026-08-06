import { createHash } from "node:crypto";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type {
  CoachAiChatConversation,
  CoachAiChatConversationCursor,
  CoachAiChatConversationPage,
  CoachAiChatGenerationReceipt,
  CoachAiChatGenerationReceiptInput,
  CoachAiChatGenerationUsage,
  CoachAiChatGenerationPair,
  CoachAiChatMessage,
  CoachAiChatMessageCursor,
  CoachAiChatMessagePage,
  CoachAiChatReservedGeneration,
} from "@/src/modules/coach/contracts/ai-chat-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

const ExactDecimal = Decimal.clone({ precision: 80, toExpNeg: -1000, toExpPos: 1000 });
const TITLE_MAX_LENGTH = 160;
const USER_MESSAGE_MAX_LENGTH = 4_000;
const NORMALIZED_MESSAGE_MAX_LENGTH = 4_000;
const STRUCTURED_INTERPRETATION_MAX_LENGTH = 24_000;
const ASSISTANT_MESSAGE_MAX_LENGTH = 8_000;
const SNAPSHOT_CONTRACT_VERSION_MAX_LENGTH = 128;
const SNAPSHOT_MAX_LENGTH = 256_000;
const PAGE_MAX_LIMIT = 100;
const MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const FAILURE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,95}$/u;
const MONEY_RATE_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/u;

type ScopeRecord = Readonly<{ accountId: string }>;

type ConversationRow = Readonly<{
  coach_ai_chat_conversation_id: string;
  title: string;
  state: "active" | "archived";
  created_at_utc: string;
  updated_at_utc: string;
  archived_at_utc: string | null;
}>;

type MessageRow = Readonly<{
  coach_ai_chat_message_id: string;
  message_sequence: number;
  role: "user" | "assistant";
  original_user_text_private: string | null;
  normalized_user_text_private: string | null;
  structured_interpretation_json: string | null;
  assistant_text_private: string | null;
  generation_state: "not_applicable" | "pending" | "completed" | "failed";
  failure_code: string | null;
  created_at_utc: string;
  finalized_at_utc: string | null;
}>;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

function assertText(value: unknown, field: string, maximumLength: number): string {
  if (typeof value !== "string" || value.length < 1 || value.length > maximumLength) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function assertTitle(value: unknown): string {
  const title = assertText(value, "title", TITLE_MAX_LENGTH);
  if (title.trim().length === 0) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "title" });
  }
  return title;
}

function optionalText(value: unknown, field: string, maximumLength: number): string | null {
  if (value === null || value === undefined) return null;
  return assertText(value, field, maximumLength);
}

function structuredInterpretation(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "structuredInterpretation" });
  }
  const json = JSON.stringify(canonicalize(value));
  if (json.length < 2 || json.length > STRUCTURED_INTERPRETATION_MAX_LENGTH) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "structuredInterpretation" });
  }
  return json;
}

function immutableSnapshot(value: unknown): Readonly<{ json: string; sha256: string }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "factualSnapshot" });
  }
  const json = JSON.stringify(canonicalize(value));
  if (json.length < 2 || json.length > SNAPSHOT_MAX_LENGTH) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "factualSnapshot" });
  }
  return Object.freeze({
    json,
    sha256: createHash("sha256").update(`${json}\n`, "utf8").digest("hex"),
  });
}

function usage(value: CoachAiChatGenerationUsage): CoachAiChatGenerationUsage {
  const values = [value.inputTokens, value.outputTokens, value.totalTokens];
  if (values.some((item) => item !== null && (!Number.isSafeInteger(item) || item < 0)) ||
      (value.inputTokens === null) !== (value.outputTokens === null) ||
      (value.inputTokens === null) !== (value.totalTokens === null) ||
      (value.inputTokens !== null && value.outputTokens !== null && value.totalTokens !== value.inputTokens + value.outputTokens)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "generationUsage" });
  }
  return Object.freeze({ ...value });
}

function rate(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || !MONEY_RATE_PATTERN.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function receiptInput(value: CoachAiChatGenerationReceiptInput): Readonly<{
  providerKey: "openai_direct";
  modelId: string;
  usage: CoachAiChatGenerationUsage;
  inputRate: string | null;
  outputRate: string | null;
  estimatedCostUsd: string | null;
}> {
  if (value.providerKey !== "openai_direct" || typeof value.modelId !== "string" || !MODEL_ID_PATTERN.test(value.modelId)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "generationReceipt" });
  }
  const normalizedUsage = usage(value.usage);
  const inputRate = rate(value.inputCostUsdPerMillionTokens, "inputCostUsdPerMillionTokens");
  const outputRate = rate(value.outputCostUsdPerMillionTokens, "outputCostUsdPerMillionTokens");
  if ((inputRate === null) !== (outputRate === null) ||
      ((inputRate === null || normalizedUsage.inputTokens === null) && (inputRate !== null || normalizedUsage.inputTokens !== null))) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "generationPricing" });
  }
  const estimatedCostUsd = inputRate === null || outputRate === null ||
      normalizedUsage.inputTokens === null || normalizedUsage.outputTokens === null
    ? null
    : new ExactDecimal(normalizedUsage.inputTokens).times(inputRate)
      .plus(new ExactDecimal(normalizedUsage.outputTokens).times(outputRate))
      .dividedBy(1_000_000).toFixed(12).replace(/\.?0+$/u, "") || "0";
  return Object.freeze({
    providerKey: value.providerKey,
    modelId: value.modelId,
    usage: normalizedUsage,
    inputRate,
    outputRate,
    estimatedCostUsd,
  });
}

function conversationRecord(row: ConversationRow): CoachAiChatConversation {
  return Object.freeze({
    conversationId: row.coach_ai_chat_conversation_id,
    title: row.title,
    state: row.state,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
    archivedAtUtc: row.archived_at_utc,
  });
}

function messageRecord(row: MessageRow): CoachAiChatMessage {
  return Object.freeze({
    messageId: row.coach_ai_chat_message_id,
    sequence: row.message_sequence,
    role: row.role,
    originalUserTextPrivate: row.original_user_text_private,
    normalizedUserTextPrivate: row.normalized_user_text_private,
    structuredInterpretationJson: row.structured_interpretation_json,
    assistantTextPrivate: row.assistant_text_private,
    generationState: row.generation_state,
    failureCode: row.failure_code,
    createdAtUtc: row.created_at_utc,
    finalizedAtUtc: row.finalized_at_utc,
  });
}

export class CoachAiChatRepository {
  constructor(private readonly database: Database.Database) {}

  private transaction<T>(operation: () => T): T {
    return this.database.inTransaction ? operation() : this.database.transaction(operation).immediate();
  }

  /** Coordinates a Chat state transition with another repository on this database. */
  runAtomically<T>(operation: () => T): T {
    return this.transaction(operation);
  }

  private verifiedAccountId(scope: WorkspaceAccessScope): string {
    if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const row = this.database.prepare<[string, string, string], ScopeRecord>(`SELECT account.account_id AS accountId
FROM platform_users user
JOIN platform_workspaces workspace ON workspace.workspace_id = ?
JOIN platform_workspace_memberships membership
  ON membership.workspace_id = workspace.workspace_id AND membership.user_id = user.user_id
JOIN journal_accounts account ON account.account_id = ? AND account.workspace_id = workspace.workspace_id
WHERE user.user_id = ? AND user.status = 'active' AND workspace.status = 'active'
  AND membership.status = 'active' AND account.status = 'active'`).get(
      scope.workspaceId,
      scope.activeAccountId,
      scope.userId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return row.accountId;
  }

  private conversation(
    scope: WorkspaceAccessScope,
    conversationId: string,
    accountId: string,
  ): ConversationRow {
    assertCanonicalUuidV4(conversationId, "conversationId");
    const row = this.database.prepare<[string, string, string, string], ConversationRow>(`SELECT
  coach_ai_chat_conversation_id, title, state, created_at_utc, updated_at_utc, archived_at_utc
FROM coach_ai_chat_conversations
WHERE coach_ai_chat_conversation_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(
      conversationId, scope.userId, scope.workspaceId, accountId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return row;
  }

  private message(
    scope: WorkspaceAccessScope,
    assistantMessageId: string,
    accountId: string,
  ): MessageRow {
    assertCanonicalUuidV4(assistantMessageId, "assistantMessageId");
    const row = this.database.prepare<[string, string, string, string], MessageRow>(`SELECT
  coach_ai_chat_message_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json, assistant_text_private,
  generation_state, failure_code, created_at_utc, finalized_at_utc
FROM coach_ai_chat_messages
WHERE coach_ai_chat_message_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(
      assistantMessageId, scope.userId, scope.workspaceId, accountId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return row;
  }

  createConversation(scope: WorkspaceAccessScope, title: unknown, now = new Date()): CoachAiChatConversation {
    const verifiedAccountId = this.verifiedAccountId(scope);
    const verifiedTitle = assertTitle(title);
    const createdAtUtc = createCanonicalUtcTimestamp(now);
    const conversationId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO coach_ai_chat_conversations (
  coach_ai_chat_conversation_id, user_id, workspace_id, account_id, title,
  state, created_at_utc, updated_at_utc, archived_at_utc
) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, NULL)`).run(
      conversationId, scope.userId, scope.workspaceId, verifiedAccountId, verifiedTitle,
      createdAtUtc, createdAtUtc,
    );
    return this.readConversation(scope, conversationId);
  }

  readConversation(scope: WorkspaceAccessScope, conversationId: string): CoachAiChatConversation {
    const verifiedAccountId = this.verifiedAccountId(scope);
    return conversationRecord(this.conversation(scope, conversationId, verifiedAccountId));
  }

  listMessages(
    scope: WorkspaceAccessScope,
    conversationId: string,
    input: Readonly<{ limit?: number; cursor?: CoachAiChatMessageCursor | null }> = {},
  ): CoachAiChatMessagePage {
    const verifiedAccountId = this.verifiedAccountId(scope);
    this.conversation(scope, conversationId, verifiedAccountId);
    const limit = input.limit ?? 50;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > PAGE_MAX_LIMIT) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "messageLimit" });
    }
    if (input.cursor && (!Number.isSafeInteger(input.cursor.beforeSequence) || input.cursor.beforeSequence < 2)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "messageCursor" });
    }
    const rows = this.database.prepare<[string, string, string, string, number, number], MessageRow>(`SELECT
  coach_ai_chat_message_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json, assistant_text_private,
  generation_state, failure_code, created_at_utc, finalized_at_utc
FROM coach_ai_chat_messages
WHERE coach_ai_chat_conversation_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND message_sequence < ?
ORDER BY message_sequence DESC, coach_ai_chat_message_id DESC
LIMIT ?`).all(
      conversationId, scope.userId, scope.workspaceId, verifiedAccountId,
      input.cursor?.beforeSequence ?? Number.MAX_SAFE_INTEGER, limit + 1,
    );
    const page = rows.slice(0, limit).reverse().map(messageRecord);
    const oldest = page[0];
    return Object.freeze({
      messages: Object.freeze(page),
      nextCursor: rows.length > limit && oldest ? Object.freeze({ beforeSequence: oldest.sequence }) : null,
    });
  }

  readGenerationPair(
    scope: WorkspaceAccessScope,
    conversationId: string,
    assistantMessageId: string,
  ): CoachAiChatGenerationPair {
    const verifiedAccountId = this.verifiedAccountId(scope);
    this.conversation(scope, conversationId, verifiedAccountId);
    const assistant = this.database.prepare<[string, string, string, string, string], MessageRow>(`SELECT
  coach_ai_chat_message_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json, assistant_text_private,
  generation_state, failure_code, created_at_utc, finalized_at_utc
FROM coach_ai_chat_messages
WHERE coach_ai_chat_message_id = ? AND coach_ai_chat_conversation_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND role = 'assistant'`).get(
      assistantMessageId, conversationId, scope.userId, scope.workspaceId, verifiedAccountId,
    );
    if (!assistant) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const row = this.database.prepare<[string, string, string, string, number], MessageRow>(`SELECT
  coach_ai_chat_message_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json, assistant_text_private,
  generation_state, failure_code, created_at_utc, finalized_at_utc
FROM coach_ai_chat_messages
WHERE coach_ai_chat_conversation_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND message_sequence = ? AND role = 'user'`).get(
      conversationId, scope.userId, scope.workspaceId, verifiedAccountId, assistant.message_sequence - 1,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return Object.freeze({ userMessage: messageRecord(row), assistantMessage: messageRecord(assistant) });
  }

  listConversations(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      state: "active" | "archived";
      limit?: number;
      cursor?: CoachAiChatConversationCursor | null;
    }>,
  ): CoachAiChatConversationPage {
    const verifiedAccountId = this.verifiedAccountId(scope);
    if (input.state !== "active" && input.state !== "archived") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "state" });
    }
    const limit = input.limit ?? 30;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > PAGE_MAX_LIMIT) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "limit" });
    }
    if (input.cursor) {
      assertCanonicalUuidV4(input.cursor.conversationId, "cursorConversationId");
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(input.cursor.updatedAtUtc)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "cursorUpdatedAtUtc" });
      }
    }
    const rows = this.database.prepare<[string, string, string, string, string, number], ConversationRow>(`SELECT
  coach_ai_chat_conversation_id, title, state, created_at_utc, updated_at_utc, archived_at_utc
FROM coach_ai_chat_conversations
WHERE user_id = ? AND workspace_id = ? AND account_id = ? AND state = ?
  AND (? = '' OR updated_at_utc < ? OR (updated_at_utc = ? AND coach_ai_chat_conversation_id < ?))
ORDER BY updated_at_utc DESC, coach_ai_chat_conversation_id DESC
LIMIT ?`).all(
      scope.userId, scope.workspaceId, verifiedAccountId, input.state,
      input.cursor?.updatedAtUtc ?? "", input.cursor?.updatedAtUtc ?? "",
      input.cursor?.updatedAtUtc ?? "", input.cursor?.conversationId ?? "", limit + 1,
    );
    const page = rows.slice(0, limit).map(conversationRecord);
    const last = page.at(-1);
    return Object.freeze({
      conversations: Object.freeze(page),
      nextCursor: rows.length > limit && last ? Object.freeze({
        updatedAtUtc: last.updatedAtUtc,
        conversationId: last.conversationId,
      }) : null,
    });
  }

  renameConversation(scope: WorkspaceAccessScope, conversationId: string, title: unknown, now = new Date()): CoachAiChatConversation {
    const verifiedAccountId = this.verifiedAccountId(scope);
    const updatedAtUtc = createCanonicalUtcTimestamp(now);
    const verifiedTitle = assertTitle(title);
    const result = this.database.prepare(`UPDATE coach_ai_chat_conversations
SET title = ?, updated_at_utc = ?
WHERE coach_ai_chat_conversation_id = ? AND user_id = ? AND workspace_id = ?
  AND account_id = ? AND state = 'active'`).run(
      verifiedTitle, updatedAtUtc, conversationId, scope.userId, scope.workspaceId, verifiedAccountId,
    );
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.readConversation(scope, conversationId);
  }

  archiveConversation(scope: WorkspaceAccessScope, conversationId: string, now = new Date()): CoachAiChatConversation {
    return this.changeArchiveState(scope, conversationId, "archive", now);
  }

  restoreConversation(scope: WorkspaceAccessScope, conversationId: string, now = new Date()): CoachAiChatConversation {
    return this.changeArchiveState(scope, conversationId, "restore", now);
  }

  private changeArchiveState(
    scope: WorkspaceAccessScope,
    conversationId: string,
    eventKind: "archive" | "restore",
    now: Date,
  ): CoachAiChatConversation {
    const verifiedAccountId = this.verifiedAccountId(scope);
    const occurredAtUtc = createCanonicalUtcTimestamp(now);
    return this.transaction(() => {
      const result = eventKind === "archive"
        ? this.database.prepare(`UPDATE coach_ai_chat_conversations
SET state = 'archived', updated_at_utc = ?, archived_at_utc = ?
WHERE coach_ai_chat_conversation_id = ? AND user_id = ? AND workspace_id = ?
  AND account_id = ? AND state = 'active'`).run(
          occurredAtUtc, occurredAtUtc, conversationId, scope.userId, scope.workspaceId, verifiedAccountId,
        )
        : this.database.prepare(`UPDATE coach_ai_chat_conversations
SET state = 'active', updated_at_utc = ?, archived_at_utc = NULL
WHERE coach_ai_chat_conversation_id = ? AND user_id = ? AND workspace_id = ?
  AND account_id = ? AND state = 'archived'`).run(
          occurredAtUtc, conversationId, scope.userId, scope.workspaceId, verifiedAccountId,
        );
      if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      this.database.prepare(`INSERT INTO coach_ai_archive_events (
  coach_ai_archive_event_id, coach_ai_chat_conversation_id, user_id,
  workspace_id, account_id, event_kind, occurred_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(), conversationId, scope.userId, scope.workspaceId,
        verifiedAccountId, eventKind, occurredAtUtc,
      );
      return conversationRecord(this.conversation(scope, conversationId, verifiedAccountId));
    });
  }

  appendUserMessageAndReserveAssistant(
    scope: WorkspaceAccessScope,
    conversationId: string,
    input: Readonly<{
      originalUserTextPrivate: unknown;
      normalizedUserTextPrivate?: unknown;
      structuredInterpretation?: unknown;
    }>,
    now = new Date(),
  ): CoachAiChatReservedGeneration {
    const verifiedAccountId = this.verifiedAccountId(scope);
    const originalText = assertText(input.originalUserTextPrivate, "originalUserTextPrivate", USER_MESSAGE_MAX_LENGTH);
    const normalizedText = optionalText(input.normalizedUserTextPrivate, "normalizedUserTextPrivate", NORMALIZED_MESSAGE_MAX_LENGTH);
    const interpretation = structuredInterpretation(input.structuredInterpretation);
    const createdAtUtc = createCanonicalUtcTimestamp(now);
    return this.transaction(() => {
      const conversation = this.conversation(scope, conversationId, verifiedAccountId);
      if (conversation.state !== "active") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: "archived_conversation" });
      }
      const pending = this.database.prepare<[string], Readonly<{ message_sequence: number }>>(`SELECT message_sequence
FROM coach_ai_chat_messages
WHERE coach_ai_chat_conversation_id = ? AND role = 'assistant' AND generation_state = 'pending'`).get(conversationId);
      if (pending) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: "generation_pending" });
      const next = this.database.prepare<[string], Readonly<{ maximum: number }>>(`SELECT
  COALESCE(MAX(message_sequence), 0) AS maximum
FROM coach_ai_chat_messages WHERE coach_ai_chat_conversation_id = ?`).get(conversationId);
      const userMessageId = createCanonicalUuidV4();
      const assistantMessageId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_chat_messages (
  coach_ai_chat_message_id, coach_ai_chat_conversation_id, user_id, workspace_id,
  account_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json, assistant_text_private,
  generation_state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'user', ?, ?, ?, NULL, 'not_applicable', NULL, ?, NULL)`).run(
        userMessageId, conversationId, scope.userId, scope.workspaceId, verifiedAccountId,
        next.maximum + 1, originalText, normalizedText, interpretation, createdAtUtc,
      );
      this.database.prepare(`INSERT INTO coach_ai_chat_messages (
  coach_ai_chat_message_id, coach_ai_chat_conversation_id, user_id, workspace_id,
  account_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json, assistant_text_private,
  generation_state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'assistant', NULL, NULL, NULL, NULL, 'pending', NULL, ?, NULL)`).run(
        assistantMessageId, conversationId, scope.userId, scope.workspaceId, verifiedAccountId,
        next.maximum + 2, createdAtUtc,
      );
      this.database.prepare(`UPDATE coach_ai_chat_conversations SET updated_at_utc = ?
WHERE coach_ai_chat_conversation_id = ?`).run(createdAtUtc, conversationId);
      return Object.freeze({
        userMessage: messageRecord(this.message(scope, userMessageId, verifiedAccountId)),
        assistantMessage: messageRecord(this.message(scope, assistantMessageId, verifiedAccountId)),
      });
    });
  }

  finalizeAssistantSuccess(
    scope: WorkspaceAccessScope,
    assistantMessageId: string,
    input: Readonly<{
      assistantTextPrivate: unknown;
      snapshotContractVersion: unknown;
      factualSnapshot: unknown;
      receipt: CoachAiChatGenerationReceiptInput;
    }>,
    now = new Date(),
  ): Readonly<{ message: CoachAiChatMessage; receipt: CoachAiChatGenerationReceipt }> {
    const verifiedAccountId = this.verifiedAccountId(scope);
    const assistantText = assertText(input.assistantTextPrivate, "assistantTextPrivate", ASSISTANT_MESSAGE_MAX_LENGTH);
    const snapshotContractVersion = assertText(input.snapshotContractVersion, "snapshotContractVersion", SNAPSHOT_CONTRACT_VERSION_MAX_LENGTH);
    const snapshot = immutableSnapshot(input.factualSnapshot);
    const normalizedReceipt = receiptInput(input.receipt);
    const finalizedAtUtc = createCanonicalUtcTimestamp(now);
    return this.transaction(() => {
      const pending = this.message(scope, assistantMessageId, verifiedAccountId);
      if (pending.role !== "assistant" || pending.generation_state !== "pending") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: "assistant_not_pending" });
      }
      const result = this.database.prepare(`UPDATE coach_ai_chat_messages
SET assistant_text_private = ?, generation_state = 'completed', failure_code = NULL,
  finalized_at_utc = ?
WHERE coach_ai_chat_message_id = ? AND user_id = ? AND workspace_id = ?
  AND account_id = ? AND role = 'assistant' AND generation_state = 'pending'`).run(
        assistantText, finalizedAtUtc, assistantMessageId, scope.userId, scope.workspaceId, verifiedAccountId,
      );
      if (result.changes !== 1) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: "assistant_not_pending" });
      const snapshotId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_chat_answer_snapshots (
  coach_ai_chat_answer_snapshot_id, coach_ai_chat_message_id, coach_ai_chat_conversation_id,
  user_id, workspace_id, account_id, snapshot_contract_version, factual_snapshot_json,
  factual_snapshot_sha256, created_at_utc
) VALUES (?, ?, (SELECT coach_ai_chat_conversation_id FROM coach_ai_chat_messages WHERE coach_ai_chat_message_id = ?),
  ?, ?, ?, ?, ?, ?, ?)`).run(
        snapshotId, assistantMessageId, assistantMessageId, scope.userId, scope.workspaceId,
        verifiedAccountId, snapshotContractVersion, snapshot.json, snapshot.sha256, finalizedAtUtc,
      );
      const receipt = this.insertReceipt(assistantMessageId, scope, verifiedAccountId, normalizedReceipt, finalizedAtUtc);
      return Object.freeze({ message: messageRecord(this.message(scope, assistantMessageId, verifiedAccountId)), receipt });
    });
  }

  finalizeAssistantFailure(
    scope: WorkspaceAccessScope,
    assistantMessageId: string,
    failureCode: unknown,
    receiptInputValue: CoachAiChatGenerationReceiptInput | null = null,
    now = new Date(),
  ): Readonly<{ message: CoachAiChatMessage; receipt: CoachAiChatGenerationReceipt | null }> {
    const verifiedAccountId = this.verifiedAccountId(scope);
    if (typeof failureCode !== "string" || !FAILURE_CODE_PATTERN.test(failureCode)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "failureCode" });
    }
    const receipt = receiptInputValue === null ? null : receiptInput(receiptInputValue);
    const finalizedAtUtc = createCanonicalUtcTimestamp(now);
    return this.transaction(() => {
      const pending = this.message(scope, assistantMessageId, verifiedAccountId);
      if (pending.role !== "assistant" || pending.generation_state !== "pending") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: "assistant_not_pending" });
      }
      const result = this.database.prepare(`UPDATE coach_ai_chat_messages
SET assistant_text_private = NULL, generation_state = 'failed', failure_code = ?,
  finalized_at_utc = ?
WHERE coach_ai_chat_message_id = ? AND user_id = ? AND workspace_id = ?
  AND account_id = ? AND role = 'assistant' AND generation_state = 'pending'`).run(
        failureCode, finalizedAtUtc, assistantMessageId, scope.userId, scope.workspaceId, verifiedAccountId,
      );
      if (result.changes !== 1) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: "assistant_not_pending" });
      const savedReceipt = receipt
        ? this.insertReceipt(assistantMessageId, scope, verifiedAccountId, receipt, finalizedAtUtc)
        : null;
      return Object.freeze({
        message: messageRecord(this.message(scope, assistantMessageId, verifiedAccountId)),
        receipt: savedReceipt,
      });
    });
  }

  private insertReceipt(
    assistantMessageId: string,
    scope: WorkspaceAccessScope,
    accountId: string,
    input: Readonly<{
      providerKey: "openai_direct";
      modelId: string;
      usage: CoachAiChatGenerationUsage;
      inputRate: string | null;
      outputRate: string | null;
      estimatedCostUsd: string | null;
    }>,
    recordedAtUtc: string,
  ): CoachAiChatGenerationReceipt {
    const receiptId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO coach_ai_chat_generation_receipts (
  coach_ai_chat_generation_receipt_id, coach_ai_chat_message_id, coach_ai_chat_conversation_id,
  user_id, workspace_id, account_id, provider_key, model_id, input_tokens, output_tokens,
  total_tokens, input_cost_usd_per_million_tokens, output_cost_usd_per_million_tokens,
  estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, (SELECT coach_ai_chat_conversation_id FROM coach_ai_chat_messages WHERE coach_ai_chat_message_id = ?),
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      receiptId, assistantMessageId, assistantMessageId, scope.userId, scope.workspaceId,
      accountId, input.providerKey, input.modelId, input.usage.inputTokens, input.usage.outputTokens,
      input.usage.totalTokens, input.inputRate, input.outputRate, input.estimatedCostUsd, recordedAtUtc,
    );
    return Object.freeze({
      receiptId,
      providerKey: input.providerKey,
      modelId: input.modelId,
      usage: input.usage,
      inputCostUsdPerMillionTokens: input.inputRate,
      outputCostUsdPerMillionTokens: input.outputRate,
      estimatedCostUsd: input.estimatedCostUsd,
      recordedAtUtc,
    });
  }
}
