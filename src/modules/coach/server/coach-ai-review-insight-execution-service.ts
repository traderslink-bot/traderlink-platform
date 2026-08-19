import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import {
  restoreCoachAiReviewFrozenProviderPackage,
  restoreCoachAiReviewOpenAiSelectionEnvelope,
} from "./ai-review-insights/coach-ai-review-insight-snapshot-artifact";
import {
  CoachAiReviewOpenAiSelectionError,
  selectCoachAiReviewPlanWithOpenAi,
} from "./ai-review-insights/coach-ai-review-openai-plan-selector";
import { CoachAiProviderSettingsRepository } from
  "./coach-ai-provider-settings-repository";
import { CoachAiReviewInsightDispatchRepository } from
  "./coach-ai-review-insight-dispatch-repository";
import { CoachAiReviewInsightIssuanceRepository } from
  "./coach-ai-review-insight-issuance-repository";
import { CoachAiReviewInsightPersistenceRepository } from
  "./coach-ai-review-insight-persistence-repository";
import {
  coachAiReviewInputNeedsProviderTokenCount,
  countCoachAiReviewOpenAiInputTokens,
} from "./coach-ai-review-openai-input-token-counter";
import {
  COACH_AI_REVIEW_CONTEXT_SAFETY_TOKENS,
  COACH_AI_REVIEW_INPUT_TOKEN_HEADROOM,
  coachAiReviewModelContextTokens,
} from "./coach-ai-review-model-limits";
import { CoachAiReviewProviderControlsRepository } from
  "./coach-ai-review-provider-controls-repository";
import { CoachAiReviewRepository, type CoachAiGenerationUsage } from
  "./coach-ai-review-repository";

const DISPATCH_LEASE_MILLISECONDS = 90_000;

export type CoachAiReviewInsightExecutionOptions = Readonly<{
  /**
   * Acceptance-only transport capture. Ordinary runtime construction omits
   * this option and therefore uses the real global fetch implementation.
   */
  capturedTestFetch?: typeof globalThis.fetch;
  /** Acceptance clock for transport authorization and provider settlement. */
  operationClock?: () => Date;
}>;

function completeUsage(usage: CoachAiGenerationUsage | null): usage is Readonly<{
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteInputTokens: number;
  outputTokens: number;
  totalTokens: number;
}> {
  if (!usage) return false;
  const values = [
    usage.inputTokens,
    usage.cachedInputTokens,
    usage.cacheWriteInputTokens,
    usage.outputTokens,
    usage.totalTokens,
  ];
  return values.every((value) => typeof value === "number" &&
    Number.isSafeInteger(value) && value >= 0) &&
    (usage.cachedInputTokens as number) +
      (usage.cacheWriteInputTokens as number) <= (usage.inputTokens as number) &&
    (usage.inputTokens as number) + (usage.outputTokens as number) ===
      usage.totalTokens;
}

export class CoachAiReviewInsightExecutionService {
  readonly #snapshots: CoachAiReviewInsightPersistenceRepository;
  readonly #issuance: CoachAiReviewInsightIssuanceRepository;
  readonly #dispatches: CoachAiReviewInsightDispatchRepository;
  readonly #controls: CoachAiReviewProviderControlsRepository;
  readonly #settings: CoachAiProviderSettingsRepository;
  readonly #legacyRequestState: CoachAiReviewRepository;

  constructor(
    private readonly database: Database.Database,
    private readonly options: CoachAiReviewInsightExecutionOptions = {},
  ) {
    this.#snapshots = new CoachAiReviewInsightPersistenceRepository(database);
    this.#issuance = new CoachAiReviewInsightIssuanceRepository(database);
    this.#dispatches = new CoachAiReviewInsightDispatchRepository(database);
    this.#controls = new CoachAiReviewProviderControlsRepository(database);
    this.#settings = new CoachAiProviderSettingsRepository(database);
    this.#legacyRequestState = new CoachAiReviewRepository(database);
  }

  private operationTime(): Date {
    return this.options.operationClock?.() ?? new Date();
  }

