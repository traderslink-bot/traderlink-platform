import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  compareTradeAnalysisDebugDashboards,
  formatTradeAnalysisDebugDashboardComparisonMarkdown,
} from "../lib/trade-analysis/debug/compare-trade-analysis-debug-dashboards";
import type { TradeAnalysisDebugDashboard } from "../lib/trade-analysis/debug/trade-analysis-debug-dashboard";

interface CliArgs {
  leftPath: string;
  rightPath: string;
  jsonOutput: boolean;
}

function parseCliArgs(argv: string[]): CliArgs {
  const positional: string[] = [];
  let jsonOutput = false;

  for (const arg of argv) {
    if (arg === "--json") {
      jsonOutput = true;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    positional.push(arg);
  }

  if (positional.length !== 2) {
    throw new Error(
      "Usage: npm run compare:trade-debug -- <left-dashboard.json> <right-dashboard.json> [--json]",
    );
  }

  return {
    leftPath: positional[0],
    rightPath: positional[1],
    jsonOutput,
  };
}

async function readDashboard(path: string): Promise<TradeAnalysisDebugDashboard> {
  const filePath = resolve(path);
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as TradeAnalysisDebugDashboard;

  if (parsed.contractVersion !== "trade_analysis_debug_dashboard_v1") {
    throw new Error(`${filePath} is not a trade-analysis debug dashboard.`);
  }

  return {
    ...parsed,
    source: parsed.source || filePath,
  };
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const [left, right] = await Promise.all([
    readDashboard(args.leftPath),
    readDashboard(args.rightPath),
  ]);
  const comparison = compareTradeAnalysisDebugDashboards({
    left,
    right,
  });

  if (args.jsonOutput) {
    console.log(JSON.stringify(comparison, null, 2));
  } else {
    console.log(formatTradeAnalysisDebugDashboardComparisonMarkdown(comparison));
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Trade-analysis debug comparison failed: ${message}`);
  process.exitCode = 1;
});
