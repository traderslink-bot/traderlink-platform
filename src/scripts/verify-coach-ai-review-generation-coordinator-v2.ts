import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { CoachAiProviderSettingsRepository } from
  "@/src/modules/coach/server/coach-ai-provider-settings-repository";
import { CoachAiReviewWhopPaidAccessPolicyV2 } from
  "@/src/modules/coach/server/coach-ai-review-whop-paid-access-policy";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import { WhopAiReviewEntitlementRepository } from
  "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import { createWhopPrivacyReference } from
  "@/src/modules/platform/server/billing/whop-ai-review-identity";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";

const ENTITLEMENT_ENVIRONMENT: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  WHOP_WEBHOOK_SECRET: "fixture-webhook-secret",
  WHOP_OAUTH_CLIENT_ID: "fixture-oauth-client",
  WHOP_OAUTH_REDIRECT_URI: "https://fixture.invalid/whop/callback",
  TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY:
    "fixture-generation-gate-identity-key-at-least-32-characters",
  WHOP_COMPANY_ID: "biz_fixture_generation_gate",
  WHOP_AI_REVIEWS_PRODUCT_IDS: "prod_fixture_generation_gate",
  WHOP_API_VERSION_DATE: "2026-07-20",
};

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function count(database: Database.Database, table: string): number {
  return database.prepare<[], { count: number }>(
    `SELECT COUNT(*) AS count FROM ${table}`,
  ).get()!.count;
}

