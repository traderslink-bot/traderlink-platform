import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type {
  CoachAiChatQualityCase,
  CoachAiChatQualityContextMessage,
  CoachAiChatQualityEventKind,
} from "../contracts/ai-chat-quality-feedback-contracts";

type MessageRow = Readonly<{
  coach_ai_chat_message_id: string;
  message_sequence: number;
  role: "user" | "assistant";
  original_user_text_private: string | null;
  assistant_text_private: string | null;
  generation_state: "not_applicable" | "pending" | "completed" | "failed";
  failure_code: string | null;
  created_at_utc: string;
}>;

type CaseRow = Readonly<{
  coach_ai_chat_quality_case_id: string;
  coach_ai_chat_conversation_id: string;
  user_message_id: string;
  assistant_message_id: string;
  context_snapshot_json: string;
  case_state: "open" | "resolved" | "dismissed";
  created_at_utc: string;
  failure_code: string | null;
}>;

const SAFE_FAILURE_CODE = /^[A-Z][A-Z0-9_]{0,95}$/u;

export function isCoachAiChatQualityFeedbackSchemaAvailable(database: Database.Database): boolean {
  return database.prepare<[], { found: number }>(`SELECT 1 AS found FROM sqlite_master
WHERE type = 'table' AND name = 'coach_ai_chat_quality_cases'`).get() !== undefined;
}

function verifyScope(database: Database.Database, scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  const row = database.prepare<[string, string, string], { account_id: string }>(`SELECT account.account_id
FROM platform_users user
JOIN platform_workspaces workspace ON workspace.workspace_id = ?
JOIN platform_workspace_memberships membership
  ON membership.workspace_id = workspace.workspace_id AND membership.user_id = user.user_id
JOIN journal_accounts account ON account.account_id = ? AND account.workspace_id = workspace.workspace_id
WHERE user.user_id = ? AND user.status = 'active' AND workspace.status = 'active'
  AND membership.status = 'active' AND account.status = 'active'`).get(
    scope.workspaceId, scope.activeAccountId, scope.userId,
  );
  if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  return row.account_id;
}

function contextMessage(row: MessageRow): CoachAiChatQualityContextMessage {
  return Object.freeze({
    messageId: row.coach_ai_chat_message_id,
    role: row.role,
    text: row.role === "user" ? row.original_user_text_private : row.assistant_text_private,
    generationState: row.generation_state,
    createdAtUtc: row.created_at_utc,
  });
}

function snapshot(context: readonly CoachAiChatQualityContextMessage[]): Readonly<{ json: string; sha256: string }> {
  const json = JSON.stringify(context);
  if (json.length > 65536) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "chatQualityContext" });
  return Object.freeze({
    json,
    sha256: createHash("sha256").update(`${json}\n`, "utf8").digest("hex"),
  });
}

function parseContext(value: string): readonly CoachAiChatQualityContextMessage[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 13) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "chatQualityContext" });
  }
  return Object.freeze(parsed as CoachAiChatQualityContextMessage[]);
}

export class CoachAiChatQualityFeedbackRepository {
  constructor(private readonly database: Database.Database) {}

