import "server-only";

import Decimal from "decimal.js";
import type Database from "better-sqlite3";

import {
  buildCoachAiReviewOutputV3,
  parseCoachAiReviewOutputV3,
  type CoachAiReviewOutputV3,
} from "@/src/modules/coach/contracts/coach-ai-review-output-v3-contracts";
import type {
  CoachAiReviewPlanSelectionResponse,
  CoachAiReviewProviderChoiceKey,
} from "@/src/modules/coach/contracts/coach-ai-review-plan-selection-contracts";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { WhopAiReviewEntitlementRepository } from
  "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformNotificationRepository } from
  "@/src/modules/platform/server/notifications/platform-notification-repository";
import {
  canonicalCoachAiReviewInsightBytes,
  digestCanonicalCoachAiReviewInsight,
} from "./ai-review-insights/coach-ai-review-insight-canonical";
import {
  resolveCoachAiReviewPlanSelection,
} from "./ai-review-insights/coach-ai-review-plan-selection-package";
import {
  restoreCoachAiReviewFrozenProviderPackage,
} from "./ai-review-insights/coach-ai-review-insight-snapshot-artifact";
import type { CoachAiReviewOpenAiTransportAudit } from
  "./ai-review-insights/coach-ai-review-openai-plan-selector";
import {
  type CoachAiReviewInsightDispatchFence,
  type CoachAiReviewInsightDispatchRecord,
  CoachAiReviewInsightDispatchRepository,
} from "./coach-ai-review-insight-dispatch-repository";
import { CoachAiReviewInsightPersistenceRepository } from
  "./coach-ai-review-insight-persistence-repository";
import {
  calculateCoachAiReviewEstimatedCost,
  type CoachAiGenerationUsage,
} from "./coach-ai-review-repository";

const ExactDecimal = Decimal.clone({
  precision: 80,
  toExpNeg: -1000,
  toExpPos: 1000,
});
const FAILURE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,95}$/u;
const ISSUANCE_AUTHORIZATION_REVOKED =
  "TRADERLINK_COACH_ISSUANCE_AUTHORIZATION_REVOKED" as const;
const USAGE_UNKNOWN_AFTER_DISPATCH =
  "TRADERLINK_COACH_USAGE_UNKNOWN_AFTER_DISPATCH" as const;

export type CoachAiReviewDeterministicReason =
  | "single_authorized_plan"
  | "provider_input_limit"
  | "provider_reservation_refused"
  | "provider_configuration_drift"
  | "usage_unknown_after_dispatch"
  | "provider_selection_unavailable";

export type CoachAiIssuedReviewRecordV3 = Readonly<{
  issuedReviewId: string;
  requestId: string;
  reviewKind: "weekly" | "two_week" | "monthly";
  periodStartDate: string;
  periodEndDate: string;
  generationSource: "provider_selected" | "deterministic_default";
  modelId: string | null;
  reviewPlanRef: string;
  output: CoachAiReviewOutputV3;
  issuedAtUtc: string;
}>;

type RequestRow = Readonly<{
  review_kind: "weekly" | "two_week" | "monthly";
  period_start_date: string;
  period_end_date: string;
  state: "pending" | "issued" | "failed" | "stopped";
  issued_review_id: string | null;
}>;

type ReservationRow = Readonly<{
  provider_key: string;
  model_id: string;
  input_cost_usd_per_million_tokens: string;
  cached_input_cost_usd_per_million_tokens: string;
  cache_write_input_cost_usd_per_million_tokens: string;
  output_cost_usd_per_million_tokens: string;
  reserved_max_input_tokens: number;
  reserved_max_output_tokens: number;
  reserved_max_total_tokens: number;
  reserved_maximum_cost_usd: string;
  state: "started" | "completed" | "failed";
}>;

type ReceiptRow = Readonly<{
  input_tokens: number;
  cached_input_tokens: number;
  cache_write_input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: string;
  reservation_overrun: number;
}>;

type CompleteUsage = Readonly<{
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteInputTokens: number;
  outputTokens: number;
  totalTokens: number;
}>;

type InsightArtifact = ReturnType<CoachAiReviewInsightPersistenceRepository["read"]>["artifact"];
type InsightCompletePlan = InsightArtifact["catalog"]["completePlans"][number];
type InsightFocusAssessment = NonNullable<
  InsightArtifact["candidates"][number]["focusAssessment"]
>;

function activeAccountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

function normalizedUsage(usage: CoachAiGenerationUsage): CompleteUsage {
  const values = [
    usage.inputTokens,
    usage.cachedInputTokens,
    usage.cacheWriteInputTokens,
    usage.outputTokens,
    usage.totalTokens,
  ];
  if (!values.every((value) => typeof value === "number" &&
      Number.isSafeInteger(value) && value >= 0) ||
      (usage.cachedInputTokens as number) +
        (usage.cacheWriteInputTokens as number) > (usage.inputTokens as number) ||
      (usage.inputTokens as number) + (usage.outputTokens as number) !==
        usage.totalTokens) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "usage",
    });
  }
  return Object.freeze({
    inputTokens: usage.inputTokens as number,
    cachedInputTokens: usage.cachedInputTokens as number,
    cacheWriteInputTokens: usage.cacheWriteInputTokens as number,
    outputTokens: usage.outputTokens as number,
    totalTokens: usage.totalTokens as number,
  });
}

function fixedDecimal(value: Decimal): string {
  const fixed = value.toFixed(12);
  return fixed.includes(".")
    ? fixed.replace(/0+$/u, "").replace(/\.$/u, "")
    : fixed;
}

export class CoachAiReviewInsightIssuanceRepository {
  private readonly snapshots: CoachAiReviewInsightPersistenceRepository;
  private readonly dispatches: CoachAiReviewInsightDispatchRepository;

  constructor(private readonly database: Database.Database) {
    this.snapshots = new CoachAiReviewInsightPersistenceRepository(database);
    this.dispatches = new CoachAiReviewInsightDispatchRepository(database);
  }

  private transaction<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  authorizeProviderTransport(input: Readonly<{
    scope: WorkspaceAccessScope;
    requestId: string;
    dispatchFence: CoachAiReviewInsightDispatchFence;
    transportAudit: CoachAiReviewOpenAiTransportAudit;
    now?: Date;
  }>): CoachAiReviewInsightDispatchRecord {
    assertCanonicalUuidV4(input.requestId, "requestId");
    return this.transaction(() => {
      const request = this.request(input.scope, input.requestId);
      if (request.state !== "pending" ||
          input.dispatchFence.requestId !== input.requestId) {
        this.integrity("transportRequestState");
      }
      this.assertIssuanceAuthorized(input.scope, request.review_kind);
      this.assertProviderCallsAllowed();
      return this.dispatches.authorizeTransport(
        input.scope,
        input.dispatchFence,
        input.transportAudit,
        input.now ?? new Date(),
      );
    });
  }

