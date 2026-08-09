import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type { CoachAiFeatureControl } from "@/src/modules/coach/contracts/ai-provider-controls-contracts";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";

export type CoachAiReviewFeatureKey = "weekly_reviews" | "monthly_reviews";

export type CoachAiReviewFeatureMetrics = Readonly<{
  requestCount: number;
  reservationCount: number;
  blockedCount: number;
  failedCount: number;
  completedOrIssuedCount: number;
  totalTokens: number;
  estimatedCostUsd: string | null;
  deliveryScheduleCount: number;
}>;

export type CoachAiReviewAdministrationFeature = Readonly<{
  featureKey: CoachAiReviewFeatureKey;
  control: CoachAiFeatureControl;
  metrics: CoachAiReviewFeatureMetrics;
}>;

export type CoachAiReviewAdministrationState = Readonly<{
  weekly: CoachAiReviewAdministrationFeature;
  monthly: CoachAiReviewAdministrationFeature;
  masterState: "enabled" | "disabled" | "mixed";
  budget: CoachAiReviewBudgetControl;
  operations: CoachAiReviewOperationalStateV2;
}>;

export type CoachAiReviewBudgetControl = Readonly<{
  globalTrailing30DayWarningUsd: string | null;
  perSubscriberPaidCycleEstimatedSpendCapUsd: string;
  emergencyGlobalTrailing30DayEstimatedSpendCapUsd: string | null;
  globalTrailing30DayEstimatedSpendUsd: string;
  globalWarningReached: boolean;
  updatedAtUtc: string;
}>;

export type CoachAiReviewOperationalStateV2 = Readonly<{
  pendingRequestCount: number;
  generatingCount: number;
  retryingCount: number;
  failedAttemptCount: number;
  issuedReviewCount: number;
  lastRun: Readonly<{
    state: "running" | "completed" | "failed";
    startedAtUtc: string;
    finalizedAtUtc: string | null;
    summaryJson: string | null;
    failureCode: string | null;
  }> | null;
}>;

const REQUIRED_TABLES = Object.freeze([
  "coach_ai_feature_controls",
  "coach_ai_review_generation_attempts",
  "coach_ai_review_generation_attempt_receipts",
  "coach_ai_review_generation_control_reservations",
  "coach_review_delivery_settings",
  "coach_ai_review_period_requests_v2",
  "coach_ai_review_generation_attempts_v2",
  "coach_ai_issued_reviews_v2",
  "coach_ai_review_scheduler_runs_v2",
  "coach_ai_review_budget_controls",
] as const);

const ExactDecimal = Decimal.clone({ precision: 80, toExpNeg: -1000, toExpPos: 1000 });
const REVIEW_FEATURE_KEYS = new Set<CoachAiReviewFeatureKey>(["weekly_reviews", "monthly_reviews"]);

type ControlRow = Readonly<{
  feature_key: CoachAiReviewFeatureKey;
  scope_kind: "platform";
  enabled: number;
  daily_request_cap: number | null;
  daily_token_cap: number | null;
  daily_estimated_spend_cap_usd: string | null;
  updated_at_utc: string;
}>;

type MetricRow = Readonly<{
  coach_ai_review_generation_attempt_id: string;
  attempt_state: "pending" | "issued" | "failed";
  reservation_state: "reserved" | "started" | "completed" | "failed" | "blocked" | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  estimated_cost_usd: string | null;
}>;

type BudgetControlRow = Readonly<{
  trailing_30_day_estimated_spend_cap_usd: string | null;
  per_subscriber_paid_cycle_estimated_spend_cap_usd: string;
  emergency_trailing_30_day_estimated_spend_cap_usd: string | null;
  updated_at_utc: string;
}>;

function featureKey(value: unknown): CoachAiReviewFeatureKey {
  if (typeof value !== "string" || !REVIEW_FEATURE_KEYS.has(value as CoachAiReviewFeatureKey)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "featureKey" });
  }
  return value as CoachAiReviewFeatureKey;
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

function formatCost(values: readonly string[]): string | null {
  if (values.length === 0) return null;
  return values
    .reduce((total, value) => total.plus(value), new ExactDecimal(0))
    .toFixed(12)
    .replace(/\.?0+$/u, "") || "0";
}

function reviewKindFor(feature: CoachAiReviewFeatureKey): "weekly" | "monthly" {
  return feature === "weekly_reviews" ? "weekly" : "monthly";
}

