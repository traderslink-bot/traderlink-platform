import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type { CoachAiFeatureControl } from "@/src/modules/coach/contracts/ai-provider-controls-contracts";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

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
}>;

const REQUIRED_TABLES = Object.freeze([
  "coach_ai_feature_controls",
  "coach_ai_review_generation_attempts",
  "coach_ai_review_generation_attempt_receipts",
  "coach_ai_review_generation_control_reservations",
  "coach_review_delivery_settings",
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
  const rows = database.prepare<readonly string[], Readonly<{ name: string }>>(
    `SELECT name FROM sqlite_schema WHERE type = 'table' AND name IN (${REQUIRED_TABLES.map(() => "?").join(", ")})`,
  ).all(...REQUIRED_TABLES);
  return rows.length === REQUIRED_TABLES.length;
}

export class CoachAiReviewAdministrationRepository {
  private readonly controls: CoachAiChatProviderControlsRepository;

  constructor(private readonly input: Readonly<{ database: Database.Database; scope: JournalAdminScope }>) {
    this.controls = new CoachAiChatProviderControlsRepository(input.database);
  }

  read(): CoachAiReviewAdministrationState {
    return Object.freeze({
      weekly: this.feature("weekly_reviews"),
      monthly: this.feature("monthly_reviews"),
    });
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
      "SELECT COUNT(*) AS count FROM coach_review_delivery_settings",
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
}