  issueProviderSelection(input: Readonly<{
    scope: WorkspaceAccessScope;
    requestId: string;
    attemptId: string;
    dispatchFence: CoachAiReviewInsightDispatchFence;
    selection: CoachAiReviewPlanSelectionResponse;
    usage: CoachAiGenerationUsage;
    providerResponseId: string;
    now?: Date;
  }>): CoachAiIssuedReviewRecordV3 {
    const now = input.now ?? new Date();
    assertCanonicalUuidV4(input.requestId, "requestId");
    assertCanonicalUuidV4(input.attemptId, "attemptId");
    const usage = normalizedUsage(input.usage);
    const issued = this.transaction<CoachAiIssuedReviewRecordV3 | null>(() => {
      const request = this.request(input.scope, input.requestId);
      if (request.state === "issued" && request.issued_review_id) {
        this.recordLateReceiptIfRequired({
          scope: input.scope,
          requestId: input.requestId,
          attemptId: input.attemptId,
          dispatchFence: input.dispatchFence,
          usage,
          providerResponseId: input.providerResponseId,
          now,
        });
        return this.read(input.scope, request.issued_review_id);
      }
      if (request.state !== "pending") this.integrity("requestState");
      const currentDispatch = this.dispatches.read(
        input.scope,
        input.dispatchFence.dispatchId,
      );
      if (currentDispatch.failureCode === USAGE_UNKNOWN_AFTER_DISPATCH &&
          (currentDispatch.usageSettlementState === "unknown_after_dispatch" ||
            currentDispatch.usageSettlementState === "reconciled_receipt")) {
        this.recordRejectedSelection({
          scope: input.scope,
          requestId: input.requestId,
          dispatchId: currentDispatch.dispatchId,
          failureCode: USAGE_UNKNOWN_AFTER_DISPATCH,
          structuredSelection: null,
          now: currentDispatch.selectionTerminalAtUtc
            ? new Date(currentDispatch.selectionTerminalAtUtc)
            : now,
        });
        const late = this.recordLateReceiptIfRequired({
          scope: input.scope,
          requestId: input.requestId,
          attemptId: input.attemptId,
          dispatchFence: input.dispatchFence,
          usage,
          providerResponseId: input.providerResponseId,
          now,
        });
        if (!this.isIssuanceAuthorized(input.scope, request.review_kind)) {
          this.failPendingRequest(
            input.scope,
            input.requestId,
            ISSUANCE_AUTHORIZATION_REVOKED,
            late.dispatch.updatedAtUtc,
          );
          return null;
        }
        return this.issueDeterministicDefault({
          scope: input.scope,
          requestId: input.requestId,
          reason: "usage_unknown_after_dispatch",
          now: new Date(late.dispatch.updatedAtUtc),
        });
      }
      const snapshot = this.snapshots.read(input.scope, input.requestId);
      const resolved = resolveCoachAiReviewPlanSelection({
        response: input.selection,
        frozenPackage: restoreCoachAiReviewFrozenProviderPackage(snapshot.artifact),
      });
      const attempt = this.database.prepare<[
        string, string, string, string, string
      ], Readonly<{ model_id: string; provider_key: string; state: string }>>(
        `SELECT model_id, provider_key, state
FROM coach_ai_review_generation_attempts_v2
WHERE coach_ai_review_generation_attempt_id = ?
  AND coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?
  AND generation_contract_version = 'insight_selection_v3'`,
      ).get(
        input.attemptId,
        input.requestId,
        input.scope.userId,
        input.scope.workspaceId,
        activeAccountId(input.scope),
      );
      if (!attempt || attempt.state !== "pending" ||
          attempt.provider_key !== "openai_direct" ||
          attempt.model_id !== snapshot.modelId ||
          input.dispatchFence.attemptId !== input.attemptId ||
          input.dispatchFence.requestId !== input.requestId) {
        this.integrity("attempt");
      }
      const timestamp = createCanonicalUtcTimestamp(now);
      const receipt = this.insertReceipt(
        input.scope,
        input.attemptId,
        attempt.model_id,
        usage,
        timestamp,
      );
      const issuanceAuthorized = this.isIssuanceAuthorized(
        input.scope,
        request.review_kind,
      );
      const settledDispatch = this.dispatches.settleWithRecordedReceipt(
        input.scope,
        input.dispatchFence,
        input.providerResponseId,
        issuanceAuthorized ? null : ISSUANCE_AUTHORIZATION_REVOKED,
        now,
      );
      const issuanceTimestamp = settledDispatch.selectionTerminalAtUtc;
      if (!issuanceTimestamp) this.integrity("dispatchSettlementTimestamp");
      if (!issuanceAuthorized) {
        this.failAttemptAndReservation(
          input.scope,
          input.requestId,
          input.attemptId,
          ISSUANCE_AUTHORIZATION_REVOKED,
          issuanceTimestamp,
        );
        this.recordRejectedSelection({
          scope: input.scope,
          requestId: input.requestId,
          dispatchId: input.dispatchFence.dispatchId,
          failureCode: ISSUANCE_AUTHORIZATION_REVOKED,
          structuredSelection: resolved.selection,
          now: new Date(issuanceTimestamp),
        });
        this.failPendingRequest(
          input.scope,
          input.requestId,
          ISSUANCE_AUTHORIZATION_REVOKED,
          issuanceTimestamp,
        );
        if (receipt.overrun) this.blockProviderCalls(issuanceTimestamp);
        return null;
      }
      return this.insertAcceptedReview({
        scope: input.scope,
        requestId: input.requestId,
        request,
        reviewPlanRef: resolved.selectedPlan.reviewPlanRef,
        providerChoiceKey: resolved.selection.choiceKey,
        structuredSelection: resolved.selection,
        generationSource: "provider_selected",
        selectionReasonCode: "provider_selection_accepted",
        attemptId: input.attemptId,
        dispatchFence: input.dispatchFence,
        modelId: attempt.model_id,
        timestamp: issuanceTimestamp,
        receiptOverrun: receipt.overrun,
      });
    });
    if (!issued) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return issued;
  }

