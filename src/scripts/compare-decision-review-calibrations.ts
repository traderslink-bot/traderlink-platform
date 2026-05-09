import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  compareDecisionReviewCalibrationReadiness,
  type DecisionReviewCalibrationComparison,
  type DecisionReviewCalibrationReport,
  type DecisionReviewCalibrationReadinessSummary,
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

function formatDelta(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function metricLine(args: {
  label: string;
  baseline: number;
  candidate: number;
  delta: number;
  lowerIsBetter?: boolean;
}): string {
  const direction =
    args.delta === 0
      ? "same"
      : args.lowerIsBetter
        ? args.delta < 0
          ? "better"
          : "worse"
        : args.delta > 0
          ? "better"
          : "worse";

  return `- ${args.label}: ${args.baseline} -> ${args.candidate} (${formatDelta(args.delta)}, ${direction})`;
}

function sourceCount(
  summary: DecisionReviewCalibrationReadinessSummary,
  source: string,
): number {
  return summary.tradeWindowEvidenceCounts[source] ?? 0;
}

export function formatDecisionReviewCalibrationComparison(
  comparison: DecisionReviewCalibrationComparison,
): string {
  const { baseline, candidate, deltas } = comparison;
  const candleWindowDelta =
    sourceCount(candidate, "levels_system_trade_window") -
    sourceCount(baseline, "levels_system_trade_window");

  const lines = [
    "# Decision Review Calibration Comparison",
    "",
    `Baseline generated: ${baseline.generatedAt}`,
    `Candidate generated: ${candidate.generatedAt}`,
    "",
    "## Main Metrics",
    "",
    metricLine({
      label: "completed reviews",
      baseline: baseline.completedReviewCount,
      candidate: candidate.completedReviewCount,
      delta: deltas.completedReviewCount,
    }),
    metricLine({
      label: "execution-only fallback reviews",
      baseline: baseline.executionOnlyFallbackCount,
      candidate: candidate.executionOnlyFallbackCount,
      delta: deltas.executionOnlyFallbackCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "levels-system candle-window reviews",
      baseline: sourceCount(baseline, "levels_system_trade_window"),
      candidate: sourceCount(candidate, "levels_system_trade_window"),
      delta: candleWindowDelta,
    }),
    metricLine({
      label: "weak/no daily/4h level evidence rows",
      baseline: baseline.weakLevelEvidenceCount,
      candidate: candidate.weakLevelEvidenceCount,
      delta: deltas.weakLevelEvidenceCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "candle-quality attention rows",
      baseline: baseline.candleQualityWarningCount,
      candidate: candidate.candleQualityWarningCount,
      delta: deltas.candleQualityWarningCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "unsafe candle-basis rows",
      baseline: baseline.candleQualityUnsafeBasisCount,
      candidate: candidate.candleQualityUnsafeBasisCount,
      delta: deltas.candleQualityUnsafeBasisCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "lower-resolution 5m fallback rows",
      baseline: baseline.candleQualityFallbackTimeframeCount,
      candidate: candidate.candleQualityFallbackTimeframeCount,
      delta: deltas.candleQualityFallbackTimeframeCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "incomplete trade-window rows",
      baseline: baseline.candleQualityIncompleteWindowCount,
      candidate: candidate.candleQualityIncompleteWindowCount,
      delta: deltas.candleQualityIncompleteWindowCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "ignored trade-window rows",
      baseline: baseline.candleQualityIgnoredWindowCount,
      candidate: candidate.candleQualityIgnoredWindowCount,
      delta: deltas.candleQualityIgnoredWindowCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "quiet candle-basis/provenance rows",
      baseline: baseline.candleQualityInfoCount,
      candidate: candidate.candleQualityInfoCount,
      delta: deltas.candleQualityInfoCount,
    }),
    metricLine({
      label: "all candle-quality note rows",
      baseline: baseline.candleQualityNoteCount,
      candidate: candidate.candleQualityNoteCount,
      delta: deltas.candleQualityNoteCount,
    }),
    metricLine({
      label: "missing trade-window excursion insights",
      baseline: baseline.missingTradeWindowExcursionCount,
      candidate: candidate.missingTradeWindowExcursionCount,
      delta: deltas.missingTradeWindowExcursionCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "extreme excursion metrics",
      baseline: baseline.extremeExcursionMetricCount,
      candidate: candidate.extremeExcursionMetricCount,
      delta: deltas.extremeExcursionMetricCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "fallback/generic headlines",
      baseline: baseline.fallbackHeadlineCount,
      candidate: candidate.fallbackHeadlineCount,
      delta: deltas.fallbackHeadlineCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "profit-protection/captured-exit contradictions",
      baseline: baseline.contradictoryProfitProtectionAndCapturedExitCount,
      candidate: candidate.contradictoryProfitProtectionAndCapturedExitCount,
      delta: deltas.contradictoryProfitProtectionAndCapturedExitCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "stale poor-profit-protection fix-first labels",
      baseline: baseline.stalePoorProfitProtectionFixFirstCount,
      candidate: candidate.stalePoorProfitProtectionFixFirstCount,
      delta: deltas.stalePoorProfitProtectionFixFirstCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "stale premature-exit fix-first labels",
      baseline: baseline.stalePrematureExitFixFirstCount,
      candidate: candidate.stalePrematureExitFixFirstCount,
      delta: deltas.stalePrematureExitFixFirstCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "stale adding-into-weakness fix-first labels",
      baseline: baseline.staleAddingIntoWeaknessFixFirstCount,
      candidate: candidate.staleAddingIntoWeaknessFixFirstCount,
      delta: deltas.staleAddingIntoWeaknessFixFirstCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "stale undersized-winner fix-first labels",
      baseline: baseline.staleUndersizedWinnerFixFirstCount,
      candidate: candidate.staleUndersizedWinnerFixFirstCount,
      delta: deltas.staleUndersizedWinnerFixFirstCount,
      lowerIsBetter: true,
    }),
    metricLine({
      label: "open skipped trades",
      baseline: baseline.openSkippedCount,
      candidate: candidate.openSkippedCount,
      delta: deltas.openSkippedCount,
      lowerIsBetter: true,
    }),
    "",
    "## Read",
    "",
    "- Good provider/backfill work should lower execution-only fallback, weak-level evidence, and unsafe/incomplete candle-warning counts.",
    "- Quiet candle-basis/provenance rows can rise when provider metadata becomes more explicit.",
    "- Missing trade-window excursions, extreme excursions, and generic headlines should stay at 0.",
    "- Behavior contradiction and stale fix-first counts should stay at 0.",
    "- Open skipped trades may stay unchanged unless grouping/input data changed.",
  ];

  return `${lines.join("\n").trimEnd()}\n`;
}

async function readReport(path: string): Promise<DecisionReviewCalibrationReport> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as DecisionReviewCalibrationReport;
}

async function main(): Promise<void> {
  const baselinePath = requiredArg("--baseline");
  const candidatePath = requiredArg("--candidate");
  const outputPath = resolve(
    getArgValue("--out") ??
      "artifacts/real-csv-calibration/private/decision-review-calibration-comparison.md",
  );
  const output = formatDecisionReviewCalibrationComparison(
    compareDecisionReviewCalibrationReadiness(
      await readReport(baselinePath),
      await readReport(candidatePath),
    ),
  );

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, "utf8");
  process.stdout.write(output);
  process.stderr.write(`Wrote decision-review calibration comparison: ${outputPath}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
