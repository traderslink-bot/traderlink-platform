import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  summarizeDecisionReviewCalibrationReadiness,
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

function formatCounts(counts: Record<string, number>, limit = 20): string[] {
  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return ["- none"];
  }

  const lines = entries.slice(0, limit).map(([key, count]) => `- ${key}: ${count}`);

  if (entries.length > limit) {
    lines.push(`- ...and ${entries.length - limit} more`);
  }

  return lines;
}

export function formatMarketDataReadinessSummary(
  summary: DecisionReviewCalibrationReadinessSummary,
): string {
  const lines = [
    "# Market Data Readiness Summary",
    "",
    `Generated from: ${summary.generatedAt}`,
    "",
    "## Review Counts",
    "",
    `- import status: ${summary.importStatus}`,
    `- requested trades: ${summary.requestedTradeCount}`,
    `- analyzable trades: ${summary.analyzableTradeCount}`,
    `- completed reviews: ${summary.completedReviewCount}`,
    `- diagnostics: ${summary.diagnosticCount}`,
    `- open skipped trades: ${summary.openSkippedCount}`,
    "",
    "## Market Data Evidence",
    "",
    `- execution-only fallback reviews: ${summary.executionOnlyFallbackCount}`,
    `- candle-quality attention rows: ${summary.candleQualityWarningCount}`,
    `- unsafe candle-basis rows: ${summary.candleQualityUnsafeBasisCount}`,
    `- lower-resolution 5m fallback rows: ${summary.candleQualityFallbackTimeframeCount}`,
    `- incomplete trade-window rows: ${summary.candleQualityIncompleteWindowCount}`,
    `- ignored trade-window rows: ${summary.candleQualityIgnoredWindowCount}`,
    `- quiet candle-basis/provenance rows: ${summary.candleQualityInfoCount}`,
    `- all candle-quality note rows: ${summary.candleQualityNoteCount}`,
    `- weak/no daily/4h level evidence rows: ${summary.weakLevelEvidenceCount}`,
    `- missing trade-window excursion insights: ${summary.missingTradeWindowExcursionCount}`,
    `- extreme excursion metrics: ${summary.extremeExcursionMetricCount}`,
    `- fallback/generic headlines: ${summary.fallbackHeadlineCount}`,
    `- profit-protection/captured-exit contradictions: ${summary.contradictoryProfitProtectionAndCapturedExitCount}`,
    `- stale poor-profit-protection fix-first labels: ${summary.stalePoorProfitProtectionFixFirstCount}`,
    `- stale premature-exit fix-first labels: ${summary.stalePrematureExitFixFirstCount}`,
    `- stale adding-into-weakness fix-first labels: ${summary.staleAddingIntoWeaknessFixFirstCount}`,
    `- stale undersized-winner fix-first labels: ${summary.staleUndersizedWinnerFixFirstCount}`,
    "",
    "## Trade-Window Evidence Counts",
    "",
    ...formatCounts(summary.tradeWindowEvidenceCounts),
    "",
    "## Market Context Source Counts",
    "",
    ...formatCounts(summary.marketContextSourceCounts),
    "",
    "## Top Execution-Only Fallback Symbols",
    "",
    ...formatCounts(summary.executionOnlyFallbackBySymbol, 15),
    "",
    "## Top Candle-Quality Attention Symbols",
    "",
    ...formatCounts(summary.candleQualityWarningBySymbol, 15),
    "",
    "## Top Unsafe Candle-Basis Symbols",
    "",
    ...formatCounts(summary.candleQualityUnsafeBasisBySymbol, 15),
    "",
    "## Top Lower-Resolution 5m Fallback Symbols",
    "",
    ...formatCounts(summary.candleQualityFallbackTimeframeBySymbol, 15),
    "",
    "## Top Incomplete Trade-Window Symbols",
    "",
    ...formatCounts(summary.candleQualityIncompleteWindowBySymbol, 15),
    "",
    "## Top Ignored Trade-Window Symbols",
    "",
    ...formatCounts(summary.candleQualityIgnoredWindowBySymbol, 15),
    "",
    "## Top Quiet Candle-Basis Symbols",
    "",
    ...formatCounts(summary.candleQualityInfoBySymbol, 15),
    "",
    "## Top Weak-Level Evidence Symbols",
    "",
    ...formatCounts(summary.weakLevelEvidenceBySymbol, 15),
    "",
    "## Success Target For Next Rerun",
    "",
    "- execution-only fallback count should decrease",
    "- candle-quality attention count should decrease or stay explainable",
    "- quiet candle-basis/provenance count may increase as provider metadata improves",
    "- weak/no daily/4h level evidence count should decrease",
    "- missing trade-window excursion count should stay at 0",
    "- extreme excursion metric count should stay at 0",
    "- fallback/generic headline count should stay at 0",
    "- behavior contradiction and stale fix-first counts should stay at 0",
  ];

  return `${lines.join("\n").trimEnd()}\n`;
}

async function main(): Promise<void> {
  const inputPath = resolve(requiredArg("--json"));
  const outputPath = resolve(
    getArgValue("--out") ??
      "artifacts/real-csv-calibration/private/market-data-readiness-summary.md",
  );
  const report = JSON.parse(
    await readFile(inputPath, "utf8"),
  ) as DecisionReviewCalibrationReport;
  const output = formatMarketDataReadinessSummary(
    summarizeDecisionReviewCalibrationReadiness(report),
  );

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, "utf8");
  process.stdout.write(output);
  process.stderr.write(`Wrote market-data readiness summary: ${outputPath}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