  rejectProviderSelectionWithReceiptAndIssueDefault(input: Readonly<{
    scope: WorkspaceAccessScope;
    requestId: string;
    attemptId: string;
    dispatchFence: CoachAiReviewInsightDispatchFence;
    failureCode: string;
    structuredSelection: CoachAiReviewPlanSelectionResponse | null;
    usage: CoachAiGenerationUsage;
    providerResponseId: string | null;
    now?: Date;
  }>): CoachAiIssuedReviewRecordV3 {
    const now = input.now ?? new Date();
    const timestamp = createCanonicalUtcTimestamp(now);
    assertCanonicalUuidV4(input.requestId, "requestId");
    assertCanonicalUuidV4(input.attemptId, "attemptId");
    this.assertFailureCode(input.failureCode);
    const usage = normalizedUsage(input.usage);
    const issued = this.transaction<CoachAiIssuedReviewRecordV3 | null>(() => {
      const request = this.request(input.scope, input.requestId);
      if (request.state === "issued" && request.issued_review_id) {
        if (input.providerResponseId !== null) {
          this.recordLateReceiptIfRequired({
            scope: input.scope,
            requestId: input.requestId,
            attemptId: input.attemptId,
            dispatchFence: input.dispatchFence,
            usage,
            providerResponseId: input.providerResponseId,
            now,
          });
        }
        return this.read(input.scope, request.issued_review_id);
      }
      if (request.state !== "pending") this.integrity("rejectedRequestState");
      const currentDispatch = this.dispatches.read(
        input.scope,
        input.dispatchFence.dispatchId,
      );
      if (currentDispatch.failureCode === USAGE_UNKNOWN_AFTER_DISPATCH &&
          (currentDispatch.usageSettlementState === "unknown_after_dispatch" ||
            currentDispatch.usageSettlementState === "reconciled_receipt")) {
        this.recordRejectedSelection({
          scope: input.scope,
          requestId: input.requestId,
          dispatchId: currentDispatch.dispatchId,
          failureCode: USAGE_UNKNOWN_AFTER_DISPATCH,
          structuredSelection: null,
          now: currentDispatch.selectionTerminalAtUtc
            ? new Date(currentDispatch.selectionTerminalAtUtc)
            : now,
        });
        const late = input.providerResponseId === null
          ? null
          : this.recordLateReceiptIfRequired({
            scope: input.scope,
            requestId: input.requestId,
            attemptId: input.attemptId,
            dispatchFence: input.dispatchFence,
            usage,
            providerResponseId: input.providerResponseId,
            now,
          });
        const fallbackAt = late?.dispatch.updatedAtUtc ??
          currentDispatch.selectionTerminalAtUtc ?? timestamp;
        if (!this.isIssuanceAuthorized(input.scope, request.review_kind)) {
          this.failPendingRequest(
            input.scope,
            input.requestId,
            ISSUANCE_AUTHORIZATION_REVOKED,
            fallbackAt,
          );
          return null;
        }
        return this.issueDeterministicDefault({
          scope: input.scope,
          requestId: input.requestId,
          reason: "usage_unknown_after_dispatch",
          now: new Date(fallbackAt),
        });
      }
      const issuanceAuthorized = this.isIssuanceAuthorized(
        input.scope,
        request.review_kind,
      );
      const attempt = this.pendingAttempt(
        input.scope,
        input.requestId,
        input.attemptId,
      );
      const receipt = this.insertReceipt(
        input.scope,
        input.attemptId,
        attempt.model_id,
        usage,
        timestamp,
      );
      const settled = this.dispatches.settleWithRecordedReceipt(
        input.scope,
        input.dispatchFence,
        input.providerResponseId,
        input.failureCode,
        now,
      );
      const settledAt = settled.selectionTerminalAtUtc;
      if (!settledAt) this.integrity("rejectedDispatchSettlement");
      const fallbackNow = new Date(settledAt);
      this.failAttemptAndReservation(
        input.scope,
        input.requestId,
        input.attemptId,
        input.failureCode,
        settledAt,
      );
      this.recordRejectedSelection({
        scope: input.scope,
        requestId: input.requestId,
        dispatchId: input.dispatchFence.dispatchId,
        failureCode: input.failureCode,
        structuredSelection: input.structuredSelection,
        now: fallbackNow,
      });
      if (receipt.overrun) this.blockProviderCalls(settledAt);
      if (!issuanceAuthorized) {
        this.failPendingRequest(
          input.scope,
          input.requestId,
          ISSUANCE_AUTHORIZATION_REVOKED,
          settledAt,
        );
        return null;
      }
      return this.issueDeterministicDefault({
        scope: input.scope,
        requestId: input.requestId,
        reason: "provider_selection_unavailable",
        now: fallbackNow,
      });
    });
    if (!issued) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return issued;
  }

  rejectProviderSelectionWithUnknownUsageAndIssueDefault(input: Readonly<{
    scope: WorkspaceAccessScope;
    requestId: string;
    attemptId: string;
    dispatchFence: CoachAiReviewInsightDispatchFence;
    failureCode: string;
    structuredSelection: CoachAiReviewPlanSelectionResponse | null;
    providerResponseId: string | null;
    now?: Date;
  }>): CoachAiIssuedReviewRecordV3 {
    const now = input.now ?? new Date();
    assertCanonicalUuidV4(input.requestId, "requestId");
    assertCanonicalUuidV4(input.attemptId, "attemptId");
    this.assertFailureCode(input.failureCode);
    const issued = this.transaction<CoachAiIssuedReviewRecordV3 | null>(() => {
      const request = this.request(input.scope, input.requestId);
      if (request.state === "issued" && request.issued_review_id) {
        return this.read(input.scope, request.issued_review_id);
      }
      if (request.state !== "pending") this.integrity("rejectedRequestState");
      const issuanceAuthorized = this.isIssuanceAuthorized(
        input.scope,
        request.review_kind,
      );
      this.pendingAttempt(input.scope, input.requestId, input.attemptId);
      const terminal = this.dispatches.markSelectionTerminalWithUnknownUsage(
        input.scope,
        input.dispatchFence,
        input.failureCode,
        input.providerResponseId,
        now,
      );
      const terminalAt = terminal.selectionTerminalAtUtc;
      if (!terminalAt) this.integrity("unknownUsageTerminalTimestamp");
      const fallbackNow = new Date(terminalAt);
      this.recordRejectedSelection({
        scope: input.scope,
        requestId: input.requestId,
        dispatchId: input.dispatchFence.dispatchId,
        failureCode: input.failureCode,
        structuredSelection: input.structuredSelection,
        now: fallbackNow,
      });
      if (!issuanceAuthorized) {
        this.failPendingRequest(
          input.scope,
          input.requestId,
          ISSUANCE_AUTHORIZATION_REVOKED,
          terminalAt,
        );
        return null;
      }
      return this.issueDeterministicDefault({
        scope: input.scope,
        requestId: input.requestId,
        reason: "usage_unknown_after_dispatch",
        now: fallbackNow,
      });
    });
    if (!issued) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return issued;
  }

