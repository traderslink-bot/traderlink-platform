import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type { CoachAiCostAggregation, CoachAiFeatureKey } from "@/src/modules/coach/contracts/ai-provider-controls-contracts";
import { createCanonicalUtcTimestamp, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export type CoachAiProviderSettings = Readonly<{
  providerKey: "openai_direct";
  modelId: string;
  inputCostUsdPerMillionTokens: string | null;
  outputCostUsdPerMillionTokens: string | null;
  updatedAtUtc: string;
}>;

export type CoachAiCostSummary = Readonly<{
  generationCount: number;
  totalTokens: number;
  estimatedCostUsd: string | null;
}>;

const MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const MONEY_RATE_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/u;
const ExactDecimal = Decimal.clone({ precision: 80, toExpNeg: -1000, toExpPos: 1000 });

function nullableRate(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !MONEY_RATE_PATTERN.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function formatCost(value: number | null): string | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  return value.toFixed(6);
}

export class CoachAiProviderSettingsRepository {
  constructor(private readonly database: Database.Database) {}

  read(): CoachAiProviderSettings {
    const row = this.database.prepare<[], Readonly<{
      provider_key: "openai_direct";
      model_id: string;
      input_cost_usd_per_million_tokens: string | null;
      output_cost_usd_per_million_tokens: string | null;
      updated_at_utc: string;
    }>>(`SELECT provider_key, model_id, input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, updated_at_utc
FROM coach_ai_provider_settings WHERE settings_key = 'coach_reviews'`).get();
    if (!row) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_provider_settings" });
    return Object.freeze({
      providerKey: row.provider_key,
      modelId: row.model_id,
      inputCostUsdPerMillionTokens: row.input_cost_usd_per_million_tokens,
      outputCostUsdPerMillionTokens: row.output_cost_usd_per_million_tokens,
      updatedAtUtc: row.updated_at_utc,
    });
  }

  readCostSummary(): CoachAiCostSummary {
    const row = this.database.prepare<[], Readonly<{
      generation_count: number;
      total_tokens: number;
      estimated_cost_usd: number | null;
    }>>(`SELECT COUNT(*) AS generation_count, COALESCE(SUM(total_tokens), 0) AS total_tokens,
  SUM(CAST(estimated_cost_usd AS REAL)) AS estimated_cost_usd
FROM coach_ai_generation_cost_receipts`).get();
    const attemptRow = this.database.prepare<[], Readonly<{
      generation_count: number;
      total_tokens: number;
      estimated_cost_usd: number | null;
    }>>(`SELECT COUNT(*) AS generation_count, COALESCE(SUM(total_tokens), 0) AS total_tokens,
  SUM(CAST(estimated_cost_usd AS REAL)) AS estimated_cost_usd
FROM coach_ai_review_generation_attempt_receipts`).get();
    const legacyCost = row?.estimated_cost_usd ?? null;
    const attemptCost = attemptRow?.estimated_cost_usd ?? null;
    return Object.freeze({
      generationCount: (row?.generation_count ?? 0) + (attemptRow?.generation_count ?? 0),
      totalTokens: (row?.total_tokens ?? 0) + (attemptRow?.total_tokens ?? 0),
      estimatedCostUsd: formatCost(legacyCost === null && attemptCost === null
        ? null
        : (legacyCost ?? 0) + (attemptCost ?? 0)),
    });
  }

  readCostAggregation(): readonly CoachAiCostAggregation[] {
    type AggregationRow = Readonly<{
      feature_key: CoachAiFeatureKey;
      model_id: string;
      account_id: string;
      request_count: number;
      blocked_request_count: number;
      failed_request_count: number;
      total_tokens: number;
      estimated_cost_usd: string | null;
    }>;
    const rows = this.database.prepare<[], AggregationRow>(`SELECT 'ai_chat' AS feature_key,
  attempt.model_id, attempt.account_id, COUNT(*) AS request_count,
  SUM(CASE WHEN attempt.state = 'blocked' THEN 1 ELSE 0 END) AS blocked_request_count,
  SUM(CASE WHEN attempt.state = 'failed' THEN 1 ELSE 0 END) AS failed_request_count,
  COALESCE(SUM(receipt.total_tokens), 0) AS total_tokens, receipt.estimated_cost_usd
FROM coach_ai_chat_generation_attempts attempt
LEFT JOIN coach_ai_chat_generation_receipts receipt
  ON receipt.coach_ai_chat_message_id = attempt.coach_ai_chat_message_id
GROUP BY attempt.model_id, attempt.account_id, receipt.estimated_cost_usd
UNION ALL
SELECT CASE attempt.review_kind WHEN 'weekly' THEN 'weekly_reviews' ELSE 'monthly_reviews' END AS feature_key,
  attempt.model_id, attempt.account_id, COUNT(*) AS request_count, 0 AS blocked_request_count,
  SUM(CASE WHEN attempt.state = 'failed' THEN 1 ELSE 0 END) AS failed_request_count,
  COALESCE(SUM(receipt.total_tokens), 0) AS total_tokens, receipt.estimated_cost_usd
FROM coach_ai_review_generation_attempts attempt
LEFT JOIN coach_ai_review_generation_attempt_receipts receipt
  ON receipt.coach_ai_review_generation_attempt_id = attempt.coach_ai_review_generation_attempt_id
GROUP BY attempt.review_kind, attempt.model_id, attempt.account_id, receipt.estimated_cost_usd`).all();
    const grouped = new Map<string, {
      featureKey: CoachAiFeatureKey; modelId: string; accountId: string; requestCount: number;
      blockedRequestCount: number; failedRequestCount: number; totalTokens: number; costs: Decimal[];
    }>();
    for (const row of rows) {
      const key = `${row.feature_key}\u0000${row.model_id}\u0000${row.account_id}`;
      const current = grouped.get(key) ?? {
        featureKey: row.feature_key, modelId: row.model_id, accountId: row.account_id,
        requestCount: 0, blockedRequestCount: 0, failedRequestCount: 0, totalTokens: 0, costs: [],
      };
      current.requestCount += row.request_count;
      current.blockedRequestCount += row.blocked_request_count;
      current.failedRequestCount += row.failed_request_count;
      current.totalTokens += row.total_tokens;
      if (row.estimated_cost_usd !== null) current.costs.push(new ExactDecimal(row.estimated_cost_usd));
      grouped.set(key, current);
    }
    return Object.freeze([...grouped.values()].map((row) => Object.freeze({
      featureKey: row.featureKey, modelId: row.modelId, accountId: row.accountId,
      requestCount: row.requestCount, blockedRequestCount: row.blockedRequestCount,
      failedRequestCount: row.failedRequestCount, totalTokens: row.totalTokens,
      estimatedCostUsd: row.costs.length === 0 ? null : row.costs.reduce((sum, value) => sum.plus(value), new ExactDecimal(0))
        .toFixed(12).replace(/\.?0+$/u, "") || "0",
    })).sort((left, right) => left.featureKey.localeCompare(right.featureKey) || left.modelId.localeCompare(right.modelId) || left.accountId.localeCompare(right.accountId)));
  }

  save(input: Readonly<{
    modelId: unknown;
    inputCostUsdPerMillionTokens: unknown;
    outputCostUsdPerMillionTokens: unknown;
  }>, now = new Date()): CoachAiProviderSettings {
    if (typeof input.modelId !== "string" || !MODEL_ID_PATTERN.test(input.modelId)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "modelId" });
    }
    const inputRate = nullableRate(input.inputCostUsdPerMillionTokens, "inputCostUsdPerMillionTokens");
    const outputRate = nullableRate(input.outputCostUsdPerMillionTokens, "outputCostUsdPerMillionTokens");
    if ((inputRate === null) !== (outputRate === null)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tokenPricing" });
    }
    const updatedAtUtc = createCanonicalUtcTimestamp(now);
    this.database.prepare(`UPDATE coach_ai_provider_settings SET
  model_id = ?, input_cost_usd_per_million_tokens = ?,
  output_cost_usd_per_million_tokens = ?, updated_at_utc = ?
WHERE settings_key = 'coach_reviews'`).run(input.modelId, inputRate, outputRate, updatedAtUtc);
    return this.read();
  }
}
