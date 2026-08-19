import { loadEnvConfig } from "@next/env";
import Database from "better-sqlite3";

import {
  CoachAiReviewGenerationCoordinatorV2,
  type CoachAiReviewPaidAccessPolicyV2,
} from "@/src/modules/coach/server/coach-ai-review-generation-coordinator-v2";
import { CoachAiReviewAuthoredPersistenceRepository } from
  "@/src/modules/coach/server/coach-ai-review-authored-persistence-repository";
import { CoachMonthlyAiReviewRunner } from
  "@/src/modules/coach/server/coach-monthly-ai-review-runner";
import { deriveDevelopmentOwnerJournalScope } from
  "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";

const SCENARIOS = Object.freeze({
  "--confirm-live-v4-weekly-review": Object.freeze({
    period: Object.freeze({
      reviewKind: "weekly" as const,
      periodStartDate: "2026-08-03",
      periodEndDate: "2026-08-07",
    }),
    issuedAt: new Date("2026-08-08T16:00:00.000Z"),
  }),
  "--confirm-live-v4-monthly-review": Object.freeze({
    period: Object.freeze({
      reviewKind: "monthly" as const,
      periodStartDate: "2026-01-05",
      periodEndDate: "2026-01-30",
    }),
    issuedAt: new Date("2026-02-01T16:00:00.000Z"),
    testFirstEnabledAtUtc: "2026-01-05T12:00:00.000Z",
  }),
});

type AccountSettingsRow = Readonly<{ first_enabled_at_utc: string }>;

function setFirstEnabledAt(
  database: Database.Database,
  accountId: string,
  value: string,
): void {
  const trigger = database.prepare<[], Readonly<{ sql: string }>>(`SELECT sql
FROM sqlite_schema
WHERE type = 'trigger' AND name =
  'coach_ai_review_account_settings_v2_update_guard'`).get();
  if (!trigger?.sql) throw new Error("live_v4_ai_review_settings_guard_missing");
  database.transaction(() => {
    database.exec("DROP TRIGGER coach_ai_review_account_settings_v2_update_guard");
    const result = database.prepare(`UPDATE coach_ai_review_account_settings_v2
SET first_enabled_at_utc = ? WHERE account_id = ?`).run(value, accountId);
    if (result.changes !== 1) throw new Error("live_v4_ai_review_settings_scope_mismatch");
    database.exec(trigger.sql);
  }).immediate();
}

function safeOutputText(value: unknown): string {
  return JSON.stringify(value).toLocaleLowerCase();
}

