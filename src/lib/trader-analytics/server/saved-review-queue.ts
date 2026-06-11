import type {
  PersistedDecisionReviewDiagnostic,
  PersistedDecisionReviewSnapshot,
  SqliteImportCommitRepository,
} from "../product/import-commit/sqlite-import-commit-repository";
import {
  DEMO_ACCOUNT_ID,
  DEMO_USER_ID,
} from "../product/import-commit/sqlite-import-commit-repository";
import type {
  ImportCommitDecisionReviewJobRecord,
  ImportCommitSavedTradeRecord,
} from "../product/import-commit/import-commit-planner";
import type { SavedExecutionTrade } from "../product/types";
import {
  filterCustomerSavedReports,
  filterCustomerSavedTrades,
} from "../product/customer-data-filter";
import { getLatestSavedTraderAnalyticsReport } from "../product/selectors";
import { mapDecisionReviewInsightForUser } from "../../user-facing-behavior";
import type { UserFacingDecisionReviewInsight } from "../../user-facing-behavior";
import {
  buildSavedReviewQueueLevelFactsReadModelFromRepository,
} from "../../level-analysis/level-analysis-review-queue-linking-read-model";
import type {
  SavedReviewQueueLevelFactsReadModel,
  SavedReviewQueueLevelFactsState,
} from "../../level-analysis/level-analysis-review-queue-linking-contract";
import type {
  JournalLevelAnalysisTradeLinkRepository,
} from "../../level-analysis/level-analysis-journal-delivery-trade-link-storage";

export type SavedReviewQueueFilter =
  | "all"
  | "completed"
  | "market_context_unavailable"
  | "blocked_open_trade"
  | "analysis_failed"
  | "candle_basis_warning"
  | "highest_priority"
  | "queued"
  | "unresolved";

export interface SavedReviewQueueTab {
  id: SavedReviewQueueFilter;
  label: string;
  count: number;
  href: string;
}

export interface SavedReviewQueueItem {
  id: string;
  savedTradeId: string;
  importBatchId: string;
  symbol: string;
  sessionDate: string;
  status: ImportCommitDecisionReviewJobRecord["status"];
  lane:
    | "completed"
    | "blocked_open_trade"
    | "market_context_unavailable"
    | "analysis_failed"
    | "queued"
    | "skipped_limit";
  stateLabel: string;
  stateDetail: string;
  reviewScopeLabel: string;
  title: string;
  detail: string;
  nextAction: string;
  href: string;
  tickerStoryKey: string | null;
  tickerStoryHref: string | null;
  tickerStoryReviewCount: number;
  tickerStoryLead: boolean;
  priorityScore: number;
  priorityLabel: "urgent" | "high" | "medium" | "low";
  priorityReason: string;
  marketContextSource: string;
  chartFindingCount: number;
  chartRiskCount: number;
  chartStrengthCount: number;
  chartReviewPromptCount: number;
  candleBasisStatus: "aligned" | "warning" | "unknown";
  primaryChartFindingLabel: string | null;
  primaryChartFindingAction: string | null;
  grossRealizedPnl: number | null;
  reviewStatus: string;
  notesCount: number;
  hasSnapshot: boolean;
  hasDiagnostics: boolean;
  generatedAt: string | null;
  levelFacts: SavedReviewQueueLevelFactsState;
}

export interface SavedReviewQueueReadModel {
  contractVersion: "saved_review_queue_read_model_v1";
  source: "saved_sqlite";
  importBatchId: string | null;
  activeFilter: SavedReviewQueueFilter;
  tabs: SavedReviewQueueTab[];
  items: SavedReviewQueueItem[];
  allItems: SavedReviewQueueItem[];
  levelFacts: SavedReviewQueueLevelFactsReadModel;
  emptyState: {
    kind: "no_saved_import" | "no_saved_review_jobs" | "filter_empty" | "ready";
    title: string;
    body: string;
  };
}

const FILTER_LABELS: Record<SavedReviewQueueFilter, string> = {
  all: "All",
  completed: "Reviewed With Chart Data",
  market_context_unavailable: "Chart data still missing",
  blocked_open_trade: "Open Trades",
  analysis_failed: "Chart Data Needs Another Check",
  candle_basis_warning: "Candle Basis Check",
  highest_priority: "Highest Priority",
  queued: "Chart Data Waiting",
  unresolved: "Needs Review",
};