  recordLateProviderReceipt(input: Readonly<{
    scope: WorkspaceAccessScope;
    requestId: string;
    attemptId: string;
    dispatchFence: CoachAiReviewInsightDispatchFence;
    usage: CoachAiGenerationUsage;
    providerResponseId: string;
    now?: Date;
  }>): Readonly<{
    dispatch: CoachAiReviewInsightDispatchRecord;
    reservationOverrun: boolean;
  }> {
    const now = input.now ?? new Date();
    assertCanonicalUuidV4(input.requestId, "requestId");
    assertCanonicalUuidV4(input.attemptId, "attemptId");
    const usage = normalizedUsage(input.usage);
    return this.transaction(() => this.recordLateReceiptIfRequired({
      ...input,
      usage,
      now,
    }));
  }

  issueDeterministicDefault(input: Readonly<{
    scope: WorkspaceAccessScope;
    requestId: string;
    reason: CoachAiReviewDeterministicReason;
    now?: Date;
  }>): CoachAiIssuedReviewRecordV3 {
    const now = input.now ?? new Date();
    assertCanonicalUuidV4(input.requestId, "requestId");
    return this.transaction(() => {
      const request = this.request(input.scope, input.requestId);
      if (request.state === "issued" && request.issued_review_id) {
        return this.read(input.scope, request.issued_review_id);
      }
      this.assertIssuanceAuthorized(input.scope, request.review_kind);
      if (request.state !== "pending") this.integrity("requestState");
      const snapshot = this.snapshots.read(input.scope, input.requestId);
      const defaultPlan = snapshot.artifact.catalog.completePlans[0];
      if (!defaultPlan || defaultPlan.reviewPlanRef !==
          snapshot.deterministicDefaultReviewPlanRef) {
        this.integrity("defaultPlan");
      }
      const active = this.database.prepare<[string, string], Readonly<{
        count: number;
      }>>(`SELECT COUNT(*) AS count FROM (
  SELECT 1 FROM coach_ai_review_generation_attempts_v2
  WHERE coach_ai_review_period_request_id = ? AND state = 'pending'
  UNION ALL
  SELECT 1 FROM coach_ai_review_insight_provider_dispatches
  WHERE coach_ai_review_period_request_id = ?
    AND lease_state IN ('leased', 'transport_authorized')
)`).get(input.requestId, input.requestId)?.count ?? 0;
      if (active !== 0) this.integrity("fallbackSelectionLease");
      this.assertDeterministicReason(
        input.requestId,
        input.reason,
        snapshot.artifact.catalog.completePlans.length,
      );
      if (input.reason === "usage_unknown_after_dispatch") {
        this.ensureUnknownUsageSelectionAudit(
          input.scope,
          input.requestId,
          now,
        );
      }
      return this.insertAcceptedReview({
        scope: input.scope,
        requestId: input.requestId,
        request,
        reviewPlanRef: defaultPlan.reviewPlanRef,
        providerChoiceKey: null,
        structuredSelection: null,
        generationSource: "deterministic_default",
        selectionReasonCode: input.reason,
        attemptId: null,
        dispatchFence: null,
        modelId: null,
        timestamp: createCanonicalUtcTimestamp(now),
        receiptOverrun: false,
      });
    });
  }

