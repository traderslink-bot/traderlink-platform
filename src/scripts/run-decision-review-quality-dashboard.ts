import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import type { BrokerExecutionCsvFormat } from "../lib/execution-sources/csv";
import {
  disposeLevelsSystemRuntimeConfig,
  readLevelsSystemRuntimeConfigFromEnv,
} from "../lib/support-resistance/levels-system-runtime-options";
import { decisionReviewCsvScenarios } from "../lib/trader-analytics/__fixtures__/decision-review-csv-scenarios";
import {
  buildCsvDryRunDecisionReviewBridge,
  type CsvDryRunDecisionReviewBridgeResult,
} from "../lib/trader-analytics/server/build-csv-dry-run-decision-review-bridge";
import {
  buildDecisionReviewQualityDashboard,
  formatDecisionReviewQualityDashboardMarkdown,
} from "../lib/trader-analytics/server/build-decision-review-quality-dashboard";

const VALID_BROKER_FORMATS = new Set<BrokerExecutionCsvFormat>([
  "auto",
  "ibkr_activity_statement",
  "moomoo_trade_history",
  "webull_order_history",
  "robinhood_transaction_history",
  "schwab_transactions",
  "generic_execution_csv",
]);
const REPORT_DIR = resolve("artifacts", "decision-review-quality");
type CalibrationRunMode = "synthetic" | "csv" | "csv-dir";

interface ScriptRunResult {
  output: string;
  exitCode: number;
  fileReports?: CsvDirectoryFileReport[];
}

interface CsvCalibrationReport {
  contractVersion: "decision_review_csv_calibration_run_v1";
  generatedAt: string;
  csvPath: string;
  broker: BrokerExecutionCsvFormat;
  result: CsvDryRunDecisionReviewBridgeResult;
}

interface CsvCalibrationRunResult extends ScriptRunResult {
  report: CsvCalibrationReport;
}

interface CsvDirectoryFileReport {
  csvPath: string;
  reportPath: string;
  output: string;
  exitCode: number;
  report: CsvCalibrationReport;
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

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function parseBroker(value: string | undefined): BrokerExecutionCsvFormat {
  if (value === undefined || value.trim() === "") {
    throw new Error(
      "--csv and --csv-dir require --broker. Example: --broker=generic_execution_csv",
    );
  }

  const broker = value.trim() as BrokerExecutionCsvFormat;

  if (!VALID_BROKER_FORMATS.has(broker)) {
    throw new Error(
      `Unsupported --broker value: ${value}. Expected one of: ${[
        ...VALID_BROKER_FORMATS,
      ].join(", ")}`,
    );
  }

  return broker;
}

function parseMaxTrades(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("--max-trades must be a positive integer.");
  }

  return parsed;
}

function latestOutputPath(args: {
  isJson: boolean;
  mode: CalibrationRunMode;
}): string {
  const stem = args.mode === "csv-dir" ? "latest-batch" : "latest";

  return resolve(REPORT_DIR, `${stem}.${args.isJson ? "json" : "md"}`);
}

function fileSafeTimestamp(value: string): string {
  return value
    .replace(/[^0-9A-Za-z]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function historyOutputPath(args: {
  generatedAt: string;
  isJson: boolean;
  mode: CalibrationRunMode;
}): string {
  if (args.mode === "csv-dir") {
    return resolve(
      REPORT_DIR,
      `${fileSafeTimestamp(args.generatedAt)}-csv-dir`,
      `index.${args.isJson ? "json" : "md"}`,
    );
  }

  return resolve(
    REPORT_DIR,
    `${fileSafeTimestamp(args.generatedAt)}-${args.mode}.${args.isJson ? "json" : "md"}`,
  );
}

function safeFileStem(value: string): string {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[^0-9A-Za-z]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "csv";
}

function batchFileReportPath(args: {
  batchIndexPath: string;
  csvPath: string;
  index: number;
  isJson: boolean;
}): string {
  return resolve(
    dirname(args.batchIndexPath),
    `${String(args.index + 1).padStart(2, "0")}-${safeFileStem(
      basename(args.csvPath),
    )}.${args.isJson ? "json" : "md"}`,
  );
}

async function writeReport(path: string, output: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, output, "utf8");
}

async function collectCsvFiles(csvDir: string): Promise<string[]> {
  const root = resolve(csvDir);
  const files: string[] = [];

  async function visit(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await visit(entryPath);
        continue;
      }

      if (entry.isFile() && extname(entry.name).toLowerCase() === ".csv") {
        files.push(resolve(entryPath));
      }
    }
  }

  await visit(root);

  return files.sort((left, right) =>
    relative(root, left).localeCompare(relative(root, right)),
  );
}

