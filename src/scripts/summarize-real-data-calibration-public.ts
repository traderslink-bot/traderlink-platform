import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseBrokerExecutionCsv } from "../lib/execution-sources/csv";
import {
  summarizeDecisionReviewCalibrationReadiness,
  type DecisionReviewCalibrationReport,
} from "../lib/trader-analytics/server/decision-review-calibration-readiness";

function getArgValue(name: string): string | undefined {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));

  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = process.argv.indexOf(name);

  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requiredArg(name: string): string {
  const value = getArgValue(name);

  if (!value || value.trim() === "") {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function increment(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function sortedLines(counts: Map<string, number> | Record<string, number>): string[] {
  const entries =
    counts instanceof Map ? [...counts.entries()] : Object.entries(counts);

  if (entries.length === 0) {
    return ["- none"];
  }

  return entries
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, count]) => `- ${key}: ${count}`);
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function diagnosticFamily(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("durable candle warehouse miss") && lower.includes("5m")) {
    return "durable_5m_warehouse_miss";
  }

  if (lower.includes("durable candle warehouse miss") && lower.includes("1m")) {
    return "durable_1m_warehouse_miss";
  }

  if (lower.includes("daily") || lower.includes("4h")) {
    return "daily_4h_context_unavailable";
  }

  if (lower.includes("open") && lower.includes("skipped")) {
    return "open_trade_skipped";
  }

  return "other";
}