function reviewQueueFilterIds(
  includeChartContext: boolean,
): SavedReviewQueueFilter[] {
  if (includeChartContext) {
    return Object.keys(FILTER_LABELS) as SavedReviewQueueFilter[];
  }

  return ["all", "blocked_open_trade", "unresolved"];
}

function normalizeFilter(
  value: string | null | undefined,
  allowedIds: readonly SavedReviewQueueFilter[] = Object.keys(
    FILTER_LABELS,
  ) as SavedReviewQueueFilter[],
): SavedReviewQueueFilter {
  return value && allowedIds.includes(value as SavedReviewQueueFilter)
    ? (value as SavedReviewQueueFilter)
    : allowedIds.includes("highest_priority")
      ? "highest_priority"
      : allowedIds[0] ?? "all";
}

function priorityLabel(score: number): SavedReviewQueueItem["priorityLabel"] {
  if (score >= 90) {
    return "urgent";
  }

  if (score >= 75) {
    return "high";
  }

  if (score >= 50) {
    return "medium";
  }

  return "low";
}

function chartFindingsForSnapshot(
  snapshot: PersistedDecisionReviewSnapshot,
): UserFacingDecisionReviewInsight[] {
  return snapshot.review.insights
    .map((insight) => mapDecisionReviewInsightForUser(insight, "/intelligence/review"))
    .filter(
      (insight) =>
        insight.canShowPrimary && insight.evidenceChannel !== "execution_only",
    );
}

function snapshotCandleBasisStatus(
  snapshot: PersistedDecisionReviewSnapshot | undefined,
): SavedReviewQueueItem["candleBasisStatus"] {
  const notes = snapshot?.review.candleQualityNotes ?? [];

  if (
    notes.some((note) => {
      const normalized = note.toLowerCase();

      return (
        normalized.includes("basis_adjustment_multiple_likely") ||
        normalized.includes("price-basis") ||
        normalized.includes("basis is proven aligned: false")
      );
    })
  ) {
    return "warning";
  }

  if (notes.some((note) => note.toLowerCase().includes("basis_aligned"))) {
    return "aligned";
  }

  return "unknown";
}

function primaryChartFinding(
  findings: UserFacingDecisionReviewInsight[],
): UserFacingDecisionReviewInsight | null {
  return (
    findings.find(
      (finding) =>
        finding.canDrivePrimaryConclusion &&
        finding.opportunityType === "risk_to_reduce",
    ) ??
    findings.find(
      (finding) =>
        finding.canDrivePrimaryConclusion &&
        finding.opportunityType === "strength_to_repeat",
    ) ??
    findings.find((finding) => finding.opportunityType === "review_prompt") ??
    null
  );
}

function lossImpactPriorityBump(grossRealizedPnl: number | null): number {
  if (grossRealizedPnl === null || grossRealizedPnl >= 0) {
    return 0;
  }

  const loss = Math.abs(grossRealizedPnl);

  if (loss >= 100) {
    return 15;
  }

  if (loss >= 50) {
    return 11;
  }

  if (loss >= 20) {
    return 7;
  }

  return 0;
}

function snapshotPriority(
  snapshot: PersistedDecisionReviewSnapshot,
  grossRealizedPnl: number | null,
): {
  score: number;
  reason: string;
} {
  const findings = chartFindingsForSnapshot(snapshot);
  const primary = primaryChartFinding(findings);
  const lossImpactBump = lossImpactPriorityBump(grossRealizedPnl);
  const lossImpactReason =
    lossImpactBump > 0 ? " Realized loss moved it up the queue." : "";
  const riskCount = findings.filter(
    (finding) =>
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "risk_to_reduce",
  ).length;
  const strengthCount = findings.filter(
    (finding) =>
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "strength_to_repeat",
  ).length;
  const promptCount = findings.filter(
    (finding) => finding.opportunityType === "review_prompt",
  ).length;

  if (riskCount > 0) {
    return {
      score: Math.min(99, 62 + riskCount * 7 + lossImpactBump),
      reason: primary
        ? `${riskCount} chart risk${
            riskCount === 1 ? "" : "s"
          } to review. Start with: ${primary.label}.${lossImpactReason}`
        : `${riskCount} chart risk${
            riskCount === 1 ? "" : "s"
          } need review.${lossImpactReason}`,
    };
  }

  if (strengthCount > 0) {
    return {
      score: 48,
      reason: primary
        ? `Chart strength ready to repeat: ${primary.label}.`
        : "Chart strength is ready for normal review rotation.",
    };
  }

  if (promptCount > 0) {
    return {
      score: 44,
      reason: primary
        ? `Chart evidence has a supporting review prompt: ${primary.label}.`
        : "Chart evidence has supporting measurements for review.",
    };
  }

  return {
    score: 42,
    reason: "Completed review is ready for normal review rotation.",
  };
}

