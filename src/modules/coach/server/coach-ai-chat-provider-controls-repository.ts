import { Buffer } from "node:buffer";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type {
  CoachAiChatGenerationAttempt,
  CoachAiChatProviderSettings,
  CoachAiDailyCapSet,
  CoachAiFeatureControl,
  CoachAiFeatureKey,
} from "@/src/modules/coach/contracts/ai-provider-controls-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

const ExactDecimal = Decimal.clone({ precision: 80, toExpNeg: -1000, toExpPos: 1000 });
const MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const PRICE_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/u;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/u;
const FEATURE_KEYS = new Set<CoachAiFeatureKey>(["ai_chat", "daily_companion", "weekly_reviews", "monthly_reviews"]);
const MAX_OUTPUT_TOKENS = 16_384;
const MAX_PROVIDER_INPUT_BYTES = 256_000;

type ControlRow = Readonly<{
  feature_key: CoachAiFeatureKey;
  scope_kind: "platform" | "account";
  enabled: number;
  daily_request_cap: number | null;
  daily_token_cap: number | null;
  daily_estimated_spend_cap_usd: string | null;
  updated_at_utc: string;
}>;

type SettingsRow = Readonly<{
  provider_key: "openai_direct";
  model_id: string;
  input_cost_usd_per_million_tokens: string | null;
  cached_input_cost_usd_per_million_tokens: string | null;
  cache_write_input_cost_usd_per_million_tokens: string | null;
  output_cost_usd_per_million_tokens: string | null;
  updated_at_utc: string;
}>;

type AttemptRow = Readonly<{
  coach_ai_chat_generation_attempt_id: string;
  coach_ai_chat_conversation_id: string;
  coach_ai_chat_message_id: string;
  state: "reserved" | "started" | "completed" | "failed" | "blocked";
  provider_key: "openai_direct";
  model_id: string;
  input_cost_usd_per_million_tokens: string;
  cached_input_cost_usd_per_million_tokens: string;
  cache_write_input_cost_usd_per_million_tokens: string;
  output_cost_usd_per_million_tokens: string;
  reserved_max_input_tokens: number;
  reserved_max_output_tokens: number;
  reserved_max_total_tokens: number;
  reserved_maximum_cost_usd: string;
  failure_code: string | null;
  reserved_at_utc: string;
  started_at_utc: string | null;
  finalized_at_utc: string | null;
}>;

type ReceiptFinalizationRow = Readonly<{
  input_tokens: number;
  cached_input_tokens: number;
  cache_write_input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: string;
  message_state: "completed" | "failed";
  receipt_provider_key: "openai_direct";
  receipt_model_id: string;
  receipt_input_rate: string;
  receipt_cached_input_rate: string;
  receipt_cache_write_input_rate: string;
  receipt_output_rate: string;
  attempt_provider_key: "openai_direct";
  attempt_model_id: string;
  attempt_input_rate: string;
  attempt_cached_input_rate: string;
  attempt_cache_write_input_rate: string;
  attempt_output_rate: string;
  reserved_max_input_tokens: number;
  reserved_max_output_tokens: number;
  reserved_max_total_tokens: number;
  reserved_maximum_cost_usd: string;
}>;

function positivePrice(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !PRICE_PATTERN.test(value) || new ExactDecimal(value).lte(0)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function caps(value: Readonly<{
  dailyRequestCap: unknown;
  dailyTokenCap: unknown;
  dailyEstimatedSpendCapUsd: unknown;
}>): CoachAiDailyCapSet {
  const request = value.dailyRequestCap;
  const tokens = value.dailyTokenCap;
  const spend = positivePrice(value.dailyEstimatedSpendCapUsd, "dailyEstimatedSpendCapUsd");
  if (request === null || request === undefined || request === "") {
    if (tokens !== null && tokens !== undefined || spend !== null) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "dailyCaps" });
    }
    return Object.freeze({ dailyRequestCap: null, dailyTokenCap: null, dailyEstimatedSpendCapUsd: null });
  }
  if (typeof request !== "number" || !Number.isSafeInteger(request) || request <= 0 ||
      typeof tokens !== "number" || !Number.isSafeInteger(tokens) || tokens <= 0 || spend === null) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "dailyCaps" });
  }
  return Object.freeze({ dailyRequestCap: request, dailyTokenCap: tokens, dailyEstimatedSpendCapUsd: spend });
}