async function main(): Promise<void> {
  const scenario = process.argv.length === 3
    ? SCENARIOS[process.argv[2] as keyof typeof SCENARIOS]
    : undefined;
  if (!scenario) {
    throw new Error("live_v4_ai_review_confirmation_required");
  }
  loadEnvConfig(process.cwd(), true);
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("live_v4_ai_review_provider_key_missing");
  }
  const configuration = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  const database = new Database(configuration.databasePath, { fileMustExist: true });
  let originalFirstEnabledAtUtc: string | null = null;
  let activeAccountId: string | null = null;
  try {
    database.pragma("foreign_keys = ON");
    const scope = deriveDevelopmentOwnerJournalScope(database).scope;
    if (!scope.activeAccountId) throw new Error("live_v4_ai_review_account_missing");
    activeAccountId = scope.activeAccountId;
    if ("testFirstEnabledAtUtc" in scenario) {
      const settings = database.prepare<[string], AccountSettingsRow>(`SELECT first_enabled_at_utc
FROM coach_ai_review_account_settings_v2 WHERE account_id = ?`).get(scope.activeAccountId);
      if (!settings) throw new Error("live_v4_ai_review_settings_missing");
      originalFirstEnabledAtUtc = settings.first_enabled_at_utc;
      setFirstEnabledAt(database, scope.activeAccountId, scenario.testFirstEnabledAtUtc);
    }
    const requestedPeriod = scenario.period.reviewKind === "monthly"
      ? (() => {
          const plan = new CoachMonthlyAiReviewRunner(database).planAccountV2(scope, scenario.issuedAt)
            .find((candidate) => candidate.state === "manual_available" ||
              candidate.state === "automatic_ready");
          if (!plan) throw new Error("live_v4_ai_review_monthly_plan_unavailable");
          return Object.freeze({
            reviewKind: "monthly" as const,
            periodStartDate: plan.period.calendarMonthStartDate,
            periodEndDate: plan.period.calendarMonthEndDate,
          });
        })()
      : scenario.period;
    const authored = new CoachAiReviewAuthoredPersistenceRepository(database);
    if (!authored.tablesAvailable()) throw new Error("live_v4_ai_review_tables_missing");
    const existing = authored.listIssued(scope).find((review) =>
      review.reviewKind === requestedPeriod.reviewKind &&
      review.periodStartDate === requestedPeriod.periodStartDate &&
      review.periodEndDate === requestedPeriod.periodEndDate);
    if (existing) throw new Error("live_v4_ai_review_period_already_issued");

    const paidAccess: CoachAiReviewPaidAccessPolicyV2 = Object.freeze({
      read: () => "available" as const,
    });
    const coordinator = new CoachAiReviewGenerationCoordinatorV2(database, paidAccess);
    let result = await coordinator.generateNow(scope, requestedPeriod, scenario.issuedAt);
    for (let retry = 0; result.state === "retrying" && retry < 2; retry += 1) {
      result = await coordinator.generateNow(
        scope,
        requestedPeriod,
        new Date(scenario.issuedAt.getTime() + retry + 1),
      );
    }
    if (result.state !== "issued") {
      throw new Error(`live_v4_ai_review_not_issued:${result.state}`);
    }
    const snapshot = authored.readSnapshot(scope, result.requestId);
    const review = authored.listIssued(scope).find((item) => item.requestId === result.requestId);
    if (!review) throw new Error("live_v4_ai_review_saved_output_missing");
    const outputText = safeOutputText(review.output);
    if (/planned[ -]risk|risk deviation|supplied (?:data|comparison|evidence)/u.test(outputText)) {
      throw new Error("live_v4_ai_review_internal_or_generic_wording_present");
    }
    if (/(?:[$€£]\s*|\bUSD\s+)-?\d[\d,]*\.\d{3,}\b/u.test(outputText)) {
      throw new Error("live_v4_ai_review_financial_presentation_invalid");
    }
    const providerCalls = database.prepare<[string], Readonly<{
      call_count: number;
      completed_call_count: number;
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      estimated_cost_usd: string | null;
    }>>(`SELECT COUNT(*) AS call_count,
  COALESCE(SUM(CASE WHEN state = 'completed' THEN 1 ELSE 0 END), 0) AS completed_call_count,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  COALESCE(SUM(total_tokens), 0) AS total_tokens,
  CASE WHEN COUNT(*) = 0 THEN NULL ELSE printf('%.12f', COALESCE(SUM(
    ((input_tokens - cached_input_tokens - cache_write_input_tokens) * 5.0 +
      cached_input_tokens * 0.5 + cache_write_input_tokens * 6.25 +
      output_tokens * 30.0) / 1000000.0
  ), 0)) END AS estimated_cost_usd
FROM coach_ai_review_authored_provider_calls_v4
WHERE coach_ai_review_period_request_id = ?`).get(result.requestId)!;
    if (providerCalls.call_count < 1 ||
        providerCalls.completed_call_count !== providerCalls.call_count ||
        providerCalls.total_tokens < 1) {
      throw new Error("live_v4_ai_review_provider_receipt_incomplete");
    }
    const foreignKeyFailures = database.pragma("foreign_key_check") as unknown[];
    if (foreignKeyFailures.length !== 0) {
      throw new Error("live_v4_ai_review_foreign_key_failure");
    }
    process.stdout.write(`${JSON.stringify({
      status: "live_v4_ai_review_issued",
      requestId: result.requestId,
      issuedReviewId: review.issuedReviewId,
      reviewKind: review.reviewKind,
      periodStartDate: review.periodStartDate,
      periodEndDate: review.periodEndDate,
      packetVersion: snapshot.packet.packetVersion,
      providerCalls,
      foreignKeyFailures: foreignKeyFailures.length,
    }, null, 2)}\n`);
  } finally {
    if (originalFirstEnabledAtUtc && activeAccountId) {
      setFirstEnabledAt(database, activeAccountId, originalFirstEnabledAtUtc);
    }
    database.close();
  }
}

void main();
