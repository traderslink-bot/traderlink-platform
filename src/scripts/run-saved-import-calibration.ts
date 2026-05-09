import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  buildCoachingLanguageQualityAudit,
  buildCoachingLanguageReadinessReport,
  buildCsvDryRunImportExperience,
  buildImportCommitPlan,
  buildProductTraderAnalyticsViewModel,
  type CoachingLanguageTextSource,
  type ImportCommitPlanResult,
  type ImportCommitSavedTradeRecord,
} from "../lib/trader-analytics";
import type {
  BrokerExecutionCsvFormat,
  BrokerExecutionCsvImportIssueCode,
  BrokerExecutionCsvRowOutcomeStatus,
} from "../lib/execution-sources/csv";
import {
  DEMO_ACCOUNT_ID,
  DEMO_USER_ID,
  DEMO_WORKSPACE_ID,
  resetTraderIntelligenceDatabaseForTests,
  SqliteImportCommitRepository,
} from "../lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";
import { readLevelsSystemRuntimeConfigFromEnv } from "../lib/support-resistance/levels-system-runtime-options";
import {
  buildSavedDecisionReviewReadModel,
  runPersistedDecisionReviewJobs,
} from "../lib/trader-analytics/server/saved-decision-review-service";

type CountMap = Record<string, number>;

interface SavedImportCalibrationOptions {
  csvPath: string;
  broker: BrokerExecutionCsvFormat;
  accountTimezone: string;
  generatedAt: string;
  outPath: string;
  dbPath: string;
}

interface SessionAggregate {
  count: number;
  closedCount: number;
  openCount: number;
  grossRealizedPnl: number;
  winners: number;
  losers: number;
  flats: number;
}

function parseArgs(argv: string[]): Map<string, string | true> {
  const parsed = new Map<string, string | true>();

  for (const arg of argv) {
    if (!arg.startsWith("--")) {
      continue;
    }

    const raw = arg.slice(2);
    const separatorIndex = raw.indexOf("=");
    if (separatorIndex === -1) {
      parsed.set(raw, true);
      continue;
    }

    parsed.set(raw.slice(0, separatorIndex), raw.slice(separatorIndex + 1));
  }

  return parsed;
}