export function isCoachAiReviewAdministrationSchemaAvailable(database: Database.Database): boolean {
  const names = REQUIRED_TABLES.map((name) => `'${name}'`).join(", ");
  const rows = database.prepare<[], Readonly<{ name: string }>>(
    `SELECT name FROM sqlite_schema WHERE type = 'table' AND name IN (${names})`,
  ).all();
  return rows.length === REQUIRED_TABLES.length;
}

export class CoachAiReviewAdministrationRepository {
  private readonly controls: CoachAiChatProviderControlsRepository;

  constructor(private readonly input: Readonly<{ database: Database.Database; scope: JournalAdminScope }>) {
    this.controls = new CoachAiChatProviderControlsRepository(input.database);
  }

  read(): CoachAiReviewAdministrationState {
    const weekly = this.feature("weekly_reviews");
    const monthly = this.feature("monthly_reviews");
    return Object.freeze({
      weekly,
      monthly,
      masterState: weekly.control.enabled && monthly.control.enabled
        ? "enabled"
        : !weekly.control.enabled && !monthly.control.enabled
          ? "disabled"
          : "mixed",
      budget: this.budgetControl(),
      operations: this.operationsV2(),
    });
  }

  saveMasterControl(enabled: boolean): CoachAiReviewAdministrationState {
    if (typeof enabled !== "boolean") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "enabled",
      });
    }
    return this.input.database.transaction(() => {
      const current = this.read();
      if (enabled) {
        const controls = [current.weekly.control, current.monthly.control];
        const capsComplete = controls.every((control) =>
          control.caps.dailyRequestCap !== null &&
          control.caps.dailyTokenCap !== null &&
          control.caps.dailyEstimatedSpendCapUsd !== null);
        const pricing = this.input.database.prepare<[], Readonly<{
          input_rate: string | null;
          cached_input_rate: string | null;
          cache_write_input_rate: string | null;
          output_rate: string | null;
        }>>(`SELECT input_cost_usd_per_million_tokens AS input_rate,
  cached_input_cost_usd_per_million_tokens AS cached_input_rate,
  cache_write_input_cost_usd_per_million_tokens AS cache_write_input_rate,
  output_cost_usd_per_million_tokens AS output_rate
FROM coach_ai_provider_settings WHERE settings_key = 'coach_reviews'`).get();
        if (!capsComplete || current.budget.globalTrailing30DayWarningUsd === null ||
            !new ExactDecimal(current.budget.perSubscriberPaidCycleEstimatedSpendCapUsd).gt(0) ||
            !pricing?.input_rate || !pricing.cached_input_rate ||
            !pricing.cache_write_input_rate ||
            !pricing.output_rate) {
          platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
            field: "reviewReadiness",
          });
        }
      }
      for (const feature of [current.weekly, current.monthly]) {
        this.savePlatformControl({
          featureKey: feature.featureKey,
          enabled,
          dailyRequestCap: feature.control.caps.dailyRequestCap,
          dailyTokenCap: feature.control.caps.dailyTokenCap,
          dailyEstimatedSpendCapUsd:
            feature.control.caps.dailyEstimatedSpendCapUsd,
        });
      }
      return this.read();
    }).immediate();
  }

  savePlatformControl(input: Readonly<{
    featureKey: unknown;
    enabled: unknown;
    dailyRequestCap: unknown;
    dailyTokenCap: unknown;
    dailyEstimatedSpendCapUsd: unknown;
  }>): CoachAiFeatureControl {
    const key = featureKey(input.featureKey);
    return this.controls.savePlatformFeatureControl({ ...input, featureKey: key });
  }

  saveBudgetControl(
    input: Readonly<{
      globalTrailing30DayWarningUsd: unknown;
      perSubscriberPaidCycleEstimatedSpendCapUsd: unknown;
      emergencyGlobalTrailing30DayEstimatedSpendCapUsd: unknown;
    }>,
    now = new Date(),
  ): CoachAiReviewBudgetControl {
    const optionalMoney = (value: unknown, field: string): string | null => {
      const normalized = value === "" || value === null || value === undefined
        ? null : value;
      if (normalized !== null && (typeof normalized !== "string" ||
          !/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/u.test(normalized) ||
          !new ExactDecimal(normalized).gt(0))) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
      }
      return normalized;
    };
    const globalWarning = optionalMoney(
      input.globalTrailing30DayWarningUsd,
      "globalTrailing30DayWarningUsd",
    );
    const subscriberCap = optionalMoney(
      input.perSubscriberPaidCycleEstimatedSpendCapUsd,
      "perSubscriberPaidCycleEstimatedSpendCapUsd",
    );
    if (subscriberCap === null) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "perSubscriberPaidCycleEstimatedSpendCapUsd",
      });
    }
    const emergencyCap = optionalMoney(
      input.emergencyGlobalTrailing30DayEstimatedSpendCapUsd,
      "emergencyGlobalTrailing30DayEstimatedSpendCapUsd",
    );
    this.input.database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = ?,
  per_subscriber_paid_cycle_estimated_spend_cap_usd = ?,
  emergency_trailing_30_day_estimated_spend_cap_usd = ?, updated_at_utc = ?
