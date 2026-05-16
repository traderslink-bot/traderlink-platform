import type {
  BrokerExecutionCsvColumnMapping,
  BrokerExecutionCsvFormat,
} from "../../execution-sources/csv";
import type { LevelsSystemRuntimeConfig } from "../../support-resistance/levels-system-runtime-options";
import { runBatchTradeAnalysis } from "../../trade-analysis/batch/run-trade-analysis-batch";
import { buildCsvDryRunImportExperience } from "../product/csv-dry-run-workflow";
import type { CsvDryRunPrototypeDecisionReviewInput } from "../product/functional-readiness";

export type CsvDryRunDecisionReviewBridgeDiagnosticCode =
  | "import_blocked"
  | "trade_open"
  | "trade_not_completed"
  | "market_context_unavailable"
  | "analysis_failed"
  | "limit_reached";

export interface CsvDryRunDecisionReviewBridgeDiagnostic {
  requestIndex: number | null;
  symbol: string | null;
  code: CsvDryRunDecisionReviewBridgeDiagnosticCode;
  message: string;
}

export interface BuildCsvDryRunDecisionReviewBridgeArgs {
  csvText: string;
  broker: BrokerExecutionCsvFormat;
  accountTimezone?: string;
  columnMapping?: BrokerExecutionCsvColumnMapping;
  levelsSystem?: LevelsSystemRuntimeConfig;
  generatedAt?: string;
  maxTrades?: number;
}

