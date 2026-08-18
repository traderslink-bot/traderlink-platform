import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type {
  CoachMonthlyAiReviewInputV2,
  CoachMonthlyAiReviewInput,
} from "../contracts/monthly-ai-review-input-contracts";
import { CoachAiReviewProviderControlsRepository } from "./coach-ai-review-provider-controls-repository";
import {
  coachAiReviewInputNeedsProviderTokenCount,
  countCoachAiReviewOpenAiInputTokens,
  type CoachAiReviewInputTokenCounter,
} from "./coach-ai-review-openai-input-token-counter";
import type { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import {
  type CoachAiGenerationUsage,
  type CoachAiIssuedReviewRecordV2,
  type CoachAiReviewEvidenceManifestV2,
  type CoachAiReviewRepository,
  type CoachMonthlyIssuedReviewRecord,
} from "./coach-ai-review-repository";
import {
  buildCoachMonthlyAiReviewProviderEnvelope,
  buildCoachMonthlyAiReviewProviderEnvelopeV2,
  generateCoachMonthlyAiReviewV2,
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

export type CoachMonthlyReviewGeneratorV2 = typeof generateCoachMonthlyAiReviewV2;

export type CoachMonthlyReviewIssuanceResultV2 =
  | Readonly<{ state: "issued"; review: CoachAiIssuedReviewRecordV2; reused: boolean }>
  | Readonly<{ state: "in_progress"; requestId: string }>
  | Readonly<{ state: "failed"; requestId: string; retryAvailable: true }>;

function failureCode(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "TRADERLINK_COACH_OPENAI_UNAVAILABLE") return error.message;
    if (error.message === "TRADERLINK_COACH_OPENAI_TOKEN_COUNT_UNAVAILABLE") {
      return error.message;
    }
    if (error.message === "TRADERLINK_COACH_REVIEW_INPUT_TOO_LARGE") {
      return error.message;
    }
    if (error.message === "TRADERLINK_COACH_OPENAI_NO_OUTPUT") return error.message;
    if (error.message.startsWith("TRADERLINK_COACH_OPENAI_UNSAFE_")) return error.message;
  }
  return "TRADERLINK_COACH_PROVIDER_FAILED";
}

function failureUsage(error: unknown): CoachAiGenerationUsage | null {
  if (!error || typeof error !== "object" || !("usage" in error)) return null;
  const usage = (error as { usage?: unknown }).usage;
  if (!usage || typeof usage !== "object") return null;
  const candidate = usage as Readonly<{
    inputTokens?: unknown;
    cachedInputTokens?: unknown;
    cacheWriteInputTokens?: unknown;
    outputTokens?: unknown;
    totalTokens?: unknown;
  }>;
  const values = [
    candidate.inputTokens,
    candidate.cachedInputTokens,
    candidate.cacheWriteInputTokens,
    candidate.outputTokens,
    candidate.totalTokens,
  ];
  if (!values.every((value) =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0,
  ) || (candidate.cachedInputTokens as number) +
      (candidate.cacheWriteInputTokens as number) > (candidate.inputTokens as number)) {
    return null;
  }
  return Object.freeze({
    inputTokens: candidate.inputTokens as number,
    cachedInputTokens: candidate.cachedInputTokens as number,
    cacheWriteInputTokens: candidate.cacheWriteInputTokens as number,
    outputTokens: candidate.outputTokens as number,
    totalTokens: candidate.totalTokens as number,
  });
}

export class CoachMonthlyAiReviewIssuanceService {
  constructor(
    private readonly reviews: CoachAiReviewRepository,
    private readonly providerSettings: CoachAiProviderSettingsRepository,
    private readonly generate: CoachMonthlyReviewGenerator = generateCoachMonthlyAiReview,
    private readonly controls: CoachAiReviewProviderControlsRepository,
    private readonly generateV2: CoachMonthlyReviewGeneratorV2 = generateCoachMonthlyAiReviewV2,
    private readonly countInputTokens: CoachAiReviewInputTokenCounter =
      countCoachAiReviewOpenAiInputTokens,
  ) {}

  async issueExistingV2(
    scope: WorkspaceAccessScope,
    requestId: string,
    now = new Date(),
  ): Promise<CoachMonthlyReviewIssuanceResultV2> {
    const request = this.reviews.readPeriodRequestV2(scope, requestId);
    if (request.reviewKind !== "monthly") {
      throw new Error("TRADERLINK_COACH_REVIEW_REQUEST_KIND_MISMATCH");
    }
    const input = this.reviews.readInputV2(scope, requestId);
    if (!("calendarMonth" in input)) {
      throw new Error("TRADERLINK_COACH_REVIEW_REQUEST_INPUT_MISMATCH");
    }
    return this.issueV2(
      scope,
      input,
      this.reviews.readEvidenceManifestV2(scope, requestId),
      request.requestOrigin,
      request.priorIssuedReviewId,
      now,
    );
  }

