import type Database from "better-sqlite3";

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
    return Object.freeze({
      generationCount: row?.generation_count ?? 0,
      totalTokens: row?.total_tokens ?? 0,
      estimatedCostUsd: formatCost(row?.estimated_cost_usd ?? null),
    });
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
