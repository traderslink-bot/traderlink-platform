import { Buffer } from "node:buffer";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type {
  CoachAiFeatureControl,
  CoachAiFeatureKey,
} from "@/src/modules/coach/contracts/ai-provider-controls-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { WhopAiReviewEntitlementRepository } from
  "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

const ExactDecimal = Decimal.clone({ precision: 80, toExpNeg: -1000, toExpPos: 1000 });
const REVIEW_FEATURES = Object.freeze({
  weekly: "weekly_reviews",
  two_week: "weekly_reviews",
  monthly: "monthly_reviews",
} as const);
const MAX_PROVIDER_INPUT_BYTES = 256_000;
const MAX_OUTPUT_TOKENS = 16_384;
const FAILURE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,95}$/u;

export type CoachAiReviewKind = keyof typeof REVIEW_FEATURES;

export type CoachAiReviewGenerationControlReservation = Readonly<{
  reservationId: string;
  attemptId: string;
  reviewKind: CoachAiReviewKind;
  featureKey: "weekly_reviews" | "monthly_reviews";
  state: "reserved" | "started" | "completed" | "failed" | "blocked";
  providerKey: "openai_direct";
  modelId: string;
  inputCostUsdPerMillionTokens: string | null;
  cachedInputCostUsdPerMillionTokens: string | null;
  cacheWriteInputCostUsdPerMillionTokens: string | null;
  outputCostUsdPerMillionTokens: string | null;
  maximumInputTokens: number;
  maximumOutputTokens: number;
  maximumTotalTokens: number;
  maximumCostUsd: string | null;
}>;

type ControlRow = Readonly<{
  feature_key: CoachAiFeatureKey;
  scope_kind: "platform" | "account";
  enabled: number;
  daily_request_cap: number | null;
  daily_token_cap: number | null;
  daily_estimated_spend_cap_usd: string | null;
  updated_at_utc: string;
}>;

type ReviewSettingsRow = Readonly<{
  provider_key: "openai_direct";
  model_id: string;
  input_cost_usd_per_million_tokens: string | null;
  cached_input_cost_usd_per_million_tokens: string | null;
  cache_write_input_cost_usd_per_million_tokens: string | null;
  output_cost_usd_per_million_tokens: string | null;
}>;

type ReservationRow = Readonly<{
  coach_ai_review_generation_control_reservation_id: string;
  coach_ai_review_generation_attempt_id: string;
  feature_key: "weekly_reviews" | "monthly_reviews";
  state: "reserved" | "started" | "completed" | "failed" | "blocked";
  provider_key: "openai_direct";
  model_id: string;
  input_cost_usd_per_million_tokens: string | null;
  cached_input_cost_usd_per_million_tokens: string | null;
  cache_write_input_cost_usd_per_million_tokens: string | null;
  output_cost_usd_per_million_tokens: string | null;
  reserved_max_input_tokens: number;
  reserved_max_output_tokens: number;
  reserved_max_total_tokens: number;
  reserved_maximum_cost_usd: string | null;
}>;

type AttemptRow = Readonly<{
  review_kind: CoachAiReviewKind;
  state: "pending" | "issued" | "failed" | "blocked";
  provider_key: "openai_direct";
  model_id: string;
}>;

type BudgetControlRow = Readonly<{
  trailing_30_day_estimated_spend_cap_usd: string | null;
  per_subscriber_paid_cycle_estimated_spend_cap_usd: string;
  emergency_trailing_30_day_estimated_spend_cap_usd: string | null;
}>;

type SubscriberBudgetWindow = Readonly<{
  startUtc: string;
  endUtc: string;
}>;

type RollingSpendRow = Readonly<{
  state: "reserved" | "started" | "completed" | "failed" | "blocked";
  reserved_maximum_cost_usd: string | null;
  estimated_cost_usd: string | null;
}>;

