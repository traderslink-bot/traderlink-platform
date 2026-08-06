import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type { CoachWeeklyAiReviewInput } from "../contracts/weekly-ai-review-input-contracts";
import { CoachAiReviewProviderControlsRepository } from "./coach-ai-review-provider-controls-repository";
import type { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import {
  type CoachAiGenerationUsage,
  type CoachAiReviewRepository,
  type CoachWeeklyIssuedReviewRecord,
} from "./coach-ai-review-repository";
import {
  buildCoachWeeklyAiReviewProviderEnvelope,
  generateCoachWeeklyAiReview,
  type CoachWeeklyAiReviewGeneration,
} from "./coach-weekly-ai-review-openai-adapter";

export type CoachWeeklyReviewIssuanceResult =
  | Readonly<{ state: "issued"; review: CoachWeeklyIssuedReviewRecord; reused: boolean }>
  | Readonly<{ state: "in_progress"; requestId: string }>
  | Readonly<{ state: "failed"; requestId: string; retryAvailable: true }>;

export type CoachWeeklyReviewGenerator = (
  input: CoachWeeklyAiReviewInput,
  options: Readonly<{ modelId: string }>,
) => Promise<CoachWeeklyAiReviewGeneration>;

function failureCode(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "TRADERLINK_COACH_OPENAI_UNAVAILABLE") return error.message;
    if (error.message === "TRADERLINK_COACH_OPENAI_NO_OUTPUT") return error.message;
  }
  return "TRADERLINK_COACH_PROVIDER_FAILED";
}

function failureUsage(error: unknown): CoachAiGenerationUsage | null {
  if (!error || typeof error !== "object" || !("usage" in error)) return null;
  const usage = (error as { usage?: unknown }).usage;
  if (!usage || typeof usage !== "object") return null;
  const candidate = usage as Readonly<{
    inputTokens?: unknown;
    outputTokens?: unknown;
    totalTokens?: unknown;
  }>;
  const values = [candidate.inputTokens, candidate.outputTokens, candidate.totalTokens];
  if (!values.every((value) =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0,
  )) return null;
  return Object.freeze({
    inputTokens: candidate.inputTokens as number,
    outputTokens: candidate.outputTokens as number,
    totalTokens: candidate.totalTokens as number,
  });
}

export class CoachWeeklyAiReviewIssuanceService {
  constructor(
    private readonly reviews: CoachAiReviewRepository,
    private readonly providerSettings: CoachAiProviderSettingsRepository,
    private readonly generate: CoachWeeklyReviewGenerator = generateCoachWeeklyAiReview,
    private readonly controls: CoachAiReviewProviderControlsRepository,
  ) {}

  async issue(
    scope: WorkspaceAccessScope,
    input: CoachWeeklyAiReviewInput,
    priorIssuedReviewId: string | null,
    now = new Date(),
  ): Promise<CoachWeeklyReviewIssuanceResult> {
    const request = this.reviews.createOrReadWeeklyRequest(
      scope,
      input,
      priorIssuedReviewId,
      now,
    );
    const settings = this.providerSettings.read();
    const attempt = this.reviews.beginWeeklyAttempt(scope, request.requestId, settings, now);
    if (attempt.state === "already_issued") {
      return Object.freeze({ state: "issued", review: attempt.review, reused: true });
    }
    if (attempt.state === "in_progress") {
      return Object.freeze({ state: "in_progress", requestId: request.requestId });
    }
    const envelope = buildCoachWeeklyAiReviewProviderEnvelope(input);
    const reservation = this.controls.reserveReviewGeneration(scope, {
      attemptId: attempt.attemptId,
      reviewKind: "weekly",
      providerInputText: envelope.reservationText,
      maxOutputTokens: envelope.maximumOutputTokens,
    }, now);
    if (reservation.reservation.state === "blocked") {
      this.reviews.failWeeklyAttempt(
        scope,
        attempt.attemptId,
        "TRADERLINK_COACH_REVIEW_UNAVAILABLE",
        null,
        null,
        now,
      );
      return Object.freeze({
        state: "failed",
        requestId: request.requestId,
        retryAvailable: true,
      });
    }
    this.controls.markProviderStarted(scope, attempt.attemptId, now);
    let generated: CoachWeeklyAiReviewGeneration;
    try {
      generated = await this.generate(input, { modelId: reservation.reservation.modelId });
    } catch (error) {
      const usage = failureUsage(error);
      this.reviews.failWeeklyAttempt(
        scope,
        attempt.attemptId,
        failureCode(error),
        usage,
        settings,
        now,
      );
      if (usage) {
        this.controls.finalizeFromReviewReceipt(
          scope,
          attempt.attemptId,
          "failed",
          failureCode(error),
          now,
        );
      } else {
        this.controls.failStartedWithoutUsage(
          scope,
          attempt.attemptId,
          failureCode(error),
          now,
        );
      }
      return Object.freeze({
        state: "failed",
        requestId: request.requestId,
        retryAvailable: true,
      });
    }
    const review = this.reviews.issueWeeklyAttempt(
      scope,
      request.requestId,
      attempt.attemptId,
      generated.output,
      generated.usage,
      settings,
      now,
    );
    this.controls.finalizeFromReviewReceipt(
      scope,
      attempt.attemptId,
      "completed",
      null,
      now,
    );
    return Object.freeze({
      state: "issued",
      review,
      reused: false,
    });
  }
}
