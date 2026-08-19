import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import {
  CoachAiReviewAuthoredPersistenceRepository,
  type CoachAiReviewAuthoredCallHandle,
} from "./coach-ai-review-authored-persistence-repository";
import {
  coachAiReviewInputNeedsProviderTokenCount,
  countCoachAiReviewOpenAiInputTokens,
} from "./coach-ai-review-openai-input-token-counter";
import type { CoachAiReviewEvidenceAuthoringCallObserver } from
  "./coach-ai-review-evidence-authoring-observer";
import { generateCoachMonthlyAiReviewFromEvidencePacket } from
  "./coach-monthly-ai-review-evidence-authoring";
import { generateCoachWeeklyAiReviewFromEvidencePacket } from
  "./coach-weekly-ai-review-evidence-authoring";

function isCallHandle(value: unknown): value is CoachAiReviewAuthoredCallHandle {
  return Boolean(value && typeof value === "object" &&
    typeof (value as { callId?: unknown }).callId === "string" &&
    typeof (value as { attemptId?: unknown }).attemptId === "string");
}

/** Runs model authoring only for a durable V4 snapshot. No prose fallback exists. */
export class CoachAiReviewAuthoredExecutionService {
  constructor(private readonly database: Database.Database) {}

  async issue(
    scope: WorkspaceAccessScope,
    requestId: string,
    now = new Date(),
  ): Promise<"issued" | "retrying"> {
    const reviews = new CoachAiReviewAuthoredPersistenceRepository(this.database);
    const snapshot = reviews.readSnapshot(scope, requestId);
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return "retrying";
    const observer: CoachAiReviewEvidenceAuthoringCallObserver = {
      beforeCall: async (input) => {
        const reservationText = JSON.stringify({ system: input.system, prompt: input.prompt });
        const providerInputTokens = coachAiReviewInputNeedsProviderTokenCount(reservationText)
          ? await countCoachAiReviewOpenAiInputTokens({
              modelId: snapshot.modelId,
              system: input.system,
              prompt: input.prompt,
            })
          : null;
        return reviews.beginProviderCall({
          scope,
          requestId,
          kind: input.kind,
          system: input.system,
          prompt: input.prompt,
          providerInputTokens,
          maximumOutputTokens: input.maximumOutputTokens,
          now,
        });
      },
      completeCall: (input) => {
        if (!isCallHandle(input.handle)) {
          throw new Error("TRADERLINK_COACH_AUTHORING_CALL_HANDLE_INVALID");
        }
        reviews.completeProviderCall(
          scope,
          input.handle,
          input.usage,
          input.providerResponseId,
          new Date(),
        );
      },
      failCall: (input) => reviews.failProviderCall(
        scope,
        isCallHandle(input.handle) ? input.handle : undefined,
        input.failureCode,
        new Date(),
      ),
    };
    try {
      const generated = snapshot.packet.packetVersion ===
        "traderlink_coach_monthly_ai_review_evidence_packet_v1"
        ? await generateCoachMonthlyAiReviewFromEvidencePacket(snapshot.packet, {
            apiKey,
            modelId: snapshot.modelId,
            callObserver: observer,
          })
        : await generateCoachWeeklyAiReviewFromEvidencePacket(snapshot.packet, {
            apiKey,
            modelId: snapshot.modelId,
            callObserver: observer,
          });
      reviews.issue(scope, requestId, generated.output, new Date());
      return "issued";
    } catch {
      // The provider-call observer records a started call as unknown/failed.
      // Leaving the request pending makes a later scheduler run retry safely.
      return "retrying";
    }
  }
}
