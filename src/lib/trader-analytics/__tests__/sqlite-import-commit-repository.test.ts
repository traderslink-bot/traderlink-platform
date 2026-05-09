import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildCsvDryRunImportExperience,
  buildImportCommitPlan,
} from "../index";
import {
  DEMO_ACCOUNT_ID,
  DEMO_USER_ID,
  DEMO_WORKSPACE_ID,
  resetTraderIntelligenceDatabaseForTests,
  SqliteImportCommitRepository,
} from "../product/import-commit/sqlite-import-commit-repository";
import {
  buildSavedDecisionReviewReadModel,
  runPersistedDecisionReviewJobs,
} from "../server/saved-decision-review-service";
import { buildSavedReviewQueueReadModel } from "../server/saved-review-queue";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import type { BatchTradeAnalysisResult } from "../../trade-analysis/batch/run-trade-analysis-batch";
import type { ImportCommitPlannerAcknowledgements } from "../product/import-commit/import-commit-planner";

let tempDir = "";
let originalDbPath: string | undefined;

function planFor(
  csvText: string,
  acknowledgements: ImportCommitPlannerAcknowledgements = {
    mappingReview: true,
    pnlReview: true,
  },
) {
  const repository = new SqliteImportCommitRepository();
  const experience = buildCsvDryRunImportExperience({
    broker: "generic_execution_csv",
    csvText,
  });

  return {
    repository,
    plan: buildImportCommitPlan({
      workspaceId: DEMO_WORKSPACE_ID,
      userId: DEMO_USER_ID,
      accountId: DEMO_ACCOUNT_ID,
      experience,
      existingFileFingerprints: repository.listCommittedFileFingerprints(
        DEMO_ACCOUNT_ID,
      ),
      existingTradeFingerprints: repository.listCommittedTradeFingerprints(
        DEMO_ACCOUNT_ID,
      ),
      acknowledgements,
    }),
  };
}

beforeEach(() => {
  originalDbPath = process.env.TRADER_INTELLIGENCE_DB_PATH;
  tempDir = mkdtempSync(join(tmpdir(), "trader-intelligence-sqlite-"));
  process.env.TRADER_INTELLIGENCE_DB_PATH = join(tempDir, "test.sqlite");
  resetTraderIntelligenceDatabaseForTests();
});

afterEach(() => {
  resetTraderIntelligenceDatabaseForTests();
  if (originalDbPath === undefined) {
    delete process.env.TRADER_INTELLIGENCE_DB_PATH;
  } else {
    process.env.TRADER_INTELLIGENCE_DB_PATH = originalDbPath;
  }
  rmSync(tempDir, { recursive: true, force: true });
});

