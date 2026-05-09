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

type Timeframe = "daily" | "4h";

type Group = {
  symbol: string;
  sessionDate: string;
  requestIndexes: number[];
  selectedIndexes: number[];
  tradeStartTimestamp: number;
  tradeEndTimestamp: number;
  asOfTimestamp: number;
};

const LOOKBACK_BARS: Record<Timeframe, number> = {
  daily: 520,
  "4h": 180,
};

const INTERVAL_MS: Record<Timeframe, number> = {
  daily: 24 * 60 * 60_000,
  "4h": 4 * 60 * 60_000,
};

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

function resolveAsOfTimestamp(request: UserTradeAnalysisRequest): number {
  if (request.provider?.asOfTimestamp !== undefined && request.provider.asOfTimestamp !== null) {
    return parseTimestamp(request.provider.asOfTimestamp, `${request.symbol} provider.asOfTimestamp`);
  }

  const timestamps = executionTimestamps(request);
  const tradeEndTimestamp = timestamps.at(-1);
  if (tradeEndTimestamp === undefined) {
    throw new Error(`${request.symbol} has no execution timestamps.`);
  }

  const postTradeMinutes = request.tradeWindow?.postTradeMinutes ?? 60;
  const paddingMinutes = request.tradeWindow?.paddingMinutes ?? 5;
  return tradeEndTimestamp + (postTradeMinutes + paddingMinutes) * 60_000;
}

function isDaily4hFailure(message: string): boolean {
  return /daily and 4h candles are required/.test(message);
}

function buildPriorityReport(args: {
  generatedAt: string;
  sourceCalibrationReportPath: string;
  groups: Group[];
}) {
  const tasks = args.groups.flatMap((group) =>
    (["daily", "4h"] as const).map((timeframe) => {
      const lookbackBars = LOOKBACK_BARS[timeframe];
      return {
        provider: "ibkr" as const,
        symbol: group.symbol,
        sessionDate: group.sessionDate,
        timeframe,
        priority: "fetch_first" as const,
        score: timeframe === "daily" ? 1_215 : 1_195,
        reasons: [
          `trade-analysis failed because IBKR warehouse ${timeframe} candles were unavailable`,
          `${lookbackBars} ${timeframe} candle lookback needed for support/resistance context`,
          `source request indexes ${group.requestIndexes.join(", ")}`,
        ],
        startTimestamp: group.asOfTimestamp - lookbackBars * INTERVAL_MS[timeframe],
        endTimestamp: group.asOfTimestamp,
        estimatedCandleCount: lookbackBars,
        missingCandleCountEstimate: lookbackBars,
        likelyNoBarMissingCandleCountEstimate: 0,
        storedCandles: 0,
        tradeRequestCount: group.requestIndexes.length,
      };
    }),
  );
  const rankedTasks = tasks.sort(
    (left, right) =>
      right.score - left.score ||
      left.symbol.localeCompare(right.symbol) ||
      left.sessionDate.localeCompare(right.sessionDate) ||
      left.timeframe.localeCompare(right.timeframe),
  );
  const stageSize = 20;
  const providerStages = Array.from(
    { length: Math.ceil(rankedTasks.length / stageSize) },
    (_, index) => {
      const stageTasks = rankedTasks.slice(index * stageSize, (index + 1) * stageSize);
      return {
        stageIndex: index + 1,
        priority: "fetch_first" as const,
        taskCount: stageTasks.length,
        estimatedCandleCount: stageTasks.reduce((sum, task) => sum + task.estimatedCandleCount, 0),
        symbols: [...new Set(stageTasks.map((task) => task.symbol))].sort(),
        timeframes: [...new Set(stageTasks.map((task) => task.timeframe))].sort(),
        tasks: stageTasks,
      };
    },
  );

  return {
    generatedAt: args.generatedAt,
    sourceAuditPath: args.sourceCalibrationReportPath,
    sourceAuditPaths: [args.sourceCalibrationReportPath],
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
      unprovenQuietSymbols: new Set(args.groups.map((group) => group.symbol)).size,
      postNoiseBudgetSymbols: 0,
      supportResistanceWatchSymbols: 0,
      supportResistanceBrokenSymbols: 0,
      supportResistanceUnprovenSymbols: new Set(args.groups.map((group) => group.symbol)).size,
    },
    rankedTasks,
    priorityBySymbolSession: args.groups.map((group) => ({
      symbol: group.symbol,
      sessionDate: group.sessionDate,
      priority: "fetch_first" as const,
      score: 1_215,
      missingTimeframes: ["daily", "4h"] as const,
      taskCount: 2,
      estimatedMissingCandles: LOOKBACK_BARS.daily + LOOKBACK_BARS["4h"],
      likelyNoBarMissingCandles: 0,
      reasons: [
        `daily/4h support-resistance context needed for ${group.requestIndexes.length} imported trade request(s)`,
      ],
    })),
    providerStages,
  };
}

