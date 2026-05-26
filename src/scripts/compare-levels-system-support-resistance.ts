// Compares the legacy local support/resistance path with the shared
// levels-system path on the canonical sample trade.

import { analyzeTrade, analyzeTradeWithLevelsSystem } from "../lib/trade-analysis-engine";
import { sampleCreateRawTradeTimelineInput } from "../lib/raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../lib/support-resistance/__fixtures__/sample-levels-system-fetch-service";
import { buildLevelsSystemAnalysisComparison } from "../lib/support-resistance/comparison/build-levels-system-analysis-comparison";

function formatValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  return JSON.stringify(value);
}

function printIdSection(title: string, ids: string[]): void {
  console.log("");
  console.log(title);

  if (ids.length === 0) {
    console.log("  (none)");
    return;
  }

  for (const id of ids) {
    console.log(`  - ${id}`);
  }
}

async function main(): Promise<void> {
  const local = analyzeTrade(sampleCreateRawTradeTimelineInput);
  const shared = await analyzeTradeWithLevelsSystem(
    sampleCreateRawTradeTimelineInput,
    buildSampleLevelsSystemSupportResistanceOptions(),
  );
  const comparison = buildLevelsSystemAnalysisComparison({ local, shared });

  console.log("=================================");
  console.log("LEVELS-SYSTEM SUPPORT/RESISTANCE COMPARISON");
  console.log("=================================");
  console.log(`Symbol: ${local.patternInput.symbol}`);
  console.log(`Trade direction: ${local.patternInput.tradeDirection}`);
  console.log("");
  console.log("Level counts:");
  console.log(
    `  local support/resistance: ${comparison.levelCounts.localSupportLevels}/${comparison.levelCounts.localResistanceLevels}`,
  );
  console.log(
    `  shared support/resistance: ${comparison.levelCounts.sharedSupportLevels}/${comparison.levelCounts.sharedResistanceLevels}`,
  );
  console.log("");
  console.log("Dynamic levels:");
  console.log(`  local:  ${formatValue(comparison.dynamicLevels.local)}`);
  console.log(`  shared: ${formatValue(comparison.dynamicLevels.shared)}`);
  console.log("");
  console.log("Experimental market structure:");
  console.log(
    `  local:  ${formatValue(
      comparison.experimentalMarketStructure.local
        ? {
            state: comparison.experimentalMarketStructure.local.state,
            trend: comparison.experimentalMarketStructure.local.trend.direction,
            confidence:
              comparison.experimentalMarketStructure.local.confidence.label,
            traderLine:
              comparison.experimentalMarketStructure.local.traderLine ?? null,
          }
        : null,
    )}`,
  );
  console.log(
    `  shared: ${formatValue(
      comparison.experimentalMarketStructure.shared
        ? {
            state: comparison.experimentalMarketStructure.shared.state,
            trend: comparison.experimentalMarketStructure.shared.trend.direction,
            confidence:
              comparison.experimentalMarketStructure.shared.confidence.label,
            traderLine:
              comparison.experimentalMarketStructure.shared.traderLine ?? null,
          }
        : null,
    )}`,
  );
  console.log("");
  console.log("Changed PatternInput support/resistance fields:");

  if (comparison.changedSupportResistanceFields.length === 0) {
    console.log("  (none)");
  } else {
    for (const field of comparison.changedSupportResistanceFields) {
      console.log(
        `  - ${field.field}: ${formatValue(field.localValue)} -> ${formatValue(field.sharedValue)}`,
      );
    }
  }

  printIdSection(
    "Detected patterns added by shared engine:",
    comparison.detectedPatternIds.addedIds,
  );
  printIdSection(
    "Detected patterns removed by shared engine:",
    comparison.detectedPatternIds.removedIds,
  );
  printIdSection(
    "Normalized patterns added by shared engine:",
    comparison.normalizedPatternIds.addedIds,
  );
  printIdSection(
    "Normalized patterns removed by shared engine:",
    comparison.normalizedPatternIds.removedIds,
  );
}

void main();
