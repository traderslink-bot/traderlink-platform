import "server-only";

import { loadEnvConfig } from "@next/env";
import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { CoachAiReviewAuthoredExecutionService } from
  "@/src/modules/coach/server/coach-ai-review-authored-execution-service";
import { CoachAiReviewAuthoredPersistenceRepository } from
  "@/src/modules/coach/server/coach-ai-review-authored-persistence-repository";
import { CoachAiReviewAuthoredRequestService } from
  "@/src/modules/coach/server/coach-ai-review-authored-request-service";
import { CoachAiReviewRepository } from
  "@/src/modules/coach/server/coach-ai-review-repository";
import { CoachMonthlyAiReviewRunner } from
  "@/src/modules/coach/server/coach-monthly-ai-review-runner";
import { deriveDevelopmentOwnerJournalScope } from
  "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";

const CONFIRMATION = "--confirm-live-v4-high-volume-monthly-resume";
const FIXTURE_ACCOUNT_NAME = "AI Review high-volume March test";
const ISSUED_AT = new Date("2026-04-01T16:00:00.000Z");

type Receipt = Readonly<{
  callCount: number;
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostCents: number;
}>;

function fail(code: string): never {
  throw new Error(code);
}

function fixtureScope(database: Database.Database): WorkspaceAccessScope {
  const owner = deriveDevelopmentOwnerJournalScope(database).scope;
  const accounts = database.prepare<[string, string], Readonly<{ account_id: string }>>(`SELECT account_id
FROM journal_accounts
WHERE workspace_id = ? AND display_name = ? AND status = 'active'
ORDER BY account_id`).all(owner.workspaceId, FIXTURE_ACCOUNT_NAME);
  if (accounts.length !== 1 || !accounts[0]) fail("high_volume_monthly_fixture_account_missing");
  return Object.freeze({
    userId: owner.userId,
    workspaceId: owner.workspaceId,
    workspaceRole: owner.workspaceRole,
    allowedAccountIds: Object.freeze([accounts[0].account_id]),
    activeAccountId: accounts[0].account_id,
  });
}

function receipt(database: Database.Database, requestId: string): Receipt {
  return database.prepare<[string], Receipt>(`SELECT
  COUNT(call.coach_ai_review_authored_provider_call_id) AS callCount,
  COALESCE(SUM(call.input_tokens), 0) AS inputTokens,
  COALESCE(SUM(call.cached_input_tokens), 0) AS cachedInputTokens,
  COALESCE(SUM(call.cache_write_input_tokens), 0) AS cacheWriteInputTokens,
  COALESCE(SUM(call.output_tokens), 0) AS outputTokens,
  COALESCE(SUM(call.total_tokens), 0) AS totalTokens,
  COALESCE(SUM(((call.input_tokens - call.cached_input_tokens - call.cache_write_input_tokens) * 5.0 + call.cached_input_tokens * 0.5 + call.cache_write_input_tokens * 6.25 + call.output_tokens * 30.0) / 10000.0), 0) AS estimatedCostCents
FROM coach_ai_review_authored_provider_calls_v4 call
WHERE call.coach_ai_review_period_request_id = ?`).get(requestId) ?? fail("high_volume_monthly_receipt_missing");
}

async function main(): Promise<void> {
  if (process.argv.at(-1) !== CONFIRMATION) fail("high_volume_monthly_confirmation_required");
  loadEnvConfig(process.cwd(), true);
  if (!process.env.OPENAI_API_KEY?.trim()) fail("high_volume_monthly_provider_key_missing");
  const configuration = loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
  const database = new Database(configuration.databasePath, { fileMustExist: true });
  try {
    database.pragma("foreign_keys = ON");
    const scope = fixtureScope(database);
    const authored = new CoachAiReviewAuthoredPersistenceRepository(database);
    const existing = new CoachAiReviewRepository(database).readPeriodRequestByIdentityV2(
      scope,
      "monthly",
      "2026-03-01",
      "2026-03-31",
    );
    const requestId = existing?.requestId ?? (() => {
      const plan = new CoachMonthlyAiReviewRunner(database).planAccountV2(scope, ISSUED_AT)
        .find((candidate) => candidate.period.calendarMonthStartDate === "2026-03-01" &&
          candidate.period.calendarMonthEndDate === "2026-03-31" &&
          (candidate.state === "manual_available" || candidate.state === "automatic_ready"));
      if (!plan) fail("high_volume_monthly_plan_unavailable");
      return new CoachAiReviewAuthoredRequestService(database)
        .createFromEligiblePlan(plan, "manual", ISSUED_AT).requestId;
    })();
    const interruptedCalls = database.prepare<[string], Readonly<{
      callId: string;
      attemptId: string;
      kind: "weekly_authoring" | "monthly_partition_extraction" | "monthly_synthesis";
    }>>(`SELECT coach_ai_review_authored_provider_call_id AS callId,
  coach_ai_review_generation_attempt_id AS attemptId, call_kind AS kind
FROM coach_ai_review_authored_provider_calls_v4
WHERE coach_ai_review_period_request_id = ? AND state = 'started'`).all(requestId);
    for (const call of interruptedCalls) {
      authored.failProviderCall(scope, Object.freeze({
        callId: call.callId,
        attemptId: call.attemptId,
        requestId,
        kind: call.kind,
      }), "TRADERLINK_COACH_AUTHORING_INTERRUPTED", new Date());
    }
    let result = await new CoachAiReviewAuthoredExecutionService(database)
      .issue(scope, requestId, new Date());
    for (let attempt = 0; result === "retrying" && attempt < 2; attempt += 1) {
      result = await new CoachAiReviewAuthoredExecutionService(database)
        .issue(scope, requestId, new Date());
    }
    if (result !== "issued") fail(`high_volume_monthly_not_issued_${result}`);
    const review = authored.listIssued(scope).find((candidate) =>
      candidate.requestId === requestId) ?? fail("high_volume_monthly_output_missing");
    const snapshot = authored.readSnapshot(scope, requestId);
    if (snapshot.packet.packetVersion !== "traderlink_coach_monthly_ai_review_evidence_packet_v1" ||
        snapshot.packet.coverage.completeTradeCount !== 440) {
      fail("high_volume_monthly_coverage_invalid");
    }
    const foreignKeyFailures = database.pragma("foreign_key_check") as unknown[];
    if (foreignKeyFailures.length !== 0) fail("high_volume_monthly_foreign_key_failure");
    process.stdout.write(`${JSON.stringify({
      status: "issued",
      accountName: FIXTURE_ACCOUNT_NAME,
      review: {
        periodStartDate: review.periodStartDate,
        periodEndDate: review.periodEndDate,
        modelId: review.modelId,
        output: review.output,
      },
      packet: {
        completeTradeCount: snapshot.packet.coverage.completeTradeCount,
        priorMonthCompleteTradeCount: snapshot.packet.priorMonthSnapshot?.metrics
          .find((metric) => metric.name === "closed_trade_count")?.exactValue ?? null,
        calendarWeekCount: snapshot.packet.calendarWeeks.length,
      },
      receipt: receipt(database, requestId),
      foreignKeyFailures: foreignKeyFailures.length,
    }, null, 2)}\n`);
  } finally {
    database.close();
  }
}

void main();
