import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

const TRADING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const PROPOSED_CONTENT_MAX_LENGTH = 32_000;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

export class CoachAiDailyCompanionRepository {
  constructor(private readonly database: Database.Database) {}

  recordProposedReflection(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      sourceMessageId: string;
      tradingDate: string;
      proposedContent: unknown;
    }>,
    now = new Date(),
  ): string {
    if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    assertCanonicalUuidV4(input.conversationId, "conversationId");
    assertCanonicalUuidV4(input.sourceMessageId, "sourceMessageId");
    if (!TRADING_DATE_PATTERN.test(input.tradingDate)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tradingDate" });
    }
    if (!input.proposedContent || typeof input.proposedContent !== "object" ||
        Array.isArray(input.proposedContent)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "proposedContent" });
    }
    const proposedContentJson = JSON.stringify(canonicalize(input.proposedContent));
    if (proposedContentJson.length < 2 || proposedContentJson.length > PROPOSED_CONTENT_MAX_LENGTH) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "proposedContent" });
    }
    const interactionId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO coach_ai_daily_companion_interactions (
  coach_ai_daily_companion_interaction_id, coach_ai_chat_conversation_id, source_message_id,
  user_id, workspace_id, account_id, trading_date, interaction_kind,
  proposed_content_json, journal_write_state, canonical_journal_command,
  canonical_journal_reference, write_failure_code, disposition, created_at_utc, resolved_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'daily_reflection', ?, 'not_written', NULL, NULL, NULL,
  'proposed', ?, NULL)`).run(
      interactionId,
      input.conversationId,
      input.sourceMessageId,
      scope.userId,
      scope.workspaceId,
      scope.activeAccountId,
      input.tradingDate,
      proposedContentJson,
      createCanonicalUtcTimestamp(now),
    );
    return interactionId;
  }
}
