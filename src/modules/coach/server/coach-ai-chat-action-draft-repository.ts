import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import {
  COACH_AI_CHAT_ACTION_DRAFT_CONTRACT_VERSION,
  type CoachAiChatActionDraft,
  type CoachAiChatActionDraftPreview,
} from "../contracts/ai-chat-action-draft-contracts";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

type ActionDraftRow = Readonly<{
  coach_ai_chat_action_draft_id: string;
  coach_ai_chat_conversation_id: string;
  source_message_id: string;
  action_kind: string;
  preview_json: string;
  private_payload_json: string;
  preview_sha256: string;
  disposition: string;
  write_state: string;
  created_at_utc: string;
  expires_at_utc: string;
  finalized_at_utc: string | null;
}>;

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field });
  }
  return value as Record<string, unknown>;
}

function parsePreview(row: ActionDraftRow): CoachAiChatActionDraftPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.preview_json) as unknown;
  } catch {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "coachActionPreview" });
  }
  const value = record(parsed, "coachActionPreview");
  if (value.kind !== row.action_kind || typeof value.title !== "string") {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "coachActionPreview" });
  }
  return Object.freeze(value) as CoachAiChatActionDraftPreview;
}

function toDraft(row: ActionDraftRow): CoachAiChatActionDraft {
  const preview = parsePreview(row);
  if (sha256(row.preview_json) !== row.preview_sha256 ||
      !["proposed", "confirmed", "rejected", "expired"].includes(row.disposition) ||
      !["not_written", "commit_pending", "committed"].includes(row.write_state)) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "coachActionDraft" });
  }
  return Object.freeze({
    contractVersion: COACH_AI_CHAT_ACTION_DRAFT_CONTRACT_VERSION,
    draftId: row.coach_ai_chat_action_draft_id,
    conversationId: row.coach_ai_chat_conversation_id,
    sourceMessageId: row.source_message_id,
    preview,
    disposition: row.disposition,
    writeState: row.write_state,
    createdAtUtc: row.created_at_utc,
    expiresAtUtc: row.expires_at_utc,
    finalizedAtUtc: row.finalized_at_utc,
  }) as CoachAiChatActionDraft;
}

export class CoachAiChatActionDraftRepository {
  constructor(private readonly database: Database.Database) {}

  runAtomically<T>(operation: () => T): T {
    return this.database.transaction(operation).immediate();
  }

