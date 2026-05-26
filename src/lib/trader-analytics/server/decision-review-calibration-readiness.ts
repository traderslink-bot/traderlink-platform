export interface DecisionReviewCalibrationInsight {
  id: string;
  tone: string;
  category: string;
  title: string;
  summary: string;
  evidence: string[];
}

export interface DecisionReviewCalibrationReview {
  tradeId: string;
  coachingHeadline: string | null;
  fixFirstBehaviorId: string | null;
  marketContextSource: string | null;
  tradeWindowEvidenceSource?: string;
  candleQualityNotes?: string[];
  insights: DecisionReviewCalibrationInsight[];
}

export interface DecisionReviewCalibrationReport {
  generatedAt: string;
  csvPath?: string;
  broker?: string;
  result: {
    importStatus: string;
    requestedTradeCount: number;
    analyzableTradeCount: number;
    completedReviewCount: number;
    decisionReviews: DecisionReviewCalibrationReview[];
    diagnostics: Array<{
      requestIndex: number | null;
      symbol: string | null;
      code: string;
      message: string;
    }>;
    marketContextSourceCounts: Record<string, number>;
  };
}

export interface DecisionReviewCalibrationReadinessSummary {
  generatedAt: string;
  importStatus: string;
  requestedTradeCount: number;
  analyzableTradeCount: number;
  completedReviewCount: number;
  diagnosticCount: number;
  tradeWindowEvidenceCounts: Record<string, number>;
  marketContextSourceCounts: Record<string, number>;
  weakLevelEvidenceCount: number;
  candleQualityNoteCount: number;
  candleQualityWarningCount: number;
  candleQualityInfoCount: number;
  candleQualityUnsafeBasisCount: number;
  candleQualityFallbackTimeframeCount: number;
  candleQualityIncompleteWindowCount: number;
  candleQualityIgnoredWindowCount: number;
  executionOnlyFallbackCount: number;
  missingTradeWindowExcursionCount: number;
  fallbackHeadlineCount: number;
  extremeExcursionMetricCount: number;
  contradictoryProfitProtectionAndCapturedExitCount: number;
  stalePoorProfitProtectionFixFirstCount: number;
  stalePrematureExitFixFirstCount: number;
  staleAddingIntoWeaknessFixFirstCount: number;
  staleUndersizedWinnerFixFirstCount: number;
  openSkippedCount: number;
  weakLevelEvidenceBySymbol: Record<string, number>;
  executionOnlyFallbackBySymbol: Record<string, number>;
  candleQualityWarningBySymbol: Record<string, number>;
  candleQualityInfoBySymbol: Record<string, number>;
  candleQualityUnsafeBasisBySymbol: Record<string, number>;
  candleQualityFallbackTimeframeBySymbol: Record<string, number>;
  candleQualityIncompleteWindowBySymbol: Record<string, number>;
  candleQualityIgnoredWindowBySymbol: Record<string, number>;
  headlineCounts: Record<string, number>;
  insightCounts: Record<string, number>;
}

export interface DecisionReviewCalibrationComparison {
  baseline: DecisionReviewCalibrationReadinessSummary;
  candidate: DecisionReviewCalibrationReadinessSummary;
  deltas: Record<
    | "completedReviewCount"
    | "executionOnlyFallbackCount"
    | "weakLevelEvidenceCount"
    | "candleQualityNoteCount"
    | "candleQualityWarningCount"
    | "candleQualityInfoCount"
    | "candleQualityUnsafeBasisCount"
    | "candleQualityFallbackTimeframeCount"
    | "candleQualityIncompleteWindowCount"
    | "candleQualityIgnoredWindowCount"
    | "missingTradeWindowExcursionCount"
    | "fallbackHeadlineCount"
    | "extremeExcursionMetricCount"
    | "contradictoryProfitProtectionAndCapturedExitCount"
    | "stalePoorProfitProtectionFixFirstCount"
    | "stalePrematureExitFixFirstCount"
    | "staleAddingIntoWeaknessFixFirstCount"
    | "staleUndersizedWinnerFixFirstCount"
    | "openSkippedCount",
    number
  >;
}

