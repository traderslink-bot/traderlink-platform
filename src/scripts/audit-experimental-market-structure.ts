import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sampleCreateRawTradeTimelineInput } from "../lib/raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../lib/support-resistance/__fixtures__/sample-levels-system-fetch-service";
import {
  buildExperimentalMarketStructureAudit,
  buildExperimentalMarketStructureAuditFromLevelsSystemCandles,
} from "../lib/support-resistance/market-structure-audit/build-experimental-market-structure-audit";
import { readLevelsSystemRuntimeConfigFromEnv } from "../lib/support-resistance/levels-system-runtime-options";
import type {
  TradeAnalysisEngineArgs,
  TradeAnalysisEngineLevelsSystemCandleArgs,
} from "../lib/trade-analysis-engine";
import type { LevelsSystemRuntimeConfig } from "../lib/support-resistance/levels-system-runtime-options";
import type {
  ExperimentalMarketStructureAudit,
  ExperimentalMarketStructureAuditRecord,
} from "../lib/support-resistance/market-structure-audit/build-experimental-market-structure-audit";
import { formatMarketStructureCalibrationReport } from "../lib/support-resistance/market-structure-audit/format-market-structure-calibration-report";
import {
  parseMarketStructureAuditTradeDocument,
  type ParsedMarketStructureAuditTrades,
} from "../lib/support-resistance/market-structure-audit/parse-market-structure-audit-trades";
import { evaluateMarketStructureCalibration } from "../lib/support-resistance/market-structure-audit/evaluate-market-structure-calibration";
import { evaluateMarketStructurePromotionReadiness } from "../lib/support-resistance/market-structure-audit/evaluate-market-structure-promotion-readiness";

interface LoadedTrades extends ParsedMarketStructureAuditTrades {
  sourceLabel: string;
  providerLabel: string;
  levelsSystem: LevelsSystemRuntimeConfig;
}

interface CliArgs {
  inputPath?: string;
  jsonOutput: boolean;
  outDir?: string;
  validateOnly: boolean;
  realSavedTradeBatchReviewed: boolean;
}

function parseCliArgs(argv: string[]): CliArgs {
  const parsed: CliArgs = {
    jsonOutput: false,
    validateOnly: false,
    realSavedTradeBatchReviewed: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--json") {
      parsed.jsonOutput = true;
      continue;
    }

    if (arg === "--validate-only") {
      parsed.validateOnly = true;
      continue;
    }

    if (arg === "--real-saved-trades-reviewed") {
      parsed.realSavedTradeBatchReviewed = true;
      continue;
    }

    if (arg === "--out-dir") {
      const outDir = argv[index + 1];

      if (!outDir || outDir.startsWith("--")) {
        throw new Error("--out-dir requires a directory path.");
      }

      parsed.outDir = outDir;
      index += 1;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    if (parsed.inputPath) {
      throw new Error(
        `Only one input path is supported. Received both ${parsed.inputPath} and ${arg}.`,
      );
    }

    parsed.inputPath = arg;
  }

  return parsed;
}

function buildValidationSummary(loaded: LoadedTrades): Record<string, unknown> {
  return {
    source: loaded.sourceLabel,
    provider: loaded.providerLabel,
    mode: loaded.mode,
    tradeCount: loaded.trades.length,
  };
}

function printValidationSummary(loaded: LoadedTrades): void {
  console.log("========================================");
  console.log("MARKET STRUCTURE AUDIT INPUT VALIDATION");
  console.log("========================================");
  console.log(`Source: ${loaded.sourceLabel}`);
  console.log(`Provider: ${loaded.providerLabel}`);
  console.log(`Mode: ${loaded.mode}`);
  console.log(`Trades: ${loaded.trades.length}`);
}

