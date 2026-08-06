import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type {
  CoachAiChatProviderSettings,
  CoachAiCostAggregation,
} from "@/src/modules/coach/contracts/ai-provider-controls-contracts";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import type { PlatformAdminReferenceKeyConfiguration } from "@/src/modules/platform/server/administration/platform-admin-reference-authority";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  createJournalAdminReadContext,
  journalAdminReference,
  resolveJournalAdminInternalId,
} from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";
import { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";

const ExactDecimal = Decimal.clone({ precision: 80, toExpNeg: -1000, toExpPos: 1000 });
const PRICE_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/u;

const CHAT_ADMINISTRATION_TABLES = Object.freeze([
  "coach_ai_chat_provider_settings",
  "coach_ai_feature_controls",
  "coach_ai_chat_generation_attempts",
  "coach_ai_chat_generation_receipts",
]);

type AccountRow = Readonly<{
  account_id: string;
  display_name: string;
  status: "active" | "archived";
  workspace_id: string;
  created_by_user_id: string;
}>;

type ControlRow = Readonly<{
  feature_key: "ai_chat";
  scope_kind: "platform" | "account";
  enabled: number;
  daily_request_cap: number | null;
  daily_token_cap: number | null;
  daily_estimated_spend_cap_usd: string | null;
  updated_at_utc: string;
}>;

type JoinedAccountRow = Readonly<AccountRow & {
  feature_key: "ai_chat" | null;
  scope_kind: "account" | null;
  enabled: number | null;
  daily_request_cap: number | null;
  daily_token_cap: number | null;
  daily_estimated_spend_cap_usd: string | null;
  updated_at_utc: string | null;
}>;

export type CoachAiChatAdminFeatureControl = Readonly<{
  enabled: boolean;
  dailyRequestCap: number | null;
  dailyTokenCap: number | null;
  dailyEstimatedSpendCapUsd: string | null;
}>;

export type CoachAiChatAdminAccount = Readonly<{
  accountRef: string;
  displayName: string;
  control: CoachAiChatAdminFeatureControl | null;
}>;

export type CoachAiChatAdminCostTotals = Readonly<{
  requestCount: number;
  blockedRequestCount: number;
  failedRequestCount: number;
  totalTokens: number;
  estimatedCostUsd: string | null;
}>;

export type CoachAiChatAdminState = Readonly<{
  settings: CoachAiChatProviderSettings;
  platformControl: CoachAiChatAdminFeatureControl;
  accounts: readonly CoachAiChatAdminAccount[];
  costs: CoachAiChatAdminCostTotals;
}>;

function controlRecord(row: ControlRow): CoachAiChatAdminFeatureControl {
  return Object.freeze({
    enabled: row.enabled === 1,
    dailyRequestCap: row.daily_request_cap,
    dailyTokenCap: row.daily_token_cap,
    dailyEstimatedSpendCapUsd: row.daily_estimated_spend_cap_usd,
  });
}

function validateControl(input: Readonly<{
  enabled: unknown;
  dailyRequestCap: unknown;
  dailyTokenCap: unknown;
  dailyEstimatedSpendCapUsd: unknown;
}>): Readonly<{
  enabled: boolean;
  dailyRequestCap: number | null;
  dailyTokenCap: number | null;
  dailyEstimatedSpendCapUsd: string | null;
}> {
  if (typeof input.enabled !== "boolean") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "enabled" });
  }
  const request = input.dailyRequestCap === "" || input.dailyRequestCap === null || input.dailyRequestCap === undefined
    ? null
    : input.dailyRequestCap;
  const tokens = input.dailyTokenCap === "" || input.dailyTokenCap === null || input.dailyTokenCap === undefined
    ? null
    : input.dailyTokenCap;
  const spend = input.dailyEstimatedSpendCapUsd === "" || input.dailyEstimatedSpendCapUsd === null || input.dailyEstimatedSpendCapUsd === undefined
    ? null
    : input.dailyEstimatedSpendCapUsd;
  if (request === null || tokens === null || spend === null) {
    if (request !== null || tokens !== null || spend !== null) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "dailyCaps" });
    }
    return Object.freeze({ enabled: input.enabled, dailyRequestCap: null, dailyTokenCap: null, dailyEstimatedSpendCapUsd: null });
  }
  if (!Number.isSafeInteger(request) || request <= 0 || !Number.isSafeInteger(tokens) || tokens <= 0 ||
    typeof spend !== "string" || !PRICE_PATTERN.test(spend) || new ExactDecimal(spend).lte(0)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "dailyCaps" });
  }
  return Object.freeze({ enabled: input.enabled, dailyRequestCap: request, dailyTokenCap: tokens, dailyEstimatedSpendCapUsd: spend });
}

function totals(rows: readonly CoachAiCostAggregation[]): CoachAiChatAdminCostTotals {
  const chatRows = rows.filter((row) => row.featureKey === "ai_chat");
  const costs = chatRows.flatMap((row) => row.estimatedCostUsd === null ? [] : [new ExactDecimal(row.estimatedCostUsd)]);
  return Object.freeze({
    requestCount: chatRows.reduce((sum, row) => sum + row.requestCount, 0),
    blockedRequestCount: chatRows.reduce((sum, row) => sum + row.blockedRequestCount, 0),
    failedRequestCount: chatRows.reduce((sum, row) => sum + row.failedRequestCount, 0),
    totalTokens: chatRows.reduce((sum, row) => sum + row.totalTokens, 0),
    estimatedCostUsd: costs.length === 0 ? null : costs.reduce((sum, value) => sum.plus(value), new ExactDecimal(0))
      .toFixed(12).replace(/\.?0+$/u, "") || "0",
  });
}