describe("SqliteImportCommitRepository", () => {
  it("runs migrations and commits a ready import into saved read models", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,SAVE,Buy,100,10.00",
      "2026-05-01,10:00:00,SAVE,Sell,100,10.50",
    ].join("\n");
    const { repository, plan } = planFor(csv);
    const result = repository.commitImportPlan(plan);

    expect(result.status).toBe("committed");
    expect(repository.listSavedTrades(DEMO_ACCOUNT_ID)).toHaveLength(1);
    expect(repository.listTrades(DEMO_USER_ID)).toMatchObject([
      {
        symbol: "SAVE",
        sampleData: false,
      },
    ]);
    expect(repository.listReports(DEMO_USER_ID)).toHaveLength(1);
    expect(repository.listDecisionReviewJobs(plan.batch.id)).toMatchObject([
      { status: "queued", symbol: "SAVE" },
    ]);
  });

  it("detects duplicate file and trade fingerprints after commit", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,DUPL,Buy,100,10.00",
      "2026-05-01,10:00:00,DUPL,Sell,100,10.50",
    ].join("\n");
    const first = planFor(csv);
    first.repository.commitImportPlan(first.plan);

    const second = planFor(csv);

    expect(second.plan.status).toBe("needs_user_review");
    expect(second.plan.requiredDecisions.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["resolve_duplicate_file", "resolve_duplicate_trade"]),
    );

    second.repository.savePreviewPlan(second.plan);
    const history = second.repository.listImportBatchHistory(DEMO_ACCOUNT_ID);

    expect(history).toHaveLength(2);
    expect(new Set(history.map((item) => item.batch.id)).size).toBe(2);
    expect(history[0]).toMatchObject({
      duplicateFile: true,
      duplicateTradeCount: 1,
      summaryStatus: "needs_review",
    });
  });

  it("stores previews without exposing them as saved trades until commit", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,PREV,Buy,100,10.00",
      "2026-05-01,10:00:00,PREV,Sell,100,10.50",
    ].join("\n");
    const { repository, plan } = planFor(csv);

    repository.savePreviewPlan(plan);
    repository.discardImportBatch(plan.batch.id);

    expect(repository.getImportBatch(plan.batch.id)?.status).toBe("discarded");
    expect(repository.listSavedTrades(DEMO_ACCOUNT_ID)).toEqual([]);
    expect(repository.listReports(DEMO_USER_ID)).toEqual([]);
  });

  it("persists repair actions, trade notes, and checklist progress", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,STATE,Buy,100,10.00",
      "2026-05-01,10:00:00,STATE,Sell,100,10.50",
    ].join("\n");
    const { repository, plan } = planFor(csv);

    repository.savePreviewPlan({
      ...plan,
      repairItems: [
        {
          id: "repair:test",
          importBatchId: plan.batch.id,
          rowIndex: 1,
          requestIndex: null,
          severity: "review",
          actionKind: "manual_review",
          title: "Review imported row",
          detail: "Confirm the row before trusting coaching.",
          status: "open",
        },
      ],
    });

    expect(
      repository.updateRepairItemStatus({
        importBatchId: plan.batch.id,
        repairItemId: "repair:test",
        status: "resolved",
        createdAt: "2026-05-07T12:00:00.000Z",
      }),
    ).toMatchObject({ status: "resolved" });
    expect(repository.getPreviewPlan(plan.batch.id)?.repairItems[0]).toMatchObject({
      status: "resolved",
    });
    expect(repository.listImportRepairEvents(plan.batch.id)).toMatchObject([
      { repairItemId: "repair:test", status: "resolved" },
    ]);

    repository.commitImportPlan(plan);
    const trade = repository.listTrades(DEMO_USER_ID)[0];
    expect(trade).toBeDefined();

    const note = repository.addTradeNote({
      userId: DEMO_USER_ID,
      tradeId: trade.id,
      body: "Held the first target plan.",
      createdAt: "2026-05-07T12:01:00.000Z",
    });
    expect(note?.body).toBe("Held the first target plan.");

    const state = repository.setTradeReviewItemStatus({
      userId: DEMO_USER_ID,
      tradeId: trade.id,
      itemId: "lesson_review",
      status: "complete",
      updatedAt: "2026-05-07T12:02:00.000Z",
    });
    expect(state).toMatchObject({ itemId: "lesson_review", status: "complete" });

    expect(repository.getTrade(DEMO_USER_ID, trade.id)).toMatchObject({
      reviewStatus: "in_progress",
      notes: [{ body: "Held the first target plan." }],
    });
    expect(repository.listTradeReviewItemStates(trade.id)).toMatchObject([
      { itemId: "lesson_review", status: "complete" },
    ]);
  });

  it("lists unresolved repair inbox items across preview batches", () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,,Buy,100,10.00",
      "2026-05-01,10:00:00,INBX,Sell,100,10.50",
    ].join("\n");
    const { repository, plan } = planFor(csv);

    repository.savePreviewPlan(plan);

    const inbox = repository.listUnresolvedImportRepairInbox(DEMO_ACCOUNT_ID);
    expect(inbox.length).toBeGreaterThan(0);
    expect(inbox[0]).toMatchObject({
      importBatchId: plan.batch.id,
      severity: "fix_required",
      batchStatus: "needs_repair",
    });
    expect(inbox[0]?.href).toContain(encodeURIComponent(plan.batch.id));
  });

  it("runs persisted decision review snapshots for committed closed trades", async () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,DRSN,Buy,100,10.00",
      "2026-05-01,10:00:00,DRSN,Sell,100,10.50",
    ].join("\n");
    const { repository, plan } = planFor(csv);

    repository.commitImportPlan(plan);
    const run = await runPersistedDecisionReviewJobs({
      repository,
      importBatchId: plan.batch.id,
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      generatedAt: "2026-05-07T12:00:00.000Z",
    });
    const readModel = buildSavedDecisionReviewReadModel({ repository });

    expect(run.completedSnapshotCount).toBe(1);
    expect(readModel.completedCount).toBe(1);
    expect(readModel.queuedCount).toBe(0);
    expect(readModel.snapshots[0]).toMatchObject({
      symbol: "DRSN",
      status: "completed",
      review: {
        marketContextSource: "levels_system_daily_4h",
      },
    });
    expect(repository.listDecisionReviewJobs(plan.batch.id)).toMatchObject([
      { status: "completed", symbol: "DRSN" },
    ]);
    expect(readModel.statusCounts).toMatchObject({ completed: 1 });
    expect(readModel.diagnosticCodeCounts).toEqual({});
  });

  it("persists blocked-open and market-unavailable decision review diagnostics", async () => {
    const openCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,OPEN,Buy,100,10.00",
    ].join("\n");
    const open = planFor(openCsv, {
      mappingReview: true,
      groupingReview: true,
      pnlReview: true,
      openPositions: true,
      anomalyTypes: ["open_leftover"],
    });

    expect(open.plan.canCommitNow).toBe(true);
    open.repository.commitImportPlan(open.plan);
    await runPersistedDecisionReviewJobs({
      repository: open.repository,
      importBatchId: open.plan.batch.id,
      generatedAt: "2026-05-07T12:00:00.000Z",
    });

    expect(
      open.repository.listDecisionReviewDiagnosticsForBatch(open.plan.batch.id),
    ).toMatchObject([
      {
        status: "blocked_open_trade",
        code: "blocked_open_trade",
        symbol: "OPEN",
      },
    ]);

    const unavailableCsv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,UNAV,Buy,100,10.00",
      "2026-05-01,10:00:00,UNAV,Sell,100,10.50",
    ].join("\n");
    const unavailable = planFor(unavailableCsv);
    const fakeBatch: BatchTradeAnalysisResult = {
      contractVersion: "batch_trade_analysis_v1",
      source: "test",
      generatedAt: "2026-05-07T12:00:00.000Z",
      validateOnly: false,
      totals: {
        requests: 1,
        validated: 1,
        completed: 0,
        failed: 1,
        warnings: 0,
      },
      failureCounts: { insufficient_market_context: 1 },
      marketStructureCounts: { observed: 0, missing: 0, scoringUses: 0 },
      patternCounts: {
        detectedTotal: 0,
        normalizedTotal: 0,
        topAnchorPatternIds: {},
      },
      items: [
        {
          requestIndex: 0,
          status: "failed",
          symbol: "UNAV",
          validation: { valid: true, issues: [] },
          failure: {
            code: "insufficient_market_context",
            source: "levels_system",
            title: "Insufficient market context",
            message: "Daily/4h context is unavailable.",
            retryable: false,
            userAction: "Backfill market context before decision review.",
            rawMessage: "Daily/4h context is unavailable.",
          },
          summary: null,
        },
      ],
    };

    unavailable.repository.commitImportPlan(unavailable.plan);
    await runPersistedDecisionReviewJobs({
      repository: unavailable.repository,
      importBatchId: unavailable.plan.batch.id,
      generatedAt: "2026-05-07T12:00:00.000Z",
      runBatch: async () => fakeBatch,
    });

    expect(
      unavailable.repository.listDecisionReviewJobs(unavailable.plan.batch.id),
    ).toMatchObject([{ status: "market_context_unavailable", symbol: "UNAV" }]);
    expect(
      unavailable.repository.listDecisionReviewDiagnosticsForBatch(
        unavailable.plan.batch.id,
      ),
    ).toMatchObject([
      {
        status: "market_context_unavailable",
        code: "market_context_unavailable",
        symbol: "UNAV",
      },
    ]);
  });

  it("builds a saved review queue with priority filters and trade links", async () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,OPENQ,Buy,100,10.00",
      "2026-05-01,09:30:00,GAPQ,Buy,100,10.00",
      "2026-05-01,10:00:00,GAPQ,Sell,100,10.50",
    ].join("\n");
    const { repository, plan } = planFor(csv, {
      mappingReview: true,
      groupingReview: true,
      pnlReview: true,
      openPositions: true,
      anomalyTypes: ["open_leftover"],
    });
    const fakeBatch: BatchTradeAnalysisResult = {
      contractVersion: "batch_trade_analysis_v1",
      source: "test",
      generatedAt: "2026-05-07T12:00:00.000Z",
      validateOnly: false,
      totals: {
        requests: 1,
        validated: 1,
        completed: 0,
        failed: 1,
        warnings: 0,
      },
      failureCounts: { insufficient_market_context: 1 },
      marketStructureCounts: { observed: 0, missing: 0, scoringUses: 0 },
      patternCounts: {
        detectedTotal: 0,
        normalizedTotal: 0,
        topAnchorPatternIds: {},
      },
      items: [
        {
          requestIndex: 0,
          status: "failed",
          symbol: "GAPQ",
          validation: { valid: true, issues: [] },
          failure: {
            code: "insufficient_market_context",
            source: "levels_system",
            title: "Insufficient market context",
            message: "Daily/4h context is unavailable.",
            retryable: false,
            userAction: "Backfill market context before decision review.",
            rawMessage: "Daily/4h context is unavailable.",
          },
          summary: null,
        },
      ],
    };

    repository.commitImportPlan(plan);
    await runPersistedDecisionReviewJobs({
      repository,
      importBatchId: plan.batch.id,
      generatedAt: "2026-05-07T12:00:00.000Z",
      runBatch: async () => fakeBatch,
    });

    const queue = buildSavedReviewQueueReadModel({ repository });

    expect(queue.contractVersion).toBe("saved_review_queue_read_model_v1");
    expect(queue.activeFilter).toBe("highest_priority");
    expect(queue.allItems).toHaveLength(2);
    expect(queue.tabs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "market_context_unavailable",
          count: 1,
        }),
        expect.objectContaining({ id: "blocked_open_trade", count: 1 }),
      ]),
    );
    expect(queue.items.map((item) => item.lane)).toEqual([
      "market_context_unavailable",
      "blocked_open_trade",
    ]);
    expect(queue.items[0]).toMatchObject({
      symbol: "GAPQ",
      priorityLabel: "urgent",
      marketContextSource: "market_context_unavailable",
    });
    expect(queue.items[0]?.href).toContain("from=review-queue");

    const openOnly = buildSavedReviewQueueReadModel({
      repository,
      activeFilter: "blocked_open_trade",
    });
    expect(openOnly.items).toMatchObject([{ symbol: "OPENQ" }]);
  });

  it("keeps sanitized insufficient-history cases as market-context diagnostics", async () => {
    const csv = [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-04-17,12:04:31,THIN1,Buy,30,23.70",
      "2026-04-17,12:24:20,THIN1,Sell,30,23.73",
      "2026-04-23,11:30:57,THIN2,Buy,5,19.84",
      "2026-04-23,12:31:55,THIN2,Sell,5,18.62",
    ].join("\n");
    const { repository, plan } = planFor(csv);
    const fakeBatch: BatchTradeAnalysisResult = {
      contractVersion: "batch_trade_analysis_v1",
      source: "test",
      generatedAt: "2026-05-07T12:00:00.000Z",
      validateOnly: false,
      totals: {
        requests: 2,
        validated: 2,
        completed: 0,
        failed: 2,
        warnings: 0,
      },
      failureCounts: { insufficient_market_context: 2 },
      marketStructureCounts: { observed: 0, missing: 0, scoringUses: 0 },
      patternCounts: {
        detectedTotal: 0,
        normalizedTotal: 0,
        topAnchorPatternIds: {},
      },
      items: ["THIN1", "THIN2"].map((symbol, requestIndex) => ({
        requestIndex,
        status: "failed" as const,
        symbol,
        validation: { valid: true, issues: [] },
        failure: {
          code: "insufficient_market_context",
          source: "levels_system",
          title: "Insufficient higher-timeframe context",
          message:
            "Daily/4h market context was unavailable or insufficient under the historical cutoff.",
          retryable: false,
          userAction:
            "Use execution/P&L review and do not show support/resistance conclusions.",
          rawMessage:
            "Daily/4h market context was unavailable or insufficient under the historical cutoff.",
        },
        summary: null,
      })),
    };

    repository.commitImportPlan(plan);
    const run = await runPersistedDecisionReviewJobs({
      repository,
      importBatchId: plan.batch.id,
      generatedAt: "2026-05-07T12:00:00.000Z",
      runBatch: async () => fakeBatch,
    });
    const readModel = buildSavedDecisionReviewReadModel({ repository });

    expect(run.completedSnapshotCount).toBe(0);
    expect(run.diagnosticCount).toBe(2);
    expect(run.statusCounts).toMatchObject({ market_context_unavailable: 2 });
    expect(readModel).toMatchObject({
      completedCount: 0,
      queuedCount: 0,
      marketContextUnavailableCount: 2,
      analysisFailedCount: 0,
      diagnosticCodeCounts: { market_context_unavailable: 2 },
      diagnosticStatusCounts: { market_context_unavailable: 2 },
      nextAction:
        "Execution review is available now; keep market-context conclusions unavailable until technical follow-up is resolved.",
    });
    expect(readModel.snapshots).toEqual([]);
    expect(readModel.diagnostics.map((diagnostic) => diagnostic.symbol)).toEqual([
      "THIN1",
      "THIN2",
    ]);
  });
});
