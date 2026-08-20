import type Database from "better-sqlite3";

import type { CoachAiChatConversationState } from
  "../contracts/ai-chat-conversation-state-contracts";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { parseCoachAiChatConversationState } from
  "./coach-ai-chat-conversation-state";

type SnapshotRow = Readonly<{ factual_snapshot_json: string }>;

export class CoachAiChatConversationStateRepository {
  constructor(private readonly database: Database.Database) {}

  readLatest(
    scope: WorkspaceAccessScope,
    conversationId: string,
  ): CoachAiChatConversationState | null {
    assertCanonicalUuidV4(conversationId, "conversationId");
    if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const row = this.database.prepare<[string, string, string, string], SnapshotRow>(`SELECT
  snapshot.factual_snapshot_json
FROM coach_ai_chat_answer_snapshots snapshot
JOIN coach_ai_chat_messages message
  ON message.coach_ai_chat_message_id = snapshot.coach_ai_chat_message_id
WHERE snapshot.coach_ai_chat_conversation_id = ?
  AND snapshot.user_id = ? AND snapshot.workspace_id = ? AND snapshot.account_id = ?
  AND json_type(snapshot.factual_snapshot_json, '$.conversationState') = 'object'
ORDER BY message.message_sequence DESC
LIMIT 1`).get(
      conversationId,
      scope.userId,
      scope.workspaceId,
      scope.activeAccountId,
    );
    if (!row) return null;
    let snapshot: unknown;
    try {
      snapshot = JSON.parse(row.factual_snapshot_json) as unknown;
    } catch {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        component: "coachAiChatConversationState",
      });
    }
    const state = parseCoachAiChatConversationState(
      (snapshot as Readonly<{ conversationState?: unknown }>).conversationState,
    );
    if (!state) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        component: "coachAiChatConversationState",
      });
    }
    return state;
  }
}