  create(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      sourceMessageId: string;
      preview: CoachAiChatActionDraftPreview;
      privatePayload: Readonly<Record<string, unknown>>;
    }>,
    now = new Date(),
  ): CoachAiChatActionDraft {
    const previewJson = canonicalJson(input.preview);
    const privatePayloadJson = canonicalJson(input.privatePayload);
    if (previewJson.length > 8_192 || privatePayloadJson.length > 4_096) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "actionDraft" });
    }
    const draftId = createCanonicalUuidV4();
    const createdAtUtc = createCanonicalUtcTimestamp(now);
    const expiresAtUtc = createCanonicalUtcTimestamp(
      new Date(now.getTime() + 24 * 60 * 60 * 1_000),
    );
    this.database.prepare(`INSERT INTO coach_ai_chat_action_drafts (
  coach_ai_chat_action_draft_id, coach_ai_chat_conversation_id, source_message_id,
  user_id, workspace_id, account_id, action_kind, preview_json,
  private_payload_json, preview_sha256, disposition, write_state,
  canonical_command, canonical_reference, created_at_utc, expires_at_utc,
  finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'proposed', 'not_written', NULL, NULL, ?, ?, NULL)`)
      .run(
        draftId,
        input.conversationId,
        input.sourceMessageId,
        scope.userId,
        scope.workspaceId,
        scope.activeAccountId,
        input.preview.kind,
        previewJson,
        privatePayloadJson,
        sha256(previewJson),
        createdAtUtc,
        expiresAtUtc,
      );
    return this.read(scope, draftId);
  }

  read(scope: WorkspaceAccessScope, draftId: string): CoachAiChatActionDraft {
    const row = this.database.prepare<[string, string, string, string], ActionDraftRow>(`SELECT *
FROM coach_ai_chat_action_drafts
WHERE coach_ai_chat_action_draft_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`)
      .get(draftId, scope.userId, scope.workspaceId, scope.activeAccountId!);
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return toDraft(row);
  }

  readPrivatePayload(scope: WorkspaceAccessScope, draftId: string): Readonly<Record<string, unknown>> {
    const row = this.database.prepare<[string, string, string, string], ActionDraftRow>(`SELECT *
FROM coach_ai_chat_action_drafts
WHERE coach_ai_chat_action_draft_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`)
      .get(draftId, scope.userId, scope.workspaceId, scope.activeAccountId!);
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    this.read(scope, draftId);
    try {
      return Object.freeze(record(JSON.parse(row.private_payload_json) as unknown, "actionPayload"));
    } catch {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "coachActionPayload" });
    }
  }

  list(scope: WorkspaceAccessScope, conversationId: string): readonly CoachAiChatActionDraft[] {
    const rows = this.database.prepare<[string, string, string, string], ActionDraftRow>(`SELECT *
FROM coach_ai_chat_action_drafts
WHERE coach_ai_chat_conversation_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?
ORDER BY created_at_utc DESC, coach_ai_chat_action_draft_id DESC
LIMIT 50`).all(conversationId, scope.userId, scope.workspaceId, scope.activeAccountId!);
    return Object.freeze(rows.map(toDraft));
  }

  readForSourceMessage(
    scope: WorkspaceAccessScope,
    conversationId: string,
    sourceMessageId: string,
  ): CoachAiChatActionDraft | null {
    const row = this.database.prepare<[string, string, string, string, string], ActionDraftRow>(`SELECT *
FROM coach_ai_chat_action_drafts
WHERE coach_ai_chat_conversation_id = ? AND source_message_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?`)
      .get(conversationId, sourceMessageId, scope.userId, scope.workspaceId, scope.activeAccountId!);
    return row ? toDraft(row) : null;
  }

  beginConfirm(
    scope: WorkspaceAccessScope,
    draftId: string,
    command: "platform_reporting_currency_update" | "platform_notification_mark_read" | "platform_account_selection",
    now = new Date(),
  ): CoachAiChatActionDraft {
    const finalizedAtUtc = createCanonicalUtcTimestamp(now);
    const result = this.database.prepare(`UPDATE coach_ai_chat_action_drafts
SET disposition = 'confirmed', write_state = 'commit_pending',
    canonical_command = ?, finalized_at_utc = ?
WHERE coach_ai_chat_action_draft_id = ? AND user_id = ? AND workspace_id = ?
  AND account_id = ? AND disposition = 'proposed' AND write_state = 'not_written'`)
      .run(command, finalizedAtUtc, draftId, scope.userId, scope.workspaceId, scope.activeAccountId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    return this.read(scope, draftId);
  }

  markCommitted(
    scope: WorkspaceAccessScope,
    draftId: string,
    canonicalReference: string,
  ): CoachAiChatActionDraft {
    if (canonicalReference.length < 1 || canonicalReference.length > 160) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "canonicalReference" });
    }
    const result = this.database.prepare(`UPDATE coach_ai_chat_action_drafts
SET write_state = 'committed', canonical_reference = ?
WHERE coach_ai_chat_action_draft_id = ? AND user_id = ? AND workspace_id = ?
  AND account_id = ? AND disposition = 'confirmed' AND write_state = 'commit_pending'`)
      .run(canonicalReference, draftId, scope.userId, scope.workspaceId, scope.activeAccountId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    return this.read(scope, draftId);
  }

  reject(scope: WorkspaceAccessScope, draftId: string, now = new Date()): CoachAiChatActionDraft {
    const current = this.read(scope, draftId);
    if (current.disposition === "rejected") return current;
    if (current.disposition !== "proposed") {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const result = this.database.prepare(`UPDATE coach_ai_chat_action_drafts
SET disposition = 'rejected', finalized_at_utc = ?
WHERE coach_ai_chat_action_draft_id = ? AND disposition = 'proposed'`)
      .run(createCanonicalUtcTimestamp(now), draftId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    return this.read(scope, draftId);
  }

  expire(scope: WorkspaceAccessScope, draftId: string, now = new Date()): CoachAiChatActionDraft {
    const result = this.database.prepare(`UPDATE coach_ai_chat_action_drafts
SET disposition = 'expired', finalized_at_utc = ?
WHERE coach_ai_chat_action_draft_id = ? AND disposition = 'proposed' AND expires_at_utc <= ?`)
      .run(createCanonicalUtcTimestamp(now), draftId, createCanonicalUtcTimestamp(now));
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    return this.read(scope, draftId);
  }
}