function easternCalendarDate(now: Date): string {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function controlRecord(row: ControlRow): CoachAiFeatureControl {
  return Object.freeze({
    featureKey: row.feature_key,
    scopeKind: row.scope_kind,
    enabled: row.enabled === 1,
    caps: Object.freeze({
      dailyRequestCap: row.daily_request_cap,
      dailyTokenCap: row.daily_token_cap,
      dailyEstimatedSpendCapUsd: row.daily_estimated_spend_cap_usd,
    }),
    updatedAtUtc: row.updated_at_utc,
  });
}

function reservationRecord(row: ReservationRow, reviewKind: CoachAiReviewKind): CoachAiReviewGenerationControlReservation {
  return Object.freeze({
    reservationId: row.coach_ai_review_generation_control_reservation_id,
    attemptId: row.coach_ai_review_generation_attempt_id,
    reviewKind,
    featureKey: row.feature_key,
    state: row.state,
    providerKey: row.provider_key,
    modelId: row.model_id,
    inputCostUsdPerMillionTokens: row.input_cost_usd_per_million_tokens,
    cachedInputCostUsdPerMillionTokens:
      row.cached_input_cost_usd_per_million_tokens,
    cacheWriteInputCostUsdPerMillionTokens:
      row.cache_write_input_cost_usd_per_million_tokens,
    outputCostUsdPerMillionTokens: row.output_cost_usd_per_million_tokens,
    maximumInputTokens: row.reserved_max_input_tokens,
    maximumOutputTokens: row.reserved_max_output_tokens,
    maximumTotalTokens: row.reserved_max_total_tokens,
    maximumCostUsd: row.reserved_maximum_cost_usd,
  });
}

function hasCompleteCaps(control: CoachAiFeatureControl): control is CoachAiFeatureControl & Readonly<{ caps: Readonly<{
  dailyRequestCap: number; dailyTokenCap: number; dailyEstimatedSpendCapUsd: string;
}> }> {
  return control.enabled && control.caps.dailyRequestCap !== null && control.caps.dailyTokenCap !== null &&
    control.caps.dailyEstimatedSpendCapUsd !== null;
}

function reservedCost(
  inputTokens: number,
  outputTokens: number,
  inputRate: string,
  cacheWriteInputRate: string,
  outputRate: string,
): string {
  const conservativeInputRate = new ExactDecimal(inputRate).gte(cacheWriteInputRate)
    ? inputRate : cacheWriteInputRate;
  return new ExactDecimal(inputTokens).times(conservativeInputRate)
    .plus(new ExactDecimal(outputTokens).times(outputRate))
    .dividedBy(1_000_000).toFixed(12).replace(/\.?0+$/u, "") || "0";
}

export class CoachAiReviewProviderControlsRepository {
  constructor(private readonly database: Database.Database) {}

  private transaction<T>(operation: () => T): T {
    return this.database.inTransaction ? operation() : this.database.transaction(operation).immediate();
  }

  private accountId(scope: WorkspaceAccessScope): string {
    if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const row = this.database.prepare<[string, string, string], Readonly<{ account_id: string }>>(`SELECT account.account_id
FROM platform_users user JOIN platform_workspaces workspace ON workspace.workspace_id = ?
JOIN platform_workspace_memberships membership ON membership.workspace_id = workspace.workspace_id AND membership.user_id = user.user_id
JOIN journal_accounts account ON account.account_id = ? AND account.workspace_id = workspace.workspace_id
WHERE user.user_id = ? AND user.status = 'active' AND workspace.status = 'active'
  AND membership.status = 'active' AND account.status = 'active'`).get(scope.workspaceId, scope.activeAccountId, scope.userId);
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return row.account_id;
  }

  private featureFor(reviewKind: unknown): "weekly_reviews" | "monthly_reviews" {
    if (reviewKind !== "weekly" && reviewKind !== "two_week" && reviewKind !== "monthly") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "reviewKind" });
    }
    return REVIEW_FEATURES[reviewKind];
  }

  private platformControl(featureKey: "weekly_reviews" | "monthly_reviews"): CoachAiFeatureControl {
    const row = this.database.prepare<[string], ControlRow>(`SELECT feature_key, scope_kind, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc
FROM coach_ai_feature_controls WHERE feature_key = ? AND scope_kind = 'platform'`).get(featureKey);
    if (!row) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_feature_controls" });
    return controlRecord(row);
  }

  private accountControlOrNull(
    scope: WorkspaceAccessScope,
    accountId: string,
    featureKey: "weekly_reviews" | "monthly_reviews",
  ): CoachAiFeatureControl | null {
    const row = this.database.prepare<[string, string, string], ControlRow>(`SELECT feature_key, scope_kind, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc
FROM coach_ai_feature_controls
WHERE feature_key = ? AND scope_kind = 'account' AND workspace_id = ? AND account_id = ?`).get(featureKey, scope.workspaceId, accountId);
    return row ? controlRecord(row) : null;
  }

  private reviewSettings(): ReviewSettingsRow {
    const row = this.database.prepare<[], ReviewSettingsRow>(`SELECT provider_key, model_id,
  input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens
FROM coach_ai_provider_settings WHERE settings_key = 'coach_reviews'`).get();
    if (!row) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_provider_settings" });
    return row;
  }

  readPlatformAvailability(reviewKind: CoachAiReviewKind): Readonly<{
    featureKey: "weekly_reviews" | "monthly_reviews";
    enabled: boolean;
  }> {
    const featureKey = this.featureFor(reviewKind);
    const control = this.platformControl(featureKey);
    const settings = this.reviewSettings();
    return Object.freeze({
      featureKey,
      enabled: hasCompleteCaps(control) && this.budgetPolicy() !== null &&
        settings.input_cost_usd_per_million_tokens !== null &&
        settings.cached_input_cost_usd_per_million_tokens !== null &&
        settings.cache_write_input_cost_usd_per_million_tokens !== null &&
        settings.output_cost_usd_per_million_tokens !== null,
    });
  }

  reserveReviewGeneration(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      attemptId: unknown;
      reviewKind: unknown;
      providerInputText: unknown;
      maxOutputTokens: unknown;
    }>,
    now = new Date(),
  ): Readonly<{ state: "reserved" | "blocked" | "idempotent"; reservation: CoachAiReviewGenerationControlReservation }> {
    return this.reserveReviewGenerationForVersion(scope, input, "v1", now);
  }

  reserveReviewGenerationV2(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      attemptId: unknown;
      reviewKind: unknown;
      providerInputText: unknown;
      maxOutputTokens: unknown;
    }>,
    now = new Date(),
  ): Readonly<{ state: "reserved" | "blocked" | "idempotent"; reservation: CoachAiReviewGenerationControlReservation }> {
    return this.reserveReviewGenerationForVersion(scope, input, "v2", now);
  }

  private reserveReviewGenerationForVersion(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      attemptId: unknown;
      reviewKind: unknown;
      providerInputText: unknown;
      maxOutputTokens: unknown;
    }>,
    version: "v1" | "v2",
    now: Date,
  ): Readonly<{ state: "reserved" | "blocked" | "idempotent"; reservation: CoachAiReviewGenerationControlReservation }> {
    const accountId = this.accountId(scope);
    const attemptId = input.attemptId;
    if (typeof attemptId !== "string") platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "attemptId" });
    assertCanonicalUuidV4(attemptId, "attemptId");
    const reviewKind = input.reviewKind;
    const featureKey = this.featureFor(reviewKind);
    const providerInputText = input.providerInputText;
    if (typeof providerInputText !== "string") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "providerInputText" });
    }
    const maximumInputTokens = Buffer.byteLength(providerInputText, "utf8");
    if (maximumInputTokens < 1 || maximumInputTokens > MAX_PROVIDER_INPUT_BYTES) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "providerInputText" });
    }
    const maxOutputTokens = input.maxOutputTokens;
    if (typeof maxOutputTokens !== "number" || !Number.isSafeInteger(maxOutputTokens) ||
        maxOutputTokens < 1 || maxOutputTokens > MAX_OUTPUT_TOKENS) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "maxOutputTokens" });
    }
    return this.transaction(() => {
      const attempt = version === "v1"
        ? this.attempt(scope, accountId, attemptId)
        : this.attemptV2(scope, accountId, attemptId);
      if (attempt.review_kind !== reviewKind || featureKey !== REVIEW_FEATURES[attempt.review_kind]) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_review_generation_attempts" });
      }
      const existing = version === "v1"
        ? this.reservationRow(scope, accountId, attemptId)
        : this.reservationRowV2(scope, accountId, attemptId);
      if (existing) {
        return Object.freeze({ state: "idempotent" as const, reservation: reservationRecord(existing, attempt.review_kind) });
      }
      if (attempt.state !== "pending") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_review_generation_attempts" });
      }
      const platformControl = this.platformControl(featureKey);
      const accountControl = this.accountControlOrNull(scope, accountId, featureKey);
      const settings = this.reviewSettings();
      const inputCost = settings.input_cost_usd_per_million_tokens;
      const cachedInputCost = settings.cached_input_cost_usd_per_million_tokens;
      const cacheWriteInputCost =
        settings.cache_write_input_cost_usd_per_million_tokens;
      const outputCost = settings.output_cost_usd_per_million_tokens;
      const budgetPolicy = this.budgetPolicy();
      const subscriberWindow = budgetPolicy === null
        ? null : this.subscriberBudgetWindow(scope.userId, now);
      const subscriberSpend = subscriberWindow === null
        ? null : this.subscriberSpend(scope.userId, subscriberWindow);
      const emergencyRollingSpend = budgetPolicy?.emergency_trailing_30_day_estimated_spend_cap_usd
        ? this.rollingSpend(now)
        : new ExactDecimal(0);
      const completePricing = inputCost !== null && cachedInputCost !== null &&
        cacheWriteInputCost !== null && outputCost !== null;
      const controls = accountControl === null ? [platformControl] : [platformControl, accountControl];
      const available = completePricing && controls.every(hasCompleteCaps) &&
        budgetPolicy !== null && subscriberSpend !== null &&
        emergencyRollingSpend !== null;
      const maximumTotalTokens = maximumInputTokens + maxOutputTokens;
      const maximumCostUsd = inputCost !== null && cacheWriteInputCost !== null &&
          outputCost !== null
        ? reservedCost(
            maximumInputTokens,
            maxOutputTokens,
            inputCost,
            cacheWriteInputCost,
            outputCost,
          )
        : null;
      const day = easternCalendarDate(now);
      let blocked = !available;
      let blockFailureCode = available
        ? null : "TRADERLINK_COACH_REVIEW_UNAVAILABLE";
      if (!blocked) {
        const platformTotals = this.totals(day, featureKey, null);
        const accountTotals = this.totals(day, featureKey, accountId);
        const platformCap = platformControl.caps;
        const accountCap = accountControl?.caps ?? platformCap;
        const dailyCapReached = platformTotals.requests + 1 > platformCap.dailyRequestCap! ||
          platformTotals.tokens + maximumTotalTokens > platformCap.dailyTokenCap! ||
          platformTotals.spend.plus(maximumCostUsd!).gt(platformCap.dailyEstimatedSpendCapUsd!) ||
          accountTotals.requests + 1 > accountCap.dailyRequestCap! ||
          accountTotals.tokens + maximumTotalTokens > accountCap.dailyTokenCap! ||
          accountTotals.spend.plus(maximumCostUsd!).gt(accountCap.dailyEstimatedSpendCapUsd!);
        const subscriberCapReached = subscriberSpend!
          .plus(maximumCostUsd!)
          .gt(budgetPolicy!.per_subscriber_paid_cycle_estimated_spend_cap_usd);
        const emergencyCap = budgetPolicy!
          .emergency_trailing_30_day_estimated_spend_cap_usd;
        const emergencyCapReached = emergencyCap !== null &&
          emergencyRollingSpend!.plus(maximumCostUsd!).gt(emergencyCap);
        blocked = dailyCapReached || subscriberCapReached || emergencyCapReached;
        blockFailureCode = dailyCapReached
          ? "TRADERLINK_COACH_REVIEW_DAILY_CAP_REACHED"
          : subscriberCapReached
            ? "TRADERLINK_COACH_REVIEW_SUBSCRIBER_CYCLE_CAP_REACHED"
            : emergencyCapReached
              ? "TRADERLINK_COACH_REVIEW_EMERGENCY_GLOBAL_CAP_REACHED"
              : null;
      }
      const timestamp = createCanonicalUtcTimestamp(now);
      const reservationId = createCanonicalUuidV4();
      const reservationTable = version === "v1"
        ? "coach_ai_review_generation_control_reservations"
        : "coach_ai_review_generation_control_reservations_v2";
      this.database.prepare(`INSERT INTO ${reservationTable} (
  coach_ai_review_generation_control_reservation_id, coach_ai_review_generation_attempt_id,
  user_id, workspace_id, account_id, feature_key, eastern_calendar_date,
  provider_key, model_id, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, reserved_max_input_tokens,
  reserved_max_output_tokens, reserved_max_total_tokens, reserved_maximum_cost_usd,
  state, failure_code, reserved_at_utc, started_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`).run(
        reservationId, attemptId, scope.userId, scope.workspaceId, accountId, featureKey, day,
        settings.provider_key, attempt.model_id, settings.input_cost_usd_per_million_tokens,
        settings.cached_input_cost_usd_per_million_tokens,
        settings.cache_write_input_cost_usd_per_million_tokens,
        settings.output_cost_usd_per_million_tokens, maximumInputTokens, maxOutputTokens,
        maximumTotalTokens, maximumCostUsd, blocked ? "blocked" : "reserved",
        blocked ? blockFailureCode : null,
        timestamp, blocked ? timestamp : null,
      );
      const reservation = version === "v1"
        ? this.reservation(scope, accountId, attemptId, attempt.review_kind)
        : this.reservationV2(scope, accountId, attemptId, attempt.review_kind);
      return Object.freeze({ state: blocked ? "blocked" as const : "reserved" as const, reservation });
    });
  }

  markProviderStarted(
    scope: WorkspaceAccessScope,
    attemptId: string,
    now = new Date(),
  ): CoachAiReviewGenerationControlReservation {
    const accountId = this.accountId(scope);
    assertCanonicalUuidV4(attemptId, "attemptId");
    const result = this.database.prepare(`UPDATE coach_ai_review_generation_control_reservations
SET state = 'started', started_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND state = 'reserved'`).run(createCanonicalUtcTimestamp(now), attemptId, scope.userId, scope.workspaceId, accountId);
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.reservationForAttempt(scope, accountId, attemptId);
  }

  markProviderStartedV2(
    scope: WorkspaceAccessScope,
    attemptId: string,
    now = new Date(),
  ): CoachAiReviewGenerationControlReservation {
    const accountId = this.accountId(scope);
    assertCanonicalUuidV4(attemptId, "attemptId");
    const result = this.database.prepare(`UPDATE coach_ai_review_generation_control_reservations_v2
SET state = 'started', started_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'reserved'`).run(
      createCanonicalUtcTimestamp(now), attemptId, scope.userId, scope.workspaceId, accountId,
    );
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.reservationForAttemptV2(scope, accountId, attemptId);
  }

  finalizeFromReviewReceipt(
    scope: WorkspaceAccessScope,
    attemptId: string,
    state: "completed" | "failed",
    failureCode: string | null,
    now = new Date(),
  ): CoachAiReviewGenerationControlReservation {
    const accountId = this.accountId(scope);
    assertCanonicalUuidV4(attemptId, "attemptId");
    if ((state === "completed" && failureCode !== null) || (state === "failed" &&
      (typeof failureCode !== "string" || !FAILURE_CODE_PATTERN.test(failureCode)))) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "failureCode" });
    }
    const reservation = this.reservationForAttempt(scope, accountId, attemptId);
    const attempt = this.attempt(scope, accountId, attemptId);
    if (reservation.state !== "started" || (state === "completed" && attempt.state !== "issued") ||
      (state === "failed" && attempt.state !== "failed")) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_review_generation_control_reservations" });
    }
    const receipt = this.database.prepare<[string], Readonly<{
      input_tokens: number | null;
      cached_input_tokens: number | null;
      cache_write_input_tokens: number | null;
      output_tokens: number | null;
      total_tokens: number | null;
      input_cost_usd_per_million_tokens: string | null;
      cached_input_cost_usd_per_million_tokens: string | null;
      cache_write_input_cost_usd_per_million_tokens: string | null;
      output_cost_usd_per_million_tokens: string | null;
      estimated_cost_usd: string | null;
    }>>(`SELECT input_tokens, cached_input_tokens, cache_write_input_tokens,
  output_tokens, total_tokens, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd
FROM coach_ai_review_generation_attempt_receipts
WHERE coach_ai_review_generation_attempt_id = ?`).get(attemptId);
    if (!receipt || receipt.input_tokens === null || receipt.output_tokens === null || receipt.total_tokens === null ||
      receipt.cached_input_tokens === null || receipt.cache_write_input_tokens === null ||
      receipt.input_cost_usd_per_million_tokens !== reservation.inputCostUsdPerMillionTokens ||
      receipt.cached_input_cost_usd_per_million_tokens !==
        reservation.cachedInputCostUsdPerMillionTokens ||
      receipt.cache_write_input_cost_usd_per_million_tokens !==
        reservation.cacheWriteInputCostUsdPerMillionTokens ||
      receipt.output_cost_usd_per_million_tokens !== reservation.outputCostUsdPerMillionTokens ||
      receipt.estimated_cost_usd === null || receipt.input_tokens > reservation.maximumInputTokens ||
      receipt.cached_input_tokens + receipt.cache_write_input_tokens >
        receipt.input_tokens ||
      receipt.output_tokens > reservation.maximumOutputTokens || receipt.total_tokens > reservation.maximumTotalTokens ||
      reservation.maximumCostUsd === null || new ExactDecimal(receipt.estimated_cost_usd).gt(reservation.maximumCostUsd)) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_review_generation_attempt_receipts" });
    }
    const result = this.database.prepare(`UPDATE coach_ai_review_generation_control_reservations
SET state = ?, failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND state = 'started'`).run(state, failureCode, createCanonicalUtcTimestamp(now), attemptId, scope.userId, scope.workspaceId, accountId);
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.reservationForAttempt(scope, accountId, attemptId);
  }

  finalizeFromReviewReceiptV2(
    scope: WorkspaceAccessScope,
    attemptId: string,
    state: "completed" | "failed",
    failureCode: string | null,
    now = new Date(),
  ): CoachAiReviewGenerationControlReservation {
    const accountId = this.accountId(scope);
    assertCanonicalUuidV4(attemptId, "attemptId");
    if ((state === "completed" && failureCode !== null) || (state === "failed" &&
      (typeof failureCode !== "string" || !FAILURE_CODE_PATTERN.test(failureCode)))) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "failureCode" });
    }
    const reservation = this.reservationForAttemptV2(scope, accountId, attemptId);
    const attempt = this.attemptV2(scope, accountId, attemptId);
    if (reservation.state !== "started" || (state === "completed" && attempt.state !== "issued") ||
      (state === "failed" && attempt.state !== "failed")) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        table: "coach_ai_review_generation_control_reservations_v2",
      });
    }
    const receipt = this.database.prepare<[string], Readonly<{
      input_tokens: number | null;
      cached_input_tokens: number | null;
      cache_write_input_tokens: number | null;
      output_tokens: number | null;
      total_tokens: number | null;
      input_cost_usd_per_million_tokens: string | null;
      cached_input_cost_usd_per_million_tokens: string | null;
      cache_write_input_cost_usd_per_million_tokens: string | null;
      output_cost_usd_per_million_tokens: string | null;
      estimated_cost_usd: string | null;
    }>>(`SELECT input_tokens, cached_input_tokens, cache_write_input_tokens,
  output_tokens, total_tokens, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens,
  estimated_cost_usd
FROM coach_ai_review_generation_attempt_receipts_v2
WHERE coach_ai_review_generation_attempt_id = ?`).get(attemptId);
    if (!receipt || receipt.input_tokens === null || receipt.output_tokens === null ||
      receipt.total_tokens === null || receipt.cached_input_tokens === null ||
      receipt.cache_write_input_tokens === null ||
      receipt.input_cost_usd_per_million_tokens !== reservation.inputCostUsdPerMillionTokens ||
      receipt.cached_input_cost_usd_per_million_tokens !==
        reservation.cachedInputCostUsdPerMillionTokens ||
      receipt.cache_write_input_cost_usd_per_million_tokens !==
        reservation.cacheWriteInputCostUsdPerMillionTokens ||
      receipt.output_cost_usd_per_million_tokens !== reservation.outputCostUsdPerMillionTokens ||
      receipt.estimated_cost_usd === null ||
      receipt.input_tokens > reservation.maximumInputTokens ||
      receipt.cached_input_tokens + receipt.cache_write_input_tokens >
        receipt.input_tokens ||
      receipt.output_tokens > reservation.maximumOutputTokens ||
      receipt.total_tokens > reservation.maximumTotalTokens ||
      reservation.maximumCostUsd === null ||
      new ExactDecimal(receipt.estimated_cost_usd).gt(reservation.maximumCostUsd)) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        table: "coach_ai_review_generation_attempt_receipts_v2",
      });
    }
    const result = this.database.prepare(`UPDATE coach_ai_review_generation_control_reservations_v2
SET state = ?, failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'started'`).run(
      state, failureCode, createCanonicalUtcTimestamp(now), attemptId,
      scope.userId, scope.workspaceId, accountId,
    );
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.reservationForAttemptV2(scope, accountId, attemptId);
  }

  failStartedWithoutUsage(
    scope: WorkspaceAccessScope,
    attemptId: string,
    failureCode: string,
    now = new Date(),
  ): CoachAiReviewGenerationControlReservation {
    const accountId = this.accountId(scope);
    assertCanonicalUuidV4(attemptId, "attemptId");
    if (!FAILURE_CODE_PATTERN.test(failureCode)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "failureCode" });
    }
    const result = this.database.prepare(`UPDATE coach_ai_review_generation_control_reservations
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND state = 'started'`).run(failureCode, createCanonicalUtcTimestamp(now), attemptId, scope.userId, scope.workspaceId, accountId);
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.reservationForAttempt(scope, accountId, attemptId);
  }

  failStartedWithoutUsageV2(
    scope: WorkspaceAccessScope,
    attemptId: string,
    failureCode: string,
    now = new Date(),
  ): CoachAiReviewGenerationControlReservation {
    const accountId = this.accountId(scope);
    assertCanonicalUuidV4(attemptId, "attemptId");
    if (!FAILURE_CODE_PATTERN.test(failureCode)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "failureCode" });
    }
    const result = this.database.prepare(`UPDATE coach_ai_review_generation_control_reservations_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'started'`).run(
      failureCode, createCanonicalUtcTimestamp(now), attemptId,
      scope.userId, scope.workspaceId, accountId,
    );
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.reservationForAttemptV2(scope, accountId, attemptId);
  }

  private totals(day: string, featureKey: string, accountId: string | null): Readonly<{
    requests: number; tokens: number; spend: Decimal;
  }> {
    const totals = [this.totalsForTable(
      "coach_ai_review_generation_control_reservations",
      day,
      featureKey,
      accountId,
    )];
    const hasV2 = this.database.prepare<[], Readonly<{ present: number }>>(`SELECT 1 AS present
FROM sqlite_master
WHERE type = 'table' AND name = 'coach_ai_review_generation_control_reservations_v2'`).get();
    if (hasV2) totals.push(this.totalsForTable(
      "coach_ai_review_generation_control_reservations_v2",
      day,
      featureKey,
      accountId,
    ));
    return Object.freeze({
      requests: totals.reduce((sum, value) => sum + value.requests, 0),
      tokens: totals.reduce((sum, value) => sum + value.tokens, 0),
      spend: totals.reduce((sum, value) => sum.plus(value.spend), new ExactDecimal(0)),
    });
  }

  private budgetPolicy(): BudgetControlRow | null {
    const available = this.database.prepare<[], Readonly<{ present: number }>>(`SELECT 1 AS present
FROM sqlite_master
WHERE type = 'table' AND name = 'coach_ai_review_budget_controls'`).get();
    if (!available) return null;
    const row = this.database.prepare<[], BudgetControlRow>(`SELECT
  trailing_30_day_estimated_spend_cap_usd,
  per_subscriber_paid_cycle_estimated_spend_cap_usd,
  emergency_trailing_30_day_estimated_spend_cap_usd
FROM coach_ai_review_budget_controls WHERE control_key = 'ai_reviews'`).get();
    if (!row) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        table: "coach_ai_review_budget_controls",
      });
    }
    return row;
  }

  private subscriberBudgetWindow(userId: string, now: Date): SubscriberBudgetWindow {
    const access = new WhopAiReviewEntitlementRepository(this.database).readAccess(userId);
    const nowUtc = createCanonicalUtcTimestamp(now);
    if (access.state === "active" && access.renewalPeriodStartUtc !== null &&
        access.renewalPeriodEndUtc !== null &&
        access.renewalPeriodStartUtc <= nowUtc && access.renewalPeriodEndUtc > nowUtc) {
      return Object.freeze({
        startUtc: access.renewalPeriodStartUtc,
        endUtc: access.renewalPeriodEndUtc,
      });
    }
    return Object.freeze({
      startUtc: createCanonicalUtcTimestamp(new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1_000,
      )),
      endUtc: nowUtc,
    });
  }

  private subscriberSpend(userId: string, window: SubscriberBudgetWindow): Decimal | null {
    const values = [this.spendForTable(
      "coach_ai_review_generation_control_reservations",
      "coach_ai_review_generation_attempt_receipts",
      window.startUtc,
      window.endUtc,
      userId,
    )];
    const hasV2 = this.database.prepare<[], Readonly<{ present: number }>>(`SELECT 1 AS present
FROM sqlite_master
WHERE type = 'table' AND name = 'coach_ai_review_generation_control_reservations_v2'`).get();
    if (hasV2) values.push(this.spendForTable(
      "coach_ai_review_generation_control_reservations_v2",
      "coach_ai_review_generation_attempt_receipts_v2",
      window.startUtc,
      window.endUtc,
      userId,
    ));
    let total: Decimal = new ExactDecimal(0);
    for (const value of values) {
      if (value === null) return null;
      total = total.plus(value);
    }
    return total;
  }

  private rollingSpend(now: Date): Decimal | null {
    const since = createCanonicalUtcTimestamp(new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1_000,
    ));
    const values = [this.spendForTable(
      "coach_ai_review_generation_control_reservations",
      "coach_ai_review_generation_attempt_receipts",
      since,
      createCanonicalUtcTimestamp(now),
      null,
    )];
    const hasV2 = this.database.prepare<[], Readonly<{ present: number }>>(`SELECT 1 AS present
FROM sqlite_master
WHERE type = 'table' AND name = 'coach_ai_review_generation_control_reservations_v2'`).get();
    if (hasV2) values.push(this.spendForTable(
      "coach_ai_review_generation_control_reservations_v2",
      "coach_ai_review_generation_attempt_receipts_v2",
      since,
      createCanonicalUtcTimestamp(now),
      null,
    ));
    let total: Decimal = new ExactDecimal(0);
    for (const value of values) {
      if (value === null) return null;
      total = total.plus(value);
    }
    return total;
  }

  private spendForTable(
    reservationTable: "coach_ai_review_generation_control_reservations" |
      "coach_ai_review_generation_control_reservations_v2",
    receiptTable: "coach_ai_review_generation_attempt_receipts" |
      "coach_ai_review_generation_attempt_receipts_v2",
    sinceUtc: string,
    untilUtc: string,
    userId: string | null,
  ): Decimal | null {
    const userClause = userId === null ? "" : " AND reservation.user_id = ?";
    const statement = this.database.prepare<[string, string, string?], RollingSpendRow>(`SELECT
  reservation.state, reservation.reserved_maximum_cost_usd,
  receipt.estimated_cost_usd
FROM ${reservationTable} reservation
LEFT JOIN ${receiptTable} receipt
  ON receipt.coach_ai_review_generation_attempt_id =
    reservation.coach_ai_review_generation_attempt_id
WHERE reservation.feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND (
    reservation.state IN ('reserved', 'started')
    OR (
      reservation.state IN ('completed', 'failed')
      AND receipt.recorded_at_utc >= ?
      AND receipt.recorded_at_utc < ?
    )
  )${userClause}`);
    const rows = userId === null
      ? statement.all(sinceUtc, untilUtc)
      : statement.all(sinceUtc, untilUtc, userId);
    let total = new ExactDecimal(0);
    for (const row of rows) {
      if (row.state === "reserved" || row.state === "started") {
        if (row.reserved_maximum_cost_usd === null) return null;
        total = total.plus(row.reserved_maximum_cost_usd);
      } else if (row.state === "completed") {
        if (row.estimated_cost_usd === null) return null;
        total = total.plus(row.estimated_cost_usd);
      } else if (row.state === "failed" && row.estimated_cost_usd !== null) {
        total = total.plus(row.estimated_cost_usd);
      }
    }
    return total;
  }

  private totalsForTable(
    table: "coach_ai_review_generation_control_reservations" |
      "coach_ai_review_generation_control_reservations_v2",
    day: string,
    featureKey: string,
    accountId: string | null,
  ): Readonly<{ requests: number; tokens: number; spend: Decimal }> {
    const accountClause = accountId === null ? "" : " AND account_id = ?";
    const totalsStatement = this.database.prepare<
      [string, string, string?],
      Readonly<{ requests: number; tokens: number }>
    >(`SELECT
  SUM(CASE WHEN state = 'blocked' THEN 0 ELSE 1 END) AS requests,
  COALESCE(SUM(CASE WHEN state = 'blocked' THEN 0 ELSE reserved_max_total_tokens END), 0) AS tokens
FROM ${table}
WHERE eastern_calendar_date = ? AND feature_key = ?${accountClause}`);
    const row = (accountId === null
      ? totalsStatement.get(day, featureKey)
      : totalsStatement.get(day, featureKey, accountId)) ?? { requests: 0, tokens: 0 };
    const spendStatement = this.database.prepare<
      [string, string, string?],
      Readonly<{ value: string | null }>
    >(`SELECT
  CASE WHEN state = 'blocked' THEN '0' ELSE reserved_maximum_cost_usd END AS value
FROM ${table}
WHERE eastern_calendar_date = ? AND feature_key = ?${accountClause}`);
    const spendRows = accountId === null
      ? spendStatement.all(day, featureKey)
      : spendStatement.all(day, featureKey, accountId);
    return Object.freeze({
      requests: row.requests ?? 0,
      tokens: row.tokens ?? 0,
      spend: spendRows.reduce((sum, entry) => sum.plus(entry.value ?? "0"), new ExactDecimal(0)),
    });
  }

  private attempt(scope: WorkspaceAccessScope, accountId: string, attemptId: string): AttemptRow {
    const row = this.database.prepare<[string, string, string, string], AttemptRow>(`SELECT review_kind, state, provider_key, model_id
FROM coach_ai_review_generation_attempts
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(
      attemptId, scope.userId, scope.workspaceId, accountId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return row;
  }

  private attemptV2(scope: WorkspaceAccessScope, accountId: string, attemptId: string): AttemptRow {
    const row = this.database.prepare<[string, string, string, string], AttemptRow>(`SELECT
  request.review_kind, attempt.state, attempt.provider_key, attempt.model_id
FROM coach_ai_review_generation_attempts_v2 attempt
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id =
    attempt.coach_ai_review_period_request_id
 AND request.user_id = attempt.user_id
 AND request.workspace_id = attempt.workspace_id
 AND request.account_id = attempt.account_id
WHERE attempt.coach_ai_review_generation_attempt_id = ? AND attempt.user_id = ?
  AND attempt.workspace_id = ? AND attempt.account_id = ?`).get(
      attemptId, scope.userId, scope.workspaceId, accountId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return row;
  }

  private reservationRow(scope: WorkspaceAccessScope, accountId: string, attemptId: string): ReservationRow | null {
    return this.database.prepare<[string, string, string, string], ReservationRow>(`SELECT
  coach_ai_review_generation_control_reservation_id, coach_ai_review_generation_attempt_id,
  feature_key, state, provider_key, model_id, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, reserved_max_input_tokens,
  reserved_max_output_tokens, reserved_max_total_tokens, reserved_maximum_cost_usd
FROM coach_ai_review_generation_control_reservations
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(
      attemptId, scope.userId, scope.workspaceId, accountId,
    ) ?? null;
  }

  private reservationRowV2(
    scope: WorkspaceAccessScope,
    accountId: string,
    attemptId: string,
  ): ReservationRow | null {
    return this.database.prepare<[string, string, string, string], ReservationRow>(`SELECT
  coach_ai_review_generation_control_reservation_id,
  coach_ai_review_generation_attempt_id, feature_key, state, provider_key,
  model_id, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, reserved_max_input_tokens,
  reserved_max_output_tokens, reserved_max_total_tokens,
  reserved_maximum_cost_usd
FROM coach_ai_review_generation_control_reservations_v2
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`).get(
      attemptId, scope.userId, scope.workspaceId, accountId,
    ) ?? null;
  }

  private reservation(
    scope: WorkspaceAccessScope,
    accountId: string,
    attemptId: string,
    reviewKind: CoachAiReviewKind,
  ): CoachAiReviewGenerationControlReservation {
    const row = this.reservationRow(scope, accountId, attemptId);
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return reservationRecord(row, reviewKind);
  }

  private reservationV2(
    scope: WorkspaceAccessScope,
    accountId: string,
    attemptId: string,
    reviewKind: CoachAiReviewKind,
  ): CoachAiReviewGenerationControlReservation {
    const row = this.reservationRowV2(scope, accountId, attemptId);
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return reservationRecord(row, reviewKind);
  }

  private reservationForAttempt(
    scope: WorkspaceAccessScope,
    accountId: string,
    attemptId: string,
  ): CoachAiReviewGenerationControlReservation {
    return this.reservation(scope, accountId, attemptId, this.attempt(scope, accountId, attemptId).review_kind);
  }

  private reservationForAttemptV2(
    scope: WorkspaceAccessScope,
    accountId: string,
    attemptId: string,
  ): CoachAiReviewGenerationControlReservation {
    return this.reservationV2(
      scope,
      accountId,
      attemptId,
      this.attemptV2(scope, accountId, attemptId).review_kind,
    );
  }
}
