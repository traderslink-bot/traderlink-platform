import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sampleCreateRawTradeTimelineInput } from "../lib/raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../lib/support-resistance/__fixtures__/sample-levels-system-fetch-service";
import { readLevelsSystemRuntimeConfigFromEnv } from "../lib/support-resistance/levels-system-runtime-options";
import {
  buildTradeAnalysisDebugDashboard,
  formatTradeAnalysisDebugDashboardMarkdown,
} from "../lib/trade-analysis/debug/trade-analysis-debug-dashboard";
import { parseTradeAnalysisRequestDocument } from "../lib/trade-analysis/request/trade-analysis-request-contract";

interface CliArgs {
  inputPath?: string;
  jsonOutput: boolean;
  validateOnly: boolean;
  outDir?: string;
}

function parseCliArgs(argv: string[]): CliArgs {
  const parsed: CliArgs = {
    jsonOutput: false,
    validateOnly: false,
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

function buildSampleRequest(): unknown {
  return {
    symbol: sampleCreateRawTradeTimelineInput.symbol,
    tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
    executions: sampleCreateRawTradeTimelineInput.executions,
    sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
    provider: {
      preferredProvider: "stub",
    },
    tradeWindow: {
      timeframe: "1m",
      preTradeMinutes: 60,
      postTradeMinutes: 60,
    },
  };
}

async function loadRequests(args: CliArgs): Promise<{
  source: string;
  requests: unknown[];
  levelsSystem?: ReturnType<typeof buildSampleLevelsSystemSupportResistanceOptions>;
}> {
  if (!args.inputPath) {
    return {
      source: "sample fixture",
      requests: [buildSampleRequest()],
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    };
  }

  const filePath = resolve(args.inputPath);
  const raw = await readFile(filePath, "utf8");
  const parsed = parseTradeAnalysisRequestDocument(JSON.parse(raw));

  return {
    source: filePath,
    requests: parsed.requests,
    levelsSystem: readLevelsSystemRuntimeConfigFromEnv(),
  };
}

function printDashboardSummary(
  dashboard: Awaited<ReturnType<typeof buildTradeAnalysisDebugDashboard>>,
): void {
  console.log("========================================");
  console.log("TRADE ANALYSIS DEBUG DASHBOARD");
  console.log("========================================");
  console.log(`Source: ${dashboard.source}`);
  console.log(`Generated: ${dashboard.generatedAt}`);
  console.log(`Validate only: ${dashboard.validateOnly}`);
  console.log(`Requests: ${dashboard.requestCount}`);
  console.log(`Completed: ${dashboard.completedCount}`);
  console.log(`Failed: ${dashboard.failedCount}`);

  for (const item of dashboard.items) {
    console.log("");
    console.log(`[${item.requestIndex}] ${item.symbol ?? "unknown"} ${item.status}`);

    if (item.validation.issues.length > 0) {
      console.log(
        `  validation issues: ${item.validation.issues
          .map((issue) => `${issue.severity}:${issue.code}`)
          .join(", ")}`,
      );
    }

    if (item.failure) {
      console.log(
        `  failure: ${item.failure.code} (${item.failure.source}) - ${item.failure.title}`,
      );
    }

    if (item.summary) {
      console.log(
        `  levels: support ${item.summary.supportResistance.supportCount}, resistance ${item.summary.supportResistance.resistanceCount}`,
      );
      console.log(
        `  market structure: ${
          item.summary.marketStructure.observed
            ? `${item.summary.marketStructure.state} / ${item.summary.marketStructure.trendDirection} / ${item.summary.marketStructure.confidenceLabel}`
            : "missing"
        }`,
      );
      console.log(
        `  patterns: detected ${item.summary.patterns.detectedCount}, normalized ${item.summary.patterns.normalizedCount}`,
      );
      console.log(
        `  coaching: ${item.summary.decisionReview.coaching.fixFirstBehaviorId ?? "none"} / ${item.summary.decisionReview.coaching.headline}`,
      );
      const topInsight = item.summary.decisionReview.insights[0];

      if (topInsight) {
        console.log(
          `  top insight: ${topInsight.tone}/${topInsight.category} - ${topInsight.title}`,
        );
      }
    }
  }
}

async function writeDashboardArtifacts(args: {
  dashboard: Awaited<ReturnType<typeof buildTradeAnalysisDebugDashboard>>;
  outDir: string;
}): Promise<void> {
  const outDir = resolve(args.outDir);
  const jsonPath = `${outDir}\\trade-analysis-debug-dashboard.json`;
  const markdownPath = `${outDir}\\trade-analysis-debug-dashboard.md`;

  await mkdir(outDir, { recursive: true });
  await writeFile(
    jsonPath,
    JSON.stringify(args.dashboard, null, 2),
    "utf8",
  );
  await writeFile(
    markdownPath,
    formatTradeAnalysisDebugDashboardMarkdown(args.dashboard),
    "utf8",
  );

  console.log("");
  console.log("Debug artifacts written:");
  console.log(`  ${jsonPath}`);
  console.log(`  ${markdownPath}`);
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const loaded = await loadRequests(args);
  const dashboard = await buildTradeAnalysisDebugDashboard({
    source: loaded.source,
    requests: loaded.requests,
    levelsSystem: loaded.levelsSystem,
    validateOnly: args.validateOnly,
  });

  if (args.jsonOutput) {
    console.log(JSON.stringify(dashboard, null, 2));
  } else {
    printDashboardSummary(dashboard);
  }

  if (args.outDir) {
    await writeDashboardArtifacts({
      dashboard,
      outDir: args.outDir,
    });
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Trade-analysis debug failed: ${message}`);
  process.exitCode = 1;
});
