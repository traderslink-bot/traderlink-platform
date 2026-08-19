import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { loadJournalPrivacyHmacConfiguration } from
  "@/src/modules/journal/server/imports/journal-import-service";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import { CoachAiReviewProviderControlsRepository } from
  "./coach-ai-review-provider-controls-repository";
import {
  CoachAiReviewRepository,
  type CoachAiReviewKindV2,
  type CoachAiReviewPeriodRequestRecordV2,
} from "./coach-ai-review-repository";
import {
  CoachAiReviewRequestService,
  type CoachAiReviewManualRequestV2,
} from "./coach-ai-review-request-service";
import { CoachAiReviewGenerationContractRepository } from
  "./coach-ai-review-generation-contract-repository";
import { CoachAiReviewInsightDispatchRecovery } from
  "./coach-ai-review-insight-dispatch-recovery";
import { CoachAiReviewInsightExecutionService } from
  "./coach-ai-review-insight-execution-service";
import { CoachAiReviewWhopPaidAccessPolicyV2 } from
  "./coach-ai-review-whop-paid-access-policy";
import { CoachMonthlyAiReviewIssuanceService } from
  "./coach-monthly-ai-review-issuance-service";
import { CoachWeeklyAiReviewIssuanceService } from
  "./coach-weekly-ai-review-issuance-service";
import { CoachReviewDeliveryScheduleRepository } from
  "./coach-weekly-review-schedule-repository";
import { CoachUsEquitiesCalendarRepository } from
  "./market-calendar/coach-us-equities-calendar-repository";

export type CoachAiReviewPaidAccessStateV2 = "available" | "not_connected";

export type CoachAiReviewGenerationGateV2 = Readonly<{
  state: "available" | "platform_unavailable" | "paid_access_unavailable";
  paidAccess: CoachAiReviewPaidAccessStateV2;
}>;

export type CoachAiReviewCoordinatorSummaryV2 = Readonly<{
  state: "completed" | "paused";
  gate: CoachAiReviewGenerationGateV2;
  eligibleCount: number;
  requestedCount: number;
  reusedCount: number;
  pendingCount: number;
  paidAccessUnavailableCount: number;
  issuedCount: number;
  inProgressCount: number;
  retryingCount: number;
}>;

export type CoachAiReviewManualGenerationResultV2 =
  | Readonly<{ state: "issued" | "in_progress" | "retrying"; requestId: string }>
  | Readonly<{ state: "already_requested"; requestId: string }>
  | Readonly<{ state: "not_available" | "platform_unavailable" |
      "paid_access_unavailable" }>;

export interface CoachAiReviewPaidAccessPolicyV2 {
  read(scope?: WorkspaceAccessScope): CoachAiReviewPaidAccessStateV2;
}

/** Test/local fail-closed policy. Production construction defaults to Whop. */
export class CoachAiReviewPaidAccessPolicyNotConnectedV2
implements CoachAiReviewPaidAccessPolicyV2 {
  read(): CoachAiReviewPaidAccessStateV2 {
    return "not_connected";
  }
}

type PendingWork = Readonly<{
  scope: WorkspaceAccessScope;
  request: CoachAiReviewPeriodRequestRecordV2;
}>;

const recoveredDatabaseFiles = new Set<string>();
const recoveredDatabaseConnections = new WeakSet<object>();

function featureReady(
  controls: CoachAiReviewProviderControlsRepository,
  reviewKind: CoachAiReviewKindV2,
): boolean {
  return controls.readPlatformAvailability(reviewKind).enabled;
}

function emptySummary(
  state: CoachAiReviewCoordinatorSummaryV2["state"],
  gate: CoachAiReviewGenerationGateV2,
): CoachAiReviewCoordinatorSummaryV2 {
  return Object.freeze({
    state,
    gate,
    eligibleCount: 0,
    requestedCount: 0,
    reusedCount: 0,
    pendingCount: 0,
    paidAccessUnavailableCount: 0,
    issuedCount: 0,
    inProgressCount: 0,
    retryingCount: 0,
  });
}

export class CoachAiReviewGenerationCoordinatorV2 {
  readonly #reviews: CoachAiReviewRepository;
  readonly #controls: CoachAiReviewProviderControlsRepository;
  readonly #settings: CoachAiProviderSettingsRepository;

