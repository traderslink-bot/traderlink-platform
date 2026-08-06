import type Database from "better-sqlite3";

import type {
  CoachAiReviewDeliveryChangeDraft,
  CoachAiReviewDeliveryChangeExtraction,
  CoachAiReviewDeliveryScheduleSnapshot,
} from "../contracts/ai-review-delivery-change-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

const DELIVERY_TIME = /^(?:1[6-9]|2[0-3]):(?:00|30)$/u;
const DAYS = new Set(["friday", "saturday", "sunday"]);

type Row = Readonly<{
  draftId: string;
  conversationId: string;
  sourceMessageId: string;
  currentDay: CoachAiReviewDeliveryChangeDraft["current"]["weeklyDeliveryDay"];
  currentTime: string;
  currentUpdatedAtUtc: string | null;
  proposedDay: CoachAiReviewDeliveryChangeDraft["proposed"]["weeklyDeliveryDay"];
  proposedTime: string;
  disposition: CoachAiReviewDeliveryChangeDraft["disposition"];
  settingsWriteState: CoachAiReviewDeliveryChangeDraft["settingsWriteState"];
  createdAtUtc: string;
  expiresAtUtc: string;
  finalizedAtUtc: string | null;
}>;

const SELECT = `SELECT
  coach_ai_review_delivery_change_draft_id AS draftId,
  coach_ai_chat_conversation_id AS conversationId,
  source_message_id AS sourceMessageId,
  current_weekly_delivery_day AS currentDay,
  current_delivery_time_eastern AS currentTime,
  current_settings_updated_at_utc AS currentUpdatedAtUtc,
  proposed_weekly_delivery_day AS proposedDay,
  proposed_delivery_time_eastern AS proposedTime,
  disposition, settings_write_state AS settingsWriteState,
  created_at_utc AS createdAtUtc, expires_at_utc AS expiresAtUtc,
  finalized_at_utc AS finalizedAtUtc
FROM coach_ai_review_delivery_change_drafts`;

function accountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

function schedule(value: CoachAiReviewDeliveryScheduleSnapshot): void {
  if (!DAYS.has(value.weeklyDeliveryDay) || !DELIVERY_TIME.test(value.deliveryTimeEastern)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "reviewDelivery" });
  }
}

function proposal(value: CoachAiReviewDeliveryChangeExtraction): void {
  schedule({ ...value, updatedAtUtc: null });
}

function draft(row: Row): CoachAiReviewDeliveryChangeDraft {
  return Object.freeze({
    draftId: row.draftId,
    conversationId: row.conversationId,
    sourceMessageId: row.sourceMessageId,
    current: Object.freeze({
      weeklyDeliveryDay: row.currentDay,
      deliveryTimeEastern: row.currentTime,
      updatedAtUtc: row.currentUpdatedAtUtc,
    }),
    proposed: Object.freeze({
      weeklyDeliveryDay: row.proposedDay,
      deliveryTimeEastern: row.proposedTime,
    }),
    disposition: row.disposition,
    settingsWriteState: row.settingsWriteState,
    createdAtUtc: row.createdAtUtc,
    expiresAtUtc: row.expiresAtUtc,
    finalizedAtUtc: row.finalizedAtUtc,
  });
}

export class CoachAiReviewDeliveryChangeRepository {
  constructor(private readonly database: Database.Database) {}

  runAtomically<Value>(operation: () => Value): Value {
    return this.database.inTransaction ? operation() : this.database.transaction(operation).immediate();
  }