function diagnosticPriority(
  diagnostic: PersistedDecisionReviewDiagnostic | null,
  status: ImportCommitDecisionReviewJobRecord["status"],
): { score: number; reason: string } {
  if (status === "analysis_failed") {
    return {
      score: 96,
      reason:
        "Chart data needs another check before chart feedback is trusted.",
    };
  }

  if (status === "market_context_unavailable") {
    return {
      score: 90,
      reason:
        "Execution review is available now; candle and level evidence is still missing.",
    };
  }

  if (status === "blocked_open_trade") {
    return {
      score: 76,
      reason: "Open trade is saved but blocked from completed-trade coaching.",
    };
  }

  if (status === "skipped_limit") {
    return {
      score: 58,
      reason: "Review run limit skipped this trade before analysis.",
    };
  }

  return {
    score: diagnostic ? 70 : 52,
    reason: diagnostic
      ? "Chart data needs another check before chart feedback is trusted."
      : "Queued trade is waiting for chart-data review.",
  };
}

function laneForStatus(
  status: ImportCommitDecisionReviewJobRecord["status"],
): SavedReviewQueueItem["lane"] {
  if (status === "completed") {
    return "completed";
  }

  if (status === "blocked_open_trade") {
    return "blocked_open_trade";
  }

  if (status === "market_context_unavailable") {
    return "market_context_unavailable";
  }

  if (status === "analysis_failed") {
    return "analysis_failed";
  }

  if (status === "skipped_limit") {
    return "skipped_limit";
  }

  return "queued";
}

function queueStateCopy(lane: SavedReviewQueueItem["lane"]): {
  stateLabel: string;
  stateDetail: string;
  reviewScopeLabel: string;
  nextAction: string;
} {
  switch (lane) {
    case "completed":
      return {
        stateLabel: "Execution review is available",
        stateDetail:
          "Chart review completed. Use the saved snapshot with the execution replay.",
        reviewScopeLabel: "chart review",
        nextAction:
          "Open the trade detail and complete the saved review checklist.",
      };
    case "blocked_open_trade":
      return {
        stateLabel: "Open trade",
        stateDetail:
          "The position was still open at the end of the import, so completed-trade review waits until the trade is flat.",
        reviewScopeLabel: "open trade, execution-only",
        nextAction:
          "Keep the trade saved, then review the completed trade once the position is flat.",
      };
    case "market_context_unavailable":
      return {
        stateLabel: "Chart data still missing",
        stateDetail:
          "Execution review is available, but candle and level evidence is still missing.",
        reviewScopeLabel: "execution replay only",
        nextAction:
          "Review entries, adds, reductions, exits, timing, and trade result now; add chart data later.",
      };
    case "analysis_failed":
      return {
        stateLabel: "Chart data needs review",
        stateDetail:
          "Execution review is available, but chart data needs another check before candle or level feedback is trusted.",
        reviewScopeLabel: "execution replay only",
        nextAction:
          "Use the execution replay now and leave chart evidence conclusions out until that chart-data check is resolved.",
      };
    case "skipped_limit":
      return {
        stateLabel: "Review skipped",
        stateDetail:
          "This trade was saved, but chart-data review did not finish yet.",
        reviewScopeLabel: "waiting for review",
        nextAction: "Refresh chart-data review when market context is ready.",
      };
    case "queued":
      return {
        stateLabel: "Chart data waiting",
        stateDetail:
          "Execution review is available now. Chart evidence has not been attached to this saved trade yet.",
        reviewScopeLabel: "execution now, chart data waiting",
        nextAction:
          "Open the execution review now, or resume chart-data review from the saved import details.",
      };
  }
}