function verifyPaidAccessLifecycle(database: Database.Database): Readonly<{
  noLinkFailsClosed: boolean;
  activeMembershipAvailable: boolean;
  deactivationFailsClosed: boolean;
}> {
  const at = new Date("2026-08-09T18:00:00.000Z");
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  const atUtc = createCanonicalUtcTimestamp(at);
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'development_local', ?, 'Paid access gate fixture', 'active', ?, ?)`)
    .run(userId, `paid-access-gate-${userId}`, atUtc, atUtc);
  const scope = Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([accountId]),
    activeAccountId: accountId,
  });
  const policy = new CoachAiReviewWhopPaidAccessPolicyV2(
    database,
    ENTITLEMENT_ENVIRONMENT,
  );
  const noLinkFailsClosed = policy.read(scope) === "not_connected";
  const key = ENTITLEMENT_ENVIRONMENT
    .TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY as string;
  const repository = new WhopAiReviewEntitlementRepository(database);
  const membershipRefHmac = createWhopPrivacyReference(
    "mem_fixture_generation_gate", "membership", key,
  );
  const whopUserRefHmac = createWhopPrivacyReference(
    "user_fixture_generation_gate", "user", key,
  );
  const companyRefHmac = createWhopPrivacyReference(
    ENTITLEMENT_ENVIRONMENT.WHOP_COMPANY_ID as string, "company", key,
  );
  const productRefHmac = createWhopPrivacyReference(
    ENTITLEMENT_ENVIRONMENT.WHOP_AI_REVIEWS_PRODUCT_IDS as string,
    "product",
    key,
  );
  repository.linkUser(userId, whopUserRefHmac, at);
  repository.applyMembershipEvent(Object.freeze({
    webhookIdSha256: "1".repeat(64),
    payloadSha256: "2".repeat(64),
    eventType: "membership.activated" as const,
    eventAtUtc: atUtc,
    membershipRefHmac,
    whopUserRefHmac,
    companyRefHmac,
    productRefHmac,
    membershipState: "active" as const,
    cancelAtPeriodEnd: false,
    renewalPeriodStartUtc: "2026-08-01T00:00:00.000Z",
    renewalPeriodEndUtc: "2026-09-01T00:00:00.000Z",
  }), at);
  const activeMembershipAvailable = policy.read(scope) === "available";
  const deactivatedAt = new Date(at.getTime() + 1_000);
  repository.applyMembershipEvent(Object.freeze({
    webhookIdSha256: "3".repeat(64),
    payloadSha256: "4".repeat(64),
    eventType: "membership.deactivated" as const,
    eventAtUtc: createCanonicalUtcTimestamp(deactivatedAt),
    membershipRefHmac,
    whopUserRefHmac,
    companyRefHmac,
    productRefHmac,
    membershipState: "deactivated" as const,
    cancelAtPeriodEnd: false,
    renewalPeriodStartUtc: "2026-08-01T00:00:00.000Z",
    renewalPeriodEndUtc: "2026-09-01T00:00:00.000Z",
  }), deactivatedAt);
  return Object.freeze({
    noLinkFailsClosed,
    activeMembershipAvailable,
    deactivationFailsClosed: policy.read(scope) === "not_connected",
  });
}

async function main(): Promise<void> {
  const configuration = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-ai-review-coordinator-"));
  const copyPath = join(temporaryRoot, "coordinator-check.sqlite");
  const original = new Database(configuration.databasePath, {
    fileMustExist: true,
    readonly: true,
  });
  try {
    await original.backup(copyPath);
  } finally {
    original.close();
  }

  try {
    const copy = new Database(copyPath, { fileMustExist: true });
    try {
      copy.pragma("foreign_keys = ON");
      const before = Object.freeze({
        requests: count(copy, "coach_ai_review_period_requests_v2"),
        attempts: count(copy, "coach_ai_review_generation_attempts_v2"),
        issued: count(copy, "coach_ai_issued_reviews_v2"),
        schedulerRuns: count(copy, "coach_ai_review_scheduler_runs_v2"),
      });
      const after = Object.freeze({
        requests: count(copy, "coach_ai_review_period_requests_v2"),
        attempts: count(copy, "coach_ai_review_generation_attempts_v2"),
        issued: count(copy, "coach_ai_issued_reviews_v2"),
        schedulerRuns: count(copy, "coach_ai_review_scheduler_runs_v2"),
      });
      const cron = source("app/api/cron/ai-reviews/route.ts");
      const manual = source("app/(dashboard)/ai-reviews/ai-review-request-actions.ts");
      const coordinator = source(
        "src/modules/coach/server/coach-ai-review-generation-coordinator-v2.ts",
      );
      const reviews = source("src/modules/coach/server/coach-ai-review-repository.ts");
      const monthly = source("src/modules/coach/server/coach-monthly-ai-review-runner.ts");
      const weeklyIssuance = source(
        "src/modules/coach/server/coach-weekly-ai-review-issuance-service.ts",
      );
      const monthlyIssuance = source(
        "src/modules/coach/server/coach-monthly-ai-review-issuance-service.ts",
      );
      const contracts = Object.freeze({
        scheduledUsesV2: cron.includes("CoachAiReviewGenerationCoordinatorV2") &&
          !cron.includes("CoachWeeklyAiReviewRunner") &&
          !cron.includes("CoachMonthlyAiReviewRunner"),
        manualUsesSameCoordinator: manual.includes(".generateNow(scope"),
        oldestFirst: reviews.includes("ORDER BY eligible_at_utc ASC, created_at_utc ASC"),
        monthlyDoesNotExpire: !monthly.includes("AUTOMATIC_RECOVERY_WINDOW") &&
          !monthly.includes("generationMode: \"manual\""),
        retryUsesFrozenWeeklyInput: weeklyIssuance.includes("readInputV2(scope, requestId)") &&
          weeklyIssuance.includes("readEvidenceManifestV2(scope, requestId)"),
        retryUsesFrozenMonthlyInput: monthlyIssuance.includes("readInputV2(scope, requestId)") &&
          monthlyIssuance.includes("readEvidenceManifestV2(scope, requestId)"),
        productionDefaultsToWhop:
          coordinator.includes("new CoachAiReviewWhopPaidAccessPolicyV2(database)"),
        pausedRunIsRecorded: coordinator.includes("this.beginRun(\"scheduled\", now)") &&
          coordinator.includes("this.finishRun(runId, summary, this.completionTime(now))"),
      });
      const noProviderMutation = before.requests === after.requests &&
        before.attempts === after.attempts && before.issued === after.issued;
      const controls = copy.prepare<[], Readonly<{
        enabled_count: number;
        complete_count: number;
      }>>(`SELECT SUM(enabled) AS enabled_count,
  SUM(CASE WHEN daily_request_cap IS NOT NULL AND daily_token_cap IS NOT NULL
    AND daily_estimated_spend_cap_usd IS NOT NULL THEN 1 ELSE 0 END) AS complete_count
FROM coach_ai_feature_controls
WHERE feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND scope_kind = 'platform'`).get();
      const platformFailsClosed = controls?.enabled_count !== 2 ||
        controls.complete_count !== 2;
      const costAggregation = new CoachAiProviderSettingsRepository(copy)
        .readCostAggregation();
      const costAggregationReadable = Array.isArray(costAggregation);
      const paidAccessLifecycle = verifyPaidAccessLifecycle(copy);
      const valid = platformFailsClosed && noProviderMutation &&
        after.schedulerRuns === before.schedulerRuns &&
        costAggregationReadable && Object.values(contracts).every(Boolean) &&
        Object.values(paidAccessLifecycle).every(Boolean);
      process.stdout.write(`${JSON.stringify({
        platformFailsClosed,
        noProviderMutation,
        costAggregationReadable,
        paidAccessLifecycle,
        contracts,
        valid,
      })}\n`);
      if (!valid) process.exitCode = 1;
    } finally {
      copy.close();
    }
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

void main();
