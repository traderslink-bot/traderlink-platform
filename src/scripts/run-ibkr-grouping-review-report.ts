import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  parseBrokerExecutionCsv,
  type BrokerExecutionCsvTradeGroupingDiagnostic,
} from "../lib/execution-sources/csv";
import type { ProviderExecution } from "../lib/execution-sources/types/provider-execution";

interface GroupingReviewRow {
  diagnostic: BrokerExecutionCsvTradeGroupingDiagnostic;
  executions: ProviderExecution[];
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

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function numberOrZero(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function pct(part: number, total: number): string {
  if (total === 0) {
    return "0.0%";
  }

  return `${((part / total) * 100).toFixed(1)}%`;
}

function increment(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function formatCounts(counts: Map<string, number>): string[] {
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, count]) => `- ${key}: ${count}`);
}

function executionLine(execution: ProviderExecution, index: number): string {
  return [
    `${index + 1}.`,
    String(execution.timestamp),
    String(execution.side).toUpperCase(),
    numberOrZero(execution.shares),
    "@",
    numberOrZero(execution.price),
    execution.commission !== undefined ? `comm=${execution.commission}` : "",
  ]
    .filter((part) => String(part).trim() !== "")
    .join(" ");
}

function reviewRows(
  diagnostics: BrokerExecutionCsvTradeGroupingDiagnostic[],
  requests: Array<{ executions: ProviderExecution[] }>,
): GroupingReviewRow[] {
  return diagnostics
    .filter(
      (diagnostic) =>
        diagnostic.lifecycleStatus === "open" ||
        diagnostic.groupingReason !== "flat_position",
    )
    .map((diagnostic) => ({
      diagnostic,
      executions: requests[diagnostic.requestIndex]?.executions ?? [],
    }));
}

