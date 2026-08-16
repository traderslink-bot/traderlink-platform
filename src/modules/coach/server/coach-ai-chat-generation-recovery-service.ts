import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";
import { CoachAiChatRepository } from "./coach-ai-chat-repository";

/**
 * A provider request normally has a much shorter timeout. This longer lease only
 * recovers a persisted pending generation after its worker or process disappeared.
 */
export const COACH_AI_CHAT_GENERATION_LEASE_MILLISECONDS = 10 * 60 * 1_000;
export const COACH_AI_CHAT_GENERATION_INTERRUPTED_FAILURE_CODE =
  "TRADERLINK_COACH_GENERATION_INTERRUPTED";

export class CoachAiChatGenerationRecoveryService {
  constructor(
    private readonly chat: CoachAiChatRepository,
    private readonly controls: CoachAiChatProviderControlsRepository,
  ) {}

  reconcile(
    scope: WorkspaceAccessScope,
    input: Readonly<{ conversationId?: string | null }> = Object.freeze({}),
    now = new Date(),
  ): number {
    const olderThanUtc = new Date(now.getTime() - COACH_AI_CHAT_GENERATION_LEASE_MILLISECONDS).toISOString();
    const attempts = this.controls.listExpiredChatGenerationAttempts(scope, {
      olderThanUtc,
      conversationId: input.conversationId,
    });
    let recovered = 0;
    for (const attempt of attempts) {
      const finalized = this.chat.runAtomically(() => {
        const changed = this.controls.failExpiredChatGenerationAttempt(scope, {
          attemptId: attempt.attemptId,
          conversationId: attempt.conversationId,
          olderThanUtc,
          failureCode: COACH_AI_CHAT_GENERATION_INTERRUPTED_FAILURE_CODE,
        }, now);
        if (!changed) return false;
        this.chat.finalizeAssistantFailure(
          scope,
          attempt.assistantMessageId,
          COACH_AI_CHAT_GENERATION_INTERRUPTED_FAILURE_CODE,
          null,
          now,
        );
        return true;
      });
      if (finalized) recovered += 1;
    }
    return recovered;
  }
}