function reportPnl(args: {
  trade: SavedExecutionTrade | undefined;
  repository: SqliteImportCommitRepository;
}): number | null {
  if (!args.trade) {
    return null;
  }

  const latest = getLatestSavedTraderAnalyticsReport(
    filterCustomerSavedReports(args.repository.listReports(args.trade.userId)),
  );
  const sourceIndex = latest?.sourceTradeIds.indexOf(args.trade.id) ?? -1;
  const rowByTradeId =
    sourceIndex >= 0
      ? latest?.report.trades.find(
          (candidate) => candidate.tradeIndex === sourceIndex + 1,
        )
      : undefined;
  const row =
    rowByTradeId ??
    latest?.report.trades.find(
      (candidate) =>
        candidate.symbol === args.trade?.symbol &&
        candidate.sessionDate === args.trade?.sessionDate &&
        candidate.tradeDirection === args.trade?.tradeDirection,
    );

  return typeof row?.grossRealizedPnl === "number"
    ? row.grossRealizedPnl
    : null;
}

function buildQueueItem(args: {
  job: ImportCommitDecisionReviewJobRecord;
  savedTrade: ImportCommitSavedTradeRecord | undefined;
  trade: SavedExecutionTrade | undefined;
  snapshot: PersistedDecisionReviewSnapshot | undefined;
  diagnostic: PersistedDecisionReviewDiagnostic | undefined;
  repository: SqliteImportCommitRepository;
  levelFactsByTradeId: Record<string, SavedReviewQueueLevelFactsState>;
}): SavedReviewQueueItem {
  const lane = laneForStatus(args.job.status);
  const grossRealizedPnl = reportPnl({
    trade: args.trade,
    repository: args.repository,
  });
  const snapshotScore = args.snapshot
    ? snapshotPriority(args.snapshot, grossRealizedPnl)
    : null;
  const diagnosticScore = !args.snapshot
    ? diagnosticPriority(args.diagnostic ?? null, args.job.status)
    : null;
  const priority = snapshotScore ??
    diagnosticScore ?? {
      score: 50,
      reason: "Review item is ready for triage.",
    };
  const symbol =
    args.trade?.symbol ?? args.savedTrade?.symbol ?? args.job.symbol;
  const sessionDate =
    args.trade?.sessionDate ?? args.savedTrade?.sessionDate ?? "";
  const tickerStoryKey = sessionDate ? `${symbol}:${sessionDate}` : null;
  const stateCopy = queueStateCopy(lane);
  const chartFindings = args.snapshot
    ? chartFindingsForSnapshot(args.snapshot)
    : [];
  const chartPrimary = primaryChartFinding(chartFindings);
  const chartRiskCount = chartFindings.filter(
    (finding) =>
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "risk_to_reduce",
  ).length;
  const chartStrengthCount = chartFindings.filter(
    (finding) =>
      finding.canDrivePrimaryConclusion &&
      finding.opportunityType === "strength_to_repeat",
  ).length;
  const chartReviewPromptCount = chartFindings.filter(
    (finding) => finding.opportunityType === "review_prompt",
  ).length;
  const headline = chartPrimary
    ? `${chartPrimary.label}. ${chartPrimary.detail}`
    : (args.snapshot?.review.coachingHeadline ?? stateCopy.stateDetail);
  const levelFacts = args.levelFactsByTradeId[args.job.savedTradeId];

  return {
    id: args.job.id,
    savedTradeId: args.job.savedTradeId,
    importBatchId: args.job.importBatchId,
    symbol,
    sessionDate,
    status: args.job.status,
    lane,
    stateLabel: stateCopy.stateLabel,
    stateDetail: stateCopy.stateDetail,
    reviewScopeLabel: stateCopy.reviewScopeLabel,
    title: `${symbol} trade review`,
    detail: headline,
    nextAction: stateCopy.nextAction,
    href: `/intelligence/trades/${encodeURIComponent(args.job.savedTradeId)}?from=review-queue&queue=${lane}`,
    tickerStoryKey,
    tickerStoryHref: tickerStoryKey
      ? `/intelligence/trades/ticker-story/${encodeURIComponent(tickerStoryKey)}`
      : null,
    tickerStoryReviewCount: 1,
    tickerStoryLead: true,
    priorityScore: priority.score,
    priorityLabel: priorityLabel(priority.score),
    priorityReason: priority.reason,
    marketContextSource:
      args.snapshot?.review.marketContextSource ??
      args.diagnostic?.code ??
      "none",
    chartFindingCount: chartFindings.length,
    chartRiskCount,
    chartStrengthCount,
    chartReviewPromptCount,
    candleBasisStatus: snapshotCandleBasisStatus(args.snapshot),
    primaryChartFindingLabel: chartPrimary?.label ?? null,
    primaryChartFindingAction: chartPrimary?.reviewAction ?? null,
    grossRealizedPnl,
    reviewStatus: args.trade?.reviewStatus ?? "new",
    notesCount: args.trade?.notes.length ?? 0,
    hasSnapshot: Boolean(args.snapshot),
    hasDiagnostics: Boolean(args.diagnostic),
    generatedAt:
      args.snapshot?.generatedAt ?? args.diagnostic?.generatedAt ?? null,
    levelFacts,
  };
}