function adjacentSymbolNotes(rows: GroupingReviewRow[]): string[] {
  const bySymbol = new Map<string, GroupingReviewRow[]>();

  for (const row of rows) {
    const symbolRows = bySymbol.get(row.diagnostic.symbol) ?? [];
    symbolRows.push(row);
    bySymbol.set(row.diagnostic.symbol, symbolRows);
  }

  const notes: string[] = [];

  for (const [symbol, symbolRows] of bySymbol) {
    const sorted = [...symbolRows].sort(
      (left, right) =>
        left.diagnostic.requestIndex - right.diagnostic.requestIndex,
    );

    if (sorted.length < 2) {
      continue;
    }

    notes.push(
      `- ${symbol}: ${sorted
        .map(
          (row) =>
            `#${row.diagnostic.requestIndex} ${row.diagnostic.tradeDirection} ${row.diagnostic.lifecycleStatus}/${row.diagnostic.groupingReason} final=${row.diagnostic.finalPositionShares}`,
        )
        .join(" -> ")}`,
    );
  }

  return notes;
}

function formatReport(args: {
  generatedAt: string;
  csvPath: string;
  timezone: string;
  maxGapMinutes: number;
  splitAtSessionBoundary: boolean;
  rowCount: number;
  acceptedExecutionCount: number;
  rejectedRowCount: number;
  skippedRowCount: number;
  requestCount: number;
  rows: GroupingReviewRow[];
}): string {
  const byReason = new Map<string, number>();
  const byLifecycle = new Map<string, number>();
  const bySymbol = new Map<string, number>();
  const openRows = args.rows.filter(
    (row) => row.diagnostic.lifecycleStatus === "open",
  );
  const closedNonFlatRows = args.rows.filter(
    (row) =>
      row.diagnostic.lifecycleStatus === "closed" &&
      row.diagnostic.groupingReason !== "flat_position",
  );

  for (const row of args.rows) {
    increment(byReason, row.diagnostic.groupingReason);
    increment(byLifecycle, row.diagnostic.lifecycleStatus);
    increment(bySymbol, row.diagnostic.symbol);
  }

  const lines = [
    "# IBKR Grouping Review Report",
    "",
    `Generated: ${args.generatedAt}`,
    `CSV: ${args.csvPath}`,
    `Broker: ibkr_activity_statement`,
    `Timezone: ${args.timezone}`,
    `Grouping rules: maxGapMinutes=${args.maxGapMinutes}, splitAtSessionBoundary=${args.splitAtSessionBoundary}`,
    "",
    "## Import Summary",
    "",
    `- rows: ${args.rowCount}`,
    `- accepted stock executions: ${args.acceptedExecutionCount}`,
    `- rejected rows: ${args.rejectedRowCount}`,
    `- skipped non-execution/non-stock rows: ${args.skippedRowCount}`,
    `- grouped trade requests: ${args.requestCount}`,
    `- grouping review cases: ${args.rows.length} (${pct(args.rows.length, args.requestCount)} of grouped requests)`,
    `- open grouping cases: ${openRows.length}`,
    `- closed non-flat split cases: ${closedNonFlatRows.length}`,
    "",
    "## Review Counts",
    "",
    "By reason:",
    ...formatCounts(byReason),
    "",
    "By lifecycle:",
    ...formatCounts(byLifecycle),
    "",
    "By symbol:",
    ...formatCounts(bySymbol),
    "",
    "## Adjacent Same-Symbol Review Chains",
    "",
  ];

  const adjacentNotes = adjacentSymbolNotes(args.rows);

  if (adjacentNotes.length === 0) {
    lines.push("- none");
  } else {
    lines.push(...adjacentNotes);
  }

  lines.push("", "## Review Cases", "");

  for (const row of args.rows) {
    const diagnostic = row.diagnostic;

    lines.push(
      `### Request ${diagnostic.requestIndex}: ${diagnostic.symbol} ${diagnostic.tradeDirection}`,
      "",
      `- lifecycle: ${diagnostic.lifecycleStatus}`,
      `- grouping reason: ${diagnostic.groupingReason}`,
      `- execution count: ${diagnostic.executionCount}`,
      `- rows: ${diagnostic.rowIndexes.join(", ")}`,
      `- first timestamp: ${diagnostic.firstTimestamp}`,
      `- last timestamp: ${diagnostic.lastTimestamp}`,
      `- final position shares: ${diagnostic.finalPositionShares}`,
      `- notes: ${diagnostic.notes.join(" ") || "none"}`,
      "",
      "Executions:",
      "",
    );

    if (row.executions.length === 0) {
      lines.push("- none available");
    } else {
      for (const [index, execution] of row.executions.entries()) {
        lines.push(`- ${executionLine(execution, index)}`);
      }
    }

    lines.push("");
  }

  lines.push(
    "## Interpretation Notes",
    "",
    "- `open` cases usually mean the CSV execution sequence did not return that grouped trade to flat under the current rules.",
    "- `session_boundary_split` means the importer split adjacent executions when the session date changed.",
    "- `time_gap_split` means the importer split adjacent executions because the next execution was more than the configured gap away.",
    "- This report does not call IBKR or fetch candles. It only reads the local CSV.",
  );

  return `${lines.join("\n").trimEnd()}\n`;
}

async function main(): Promise<void> {
  const csvPath = resolve(requiredArg("--csv"));
  const timezone = getArgValue("--account-timezone") ?? "America/Toronto";
  const outputPath = resolve(
    getArgValue("--out") ??
      "artifacts/real-csv-calibration/private/ibkr-grouping-review.md",
  );
  const maxGapMinutes = Number(getArgValue("--max-gap-minutes") ?? 10080);
  const splitAtSessionBoundary = hasFlag("--split-at-session-boundary");
  const csvText = await readFile(csvPath, "utf8");
  const result = parseBrokerExecutionCsv({
    csvText,
    broker: "ibkr_activity_statement",
    timestampTimezone: timezone,
    tradeGroupingRules: {
      maxGapMinutes,
      splitAtSessionBoundary,
    },
  });
  const generatedAt = new Date().toISOString();
  const rows = reviewRows(result.groupingDiagnostics, result.requests);
  const output = formatReport({
    generatedAt,
    csvPath,
    timezone,
    maxGapMinutes,
    splitAtSessionBoundary,
    rowCount: result.rowCount,
    acceptedExecutionCount: result.acceptedExecutionCount,
    rejectedRowCount: result.rejectedRowCount,
    skippedRowCount: result.skippedRowCount,
    requestCount: result.requestCount,
    rows,
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, "utf8");
  process.stdout.write(output);
  process.stderr.write(`Wrote IBKR grouping review report: ${outputPath}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
