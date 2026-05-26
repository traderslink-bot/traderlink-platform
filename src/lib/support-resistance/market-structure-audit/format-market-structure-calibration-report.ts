import type {
  ExperimentalMarketStructureAudit,
  ExperimentalMarketStructureAuditRecord,
} from "./build-experimental-market-structure-audit";
import {
  evaluateMarketStructureCalibration,
  type MarketStructureCalibrationGate,
} from "./evaluate-market-structure-calibration";

export interface FormatMarketStructureCalibrationReportArgs {
  audit: ExperimentalMarketStructureAudit;
  sourceLabel: string;
  providerLabel?: string;
}

function formatCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  if (entries.length === 0) {
    return "- none";
  }

  return entries.map(([key, count]) => `- ${key}: ${count}`).join("\n");
}

function formatPercent(numerator: number, denominator: number): string {
  if (denominator === 0) {
    return "0.0%";
  }

  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function escapeTableValue(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function formatRecordRow(
  record: ExperimentalMarketStructureAuditRecord,
): string {
  const structure = record.marketStructure;
  const state = structure?.state ?? "missing";
  const trend = structure?.trendDirection ?? "missing";
  const confidence = structure?.confidence.label ?? "missing";
  const diagnostics =
    structure && structure.diagnostics.length > 0
      ? structure.diagnostics.map((diagnostic) => diagnostic.code).join(", ")
      : "none";
  const engineMessageCount = record.warnings.length;

  return [
    record.tradeIndex,
    escapeTableValue(record.symbol),
    escapeTableValue(record.sessionDate),
    record.tradeDirection,
    record.candleSource,
    record.analysisStatus,
    state,
    trend,
    confidence,
    `${record.levelCounts.support}/${record.levelCounts.resistance}`,
    diagnostics,
    engineMessageCount,
    record.patternInputContainsExperimentalMarketStructure ? "FAILED" : "ok",
  ].join(" | ");
}

function formatRecordList(
  records: ExperimentalMarketStructureAuditRecord[],
  emptyText: string,
): string {
  if (records.length === 0) {
    return `- ${emptyText}`;
  }

  return records
    .map((record) => {
      const structure = record.marketStructure;
      const state = structure?.state ?? "missing";
      const confidence = structure?.confidence.label ?? "missing";
      const error = record.errorMessage ? ` - ${record.errorMessage}` : "";

      return `- #${record.tradeIndex} ${record.symbol} ${record.sessionDate}: ${state} / ${confidence}${error}`;
    })
    .join("\n");
}

function formatGate(gate: MarketStructureCalibrationGate): string {
  const tradeIndexes =
    gate.tradeIndexes.length > 0
      ? ` (#${gate.tradeIndexes.join(", #")})`
      : "";

  return `- ${gate.label}: ${gate.status} - ${gate.detail}${tradeIndexes}`;
}

export function formatMarketStructureCalibrationReport(
  args: FormatMarketStructureCalibrationReportArgs,
): string {
  const { audit, sourceLabel, providerLabel } = args;
  const evaluation = evaluateMarketStructureCalibration(audit);
  const {
    failureRecords,
    lowConfidenceRecords,
    allEngineMessageRecords,
    engineWarningRecords,
    unknownOrInsufficientRecords,
    structureDiagnosticRecords,
  } = evaluation.recordGroups;
  const total = audit.totals.totalTrades;

  return [
    "# Experimental Market Structure Calibration Report",
    "",
    "## Run",
    "",
    `- source: ${sourceLabel}`,
    `- provider: ${providerLabel ?? "default"}`,
    `- generated: ${audit.generatedAt}`,
    `- observational only: ${audit.observationalOnly}`,
    `- overall status: ${evaluation.overallStatus}`,
    `- recommendation action: ${evaluation.recommendation.action}`,
    "",
    "## Totals",
    "",
    `- trades: ${total}`,
    `- successful: ${audit.totals.successfulTrades} (${formatPercent(
      audit.totals.successfulTrades,
      total,
    )})`,
    `- failed: ${audit.totals.failedTrades}`,
    `- missing market structure: ${audit.totals.missingMarketStructureCount}`,
    `- PatternInput leaks: ${audit.totals.patternInputLeakCount}`,
    `- trades with engine messages: ${audit.totals.tradesWithWarningsCount}`,
    `- support/resistance levels: ${audit.totals.totalSupportLevels}/${audit.totals.totalResistanceLevels}`,
    "",
    "## Calibration Gates",
    "",
    evaluation.gates.map(formatGate).join("\n"),
    "",
    "## State Counts",
    "",
    formatCounts(audit.totals.stateCounts),
    "",
    "## Trend Counts",
    "",
    formatCounts(audit.totals.trendDirectionCounts),
    "",
    "## Confidence Counts",
    "",
    formatCounts(audit.totals.confidenceCounts),
    "",
    "## Diagnostic Counts",
    "",
    formatCounts(audit.totals.diagnosticCodeCounts),
    "",
    "## Failures",
    "",
    formatRecordList(failureRecords, "none"),
    "",
    "## Low Confidence Reads",
    "",
    formatRecordList(lowConfidenceRecords, "none"),
    "",
    "## Unknown Or Insufficient Structure Reads",
    "",
    formatRecordList(unknownOrInsufficientRecords, "none"),
    "",
    "## Market-Structure Diagnostic Reads",
    "",
    formatRecordList(structureDiagnosticRecords, "none"),
    "",
    "## Provider / Engine Warning Reads",
    "",
    formatRecordList(engineWarningRecords, "none"),
    "",
    "## All Engine Message Cases",
    "",
    formatRecordList(allEngineMessageRecords, "none"),
    "",
    "## Records",
    "",
    "index | symbol | session | direction | candle source | status | state | trend | confidence | levels | diagnostics | engine messages | leak check",
    "--- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---",
    ...audit.records.map(formatRecordRow),
    "",
    "## Recommendation",
    "",
    evaluation.recommendation.message,
    "",
  ].join("\n");
}
