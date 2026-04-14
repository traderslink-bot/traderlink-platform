// =========================
// 2026-04-12 08:52 PM America/Toronto
// DEBUG RUNNER: RAW TRADE TIMELINE
// file name: run-sample-timeline.ts
// =========================
//
// PURPOSE:
// Debug runner to inspect the raw trade timeline output in named sections.
//
// This prints:
// - core Layer 1 sections
// - newly added Layer 1 derived signals
// - pattern input
//
// NOTE:
// This version intentionally does NOT dump the entire result object at the end,
// so the console stays readable and section-based.
//
// =========================

import { createRawTradeTimeline } from "../builders/create-raw-trade-timeline";
import { sampleCreateRawTradeTimelineInput } from "../__fixtures__/sample-create-raw-trade-timeline-input";
import { buildPatternInput } from "../../pattern-input/builders/build-pattern-input";
import fs from "fs";
import path from "path";

function run() {
  const result = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);

  console.log("\n=== RAW TRADE TIMELINE OUTPUT ===\n");

  // =========================
  // INPUT
  // =========================
  console.log("INPUT:");
  console.dir(result.input, { depth: null });

  // =========================
  // TIMELINE
  // =========================
  console.log("\nTIMELINE:");
  console.dir(result.timeline, { depth: null });

  // =========================
  // CORE DERIVED SIGNALS
  // =========================
  console.log("\nEXECUTION DERIVED SIGNALS:");
  console.dir(result.executionDerivedSignals, { depth: null });

  console.log("\nPOSITION CHANGE DERIVED SIGNALS:");
  console.dir(result.positionChangeDerivedSignals, { depth: null });

  console.log("\nTIMELINE RELATIONSHIP SIGNALS:");
  console.dir(result.timelineRelationshipSignals, { depth: null });

  console.log("\nTRADE DERIVED SIGNALS:");
  console.dir(result.tradeDerivedSignals, { depth: null });

  // =========================
  // NEW LAYER 1 DERIVED SIGNALS
  // =========================
  console.log("\nPOST EXIT DERIVED SIGNALS:");
  console.dir(result.postExitDerivedSignals, { depth: null });

  console.log("\nENTRY OUTCOME TIMING SIGNALS:");
  console.dir(result.entryOutcomeTimingSignals, { depth: null });

  console.log("\nENTRY CONTEXT DERIVED SIGNALS:");
  console.dir(result.entryContextDerivedSignals, { depth: null });

  console.log("\nTRADE LIFECYCLE MILESTONE SIGNALS:");
  console.dir(result.tradeLifecycleMilestoneSignals, { depth: null });

  console.log("\nEXECUTION LOCAL STRUCTURE SIGNALS:");
  console.dir(result.executionLocalStructureSignals, { depth: null });

  console.log("\nADD CONTEXT DERIVED SIGNALS:");
  console.dir(result.addContextDerivedSignals, { depth: null });

  console.log("\nREDUCTION CONTEXT DERIVED SIGNALS:");
  console.dir(result.reductionContextDerivedSignals, { depth: null });

  console.log("\nBETWEEN EXECUTION PRICE BEHAVIOR SIGNALS:");
  console.dir(result.betweenExecutionPriceBehaviorSignals, { depth: null });

  console.log("\nREDUCTION RE-ADD SEQUENCE SIGNALS:");
  console.dir(result.reductionReaddSequenceSignals, { depth: null });

  console.log("\nPROFIT PROTECTION DERIVED SIGNALS:");
  console.dir(result.profitProtectionDerivedSignals, { depth: null });

  console.log("\nPARTIAL EXIT OUTCOME SIGNALS:");
  console.dir(result.partialExitOutcomeSignals, { depth: null });

  // =========================
  // WARNINGS
  // =========================
  if (result.warnings && result.warnings.length > 0) {
    console.log("\nWARNINGS:");
    console.dir(result.warnings, { depth: null });
  } else {
    console.log("\nWARNINGS: none");
  }

  // =========================
  // PATTERN INPUT
  // =========================
  const patternInput = buildPatternInput(result);

  console.log("\nPATTERN INPUT:");
  console.dir(patternInput, { depth: null });

  // =========================
  // SAVE PATTERN INPUT SNAPSHOT
  // =========================
  const outputPath = path.resolve(
    process.cwd(),
    "src/docs/layer1-raw-data/sample-pattern-input.json"
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(patternInput, null, 2),
    "utf-8"
  );

  console.log("\nSaved pattern input snapshot to:");
  console.log(outputPath);
}

run();