  recordRejectedSelection(input: Readonly<{
    scope: WorkspaceAccessScope;
    requestId: string;
    dispatchId: string;
    failureCode: string;
    structuredSelection: CoachAiReviewPlanSelectionResponse | null;
    now?: Date;
  }>): string {
    assertCanonicalUuidV4(input.requestId, "requestId");
    assertCanonicalUuidV4(input.dispatchId, "dispatchId");
    this.assertFailureCode(input.failureCode);
    return this.transaction(() => {
      const dispatch = this.dispatches.read(input.scope, input.dispatchId);
      if (dispatch.requestId !== input.requestId) {
        this.integrity("rejectedDispatchRequest");
      }
      const existing = this.database.prepare<[string], Readonly<{
        coach_ai_review_insight_selection_audit_id: string;
      }>>(`SELECT coach_ai_review_insight_selection_audit_id
FROM coach_ai_review_insight_selection_audits
WHERE coach_ai_review_generation_attempt_id = ?`).get(dispatch.attemptId);
      if (existing) return existing.coach_ai_review_insight_selection_audit_id;
      const request = this.request(input.scope, input.requestId);
      if (request.state !== "pending") this.integrity("rejectedRequestState");
      const snapshot = this.snapshots.read(input.scope, input.requestId);
      if (dispatch.requestId !== input.requestId ||
          !["selection_terminal", "settled"].includes(dispatch.leaseState)) {
        this.integrity("rejectedDispatch");
      }
      const providerPackage = JSON.parse(
        snapshot.artifact.providerPackage.canonicalProviderPackage,
      ) as Readonly<{ packageKey: string }>;
      const structuredJson = input.structuredSelection
        ? canonicalCoachAiReviewInsightBytes(input.structuredSelection).toString("utf8")
        : null;
      const auditId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_review_insight_selection_audits (
  coach_ai_review_insight_selection_audit_id,
  coach_ai_review_period_request_id, coach_ai_review_generation_attempt_id,
  coach_ai_review_insight_provider_dispatch_id, coach_ai_issued_review_id,
  user_id, workspace_id, account_id, selection_source,
  selection_reason_code, validation_state, failure_code,
  provider_package_key, provider_choice_key, review_plan_ref,
  structured_selection_json, structured_selection_digest_sha256,
  focus_tracking_json, focus_tracking_digest_sha256,
  source_digest_sha256, shortlist_digest_sha256, catalog_digest_sha256,
  rendered_output_digest_sha256, recovery_epoch, lease_generation,
  recorded_at_utc
) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'provider_selected',
  'provider_selection_rejected', 'rejected', ?, ?, ?, NULL, ?, ?, NULL, NULL,
  ?, ?, ?, NULL, ?, ?, ?)`).run(
        auditId,
        input.requestId,
        dispatch.attemptId,
        dispatch.dispatchId,
        input.scope.userId,
        input.scope.workspaceId,
        activeAccountId(input.scope),
        input.failureCode,
        providerPackage.packageKey,
        input.structuredSelection?.choiceKey ?? null,
        structuredJson,
        input.structuredSelection
          ? digestCanonicalCoachAiReviewInsight(input.structuredSelection).digestSha256
          : null,
        snapshot.artifact.digests.sourceDigestSha256,
        snapshot.artifact.digests.shortlistDigestSha256,
        snapshot.artifact.digests.catalogDigestSha256,
        dispatch.recoveryEpoch,
        dispatch.leaseGeneration,
        createCanonicalUtcTimestamp(input.now ?? new Date()),
      );
      return auditId;
    });
  }

  read(
    scope: WorkspaceAccessScope,
    issuedReviewId: string,
  ): CoachAiIssuedReviewRecordV3 {
    assertCanonicalUuidV4(issuedReviewId, "issuedReviewId");
    const row = this.database.prepare<[
      string, string, string, string
    ], Readonly<{
      coach_ai_issued_review_id: string;
      coach_ai_review_period_request_id: string;
      review_kind: "weekly" | "two_week" | "monthly";
      period_start_date: string;
      period_end_date: string;
      generation_source: "provider_selected" | "deterministic_default";
      model_id: string | null;
      review_plan_ref: string;
      output_json: string;
      output_digest_sha256: string;
      issued_at_utc: string;
    }>>(`SELECT review.coach_ai_issued_review_id,
  review.coach_ai_review_period_request_id, request.review_kind,
  request.period_start_date, request.period_end_date,
  review.generation_source, review.model_id, review.review_plan_ref,
  review.output_json, review.output_digest_sha256, review.issued_at_utc
FROM coach_ai_issued_reviews_v3 review
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id =
    review.coach_ai_review_period_request_id
WHERE review.coach_ai_issued_review_id = ? AND review.user_id = ?
  AND review.workspace_id = ? AND review.account_id = ?`).get(
      issuedReviewId,
      scope.userId,
      scope.workspaceId,
      activeAccountId(scope),
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const output = parseCoachAiReviewOutputV3(row.review_kind, row.output_json);
    if (digestCanonicalCoachAiReviewInsight(output).digestSha256 !==
        row.output_digest_sha256) this.integrity("outputDigest");
    return Object.freeze({
      issuedReviewId: row.coach_ai_issued_review_id,
      requestId: row.coach_ai_review_period_request_id,
      reviewKind: row.review_kind,
      periodStartDate: row.period_start_date,
      periodEndDate: row.period_end_date,
      generationSource: row.generation_source,
      modelId: row.model_id,
      reviewPlanRef: row.review_plan_ref,
      output,
      issuedAtUtc: row.issued_at_utc,
    });
  }

  private recordLateReceiptIfRequired(input: Readonly<{
    scope: WorkspaceAccessScope;
    requestId: string;
    attemptId: string;
    dispatchFence: CoachAiReviewInsightDispatchFence;
    usage: CompleteUsage;
    providerResponseId: string;
    now: Date;
  }>): Readonly<{
    dispatch: CoachAiReviewInsightDispatchRecord;
    reservationOverrun: boolean;
  }> {
    this.request(input.scope, input.requestId);
    const snapshot = this.snapshots.read(input.scope, input.requestId);
    const dispatch = this.dispatches.read(
      input.scope,
      input.dispatchFence.dispatchId,
    );
    if (dispatch.requestId !== input.requestId ||
        dispatch.attemptId !== input.attemptId ||
        input.dispatchFence.requestId !== input.requestId ||
        input.dispatchFence.attemptId !== input.attemptId) {
      this.integrity("lateReceiptDispatch");
    }
    if (dispatch.leaseState === "settled" &&
        ["receipt_recorded", "reconciled_receipt"].includes(
          dispatch.usageSettlementState,
        )) {
      if (dispatch.providerResponseId !== input.providerResponseId) {
        this.integrity("lateReceiptProviderResponse");
      }
      const receipt = this.insertReceipt(
        input.scope,
        input.attemptId,
        snapshot.modelId,
        input.usage,
        createCanonicalUtcTimestamp(input.now),
      );
      return Object.freeze({
        dispatch,
        reservationOverrun: receipt.overrun,
      });
    }
    if (dispatch.leaseState !== "selection_terminal" ||
        dispatch.usageSettlementState !== "unknown_after_dispatch") {
      this.integrity("lateReceiptState");
    }
    const timestamp = createCanonicalUtcTimestamp(input.now);
    const receipt = this.insertReceipt(
      input.scope,
      input.attemptId,
      snapshot.modelId,
      input.usage,
      timestamp,
    );
    const reconciled = this.dispatches.reconcileLateReceipt(
      input.scope,
      input.dispatchFence,
      input.providerResponseId,
      input.now,
    );
    const reservation = this.database.prepare(`UPDATE
  coach_ai_review_generation_control_reservations_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND state = 'started'`).run(
      reconciled.failureCode ?? "TRADERLINK_COACH_USAGE_RECONCILED_AFTER_DISPATCH",
      reconciled.updatedAtUtc,
      input.attemptId,
      input.scope.userId,
      input.scope.workspaceId,
      activeAccountId(input.scope),
    );
    if (reservation.changes !== 1) this.integrity("lateReceiptReservation");
    if (receipt.overrun) this.blockProviderCalls(reconciled.updatedAtUtc);
    return Object.freeze({
      dispatch: reconciled,
      reservationOverrun: receipt.overrun,
    });
  }

  private pendingAttempt(
    scope: WorkspaceAccessScope,
    requestId: string,
    attemptId: string,
  ): Readonly<{ model_id: string; provider_key: string; state: string }> {
    const attempt = this.database.prepare<[
      string, string, string, string, string
    ], Readonly<{ model_id: string; provider_key: string; state: string }>>(
      `SELECT model_id, provider_key, state
FROM coach_ai_review_generation_attempts_v2
WHERE coach_ai_review_generation_attempt_id = ?
  AND coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?
  AND generation_contract_version = 'insight_selection_v3'`,
    ).get(
      attemptId,
      requestId,
      scope.userId,
      scope.workspaceId,
      activeAccountId(scope),
    );
    if (!attempt || attempt.state !== "pending" ||
        attempt.provider_key !== "openai_direct") {
      this.integrity("attempt");
    }
    return attempt;
  }

  private failAttemptAndReservation(
    scope: WorkspaceAccessScope,
    requestId: string,
    attemptId: string,
    failureCode: string,
    timestamp: string,
  ): void {
    const attempt = this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?
  AND coach_ai_review_period_request_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND generation_contract_version = 'insight_selection_v3'
  AND state = 'pending'`).run(
      failureCode,
      timestamp,
      attemptId,
      requestId,
      scope.userId,
      scope.workspaceId,
      activeAccountId(scope),
    );
    const reservation = this.database.prepare(`UPDATE
  coach_ai_review_generation_control_reservations_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND state = 'started'`).run(
      failureCode,
      timestamp,
      attemptId,
      scope.userId,
      scope.workspaceId,
      activeAccountId(scope),
    );
    if (attempt.changes !== 1 || reservation.changes !== 1) {
      this.integrity("attemptFailureFinalization");
    }
  }