function feature(value: unknown): CoachAiFeatureKey {
  if (typeof value !== "string" || !FEATURE_KEYS.has(value as CoachAiFeatureKey)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "featureKey" });
  }
  return value as CoachAiFeatureKey;
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

function settingsRecord(row: SettingsRow): CoachAiChatProviderSettings {
  return Object.freeze({
    providerKey: row.provider_key,
    modelId: row.model_id,
    inputCostUsdPerMillionTokens: row.input_cost_usd_per_million_tokens,
    cachedInputCostUsdPerMillionTokens: row.cached_input_cost_usd_per_million_tokens,
    cacheWriteInputCostUsdPerMillionTokens: row.cache_write_input_cost_usd_per_million_tokens,
    outputCostUsdPerMillionTokens: row.output_cost_usd_per_million_tokens,
    updatedAtUtc: row.updated_at_utc,
  });
}

function easternCalendarDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function reservedMoney(
  inputTokens: number,
  outputTokens: number,
  inputRate: string,
  cachedInputRate: string,
  cacheWriteInputRate: string,
  outputRate: string,
): string {
  const conservativeInputRate = [cachedInputRate, cacheWriteInputRate]
    .reduce((highest, candidate) => new ExactDecimal(candidate).gt(highest) ? candidate : highest, inputRate);
  return new ExactDecimal(inputTokens).times(conservativeInputRate)
    .plus(new ExactDecimal(outputTokens).times(outputRate))
    .dividedBy(1_000_000).toFixed(12).replace(/\.?0+$/u, "") || "0";
}

