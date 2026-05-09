import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseBrokerExecutionCsv } from "../lib/execution-sources/csv";

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

function increment(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function formatCounts(counts: Map<string, number>): string[] {
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, count]) => `- ${key}: ${count}`);
}

function formatReport(args: {
  generatedAt: string;
  rowCount: number;
  acceptedExecutionCount: number;
  rejectedRowCount: number;
  skippedRowCount: number;
  requestCount: number;
  issueCountsByCode: Record<string, number>;
  sessionCounts: Map<string, number>;
  hourCounts: Map<string, number>;
  crossSessionCounts: Record<string, number>;
}): string {
  const lines = [
    "# Session Time Real-Data Readiness Report",
    "",
    `Generated: ${args.generatedAt}`,
    "",
    "This report is public-safe by design. It contains aggregate counts only and excludes private file names, account identifiers, symbols, raw rows, and trade-level details.",
    "",
    "## Import Summary",
    "",
    `- rows parsed: ${args.rowCount}`,
    `- accepted executions: ${args.acceptedExecutionCount}`,
    `- rejected rows: ${args.rejectedRowCount}`,
    `- skipped rows: ${args.skippedRowCount}`,
    `- grouped trades: ${args.requestCount}`,
    "",
    "## Session Distribution",
    "",
    ...formatCounts(args.sessionCounts),
    "",
    "## Top Entry Hours",
    "",
    ...formatCounts(args.hourCounts).slice(0, 12),
    "",
    "## Cross-Session Holds",
    "",
    `- held pre-market into open: ${args.crossSessionCounts.heldPremarketIntoOpen}`,
    `- held open into midday: ${args.crossSessionCounts.heldOpenIntoMidday}`,
    `- held midday into post-market: ${args.crossSessionCounts.heldMiddayIntoPostmarket}`,
    `- held post-market into overnight: ${args.crossSessionCounts.heldPostmarketIntoOvernight}`,
    `- held overnight: ${args.crossSessionCounts.heldOvernight}`,
    "",
    "## Issue Counts",
    "",
    ...Object.entries(args.issueCountsByCode)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([code, count]) => `- ${code}: ${count}`),
    "",
    "## Readiness Notes",
    "",
    "- Eastern Time session/hour fields populated on real broker execution data.",
    "- The output is safe to share because it contains only aggregate counts.",
    "- Entry-session performance remains entry-attributed; held-through counts are exposure labels, not per-hour P/L allocation.",
  ];

  return `${lines.join("\n").trimEnd()}\n`;
}

async function main(): Promise<void> {
  const csvPath = resolve(requiredArg("--csv"));
  const timezone = getArgValue("--account-timezone") ?? "America/New_York";
  const outputPath = resolve(
    getArgValue("--out") ??
      "src/docs/session-time-real-data-readiness-2026-05-06.md",
  );
  const csvText = await readFile(csvPath, "utf8");
  const result = parseBrokerExecutionCsv({
    csvText,
    broker: "ibkr_activity_statement",
    timestampTimezone: timezone,
    tradeGroupingRules: {
      maxGapMinutes: 10080,
      splitAtSessionBoundary: false,
    },
  });
  const sessionCounts = new Map<string, number>();
  const hourCounts = new Map<string, number>();
  const crossSessionCounts = {
    heldPremarketIntoOpen: 0,
    heldOpenIntoMidday: 0,
    heldMiddayIntoPostmarket: 0,
    heldPostmarketIntoOvernight: 0,
    heldOvernight: 0,
  };

  for (const request of result.requests) {
    const session = request.sessionContext;

    increment(sessionCounts, String(session.entrySessionBucket ?? session.sessionBucket));
    increment(hourCounts, session.entryHourLabelEt ?? "unknown");

    if (session.heldPremarketIntoOpen) {
      crossSessionCounts.heldPremarketIntoOpen += 1;
    }

    if (session.heldOpenIntoMidday) {
      crossSessionCounts.heldOpenIntoMidday += 1;
    }

    if (session.heldMiddayIntoPostmarket) {
      crossSessionCounts.heldMiddayIntoPostmarket += 1;
    }

    if (session.heldPostmarketIntoOvernight) {
      crossSessionCounts.heldPostmarketIntoOvernight += 1;
    }

    if (session.heldOvernight) {
      crossSessionCounts.heldOvernight += 1;
    }
  }

  const report = formatReport({
    generatedAt: new Date().toISOString(),
    rowCount: result.rowCount,
    acceptedExecutionCount: result.acceptedExecutionCount,
    rejectedRowCount: result.rejectedRowCount,
    skippedRowCount: result.skippedRowCount,
    requestCount: result.requestCount,
    issueCountsByCode: Object.fromEntries(
      Object.entries(result.diagnostics.issueCountsByCode).map(([key, value]) => [
        key,
        value ?? 0,
      ]),
    ),
    sessionCounts,
    hourCounts,
    crossSessionCounts,
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, report, "utf8");
  process.stdout.write(report);
  process.stderr.write(`Wrote session time readiness report: ${outputPath}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
