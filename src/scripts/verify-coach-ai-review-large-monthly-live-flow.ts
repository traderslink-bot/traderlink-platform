import { readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { loadEnvConfig } from "@next/env";
import Database from "better-sqlite3";
import Decimal from "decimal.js";

import type { CoachMonthlyAiReviewInputV2 } from
  "@/src/modules/coach/contracts/monthly-ai-review-input-contracts";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { CoachAiProviderSettingsRepository } from
  "@/src/modules/coach/server/coach-ai-provider-settings-repository";
import { CoachAiChatProviderControlsRepository } from
  "@/src/modules/coach/server/coach-ai-chat-provider-controls-repository";
import { CoachAiReviewProviderControlsRepository } from
  "@/src/modules/coach/server/coach-ai-review-provider-controls-repository";
import {
  CoachAiReviewRepository,
  calculateCoachAiReviewEstimatedCost,
} from "@/src/modules/coach/server/coach-ai-review-repository";
import { CoachMonthlyAiReviewIssuanceService } from
  "@/src/modules/coach/server/coach-monthly-ai-review-issuance-service";
import { buildCoachMonthlyAiReviewProviderEnvelopeV2 } from
  "@/src/modules/coach/server/coach-monthly-ai-review-openai-adapter";
import { WhopAiReviewEntitlementRepository } from
  "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import { createCanonicalUuidV4 } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from
  "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from
  "@/src/modules/platform/server/database/run-platform-migrations";

const CONFIRMATION = "--confirm-disposable-large-monthly-provider-call";
const ARTIFACT_ARGUMENT = "--input-artifact";
const ExactDecimal = Decimal.clone({ precision: 80 });
const NOW = new Date("2026-08-18T20:30:00.000Z");

type BenchmarkArtifact = Readonly<{
  monthlyScenario: string;
  profiles: readonly Readonly<{
    monthlyInput: CoachMonthlyAiReviewInputV2;
  }>[];
}>;

type ReceiptRow = Readonly<{
  attempt_count: number;
  receipt_count: number;
  reservation_count: number;
  reservation_state: string | null;
  reserved_max_input_tokens: number | null;
  reserved_max_total_tokens: number | null;
  reserved_maximum_cost_usd: string | null;
  input_tokens: number | null;
  cached_input_tokens: number | null;
  cache_write_input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  estimated_cost_usd: string | null;
}>;

function artifactPath(): string {
  const index = process.argv.indexOf(ARTIFACT_ARGUMENT);
  if (index < 0 || !process.argv[index + 1]) {
    throw new Error("large_monthly_live_flow_artifact_required");
  }
  return resolve(process.argv[index + 1]);
}

function configureDisposableControls(database: Database.Database, now: Date): void {
  database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = '5',
  per_subscriber_paid_cycle_estimated_spend_cap_usd = '5',
  emergency_trailing_30_day_estimated_spend_cap_usd = NULL,
  updated_at_utc = ?
WHERE control_key = 'ai_reviews'`).run(now.toISOString());
  const controls = new CoachAiChatProviderControlsRepository(database);
  for (const featureKey of ["weekly_reviews", "monthly_reviews"] as const) {
    controls.savePlatformFeatureControl({
      featureKey,
      enabled: true,
      dailyRequestCap: 10,
      dailyTokenCap: 2_000_000,
      dailyEstimatedSpendCapUsd: "5",
    }, now);
  }
}

function createSyntheticScope(database: Database.Database): WorkspaceAccessScope {
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  const at = NOW.toISOString();
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'development_local', ?, 'Large AI Review fixture', 'active', ?, ?)`)
    .run(userId, `large-ai-review-${userId}`, at, at);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'Large AI Review fixture', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, at, at);
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, at, at);
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Large AI Review fixture', 'USD', 'America/New_York',
  'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, at, at);
  const scope = Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([accountId]),
    activeAccountId: accountId,
  });
  const entitlement = new WhopAiReviewEntitlementRepository(database);
  entitlement.linkUser(userId, "1".repeat(64), NOW);
  entitlement.applyMembershipEvent(Object.freeze({
    webhookIdSha256: "2".repeat(64),
    payloadSha256: "3".repeat(64),
    eventType: "membership.activated" as const,
    eventAtUtc: at,
    membershipRefHmac: "4".repeat(64),
    whopUserRefHmac: "1".repeat(64),
    companyRefHmac: "5".repeat(64),
    productRefHmac: "6".repeat(64),
    membershipState: "active" as const,
    cancelAtPeriodEnd: false,
    renewalPeriodStartUtc: "2026-08-01T00:00:00.000Z",
    renewalPeriodEndUtc: "2026-09-01T00:00:00.000Z",
  }), NOW);
  return scope;
}