function reviewQueueLossSortValue(item: SavedReviewQueueItem): number {
  return item.grossRealizedPnl === null ? 0 : item.grossRealizedPnl;
}

function enrichTickerStoryQueueItems(
  items: SavedReviewQueueItem[],
): SavedReviewQueueItem[] {
  const groups = new Map<string, SavedReviewQueueItem[]>();

  for (const item of items) {
    if (!item.tickerStoryKey) {
      continue;
    }

    const current = groups.get(item.tickerStoryKey) ?? [];
    current.push(item);
    groups.set(item.tickerStoryKey, current);
  }

  return items.map((item) => {
    if (!item.tickerStoryKey) {
      return item;
    }

    const group = groups.get(item.tickerStoryKey) ?? [item];

    return {
      ...item,
      tickerStoryReviewCount: group.length,
      tickerStoryLead: group[0]?.id === item.id,
    };
  });
}

function collapseTickerStoryRepeats(
  items: SavedReviewQueueItem[],
): SavedReviewQueueItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!item.tickerStoryKey || item.tickerStoryReviewCount <= 1) {
      return true;
    }

    if (seen.has(item.tickerStoryKey)) {
      return false;
    }

    seen.add(item.tickerStoryKey);
    return true;
  });
}

function filterItems(
  items: SavedReviewQueueItem[],
  filter: SavedReviewQueueFilter,
): SavedReviewQueueItem[] {
  if (filter === "all") {
    return items;
  }

  if (filter === "highest_priority") {
    return collapseTickerStoryRepeats(items
      .filter(
        (item) =>
          item.priorityScore >= 75 &&
          item.reviewStatus !== "resolved" &&
          item.reviewStatus !== "ignored" &&
          item.reviewStatus !== "reviewed",
      )
      .sort(
        (a, b) =>
          b.priorityScore - a.priorityScore ||
          reviewQueueLossSortValue(a) - reviewQueueLossSortValue(b) ||
          a.symbol.localeCompare(b.symbol),
      ));
  }

  if (filter === "candle_basis_warning") {
    return items.filter((item) => item.candleBasisStatus === "warning");
  }

  if (filter === "unresolved") {
    return items.filter(
      (item) =>
        item.reviewStatus !== "resolved" &&
        item.reviewStatus !== "ignored" &&
        item.reviewStatus !== "reviewed",
    );
  }

  return items.filter((item) => item.lane === filter);
}

function emptyState(args: {
  importBatchId: string | null;
  allCount: number;
  filteredCount: number;
  includeChartContext: boolean;
}): SavedReviewQueueReadModel["emptyState"] {
  if (!args.importBatchId) {
    return {
      kind: "no_saved_import",
      title: "No saved import yet",
      body: "Start with one broker CSV import. After it is saved, this queue will show the trades that most need review.",
    };
  }

  if (args.allCount === 0) {
    if (!args.includeChartContext) {
      return {
        kind: "no_saved_review_jobs",
        title: "No required execution-review backlog",
        body: "Saved trades are available for execution replay and notes. Open trade history when you want to study individual trades.",
      };
    }

    return {
      kind: "no_saved_review_jobs",
      title: "No saved chart-review work",
      body: "Saved trades exist, but this import did not create chart-review queue items. Open saved trades for execution review.",
    };
  }

  if (args.filteredCount === 0) {
    return {
      kind: "filter_empty",
      title: "No trades in this queue",
      body: "Try another queue lane, open all saved trades, or save another import with matching review work.",
    };
  }

  return {
    kind: "ready",
    title: "Review queue ready",
    body: "Open a trade and work the highest-value review item first.",
  };
}

