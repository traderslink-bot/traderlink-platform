import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { BrokerExecutionCsvFormat } from "../lib/execution-sources/csv";
import { buildCsvDryRunImportExperience } from "../lib/trader-analytics/product/csv-dry-run-workflow";
import type { UserTradeAnalysisRequest } from "../lib/trade-analysis/request/trade-analysis-request-contract";

type CalibrationReport = {
  generatedAt?: string;
  csvPath?: string;
  broker?: BrokerExecutionCsvFormat;
  result?: {
    analyzableTradeCount?: number;
    diagnostics?: Array<{
      requestIndex: number | null;
      symbol: string | null;
      code: string;
      message: string;
    }>;
  };
};

type BackfillManifestTask = {
  provider: "ibkr";
  symbol: string;
  requestIndex: number;
  selectedIndex: number;
  sessionDate: string;
  timeframe: "5m";
  tradeStartTimestamp: string;
  tradeEndTimestamp: string;
  asOfTimestamp: string;
  expectedCandles: number;
  startTimestamp: number;
  endTimestamp: number;
  lookbackBars: number;
  failureMessage: string;
};

type BackfillManifest = {
  contractVersion: "ibkr_warehouse_backfill_manifest_v1";
  generatedAt: string;
  sourceCalibrationReportPath: string;
  broker: BrokerExecutionCsvFormat;
  accountTimezone: string;
  provider: "ibkr";
  timeframe: "5m";
  totals: {
    requestedTradeCount: number;
    analyzableTradeCount: number;
    failedTradeCount: number;
    taskCount: number;
    symbolCount: number;
    expectedCandles: number;
  };
  tasks: BackfillManifestTask[];
  symbols: Array<{
    symbol: string;
    taskCount: number;
    expectedCandles: number;
  }>;
};

type PriorityTask = {
  provider: "ibkr";
  symbol: string;
  sessionDate: string;
  timeframe: "5m";
  priority: "fetch_first";
  score: number;
  reasons: string[];
  startTimestamp: number;
  endTimestamp: number;
  estimatedCandleCount: number;
  missingCandleCountEstimate: number;
  likelyNoBarMissingCandleCountEstimate: number;
  storedCandles: number;
  tradeRequestCount: number;
};

const DEFAULT_POST_TRADE_MINUTES = 60;
const DEFAULT_PADDING_MINUTES = 5;
const FIVE_MINUTES_MS = 5 * 60_000;

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

function parseBroker(value: string | undefined): BrokerExecutionCsvFormat {
  if (!value || value.trim() === "") {
    throw new Error("--broker is required when the calibration report does not include a broker.");
  }

  return value.trim() as BrokerExecutionCsvFormat;
}

function parseCalibrationFailure(message: string): {
  timeframe: "5m";
  expectedCandles: number;
} | null {
  const match = message.match(
    /Durable candle warehouse miss for .+ (5m); found \d+\/(\d+) candles\./,
  );

  if (!match) {
    return null;
  }

  return {
    timeframe: match[1] as "5m",
    expectedCandles: Number(match[2]),
  };
}