WHERE control_key = 'ai_reviews'`).run(
      globalWarning,
      subscriberCap,
      emergencyCap,
      createCanonicalUtcTimestamp(now),
    );
    return this.budgetControl();
  }

  private budgetControl(): CoachAiReviewBudgetControl {
    const row = this.input.database.prepare<[], BudgetControlRow>(`SELECT
  trailing_30_day_estimated_spend_cap_usd,
  per_subscriber_paid_cycle_estimated_spend_cap_usd,
  emergency_trailing_30_day_estimated_spend_cap_usd, updated_at_utc
FROM coach_ai_review_budget_controls WHERE control_key = 'ai_reviews'`).get();
    if (!row) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        table: "coach_ai_review_budget_controls",
      });
    }
    const globalSpend = this.globalTrailing30DaySpend();
    const warning = row.trailing_30_day_estimated_spend_cap_usd;
    return Object.freeze({
      globalTrailing30DayWarningUsd: warning,
      perSubscriberPaidCycleEstimatedSpendCapUsd:
        row.per_subscriber_paid_cycle_estimated_spend_cap_usd,
      emergencyGlobalTrailing30DayEstimatedSpendCapUsd:
        row.emergency_trailing_30_day_estimated_spend_cap_usd,
      globalTrailing30DayEstimatedSpendUsd: globalSpend.toFixed(12)
        .replace(/\.?0+$/u, "") || "0",
      globalWarningReached: warning !== null && globalSpend.gte(warning),
      updatedAtUtc: row.updated_at_utc,
    });
  }

  private globalTrailing30DaySpend(now = new Date()): Decimal {
    const since = createCanonicalUtcTimestamp(new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1_000,
    ));
    const tables = [
      ["coach_ai_review_generation_control_reservations", "coach_ai_review_generation_attempt_receipts"],
      ["coach_ai_review_generation_control_reservations_v2", "coach_ai_review_generation_attempt_receipts_v2"],
    ] as const;
    let total = new ExactDecimal(0);
    for (const [reservationTable, receiptTable] of tables) {
      const present = this.input.database.prepare<[string], Readonly<{ present: number }>>(
        "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?",
      ).get(reservationTable);
      if (!present) continue;
      const rows = this.input.database.prepare<[string], Readonly<{
        state: string;
        reserved_cost: string | null;
        actual_cost: string | null;
      }>>(`SELECT reservation.state,
  reservation.reserved_maximum_cost_usd AS reserved_cost,
  receipt.estimated_cost_usd AS actual_cost
FROM ${reservationTable} reservation
LEFT JOIN ${receiptTable} receipt
  ON receipt.coach_ai_review_generation_attempt_id =
    reservation.coach_ai_review_generation_attempt_id
WHERE reservation.feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND (reservation.state IN ('reserved', 'started')
    OR (reservation.state IN ('completed', 'failed')
      AND receipt.recorded_at_utc >= ?))`).all(since);
      for (const row of rows) {
        const value = row.state === "reserved" || row.state === "started"
          ? row.reserved_cost : row.actual_cost;
        if (value !== null) total = total.plus(value);
      }
    }
    return total;
  }

  private feature(key: CoachAiReviewFeatureKey): CoachAiReviewAdministrationFeature {
    const control = this.input.database.prepare<[CoachAiReviewFeatureKey], ControlRow>(`SELECT feature_key, scope_kind, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc
FROM coach_ai_feature_controls
WHERE feature_key = ? AND scope_kind = 'platform'`).get(key);
    if (!control) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_feature_controls" });
    return Object.freeze({
      featureKey: key,
      control: controlRecord(control),
      metrics: this.metrics(key),
    });
  }

  private metrics(key: CoachAiReviewFeatureKey): CoachAiReviewFeatureMetrics {
    const rows = this.input.database.prepare<["weekly" | "monthly"], MetricRow>(`SELECT
  attempt.coach_ai_review_generation_attempt_id,
  attempt.state AS attempt_state,
  reservation.state AS reservation_state,
  receipt.input_tokens,
  receipt.output_tokens,
  receipt.total_tokens,
  receipt.estimated_cost_usd