function receipt(database: Database.Database, requestId: string): ReceiptRow {
  return database.prepare<[string], ReceiptRow>(`SELECT
  COUNT(DISTINCT attempt.coach_ai_review_generation_attempt_id) AS attempt_count,
  COUNT(DISTINCT receipt.coach_ai_review_generation_attempt_receipt_id) AS receipt_count,
  COUNT(DISTINCT reservation.coach_ai_review_generation_control_reservation_id)
    AS reservation_count,
  MAX(reservation.state) AS reservation_state,
  MAX(reservation.reserved_max_input_tokens) AS reserved_max_input_tokens,
  MAX(reservation.reserved_max_total_tokens) AS reserved_max_total_tokens,
  MAX(reservation.reserved_maximum_cost_usd) AS reserved_maximum_cost_usd,
  MAX(receipt.input_tokens) AS input_tokens,
  MAX(receipt.cached_input_tokens) AS cached_input_tokens,
  MAX(receipt.cache_write_input_tokens) AS cache_write_input_tokens,
  MAX(receipt.output_tokens) AS output_tokens,
  MAX(receipt.total_tokens) AS total_tokens,
  MAX(receipt.estimated_cost_usd) AS estimated_cost_usd
FROM coach_ai_review_generation_attempts_v2 attempt
LEFT JOIN coach_ai_review_generation_attempt_receipts_v2 receipt
  ON receipt.coach_ai_review_generation_attempt_id =
    attempt.coach_ai_review_generation_attempt_id
LEFT JOIN coach_ai_review_generation_control_reservations_v2 reservation
  ON reservation.coach_ai_review_generation_attempt_id =
    attempt.coach_ai_review_generation_attempt_id
WHERE attempt.coach_ai_review_period_request_id = ?`).get(requestId)!;
}