function parseTimestamp(value: unknown, context: string): number {
  const parsed =
    value instanceof Date
      ? value.getTime()
      : typeof value === "number"
        ? value
        : Date.parse(String(value));

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${context} timestamp: ${String(value)}`);
  }

  return parsed;
}

function executionTimestamps(request: UserTradeAnalysisRequest): number[] {
  return request.executions
    .map((execution, index) =>
      parseTimestamp(execution.timestamp, `${request.symbol} execution ${index}`),
    )
    .sort((left, right) => left - right);
}

function resolveAsOfTimestamp(request: UserTradeAnalysisRequest): string {
  if (request.provider?.asOfTimestamp !== undefined && request.provider.asOfTimestamp !== null) {
    return new Date(
      parseTimestamp(request.provider.asOfTimestamp, `${request.symbol} provider.asOfTimestamp`),
    ).toISOString();
  }

  const timestamps = executionTimestamps(request);
  const tradeEndTimestamp = timestamps.at(-1);

  if (tradeEndTimestamp === undefined) {
    throw new Error(`${request.symbol} has no execution timestamps.`);
  }

  const postTradeMinutes =
    request.tradeWindow?.postTradeMinutes ?? DEFAULT_POST_TRADE_MINUTES;
  const paddingMinutes =
    request.tradeWindow?.paddingMinutes ?? DEFAULT_PADDING_MINUTES;

  return new Date(
    tradeEndTimestamp + (postTradeMinutes + paddingMinutes) * 60_000,
  ).toISOString();
}

function taskRange(args: {
  asOfTimestamp: string;
  expectedCandles: number;
}): { startTimestamp: number; endTimestamp: number; lookbackBars: number } {
  const endTimestamp = parseTimestamp(args.asOfTimestamp, "as-of");
  const lookbackBars = Math.max(1, args.expectedCandles);

  return {
    endTimestamp,
    startTimestamp: endTimestamp - lookbackBars * FIVE_MINUTES_MS,
    lookbackBars,
  };
}

function summarizeSymbols(tasks: BackfillManifestTask[]): BackfillManifest["symbols"] {
  const bySymbol = new Map<string, { taskCount: number; expectedCandles: number }>();

  for (const task of tasks) {
    const existing = bySymbol.get(task.symbol) ?? {
      taskCount: 0,
      expectedCandles: 0,
    };
    existing.taskCount += 1;
    existing.expectedCandles += task.expectedCandles;
    bySymbol.set(task.symbol, existing);
  }

  return [...bySymbol.entries()]
    .map(([symbol, summary]) => ({ symbol, ...summary }))
    .sort(
      (left, right) =>
        right.expectedCandles - left.expectedCandles ||
        right.taskCount - left.taskCount ||
        left.symbol.localeCompare(right.symbol),
    );
}

function buildPriorityTasks(manifest: BackfillManifest): PriorityTask[] {
  return manifest.tasks
    .map((task) => ({
      provider: "ibkr" as const,
      symbol: task.symbol,
      sessionDate: task.sessionDate,
      timeframe: "5m" as const,
      priority: "fetch_first" as const,
      score: 1_000 + Math.min(250, task.expectedCandles),
      reasons: [
        "trade-analysis failed because IBKR warehouse 5m candles were unavailable",
        `${task.expectedCandles} expected 5m candle(s) for the imported trade window`,
        `source request index ${task.requestIndex}`,
      ],
      startTimestamp: task.startTimestamp,
      endTimestamp: task.endTimestamp,
      estimatedCandleCount: task.expectedCandles,
      missingCandleCountEstimate: task.expectedCandles,
      likelyNoBarMissingCandleCountEstimate: 0,
      storedCandles: 0,
      tradeRequestCount: 1,
    }))
    .sort(
      (left, right) =>
        right.missingCandleCountEstimate - left.missingCandleCountEstimate ||
        left.symbol.localeCompare(right.symbol) ||
        left.sessionDate.localeCompare(right.sessionDate),
    );
}

function buildPriorityReport(manifest: BackfillManifest) {
  const rankedTasks = buildPriorityTasks(manifest);
  const stageSize = 20;
  const providerStages = Array.from(
    { length: Math.ceil(rankedTasks.length / stageSize) },
    (_, index) => {
      const tasks = rankedTasks.slice(index * stageSize, (index + 1) * stageSize);

      return {
        stageIndex: index + 1,
        priority: "fetch_first" as const,
        taskCount: tasks.length,
        estimatedCandleCount: tasks.reduce(
          (sum, task) => sum + task.estimatedCandleCount,
          0,
        ),
        symbols: [...new Set(tasks.map((task) => task.symbol))].sort(),
        timeframes: ["5m" as const],
        tasks,
      };
    },
  );
  const priorityBySymbolSession = manifest.symbols.map((symbol) => ({
    symbol: symbol.symbol,
    sessionDate: "mixed",
    priority: "fetch_first" as const,
    score: 1_000,
    missingTimeframes: ["5m" as const],
    taskCount: symbol.taskCount,
    estimatedMissingCandles: symbol.expectedCandles,
    likelyNoBarMissingCandles: 0,
    reasons: ["IBKR warehouse backfill needed for imported trade analysis"],
  }));

  return {
    generatedAt: manifest.generatedAt,
    sourceAuditPath: manifest.sourceCalibrationReportPath,
    sourceAuditPaths: [manifest.sourceCalibrationReportPath],
    warehouseDirectoryPath: "data/candles",
    cacheDirectoryPath: ".validation-cache/candles",
    provider: "ibkr" as const,
    totals: {
      missingTasks: rankedTasks.length,
      fetchFirstTasks: rankedTasks.length,
      fetchNextTasks: 0,
      fetchLaterTasks: 0,
      estimatedMissingCandles: rankedTasks.reduce(
        (sum, task) => sum + task.missingCandleCountEstimate,
        0,
      ),
      likelyNoBarMissingCandles: 0,
      priorityStages: providerStages.length,
      quietMayHideSymbols: 0,
      runtimeSilenceSymbols: 0,
      unprovenQuietSymbols: manifest.totals.symbolCount,
      postNoiseBudgetSymbols: 0,
      supportResistanceWatchSymbols: 0,
      supportResistanceBrokenSymbols: 0,
      supportResistanceUnprovenSymbols: manifest.totals.symbolCount,
    },
    rankedTasks,
    priorityBySymbolSession,
    providerStages,
  };
}

function formatManifestMarkdown(manifest: BackfillManifest): string {
  const lines = [
    "# IBKR Warehouse Backfill Manifest",
    "",
    `Generated: ${manifest.generatedAt}`,
    `Provider: ${manifest.provider}`,
    `Timeframe: ${manifest.timeframe}`,
    "",
    "## Totals",
    "",
    `- requested trades: ${manifest.totals.requestedTradeCount}`,
    `- analyzable trades: ${manifest.totals.analyzableTradeCount}`,
    `- failed trades: ${manifest.totals.failedTradeCount}`,
    `- backfill tasks: ${manifest.totals.taskCount}`,
    `- symbols: ${manifest.totals.symbolCount}`,
    `- expected 5m candles: ${manifest.totals.expectedCandles}`,
    "",
    "## Symbols",
    "",
    "| Symbol | Tasks | Expected 5m Candles |",
    "| --- | ---: | ---: |",
    ...manifest.symbols.map(
      (symbol) =>
        `| ${symbol.symbol} | ${symbol.taskCount} | ${symbol.expectedCandles} |`,
    ),
    "",
    "## Tasks",
    "",
    "| Request | Symbol | Session | Trade Window | As Of | Expected 5m Candles |",
    "| ---: | --- | --- | --- | --- | ---: |",
    ...manifest.tasks.slice(0, 120).map(
      (task) =>
        `| ${task.requestIndex} | ${task.symbol} | ${task.sessionDate} | ${task.tradeStartTimestamp} to ${task.tradeEndTimestamp} | ${task.asOfTimestamp} | ${task.expectedCandles} |`,
    ),
  ];

  return `${lines.join("\n")}\n`;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(resolve(path)), { recursive: true });
  await writeFile(resolve(path), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  const reportPath = resolve(requiredArg("--calibration-report"));
  const report = JSON.parse(await readFile(reportPath, "utf8")) as CalibrationReport;
  const csvPath = resolve(getArgValue("--csv") ?? report.csvPath ?? "");

  if (!csvPath) {
    throw new Error("--csv is required when the calibration report does not include csvPath.");
  }

  const broker = parseBroker(getArgValue("--broker") ?? report.broker);
  const accountTimezone = getArgValue("--account-timezone") ?? "America/Toronto";
  const generatedAt = getArgValue("--generated-at") ?? new Date().toISOString();
  const maxTrades =
    Number(getArgValue("--max-trades") ?? report.result?.analyzableTradeCount ?? 100);
  const csvText = await readFile(csvPath, "utf8");
  const experience = buildCsvDryRunImportExperience({
    csvText,
    broker,
    accountTimezone,
  });
  const indexedRequests = experience.preview.importResult.requests.map(
    (request, requestIndex) => ({
      request,
      requestIndex,
      diagnostic: experience.preview.importResult.groupingDiagnostics.find(
        (item) => item.requestIndex === requestIndex,
      ),
    }),
  );
  const selectedRequests = indexedRequests
    .filter((item) => item.diagnostic?.lifecycleStatus !== "open")
    .slice(0, maxTrades);
  const requestByOriginalIndex = new Map(
    selectedRequests.map((item, selectedIndex) => [
      item.requestIndex,
      { ...item, selectedIndex },
    ]),
  );
  const failedDiagnostics =
    report.result?.diagnostics?.filter(
      (diagnostic) =>
        diagnostic.code === "analysis_failed" &&
        diagnostic.requestIndex !== null &&
        parseCalibrationFailure(diagnostic.message),
    ) ?? [];
  const tasks: BackfillManifestTask[] = failedDiagnostics.map((diagnostic) => {
    const selected = requestByOriginalIndex.get(diagnostic.requestIndex!);

    if (!selected) {
      throw new Error(
        `Calibration diagnostic requestIndex ${diagnostic.requestIndex} was not found in the selected closed requests.`,
      );
    }

    const failure = parseCalibrationFailure(diagnostic.message)!;
    const timestamps = executionTimestamps(selected.request);
    const tradeStartTimestamp = new Date(timestamps[0]!).toISOString();
    const tradeEndTimestamp = new Date(timestamps.at(-1)!).toISOString();
    const asOfTimestamp = resolveAsOfTimestamp(selected.request);
    const range = taskRange({
      asOfTimestamp,
      expectedCandles: failure.expectedCandles,
    });

    return {
      provider: "ibkr",
      symbol: selected.request.symbol.trim().toUpperCase(),
      requestIndex: selected.requestIndex,
      selectedIndex: selected.selectedIndex,
      sessionDate: selected.request.sessionContext.sessionDate,
      timeframe: failure.timeframe,
      tradeStartTimestamp,
      tradeEndTimestamp,
      asOfTimestamp,
      expectedCandles: failure.expectedCandles,
      startTimestamp: range.startTimestamp,
      endTimestamp: range.endTimestamp,
      lookbackBars: range.lookbackBars,
      failureMessage: diagnostic.message,
    };
  });
  const symbols = summarizeSymbols(tasks);
  const manifest: BackfillManifest = {
    contractVersion: "ibkr_warehouse_backfill_manifest_v1",
    generatedAt,
    sourceCalibrationReportPath: reportPath,
    broker,
    accountTimezone,
    provider: "ibkr",
    timeframe: "5m",
    totals: {
      requestedTradeCount: experience.preview.importResult.requestCount,
      analyzableTradeCount: selectedRequests.length,
      failedTradeCount: failedDiagnostics.length,
      taskCount: tasks.length,
      symbolCount: symbols.length,
      expectedCandles: tasks.reduce((sum, task) => sum + task.expectedCandles, 0),
    },
    tasks,
    symbols,
  };
  const outPath = resolve(
    getArgValue("--out") ??
      "artifacts/real-csv-calibration/private/ibkr-warehouse-backfill-manifest.json",
  );
  const markdownPath = resolve(
    getArgValue("--markdown-out") ?? outPath.replace(/\.json$/i, ".md"),
  );
  const priorityReportPath = getArgValue("--priority-report-out");

  await writeJson(outPath, manifest);
  await mkdir(dirname(markdownPath), { recursive: true });
  await writeFile(markdownPath, formatManifestMarkdown(manifest), "utf8");

  if (priorityReportPath) {
    await writeJson(priorityReportPath, buildPriorityReport(manifest));
  }

  process.stdout.write(formatManifestMarkdown(manifest));
  process.stderr.write(`Wrote IBKR warehouse backfill manifest: ${outPath}\n`);
  process.stderr.write(`Wrote IBKR warehouse backfill manifest markdown: ${markdownPath}\n`);
  if (priorityReportPath) {
    process.stderr.write(`Wrote levels-system priority report: ${resolve(priorityReportPath)}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(error instanceof Error ? `${error.message}\n` : `${String(error)}\n`);
  process.exitCode = 1;
});