async function loadTradesFromArgs(args: CliArgs): Promise<LoadedTrades> {
  if (!args.inputPath) {
    return {
      sourceLabel: "sample fixture",
      providerLabel: "stub fixture",
      mode: "levels_system_trade_window",
      trades: [
        {
          symbol: sampleCreateRawTradeTimelineInput.symbol,
          tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
          executions: sampleCreateRawTradeTimelineInput.executions,
          sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
          tradeWindow: {
            timeframe: "1m",
            preTradeMinutes: 60,
            postTradeMinutes: 60,
          },
        },
      ],
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    };
  }

  const filePath = resolve(args.inputPath);
  const raw = await readFile(filePath, "utf8");
  const parsed = parseMarketStructureAuditTradeDocument(JSON.parse(raw));
  const levelsSystem = readLevelsSystemRuntimeConfigFromEnv();

  return {
    sourceLabel: filePath,
    providerLabel: levelsSystem.preferredProvider ?? "default",
    mode: parsed.mode,
    trades: parsed.trades,
    levelsSystem,
  };
}

function formatCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  if (entries.length === 0) {
    return "(none)";
  }

  return entries.map(([key, count]) => `${key}:${count}`).join(", ");
}

function formatIds(ids: string[], limit = 8): string {
  if (ids.length === 0) {
    return "(none)";
  }

  const shown = ids.slice(0, limit);
  const suffix = ids.length > limit ? ` ... +${ids.length - limit} more` : "";

  return `${shown.join(", ")}${suffix}`;
}

function printRecord(record: ExperimentalMarketStructureAuditRecord): void {
  console.log("");
  console.log(
    `[${record.tradeIndex}] ${record.symbol} ${record.sessionDate} ${record.tradeDirection}`,
  );
  console.log(`  candle source: ${record.candleSource}`);

  if (record.analysisStatus === "error") {
    console.log(`  status: error - ${record.errorMessage}`);
    return;
  }

  const structure = record.marketStructure;

  if (!structure) {
    console.log("  market structure: missing");
  } else {
    console.log(
      `  market structure: ${structure.state} / ${structure.trendDirection} / ${structure.confidence.label}`,
    );
    console.log(
      `  pivots: highs ${structure.pivotCounts.confirmedHighs}, lows ${structure.pivotCounts.confirmedLows}`,
    );
    console.log(
      `  range: ${
        structure.range
          ? `${structure.range.low}-${structure.range.high} ${structure.range.quality}`
          : "none"
      }`,
    );
    console.log(
      `  pivot event: ${
        structure.pivotEvent && structure.pivotEvent.type !== "none"
          ? `${structure.pivotEvent.type} ${structure.pivotEvent.confirmation}`
          : "none"
      }`,
    );

    if (structure.traderLine) {
      console.log(`  trader line: ${structure.traderLine}`);
    }

    if (structure.diagnostics.length > 0) {
      console.log(
        `  diagnostics: ${structure.diagnostics
          .map((diagnostic) => diagnostic.code)
          .join(", ")}`,
      );
    }
  }

  console.log(
    `  levels: support ${record.levelCounts.support}, resistance ${record.levelCounts.resistance}`,
  );
  console.log(
    `  pattern input leak check: ${
      record.patternInputContainsExperimentalMarketStructure ? "FAILED" : "ok"
    }`,
  );
  console.log(`  detected patterns: ${formatIds(record.detectedPatternIds)}`);
  console.log(`  normalized patterns: ${formatIds(record.normalizedPatternIds)}`);

  if (record.warnings.length > 0) {
    console.log(`  engine messages: ${record.warnings.join(" | ")}`);
  }
}

function printAudit(audit: ExperimentalMarketStructureAudit, source: string): void {
  console.log("========================================");
  console.log("EXPERIMENTAL MARKET STRUCTURE AUDIT");
  console.log("========================================");
  console.log(`Source: ${source}`);
  console.log(`Generated: ${audit.generatedAt}`);
  console.log(`Observational only: ${audit.observationalOnly}`);
  console.log("");
  console.log("Totals:");
  console.log(`  trades: ${audit.totals.totalTrades}`);
  console.log(`  successful: ${audit.totals.successfulTrades}`);
  console.log(`  failed: ${audit.totals.failedTrades}`);
  console.log(
    `  missing market structure: ${audit.totals.missingMarketStructureCount}`,
  );
  console.log(`  pattern input leaks: ${audit.totals.patternInputLeakCount}`);
  console.log(
    `  support/resistance levels: ${audit.totals.totalSupportLevels}/${audit.totals.totalResistanceLevels}`,
  );
  console.log(`  states: ${formatCounts(audit.totals.stateCounts)}`);
  console.log(`  trends: ${formatCounts(audit.totals.trendDirectionCounts)}`);
  console.log(`  confidence: ${formatCounts(audit.totals.confidenceCounts)}`);
  console.log(
    `  diagnostics: ${formatCounts(audit.totals.diagnosticCodeCounts)}`,
  );

  for (const record of audit.records) {
    printRecord(record);
  }
}