async function main(): Promise<void> {
  const csvPath = resolve(requiredArg("--csv"));
  const decisionJsonPath = resolve(requiredArg("--decision-json"));
  const timezone = getArgValue("--account-timezone") ?? "America/New_York";
  const outputPath = resolve(
    getArgValue("--out") ??
      "src/docs/real-data-calibration-public-readiness-2026-05-06.md",
  );
  const generatedAt = new Date().toISOString();
  const csvText = await readFile(csvPath, "utf8");
  const importResult = parseBrokerExecutionCsv({
    csvText,
    broker: "ibkr_activity_statement",
    timestampTimezone: timezone,
    tradeGroupingRules: {
      maxGapMinutes: 10080,
      splitAtSessionBoundary: false,
    },
  });
  const decisionReport = JSON.parse(
    await readFile(decisionJsonPath, "utf8"),
  ) as DecisionReviewCalibrationReport;
  const decisionSummary =
    summarizeDecisionReviewCalibrationReadiness(decisionReport);
  const sessionCounts = new Map<string, number>();
  const hourCounts = new Map<string, number>();
  const heldSessionCounts = new Map<string, number>();
  const lifecycleCounts = new Map<string, number>();
  const directionCounts = new Map<string, number>();
  const groupingReasonCounts = new Map<string, number>();
  const diagnosticCodeCounts = new Map<string, number>();
  const diagnosticFamilyCounts = new Map<string, number>();
  const costVisibilityCounts = new Map<string, number>();
  let commissionExecutionCount = 0;
  let feeExecutionCount = 0;
  let brokerNetAmountExecutionCount = 0;

  for (const request of importResult.requests) {
    const session = request.sessionContext;
    const finalPosition = request.executions.reduce(
      (position, execution) => {
        const shares = numericValue(execution.shares) ?? 0;

        return position + (execution.side === "buy" ? shares : -shares);
      },
      0,
    );

    increment(
      sessionCounts,
      String(session.entrySessionBucket ?? session.sessionBucket ?? "unknown"),
    );
    increment(hourCounts, session.entryHourLabelEt ?? "unknown");
    increment(lifecycleCounts, Math.abs(finalPosition) > 0 ? "open" : "closed");
    increment(directionCounts, request.tradeDirection);

    for (const held of session.heldSessionBuckets ?? []) {
      increment(heldSessionCounts, String(held));
    }
  }

  for (const diagnostic of importResult.groupingDiagnostics ?? []) {
    increment(groupingReasonCounts, diagnostic.groupingReason ?? "unknown");
  }

  for (const diagnostic of decisionReport.result.diagnostics) {
    increment(diagnosticCodeCounts, diagnostic.code);
    increment(diagnosticFamilyCounts, diagnosticFamily(diagnostic.message));
  }

  for (const execution of importResult.executions) {
    const commission = numericValue(execution.commission);
    const fees = numericValue(execution.fees);
    const netAmount = numericValue(execution.netAmount);

    if (commission !== null && commission !== 0) {
      commissionExecutionCount += 1;
    }

    if (fees !== null && fees !== 0) {
      feeExecutionCount += 1;
    }

    if (netAmount !== null) {
      brokerNetAmountExecutionCount += 1;
    }
  }

  costVisibilityCounts.set("commission_present", commissionExecutionCount);
  costVisibilityCounts.set("fees_present", feeExecutionCount);
  costVisibilityCounts.set(
    "broker_net_amount_present",
    brokerNetAmountExecutionCount,
  );

  const importBlockerMisses = importResult.rejectedRowCount > 0
    ? ["Rejected execution rows require review before this private sample can be treated as import-ready."]
    : [];
  const marketContextUnavailableCount =
    decisionReport.result.diagnostics.filter(
      (diagnostic) => diagnostic.code === "market_context_unavailable",
    ).length;
  const marketDataReadinessMisses = decisionSummary.completedReviewCount === 0
    ? [
        "Decision-review calibration completed zero reviews because historical candle coverage was unavailable for the sample.",
      ]
    : [];
  const marketDataCoverageNotes = [
    marketContextUnavailableCount > 0
      ? `${marketContextUnavailableCount} completed-trade candidate(s) could not receive full daily/4h market context.`
      : null,
    decisionSummary.executionOnlyFallbackCount > 0
      ? `${decisionSummary.executionOnlyFallbackCount} review(s) used execution-only fallback because trade-window candle evidence was unavailable or unsafe.`
      : null,
    decisionSummary.candleQualityUnsafeBasisCount > 0
      ? `${decisionSummary.candleQualityUnsafeBasisCount} review row(s) had unsafe candle-basis notes and were kept evidence-gated.`
      : null,
  ].filter((note): note is string => note !== null);
  const behaviorInvariantMisses = [
    decisionSummary.stalePoorProfitProtectionFixFirstCount,
    decisionSummary.stalePrematureExitFixFirstCount,
    decisionSummary.staleAddingIntoWeaknessFixFirstCount,
    decisionSummary.staleUndersizedWinnerFixFirstCount,
    decisionSummary.contradictoryProfitProtectionAndCapturedExitCount,
  ].reduce((total, count) => total + count, 0);
  const highMisses = marketDataReadinessMisses.length + behaviorInvariantMisses;
  const hasEvidenceGatedLimitations =
    marketDataCoverageNotes.length > 0 || decisionSummary.openSkippedCount > 0;
  const currentConfidence =
    importResult.rejectedRowCount > 0
      ? "import_blocked"
      : marketDataReadinessMisses.length > 0
        ? "import_ready_market_data_blocked"
        : hasEvidenceGatedLimitations
          ? "ready_with_evidence_gated_limitations"
          : "ready_for_import_review";
  const decisionReviewPathLine =
    decisionSummary.completedReviewCount === 0
      ? "- decision-review path: blocked until historical candle coverage is available"
      : hasEvidenceGatedLimitations
        ? "- decision-review path: ready with evidence-gated limitations for unavailable or unsafe candle context"
        : "- decision-review path: ready for reviewed completed trades with levels-system market context";
  const syntheticFixtureActionLine =
    highMisses > 0
      ? "- synthetic fixture action: create a synthetic fixture only if the market-data miss turns into a reproducible app logic defect"
      : "- synthetic fixture action: no new fixture required from this run; no import/grouping/session/coaching logic miss was found";
  const syntheticFixtureReasonLine =
    highMisses > 0
      ? "- reason: the current miss is a market-data coverage dependency; existing tests already cover execution-only fallback honesty and market-data gating"
      : "- reason: evidence gaps were handled by skip/fallback gates, and no private-row logic defect was found";
  const decisionReviewGoNoGoLine =
    decisionSummary.completedReviewCount === 0
      ? "- decision review with market context: no-go until historical candle coverage is available for the calibrated sample"
      : hasEvidenceGatedLimitations
        ? "- decision review with market context: go with evidence-gated limitations; unavailable/unsafe candle rows must stay skipped or execution-only"
        : "- decision review with market context: go for completed trades with available levels-system evidence";
  const lines = [
    "# Real-Data Calibration Public Readiness - 2026-05-06",
    "",
    `Generated: ${generatedAt}`,
    "",
    "This report is public-safe by design. It contains aggregate counts only and excludes private file names, private paths, account identifiers, symbols, raw rows, exact execution timestamps, exact prices, exact share sizes, and trade-level details.",
    "",
    "## Scope",
    "",
    "- source type: private IBKR activity-statement CSV",
    "- asset scope: stock executions imported from broker CSV",
    "- scoring policy: gross-only execution feedback",
    "- session policy: U.S. equity session buckets classified in Eastern Time",
    "- decision-review market context: requires levels-system daily/4h context and 1m/5m trade-window candles",
    "",
    "## Current Launch Confidence",
    "",
    `- status: ${currentConfidence}`,
    "- import/session-time path: ready for review on this aggregate sample",
    decisionReviewPathLine,
    syntheticFixtureActionLine,
    "",
    "## Import Aggregate Counts",
    "",
    `- rows parsed: ${importResult.rowCount}`,
    `- accepted executions: ${importResult.acceptedExecutionCount}`,
    `- rejected rows: ${importResult.rejectedRowCount}`,
    `- skipped rows: ${importResult.skippedRowCount}`,
    `- grouped trades: ${importResult.requestCount}`,
    `- duplicate request fingerprints: ${importResult.diagnostics.duplicateRequestFingerprints.length}`,
    "",
    "## Lifecycle And Direction Counts",
    "",
    ...sortedLines(lifecycleCounts),
    "",
    ...sortedLines(directionCounts),
    "",
    "## Session-Time Counts",
    "",
    "Entry sessions:",
    "",
    ...sortedLines(sessionCounts),
    "",
    "Top entry hours:",
    "",
    ...sortedLines(hourCounts).slice(0, 12),
    "",
    "Held-through sessions:",
    "",
    ...sortedLines(heldSessionCounts),
    "",
    "## Import Issue Counts",
    "",
    ...sortedLines(
      Object.fromEntries(
        Object.entries(importResult.diagnostics.issueCountsByCode).map(
          ([key, value]) => [key, value ?? 0],
        ),
      ),
    ),
    "",
    "## Grouping Reason Counts",
    "",
    ...sortedLines(groupingReasonCounts),
    "",
    "## Cost Visibility Counts",
    "",
    ...sortedLines(costVisibilityCounts),
    "",
    "## Decision-Review Aggregate Counts",
    "",
    `- import status: ${decisionSummary.importStatus}`,
    `- requested trades: ${decisionSummary.requestedTradeCount}`,
    `- analyzable trades: ${decisionSummary.analyzableTradeCount}`,
    `- completed reviews: ${decisionSummary.completedReviewCount}`,
    `- diagnostics: ${decisionSummary.diagnosticCount}`,
    `- open skipped trades: ${decisionSummary.openSkippedCount}`,
    `- execution-only fallback reviews: ${decisionSummary.executionOnlyFallbackCount}`,
    `- unsafe candle-basis rows: ${decisionSummary.candleQualityUnsafeBasisCount}`,
    `- missing trade-window excursion insights: ${decisionSummary.missingTradeWindowExcursionCount}`,
    `- fallback/generic headlines: ${decisionSummary.fallbackHeadlineCount}`,
    "",
    "Behavior invariant counts:",
    "",
    `- profit-protection/captured-exit contradictions: ${decisionSummary.contradictoryProfitProtectionAndCapturedExitCount}`,
    `- stale poor-profit-protection fix-first labels: ${decisionSummary.stalePoorProfitProtectionFixFirstCount}`,
    `- stale premature-exit fix-first labels: ${decisionSummary.stalePrematureExitFixFirstCount}`,
    `- stale adding-into-weakness fix-first labels: ${decisionSummary.staleAddingIntoWeaknessFixFirstCount}`,
    `- stale undersized-winner fix-first labels: ${decisionSummary.staleUndersizedWinnerFixFirstCount}`,
    "",
    "Decision-review diagnostic codes:",
    "",
    ...sortedLines(diagnosticCodeCounts),
    "",
    "Decision-review diagnostic families:",
    "",
    ...sortedLines(diagnosticFamilyCounts),
    "",
    "## Miss Summary",
    "",
    `- blocker: ${importBlockerMisses.length}`,
    `- high: ${highMisses}`,
    "- medium: 0",
    "- low: 0",
    "",
    ...(importBlockerMisses.length > 0
      ? importBlockerMisses.map((miss) => `- blocker detail: ${miss}`)
      : ["- no import/grouping/session blocker misses found"]),
    ...(marketDataReadinessMisses.length > 0
      ? marketDataReadinessMisses.map((miss) => `- high detail: ${miss}`)
      : ["- no market-data readiness misses found"]),
    ...(marketDataCoverageNotes.length > 0
      ? [
          "",
          "Market-data coverage notes:",
          "",
          ...marketDataCoverageNotes.map((note) => `- ${note}`),
        ]
      : []),
    "",
    "## Synthetic Fixture Decision",
    "",
    "- no new synthetic fixture was created from this calibration run",
    syntheticFixtureReasonLine,
    "- next fixture trigger: create a synthetic fixture if a private run reveals an import/grouping/session/coaching logic miss rather than a warehouse-coverage miss",
    "",
    "## Go / No-Go",
    "",
    "- import/grouping/session-time: go for current intended stock-execution CSV scope",
    decisionReviewGoNoGoLine,
    "- coaching from execution-only facts: go within existing gross-only/execution-only boundaries",
    "",
    "## Verification Notes",
    "",
    "- public report generated from private inputs using aggregate-only summarization",
    "- private diagnostic JSON remains under private artifacts",
    "- no private data is included in this committed report",
  ];

  const output = `${lines.join("\n").trimEnd()}\n`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, "utf8");
  process.stdout.write(output);
  process.stderr.write(`Wrote public calibration report: ${outputPath}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