  private failPendingRequest(
    scope: WorkspaceAccessScope,
    requestId: string,
    failureCode: string,
    timestamp: string,
  ): void {
    const request = this.database.prepare(`UPDATE coach_ai_review_period_requests_v2
SET state = 'failed', terminal_failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'
  AND issued_review_id IS NULL
  AND generation_contract_version = 'insight_selection_v3'`).run(
      failureCode,
      timestamp,
      requestId,
      scope.userId,
      scope.workspaceId,
      activeAccountId(scope),
    );
    if (request.changes !== 1) this.integrity("requestFailureFinalization");
  }

  private ensureUnknownUsageSelectionAudit(
    scope: WorkspaceAccessScope,
    requestId: string,
    now: Date,
  ): void {
    const dispatch = this.database.prepare<[string, string, string, string], Readonly<{
      coach_ai_review_insight_provider_dispatch_id: string;
      failure_code: string;
    }>>(`SELECT coach_ai_review_insight_provider_dispatch_id, failure_code
FROM coach_ai_review_insight_provider_dispatches
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?
  AND usage_settlement_state IN (
    'unknown_after_dispatch', 'reconciled_receipt', 'reconciled_no_usage'
  )`).get(
      requestId,
      scope.userId,
      scope.workspaceId,
      activeAccountId(scope),
    );
    if (!dispatch) this.integrity("unknownUsageDispatch");
    this.recordRejectedSelection({
      scope,
      requestId,
      dispatchId: dispatch.coach_ai_review_insight_provider_dispatch_id,
      failureCode: dispatch.failure_code,
      structuredSelection: null,
      now,
    });
  }