  capture(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      assistantMessageId: string;
      eventKind: CoachAiChatQualityEventKind;
      failureCode?: string | null;
      metadata?: Readonly<Record<string, string | null>>;
    }>,
    now = new Date(),
  ): CoachAiChatQualityCase {
    const accountId = verifyScope(this.database, scope);
    assertCanonicalUuidV4(input.assistantMessageId, "assistantMessageId");
    if (input.failureCode !== undefined && input.failureCode !== null && !SAFE_FAILURE_CODE.test(input.failureCode)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "failureCode" });
    }
    return this.database.transaction(() => {
      const assistant = this.database.prepare<[string, string, string, string], MessageRow>(`SELECT
  coach_ai_chat_message_id, message_sequence, role, original_user_text_private,
  assistant_text_private, generation_state, failure_code, created_at_utc
FROM coach_ai_chat_messages
WHERE coach_ai_chat_message_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND role = 'assistant'`).get(input.assistantMessageId, scope.userId, scope.workspaceId, accountId);
      if (!assistant) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      const user = this.database.prepare<[string, string, string, string, number], MessageRow>(`SELECT
  coach_ai_chat_message_id, message_sequence, role, original_user_text_private,
  assistant_text_private, generation_state, failure_code, created_at_utc
FROM coach_ai_chat_messages
WHERE coach_ai_chat_conversation_id = (SELECT coach_ai_chat_conversation_id FROM coach_ai_chat_messages WHERE coach_ai_chat_message_id = ?)
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND message_sequence = ? AND role = 'user'`).get(
        input.assistantMessageId, scope.userId, scope.workspaceId, accountId,
        assistant.message_sequence - 1,
      );
      if (!user) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "chatQualityPair" });
      const existing = this.database.prepare<[string], CaseRow>(`SELECT quality.coach_ai_chat_quality_case_id,
  quality.coach_ai_chat_conversation_id, quality.user_message_id, quality.assistant_message_id,
  quality.context_snapshot_json, quality.case_state, quality.created_at_utc,
  (SELECT safe_failure_code FROM coach_ai_chat_quality_events event
    WHERE event.coach_ai_chat_quality_case_id = quality.coach_ai_chat_quality_case_id
      AND event.safe_failure_code IS NOT NULL
    ORDER BY event.created_at_utc LIMIT 1) AS failure_code
FROM coach_ai_chat_quality_cases quality WHERE quality.assistant_message_id = ?`).get(input.assistantMessageId);
      const timestamp = createCanonicalUtcTimestamp(now);
      let caseRow = existing;
      if (!caseRow) {
        const context = this.database.prepare<[string, string, string, string, number, number], MessageRow>(`SELECT
  coach_ai_chat_message_id, message_sequence, role, original_user_text_private,
  assistant_text_private, generation_state, failure_code, created_at_utc
FROM coach_ai_chat_messages
WHERE coach_ai_chat_conversation_id = (SELECT coach_ai_chat_conversation_id FROM coach_ai_chat_messages WHERE coach_ai_chat_message_id = ?)
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND message_sequence BETWEEN ? AND ?
ORDER BY message_sequence`).all(
          input.assistantMessageId, scope.userId, scope.workspaceId, accountId,
          Math.max(1, assistant.message_sequence - 6), assistant.message_sequence + 6,
        ).map(contextMessage);
        const saved = snapshot(Object.freeze(context));
        const caseId = createCanonicalUuidV4();
        const metadata = JSON.stringify({
          contractVersion: "links_quality_feedback_v1",
          generationState: assistant.generation_state,
          ...(input.metadata ?? {}),
        });
        this.database.prepare(`INSERT INTO coach_ai_chat_quality_cases (
  coach_ai_chat_quality_case_id, user_id, workspace_id, account_id,
  coach_ai_chat_conversation_id, user_message_id, assistant_message_id,
  context_snapshot_json, context_snapshot_sha256, metadata_json, case_state,
  resolved_by_user_id, resolved_at_utc, created_at_utc
) VALUES (?, ?, ?, ?, (SELECT coach_ai_chat_conversation_id FROM coach_ai_chat_messages WHERE coach_ai_chat_message_id = ?),
  ?, ?, ?, ?, ?, 'open', NULL, NULL, ?)`).run(
          caseId, scope.userId, scope.workspaceId, accountId, input.assistantMessageId,
          user.coach_ai_chat_message_id, assistant.coach_ai_chat_message_id,
          saved.json, saved.sha256, metadata, timestamp,
        );
        caseRow = this.database.prepare<[string], CaseRow>(`SELECT quality.coach_ai_chat_quality_case_id,
  quality.coach_ai_chat_conversation_id, quality.user_message_id, quality.assistant_message_id,
  quality.context_snapshot_json, quality.case_state, quality.created_at_utc, NULL AS failure_code
FROM coach_ai_chat_quality_cases quality WHERE quality.coach_ai_chat_quality_case_id = ?`).get(caseId)!;
      }
      this.database.prepare(`INSERT INTO coach_ai_chat_quality_events (
  coach_ai_chat_quality_event_id, coach_ai_chat_quality_case_id, event_kind,
  safe_failure_code, created_at_utc
) VALUES (?, ?, ?, ?, ?)
ON CONFLICT(coach_ai_chat_quality_case_id, event_kind) DO NOTHING`).run(
        createCanonicalUuidV4(), caseRow.coach_ai_chat_quality_case_id, input.eventKind,
        input.failureCode ?? null, timestamp,
      );
      return this.readCase(caseRow);
    })();
  }

  listForOwner(limit = 100): readonly CoachAiChatQualityCase[] {
    const rows = this.database.prepare<[number], CaseRow>(`SELECT quality.coach_ai_chat_quality_case_id,
  quality.coach_ai_chat_conversation_id, quality.user_message_id, quality.assistant_message_id,
  quality.context_snapshot_json, quality.case_state, quality.created_at_utc,
  (SELECT safe_failure_code FROM coach_ai_chat_quality_events event
    WHERE event.coach_ai_chat_quality_case_id = quality.coach_ai_chat_quality_case_id
      AND event.safe_failure_code IS NOT NULL
    ORDER BY event.created_at_utc LIMIT 1) AS failure_code
FROM coach_ai_chat_quality_cases quality
ORDER BY CASE quality.case_state WHEN 'open' THEN 0 ELSE 1 END,
  quality.created_at_utc DESC, quality.coach_ai_chat_quality_case_id DESC
LIMIT ?`).all(limit);
    return Object.freeze(rows.map((row) => this.readCase(row)));
  }

  private readCase(row: CaseRow): CoachAiChatQualityCase {
    const events = this.database.prepare<[string], Readonly<{ event_kind: CoachAiChatQualityEventKind }>>(`SELECT event_kind
FROM coach_ai_chat_quality_events WHERE coach_ai_chat_quality_case_id = ?
ORDER BY created_at_utc, coach_ai_chat_quality_event_id`).all(row.coach_ai_chat_quality_case_id);
    return Object.freeze({
      caseId: row.coach_ai_chat_quality_case_id,
      conversationId: row.coach_ai_chat_conversation_id,
      userMessageId: row.user_message_id,
      assistantMessageId: row.assistant_message_id,
      state: row.case_state,
      context: parseContext(row.context_snapshot_json),
      eventKinds: Object.freeze(events.map((event) => event.event_kind)),
      failureCode: row.failure_code,
      createdAtUtc: row.created_at_utc,
    });
  }
}