  async issueV2(
    scope: WorkspaceAccessScope,
    input: CoachMonthlyAiReviewInputV2,
    evidenceManifest: CoachAiReviewEvidenceManifestV2,
    requestOrigin: "automatic" | "manual",
    priorIssuedReviewId: string | null,
    now = new Date(),
  ): Promise<CoachMonthlyReviewIssuanceResultV2> {
    const request = this.reviews.createOrReadPeriodRequestV2(
      scope,
      input,
      evidenceManifest,
      requestOrigin,
      priorIssuedReviewId,
      now,
    );
    const providerInput = this.reviews.readInputV2(scope, request.requestId);
    if (providerInput.contractVersion !== input.contractVersion ||
        !("calendarMonth" in providerInput)) {
      throw new Error("TRADERLINK_COACH_REVIEW_REQUEST_INPUT_MISMATCH");
    }
    const settings = this.providerSettings.read();
    const attempt = this.reviews.beginAttemptV2(scope, request.requestId, settings, now);
    if (attempt.state === "already_issued") {
      return Object.freeze({ state: "issued", review: attempt.review, reused: true });
    }
    if (attempt.state === "in_progress") {
      return Object.freeze({ state: "in_progress", requestId: request.requestId });
    }
    const envelope = buildCoachMonthlyAiReviewProviderEnvelopeV2(providerInput);
    let providerInputTokens: number | null = null;
    try {
      if (coachAiReviewInputNeedsProviderTokenCount(envelope.reservationText)) {
        providerInputTokens = await this.countInputTokens({
          modelId: settings.modelId,
          system: envelope.system,
          prompt: envelope.prompt,
        });
      }
    } catch (error) {
      this.reviews.failAttemptV2(
        scope,
        attempt.attemptId,
        failureCode(error),
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
    const reservation = this.controls.reserveReviewGenerationV2(scope, {
      attemptId: attempt.attemptId,
      reviewKind: "monthly",
      providerInputText: envelope.reservationText,
      providerInputTokens,
      maxOutputTokens: envelope.maximumOutputTokens,
    }, now);
    if (reservation.reservation.state === "blocked") {
      this.reviews.failAttemptV2(
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
    this.controls.markProviderStartedV2(scope, attempt.attemptId, now);
    let generated: Awaited<ReturnType<CoachMonthlyReviewGeneratorV2>>;
    try {
      generated = await this.generateV2(providerInput, {
        modelId: reservation.reservation.modelId,
      });
    } catch (error) {
      const usage = failureUsage(error);
      const code = failureCode(error);
      this.reviews.failAttemptV2(
        scope,
        attempt.attemptId,
        code,
        usage,
        usage ? settings : null,
        now,
      );
      if (usage) {
        this.controls.finalizeFromReviewReceiptV2(
          scope,
          attempt.attemptId,
          "failed",
          code,
          now,
        );
      } else {
        this.controls.failStartedWithoutUsageV2(scope, attempt.attemptId, code, now);
      }
      return Object.freeze({
        state: "failed",
        requestId: request.requestId,
        retryAvailable: true,
      });
    }
    if (generated.usage.inputTokens === null ||
        generated.usage.cachedInputTokens === null ||
        generated.usage.cachedInputTokens === undefined ||
        generated.usage.outputTokens === null ||
        generated.usage.totalTokens === null) {
      const code = "TRADERLINK_COACH_PROVIDER_USAGE_UNAVAILABLE";
      this.reviews.failAttemptV2(scope, attempt.attemptId, code, null, null, now);
      this.controls.failStartedWithoutUsageV2(scope, attempt.attemptId, code, now);
      return Object.freeze({
        state: "failed",
        requestId: request.requestId,
        retryAvailable: true,
      });
    }
    const review = this.reviews.issueAttemptV2(
      scope,
      request.requestId,
      attempt.attemptId,
      generated.output,
      generated.usage,
      settings,
      now,
    );
    this.controls.finalizeFromReviewReceiptV2(
      scope,
      attempt.attemptId,
      "completed",
      null,
      now,
    );
    return Object.freeze({ state: "issued", review, reused: false });
  }

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
    const envelope = buildCoachMonthlyAiReviewProviderEnvelope(input);
    let providerInputTokens: number | null = null;
    try {
      if (coachAiReviewInputNeedsProviderTokenCount(envelope.reservationText)) {
        providerInputTokens = await this.countInputTokens({
          modelId: settings.modelId,
          system: envelope.system,
          prompt: envelope.prompt,
        });
      }
    } catch (error) {
      this.reviews.failMonthlyAttempt(
        scope,
        attempt.attemptId,
        failureCode(error),
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
    const reservation = this.controls.reserveReviewGeneration(scope, {
      attemptId: attempt.attemptId,
      reviewKind: "monthly",
      providerInputText: envelope.reservationText,
      providerInputTokens,
      maxOutputTokens: envelope.maximumOutputTokens,
    }, now);
    if (reservation.reservation.state === "blocked") {
      this.reviews.failMonthlyAttempt(
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
    let generated: CoachMonthlyAiReviewGeneration;
    try {
      generated = await this.generate(input, { modelId: reservation.reservation.modelId });
    } catch (error) {
      const usage = failureUsage(error);
      this.reviews.failMonthlyAttempt(
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
    const review = this.reviews.issueMonthlyAttempt(
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