  async issue(
    scope: WorkspaceAccessScope,
    requestId: string,
    now = new Date(),
  ): Promise<"issued" | "in_progress" | "retrying"> {
    const snapshot = this.#snapshots.read(scope, requestId);
    const artifact = snapshot.artifact;
    if (artifact.catalog.completePlans.length === 1) {
      this.#issuance.issueDeterministicDefault({
        scope,
        requestId,
        reason: "single_authorized_plan",
        now,
      });
      return "issued";
    }
    const settings = this.#settings.read();
    const manifest = artifact.selectionEnvelope.invocationManifest;
    if (settings.providerKey !== manifest.providerKey ||
        settings.modelId !== manifest.modelId ||
        !process.env.OPENAI_API_KEY?.trim()) {
      this.#issuance.issueDeterministicDefault({
        scope,
        requestId,
        reason: "provider_configuration_drift",
        now,
      });
      return "issued";
    }
    const envelope = restoreCoachAiReviewOpenAiSelectionEnvelope(artifact);
    let providerInputTokens: number | null = null;
    try {
      if (coachAiReviewInputNeedsProviderTokenCount(envelope.reservationText)) {
        providerInputTokens = await countCoachAiReviewOpenAiInputTokens({
          modelId: manifest.modelId,
          system: envelope.system,
          prompt: envelope.prompt,
        });
      }
    } catch {
      this.#issuance.issueDeterministicDefault({
        scope,
        requestId,
        reason: "provider_input_limit",
        now,
      });
      return "issued";
    }
    const reservedInputTokens = providerInputTokens === null
      ? Buffer.byteLength(envelope.reservationText, "utf8")
      : providerInputTokens + COACH_AI_REVIEW_INPUT_TOKEN_HEADROOM;
    const contextTokens = coachAiReviewModelContextTokens(manifest.modelId);
    if (contextTokens === null || reservedInputTokens + envelope.maximumOutputTokens +
        COACH_AI_REVIEW_CONTEXT_SAFETY_TOKENS > contextTokens) {
      this.#issuance.issueDeterministicDefault({
        scope,
        requestId,
        reason: "provider_input_limit",
        now,
      });
      return "issued";
    }
    const prepared: Readonly<{
      state: "already_issued" | "in_progress" | "deterministic_default_required" |
        "blocked" | "dispatch";
      attemptId: string | null;
      dispatch: ReturnType<CoachAiReviewInsightDispatchRepository["acquire"]> | null;
    }> = this.database.transaction(() => {
      const attempt = this.#snapshots.beginAttempt(scope, requestId, now);
      if (attempt.state === "in_progress") {
        return Object.freeze({
          state: "dispatch" as const,
          attemptId: attempt.attemptId,
          dispatch: this.#dispatches.acquire(
            scope,
            requestId,
            attempt.attemptId,
            DISPATCH_LEASE_MILLISECONDS,
            now,
          ),
        });
      }
      if (attempt.state !== "started") {
        return Object.freeze({
          state: attempt.state,
          attemptId: null,
          dispatch: null,
        });
      }
      const reservation = this.#controls.reserveReviewGenerationV2(scope, {
        attemptId: attempt.attemptId,
        reviewKind: artifact.request.reviewKind,
        providerInputText: envelope.reservationText,
        providerInputTokens,
        maxOutputTokens: envelope.maximumOutputTokens,
      }, now);
      if (reservation.reservation.state === "blocked") {
        this.#legacyRequestState.failAttemptV2(
          scope,
          attempt.attemptId,
          "TRADERLINK_COACH_REVIEW_UNAVAILABLE",
          null,
          null,
          now,
        );
        return Object.freeze({
          state: "blocked" as const,
          attemptId: attempt.attemptId,
          dispatch: null,
        });
      }
      this.#controls.markProviderStartedV2(scope, attempt.attemptId, now);
      return Object.freeze({
        state: "dispatch" as const,
        attemptId: attempt.attemptId,
        dispatch: this.#dispatches.acquire(
          scope,
          requestId,
          attempt.attemptId,
          DISPATCH_LEASE_MILLISECONDS,
          now,
        ),
      });
    }).immediate();
    if (prepared.state === "already_issued") return "issued";
    if (prepared.state === "in_progress") return "in_progress";
    if (prepared.state === "deterministic_default_required") {
      const crossed = this.database.prepare<[string], Readonly<{
        unknown_count: number;
        crossed_count: number;
      }>>(`SELECT
  SUM(CASE WHEN failure_code = 'TRADERLINK_COACH_USAGE_UNKNOWN_AFTER_DISPATCH'
    THEN 1 ELSE 0 END) AS unknown_count,
  COUNT(*) AS crossed_count
FROM coach_ai_review_insight_provider_dispatches
WHERE coach_ai_review_period_request_id = ?
  AND transport_may_have_started_at_utc IS NOT NULL`).get(requestId);
      this.#issuance.issueDeterministicDefault({
        scope,
        requestId,
        reason: (crossed?.unknown_count ?? 0) > 0
          ? "usage_unknown_after_dispatch"
          : (crossed?.crossed_count ?? 0) > 0
            ? "provider_selection_unavailable"
            : "provider_reservation_refused",
        now,
      });
      return "issued";
    }
    if (prepared.state === "blocked") {
      this.#issuance.issueDeterministicDefault({
        scope,
        requestId,
        reason: "provider_reservation_refused",
        now,
      });
      return "issued";
    }
    const acquired = prepared.dispatch;
    const attemptId = prepared.attemptId;
    if (!acquired || !attemptId) {
      throw new Error("TRADERLINK_COACH_DISPATCH_PREPARATION_MISSING");
    }
    if (acquired.state === "in_progress") return "in_progress";
    if (acquired.state === "recovery_required") return "retrying";
    if (acquired.state === "selection_terminal") {
      this.#issuance.issueDeterministicDefault({
        scope,
        requestId,
        reason: acquired.dispatch.usageSettlementState === "unknown_after_dispatch"
          ? "usage_unknown_after_dispatch"
          : "provider_selection_unavailable",
        now,
      });
      return "issued";
    }
    if (!acquired.lease) throw new Error("TRADERLINK_COACH_DISPATCH_LEASE_MISSING");
    const dispatchFence = Object.freeze({
      dispatchId: acquired.lease.dispatch.dispatchId,
      requestId,
      attemptId,
      recoveryEpoch: acquired.lease.dispatch.recoveryEpoch,
      leaseGeneration: acquired.lease.dispatch.leaseGeneration,
      fencingToken: acquired.lease.fencingToken,
    });
    try {
      const generated = await selectCoachAiReviewPlanWithOpenAi({
        frozenPackage: restoreCoachAiReviewFrozenProviderPackage(artifact),
        frozenEnvelope: envelope,
        apiKey: process.env.OPENAI_API_KEY?.trim() ?? "",
        modelId: manifest.modelId,
        timeoutMs: manifest.timeoutMs,
        authorizeTransport: async (transportAudit) => {
          this.#issuance.authorizeProviderTransport({
            scope,
            requestId,
            dispatchFence,
            transportAudit,
            now: this.operationTime(),
          });
        },
        capturedTestFetch: this.options.capturedTestFetch,
      });
      this.#issuance.issueProviderSelection({
        scope,
        requestId,
        attemptId,
        dispatchFence,
        selection: generated.selection,
        usage: generated.usage,
        providerResponseId: generated.providerResponseId,
        now: this.operationTime(),
      });
      return "issued";
    } catch (error) {
      if (!(error instanceof CoachAiReviewOpenAiSelectionError)) throw error;
      const failureAt = this.operationTime();
      if (!error.transportMayHaveStarted) {
        this.#dispatches.settleBeforeTransport(
          scope,
          dispatchFence,
          error.failureCode,
          failureAt,
        );
        this.#issuance.issueDeterministicDefault({
          scope,
          requestId,
          reason: "provider_reservation_refused",
          now: failureAt,
        });
        return "issued";
      }
      if (completeUsage(error.usage)) {
        this.#issuance.rejectProviderSelectionWithReceiptAndIssueDefault({
          scope,
          requestId,
          attemptId,
          dispatchFence,
          failureCode: error.failureCode,
          structuredSelection: null,
          usage: error.usage,
          providerResponseId: error.providerResponseId,
          now: failureAt,
        });
      } else {
        this.#issuance.rejectProviderSelectionWithUnknownUsageAndIssueDefault({
          scope,
          requestId,
          attemptId,
          dispatchFence,
          failureCode: error.failureCode,
          structuredSelection: null,
          providerResponseId: error.providerResponseId,
          now: failureAt,
        });
      }
      return "issued";
    }
  }
}