async function writeReportArtifacts(args: {
  audit: ExperimentalMarketStructureAudit;
  outDir: string;
  sourceLabel: string;
  providerLabel: string;
  realSavedTradeBatchReviewed: boolean;
}): Promise<void> {
  const outDir = resolve(args.outDir);
  const jsonPath = `${outDir}\\market-structure-audit.json`;
  const evaluationPath = `${outDir}\\market-structure-calibration-evaluation.json`;
  const promotionReadinessPath = `${outDir}\\market-structure-promotion-readiness.json`;
  const markdownPath = `${outDir}\\market-structure-calibration-report.md`;
  const evaluation = evaluateMarketStructureCalibration(args.audit);
  const promotionReadiness = evaluateMarketStructurePromotionReadiness({
    audit: args.audit,
    realSavedTradeBatchReviewed: args.realSavedTradeBatchReviewed,
  });
  const markdown = formatMarketStructureCalibrationReport({
    audit: args.audit,
    sourceLabel: args.sourceLabel,
    providerLabel: args.providerLabel,
  });

  await mkdir(outDir, { recursive: true });
  await writeFile(jsonPath, JSON.stringify(args.audit, null, 2), "utf8");
  await writeFile(
    evaluationPath,
    JSON.stringify(
      {
        source: args.sourceLabel,
        provider: args.providerLabel,
        generated: args.audit.generatedAt,
        observationalOnly: args.audit.observationalOnly,
        overallStatus: evaluation.overallStatus,
        gates: evaluation.gates,
        recommendation: evaluation.recommendation,
      },
      null,
      2,
    ),
    "utf8",
  );
  await writeFile(
    promotionReadinessPath,
    JSON.stringify(
      {
        source: args.sourceLabel,
        provider: args.providerLabel,
        realSavedTradeBatchReviewed: args.realSavedTradeBatchReviewed,
        ...promotionReadiness,
      },
      null,
      2,
    ),
    "utf8",
  );
  await writeFile(markdownPath, markdown, "utf8");

  console.log("");
  console.log("Report artifacts written:");
  console.log(`  ${jsonPath}`);
  console.log(`  ${evaluationPath}`);
  console.log(`  ${promotionReadinessPath}`);
  console.log(`  ${markdownPath}`);
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const loaded = await loadTradesFromArgs(args);

  if (args.validateOnly) {
    if (args.jsonOutput) {
      console.log(JSON.stringify(buildValidationSummary(loaded), null, 2));
    } else {
      printValidationSummary(loaded);
    }

    return;
  }

  const audit =
    loaded.mode === "provided_trade_candles"
      ? await buildExperimentalMarketStructureAudit({
          trades: loaded.trades as TradeAnalysisEngineArgs[],
          levelsSystem: loaded.levelsSystem,
        })
      : await buildExperimentalMarketStructureAuditFromLevelsSystemCandles({
          trades: loaded.trades as Omit<
            TradeAnalysisEngineLevelsSystemCandleArgs,
            "levelsSystem"
          >[],
          levelsSystem: loaded.levelsSystem,
        });

  if (args.jsonOutput) {
    console.log(JSON.stringify(audit, null, 2));
  } else {
    printAudit(audit, loaded.sourceLabel);
  }

  if (args.outDir) {
    await writeReportArtifacts({
      audit,
      outDir: args.outDir,
      sourceLabel: loaded.sourceLabel,
      providerLabel: loaded.providerLabel,
      realSavedTradeBatchReviewed: args.realSavedTradeBatchReviewed,
    });
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Market-structure audit failed: ${message}`);
  process.exitCode = 1;
});
