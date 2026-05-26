import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  countContradictoryProfitProtectionAndCapturedExit,
  countStaleAddingIntoWeaknessFixFirst,
  countStalePoorProfitProtectionFixFirst,
  countStalePrematureExitFixFirst,
  countStaleUndersizedWinnerFixFirst,
} from "../lib/trader-analytics/server/decision-review-calibration-readiness";

interface CalibrationInsight {
  id: string;
  tone: string;
  category: string;
  title: string;
  summary: string;
  evidence: string[];
}

interface CalibrationReview {
  tradeId: string;
  coachingHeadline: string | null;
  fixFirstBehaviorId: string | null;
  marketContextSource: string | null;
  tradeWindowEvidenceSource?: string;
  candleQualityNotes?: string[];
  insights: CalibrationInsight[];
}

interface CalibrationReport {
  generatedAt: string;
  csvPath: string;
  broker: string;
  result: {
    importStatus: string;
    requestedTradeCount: number;
    analyzableTradeCount: number;
    completedReviewCount: number;
    decisionReviews: CalibrationReview[];
    diagnostics: Array<{
      requestIndex: number | null;
      symbol: string | null;
      code: string;
      message: string;
    }>;
    marketContextSourceCounts: Record<string, number>;
  };
}

interface ReviewMetric {
  tradeId: string;
  symbol: string;
  headline: string;
  metric: string;
  value: number;
  insightId: string;
}

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

function increment(counts: Map<string, number>, key: string | null | undefined): void {
  const safeKey = key && key.trim() !== "" ? key : "none";

  counts.set(safeKey, (counts.get(safeKey) ?? 0) + 1);
}

function sortedCounts(counts: Map<string, number>): Array<[string, number]> {
  return [...counts.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  );
}

function symbolFromTradeId(tradeId: string): string {
  return tradeId.split("-").at(-1)?.toUpperCase() ?? "UNKNOWN";
}

function countBySymbol(reviews: CalibrationReview[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const review of reviews) {
    increment(counts, symbolFromTradeId(review.tradeId));
  }

  return counts;
}

function pushReviewRows(args: {
  lines: string[];
  title: string;
  reviews: CalibrationReview[];
  format: (review: CalibrationReview) => string;
  maxRows?: number;
}): void {
  if (args.reviews.length === 0) {
    return;
  }

  const maxRows = args.maxRows ?? 25;
  args.lines.push(args.title);

  for (const review of args.reviews.slice(0, maxRows)) {
    args.lines.push(args.format(review));
  }

  if (args.reviews.length > maxRows) {
    args.lines.push(`- ...and ${args.reviews.length - maxRows} more`);
  }

  args.lines.push("");
}