export function buildSavedReviewQueueReadModel(args: {
  repository: SqliteImportCommitRepository;
  accountId?: string;
  userId?: string;
  activeFilter?: string | null;
  includeChartContext?: boolean;
  levelFactsFeatureEnabled?: boolean;
  levelFactsTradeLinkRepository?: JournalLevelAnalysisTradeLinkRepository;
}): SavedReviewQueueReadModel {
  const accountId = args.accountId ?? DEMO_ACCOUNT_ID;
  const userId = args.userId ?? DEMO_USER_ID;
  const includeChartContext = args.includeChartContext ?? true;
  const filterIds = reviewQueueFilterIds(includeChartContext);
  const activeFilter = normalizeFilter(args.activeFilter, filterIds);
  const batch = args.repository.getLatestCommittedBatch(accountId);

  if (!batch) {
    const levelFacts = buildSavedReviewQueueLevelFactsReadModelFromRepository({
      tradeIds: [],
      featureEnabled: args.levelFactsFeatureEnabled,
      tradeLinkRepository: args.levelFactsTradeLinkRepository,
    });

    return {
      contractVersion: "saved_review_queue_read_model_v1",
      source: "saved_sqlite",
      importBatchId: null,
      activeFilter,
      tabs: filterIds.map((id) => ({
        id,
        label: FILTER_LABELS[id],
        count: 0,
        href: `/intelligence/review?queue=${id}`,
      })),
      items: [],
      allItems: [],
      levelFacts,
      emptyState: emptyState({
        importBatchId: null,
        allCount: 0,
        filteredCount: 0,
        includeChartContext,
      }),
    };
  }

  const jobs = args.repository
    .listDecisionReviewJobs(batch.id)
    .filter((job) =>
      includeChartContext ? true : job.status === "blocked_open_trade",
    );
  const levelFacts =
    buildSavedReviewQueueLevelFactsReadModelFromRepository({
      tradeIds: jobs.map((job) => job.savedTradeId),
      featureEnabled: includeChartContext
        ? args.levelFactsFeatureEnabled
        : false,
      tradeLinkRepository: args.levelFactsTradeLinkRepository,
    });
  const savedTrades = new Map(
    args.repository
      .listSavedTrades(accountId)
      .map((trade) => [trade.id, trade]),
  );
  const trades = new Map(
    filterCustomerSavedTrades(args.repository.listTrades(userId)).map((trade) => [
      trade.id,
      trade,
    ]),
  );
  const snapshots = new Map(
    includeChartContext
      ? args.repository
          .listDecisionReviewSnapshotsForBatch(batch.id)
          .map((snapshot) => [snapshot.savedTradeId, snapshot])
      : [],
  );
  const diagnosticsByTrade = new Map<
    string,
    PersistedDecisionReviewDiagnostic
  >();

  for (const diagnostic of args.repository.listDecisionReviewDiagnosticsForBatch(
    batch.id,
  )) {
    if (
      diagnostic.savedTradeId &&
      !diagnosticsByTrade.has(diagnostic.savedTradeId)
    ) {
      diagnosticsByTrade.set(diagnostic.savedTradeId, diagnostic);
    }
  }

  const allItems = enrichTickerStoryQueueItems(
    jobs
      .filter((job) => trades.has(job.savedTradeId))
      .map((job) =>
        buildQueueItem({
          job,
          savedTrade: savedTrades.get(job.savedTradeId),
          trade: trades.get(job.savedTradeId),
          snapshot: snapshots.get(job.savedTradeId),
          diagnostic: diagnosticsByTrade.get(job.savedTradeId),
          repository: args.repository,
          levelFactsByTradeId: levelFacts.statesByTradeId,
        }),
      )
      .sort(
        (a, b) =>
          b.priorityScore - a.priorityScore ||
          reviewQueueLossSortValue(a) - reviewQueueLossSortValue(b) ||
          (b.generatedAt ?? "").localeCompare(a.generatedAt ?? "") ||
          a.symbol.localeCompare(b.symbol),
      ),
  );
  const filtered = filterItems(allItems, activeFilter);
  const tabs = filterIds.map((id) => ({
    id,
    label: FILTER_LABELS[id],
    count: filterItems(allItems, id).length,
    href: `/intelligence/review?queue=${id}`,
  }));

  return {
    contractVersion: "saved_review_queue_read_model_v1",
    source: "saved_sqlite",
    importBatchId: batch.id,
    activeFilter,
    tabs,
    items: filtered,
    allItems,
    levelFacts,
    emptyState: emptyState({
      importBatchId: batch.id,
      allCount: allItems.length,
      filteredCount: filtered.length,
      includeChartContext,
    }),
  };
}