function formatCsvCalibrationMarkdown(args: {
  generatedAt: string;
  csvPath: string;
  broker: BrokerExecutionCsvFormat;
  result: CsvDryRunDecisionReviewBridgeResult;
}): string {
  const lines = [
    "# Decision Review CSV Calibration",
    "",
    `Generated: ${args.generatedAt}`,
    `CSV: ${args.csvPath}`,
    `Broker: ${args.broker}`,
    "Calibration status: review_required",
    "",
    "## Import Summary",
    "",
    `- import status: ${args.result.importStatus}`,
    `- requested trades: ${args.result.requestedTradeCount}`,
    `- analyzable trades: ${args.result.analyzableTradeCount}`,
    `- completed reviews: ${args.result.completedReviewCount}`,
    "",
    "## Market Context Sources",
    "",
  ];

  const sourceEntries = Object.entries(args.result.marketContextSourceCounts);

  if (sourceEntries.length === 0) {
    lines.push("- none");
  } else {
    for (const [source, count] of sourceEntries) {
      lines.push(`- ${source}: ${count}`);
    }
  }

  lines.push("", "## Diagnostics", "");

  if (args.result.diagnostics.length === 0) {
    lines.push("- none");
  } else {
    for (const diagnostic of args.result.diagnostics) {
      lines.push(
        `- ${diagnostic.code}: ${diagnostic.message} (trade=${diagnostic.requestIndex ?? "n/a"}, symbol=${diagnostic.symbol ?? "n/a"})`,
      );
    }
  }

  lines.push("", "## Decision Reviews", "");

  if (args.result.decisionReviews.length === 0) {
    lines.push("- none");
  } else {
    for (const review of args.result.decisionReviews) {
      lines.push(
        `### ${review.tradeId ?? "unknown-trade"}`,
        "",
        `- headline: ${review.coachingHeadline ?? "none"}`,
        `- market context: ${review.marketContextSource ?? "none"}`,
        `- trade-window evidence: ${review.tradeWindowEvidenceSource ?? "unknown"}`,
        `- candle-quality notes: ${(review.candleQualityNotes ?? []).join("; ") || "none"}`,
        `- fix first: ${review.fixFirstBehaviorId ?? "none"}`,
        `- insights: ${review.insights.map((insight) => insight.id).join(", ") || "none"}`,
        "",
      );

      for (const insight of review.insights) {
        lines.push(
          `- ${insight.id} (${insight.tone}/${insight.category}): ${insight.title}`,
        );

        if ((insight.evidence ?? []).length > 0) {
          lines.push(`  evidence: ${(insight.evidence ?? []).join("; ")}`);
        }
      }

      lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

function csvFileStatus(report: CsvCalibrationReport): "pass" | "review" {
  return report.result.importStatus === "blocked" ||
    report.result.completedReviewCount === 0
    ? "review"
    : "pass";
}

function formatCsvDirectoryCalibrationMarkdown(args: {
  generatedAt: string;
  csvDir: string;
  broker: BrokerExecutionCsvFormat;
  fileReports: CsvDirectoryFileReport[];
}): string {
  const passCount = args.fileReports.filter(
    (file) => csvFileStatus(file.report) === "pass",
  ).length;
  const reviewCount = args.fileReports.length - passCount;
  const totalRequested = args.fileReports.reduce(
    (total, file) => total + file.report.result.requestedTradeCount,
    0,
  );
  const totalAnalyzable = args.fileReports.reduce(
    (total, file) => total + file.report.result.analyzableTradeCount,
    0,
  );
  const totalCompleted = args.fileReports.reduce(
    (total, file) => total + file.report.result.completedReviewCount,
    0,
  );
  const totalDiagnostics = args.fileReports.reduce(
    (total, file) => total + file.report.result.diagnostics.length,
    0,
  );
  const lines = [
    "# Decision Review CSV Directory Calibration",
    "",
    `Generated: ${args.generatedAt}`,
    `CSV directory: ${args.csvDir}`,
    `Broker: ${args.broker}`,
    `Status: ${reviewCount > 0 ? "review" : "pass"}`,
    "",
    "## Batch Summary",
    "",
    `- csv files: ${args.fileReports.length}`,
    `- pass: ${passCount}`,
    `- review: ${reviewCount}`,
    `- requested trades: ${totalRequested}`,
    `- analyzable trades: ${totalAnalyzable}`,
    `- completed reviews: ${totalCompleted}`,
    `- diagnostics: ${totalDiagnostics}`,
    "",
    "## Files",
    "",
  ];

  for (const file of args.fileReports) {
    const status = csvFileStatus(file.report);
    const relativeReportPath = relative(dirname(file.reportPath), file.reportPath);

    lines.push(
      `### ${basename(file.csvPath)}`,
      "",
      `- status: ${status}`,
      `- report: ${relativeReportPath || basename(file.reportPath)}`,
      `- import status: ${file.report.result.importStatus}`,
      `- requested trades: ${file.report.result.requestedTradeCount}`,
      `- analyzable trades: ${file.report.result.analyzableTradeCount}`,
      `- completed reviews: ${file.report.result.completedReviewCount}`,
      `- diagnostics: ${file.report.result.diagnostics.length}`,
      `- market context: ${
        Object.entries(file.report.result.marketContextSourceCounts)
          .map(([source, count]) => `${source}=${count}`)
          .join(", ") || "none"
      }`,
      "",
    );

    const firstReview = file.report.result.decisionReviews[0];

    if (firstReview) {
      lines.push(
        `First headline: ${firstReview.coachingHeadline ?? "none"}`,
        "",
        `First insights: ${
          firstReview.insights.map((insight) => insight.id).join(", ") ||
          "none"
        }`,
        "",
      );
    }

    if (file.report.result.diagnostics.length > 0) {
      lines.push("Diagnostics:");

      for (const diagnostic of file.report.result.diagnostics.slice(0, 5)) {
        lines.push(`- ${diagnostic.code}: ${diagnostic.message}`);
      }

      lines.push("");
    }
  }

  lines.push("## Fixture Follow-Up", "");

  const reviewFiles = args.fileReports.filter(
    (file) =>
      csvFileStatus(file.report) === "review" ||
      file.report.result.diagnostics.length > 0,
  );

  if (reviewFiles.length === 0) {
    lines.push("- none; convert only subjective wording misses after manual review");
  } else {
    for (const file of reviewFiles) {
      lines.push(
        `- ${basename(file.csvPath)}: inspect report, then convert any false positive, false negative, confusing headline, or import grouping miss into a synthetic fixture.`,
      );
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

async function runSyntheticDashboard(args: {
  generatedAt?: string;
  isJson: boolean;
}): Promise<ScriptRunResult> {
  const dashboard = await buildDecisionReviewQualityDashboard({
    scenarios: decisionReviewCsvScenarios,
    generatedAt: args.generatedAt,
  });
  const output = args.isJson
    ? `${JSON.stringify(dashboard, null, 2)}\n`
    : formatDecisionReviewQualityDashboardMarkdown(dashboard);

  return {
    output,
    exitCode: dashboard.status === "fail" ? 1 : 0,
  };
}

async function runCsvCalibration(args: {
  csvPath: string;
  broker: BrokerExecutionCsvFormat;
  accountTimezone?: string;
  generatedAt?: string;
  maxTrades?: number;
  isJson: boolean;
}): Promise<CsvCalibrationRunResult> {
  const resolvedCsvPath = resolve(args.csvPath);
  const csvText = await readFile(resolvedCsvPath, "utf8");
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const levelsSystem = readLevelsSystemRuntimeConfigFromEnv();
  let result;

  try {
    result = await buildCsvDryRunDecisionReviewBridge({
      csvText,
      broker: args.broker,
      accountTimezone: args.accountTimezone,
      levelsSystem,
      generatedAt,
      maxTrades: args.maxTrades,
    });
  } finally {
    disposeLevelsSystemRuntimeConfig(levelsSystem);
  }
  const report = {
    contractVersion: "decision_review_csv_calibration_run_v1" as const,
    generatedAt,
    csvPath: resolvedCsvPath,
    broker: args.broker,
    result,
  };
  const output = args.isJson
    ? `${JSON.stringify(report, null, 2)}\n`
    : formatCsvCalibrationMarkdown({
        generatedAt,
        csvPath: resolvedCsvPath,
        broker: args.broker,
        result,
      });

  return {
    output,
    exitCode:
      result.importStatus === "blocked" || result.completedReviewCount === 0
        ? 1
        : 0,
    report,
  };
}

async function runCsvDirectoryCalibration(args: {
  csvDir: string;
  broker: BrokerExecutionCsvFormat;
  accountTimezone?: string;
  generatedAt: string;
  maxTrades?: number;
  isJson: boolean;
  historyIndexPath: string;
}): Promise<ScriptRunResult> {
  const resolvedCsvDir = resolve(args.csvDir);
  const csvFiles = await collectCsvFiles(resolvedCsvDir);

  if (csvFiles.length === 0) {
    throw new Error(`No .csv files found under ${resolvedCsvDir}.`);
  }

  const fileReports: CsvDirectoryFileReport[] = [];

  for (const [index, csvPath] of csvFiles.entries()) {
    const run = await runCsvCalibration({
      csvPath,
      broker: args.broker,
      accountTimezone: args.accountTimezone,
      generatedAt: args.generatedAt,
      maxTrades: args.maxTrades,
      isJson: args.isJson,
    });
    fileReports.push({
      csvPath,
      reportPath: batchFileReportPath({
        batchIndexPath: args.historyIndexPath,
        csvPath,
        index,
        isJson: args.isJson,
      }),
      output: run.output,
      exitCode: run.exitCode,
      report: run.report,
    });
  }

  const batchReport = {
    contractVersion: "decision_review_csv_directory_calibration_run_v1" as const,
    generatedAt: args.generatedAt,
    csvDir: resolvedCsvDir,
    broker: args.broker,
    fileCount: fileReports.length,
    passCount: fileReports.filter((file) => csvFileStatus(file.report) === "pass")
      .length,
    reviewCount: fileReports.filter(
      (file) => csvFileStatus(file.report) === "review",
    ).length,
    files: fileReports.map((file) => ({
      csvPath: file.csvPath,
      reportPath: file.reportPath,
      status: csvFileStatus(file.report),
      importStatus: file.report.result.importStatus,
      requestedTradeCount: file.report.result.requestedTradeCount,
      analyzableTradeCount: file.report.result.analyzableTradeCount,
      completedReviewCount: file.report.result.completedReviewCount,
      diagnosticCount: file.report.result.diagnostics.length,
      marketContextSourceCounts: file.report.result.marketContextSourceCounts,
      firstHeadline:
        file.report.result.decisionReviews[0]?.coachingHeadline ?? null,
      firstInsightIds:
        file.report.result.decisionReviews[0]?.insights.map(
          (insight) => insight.id,
        ) ?? [],
    })),
  };
  const output = args.isJson
    ? `${JSON.stringify(batchReport, null, 2)}\n`
    : formatCsvDirectoryCalibrationMarkdown({
        generatedAt: args.generatedAt,
        csvDir: resolvedCsvDir,
        broker: args.broker,
        fileReports,
      });

  return {
    output,
    exitCode: fileReports.some((file) => file.exitCode !== 0) ? 1 : 0,
    fileReports,
  };
}

async function main(): Promise<void> {
  const generatedAt = getArgValue("--generated-at") ?? new Date().toISOString();
  const isJson = hasFlag("--json");
  const csvPath = getArgValue("--csv");
  const csvDir = getArgValue("--csv-dir");

  if (csvPath !== undefined && csvDir !== undefined) {
    throw new Error("Use either --csv or --csv-dir, not both.");
  }

  const reportMode: CalibrationRunMode =
    csvDir !== undefined ? "csv-dir" : csvPath !== undefined ? "csv" : "synthetic";
  const outputPath = resolve(
    getArgValue("--out") ?? latestOutputPath({ isJson, mode: reportMode }),
  );
  const historyPath = historyOutputPath({
    generatedAt,
    isJson,
    mode: reportMode,
  });
  const shouldWrite = !hasFlag("--no-write");
  const shouldWriteHistory = !hasFlag("--no-history");
  const runResult =
    csvDir !== undefined
      ? await runCsvDirectoryCalibration({
          csvDir,
          broker: parseBroker(getArgValue("--broker")),
          accountTimezone: getArgValue("--account-timezone"),
          generatedAt,
          maxTrades: parseMaxTrades(getArgValue("--max-trades")),
          isJson,
          historyIndexPath: historyPath,
        })
      : csvPath !== undefined
        ? await runCsvCalibration({
          csvPath,
          broker: parseBroker(getArgValue("--broker")),
          accountTimezone: getArgValue("--account-timezone"),
          generatedAt,
          maxTrades: parseMaxTrades(getArgValue("--max-trades")),
          isJson,
        })
        : await runSyntheticDashboard({ generatedAt, isJson });

  process.stdout.write(runResult.output);

  if (shouldWrite) {
    const paths = shouldWriteHistory
      ? [...new Set([outputPath, historyPath])]
      : [outputPath];

    for (const path of paths) {
      await writeReport(path, runResult.output);
      process.stderr.write(`Wrote decision-review calibration report: ${path}\n`);
    }

    if (shouldWriteHistory) {
      for (const fileReport of runResult.fileReports ?? []) {
        await writeReport(fileReport.reportPath, fileReport.output);
        process.stderr.write(
          `Wrote decision-review CSV report: ${fileReport.reportPath}\n`,
        );
      }
    }
  }

  if (runResult.exitCode !== 0) {
    process.exitCode = runResult.exitCode;
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