function evidenceText(review: CalibrationReview): string {
  return review.insights.flatMap((insight) => insight.evidence).join(" ");
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

function collectExtremeMetrics(report: CalibrationReport): ReviewMetric[] {
  const metrics = [
    "tradeMfePct",
    "tradeMaePct",
    "firstEntryToPeakMovePct",
    "maxFavorableMovePctAfterExit",
    "favorableExcursionLeftOnTablePct",
  ];
  const rows: ReviewMetric[] = [];

  for (const review of report.result.decisionReviews) {
    for (const insight of review.insights) {
      const text = insight.evidence.join(" ");

      for (const metric of metrics) {
        const value = metricValue(text, metric);

        if (value !== null && Math.abs(value) >= 100) {
          rows.push({
            tradeId: review.tradeId,
            symbol: symbolFromTradeId(review.tradeId),
            headline: review.coachingHeadline ?? "none",
            metric,
            value,
            insightId: insight.id,
          });
        }
      }
    }
  }

  return rows.sort(
    (left, right) =>
      Math.abs(right.value) - Math.abs(left.value) ||
      left.tradeId.localeCompare(right.tradeId),
  );
}

function reviewsWithWeakLevelEvidence(report: CalibrationReport): CalibrationReview[] {
  return report.result.decisionReviews.filter((review) => {
    const text = evidenceText(review).toLowerCase();

    return (
      text.includes("nearestsupport=n/a") ||
      text.includes("nearestresistance=n/a") ||
      text.includes("roomtonearestresistance=n/a") ||
      text.includes("distancetosupport=n/a")
    );
  });
}

function reviewsWithFallbackHeadline(report: CalibrationReport): CalibrationReview[] {
  return report.result.decisionReviews.filter((review) => {
    const headline = (review.coachingHeadline ?? "").trim().toLowerCase();

    return (
      headline === "" ||
      headline === "entry was not close to support" ||
      headline === "entry had nearby major daily/4h support"
    );
  });
}

function isQuietCandleQualityInfoNote(note: string): boolean {
  const normalized = note.toLowerCase();

  return (
    normalized.includes("basis_aligned") ||
    normalized.includes("compatible with broker execution prices")
  );
}

type CandleQualityNoteCategory =
  | "basis_info"
  | "unsafe_basis"
  | "fallback_timeframe"
  | "incomplete_window"
  | "ignored_window"
  | "other_warning";

function classifyCandleQualityNote(note: string): CandleQualityNoteCategory {
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

function hasCandleQualityWarning(review: CalibrationReview): boolean {
  return (review.candleQualityNotes ?? []).some(
    (note) => classifyCandleQualityNote(note) !== "basis_info",
  );
}

function hasCandleQualityInfo(review: CalibrationReview): boolean {
  return (review.candleQualityNotes ?? []).some(isQuietCandleQualityInfoNote);
}

function hasCandleQualityCategory(
  review: CalibrationReview,
  category: CandleQualityNoteCategory,
): boolean {
  return (review.candleQualityNotes ?? []).some(
    (note) => classifyCandleQualityNote(note) === category,
  );
}

function linesForCounts(title: string, counts: Map<string, number>): string[] {
  const lines = [`## ${title}`, ""];
  const entries = sortedCounts(counts);

  if (entries.length === 0) {
    lines.push("- none");
  } else {
    for (const [key, count] of entries) {
      lines.push(`- ${key}: ${count}`);
    }
  }

  lines.push("");
  return lines;
}

function formatReport(report: CalibrationReport): string {
  const headlineCounts = new Map<string, number>();
  const fixCounts = new Map<string, number>();
  const insightCounts = new Map<string, number>();
  const marketCounts = new Map<string, number>();
  const tradeWindowEvidenceCounts = new Map<string, number>();
  const missingTradeWindow = report.result.decisionReviews.filter(
    (review) =>
      !review.insights.some(
        (insight) => insight.id === "trade_window_excursion_measured",
      ),
  );
  const weakLevelEvidence = reviewsWithWeakLevelEvidence(report);
  const fallbackHeadlines = reviewsWithFallbackHeadline(report);
  const extremeMetrics = collectExtremeMetrics(report);
  const candleFallbackReviews = report.result.decisionReviews.filter(
    (review) => review.tradeWindowEvidenceSource === "execution_only_fallback",
  );
  const candleQualityReviews = report.result.decisionReviews.filter(
    (review) => (review.candleQualityNotes ?? []).length > 0,
  );
  const candleQualityWarningReviews = report.result.decisionReviews.filter(
    hasCandleQualityWarning,
  );
  const candleQualityInfoReviews = report.result.decisionReviews.filter(
    hasCandleQualityInfo,
  );
  const unsafeBasisReviews = report.result.decisionReviews.filter((review) =>
    hasCandleQualityCategory(review, "unsafe_basis"),
  );
  const fallbackTimeframeReviews = report.result.decisionReviews.filter((review) =>
    hasCandleQualityCategory(review, "fallback_timeframe"),
  );
  const incompleteWindowReviews = report.result.decisionReviews.filter((review) =>
    hasCandleQualityCategory(review, "incomplete_window"),
  );
  const ignoredWindowReviews = report.result.decisionReviews.filter((review) =>
    hasCandleQualityCategory(review, "ignored_window"),
  );
  const weakLevelSymbolCounts = countBySymbol(weakLevelEvidence);
  const fallbackSymbolCounts = countBySymbol(candleFallbackReviews);
  const candleWarningSymbolCounts = countBySymbol(candleQualityWarningReviews);
  const candleInfoSymbolCounts = countBySymbol(candleQualityInfoReviews);
  const unsafeBasisSymbolCounts = countBySymbol(unsafeBasisReviews);
  const fallbackTimeframeSymbolCounts = countBySymbol(fallbackTimeframeReviews);
  const incompleteWindowSymbolCounts = countBySymbol(incompleteWindowReviews);
  const ignoredWindowSymbolCounts = countBySymbol(ignoredWindowReviews);

  for (const review of report.result.decisionReviews) {
    increment(headlineCounts, review.coachingHeadline);
    increment(fixCounts, review.fixFirstBehaviorId);
    increment(marketCounts, review.marketContextSource);
    increment(
      tradeWindowEvidenceCounts,
      review.tradeWindowEvidenceSource ?? "unknown",
    );

    for (const insight of review.insights) {
      increment(insightCounts, insight.id);
    }
  }

  const lines = [
    "# Decision Review Calibration Summary",
    "",
    `Generated from: ${report.generatedAt}`,
    `CSV: ${report.csvPath}`,
    `Broker: ${report.broker}`,
    "",
    "## Run Summary",
    "",
    `- import status: ${report.result.importStatus}`,
    `- requested trades: ${report.result.requestedTradeCount}`,
    `- analyzable trades: ${report.result.analyzableTradeCount}`,
    `- completed reviews: ${report.result.completedReviewCount}`,
    `- diagnostics: ${report.result.diagnostics.length}`,
    `- market context: ${Object.entries(report.result.marketContextSourceCounts)
      .map(([source, count]) => `${source}=${count}`)
      .join(", ") || "none"}`,
    "",
    ...linesForCounts("Headline Counts", headlineCounts),
    ...linesForCounts("Fix-First Counts", fixCounts),
    ...linesForCounts("Insight Counts", insightCounts),
    ...linesForCounts("Market Context Counts", marketCounts),
    ...linesForCounts("Trade-Window Evidence Counts", tradeWindowEvidenceCounts),
    ...linesForCounts("Weak Level Evidence By Symbol", weakLevelSymbolCounts),
    ...linesForCounts("Execution-Only Fallback By Symbol", fallbackSymbolCounts),
    ...linesForCounts(
      "Candle-Quality Attention By Symbol",
      candleWarningSymbolCounts,
    ),
    ...linesForCounts("Unsafe Candle-Basis By Symbol", unsafeBasisSymbolCounts),
    ...linesForCounts(
      "Lower-Resolution 5m Fallback By Symbol",
      fallbackTimeframeSymbolCounts,
    ),
    ...linesForCounts(
      "Incomplete Trade-Window By Symbol",
      incompleteWindowSymbolCounts,
    ),
    ...linesForCounts("Ignored Trade-Window By Symbol", ignoredWindowSymbolCounts),
    ...linesForCounts("Quiet Candle-Basis Info By Symbol", candleInfoSymbolCounts),
    "## Evidence Gaps",
    "",
    `- missing trade-window excursion insight: ${missingTradeWindow.length}`,
    `- execution-only trade-window fallback rows: ${candleFallbackReviews.length}`,
    `- candle-quality attention rows: ${candleQualityWarningReviews.length}`,
    `- unsafe candle-basis rows: ${unsafeBasisReviews.length}`,
    `- lower-resolution 5m fallback rows: ${fallbackTimeframeReviews.length}`,
    `- incomplete trade-window rows: ${incompleteWindowReviews.length}`,
    `- ignored trade-window rows: ${ignoredWindowReviews.length}`,
    `- quiet candle-basis/provenance rows: ${candleQualityInfoReviews.length}`,
    `- all candle-quality note rows: ${candleQualityReviews.length}`,
    `- weak/no level evidence rows: ${weakLevelEvidence.length}`,
    `- fallback/generic headlines: ${fallbackHeadlines.length}`,
    `- profit-protection/captured-exit contradictions: ${countContradictoryProfitProtectionAndCapturedExit(report)}`,
    `- stale poor-profit-protection fix-first labels: ${countStalePoorProfitProtectionFixFirst(report)}`,
    `- stale premature-exit fix-first labels: ${countStalePrematureExitFixFirst(report)}`,
    `- stale adding-into-weakness fix-first labels: ${countStaleAddingIntoWeaknessFixFirst(report)}`,
    `- stale undersized-winner fix-first labels: ${countStaleUndersizedWinnerFixFirst(report)}`,
    "",
  ];

  if (missingTradeWindow.length > 0) {
    pushReviewRows({
      lines,
      title: "Missing trade-window review ids:",
      reviews: missingTradeWindow,
      format: (review) =>
        `- ${review.tradeId}: ${review.coachingHeadline ?? "none"}`,
    });
  }

  pushReviewRows({
    lines,
    title: "Weak/no level evidence review ids:",
    reviews: weakLevelEvidence,
    format: (review) =>
      `- ${review.tradeId}: ${review.coachingHeadline ?? "none"}`,
  });

  pushReviewRows({
    lines,
    title: "Candle-quality attention review ids:",
    reviews: candleQualityWarningReviews,
    format: (review) =>
      `- ${review.tradeId}: ${(review.candleQualityNotes ?? []).join(" | ")}`,
  });

  pushReviewRows({
    lines,
    title: "Quiet candle-basis/provenance review ids:",
    reviews: candleQualityInfoReviews,
    format: (review) =>
      `- ${review.tradeId}: ${(review.candleQualityNotes ?? []).join(" | ")}`,
  });

  if (fallbackHeadlines.length > 0) {
    pushReviewRows({
      lines,
      title: "Fallback/generic headline review ids:",
      reviews: fallbackHeadlines,
      format: (review) =>
        `- ${review.tradeId}: ${review.coachingHeadline ?? "none"}`,
    });
  }

  lines.push("## Extreme Excursion Metrics", "");

  if (extremeMetrics.length === 0) {
    lines.push("- none");
  } else {
    for (const row of extremeMetrics.slice(0, 25)) {
      lines.push(
        `- ${row.tradeId} (${row.symbol}): ${row.metric}=${row.value.toFixed(1)}% via ${row.insightId}; headline=${row.headline}`,
      );
    }
  }

  lines.push("", "## Diagnostics", "");

  if (report.result.diagnostics.length === 0) {
    lines.push("- none");
  } else {
    for (const diagnostic of report.result.diagnostics) {
      lines.push(
        `- ${diagnostic.code}: ${diagnostic.message} (trade=${diagnostic.requestIndex ?? "n/a"}, symbol=${diagnostic.symbol ?? "n/a"})`,
      );
    }
  }

  lines.push("", "## Suggested Follow-Up", "");
  lines.push(
    extremeMetrics.length > 0
      ? "- Inspect extreme excursion rows before increasing the calibration cap."
      : "- Increase the calibration cap carefully; no extreme excursion rows were found in this capped run.",
  );
  lines.push(
    "- Convert any confusing headline or obviously wrong metric into a synthetic fixture.",
    "- Keep candle/API backfills separate from this CSV import quality pass.",
  );

  return `${lines.join("\n").trimEnd()}\n`;
}

async function main(): Promise<void> {
  const inputPath = resolve(requiredArg("--json"));
  const outputPath = resolve(
    getArgValue("--out") ??
      "artifacts/real-csv-calibration/private/decision-review-summary.md",
  );
  const raw = await readFile(inputPath, "utf8");
  const report = JSON.parse(raw) as CalibrationReport;
  const output = formatReport(report);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, "utf8");
  process.stdout.write(output);
  process.stderr.write(`Wrote decision-review summary report: ${outputPath}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