function increment(counts: Map<string, number>, key: string | null | undefined): void {
  const safeKey = key && key.trim() !== "" ? key : "none";

  counts.set(safeKey, (counts.get(safeKey) ?? 0) + 1);
}

function toRecord(counts: Map<string, number>): Record<string, number> {
  return Object.fromEntries(
    [...counts.entries()].sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    ),
  );
}

export function calibrationSymbolFromTradeId(tradeId: string): string {
  return tradeId.split("-").at(-1)?.toUpperCase() ?? "UNKNOWN";
}

export function isQuietCandleQualityInfoNote(note: string): boolean {
  const normalized = note.toLowerCase();

  return (
    normalized.includes("basis_aligned") ||
    normalized.includes("compatible with broker execution prices")
  );
}

export type CandleQualityNoteCategory =
  | "basis_info"
  | "unsafe_basis"
  | "fallback_timeframe"
  | "incomplete_window"
  | "ignored_window"
  | "other_warning";

export function classifyCandleQualityNote(
  note: string,
): CandleQualityNoteCategory {
  const normalized = note.toLowerCase();

  if (isQuietCandleQualityInfoNote(note)) {
    return "basis_info";
  }

  if (
    normalized.includes("basis_adjustment_multiple_likely") ||
    normalized.includes("possible_price_adjustment_mismatch") ||
    normalized.includes("price-basis policy") ||
    normalized.includes("different price bases") ||
    normalized.includes("disconnected from execution prices") ||
    normalized.includes("split/adjustment")
  ) {
    return "unsafe_basis";
  }

  if (
    normalized.includes("5m fallback candles were used") ||
    normalized.includes("1m trade-window candles were unavailable")
  ) {
    return "fallback_timeframe";
  }

  if (
    normalized.includes("no post-trade candles") ||
    normalized.includes("no pre-trade candles")
  ) {
    return "incomplete_window";
  }

  if (normalized.includes("trade-window candles were ignored")) {
    return "ignored_window";
  }

  return "other_warning";
}

export function hasCandleQualityWarning(
  review: DecisionReviewCalibrationReview,
): boolean {
  return (review.candleQualityNotes ?? []).some(
    (note) => classifyCandleQualityNote(note) !== "basis_info",
  );
}

export function hasCandleQualityInfo(
  review: DecisionReviewCalibrationReview,
): boolean {
  return (review.candleQualityNotes ?? []).some(isQuietCandleQualityInfoNote);
}

function evidenceText(review: DecisionReviewCalibrationReview): string {
  return review.insights.flatMap((insight) => insight.evidence).join(" ");
}

export function hasWeakLevelEvidence(
  review: DecisionReviewCalibrationReview,
): boolean {
  const text = evidenceText(review).toLowerCase();

  return (
    text.includes("nearestsupport=n/a") ||
    text.includes("nearestresistance=n/a") ||
    text.includes("roomtonearestresistance=n/a") ||
    text.includes("distancetosupport=n/a")
  );
}

export function hasFallbackHeadline(
  review: DecisionReviewCalibrationReview,
): boolean {
  const headline = (review.coachingHeadline ?? "").trim().toLowerCase();

  return (
    headline === "" ||
    headline === "entry was not close to support" ||
    headline === "entry had nearby major daily/4h support"
  );
}

function metricValue(evidence: string, metric: string): number | null {
  const escaped = metric.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = evidence.match(new RegExp(`${escaped}=(-?\\d+(?:\\.\\d+)?)%`));

  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);

  return Number.isFinite(parsed) ? parsed : null;
}

export function countExtremeExcursionMetrics(
  report: DecisionReviewCalibrationReport,
): number {
  const metrics = [
    "tradeMfePct",
    "tradeMaePct",
    "firstEntryToPeakMovePct",
    "maxFavorableMovePctAfterExit",
    "favorableExcursionLeftOnTablePct",
  ];
  let count = 0;

  for (const review of report.result.decisionReviews) {
    for (const insight of review.insights) {
      const text = insight.evidence.join(" ");

      for (const metric of metrics) {
        const value = metricValue(text, metric);

        if (value !== null && Math.abs(value) >= 100) {
          count += 1;
        }
      }
    }
  }

  return count;
}

