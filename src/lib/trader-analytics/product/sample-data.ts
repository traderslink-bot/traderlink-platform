import inconsistentShareSizing from "../../../docs/trade-analysis-request-fixtures/inconsistent-share-sizing.json";
import invalidExecutionOnlyRequests from "../../../docs/trade-analysis-request-fixtures/invalid-execution-only-requests.json";
import longLoser from "../../../docs/trade-analysis-request-fixtures/long-loser.json";
import longWinner from "../../../docs/trade-analysis-request-fixtures/long-winner.json";
import openPosition from "../../../docs/trade-analysis-request-fixtures/open-position.json";
import partialExits from "../../../docs/trade-analysis-request-fixtures/partial-exits.json";
import rapidFireExecutionCluster from "../../../docs/trade-analysis-request-fixtures/rapid-fire-execution-cluster.json";
import repeatedAddsBeforeReduction from "../../../docs/trade-analysis-request-fixtures/repeated-adds-before-reduction.json";
import shortLoser from "../../../docs/trade-analysis-request-fixtures/short-loser.json";
import shortWinner from "../../../docs/trade-analysis-request-fixtures/short-winner.json";
import { runExecutionFeedback } from "../../execution-feedback/run-execution-feedback";
import type { ExecutionFeedbackSummary } from "../../execution-feedback/summary/build-execution-feedback-summary";
import type { UserTradeAnalysisRequest } from "../../trade-analysis/request/trade-analysis-request-contract";
import { buildTraderAnalyticsReport } from "../build-trader-analytics-report";
import { InMemorySavedTraderAnalyticsRepository } from "./repository";
import type {
  SavedReportNote,
  SavedExecutionTrade,
  SavedTraderAnalyticsReport,
  SavedTraderAnalyticsSummaryRef,
} from "./types";

const SAMPLE_USER_ID = "sample-user";
const SAMPLE_ACCOUNT_ID = "sample-account";
const SAMPLE_GENERATED_AT = "2026-05-02T20:00:00.000Z";

const SAMPLE_REQUESTS = [
  {
    id: "trade-long-winner",
    sourceLabel: "Sample long winner",
    request: longWinner as UserTradeAnalysisRequest,
  },
  {
    id: "trade-long-loser",
    sourceLabel: "Sample long loser",
    request: longLoser as UserTradeAnalysisRequest,
  },
  {
    id: "trade-short-winner",
    sourceLabel: "Sample short winner",
    request: shortWinner as UserTradeAnalysisRequest,
  },
  {
    id: "trade-short-loser",
    sourceLabel: "Sample short loser",
    request: shortLoser as UserTradeAnalysisRequest,
  },
  {
    id: "trade-open-position",
    sourceLabel: "Sample open position",
    request: openPosition as UserTradeAnalysisRequest,
  },
  {
    id: "trade-partial-exits",
    sourceLabel: "Sample partial exits",
    request: partialExits as UserTradeAnalysisRequest,
  },
  {
    id: "trade-repeated-adds",
    sourceLabel: "Sample repeated adds",
    request: repeatedAddsBeforeReduction as UserTradeAnalysisRequest,
  },
  {
    id: "trade-inconsistent-sizing",
    sourceLabel: "Sample inconsistent sizing",
    request: inconsistentShareSizing as UserTradeAnalysisRequest,
  },
  {
    id: "trade-rapid-fire",
    sourceLabel: "Sample rapid fire",
    request: rapidFireExecutionCluster as UserTradeAnalysisRequest,
  },
] as const;

function note(id: string, body: string): SavedReportNote {
  return {
    id,
    createdAt: SAMPLE_GENERATED_AT,
    body,
  };
}

function sampleTradeNotes(tradeId: string): SavedReportNote[] {
  switch (tradeId) {
    case "trade-rapid-fire":
      return [
        note(
          "note-rapid-fire-1",
          "Review whether the quick follow-up executions were planned or reactive.",
        ),
      ];
    case "trade-open-position":
      return [
        note(
          "note-open-position-1",
          "Confirm whether the leftover shares were intentional or missed during exit.",
        ),
      ];
    case "trade-repeated-adds":
      return [
        note(
          "note-repeated-adds-1",
          "Check the trigger for each add before the first reduction.",
        ),
      ];
    default:
      return [];
  }
}