export function isCoachAiChatAdministrationSchemaAvailable(database: Database.Database): boolean {
  const rows = database.prepare<[], { name: string }>(`SELECT name FROM sqlite_schema WHERE type = 'table' AND name IN (${CHAT_ADMINISTRATION_TABLES.map(() => "?").join(", ")})`).all(...CHAT_ADMINISTRATION_TABLES);
  return rows.length === CHAT_ADMINISTRATION_TABLES.length;
}

export class CoachAiChatAdministrationRepository {
  private readonly context;
  private readonly controls: CoachAiChatProviderControlsRepository;

  constructor(input: Readonly<{
    database: Database.Database;
    scope: JournalAdminScope;
    configuration?: PlatformAdminReferenceKeyConfiguration;
  }>) {
    this.context = createJournalAdminReadContext(input);
    this.controls = new CoachAiChatProviderControlsRepository(input.database);
  }

  read(): CoachAiChatAdminState {
    const platformRow = this.context.database.prepare<[], ControlRow>(`SELECT feature_key, scope_kind, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc
FROM coach_ai_feature_controls WHERE feature_key = 'ai_chat' AND scope_kind = 'platform'`).get();
    if (!platformRow) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_feature_controls" });
    const accounts = this.context.database.prepare<[], JoinedAccountRow>(`SELECT account.account_id,
  account.display_name, account.status, account.workspace_id, account.created_by_user_id,
  control.feature_key, control.scope_kind, control.enabled, control.daily_request_cap,
  control.daily_token_cap, control.daily_estimated_spend_cap_usd, control.updated_at_utc
FROM journal_accounts account
LEFT JOIN coach_ai_feature_controls control
  ON control.feature_key = 'ai_chat' AND control.scope_kind = 'account' AND control.account_id = account.account_id
WHERE account.status = 'active'
ORDER BY account.display_name, account.account_id`).all()
      .map((row) => Object.freeze({
        accountRef: journalAdminReference(this.context, "account", row.account_id),
        displayName: row.display_name,
        control: row.feature_key === "ai_chat"
          ? controlRecord({
            feature_key: "ai_chat",
            scope_kind: "account",
            enabled: row.enabled ?? 0,
            daily_request_cap: row.daily_request_cap,
            daily_token_cap: row.daily_token_cap,
            daily_estimated_spend_cap_usd: row.daily_estimated_spend_cap_usd,
            updated_at_utc: row.updated_at_utc ?? "",
          })
          : null,
      }));
    return Object.freeze({
      settings: this.controls.readChatSettings(),
      platformControl: controlRecord(platformRow),
      accounts: Object.freeze(accounts),
      costs: totals(new CoachAiProviderSettingsRepository(this.context.database).readCostAggregation()),
    });
  }

  saveSettings(input: Readonly<{ modelId: unknown; inputCostUsdPerMillionTokens: unknown; outputCostUsdPerMillionTokens: unknown }>): CoachAiChatProviderSettings {
    return this.controls.saveChatSettings(input);
  }

  savePlatformControl(input: Readonly<{ enabled: unknown; dailyRequestCap: unknown; dailyTokenCap: unknown; dailyEstimatedSpendCapUsd: unknown }>): CoachAiChatAdminFeatureControl {
    const normalized = validateControl(input);
    return this.controls.savePlatformFeatureControl({ featureKey: "ai_chat", ...normalized });
  }

  saveAccountControl(accountRef: unknown, input: Readonly<{ enabled: unknown; dailyRequestCap: unknown; dailyTokenCap: unknown; dailyEstimatedSpendCapUsd: unknown }>): CoachAiChatAdminFeatureControl {
    if (typeof accountRef !== "string") platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "accountRef" });
    const accountId = resolveJournalAdminInternalId(this.context, accountRef, ["account"]).internalId;
    const account = this.context.database.prepare<[string], AccountRow>(`SELECT account_id, display_name, status, workspace_id, created_by_user_id
FROM journal_accounts WHERE account_id = ? AND status = 'active'`).get(accountId);
    if (!account) platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    const normalized = validateControl(input);
    const membership = this.context.database.prepare<[string], Readonly<{ user_id: string }>>(`SELECT membership.user_id
FROM platform_workspace_memberships membership
JOIN platform_users user ON user.user_id = membership.user_id
WHERE membership.workspace_id = ? AND membership.status = 'active' AND user.status = 'active'
ORDER BY CASE membership.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
  membership.user_id ASC LIMIT 1`).get(account.workspace_id);
    if (!membership) platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    this.context.database.prepare(`INSERT INTO coach_ai_feature_controls (
  coach_ai_feature_control_id, feature_key, scope_kind, user_id, workspace_id, account_id, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc
) VALUES (?, 'ai_chat', 'account', ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(feature_key, scope_kind, account_id) DO UPDATE SET enabled = excluded.enabled,
  daily_request_cap = excluded.daily_request_cap, daily_token_cap = excluded.daily_token_cap,
  daily_estimated_spend_cap_usd = excluded.daily_estimated_spend_cap_usd, updated_at_utc = excluded.updated_at_utc`).run(
      createCanonicalUuidV4(),
      membership.user_id,
      account.workspace_id,
      account.account_id,
      normalized.enabled ? 1 : 0,
      normalized.dailyRequestCap,
      normalized.dailyTokenCap,
      normalized.dailyEstimatedSpendCapUsd,
      createCanonicalUtcTimestamp(this.context.now),
    );
    const row = this.context.database.prepare<[string], ControlRow>(`SELECT feature_key, scope_kind, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc
FROM coach_ai_feature_controls WHERE feature_key = 'ai_chat' AND scope_kind = 'account' AND account_id = ?`).get(account.account_id);
    if (!row) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_feature_controls" });
    return controlRecord(row);
  }
}