function argString(
  parsed: Map<string, string | true>,
  name: string,
): string | null {
  const value = parsed.get(name);
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readCsvPathFromArtifact(artifactPath: string): string {
  const document = JSON.parse(readFileSync(resolve(artifactPath), "utf8")) as {
    csvPath?: unknown;
  };

  if (typeof document.csvPath !== "string" || document.csvPath.length === 0) {
    throw new Error("Artifact does not contain a csvPath string.");
  }

  return document.csvPath;
}

function timestampSlug(value: string): string {
  return value.replace(/[:.]/g, "-");
}

function buildOptions(): SavedImportCalibrationOptions {
  const parsed = parseArgs(process.argv.slice(2));
  const generatedAt = argString(parsed, "generated-at") ?? new Date().toISOString();
  const artifactPath = argString(parsed, "csv-from-artifact");
  const csvPath = argString(parsed, "csv") ?? (
    artifactPath ? readCsvPathFromArtifact(artifactPath) : null
  );

  if (!csvPath) {
    throw new Error("--csv or --csv-from-artifact is required.");
  }

  const outPath =
    argString(parsed, "out") ??
    `artifacts/real-csv-calibration/private/saved-import-calibration-${timestampSlug(generatedAt)}.json`;
  const dbPath =
    argString(parsed, "db") ??
    outPath.replace(/\.json$/i, ".sqlite");

  if (existsSync(resolve(dbPath))) {
    throw new Error(
      `Calibration DB already exists: ${dbPath}. Choose a fresh --db path.`,
    );
  }

  return {
    csvPath: resolve(csvPath),
    broker: (argString(parsed, "broker") ??
      "ibkr_activity_statement") as BrokerExecutionCsvFormat,
    accountTimezone: argString(parsed, "account-timezone") ?? "America/Toronto",
    generatedAt,
    outPath: resolve(outPath),
    dbPath: resolve(dbPath),
  };
}

function countBy<T extends string>(values: T[]): Record<T, number> {
  return values.reduce<Record<T, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

function topCounts(counts: CountMap, limit = 12): CountMap {
  return Object.fromEntries(
    Object.entries(counts)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, limit),
  );
}

function aggregateTrades(
  trades: ImportCommitSavedTradeRecord[],
  keyForTrade: (trade: ImportCommitSavedTradeRecord) => string,
): Record<string, SessionAggregate> {
  const aggregates: Record<string, SessionAggregate> = {};

  for (const trade of trades) {
    const key = keyForTrade(trade);
    const current = aggregates[key] ?? {
      count: 0,
      closedCount: 0,
      openCount: 0,
      grossRealizedPnl: 0,
      winners: 0,
      losers: 0,
      flats: 0,
    };
    const pnl = trade.grossRealizedPnl ?? 0;

    current.count += 1;
    current.closedCount += trade.lifecycleStatus === "closed" ? 1 : 0;
    current.openCount += trade.lifecycleStatus === "open" ? 1 : 0;
    current.grossRealizedPnl = Number(
      (current.grossRealizedPnl + pnl).toFixed(2),
    );
    current.winners += trade.lifecycleStatus === "closed" && pnl > 0 ? 1 : 0;
    current.losers += trade.lifecycleStatus === "closed" && pnl < 0 ? 1 : 0;
    current.flats += trade.lifecycleStatus === "closed" && pnl === 0 ? 1 : 0;
    aggregates[key] = current;
  }

  return Object.fromEntries(
    Object.entries(aggregates).sort((left, right) =>
      left[0].localeCompare(right[0]),
    ),
  );
}

function summarizePlan(plan: ImportCommitPlanResult) {
  return {
    status: plan.status,
    canCommitNow: plan.canCommitNow,
    nextAction: plan.readModel.nextAction,
    batchStatus: plan.batch.status,
    rowCount: plan.batch.rowCount,
    acceptedExecutionCount: plan.batch.acceptedExecutionCount,
    rejectedRowCount: plan.batch.rejectedRowCount,
    skippedRowCount: plan.batch.skippedRowCount,
    groupedTradeCount: plan.readModel.groupedTradeCount,
    openPositionCount: plan.readModel.openPositionCount,
    duplicateFile: plan.readModel.duplicateFile,
    duplicateTradeCount: plan.readModel.duplicateTradeCount,
    anomalyCount: plan.readModel.anomalyCount,
    urgentAnomalyCount: plan.readModel.urgentAnomalyCount,
    reviewAnomalyCount: plan.readModel.reviewAnomalyCount,
    blockingReasonCount: plan.blockingReasons.length,
    reviewReasonCount: plan.reviewReasons.length,
    requiredDecisionKinds: countBy(plan.requiredDecisions.map((item) => item.kind)),
    rowOutcomes: countBy(
      plan.rows.map((row) => row.status as BrokerExecutionCsvRowOutcomeStatus),
    ),
    issueCodes: topCounts(
      countBy(
        plan.issues.map(
          (issue) => issue.issueCode as BrokerExecutionCsvImportIssueCode,
        ),
      ),
    ),
    issueSeverities: countBy(plan.issues.map((issue) => issue.severity)),
    repairSeverities: countBy(plan.repairItems.map((item) => item.severity)),
    repairStatuses: countBy(plan.repairItems.map((item) => item.status)),
    repairActionKinds: topCounts(
      countBy(plan.repairItems.map((item) => item.actionKind)),
    ),
    decisionReviewJobs: countBy(plan.decisionReviewJobs.map((job) => job.status)),
    feedbackSummaryCount: plan.executionFeedbackSummaries.length,
  };
}

function markdownTable(rows: Array<[string, string | number]>): string {
  return [
    "| Metric | Value |",
    "| --- | ---: |",
    ...rows.map(([label, value]) => `| ${label} | ${value} |`),
  ].join("\n");
}

function renderSessionTable(aggregates: Record<string, SessionAggregate>): string {
  const rows = Object.entries(aggregates);
  if (rows.length === 0) {
    return "_No saved trades._";
  }

  return [
    "| Bucket | Trades | Closed | Open | Gross P/L | Winners | Losers | Flat |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map(([bucket, value]) =>
      [
        `| ${bucket}`,
        value.count,
        value.closedCount,
        value.openCount,
        value.grossRealizedPnl.toFixed(2),
        value.winners,
        value.losers,
        value.flats,
      ].join(" | ") + " |",
    ),
  ].join("\n");
}