function toSavedTrade(
  sample: (typeof SAMPLE_REQUESTS)[number],
): SavedExecutionTrade {
  return {
    id: sample.id,
    userId: SAMPLE_USER_ID,
    accountId: SAMPLE_ACCOUNT_ID,
    importedAt: SAMPLE_GENERATED_AT,
    sourceLabel: sample.sourceLabel,
    sampleData: true,
    symbol: sample.request.symbol,
    tradeDirection: sample.request.tradeDirection,
    sessionDate: sample.request.sessionContext.sessionDate,
    sessionBucket: sample.request.sessionContext.sessionBucket,
    entrySessionBucket: sample.request.sessionContext.entrySessionBucket,
    entrySessionDateEt: sample.request.sessionContext.entrySessionDateEt,
    entryTimeEt: sample.request.sessionContext.entryTimeEt,
    entryHourEt: sample.request.sessionContext.entryHourEt,
    entryHourLabelEt: sample.request.sessionContext.entryHourLabelEt,
    sessionExposure: sample.request.sessionContext.sessionExposure,
    heldSessionBuckets: sample.request.sessionContext.heldSessionBuckets,
    heldHourBucketsEt: sample.request.sessionContext.heldHourBucketsEt,
    request: sample.request,
    reviewStatus: "new",
    notes: sampleTradeNotes(sample.id),
  };
}

function buildSummaryRef(args: {
  trade: SavedExecutionTrade;
  requestIndex: number;
}): SavedTraderAnalyticsSummaryRef {
  const result = runExecutionFeedback(args.trade.request, {
    generatedAt: SAMPLE_GENERATED_AT,
  });

  if (result.status !== "completed" || !result.summary) {
    throw new Error(`Sample trade ${args.trade.id} did not build feedback.`);
  }

  return {
    tradeId: args.trade.id,
    requestIndex: args.requestIndex,
    summary: result.summary,
  };
}

function buildSavedReport(args: {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  trades: SavedExecutionTrade[];
}): SavedTraderAnalyticsReport {
  const sourceSummaries = args.trades.map((trade, requestIndex) =>
    buildSummaryRef({ trade, requestIndex }),
  );
  const summaries = sourceSummaries.map((summaryRef) => ({
    requestIndex: summaryRef.requestIndex,
    summary: summaryRef.summary as ExecutionFeedbackSummary,
  }));
  const report = buildTraderAnalyticsReport({
    source: `sample:${args.id}`,
    generatedAt: args.generatedAt,
    inputMode: "execution_feedback_summaries",
    summaries,
    requestCount: summaries.length,
  });

  return {
    id: args.id,
    userId: SAMPLE_USER_ID,
    accountId: SAMPLE_ACCOUNT_ID,
    generatedAt: args.generatedAt,
    reportPeriod: {
      startDate: args.startDate,
      endDate: args.endDate,
      label: args.label,
    },
    sourceTradeIds: args.trades.map((trade) => trade.id),
    sourceSummaries,
    report,
    reviewStatus: "new",
    notes:
      args.id === "report-all-sample"
        ? [
            note(
              "note-report-all-sample-1",
              "Use this snapshot to compare behavior rates before changing rules.",
            ),
          ]
        : [],
    sampleData: true,
  };
}

export function buildSampleSavedTradeImportRequests(): UserTradeAnalysisRequest[] {
  return [
    longWinner as UserTradeAnalysisRequest,
    openPosition as UserTradeAnalysisRequest,
    ...((invalidExecutionOnlyRequests as {
      requests: UserTradeAnalysisRequest[];
    }).requests ?? []),
  ];
}

export function buildSampleSavedTraderAnalyticsData(): {
  userId: string;
  accountId: string;
  trades: SavedExecutionTrade[];
  reports: SavedTraderAnalyticsReport[];
  importRequests: UserTradeAnalysisRequest[];
  repository: InMemorySavedTraderAnalyticsRepository;
} {
  const trades = SAMPLE_REQUESTS.map(toSavedTrade);
  const priorTrades = trades.slice(0, 4);
  const latestTrades = trades.slice(4);
  const reports = [
    buildSavedReport({
      id: "report-latest-sample",
      label: "Latest Sample",
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      generatedAt: "2026-05-02T20:00:00.000Z",
      trades: latestTrades,
    }),
    buildSavedReport({
      id: "report-prior-sample",
      label: "Prior Sample",
      startDate: "2026-04-24",
      endDate: "2026-04-30",
      generatedAt: "2026-04-30T20:00:00.000Z",
      trades: priorTrades,
    }),
    buildSavedReport({
      id: "report-all-sample",
      label: "All Sample Trades",
      startDate: "2026-04-24",
      endDate: "2026-05-02",
      generatedAt: "2026-05-02T21:00:00.000Z",
      trades,
    }),
  ];

  return {
    userId: SAMPLE_USER_ID,
    accountId: SAMPLE_ACCOUNT_ID,
    trades,
    reports,
    importRequests: buildSampleSavedTradeImportRequests(),
    repository: new InMemorySavedTraderAnalyticsRepository({
      trades,
      reports,
    }),
  };
}