  private insertAcceptedReview(input: Readonly<{
    scope: WorkspaceAccessScope;
    requestId: string;
    request: RequestRow;
    reviewPlanRef: string;
    providerChoiceKey: CoachAiReviewProviderChoiceKey | null;
    structuredSelection: CoachAiReviewPlanSelectionResponse | null;
    generationSource: "provider_selected" | "deterministic_default";
    selectionReasonCode: "provider_selection_accepted" | CoachAiReviewDeterministicReason;
    attemptId: string | null;
    dispatchFence: CoachAiReviewInsightDispatchFence | null;
    modelId: string | null;
    timestamp: string;
    receiptOverrun: boolean;
  }>): CoachAiIssuedReviewRecordV3 {
    const accountId = activeAccountId(input.scope);
    const snapshot = this.snapshots.read(input.scope, input.requestId);
    const plan = snapshot.artifact.catalog.completePlans.find((candidate) =>
      candidate.reviewPlanRef === input.reviewPlanRef);
    if (!plan) this.integrity("selectedPlan");
    const output = buildCoachAiReviewOutputV3(input.request.review_kind, plan.output);
    const outputJson = canonicalCoachAiReviewInsightBytes(output).toString("utf8");
    const outputDigest = digestCanonicalCoachAiReviewInsight(output).digestSha256;
    const issuedReviewId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO coach_ai_issued_reviews_v3 (
  coach_ai_issued_review_id, coach_ai_review_period_request_id,
  user_id, workspace_id, account_id, generation_source, provider_key,
  model_id, output_contract_version, prompt_renderer_version,
  review_plan_ref, output_digest_sha256, output_json, issued_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      issuedReviewId,
      input.requestId,
      input.scope.userId,
      input.scope.workspaceId,
      accountId,
      input.generationSource,
      input.generationSource === "provider_selected" ? "openai_direct" : null,
      input.modelId,
      output.contractVersion,
      output.promptRendererVersion,
      input.reviewPlanRef,
      outputDigest,
      outputJson,
      input.timestamp,
    );
    const structuredJson = input.structuredSelection
      ? canonicalCoachAiReviewInsightBytes(input.structuredSelection).toString("utf8")
      : null;
    const focusTracking = this.focusTracking(snapshot.artifact, plan.focusQuestionRefs);
    const focusJson = canonicalCoachAiReviewInsightBytes(focusTracking).toString("utf8");
    const followThroughAssessment = this.followThroughAssessment(snapshot.artifact, plan);
    const followThroughJson = followThroughAssessment === null
      ? null
      : canonicalCoachAiReviewInsightBytes(followThroughAssessment).toString("utf8");
    this.database.prepare(`INSERT INTO coach_ai_review_insight_selection_audits (
  coach_ai_review_insight_selection_audit_id,
  coach_ai_review_period_request_id, coach_ai_review_generation_attempt_id,
  coach_ai_review_insight_provider_dispatch_id, coach_ai_issued_review_id,
  user_id, workspace_id, account_id, selection_source,
  selection_reason_code, validation_state, failure_code,
  provider_package_key, provider_choice_key, review_plan_ref,
  structured_selection_json, structured_selection_digest_sha256,
  focus_tracking_json, focus_tracking_digest_sha256,
  follow_through_assessment_json, follow_through_assessment_digest_sha256,
  source_digest_sha256, shortlist_digest_sha256, catalog_digest_sha256,
  rendered_output_digest_sha256, recovery_epoch, lease_generation,
  recorded_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accepted', NULL, ?, ?, ?, ?, ?,
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      createCanonicalUuidV4(),
      input.requestId,
      input.attemptId,
      input.dispatchFence?.dispatchId ?? null,
      issuedReviewId,
      input.scope.userId,
      input.scope.workspaceId,
      accountId,
      input.generationSource,
      input.selectionReasonCode,
      input.structuredSelection?.packageKey ?? null,
      input.providerChoiceKey,
      input.reviewPlanRef,
      structuredJson,
      input.structuredSelection
        ? digestCanonicalCoachAiReviewInsight(input.structuredSelection).digestSha256
        : null,
      focusJson,
      digestCanonicalCoachAiReviewInsight(focusTracking).digestSha256,
      followThroughJson,
      followThroughAssessment === null
        ? null
        : digestCanonicalCoachAiReviewInsight(followThroughAssessment).digestSha256,
      snapshot.artifact.digests.sourceDigestSha256,
      snapshot.artifact.digests.shortlistDigestSha256,
      snapshot.artifact.digests.catalogDigestSha256,
      outputDigest,
      input.dispatchFence?.recoveryEpoch ?? null,
      input.dispatchFence?.leaseGeneration ?? null,
      input.timestamp,
    );
    if (input.attemptId) {
      const attempt = this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'issued', failure_code = NULL, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?
  AND coach_ai_review_period_request_id = ?
  AND generation_contract_version = 'insight_selection_v3'
  AND state = 'pending'`).run(
        input.timestamp,
        input.attemptId,
        input.requestId,
      );
      const reservation = this.database.prepare(`UPDATE
  coach_ai_review_generation_control_reservations_v2
SET state = 'completed', failure_code = NULL, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND state = 'started'`).run(
        input.timestamp,
        input.attemptId,
      );
      if (attempt.changes !== 1 || reservation.changes !== 1) {
        this.integrity("attemptFinalization");
      }
    }
    const request = this.database.prepare(`UPDATE coach_ai_review_period_requests_v2
SET state = 'issued', terminal_failure_code = NULL, issued_review_id = ?,
  finalized_at_utc = ?
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'
  AND generation_contract_version = 'insight_selection_v3'`).run(
      issuedReviewId,
      input.timestamp,
      input.requestId,
      input.scope.userId,
      input.scope.workspaceId,
      accountId,
    );
    if (request.changes !== 1) this.integrity("requestFinalization");
    if (input.receiptOverrun) this.blockProviderCalls(input.timestamp);
    const reviewLabel = input.request.review_kind === "two_week"
      ? "two-week"
      : input.request.review_kind;
    new PlatformNotificationRepository(this.database).create({
      category: "ai_review",
      destinationPath: "/ai-reviews",
      journalAccountId: accountId,
      kind: "ai_review_ready",
      occurredAtUtc: input.timestamp,
      scope: input.scope,
      sourceEventKey: `ai_review_ready_${issuedReviewId}`,
      summary: `Your ${reviewLabel} AI Review is ready to read.`,
      title: "Your AI Review is ready",
    });
    return this.read(input.scope, issuedReviewId);
  }

  private insertReceipt(
    scope: WorkspaceAccessScope,
    attemptId: string,
    modelId: string,
    usage: CompleteUsage,
    timestamp: string,
  ): Readonly<{ overrun: boolean }> {
    const reservation = this.database.prepare<[
      string, string, string, string
    ], ReservationRow>(`SELECT provider_key, model_id,
  input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, reserved_max_input_tokens,
  reserved_max_output_tokens, reserved_max_total_tokens,
  reserved_maximum_cost_usd, state
FROM coach_ai_review_generation_control_reservations_v2
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`).get(
      attemptId,
      scope.userId,
      scope.workspaceId,
      activeAccountId(scope),
    );
    if (!reservation || reservation.provider_key !== "openai_direct" ||
        reservation.model_id !== modelId) {
      this.integrity("reservation");
    }
    const estimatedCost = calculateCoachAiReviewEstimatedCost(usage, {
      providerKey: "openai_direct",
      modelId,
      inputCostUsdPerMillionTokens: reservation.input_cost_usd_per_million_tokens,
      cachedInputCostUsdPerMillionTokens:
        reservation.cached_input_cost_usd_per_million_tokens,
      cacheWriteInputCostUsdPerMillionTokens:
        reservation.cache_write_input_cost_usd_per_million_tokens,
      outputCostUsdPerMillionTokens: reservation.output_cost_usd_per_million_tokens,
      updatedAtUtc: timestamp,
    });
    if (estimatedCost === null) this.integrity("receiptCost");
    const inputOverrun = Math.max(0,
      usage.inputTokens - reservation.reserved_max_input_tokens);
    const outputOverrun = Math.max(0,
      usage.outputTokens - reservation.reserved_max_output_tokens);
    const totalOverrun = Math.max(0,
      usage.totalTokens - reservation.reserved_max_total_tokens);
    const costOverrun = ExactDecimal.max(0, new ExactDecimal(estimatedCost)
      .minus(reservation.reserved_maximum_cost_usd));
    const overrun = inputOverrun > 0 || outputOverrun > 0 ||
      totalOverrun > 0 || costOverrun.gt(0);
    const existing = this.database.prepare<[string], ReceiptRow>(`SELECT
  input_tokens, cached_input_tokens, cache_write_input_tokens,
  output_tokens, total_tokens, estimated_cost_usd, reservation_overrun
FROM coach_ai_review_generation_attempt_receipts_v2
WHERE coach_ai_review_generation_attempt_id = ?`).get(attemptId);
    if (existing) {
      if (existing.input_tokens !== usage.inputTokens ||
          existing.cached_input_tokens !== usage.cachedInputTokens ||
          existing.cache_write_input_tokens !== usage.cacheWriteInputTokens ||
          existing.output_tokens !== usage.outputTokens ||
          existing.total_tokens !== usage.totalTokens ||
          existing.estimated_cost_usd !== estimatedCost ||
          existing.reservation_overrun !== (overrun ? 1 : 0)) {
        this.integrity("receiptReplay");
      }
      return Object.freeze({ overrun });
    }
    if (reservation.state !== "started") this.integrity("reservationState");
    this.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts_v2 (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc,
  reservation_overrun, input_token_overrun, output_token_overrun,
  total_token_overrun, cost_overrun_usd
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      createCanonicalUuidV4(),
      attemptId,
      usage.inputTokens,
      usage.cachedInputTokens,
      usage.cacheWriteInputTokens,
      usage.outputTokens,
      usage.totalTokens,
      reservation.input_cost_usd_per_million_tokens,
      reservation.cached_input_cost_usd_per_million_tokens,
      reservation.cache_write_input_cost_usd_per_million_tokens,
      reservation.output_cost_usd_per_million_tokens,
      estimatedCost,
      timestamp,
      overrun ? 1 : 0,
      inputOverrun,
      outputOverrun,
      totalOverrun,
      overrun ? fixedDecimal(costOverrun) : null,
    );
    return Object.freeze({ overrun });
  }

  private focusTracking(
    artifact: ReturnType<CoachAiReviewInsightPersistenceRepository["read"]>["artifact"],
    focusRefs: readonly string[],
  ): readonly Readonly<{
    ordinal: number;
    focusTargetRef: string;
    focusQuestionRef: string;
    findingRef: string;
    actionTargetKey: string;
    trackingIntent: "reduction" | "consistency" | "examination" | "strength_repetition";
    trackingMetricDirection: "lower_is_better" | "higher_is_better" | "non_directional";
    renderedQuestion: string;
  }>[] {
    return Object.freeze(focusRefs.map((focusRef, index) => {
      const focus = artifact.catalog.focusQuestions.find((candidate) =>
        candidate.focusQuestionRef === focusRef);
      if (!focus) this.integrity("focusTracking");
      return Object.freeze({
        ordinal: index + 1,
        focusTargetRef: focus.focusTargetRef,
        focusQuestionRef: focus.focusQuestionRef,
        findingRef: focus.findingRef,
        actionTargetKey: focus.actionTargetKey,
        trackingIntent: focus.trackingIntent,
        trackingMetricDirection: focus.trackingMetricDirection,
        renderedQuestion: focus.renderedQuestion,
      });
    }));
  }

  private followThroughAssessment(
    artifact: InsightArtifact,
    plan: InsightCompletePlan,
  ): InsightFocusAssessment | null {
    const sectionRef = plan.sectionPlanRefs.focus_follow_through;
    const section = artifact.catalog.sectionPlans.find((candidate) =>
      candidate.sectionPlanRef === sectionRef);
    if (!section) this.integrity("followThroughSection");
    if (section.findingRef === null) return null;
    const candidate = artifact.candidates.find((item) =>
      item.findingRef === section.findingRef);
    if (!candidate || candidate.family !== "focus_follow_through" ||
        candidate.focusAssessment === null) {
      this.integrity("followThroughAssessment");
    }
    return candidate.focusAssessment;
  }

  private assertDeterministicReason(
    requestId: string,
    reason: CoachAiReviewDeterministicReason,
    planCount: number,
  ): void {
    const history = this.database.prepare<[string, string, string], Readonly<{
      attempt_count: number;
      crossed_count: number;
      unknown_count: number;
    }>>(`SELECT
  (SELECT COUNT(*) FROM coach_ai_review_generation_attempts_v2
    WHERE coach_ai_review_period_request_id = ?) AS attempt_count,
  (SELECT COUNT(*) FROM coach_ai_review_insight_provider_dispatches
    WHERE coach_ai_review_period_request_id = ?
      AND transport_may_have_started_at_utc IS NOT NULL) AS crossed_count,
  (SELECT COUNT(*) FROM coach_ai_review_insight_provider_dispatches
    WHERE coach_ai_review_period_request_id = ?
      AND usage_settlement_state IN (
        'unknown_after_dispatch', 'reconciled_receipt', 'reconciled_no_usage'
      )) AS unknown_count`).get(
      requestId,
      requestId,
      requestId,
    );
    const attempts = history?.attempt_count ?? 0;
    const crossed = history?.crossed_count ?? 0;
    const unknown = history?.unknown_count ?? 0;
    const valid = reason === "single_authorized_plan"
      ? planCount === 1 && attempts === 0
      : reason === "usage_unknown_after_dispatch"
        ? unknown > 0
        : reason === "provider_selection_unavailable"
          ? crossed > 0
          : reason === "provider_reservation_refused"
            ? attempts > 0 && crossed === 0
            : true;
    if (!valid) this.integrity("deterministicReason");
  }

  private assertIssuanceAuthorized(
    scope: WorkspaceAccessScope,
    reviewKind: RequestRow["review_kind"],
  ): void {
    if (!this.isIssuanceAuthorized(scope, reviewKind)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
  }

  private isIssuanceAuthorized(
    scope: WorkspaceAccessScope,
    reviewKind: RequestRow["review_kind"],
  ): boolean {
    if (new WhopAiReviewEntitlementRepository(this.database)
      .readAccess(scope.userId).state !== "active") {
      return false;
    }
    const featureKey = reviewKind === "monthly" ? "monthly_reviews" : "weekly_reviews";
    const controls = this.database.prepare<[
      string, string, string
    ], Readonly<{ scope_kind: "platform" | "account"; enabled: number }>>(`SELECT
  scope_kind, enabled FROM coach_ai_feature_controls
WHERE feature_key = ? AND (scope_kind = 'platform'
  OR (scope_kind = 'account' AND workspace_id = ? AND account_id = ?))`).all(
      featureKey,
      scope.workspaceId,
      activeAccountId(scope),
    );
    const platform = controls.find((control) => control.scope_kind === "platform");
    const account = controls.find((control) => control.scope_kind === "account");
    const contract = this.database.prepare<[], Readonly<{
      active_generation_contract_version: string;
      minimum_reader_contract_version: string;
    }>>(`SELECT active_generation_contract_version,
  minimum_reader_contract_version FROM coach_ai_review_generation_contract_state
WHERE state_key = 'singleton'`).get();
    return platform?.enabled === 1 && account?.enabled !== 0 &&
      contract?.active_generation_contract_version === "insight_selection_v3" &&
      contract.minimum_reader_contract_version === "insight_selection_v3";
  }

  private assertProviderCallsAllowed(): void {
    const control = this.database.prepare<[], Readonly<{
      provider_calls_blocked: number;
    }>>(`SELECT provider_calls_blocked FROM coach_ai_review_budget_controls
WHERE control_key = 'ai_reviews'`).get();
    if (control?.provider_calls_blocked !== 0) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
  }

  private assertFailureCode(value: string): void {
    if (!FAILURE_CODE_PATTERN.test(value)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "failureCode",
      });
    }
  }

  private blockProviderCalls(timestamp: string): void {
    const row = this.database.prepare<[], Readonly<{ updated_at_utc: string }>>(`SELECT
  updated_at_utc FROM coach_ai_review_budget_controls
WHERE control_key = 'ai_reviews'`).get();
    if (!row) this.integrity("budgetControl");
    const at = row.updated_at_utc >= timestamp
      ? createCanonicalUtcTimestamp(new Date(new Date(row.updated_at_utc).getTime() + 1))
      : timestamp;
    this.database.prepare(`UPDATE coach_ai_review_budget_controls
SET provider_calls_blocked = 1,
  provider_calls_blocked_reason = 'TRADERLINK_COACH_RESERVATION_OVERRUN',
  provider_calls_blocked_at_utc = ?, updated_at_utc = ?
WHERE control_key = 'ai_reviews' AND provider_calls_blocked = 0`).run(at, at);
  }

  private request(scope: WorkspaceAccessScope, requestId: string): RequestRow {
    const row = this.database.prepare<[
      string, string, string, string
    ], RequestRow>(`SELECT review_kind, period_start_date, period_end_date,
  state, issued_review_id
FROM coach_ai_review_period_requests_v2
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?
  AND generation_contract_version = 'insight_selection_v3'`).get(
      requestId,
      scope.userId,
      scope.workspaceId,
      activeAccountId(scope),
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return row;
  }

  private integrity(field: string): never {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      table: "coach_ai_issued_reviews_v3",
      field,
    });
  }
}