  constructor(
    private readonly database: Database.Database,
    private readonly paidAccess: CoachAiReviewPaidAccessPolicyV2 =
      new CoachAiReviewWhopPaidAccessPolicyV2(database),
  ) {
    this.#reviews = new CoachAiReviewRepository(database);
    this.#controls = new CoachAiReviewProviderControlsRepository(database);
    this.#settings = new CoachAiProviderSettingsRepository(database);
  }

  readGate(scope?: WorkspaceAccessScope): CoachAiReviewGenerationGateV2 {
    const weeklyReady = featureReady(this.#controls, "weekly");
    const monthlyReady = featureReady(this.#controls, "monthly");
    let calendarReady = true;
    try {
      const calendar = new CoachUsEquitiesCalendarRepository(this.database).calendar();
      calendar.session(calendar.marketDateAt(new Date()));
    } catch {
      calendarReady = false;
    }
    const credentialReady = Boolean(process.env.OPENAI_API_KEY?.trim());
    const contract = new CoachAiReviewGenerationContractRepository(this.database).read();
    let insightConfigurationReady = true;
    if (contract.activeGenerationContractVersion === "insight_selection_v3") {
      try {
        const configuration = loadJournalPrivacyHmacConfiguration();
        const settings = this.#settings.read();
        insightConfigurationReady = Boolean(
          configuration.keysBase64[configuration.activeKeyVersion],
        ) && /^gpt-5\.6(?:-(?:luna|terra|sol))?$/u.test(settings.modelId);
      } catch {
        insightConfigurationReady = false;
      }
    }
    if (!weeklyReady || !monthlyReady || !calendarReady || !credentialReady ||
        !insightConfigurationReady) {
      return Object.freeze({
        state: "platform_unavailable",
        paidAccess: this.paidAccess.read(scope),
      });
    }
    const paidAccess = this.paidAccess.read(scope);
    return Object.freeze({
      state: paidAccess === "available" ? "available" : "paid_access_unavailable",
      paidAccess,
    });
  }

  async run(now = new Date()): Promise<CoachAiReviewCoordinatorSummaryV2> {
    const runId = this.beginRun("scheduled", now);
    const gate = this.readGate();
    if (gate.state !== "available") {
      const summary = emptySummary("paused", gate);
      this.finishRun(runId, summary, this.completionTime(now));
      return summary;
    }
    try {
      this.ensureInsightStartupRecovery();
      const requested = new CoachAiReviewRequestService(this.database)
        .requestAutomaticReady(now);
      const pending = this.pendingForEnabledAccounts();
      const counts = { issuedCount: 0, inProgressCount: 0, retryingCount: 0,
        paidAccessUnavailableCount: 0 };
      for (const work of pending) {
        if (this.paidAccess.read(work.scope) !== "available") {
          counts.paidAccessUnavailableCount += 1;
          continue;
        }
        const result = await this.issue(work, now);
        if (result === "issued") counts.issuedCount += 1;
        if (result === "in_progress") counts.inProgressCount += 1;
        if (result === "retrying") counts.retryingCount += 1;
      }
      const summary = Object.freeze({
        state: "completed" as const,
        gate,
        eligibleCount: requested.eligibleCount,
        requestedCount: requested.requestedCount,
        reusedCount: requested.reusedCount,
        pendingCount: pending.length,
        ...counts,
      });
      this.finishRun(runId, summary, this.completionTime(now));
      return summary;
    } catch (error) {
      this.failRun(runId, this.completionTime(now));
      throw error;
    }
  }

  async generateNow(
    scope: WorkspaceAccessScope,
    input: CoachAiReviewManualRequestV2,
    now = new Date(),
  ): Promise<CoachAiReviewManualGenerationResultV2> {
    const gate = this.readGate(scope);
    if (gate.state !== "available") return Object.freeze({ state: gate.state });
    this.ensureInsightStartupRecovery();
    const request = new CoachAiReviewRequestService(this.database)
      .requestManual(scope, input, now);
    if (request.state === "not_available") return Object.freeze({ state: "not_available" });
    const stored = this.#reviews.readPeriodRequestV2(scope, request.requestId);
    if (stored.state === "issued") {
      return Object.freeze({ state: "already_requested", requestId: request.requestId });
    }
    const state = await this.issue(Object.freeze({ scope, request: stored }), now);
    return Object.freeze({ state, requestId: request.requestId });
  }

  private pendingForEnabledAccounts(): readonly PendingWork[] {
    const accounts = new CoachReviewDeliveryScheduleRepository(this.database)
      .listEnabledAccountsV2();
    return Object.freeze(accounts.flatMap((account) =>
      this.#reviews.listPendingPeriodRequestsV2(account.scope)
        .map((request) => Object.freeze({ scope: account.scope, request })))
      .sort((left, right) =>
        left.request.eligibleAtUtc.localeCompare(right.request.eligibleAtUtc) ||
        left.request.createdAtUtc.localeCompare(right.request.createdAtUtc) ||
        left.request.requestId.localeCompare(right.request.requestId)));
  }

  private async issue(
    work: PendingWork,
    now: Date,
  ): Promise<"issued" | "in_progress" | "retrying"> {
    const generationContractVersion = this.database.prepare<[
      string, string, string, string
    ], Readonly<{ generation_contract_version: string }>>(`SELECT
  generation_contract_version FROM coach_ai_review_period_requests_v2
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`).get(
      work.request.requestId,
      work.scope.userId,
      work.scope.workspaceId,
      work.scope.activeAccountId ?? "",
    )?.generation_contract_version;
    if (generationContractVersion === "insight_selection_v3") {
      return new CoachAiReviewInsightExecutionService(this.database)
        .issue(work.scope, work.request.requestId, now);
    }
    if (generationContractVersion !== "openai_direct_v2") {
      throw new Error("TRADERLINK_COACH_REVIEW_GENERATION_CONTRACT_INVALID");
    }
    const result = work.request.reviewKind === "monthly"
      ? await new CoachMonthlyAiReviewIssuanceService(
          this.#reviews,
          this.#settings,
          undefined,
          this.#controls,
        ).issueExistingV2(work.scope, work.request.requestId, now)
      : await new CoachWeeklyAiReviewIssuanceService(
          this.#reviews,
          this.#settings,
          undefined,
          this.#controls,
        ).issueExistingV2(work.scope, work.request.requestId, now);
    if (result.state === "issued") return "issued";
    if (result.state === "in_progress") return "in_progress";
    return "retrying";
  }

  private ensureInsightStartupRecovery(): void {
    const contract = new CoachAiReviewGenerationContractRepository(this.database).read();
    if (contract.activeGenerationContractVersion !== "insight_selection_v3") return;
    const databases = this.database.pragma("database_list") as readonly Readonly<{
      name: string;
      file: string;
    }>[];
    const file = databases.find((database) => database.name === "main")?.file ?? "";
    if (file ? recoveredDatabaseFiles.has(file) :
        recoveredDatabaseConnections.has(this.database)) return;
    new CoachAiReviewInsightDispatchRecovery(this.database).rotateEpochAndReconcile();
    if (file) recoveredDatabaseFiles.add(file);
    else recoveredDatabaseConnections.add(this.database);
  }

  private beginRun(origin: "scheduled" | "manual", now: Date): string | null {
    if (!this.hasSchedulerTable()) return null;
    const runId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO coach_ai_review_scheduler_runs_v2 (
  coach_ai_review_scheduler_run_id, origin, state, started_at_utc,
  finalized_at_utc, summary_json, failure_code
) VALUES (?, ?, 'running', ?, NULL, NULL, NULL)`).run(
      runId,
      origin,
      createCanonicalUtcTimestamp(now),
    );
    return runId;
  }

  private finishRun(
    runId: string | null,
    summary: CoachAiReviewCoordinatorSummaryV2,
    now: Date,
  ): void {
    if (!runId) return;
    this.database.prepare(`UPDATE coach_ai_review_scheduler_runs_v2
SET state = 'completed', finalized_at_utc = ?, summary_json = ?
WHERE coach_ai_review_scheduler_run_id = ? AND state = 'running'`).run(
      createCanonicalUtcTimestamp(now),
      JSON.stringify(summary),
      runId,
    );
  }

  private failRun(runId: string | null, now: Date): void {
    if (!runId) return;
    this.database.prepare(`UPDATE coach_ai_review_scheduler_runs_v2
SET state = 'failed', finalized_at_utc = ?, failure_code =
  'TRADERLINK_COACH_REVIEW_COORDINATOR_FAILED'
WHERE coach_ai_review_scheduler_run_id = ? AND state = 'running'`).run(
      createCanonicalUtcTimestamp(now),
      runId,
    );
  }

  private hasSchedulerTable(): boolean {
    return Boolean(this.database.prepare<[string], Readonly<{ present: number }>>(
      "SELECT 1 AS present FROM sqlite_schema WHERE type = 'table' AND name = ?",
    ).get("coach_ai_review_scheduler_runs_v2"));
  }

  private completionTime(startedAt: Date): Date {
    return new Date(Math.max(startedAt.getTime(), Date.now()));
  }
}