function hasInsight(
  review: DecisionReviewCalibrationReview,
  insightId: string,
): boolean {
  return review.insights.some((insight) => insight.id === insightId);
}

export function countContradictoryProfitProtectionAndCapturedExit(
  report: DecisionReviewCalibrationReport,
): number {
  return report.result.decisionReviews.filter(
    (review) =>
      hasInsight(review, "profit_protection_failed") &&
      hasInsight(review, "exit_captured_trade_well"),
  ).length;
}

export function countStalePoorProfitProtectionFixFirst(
  report: DecisionReviewCalibrationReport,
): number {
  return report.result.decisionReviews.filter(
    (review) =>
      review.fixFirstBehaviorId === "poor_profit_protection" &&
      !hasInsight(review, "profit_protection_failed"),
  ).length;
}

export function countStalePrematureExitFixFirst(
  report: DecisionReviewCalibrationReport,
): number {
  return report.result.decisionReviews.filter(
    (review) =>
      review.fixFirstBehaviorId === "premature_exit" &&
      !hasInsight(review, "exit_left_continuation"),
  ).length;
}

export function countStaleAddingIntoWeaknessFixFirst(
  report: DecisionReviewCalibrationReport,
): number {
  return report.result.decisionReviews.filter(
    (review) =>
      review.fixFirstBehaviorId === "adding_into_weakness" &&
      !hasInsight(review, "adds_increased_risk_into_weakness"),
  ).length;
}

export function countStaleUndersizedWinnerFixFirst(
  report: DecisionReviewCalibrationReport,
): number {
  return report.result.decisionReviews.filter(
    (review) =>
      review.fixFirstBehaviorId === "undersized_winner" &&
      !hasInsight(review, "winner_stayed_undersized"),
  ).length;
}