function buildMarkdownReport(args: {
  generatedAt: string;
  broker: string;
  accountTimezone: string;
  commitStatus: string;
  planSummary: ReturnType<typeof summarizePlan>;
  commitResult: unknown;
  duplicateSummary: ReturnType<typeof summarizePlan> | null;
  entrySessionPerformance: Record<string, SessionAggregate>;
  entryHourPerformance: Record<string, SessionAggregate>;
  readiness: {
    status: string;
    checkedTextCount: number;
    failureCount: number;
    warningCount: number;
  } | null;
  qualityAudit: {
    passed: boolean;
    checkedTextCount: number;
    violationCount: number;
  } | null;
  savedDecisionReview: {
    completedCount: number;
    queuedCount: number;
    blockedOpenTradeCount: number;
    marketContextUnavailableCount: number;
    analysisFailedCount: number;
    diagnosticCount: number;
    diagnosticCodeCounts: CountMap;
  } | null;
}): string {
  const commitResult =
    typeof args.commitResult === "object" && args.commitResult !== null
      ? args.commitResult as { savedTradeCount?: number; executionCount?: number; decisionReviewJobCount?: number }
      : {};

  return [
    "# Saved Import Calibration",
    "",
    "Private aggregate report. Raw CSV text, account identifiers, and the private file path are intentionally omitted.",
    "",
    markdownTable([
      ["Generated At", args.generatedAt],
      ["Broker", args.broker],
      ["Account Timezone", args.accountTimezone],
      ["Preview Status", args.planSummary.status],
      ["Commit Status", args.commitStatus],
      ["Rows", args.planSummary.rowCount],
      ["Accepted Executions", args.planSummary.acceptedExecutionCount],
      ["Skipped Rows", args.planSummary.skippedRowCount],
      ["Rejected Rows", args.planSummary.rejectedRowCount],
      ["Grouped Trades", args.planSummary.groupedTradeCount],
      ["Open Positions", args.planSummary.openPositionCount],
      ["Saved Trades", commitResult.savedTradeCount ?? 0],
      ["Saved Executions", commitResult.executionCount ?? 0],
      ["Decision Review Jobs", commitResult.decisionReviewJobCount ?? 0],
      ["Completed Review Snapshots", args.savedDecisionReview?.completedCount ?? 0],
      ["Queued Review Jobs", args.savedDecisionReview?.queuedCount ?? 0],
      [
        "Blocked Open Review Jobs",
        args.savedDecisionReview?.blockedOpenTradeCount ?? 0,
      ],
      [
        "Market Context Unavailable",
        args.savedDecisionReview?.marketContextUnavailableCount ?? 0,
      ],
      ["Analysis Failed", args.savedDecisionReview?.analysisFailedCount ?? 0],
      ["Review Diagnostics", args.savedDecisionReview?.diagnosticCount ?? 0],
      ["Blocking Reasons", args.planSummary.blockingReasonCount],
      ["Review Reasons", args.planSummary.reviewReasonCount],
      ["Anomalies", args.planSummary.anomalyCount],
    ]),
    "",
    "## Duplicate Detection",
    "",
    args.duplicateSummary
      ? markdownTable([
          ["Duplicate File", String(args.duplicateSummary.duplicateFile)],
          ["Duplicate Trades", args.duplicateSummary.duplicateTradeCount],
          ["Second Preview Status", args.duplicateSummary.status],
          ["Second Preview Review Reasons", args.duplicateSummary.reviewReasonCount],
        ])
      : "_Duplicate check skipped because the first import did not commit._",
    "",
    "## Decision Review Diagnostics",
    "",
    args.savedDecisionReview &&
    Object.keys(args.savedDecisionReview.diagnosticCodeCounts).length > 0
      ? markdownTable(
          Object.entries(args.savedDecisionReview.diagnosticCodeCounts).map(
            ([code, count]) => [code, count],
          ),
        )
      : "_No saved decision-review diagnostics._",
    "",
    "## Entry Session Performance",
    "",
    renderSessionTable(args.entrySessionPerformance),
    "",
    "## Entry Hour Performance",
    "",
    renderSessionTable(args.entryHourPerformance),
    "",
    "## Coaching Language",
    "",
    args.readiness
      ? markdownTable([
          ["Readiness Status", args.readiness.status],
          ["Readiness Texts Checked", args.readiness.checkedTextCount],
          ["Readiness Failures", args.readiness.failureCount],
          ["Readiness Warnings", args.readiness.warningCount],
          ["Quality Audit Passed", String(args.qualityAudit?.passed ?? false)],
          ["Quality Texts Checked", args.qualityAudit?.checkedTextCount ?? 0],
          ["Quality Violations", args.qualityAudit?.violationCount ?? 0],
        ])
      : "_Coaching language was not built because the import did not commit._",
    "",
  ].join("\n");
}