FROM coach_ai_review_generation_attempts attempt
LEFT JOIN coach_ai_review_generation_control_reservations reservation
  ON reservation.coach_ai_review_generation_attempt_id = attempt.coach_ai_review_generation_attempt_id
LEFT JOIN coach_ai_review_generation_attempt_receipts receipt
  ON receipt.coach_ai_review_generation_attempt_id = attempt.coach_ai_review_generation_attempt_id
WHERE attempt.review_kind = ?`).all(reviewKindFor(key));
    const deliveryScheduleCount = this.input.database.prepare<[], Readonly<{ count: number }>>(
      "SELECT COUNT(*) AS count FROM coach_ai_review_account_settings_v2 WHERE is_enabled = 1",
    ).get()?.count ?? 0;
    return Object.freeze({
      requestCount: rows.length,
      reservationCount: rows.filter((row) => row.reservation_state !== null).length,
      blockedCount: rows.filter((row) => row.reservation_state === "blocked").length,
      failedCount: rows.filter((row) => row.reservation_state === "failed" || (row.reservation_state === null && row.attempt_state === "failed")).length,
      completedOrIssuedCount: rows.filter((row) => row.reservation_state === "completed" || (row.reservation_state === null && row.attempt_state === "issued")).length,
      totalTokens: rows.reduce((total, row) => total + (row.total_tokens ?? 0), 0),
      estimatedCostUsd: formatCost(rows.flatMap((row) => row.estimated_cost_usd === null ? [] : [row.estimated_cost_usd])),
      deliveryScheduleCount,
    });
  }

  private operationsV2(): CoachAiReviewOperationalStateV2 {
    const counts = this.input.database.prepare<[], Readonly<{
      pending_request_count: number;
      generating_count: number;
      retrying_count: number;
      failed_attempt_count: number;
      issued_review_count: number;
    }>>(`SELECT
  (SELECT COUNT(*) FROM coach_ai_review_period_requests_v2 WHERE state = 'pending')
    AS pending_request_count,
  (SELECT COUNT(*) FROM coach_ai_review_generation_attempts_v2 WHERE state = 'pending')
    AS generating_count,
  (SELECT COUNT(*) FROM coach_ai_review_period_requests_v2 request
    WHERE request.state = 'pending' AND EXISTS (
      SELECT 1 FROM coach_ai_review_generation_attempts_v2 attempt
      WHERE attempt.coach_ai_review_period_request_id = request.coach_ai_review_period_request_id
        AND attempt.state = 'failed'
    ) AND NOT EXISTS (
      SELECT 1 FROM coach_ai_review_generation_attempts_v2 attempt
      WHERE attempt.coach_ai_review_period_request_id = request.coach_ai_review_period_request_id
        AND attempt.state = 'pending'
    )) AS retrying_count,
  (SELECT COUNT(*) FROM coach_ai_review_generation_attempts_v2 WHERE state = 'failed')
    AS failed_attempt_count,
  (SELECT COUNT(*) FROM coach_ai_issued_reviews_v2) AS issued_review_count`).get();
    const lastRun = this.input.database.prepare<[], Readonly<{
      state: "running" | "completed" | "failed";
      started_at_utc: string;
      finalized_at_utc: string | null;
      summary_json: string | null;
      failure_code: string | null;
    }>>(`SELECT state, started_at_utc, finalized_at_utc, summary_json, failure_code
FROM coach_ai_review_scheduler_runs_v2
ORDER BY started_at_utc DESC, coach_ai_review_scheduler_run_id DESC LIMIT 1`).get();
    return Object.freeze({
      pendingRequestCount: counts?.pending_request_count ?? 0,
      generatingCount: counts?.generating_count ?? 0,
      retryingCount: counts?.retrying_count ?? 0,
      failedAttemptCount: counts?.failed_attempt_count ?? 0,
      issuedReviewCount: counts?.issued_review_count ?? 0,
      lastRun: lastRun ? Object.freeze({
        state: lastRun.state,
        startedAtUtc: lastRun.started_at_utc,
        finalizedAtUtc: lastRun.finalized_at_utc,
        summaryJson: lastRun.summary_json,
        failureCode: lastRun.failure_code,
      }) : null,
    });
  }
}