function formatMarkdown(manifest: {
  generatedAt: string;
  provider: string;
  totals: {
    requestedTradeCount: number;
    analyzableTradeCount: number;
    failedTradeCount: number;
    symbolSessionCount: number;
    taskCount: number;
    symbolCount: number;
    estimatedCandles: number;
  };
  groups: Array<{
    symbol: string;
    sessionDate: string;
    requestIndexes: number[];
    asOfTimestamp: string;
  }>;
}): string {
  const lines = [
    "# IBKR Daily/4h Warehouse Backfill Manifest",
    "",
    `Generated: ${manifest.generatedAt}`,
    `Provider: ${manifest.provider}`,
    "Timeframes: daily, 4h",
    "",
    "## Totals",
    "",
    `- requested trades: ${manifest.totals.requestedTradeCount}`,
    `- analyzable trades: ${manifest.totals.analyzableTradeCount}`,
    `- failed trades needing daily/4h: ${manifest.totals.failedTradeCount}`,
    `- symbol/session groups: ${manifest.totals.symbolSessionCount}`,
    `- backfill tasks: ${manifest.totals.taskCount}`,
    `- symbols: ${manifest.totals.symbolCount}`,
    `- estimated candles: ${manifest.totals.estimatedCandles}`,
    "",
    "## Groups",
    "",
    "| Symbol | Session | Requests | As Of |",
    "| --- | --- | ---: | --- |",
    ...manifest.groups.map(
      (group) =>
        `| ${group.symbol} | ${group.sessionDate} | ${group.requestIndexes.join(", ")} | ${group.asOfTimestamp} |`,
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
  const maxTrades = Number(getArgValue("--max-trades") ?? report.result?.analyzableTradeCount ?? 100);
  const csvText = await readFile(csvPath, "utf8");
  const experience = buildCsvDryRunImportExperience({ csvText, broker, accountTimezone });
  const indexedRequests = experience.preview.importResult.requests.map((request, requestIndex) => ({
    request,
    requestIndex,
    diagnostic: experience.preview.importResult.groupingDiagnostics.find(
      (item) => item.requestIndex === requestIndex,
    ),
  }));
  const selectedRequests = indexedRequests
    .filter((item) => item.diagnostic?.lifecycleStatus !== "open")
    .slice(0, maxTrades);
  const requestByOriginalIndex = new Map(
    selectedRequests.map((item, selectedIndex) => [item.requestIndex, { ...item, selectedIndex }]),
  );
  const failedDiagnostics =
    report.result?.diagnostics?.filter(
      (diagnostic) =>
        (diagnostic.code === "analysis_failed" || diagnostic.code === "market_context_unavailable") &&
        diagnostic.requestIndex !== null &&
        isDaily4hFailure(diagnostic.message),
    ) ?? [];
  const groupsByKey = new Map<string, Group>();

  for (const diagnostic of failedDiagnostics) {
    const selected = requestByOriginalIndex.get(diagnostic.requestIndex!);
    if (!selected) {
      throw new Error(
        `Calibration diagnostic requestIndex ${diagnostic.requestIndex} was not found in the selected closed requests.`,
      );
    }

    const request = selected.request;
    const timestamps = executionTimestamps(request);
    const symbol = request.symbol.trim().toUpperCase();
    const sessionDate = request.sessionContext.sessionDate;
    const key = `${symbol}:${sessionDate}`;
    const existing = groupsByKey.get(key);

    groupsByKey.set(key, {
      symbol,
      sessionDate,
      requestIndexes: [...(existing?.requestIndexes ?? []), diagnostic.requestIndex!],
      selectedIndexes: [...(existing?.selectedIndexes ?? []), selected.selectedIndex],
      tradeStartTimestamp: Math.min(existing?.tradeStartTimestamp ?? Number.POSITIVE_INFINITY, timestamps[0]!),
      tradeEndTimestamp: Math.max(existing?.tradeEndTimestamp ?? Number.NEGATIVE_INFINITY, timestamps.at(-1)!),
      asOfTimestamp: Math.max(existing?.asOfTimestamp ?? Number.NEGATIVE_INFINITY, resolveAsOfTimestamp(request)),
    });
  }

  const groups = [...groupsByKey.values()].sort(
    (left, right) => left.symbol.localeCompare(right.symbol) || left.sessionDate.localeCompare(right.sessionDate),
  );
  const priorityReport = buildPriorityReport({
    generatedAt,
    sourceCalibrationReportPath: reportPath,
    groups,
  });
  const manifest = {
    contractVersion: "ibkr_warehouse_daily_4h_backfill_manifest_v1" as const,
    generatedAt,
    sourceCalibrationReportPath: reportPath,
    broker,
    accountTimezone,
    provider: "ibkr" as const,
    timeframes: ["daily", "4h"] as const,
    totals: {
      requestedTradeCount: experience.preview.importResult.requestCount,
      analyzableTradeCount: selectedRequests.length,
      failedTradeCount: failedDiagnostics.length,
      symbolSessionCount: groups.length,
      taskCount: priorityReport.rankedTasks.length,
      symbolCount: new Set(groups.map((group) => group.symbol)).size,
      estimatedCandles: priorityReport.totals.estimatedMissingCandles,
    },
    groups: groups.map((group) => ({
      symbol: group.symbol,
      sessionDate: group.sessionDate,
      requestIndexes: group.requestIndexes,
      selectedIndexes: group.selectedIndexes,
      tradeStartTimestamp: new Date(group.tradeStartTimestamp).toISOString(),
      tradeEndTimestamp: new Date(group.tradeEndTimestamp).toISOString(),
      asOfTimestamp: new Date(group.asOfTimestamp).toISOString(),
    })),
    tasks: priorityReport.rankedTasks,
  };
  const outPath = resolve(
    getArgValue("--out") ??
      "artifacts/real-csv-calibration/private/ibkr-daily-4h-backfill-manifest.json",
  );
  const markdownPath = resolve(getArgValue("--markdown-out") ?? outPath.replace(/\.json$/i, ".md"));
  const priorityReportPath = getArgValue("--priority-report-out");

  await writeJson(outPath, manifest);
  await mkdir(dirname(markdownPath), { recursive: true });
  await writeFile(markdownPath, formatMarkdown(manifest), "utf8");

  if (priorityReportPath) {
    await writeJson(priorityReportPath, priorityReport);
  }

  process.stdout.write(formatMarkdown(manifest));
  process.stderr.write(`Wrote IBKR daily/4h warehouse backfill manifest: ${outPath}\n`);
  process.stderr.write(`Wrote IBKR daily/4h warehouse backfill manifest markdown: ${markdownPath}\n`);
  if (priorityReportPath) {
    process.stderr.write(`Wrote levels-system priority report: ${resolve(priorityReportPath)}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(error instanceof Error ? `${error.message}\n` : `${String(error)}\n`);
  process.exitCode = 1;
});