export interface CsvDryRunDecisionReviewBridgeResult {
  contractVersion: "csv_dry_run_decision_review_bridge_v1";
  source: "server_dry_run_decision_review";
  importStatus: "blocked" | "needs_review" | "ready";
  requestedTradeCount: number;
  analyzableTradeCount: number;
  completedReviewCount: number;
  decisionReviews: CsvDryRunPrototypeDecisionReviewInput[];
  diagnostics: CsvDryRunDecisionReviewBridgeDiagnostic[];
  marketContextSourceCounts: Record<string, number>;
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function importStatusFromGate(
  status: ReturnType<
    typeof buildCsvDryRunImportExperience
  >["confidenceGate"]["status"],
): CsvDryRunDecisionReviewBridgeResult["importStatus"] {
  return status === "blocked"
    ? "blocked"
    : status === "needs_review"
      ? "needs_review"
      : "ready";
}

function isCandleQualityWarning(warning: string): boolean {
  const normalized = warning.toLowerCase();

  return (
    normalized.includes("trade-window candles were ignored") ||
    normalized.includes("1m trade-window candles were unavailable") ||
    normalized.includes("5m fallback candles were used") ||
    normalized.includes("no pre-trade candles") ||
    normalized.includes("no post-trade candles") ||
    normalized.includes(
      "default provider resolved to deterministic stub data",
    ) ||
    normalized.includes("validated ibkr alias") ||
    normalized.includes("resolved through") ||
    normalized.includes("otc/pink data path") ||
    normalized.includes("possible split/adjustment") ||
    normalized.includes("symbol mapping mismatch") ||
    normalized.includes("price bases") ||
    normalized.includes("price-basis") ||
    normalized.includes("adjustment multiple") ||
    normalized.includes("trade-window candle basis status") ||
    normalized.includes("basis is proven aligned")
  );
}

export function buildDecisionReviewSnapshotFromTradeAnalysisSummary(args: {
  tradeId: string;
  requestIndex: number;
  symbol: string | null;
  summary: NonNullable<
    Awaited<
      ReturnType<typeof runBatchTradeAnalysis>
    >["items"][number]["summary"]
  >;
}): CsvDryRunPrototypeDecisionReviewInput {
  const review = args.summary.decisionReview;
  const candleQualityNotes = args.summary.warnings.filter(
    isCandleQualityWarning,
  );

  return {
    tradeId: args.tradeId,
    coachingHeadline: review.coaching.headline,
    fixFirstBehaviorId: review.coaching.fixFirstBehaviorId,
    marketContextSource: review.marketContext.source,
    tradeWindowEvidenceSource:
      args.summary.candleCounts.trade > 0
        ? "levels_system_trade_window"
        : "execution_only_fallback",
    candleQualityNotes,
    replayCandleWindow: args.summary.replayCandleWindow,
    insights: review.insights.map((insight) => ({
      id: insight.id,
      tone: insight.tone,
      category: insight.category,
      title: insight.title,
      summary: insight.summary,
      evidence: insight.evidence,
    })),
  };
}

function diagnosticCodeForFailure(
  failure: Awaited<
    ReturnType<typeof runBatchTradeAnalysis>
  >["items"][number]["failure"],
): Extract<
  CsvDryRunDecisionReviewBridgeDiagnosticCode,
  "market_context_unavailable" | "analysis_failed"
> {
  return failure?.code === "insufficient_market_context"
    ? "market_context_unavailable"
    : "analysis_failed";
}

function decisionReviewSnapshot(args: {
  requestIndex: number;
  symbol: string | null;
  summary: NonNullable<
    Awaited<
      ReturnType<typeof runBatchTradeAnalysis>
    >["items"][number]["summary"]
  >;
}): CsvDryRunPrototypeDecisionReviewInput {
  return buildDecisionReviewSnapshotFromTradeAnalysisSummary({
    tradeId: `dry-run-trade-${args.requestIndex + 1}-${(args.symbol ?? "unknown").toLowerCase()}`,
    requestIndex: args.requestIndex,
    symbol: args.symbol,
    summary: args.summary,
  });
}

export async function buildCsvDryRunDecisionReviewBridge(
  args: BuildCsvDryRunDecisionReviewBridgeArgs,
): Promise<CsvDryRunDecisionReviewBridgeResult> {
  const maxTrades = Math.max(0, args.maxTrades ?? 5);
  const experience = buildCsvDryRunImportExperience({
    csvText: args.csvText,
    broker: args.broker,
    accountTimezone: args.accountTimezone,
    columnMapping: args.columnMapping,
  });
  const importStatus = importStatusFromGate(experience.confidenceGate.status);
  const diagnostics: CsvDryRunDecisionReviewBridgeDiagnostic[] = [];

  if (importStatus === "blocked") {
    diagnostics.push(
      ...experience.confidenceGate.blockedReasons.map((reason) => ({
        requestIndex: null,
        symbol: null,
        code: "import_blocked" as const,
        message: reason,
      })),
    );

    return {
      contractVersion: "csv_dry_run_decision_review_bridge_v1",
      source: "server_dry_run_decision_review",
      importStatus,
      requestedTradeCount: experience.preview.importResult.requestCount,
      analyzableTradeCount: 0,
      completedReviewCount: 0,
      decisionReviews: [],
      diagnostics,
      marketContextSourceCounts: {},
    };
  }

  const indexedRequests = experience.preview.importResult.requests.map(
    (request, requestIndex) => ({
      request,
      requestIndex,
      diagnostic: experience.preview.importResult.groupingDiagnostics.find(
        (item) => item.requestIndex === requestIndex,
      ),
    }),
  );
  const closedRequests = indexedRequests.filter((item) => {
    if (item.diagnostic?.lifecycleStatus === "open") {
      diagnostics.push({
        requestIndex: item.requestIndex,
        symbol: item.request.symbol,
        code: "trade_open",
        message: `${item.request.symbol} is open and was skipped for completed-trade decision review.`,
      });
      return false;
    }

    return true;
  });
  const selectedRequests = closedRequests.slice(0, maxTrades);

  if (closedRequests.length > selectedRequests.length) {
    diagnostics.push({
      requestIndex: null,
      symbol: null,
      code: "limit_reached",
      message: `Analyzed ${selectedRequests.length} of ${closedRequests.length} eligible trade(s).`,
    });
  }

  const batch = await runBatchTradeAnalysis({
    source: "server:csv-dry-run-decision-review",
    requests: selectedRequests.map((item) => item.request),
    levelsSystem: args.levelsSystem,
    generatedAt: args.generatedAt,
  });
  const decisionReviews: CsvDryRunPrototypeDecisionReviewInput[] = [];
  const marketContextSourceCounts: Record<string, number> = {};

  batch.items.forEach((item, batchIndex) => {
    const original = selectedRequests[batchIndex];
    const requestIndex = original?.requestIndex ?? item.requestIndex;
    const symbol = original?.request.symbol ?? item.symbol;

    if (item.status !== "completed" || !item.summary) {
      diagnostics.push({
        requestIndex,
        symbol,
        code: item.failure
          ? diagnosticCodeForFailure(item.failure)
          : "trade_not_completed",
        message:
          item.failure?.message ??
          `${symbol ?? "Trade"} did not complete chart review analysis.`,
      });
      return;
    }

    const snapshot = decisionReviewSnapshot({
      requestIndex,
      symbol,
      summary: item.summary,
    });
    decisionReviews.push(snapshot);
    increment(
      marketContextSourceCounts,
      snapshot.marketContextSource ?? "none",
    );
  });

  return {
    contractVersion: "csv_dry_run_decision_review_bridge_v1",
    source: "server_dry_run_decision_review",
    importStatus,
    requestedTradeCount: experience.preview.importResult.requestCount,
    analyzableTradeCount: selectedRequests.length,
    completedReviewCount: decisionReviews.length,
    decisionReviews,
    diagnostics,
    marketContextSourceCounts,
  };
}