async function main(): Promise<void> {
  if (!process.argv.includes(CONFIRMATION)) {
    throw new Error("large_monthly_live_flow_confirmation_required");
  }
  loadEnvConfig(process.cwd(), true);
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("large_monthly_live_flow_provider_key_missing");
  }
  const sourceArtifactPath = artifactPath();
  const artifact = JSON.parse(readFileSync(sourceArtifactPath, "utf8")) as
    BenchmarkArtifact;
  const artifactInput = artifact.profiles.at(0)?.monthlyInput;
  if (artifact.monthlyScenario !== "monthly_only_full_evidence" ||
      !artifactInput || artifactInput.contractVersion !==
        "traderlink_coach_monthly_ai_review_input_v2") {
    throw new Error("large_monthly_live_flow_artifact_mismatch");
  }
  const input: CoachMonthlyAiReviewInputV2 = Object.freeze({
    ...artifactInput,
    calendarMonth: Object.freeze({
      ...artifactInput.calendarMonth,
      calendarEvidenceDigestSha256: "a".repeat(64),
    }),
  });

  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys = ON");
    runPlatformMigrations(database, {
      manifest: platformMigrationManifest,
      now: () => NOW,
    });
    const scope = createSyntheticScope(database);
    const settings = new CoachAiProviderSettingsRepository(database).save({
      modelId: "gpt-5.6-luna",
      inputCostUsdPerMillionTokens: "0.20",
      cachedInputCostUsdPerMillionTokens: "0.02",
      cacheWriteInputCostUsdPerMillionTokens: "0.25",
      outputCostUsdPerMillionTokens: "1.20",
    }, NOW);
    configureDisposableControls(database, NOW);
      const reviews = new CoachAiReviewRepository(database);
      const existing = reviews.readPeriodRequestByIdentityV2(
        scope,
        "monthly",
        input.calendarMonth.calendarMonthStartDate,
        input.calendarMonth.calendarMonthEndDate,
      );
      if (existing) throw new Error("large_monthly_live_flow_period_not_clean");
      const envelope = buildCoachMonthlyAiReviewProviderEnvelopeV2(input);
      const result = await new CoachMonthlyAiReviewIssuanceService(
        reviews,
        new CoachAiProviderSettingsRepository(database),
        undefined,
        new CoachAiReviewProviderControlsRepository(database),
      ).issueV2(scope, input, Object.freeze({
        contractVersion: "traderlink_coach_ai_review_evidence_manifest_v2",
        evidence: Object.freeze([]),
      }), "manual", null, NOW);
      if (result.state !== "issued") {
        throw new Error(`large_monthly_live_flow_not_issued:${result.state}`);
      }
      const request = reviews.readPeriodRequestV2(scope, result.review.requestId);
      if (request.state !== "issued" || !request.issuedReviewId) {
        throw new Error("large_monthly_live_flow_saved_review_missing");
      }
      const reopened = reviews.readIssuedReviewV2(scope, request.issuedReviewId);
      const usage = receipt(database, request.requestId);
      if (usage.input_tokens === null || usage.cached_input_tokens === null ||
          usage.cache_write_input_tokens === null || usage.output_tokens === null ||
          usage.total_tokens === null || usage.reserved_max_input_tokens === null ||
          usage.reserved_max_total_tokens === null ||
          usage.reserved_maximum_cost_usd === null ||
          usage.estimated_cost_usd === null) {
        throw new Error("large_monthly_live_flow_usage_missing");
      }
      const exactCost = calculateCoachAiReviewEstimatedCost(Object.freeze({
        inputTokens: usage.input_tokens,
        cachedInputTokens: usage.cached_input_tokens,
        cacheWriteInputTokens: usage.cache_write_input_tokens,
        outputTokens: usage.output_tokens,
        totalTokens: usage.total_tokens,
      }), settings);
      const foreignKeyFailures = database.pragma("foreign_key_check") as unknown[];
      const valid = usage.attempt_count === 1 && usage.receipt_count === 1 &&
        usage.reservation_count === 1 && usage.reservation_state === "completed" &&
        usage.reserved_max_input_tokens >= usage.input_tokens &&
        usage.reserved_max_total_tokens >= usage.total_tokens &&
        new ExactDecimal(usage.reserved_maximum_cost_usd)
          .gte(usage.estimated_cost_usd) &&
        usage.estimated_cost_usd === exactCost &&
        reopened.issuedReviewId === request.issuedReviewId &&
        foreignKeyFailures.length === 0;
      const resultArtifact = Object.freeze({
        fixtureOnly: true,
        sourceArtifact: basename(sourceArtifactPath),
        realIssuanceFlow: true,
        liveDatabaseMutated: false,
        providerTokenCountCallCount: 1,
        providerGenerationCallCount: 1,
        providerReservationBytes: Buffer.byteLength(envelope.reservationText, "utf8"),
        modelId: reopened.modelId,
        receipt: usage,
        exactCost,
        savedReviewReopened: reopened.issuedReviewId === request.issuedReviewId,
        output: reopened.output,
        foreignKeyFailures: foreignKeyFailures.length,
        valid,
      });
      const artifactName = `large-monthly-ai-review-live-flow-${new Date()
        .toISOString().replaceAll(":", "-")}.json`;
      writeFileSync(
        join(process.cwd(), ".local-logs", artifactName),
        `${JSON.stringify(resultArtifact, null, 2)}\n`,
        "utf8",
      );
      process.stdout.write(`${JSON.stringify({
        status: valid ? "passed" : "failed",
        artifactName,
        providerReservationBytes: resultArtifact.providerReservationBytes,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        reservedMaximumInputTokens: usage.reserved_max_input_tokens,
        estimatedCostUsd: usage.estimated_cost_usd,
        reservedMaximumCostUsd: usage.reserved_maximum_cost_usd,
        savedReviewReopened: resultArtifact.savedReviewReopened,
        promptVersion: reopened.output.promptVersion ?? null,
        output: reopened.output,
        foreignKeyFailures: foreignKeyFailures.length,
        liveDatabaseMutated: false,
      }, null, 2)}\n`);
      if (!valid) process.exitCode = 1;
  } finally {
    database.close();
  }
}

void main();