function requiresEvidenceBasis(args: {
  source: CoachingLanguageTextSource;
  field: string;
  relatedTradeIds: string[];
}): boolean {
  if (["headline", "title", "action.label", "ruleFocus"].includes(args.field)) {
    return false;
  }

  if (args.field === "sessionTimeInsight") {
    return false;
  }

  if (args.source === "session_recap") {
    return args.field === "nextAction";
  }

  if (args.source === "coach_review_queue") {
    return args.field === "nextAction" && args.relatedTradeIds.length > 0;
  }

  return [
    "daily_coach_report",
    "coach_home",
    "session_prep",
    "confidence_language",
    "mistake_severity",
  ].includes(args.source);
}

async function run(): Promise<void> {
  const options = buildOptions();
  const csvText = readFileSync(options.csvPath, "utf8");

  mkdirSync(dirname(options.outPath), { recursive: true });
  mkdirSync(dirname(options.dbPath), { recursive: true });
  process.env.TRADER_INTELLIGENCE_DB_PATH = options.dbPath;
  resetTraderIntelligenceDatabaseForTests();

  const repository = new SqliteImportCommitRepository();
  const experience = buildCsvDryRunImportExperience({
    csvText,
    broker: options.broker,
    accountTimezone: options.accountTimezone,
  });
  const anomalyTypes = [
    ...new Set(experience.executionAnomalyDetector.items.map((item) => item.type)),
  ];
  const plan = buildImportCommitPlan({
    workspaceId: DEMO_WORKSPACE_ID,
    userId: DEMO_USER_ID,
    accountId: DEMO_ACCOUNT_ID,
    experience,
    generatedAt: options.generatedAt,
    existingFileFingerprints: repository.listCommittedFileFingerprints(
      DEMO_ACCOUNT_ID,
    ),
    existingTradeFingerprints: repository.listCommittedTradeFingerprints(
      DEMO_ACCOUNT_ID,
    ),
    acknowledgements: {
      mappingReview: true,
      pnlReview: true,
      groupingReview: true,
      openPositions: true,
      anomalyTypes,
    },
  });
  const commitResult = repository.commitImportPlan(plan);
  const committed = commitResult.status === "committed";
  const decisionReviewRun = committed
    ? await runPersistedDecisionReviewJobs({
        repository,
        importBatchId: plan.batch.id,
        levelsSystem: readLevelsSystemRuntimeConfigFromEnv(),
        generatedAt: options.generatedAt,
        maxTrades: 999,
      })
    : null;
  const savedDecisionReview = committed
    ? buildSavedDecisionReviewReadModel({ repository })
    : null;
  const duplicatePlan = committed
    ? buildImportCommitPlan({
        workspaceId: DEMO_WORKSPACE_ID,
        userId: DEMO_USER_ID,
        accountId: DEMO_ACCOUNT_ID,
        experience,
        generatedAt: options.generatedAt,
        existingFileFingerprints: repository.listCommittedFileFingerprints(
          DEMO_ACCOUNT_ID,
        ),
        existingTradeFingerprints: repository.listCommittedTradeFingerprints(
          DEMO_ACCOUNT_ID,
        ),
        acknowledgements: {
          mappingReview: true,
          pnlReview: true,
          groupingReview: true,
          openPositions: true,
          anomalyTypes,
        },
      })
    : null;

  let analytics:
    | ReturnType<typeof buildProductTraderAnalyticsViewModel>
    | null = null;
  let readiness: ReturnType<typeof buildCoachingLanguageReadinessReport> | null =
    null;
  let qualityAudit: ReturnType<typeof buildCoachingLanguageQualityAudit> | null =
    null;

  if (committed) {
    analytics = buildProductTraderAnalyticsViewModel({
      repository,
      userId: DEMO_USER_ID,
      storageMode: "local_sqlite_single_user",
      importRequests: plan.savedTrades.map((trade) => trade.request),
    });
    readiness = buildCoachingLanguageReadinessReport({
      analytics,
      generatedAt: options.generatedAt,
    });
    qualityAudit = buildCoachingLanguageQualityAudit({
      texts: readiness.textSamples.map((textSample) => ({
        sourceId: textSample.id,
        text: textSample.text,
        requiresEvidenceBasis: requiresEvidenceBasis({
          source: textSample.source,
          field: textSample.field,
          relatedTradeIds: textSample.relatedTradeIds,
        }),
      })),
    });
  }

  const entrySessionPerformance = aggregateTrades(
    plan.savedTrades,
    (trade) => trade.entrySessionBucket,
  );
  const entryHourPerformance = aggregateTrades(
    plan.savedTrades,
    (trade) => trade.entryHourLabelEt,
  );
  const report = {
    contractVersion: "saved_import_calibration_v1",
    generatedAt: options.generatedAt,
    broker: options.broker,
    accountTimezone: options.accountTimezone,
    privateCsvPathOmitted: true,
    dbPath: options.dbPath,
    planSummary: summarizePlan(plan),
    commitResult,
    decisionReviewRun,
    savedDecisionReview: savedDecisionReview
      ? {
          totalJobCount: savedDecisionReview.totalJobCount,
          queuedCount: savedDecisionReview.queuedCount,
          completedCount: savedDecisionReview.completedCount,
          blockedOpenTradeCount: savedDecisionReview.blockedOpenTradeCount,
          marketContextUnavailableCount:
            savedDecisionReview.marketContextUnavailableCount,
          analysisFailedCount: savedDecisionReview.analysisFailedCount,
          skippedLimitCount: savedDecisionReview.skippedLimitCount,
          snapshotCount: savedDecisionReview.snapshots.length,
          diagnosticCount: savedDecisionReview.diagnostics.length,
          statusCounts: savedDecisionReview.statusCounts,
          diagnosticCodeCounts: savedDecisionReview.diagnosticCodeCounts,
          diagnosticStatusCounts: savedDecisionReview.diagnosticStatusCounts,
          marketContextSourceCounts: decisionReviewRun?.marketContextSourceCounts ?? {},
        }
      : null,
    duplicateSummary: duplicatePlan ? summarizePlan(duplicatePlan) : null,
    importHistory: repository.listImportBatchHistory(DEMO_ACCOUNT_ID).map((item) => ({
      summaryStatus: item.summaryStatus,
      duplicateFile: item.duplicateFile,
      duplicateTradeCount: item.duplicateTradeCount,
      requiredDecisionCount: item.requiredDecisionCount,
      blockerCount: item.blockerCount,
      reviewCount: item.reviewCount,
      openRepairCount: item.openRepairCount,
      savedTradeCount: item.savedTradeCount,
      decisionReviewJobCount: item.decisionReviewJobCount,
    })),
    unresolvedRepairCount:
      repository.listUnresolvedImportRepairInbox(DEMO_ACCOUNT_ID).length,
    entrySessionPerformance,
    entryHourPerformance,
    heldThroughFlags: {
      heldPremarketIntoOpen: plan.savedTrades.filter(
        (trade) => trade.heldPremarketIntoOpen,
      ).length,
      heldOpenIntoMidday: plan.savedTrades.filter(
        (trade) => trade.heldOpenIntoMidday,
      ).length,
      heldMiddayIntoPostmarket: plan.savedTrades.filter(
        (trade) => trade.heldMiddayIntoPostmarket,
      ).length,
      heldPostmarketIntoOvernight: plan.savedTrades.filter(
        (trade) => trade.heldPostmarketIntoOvernight,
      ).length,
      heldOvernight: plan.savedTrades.filter((trade) => trade.heldOvernight).length,
    },
    analyticsSummary: analytics
      ? {
          sampleData: analytics.latestReport.sampleData,
          completedTradeCount:
            analytics.latestReport.report.sampleSize.completedTradeCount,
          openTradeCount:
            analytics.latestReport.report.lifecycle.openPositionTradeCount,
          grossRealizedPnl:
            analytics.latestReport.report.pnl.grossTotalRealizedPnl,
          coachEmptyStateKind: analytics.coachActionLoop.emptyState.kind,
          coachPrimaryActionId: analytics.coachActionLoop.coachHome.primaryAction.id,
          reviewChecklistCount:
            analytics.reviewHabitLoop.tradeReviewChecklists.length,
        }
      : null,
    coachingLanguageReadiness: readiness
      ? {
          status: readiness.status,
          checkedTextCount: readiness.checkedTextCount,
          failureCount: readiness.failureCount,
          warningCount: readiness.warningCount,
          marketContextUsedForCoachConclusions:
            readiness.marketContextUsedForCoachConclusions,
          violations: readiness.violations.map((violation) => ({
            kind: violation.kind,
            severity: violation.severity,
            source: violation.source,
            field: violation.sourceId,
            detail: violation.detail,
          })),
        }
      : null,
    coachingLanguageQuality: qualityAudit
      ? {
          passed: qualityAudit.passed,
          checkedTextCount: qualityAudit.checkedTextCount,
          violations: qualityAudit.violations.map((violation) => ({
            sourceId: violation.sourceId,
            kind: violation.kind,
            detail: violation.detail,
            text: violation.text,
          })),
        }
      : null,
  };
  const markdownPath = options.outPath.replace(/\.json$/i, ".md");

  writeFileSync(options.outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(
    markdownPath,
    buildMarkdownReport({
      generatedAt: options.generatedAt,
      broker: options.broker,
      accountTimezone: options.accountTimezone,
      commitStatus: commitResult.status,
      planSummary: report.planSummary,
      commitResult,
      duplicateSummary: report.duplicateSummary,
      entrySessionPerformance,
      entryHourPerformance,
      savedDecisionReview: savedDecisionReview
        ? {
            completedCount: savedDecisionReview.completedCount,
            queuedCount: savedDecisionReview.queuedCount,
            blockedOpenTradeCount: savedDecisionReview.blockedOpenTradeCount,
            marketContextUnavailableCount:
              savedDecisionReview.marketContextUnavailableCount,
            analysisFailedCount: savedDecisionReview.analysisFailedCount,
            diagnosticCount: savedDecisionReview.diagnostics.length,
            diagnosticCodeCounts: savedDecisionReview.diagnosticCodeCounts,
          }
        : null,
      readiness: readiness
        ? {
            status: readiness.status,
            checkedTextCount: readiness.checkedTextCount,
            failureCount: readiness.failureCount,
            warningCount: readiness.warningCount,
          }
        : null,
      qualityAudit: qualityAudit
        ? {
            passed: qualityAudit.passed,
            checkedTextCount: qualityAudit.checkedTextCount,
            violationCount: qualityAudit.violations.length,
          }
        : null,
    }),
    "utf8",
  );

  resetTraderIntelligenceDatabaseForTests();
  process.stdout.write(`Saved import calibration JSON: ${options.outPath}\n`);
  process.stdout.write(`Saved import calibration Markdown: ${markdownPath}\n`);
}

run().catch((error: unknown) => {
  process.stderr.write(error instanceof Error ? `${error.stack}\n` : `${error}\n`);
  process.exitCode = 1;
});