export class CoachAiChatProviderControlsRepository {
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
WHERE user.user_id = ? AND user.status = 'active' AND workspace.status = 'active' AND membership.status = 'active' AND account.status = 'active'`).get(scope.workspaceId, scope.activeAccountId, scope.userId);
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return row.account_id;
  }

  readChatSettings(): CoachAiChatProviderSettings {
    const row = this.database.prepare<[], SettingsRow>(`SELECT provider_key, model_id, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens, cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, updated_at_utc FROM coach_ai_chat_provider_settings WHERE settings_key = 'ai_chat'`).get();
    if (!row) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_chat_provider_settings" });
    return settingsRecord(row);
  }

  saveChatSettings(input: Readonly<{
    modelId: unknown;
    inputCostUsdPerMillionTokens: unknown;
    cachedInputCostUsdPerMillionTokens: unknown;
    cacheWriteInputCostUsdPerMillionTokens: unknown;
    outputCostUsdPerMillionTokens: unknown;
  }>, now = new Date()): CoachAiChatProviderSettings {
    if (typeof input.modelId !== "string" || !MODEL_ID_PATTERN.test(input.modelId)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "modelId" });
    }
    const inputRate = positivePrice(input.inputCostUsdPerMillionTokens, "inputCostUsdPerMillionTokens");
    const cachedInputRate = positivePrice(input.cachedInputCostUsdPerMillionTokens, "cachedInputCostUsdPerMillionTokens");
    const cacheWriteInputRate = positivePrice(input.cacheWriteInputCostUsdPerMillionTokens, "cacheWriteInputCostUsdPerMillionTokens");
    const outputRate = positivePrice(input.outputCostUsdPerMillionTokens, "outputCostUsdPerMillionTokens");
    if ((inputRate === null) !== (cachedInputRate === null) ||
        (inputRate === null) !== (cacheWriteInputRate === null) ||
        (inputRate === null) !== (outputRate === null)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tokenPricing" });
    }
    this.database.prepare(`UPDATE coach_ai_chat_provider_settings SET model_id = ?, input_cost_usd_per_million_tokens = ?,
  cached_input_cost_usd_per_million_tokens = ?, cache_write_input_cost_usd_per_million_tokens = ?,
  output_cost_usd_per_million_tokens = ?, updated_at_utc = ? WHERE settings_key = 'ai_chat'`).run(
      input.modelId, inputRate, cachedInputRate, cacheWriteInputRate, outputRate, createCanonicalUtcTimestamp(now),
    );
    return this.readChatSettings();
  }

  readFeatureControls(scope: WorkspaceAccessScope): readonly CoachAiFeatureControl[] {
    const accountId = this.accountId(scope);
    return Object.freeze(this.database.prepare<[string, string], ControlRow>(`SELECT feature_key, scope_kind, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc
FROM coach_ai_feature_controls WHERE scope_kind = 'platform' OR (scope_kind = 'account' AND workspace_id = ? AND account_id = ?)
ORDER BY feature_key, scope_kind`).all(scope.workspaceId, accountId).map(controlRecord));
  }

  /** Privacy-safe projection for the trader-facing Links AI Chat surface. */
  readChatReadiness(
    scope: WorkspaceAccessScope,
  ): Readonly<{ state: "ready" | "unavailable" }> {
    this.accountId(scope);
    const settings = this.readChatSettings();
    const controls = this.readFeatureControls(scope).filter((control) =>
      control.featureKey === "ai_chat");
    const platform = controls.find((control) => control.scopeKind === "platform") ?? null;
    const account = controls.find((control) => control.scopeKind === "account") ?? null;
    const configured = [platform, account].every((control) =>
      control !== null && control.enabled && control.caps.dailyRequestCap !== null &&
      control.caps.dailyTokenCap !== null && control.caps.dailyEstimatedSpendCapUsd !== null) &&
      settings.inputCostUsdPerMillionTokens !== null &&
      settings.cachedInputCostUsdPerMillionTokens !== null &&
      settings.cacheWriteInputCostUsdPerMillionTokens !== null &&
      settings.outputCostUsdPerMillionTokens !== null;
    return Object.freeze({ state: configured ? "ready" : "unavailable" });
  }

  findChatGenerationByIdempotency(
    scope: WorkspaceAccessScope,
    idempotencySha256: unknown,
  ): CoachAiChatGenerationAttempt | null {
    const accountId = this.accountId(scope);
    if (typeof idempotencySha256 !== "string" || !DIGEST_PATTERN.test(idempotencySha256)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "idempotencySha256" });
    }
    const row = this.database.prepare<[string, string], AttemptRow>(`SELECT coach_ai_chat_generation_attempt_id,
  coach_ai_chat_conversation_id, coach_ai_chat_message_id, state, provider_key, model_id,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens, output_cost_usd_per_million_tokens,
  reserved_max_input_tokens, reserved_max_output_tokens, reserved_max_total_tokens, reserved_maximum_cost_usd,
  failure_code, reserved_at_utc, started_at_utc, finalized_at_utc
FROM coach_ai_chat_generation_attempts WHERE account_id = ? AND idempotency_sha256 = ?`).get(accountId, idempotencySha256);
    return row ? this.attemptRecord(row) : null;
  }

  listExpiredChatGenerationAttempts(
    scope: WorkspaceAccessScope,
    input: Readonly<{ olderThanUtc: string; conversationId?: string | null }>,
  ): readonly CoachAiChatGenerationAttempt[] {
    const accountId = this.accountId(scope);
    if (typeof input.olderThanUtc !== "string" || Number.isNaN(Date.parse(input.olderThanUtc))) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "olderThanUtc" });
    }
    if (input.conversationId !== undefined && input.conversationId !== null) {
      assertCanonicalUuidV4(input.conversationId, "conversationId");
    }
    const rows = this.database.prepare<[
      string, string, string, string | null, string | null, string, string
    ], AttemptRow>(`SELECT
  coach_ai_chat_generation_attempt_id, coach_ai_chat_conversation_id, coach_ai_chat_message_id, state, provider_key, model_id,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens, output_cost_usd_per_million_tokens,
  reserved_max_input_tokens, reserved_max_output_tokens, reserved_max_total_tokens, reserved_maximum_cost_usd,
  failure_code, reserved_at_utc, started_at_utc, finalized_at_utc
FROM coach_ai_chat_generation_attempts
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND (? IS NULL OR coach_ai_chat_conversation_id = ?)
  AND ((state = 'reserved' AND reserved_at_utc < ?) OR (state = 'started' AND started_at_utc < ?))
ORDER BY reserved_at_utc, coach_ai_chat_generation_attempt_id`).all(
      scope.userId, scope.workspaceId, accountId, input.conversationId ?? null, input.conversationId ?? null,
      input.olderThanUtc, input.olderThanUtc,
    );
    return Object.freeze(rows.map((row) => this.attemptRecord(row)));
  }

  failExpiredChatGenerationAttempt(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      attemptId: string;
      conversationId: string;
      olderThanUtc: string;
      failureCode: string;
    }>,
    now = new Date(),
  ): boolean {
    const accountId = this.accountId(scope);
    assertCanonicalUuidV4(input.attemptId, "attemptId");
    assertCanonicalUuidV4(input.conversationId, "conversationId");
    if (typeof input.olderThanUtc !== "string" || Number.isNaN(Date.parse(input.olderThanUtc))) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "olderThanUtc" });
    }
    if (!/^[A-Z][A-Z0-9_]{0,95}$/u.test(input.failureCode)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "failureCode" });
    }
    const result = this.database.prepare(`UPDATE coach_ai_chat_generation_attempts
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_chat_generation_attempt_id = ? AND coach_ai_chat_conversation_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND ((state = 'reserved' AND reserved_at_utc < ?) OR (state = 'started' AND started_at_utc < ?))`).run(
      input.failureCode, createCanonicalUtcTimestamp(now), input.attemptId, input.conversationId,
      scope.userId, scope.workspaceId, accountId, input.olderThanUtc, input.olderThanUtc,
    );
    return result.changes === 1;
  }

  savePlatformFeatureControl(input: Readonly<{ featureKey: unknown; enabled: unknown; dailyRequestCap: unknown; dailyTokenCap: unknown; dailyEstimatedSpendCapUsd: unknown }>, now = new Date()): CoachAiFeatureControl {
    const featureKey = feature(input.featureKey);
    if (typeof input.enabled !== "boolean") platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "enabled" });
    const value = caps(input);
    this.database.prepare(`UPDATE coach_ai_feature_controls SET enabled = ?, daily_request_cap = ?, daily_token_cap = ?,
  daily_estimated_spend_cap_usd = ?, updated_at_utc = ? WHERE feature_key = ? AND scope_kind = 'platform'`).run(input.enabled ? 1 : 0, value.dailyRequestCap, value.dailyTokenCap, value.dailyEstimatedSpendCapUsd, createCanonicalUtcTimestamp(now), featureKey);
    return this.platformControl(featureKey);
  }

  saveAccountFeatureControl(scope: WorkspaceAccessScope, input: Readonly<{ featureKey: unknown; enabled: unknown; dailyRequestCap: unknown; dailyTokenCap: unknown; dailyEstimatedSpendCapUsd: unknown }>, now = new Date()): CoachAiFeatureControl {
    const accountId = this.accountId(scope);
    const featureKey = feature(input.featureKey);
    if (typeof input.enabled !== "boolean") platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "enabled" });
    const value = caps(input);
    const timestamp = createCanonicalUtcTimestamp(now);
    this.database.prepare(`INSERT INTO coach_ai_feature_controls (
  coach_ai_feature_control_id, feature_key, scope_kind, user_id, workspace_id, account_id, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc
) VALUES (?, ?, 'account', ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(feature_key, scope_kind, account_id) DO UPDATE SET enabled = excluded.enabled,
  daily_request_cap = excluded.daily_request_cap, daily_token_cap = excluded.daily_token_cap,
  daily_estimated_spend_cap_usd = excluded.daily_estimated_spend_cap_usd, updated_at_utc = excluded.updated_at_utc`).run(createCanonicalUuidV4(), featureKey, scope.userId, scope.workspaceId, accountId, input.enabled ? 1 : 0, value.dailyRequestCap, value.dailyTokenCap, value.dailyEstimatedSpendCapUsd, timestamp);
    return this.accountControl(scope, featureKey, accountId);
  }

  private platformControl(featureKey: CoachAiFeatureKey): CoachAiFeatureControl {
    const row = this.database.prepare<[CoachAiFeatureKey], ControlRow>(`SELECT feature_key, scope_kind, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc
FROM coach_ai_feature_controls WHERE feature_key = ? AND scope_kind = 'platform'`).get(featureKey);
    if (!row) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_feature_controls" });
    return controlRecord(row);
  }

  private accountControl(scope: WorkspaceAccessScope, featureKey: CoachAiFeatureKey, accountId: string): CoachAiFeatureControl {
    const control = this.accountControlOrNull(scope, featureKey, accountId);
    if (!control) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_feature_controls" });
    return control;
  }

  private accountControlOrNull(
    scope: WorkspaceAccessScope,
    featureKey: CoachAiFeatureKey,
    accountId: string,
  ): CoachAiFeatureControl | null {
    const row = this.database.prepare<[CoachAiFeatureKey, string, string], ControlRow>(`SELECT feature_key, scope_kind, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc FROM coach_ai_feature_controls
WHERE feature_key = ? AND scope_kind = 'account' AND workspace_id = ? AND account_id = ?`).get(featureKey, scope.workspaceId, accountId);
    return row ? controlRecord(row) : null;
  }

  reserveChatGeneration(scope: WorkspaceAccessScope, input: Readonly<{ conversationId: unknown; assistantMessageId: unknown; idempotencySha256: unknown; providerInputText: unknown; maxOutputTokens: unknown; additionalFeatureKey?: unknown }>, now = new Date()): Readonly<{ state: "reserved" | "blocked" | "idempotent"; attempt: CoachAiChatGenerationAttempt }> {
    const accountId = this.accountId(scope);
    if (typeof input.conversationId !== "string") platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "conversationId" });
    if (typeof input.assistantMessageId !== "string") platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "assistantMessageId" });
    assertCanonicalUuidV4(input.conversationId, "conversationId");
    assertCanonicalUuidV4(input.assistantMessageId, "assistantMessageId");
    if (typeof input.idempotencySha256 !== "string" || !DIGEST_PATTERN.test(input.idempotencySha256)) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "idempotencySha256" });
    if (typeof input.providerInputText !== "string") platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "providerInputText" });
    const maxInputTokens = Buffer.byteLength(input.providerInputText, "utf8");
    if (maxInputTokens < 1 || maxInputTokens > MAX_PROVIDER_INPUT_BYTES) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "providerInputText" });
    if (typeof input.maxOutputTokens !== "number" || !Number.isSafeInteger(input.maxOutputTokens) || input.maxOutputTokens < 1 || input.maxOutputTokens > MAX_OUTPUT_TOKENS) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "maxOutputTokens" });
    const idempotencySha256 = input.idempotencySha256 as string;
    const maxOutputTokens = input.maxOutputTokens as number;
    return this.transaction(() => {
      const existing = this.database.prepare<[string, string], AttemptRow>(`SELECT coach_ai_chat_generation_attempt_id,
  coach_ai_chat_conversation_id, coach_ai_chat_message_id, state, provider_key, model_id,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens, output_cost_usd_per_million_tokens,
  reserved_max_input_tokens, reserved_max_output_tokens, reserved_max_total_tokens, reserved_maximum_cost_usd,
  failure_code, reserved_at_utc, started_at_utc, finalized_at_utc
FROM coach_ai_chat_generation_attempts WHERE account_id = ? AND idempotency_sha256 = ?`).get(accountId, idempotencySha256);
      if (existing) {
        if (existing.coach_ai_chat_conversation_id !== input.conversationId || existing.coach_ai_chat_message_id !== input.assistantMessageId) {
          platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field: "idempotencySha256" });
        }
        return Object.freeze({ state: "idempotent" as const, attempt: this.attemptRecord(existing) });
      }
      const settings = this.readChatSettings();
      const additionalFeatureKey = input.additionalFeatureKey === undefined
        ? null
        : feature(input.additionalFeatureKey);
      const platformControls = [
        this.platformControl("ai_chat"),
        ...(additionalFeatureKey && additionalFeatureKey !== "ai_chat"
          ? [this.platformControl(additionalFeatureKey)]
          : []),
      ];
      if (platformControls.some((control) => !control.enabled || control.caps.dailyRequestCap === null ||
          control.caps.dailyTokenCap === null || control.caps.dailyEstimatedSpendCapUsd === null)) {
        platformFailure("TRADERLINK_COACH_CHAT_UNAVAILABLE");
      }
      const possibleAccountControls = [
        this.accountControlOrNull(scope, "ai_chat", accountId),
        ...(additionalFeatureKey && additionalFeatureKey !== "ai_chat"
          ? [this.accountControlOrNull(scope, additionalFeatureKey, accountId)]
          : []),
      ];
      if (possibleAccountControls.some((control) => control === null)) {
        platformFailure("TRADERLINK_COACH_CHAT_UNAVAILABLE");
      }
      const accountControls = possibleAccountControls as readonly CoachAiFeatureControl[];
      if (accountControls.some((control) => !control.enabled || control.caps.dailyRequestCap === null ||
          control.caps.dailyTokenCap === null || control.caps.dailyEstimatedSpendCapUsd === null) ||
          settings.inputCostUsdPerMillionTokens === null ||
          settings.cachedInputCostUsdPerMillionTokens === null ||
          settings.cacheWriteInputCostUsdPerMillionTokens === null ||
          settings.outputCostUsdPerMillionTokens === null) {
        platformFailure("TRADERLINK_COACH_CHAT_UNAVAILABLE");
      }
      const platformRequestCap = Math.min(...platformControls.map((control) => control.caps.dailyRequestCap!));
      const accountRequestCap = Math.min(...accountControls.map((control) => control.caps.dailyRequestCap!));
      const platformTokenCap = Math.min(...platformControls.map((control) => control.caps.dailyTokenCap!));
      const accountTokenCap = Math.min(...accountControls.map((control) => control.caps.dailyTokenCap!));
      const minimumSpendCap = (values: readonly CoachAiFeatureControl[]): string =>
        values.map((control) => control.caps.dailyEstimatedSpendCapUsd!)
          .reduce((minimum, value) => new ExactDecimal(value).lt(minimum) ? value : minimum);
      const platformSpendCap = minimumSpendCap(platformControls);
      const accountSpendCap = minimumSpendCap(accountControls);
      const maxTotalTokens = maxInputTokens + maxOutputTokens;
      const maxCost = reservedMoney(
        maxInputTokens,
        maxOutputTokens,
        settings.inputCostUsdPerMillionTokens,
        settings.cachedInputCostUsdPerMillionTokens,
        settings.cacheWriteInputCostUsdPerMillionTokens,
        settings.outputCostUsdPerMillionTokens,
      );
      const day = easternCalendarDate(now);
      const totals = this.database.prepare<[string], Readonly<{ requests: number; tokens: number }>>(`SELECT COUNT(*) AS requests,
  COALESCE(SUM(CASE WHEN state = 'blocked' THEN 0 WHEN actual_total_tokens IS NULL THEN reserved_max_total_tokens ELSE actual_total_tokens END), 0) AS tokens
FROM coach_ai_chat_generation_attempts WHERE eastern_calendar_date = ?`).get(day) ?? { requests: 0, tokens: 0 };
      const accountTotals = this.database.prepare<[string, string], Readonly<{ requests: number; tokens: number }>>(`SELECT COUNT(*) AS requests,
  COALESCE(SUM(CASE WHEN state = 'blocked' THEN 0 WHEN actual_total_tokens IS NULL THEN reserved_max_total_tokens ELSE actual_total_tokens END), 0) AS tokens
FROM coach_ai_chat_generation_attempts WHERE account_id = ? AND eastern_calendar_date = ?`).get(accountId, day) ?? { requests: 0, tokens: 0 };
      const spendRows = this.database.prepare<[string], Readonly<{ value: string | null }>>(`SELECT CASE WHEN state = 'blocked' THEN '0' WHEN actual_cost_usd IS NULL THEN reserved_maximum_cost_usd ELSE actual_cost_usd END AS value FROM coach_ai_chat_generation_attempts WHERE eastern_calendar_date = ?`).all(day);
      const accountSpendRows = this.database.prepare<[string, string], Readonly<{ value: string | null }>>(`SELECT CASE WHEN state = 'blocked' THEN '0' WHEN actual_cost_usd IS NULL THEN reserved_maximum_cost_usd ELSE actual_cost_usd END AS value FROM coach_ai_chat_generation_attempts WHERE account_id = ? AND eastern_calendar_date = ?`).all(accountId, day);
      const spend = spendRows.reduce((sum, row) => sum.plus(row.value ?? "0"), new ExactDecimal(0));
      const accountSpend = accountSpendRows.reduce((sum, row) => sum.plus(row.value ?? "0"), new ExactDecimal(0));
      const blocked = totals.requests + 1 > platformRequestCap || accountTotals.requests + 1 > accountRequestCap ||
        totals.tokens + maxTotalTokens > platformTokenCap || accountTotals.tokens + maxTotalTokens > accountTokenCap ||
        spend.plus(maxCost).gt(platformSpendCap) || accountSpend.plus(maxCost).gt(accountSpendCap);
      const attemptId = createCanonicalUuidV4();
      const timestamp = createCanonicalUtcTimestamp(now);
      this.database.prepare(`INSERT INTO coach_ai_chat_generation_attempts (
  coach_ai_chat_generation_attempt_id, user_id, workspace_id, account_id, coach_ai_chat_conversation_id,
  coach_ai_chat_message_id, idempotency_sha256, eastern_calendar_date, provider_key, model_id,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens, output_cost_usd_per_million_tokens, reserved_max_input_tokens,
  reserved_max_output_tokens, reserved_max_total_tokens, reserved_maximum_cost_usd, state, failure_code,
  actual_input_tokens, actual_cached_input_tokens, actual_cache_write_input_tokens, actual_output_tokens,
  actual_total_tokens, actual_cost_usd, reserved_at_utc, started_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, NULL, ?)`).run(
        attemptId, scope.userId, scope.workspaceId, accountId, input.conversationId,
        input.assistantMessageId, idempotencySha256, day, settings.providerKey, settings.modelId,
        settings.inputCostUsdPerMillionTokens, settings.cachedInputCostUsdPerMillionTokens,
        settings.cacheWriteInputCostUsdPerMillionTokens, settings.outputCostUsdPerMillionTokens,
        maxInputTokens, maxOutputTokens, maxTotalTokens, maxCost,
        blocked ? "blocked" : "reserved",
        blocked ? "TRADERLINK_COACH_CHAT_DAILY_CAP_REACHED" : null,
        timestamp, blocked ? timestamp : null,
      );
      const attempt = this.attempt(scope, attemptId, accountId);
      return Object.freeze({ state: blocked ? "blocked" as const : "reserved" as const, attempt });
    });
  }

  markProviderStarted(scope: WorkspaceAccessScope, attemptId: string, now = new Date()): CoachAiChatGenerationAttempt {
    const accountId = this.accountId(scope); assertCanonicalUuidV4(attemptId, "attemptId");
    const result = this.database.prepare(`UPDATE coach_ai_chat_generation_attempts SET state = 'started', started_at_utc = ?
WHERE coach_ai_chat_generation_attempt_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ? AND state = 'reserved'`).run(createCanonicalUtcTimestamp(now), attemptId, scope.userId, scope.workspaceId, accountId);
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.attempt(scope, attemptId, accountId);
  }

  finalizeFromChatReceipt(scope: WorkspaceAccessScope, attemptId: string, state: "completed" | "failed", failureCode: string | null, now = new Date()): CoachAiChatGenerationAttempt {
    const accountId = this.accountId(scope); assertCanonicalUuidV4(attemptId, "attemptId");
    if ((state === "completed" && failureCode !== null) || (state === "failed" && (typeof failureCode !== "string" || !/^[A-Z][A-Z0-9_]{0,95}$/u.test(failureCode)))) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "failureCode" });
    const receipt = this.database.prepare<[string, string, string, string], ReceiptFinalizationRow>(`SELECT
  receipt.input_tokens, receipt.cached_input_tokens, receipt.cache_write_input_tokens,
  receipt.output_tokens, receipt.total_tokens, receipt.estimated_cost_usd,
  message.generation_state AS message_state, receipt.provider_key AS receipt_provider_key, receipt.model_id AS receipt_model_id,
  receipt.input_cost_usd_per_million_tokens AS receipt_input_rate,
  receipt.cached_input_cost_usd_per_million_tokens AS receipt_cached_input_rate,
  receipt.cache_write_input_cost_usd_per_million_tokens AS receipt_cache_write_input_rate,
  receipt.output_cost_usd_per_million_tokens AS receipt_output_rate,
  attempt.provider_key AS attempt_provider_key, attempt.model_id AS attempt_model_id,
  attempt.input_cost_usd_per_million_tokens AS attempt_input_rate,
  attempt.cached_input_cost_usd_per_million_tokens AS attempt_cached_input_rate,
  attempt.cache_write_input_cost_usd_per_million_tokens AS attempt_cache_write_input_rate,
  attempt.output_cost_usd_per_million_tokens AS attempt_output_rate,
  attempt.reserved_max_input_tokens, attempt.reserved_max_output_tokens, attempt.reserved_max_total_tokens, attempt.reserved_maximum_cost_usd
FROM coach_ai_chat_generation_attempts attempt JOIN coach_ai_chat_messages message ON message.coach_ai_chat_message_id = attempt.coach_ai_chat_message_id
JOIN coach_ai_chat_generation_receipts receipt ON receipt.coach_ai_chat_message_id = attempt.coach_ai_chat_message_id
WHERE attempt.coach_ai_chat_generation_attempt_id = ? AND attempt.user_id = ? AND attempt.workspace_id = ? AND attempt.account_id = ?
  AND receipt.input_tokens IS NOT NULL AND receipt.cached_input_tokens IS NOT NULL
  AND receipt.cache_write_input_tokens IS NOT NULL AND receipt.output_tokens IS NOT NULL
  AND receipt.total_tokens IS NOT NULL AND receipt.estimated_cost_usd IS NOT NULL`).get(attemptId, scope.userId, scope.workspaceId, accountId);
    if (!receipt || receipt.message_state !== state ||
      receipt.receipt_provider_key !== receipt.attempt_provider_key ||
      receipt.receipt_model_id !== receipt.attempt_model_id ||
      receipt.receipt_input_rate !== receipt.attempt_input_rate ||
      receipt.receipt_cached_input_rate !== receipt.attempt_cached_input_rate ||
      receipt.receipt_cache_write_input_rate !== receipt.attempt_cache_write_input_rate ||
      receipt.receipt_output_rate !== receipt.attempt_output_rate ||
      receipt.cached_input_tokens + receipt.cache_write_input_tokens > receipt.input_tokens ||
      receipt.input_tokens > receipt.reserved_max_input_tokens ||
      receipt.output_tokens > receipt.reserved_max_output_tokens ||
      receipt.total_tokens > receipt.reserved_max_total_tokens ||
      new ExactDecimal(receipt.estimated_cost_usd).gt(receipt.reserved_maximum_cost_usd)) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_chat_generation_receipts" });
    }
    const result = this.database.prepare(`UPDATE coach_ai_chat_generation_attempts SET state = ?, failure_code = ?,
  actual_input_tokens = ?, actual_cached_input_tokens = ?, actual_cache_write_input_tokens = ?,
  actual_output_tokens = ?, actual_total_tokens = ?, actual_cost_usd = ?, finalized_at_utc = ?
WHERE coach_ai_chat_generation_attempt_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ? AND state = 'started'`).run(
      state, failureCode, receipt.input_tokens, receipt.cached_input_tokens,
      receipt.cache_write_input_tokens, receipt.output_tokens, receipt.total_tokens,
      receipt.estimated_cost_usd, createCanonicalUtcTimestamp(now), attemptId,
      scope.userId, scope.workspaceId, accountId,
    );
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.attempt(scope, attemptId, accountId);
  }

  failStartedWithoutUsage(scope: WorkspaceAccessScope, attemptId: string, failureCode: string, now = new Date()): CoachAiChatGenerationAttempt {
    const accountId = this.accountId(scope); assertCanonicalUuidV4(attemptId, "attemptId");
    if (!/^[A-Z][A-Z0-9_]{0,95}$/u.test(failureCode)) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "failureCode" });
    const result = this.database.prepare(`UPDATE coach_ai_chat_generation_attempts SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_chat_generation_attempt_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ? AND state = 'started'`).run(failureCode, createCanonicalUtcTimestamp(now), attemptId, scope.userId, scope.workspaceId, accountId);
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.attempt(scope, attemptId, accountId);
  }

  private attempt(scope: WorkspaceAccessScope, attemptId: string, accountId: string): CoachAiChatGenerationAttempt {
    const row = this.database.prepare<[string, string, string, string], AttemptRow>(`SELECT coach_ai_chat_generation_attempt_id,
  coach_ai_chat_conversation_id, coach_ai_chat_message_id, state, provider_key, model_id,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens, output_cost_usd_per_million_tokens,
  reserved_max_input_tokens, reserved_max_output_tokens, reserved_max_total_tokens, reserved_maximum_cost_usd,
  failure_code, reserved_at_utc, started_at_utc, finalized_at_utc
FROM coach_ai_chat_generation_attempts WHERE coach_ai_chat_generation_attempt_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(attemptId, scope.userId, scope.workspaceId, accountId);
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED"); return this.attemptRecord(row);
  }

  private attemptRecord(row: AttemptRow): CoachAiChatGenerationAttempt {
    return Object.freeze({
      attemptId: row.coach_ai_chat_generation_attempt_id,
      conversationId: row.coach_ai_chat_conversation_id,
      assistantMessageId: row.coach_ai_chat_message_id,
      state: row.state,
      providerKey: row.provider_key,
      modelId: row.model_id,
      inputCostUsdPerMillionTokens: row.input_cost_usd_per_million_tokens,
      cachedInputCostUsdPerMillionTokens: row.cached_input_cost_usd_per_million_tokens,
      cacheWriteInputCostUsdPerMillionTokens: row.cache_write_input_cost_usd_per_million_tokens,
      outputCostUsdPerMillionTokens: row.output_cost_usd_per_million_tokens,
      maximumInputTokens: row.reserved_max_input_tokens,
      maximumOutputTokens: row.reserved_max_output_tokens,
      maximumTotalTokens: row.reserved_max_total_tokens,
      maximumCostUsd: row.reserved_maximum_cost_usd,
      reservedAtUtc: row.reserved_at_utc,
      startedAtUtc: row.started_at_utc,
      finalizedAtUtc: row.finalized_at_utc,
      failureCode: row.failure_code,
    });
  }
}
