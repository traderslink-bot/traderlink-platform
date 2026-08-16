import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import {
  createCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from
  "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from
  "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachAiChatProviderControlsRepository } from
  "../modules/coach/server/coach-ai-chat-provider-controls-repository";
import { CoachAiChatRepository } from
  "../modules/coach/server/coach-ai-chat-repository";

const NOW = "2026-08-16T16:00:00.000Z";
const MIGRATION_ID = "0058_coach_ai_chat_cache_accounting";
const AFFECTED_TABLES = Object.freeze([
  "coach_ai_chat_provider_settings",
  "coach_ai_chat_generation_attempts",
  "coach_ai_chat_generation_receipts",
] as const);

function countRows(
  database: Database.Database,
): Readonly<Record<(typeof AFFECTED_TABLES)[number], number>> {
  return Object.freeze(Object.fromEntries(AFFECTED_TABLES.map((table) => [
    table,
    database.prepare<[], { count: number }>(
      `SELECT COUNT(*) AS count FROM ${table}`,
    ).get()!.count,
  ])) as Record<(typeof AFFECTED_TABLES)[number], number>);
}

function hasColumn(database: Database.Database, table: string, column: string): boolean {
  return (database.pragma(`table_info(${table})`) as readonly Readonly<{
    name: string;
  }>[]).some((candidate) => candidate.name === column);
}

function rejects(operation: () => void): boolean {
  try {
    operation();
    return false;
  } catch {
    return true;
  }
}

function seedScope(database: Database.Database): WorkspaceAccessScope {
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'development_local', ?, 'Cache verifier', 'active', ?, ?)`)
    .run(userId, `cache-verifier-${userId}`, NOW, NOW);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Cache verifier', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, NOW, NOW);
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, NOW, NOW);
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Cache verifier', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, NOW, NOW);
  return Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([accountId]),
    activeAccountId: accountId,
  });
}

function verifyRuntimeAccounting(): Readonly<{
  incompletePricingRejected: boolean;
  clearingEnabledPricingRejected: boolean;
  exactReceiptCost: boolean;
}> {
  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys = ON");
    runPlatformMigrations(database, {
      manifest: platformMigrationManifest,
      now: () => new Date(NOW),
    });
    const scope = seedScope(database);
    const controls = new CoachAiChatProviderControlsRepository(database);
    const chat = new CoachAiChatRepository(database);
    const incompletePricingRejected = rejects(() => {
      controls.savePlatformFeatureControl({
        featureKey: "ai_chat",
        enabled: true,
        dailyRequestCap: 10,
        dailyTokenCap: 10_000,
        dailyEstimatedSpendCapUsd: "10",
      });
    });
    controls.saveChatSettings({
      modelId: "gpt-cache-verifier",
      inputCostUsdPerMillionTokens: "1.5",
      cachedInputCostUsdPerMillionTokens: "0.15",
      cacheWriteInputCostUsdPerMillionTokens: "1.875",
      outputCostUsdPerMillionTokens: "2",
    });
    controls.savePlatformFeatureControl({
      featureKey: "ai_chat",
      enabled: true,
      dailyRequestCap: 10,
      dailyTokenCap: 10_000,
      dailyEstimatedSpendCapUsd: "10",
    });
    const clearingEnabledPricingRejected = rejects(() => {
      controls.saveChatSettings({
        modelId: "gpt-cache-verifier",
        inputCostUsdPerMillionTokens: null,
        cachedInputCostUsdPerMillionTokens: null,
        cacheWriteInputCostUsdPerMillionTokens: null,
        outputCostUsdPerMillionTokens: null,
      });
    });
    const conversation = chat.createConversation(
      scope,
      "Cache accounting verification",
      new Date(NOW),
    );
    const reserved = chat.appendUserMessageAndReserveAssistant(
      scope,
      conversation.conversationId,
      { originalUserTextPrivate: "Verify cache accounting." },
      new Date(NOW),
    );
    const completed = chat.finalizeAssistantSuccess(
      scope,
      reserved.assistantMessage.messageId,
      {
        assistantTextPrivate: "Cache accounting verified.",
        snapshotContractVersion: "traderlink_coach_ai_chat_snapshot_v1",
        factualSnapshot: { coverage: "verification" },
        receipt: {
          providerKey: "openai_direct",
          modelId: "gpt-cache-verifier",
          usage: {
            inputTokens: 10,
            cachedInputTokens: 3,
            cacheWriteInputTokens: 2,
            outputTokens: 5,
            totalTokens: 15,
          },
          inputCostUsdPerMillionTokens: "1.5",
          cachedInputCostUsdPerMillionTokens: "0.15",
          cacheWriteInputCostUsdPerMillionTokens: "1.875",
          outputCostUsdPerMillionTokens: "2",
        },
      },
      new Date(NOW),
    );
    return Object.freeze({
      incompletePricingRejected,
      clearingEnabledPricingRejected,
      exactReceiptCost: completed.receipt.estimatedCostUsd === "0.0000217",
    });
  } finally {
    database.close();
  }
}

async function main(): Promise<void> {
  const configuration = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-chat-cache-"));
  const copyPath = join(temporaryRoot, "migration-check.sqlite");
  const source = new Database(configuration.databasePath, {
    fileMustExist: true,
    readonly: true,
  });
  try {
    await source.backup(copyPath);
  } finally {
    source.close();
  }

  try {
    const copy = new Database(copyPath, { fileMustExist: true });
    try {
      copy.pragma("foreign_keys = ON");
      const beforeCounts = countRows(copy);
      const beforeSettings = copy.prepare<[], Readonly<{
        model_id: string;
        input_rate: string | null;
        output_rate: string | null;
      }>>(`SELECT model_id, input_cost_usd_per_million_tokens AS input_rate,
  output_cost_usd_per_million_tokens AS output_rate
FROM coach_ai_chat_provider_settings WHERE settings_key = 'ai_chat'`).get();
      const result = runPlatformMigrations(copy, { manifest: platformMigrationManifest });
      const afterCounts = countRows(copy);
      const afterSettings = copy.prepare<[], Readonly<{
        model_id: string;
        input_rate: string | null;
        cached_rate: string | null;
        cache_write_rate: string | null;
        output_rate: string | null;
      }>>(`SELECT model_id, input_cost_usd_per_million_tokens AS input_rate,
  cached_input_cost_usd_per_million_tokens AS cached_rate,
  cache_write_input_cost_usd_per_million_tokens AS cache_write_rate,
  output_cost_usd_per_million_tokens AS output_rate
FROM coach_ai_chat_provider_settings WHERE settings_key = 'ai_chat'`).get();
      const columnsPresent = [
        ["coach_ai_chat_provider_settings", "cached_input_cost_usd_per_million_tokens"],
        ["coach_ai_chat_provider_settings", "cache_write_input_cost_usd_per_million_tokens"],
        ["coach_ai_chat_generation_attempts", "actual_cached_input_tokens"],
        ["coach_ai_chat_generation_attempts", "actual_cache_write_input_tokens"],
        ["coach_ai_chat_generation_receipts", "cached_input_tokens"],
        ["coach_ai_chat_generation_receipts", "cache_write_input_tokens"],
      ].every(([table, column]) => hasColumn(copy, table!, column!));
      const runtime = verifyRuntimeAccounting();
      const evidence = Object.freeze({
        appliedThisRun: result.appliedMigrationIds,
        schemaAlreadyCurrent: result.appliedMigrationIds.length === 0,
        columnsPresent,
        existingRowsPreserved: JSON.stringify(beforeCounts) === JSON.stringify(afterCounts),
        existingSettingsPreserved: beforeSettings?.model_id === afterSettings?.model_id &&
          beforeSettings?.input_rate === afterSettings?.input_rate &&
          beforeSettings?.output_rate === afterSettings?.output_rate,
        newRatesNotInvented: afterSettings?.cached_rate === null &&
          afterSettings.cache_write_rate === null,
        foreignKeysClean: (copy.pragma("foreign_key_check") as unknown[]).length === 0,
        quickCheck: (copy.pragma("quick_check") as ReadonlyArray<Readonly<{
          quick_check: string;
        }>>)[0]?.quick_check === "ok",
        ...runtime,
      });
      const migrationStateValid = evidence.schemaAlreadyCurrent ||
        (evidence.appliedThisRun.length === 1 &&
          evidence.appliedThisRun[0] === MIGRATION_ID);
      const valid = migrationStateValid &&
        Object.entries(evidence).every(([key, value]) =>
          key === "appliedThisRun" || key === "schemaAlreadyCurrent" || value === true);
      process.stdout.write(`${JSON.stringify({ ...evidence, valid })}\n`);
      if (!valid) process.exitCode = 1;
    } finally {
      copy.close();
    }
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

void main();