export function summarizeDecisionReviewCalibrationReadiness(
  report: DecisionReviewCalibrationReport,
): DecisionReviewCalibrationReadinessSummary {
  const tradeWindowEvidenceCounts = new Map<string, number>();
  const weakLevelEvidenceBySymbol = new Map<string, number>();
  const executionOnlyFallbackBySymbol = new Map<string, number>();
  const candleQualityWarningBySymbol = new Map<string, number>();
  const candleQualityInfoBySymbol = new Map<string, number>();
  const candleQualityUnsafeBasisBySymbol = new Map<string, number>();
  const candleQualityFallbackTimeframeBySymbol = new Map<string, number>();
  const candleQualityIncompleteWindowBySymbol = new Map<string, number>();
  const candleQualityIgnoredWindowBySymbol = new Map<string, number>();
  const headlineCounts = new Map<string, number>();
  const insightCounts = new Map<string, number>();
  let weakLevelEvidenceCount = 0;
  let candleQualityNoteCount = 0;
  let candleQualityWarningCount = 0;
  let candleQualityInfoCount = 0;
  let candleQualityUnsafeBasisCount = 0;
  let candleQualityFallbackTimeframeCount = 0;
  let candleQualityIncompleteWindowCount = 0;
  let candleQualityIgnoredWindowCount = 0;
  let executionOnlyFallbackCount = 0;
  let missingTradeWindowExcursionCount = 0;
  let fallbackHeadlineCount = 0;

  for (const review of report.result.decisionReviews) {
    increment(headlineCounts, review.coachingHeadline);
    increment(
      tradeWindowEvidenceCounts,
      review.tradeWindowEvidenceSource ?? "unknown",
    );

    if (review.tradeWindowEvidenceSource === "execution_only_fallback") {
      executionOnlyFallbackCount += 1;
      increment(
        executionOnlyFallbackBySymbol,
        calibrationSymbolFromTradeId(review.tradeId),
      );
    }

    if ((review.candleQualityNotes ?? []).length > 0) {
      candleQualityNoteCount += 1;
    }

    if (hasCandleQualityWarning(review)) {
      candleQualityWarningCount += 1;
      increment(
        candleQualityWarningBySymbol,
        calibrationSymbolFromTradeId(review.tradeId),
      );
    }

    if (hasCandleQualityInfo(review)) {
      candleQualityInfoCount += 1;
      increment(
        candleQualityInfoBySymbol,
        calibrationSymbolFromTradeId(review.tradeId),
      );
    }

    const noteCategories = new Set(
      (review.candleQualityNotes ?? []).map(classifyCandleQualityNote),
    );
    const symbol = calibrationSymbolFromTradeId(review.tradeId);

    if (noteCategories.has("unsafe_basis")) {
      candleQualityUnsafeBasisCount += 1;
      increment(candleQualityUnsafeBasisBySymbol, symbol);
    }

    if (noteCategories.has("fallback_timeframe")) {
      candleQualityFallbackTimeframeCount += 1;
      increment(candleQualityFallbackTimeframeBySymbol, symbol);
    }

    if (noteCategories.has("incomplete_window")) {
      candleQualityIncompleteWindowCount += 1;
      increment(candleQualityIncompleteWindowBySymbol, symbol);
    }

    if (noteCategories.has("ignored_window")) {
      candleQualityIgnoredWindowCount += 1;
      increment(candleQualityIgnoredWindowBySymbol, symbol);
    }

    if (hasWeakLevelEvidence(review)) {
      weakLevelEvidenceCount += 1;
      increment(weakLevelEvidenceBySymbol, calibrationSymbolFromTradeId(review.tradeId));
    }

    if (hasFallbackHeadline(review)) {
      fallbackHeadlineCount += 1;
    }

    if (
      !review.insights.some(
        (insight) => insight.id === "trade_window_excursion_measured",
      )
    ) {
      missingTradeWindowExcursionCount += 1;
    }

    for (const insight of review.insights) {
      increment(insightCounts, insight.id);
    }
  }

  return {
    generatedAt: report.generatedAt,
    importStatus: report.result.importStatus,
    requestedTradeCount: report.result.requestedTradeCount,
    analyzableTradeCount: report.result.analyzableTradeCount,
    completedReviewCount: report.result.completedReviewCount,
    diagnosticCount: report.result.diagnostics.length,
    tradeWindowEvidenceCounts: toRecord(tradeWindowEvidenceCounts),
    marketContextSourceCounts: report.result.marketContextSourceCounts,
    weakLevelEvidenceCount,
    candleQualityNoteCount,
    candleQualityWarningCount,
    candleQualityInfoCount,
    candleQualityUnsafeBasisCount,
    candleQualityFallbackTimeframeCount,
    candleQualityIncompleteWindowCount,
    candleQualityIgnoredWindowCount,
    executionOnlyFallbackCount,
    missingTradeWindowExcursionCount,
    fallbackHeadlineCount,
    extremeExcursionMetricCount: countExtremeExcursionMetrics(report),
    contradictoryProfitProtectionAndCapturedExitCount:
      countContradictoryProfitProtectionAndCapturedExit(report),
    stalePoorProfitProtectionFixFirstCount:
      countStalePoorProfitProtectionFixFirst(report),
    stalePrematureExitFixFirstCount: countStalePrematureExitFixFirst(report),
    staleAddingIntoWeaknessFixFirstCount:
      countStaleAddingIntoWeaknessFixFirst(report),
    staleUndersizedWinnerFixFirstCount:
      countStaleUndersizedWinnerFixFirst(report),
    openSkippedCount: report.result.diagnostics.filter(
      (diagnostic) => diagnostic.code === "trade_open",
    ).length,
    weakLevelEvidenceBySymbol: toRecord(weakLevelEvidenceBySymbol),
    executionOnlyFallbackBySymbol: toRecord(executionOnlyFallbackBySymbol),
    candleQualityWarningBySymbol: toRecord(candleQualityWarningBySymbol),
    candleQualityInfoBySymbol: toRecord(candleQualityInfoBySymbol),
    candleQualityUnsafeBasisBySymbol: toRecord(candleQualityUnsafeBasisBySymbol),
    candleQualityFallbackTimeframeBySymbol: toRecord(
      candleQualityFallbackTimeframeBySymbol,
    ),
    candleQualityIncompleteWindowBySymbol: toRecord(
      candleQualityIncompleteWindowBySymbol,
    ),
    candleQualityIgnoredWindowBySymbol: toRecord(candleQualityIgnoredWindowBySymbol),
    headlineCounts: toRecord(headlineCounts),
    insightCounts: toRecord(insightCounts),
  };
}