  create(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      sourceMessageId: string;
      current: CoachAiReviewDeliveryScheduleSnapshot;
      proposed: CoachAiReviewDeliveryChangeExtraction;
    }>,
    now = new Date(),
  ): CoachAiReviewDeliveryChangeDraft {
    const selectedAccountId = accountId(scope);
    assertCanonicalUuidV4(input.conversationId, "conversationId");
    assertCanonicalUuidV4(input.sourceMessageId, "sourceMessageId");
    schedule(input.current);
    proposal(input.proposed);
    const draftId = createCanonicalUuidV4();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1_000);
    this.database.prepare(`INSERT INTO coach_ai_review_delivery_change_drafts (
  coach_ai_review_delivery_change_draft_id, coach_ai_chat_conversation_id,
  source_message_id, user_id, workspace_id, account_id,
  current_weekly_delivery_day, current_delivery_time_eastern,
  current_settings_updated_at_utc, proposed_weekly_delivery_day,
  proposed_delivery_time_eastern, disposition, settings_write_state,
  canonical_settings_command, canonical_settings_reference, write_failure_code,
  created_at_utc, expires_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'proposed', 'not_written',
  NULL, NULL, NULL, ?, ?, NULL)`).run(
      draftId, input.conversationId, input.sourceMessageId, scope.userId,
      scope.workspaceId, selectedAccountId, input.current.weeklyDeliveryDay,
      input.current.deliveryTimeEastern, input.current.updatedAtUtc,
      input.proposed.weeklyDeliveryDay, input.proposed.deliveryTimeEastern,
      createCanonicalUtcTimestamp(now), createCanonicalUtcTimestamp(expiresAt),
    );
    return this.read(scope, draftId);
  }

  list(
    scope: WorkspaceAccessScope,
    input: Readonly<{ conversationId: string; limit?: number }>,
  ): readonly CoachAiReviewDeliveryChangeDraft[] {
    const selectedAccountId = accountId(scope);
    assertCanonicalUuidV4(input.conversationId, "conversationId");
    const limit = input.limit ?? 20;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "limit" });
    }
    const rows = this.database.prepare<[string, string, string, string, number], Row>(`${SELECT}
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND coach_ai_chat_conversation_id = ?
ORDER BY created_at_utc DESC, coach_ai_review_delivery_change_draft_id DESC
LIMIT ?`).all(scope.userId, scope.workspaceId, selectedAccountId, input.conversationId, limit);
    return Object.freeze(rows.map(draft));
  }

  read(scope: WorkspaceAccessScope, draftId: string): CoachAiReviewDeliveryChangeDraft {
    const selectedAccountId = accountId(scope);
    assertCanonicalUuidV4(draftId, "draftId");
    const row = this.database.prepare<[string, string, string, string], Row>(`${SELECT}
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND coach_ai_review_delivery_change_draft_id = ?`).get(
      scope.userId, scope.workspaceId, selectedAccountId, draftId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return draft(row);
  }

  readForSourceMessage(
    scope: WorkspaceAccessScope,
    conversationId: string,
    sourceMessageId: string,
  ): CoachAiReviewDeliveryChangeDraft | null {
    return this.list(scope, { conversationId, limit: 50 })
      .find((item) => item.sourceMessageId === sourceMessageId) ?? null;
  }

  beginConfirm(scope: WorkspaceAccessScope, draftId: string, now = new Date()): CoachAiReviewDeliveryChangeDraft {
    const current = this.read(scope, draftId);
    if (current.disposition === "confirmed" && current.settingsWriteState === "committed") return current;
    if (current.disposition !== "proposed" || current.settingsWriteState !== "not_written") {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const result = this.database.prepare(`UPDATE coach_ai_review_delivery_change_drafts
SET disposition = 'confirmed', settings_write_state = 'commit_pending',
  canonical_settings_command = 'coach_review_delivery_save', finalized_at_utc = ?
WHERE coach_ai_review_delivery_change_draft_id = ? AND disposition = 'proposed'
  AND settings_write_state = 'not_written'`).run(createCanonicalUtcTimestamp(now), draftId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    return this.read(scope, draftId);
  }

  markCommitted(scope: WorkspaceAccessScope, draftId: string, reference: string): CoachAiReviewDeliveryChangeDraft {
    if (reference.length < 1 || reference.length > 128) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "reference" });
    }
    const result = this.database.prepare(`UPDATE coach_ai_review_delivery_change_drafts
SET settings_write_state = 'committed', canonical_settings_reference = ?
WHERE coach_ai_review_delivery_change_draft_id = ? AND disposition = 'confirmed'
  AND settings_write_state = 'commit_pending'`).run(reference, draftId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    return this.read(scope, draftId);
  }

  reject(scope: WorkspaceAccessScope, draftId: string, now = new Date()): CoachAiReviewDeliveryChangeDraft {
    const current = this.read(scope, draftId);
    if (current.disposition === "rejected") return current;
    if (current.disposition !== "proposed" || current.settingsWriteState !== "not_written") {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    this.database.prepare(`UPDATE coach_ai_review_delivery_change_drafts
SET disposition = 'rejected', finalized_at_utc = ?
WHERE coach_ai_review_delivery_change_draft_id = ?`).run(createCanonicalUtcTimestamp(now), draftId);
    return this.read(scope, draftId);
  }
}
