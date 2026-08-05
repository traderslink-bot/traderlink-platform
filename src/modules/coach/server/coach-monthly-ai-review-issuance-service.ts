import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type { CoachMonthlyAiReviewInput } from "../contracts/monthly-ai-review-input-contracts";
import type { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import {
  type CoachAiGenerationUsage,
  type CoachAiReviewRepository,
  type CoachMonthlyIssuedReviewRecord,
} from "./coach-ai-review-repository";
import {
  generateCoachMonthlyAiReview,
  type CoachMonthlyAiReviewGeneration,
} from "./coach-monthly-ai-review-openai-adapter";

export type CoachMonthlyReviewIssuanceResult =
  | Readonly<{ state: "issued"; review: CoachMonthlyIssuedReviewRecord; reused: boolean }>
  | Readonly<{ state: "in_progress"; requestId: string }>
  | Readonly<{ state: "failed"; requestId: string; retryAvailable: true }>;

export type CoachMonthlyReviewGenerator = (
  input: CoachMonthlyAiReviewInput,
  options: Readonly<{ modelId: string }>,
) => Promise<CoachMonthlyAiReviewGeneration>;

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

export class CoachMonthlyAiReviewIssuanceService {
  constructor(
    private readonly reviews: CoachAiReviewRepository,
    private readonly providerSettings: CoachAiProviderSettingsRepository,
    private readonly generate: CoachMonthlyReviewGenerator = generateCoachMonthlyAiReview,
  ) {}

  async issue(
    scope: WorkspaceAccessScope,
    input: CoachMonthlyAiReviewInput,
    priorIssuedReviewId: string | null,
    now = new Date(),
  ): Promise<CoachMonthlyReviewIssuanceResult> {
    const request = this.reviews.createOrReadMonthlyRequest(
      scope,
      input,
      priorIssuedReviewId,
      now,
    );
    const settings = this.providerSettings.read();
    const attempt = this.reviews.beginMonthlyAttempt(scope, request.requestId, settings, now);
    if (attempt.state === "already_issued") {
      return Object.freeze({ state: "issued", review: attempt.review, reused: true });
    }
    if (attempt.state === "in_progress") {
      return Object.freeze({ state: "in_progress", requestId: request.requestId });
    }
    let generated: CoachMonthlyAiReviewGeneration;
    try {
      generated = await this.generate(input, { modelId: settings.modelId });
    } catch (error) {
      this.reviews.failMonthlyAttempt(
        scope,
        attempt.attemptId,
        failureCode(error),
        failureUsage(error),
        settings,
        now,
      );
      return Object.freeze({
        state: "failed",
        requestId: request.requestId,
        retryAvailable: true,
      });
    }
    return Object.freeze({
      state: "issued",
      review: this.reviews.issueMonthlyAttempt(
        scope,
        request.requestId,
        attempt.attemptId,
        generated.output,
        generated.usage,
        settings,
        now,
      ),
      reused: false,
    });
  }
}