export function compareDecisionReviewCalibrationReadiness(
  baseline: DecisionReviewCalibrationReport,
  candidate: DecisionReviewCalibrationReport,
): DecisionReviewCalibrationComparison {
  const baselineSummary = summarizeDecisionReviewCalibrationReadiness(baseline);
  const candidateSummary = summarizeDecisionReviewCalibrationReadiness(candidate);

  return {
    baseline: baselineSummary,
    candidate: candidateSummary,
    deltas: {
      completedReviewCount:
        candidateSummary.completedReviewCount - baselineSummary.completedReviewCount,
      executionOnlyFallbackCount:
        candidateSummary.executionOnlyFallbackCount -
        baselineSummary.executionOnlyFallbackCount,
      weakLevelEvidenceCount:
        candidateSummary.weakLevelEvidenceCount -
        baselineSummary.weakLevelEvidenceCount,
      candleQualityNoteCount:
        candidateSummary.candleQualityNoteCount -
        baselineSummary.candleQualityNoteCount,
      candleQualityWarningCount:
        candidateSummary.candleQualityWarningCount -
        baselineSummary.candleQualityWarningCount,
      candleQualityInfoCount:
        candidateSummary.candleQualityInfoCount -
        baselineSummary.candleQualityInfoCount,
      candleQualityUnsafeBasisCount:
        candidateSummary.candleQualityUnsafeBasisCount -
        baselineSummary.candleQualityUnsafeBasisCount,
      candleQualityFallbackTimeframeCount:
        candidateSummary.candleQualityFallbackTimeframeCount -
        baselineSummary.candleQualityFallbackTimeframeCount,
      candleQualityIncompleteWindowCount:
        candidateSummary.candleQualityIncompleteWindowCount -
        baselineSummary.candleQualityIncompleteWindowCount,
      candleQualityIgnoredWindowCount:
        candidateSummary.candleQualityIgnoredWindowCount -
        baselineSummary.candleQualityIgnoredWindowCount,
      missingTradeWindowExcursionCount:
        candidateSummary.missingTradeWindowExcursionCount -
        baselineSummary.missingTradeWindowExcursionCount,
      fallbackHeadlineCount:
        candidateSummary.fallbackHeadlineCount -
        baselineSummary.fallbackHeadlineCount,
      extremeExcursionMetricCount:
        candidateSummary.extremeExcursionMetricCount -
        baselineSummary.extremeExcursionMetricCount,
      contradictoryProfitProtectionAndCapturedExitCount:
        candidateSummary.contradictoryProfitProtectionAndCapturedExitCount -
        baselineSummary.contradictoryProfitProtectionAndCapturedExitCount,
      stalePoorProfitProtectionFixFirstCount:
        candidateSummary.stalePoorProfitProtectionFixFirstCount -
        baselineSummary.stalePoorProfitProtectionFixFirstCount,
      stalePrematureExitFixFirstCount:
        candidateSummary.stalePrematureExitFixFirstCount -
        baselineSummary.stalePrematureExitFixFirstCount,
      staleAddingIntoWeaknessFixFirstCount:
        candidateSummary.staleAddingIntoWeaknessFixFirstCount -
        baselineSummary.staleAddingIntoWeaknessFixFirstCount,
      staleUndersizedWinnerFixFirstCount:
        candidateSummary.staleUndersizedWinnerFixFirstCount -
        baselineSummary.staleUndersizedWinnerFixFirstCount,
      openSkippedCount:
        candidateSummary.openSkippedCount - baselineSummary.openSkippedCount,
    },
  };
}
