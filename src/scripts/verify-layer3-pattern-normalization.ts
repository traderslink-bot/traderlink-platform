// =========================
// 2026-04-13 12:26 AM America/Toronto
// VERIFY LAYER 3 PATTERN NORMALIZATION
// =========================
//
// PURPOSE:
// Reusable verification script for Layer 3 pattern normalization.
//
// WHAT THIS SCRIPT DOES:
// 1. Loads canonical Layer 2 detected pattern output JSON
// 2. Runs normalizeDetectedPatterns(...)
// 3. Prints normalized buckets
// 4. Prints prioritized ordering
// 5. Prints family grouping
// 6. Prints primary family anchors
// 7. Verifies the canonical sample against the expected Layer 3 snapshot
//
// USAGE:
// npx tsx src/scripts/verify-layer3-pattern-normalization.ts
//
// OPTIONAL:
// npx tsx src/scripts/verify-layer3-pattern-normalization.ts path/to/sample-detected-patterns.json
//

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import type { PatternDetectionResult } from "../lib/pattern-detection/types/pattern-detection-types";
import { normalizeDetectedPatterns } from "../lib/pattern-normalization/normalize-detected-patterns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

const CANONICAL_DETECTED_PATTERNS_PATH = path.resolve(
  PROJECT_ROOT,
  "src/docs/layer2-pattern-detection/sample-detected-patterns.json",
);

const EXPECTED_PRIMARY_PATTERN_IDS = [
  "advantaged_entry_structure",
  "moderate_capture_exit_structure",
  "multi_build_full_exit",
  "balanced_position_management",
] as const;

const EXPECTED_SUPPORTING_PATTERN_IDS = [
  "efficient_entry_structure",
  "exit_with_meaningful_giveback",
  "structured_position_building",
  "entry_near_trade_low",
  "entry_with_favorable_remaining_upside",
  "high_mfe_trade",
] as const;

const EXPECTED_CONTEXTUAL_PATTERN_IDS = [
  "low_range_entry",
  "scaled_into_position",
  "fully_closed_trade",
] as const;

function resolveDetectedPatternsFilePath(): string {
  const cliArgPath = process.argv[2];

  if (cliArgPath) {
    const resolvedCliPath = path.isAbsolute(cliArgPath)
      ? cliArgPath
      : path.resolve(PROJECT_ROOT, cliArgPath);

    if (!fs.existsSync(resolvedCliPath)) {
      throw new Error(
        `Detected-patterns file path provided on CLI does not exist: ${resolvedCliPath}`,
      );
    }

    return resolvedCliPath;
  }

  if (fs.existsSync(CANONICAL_DETECTED_PATTERNS_PATH)) {
    return CANONICAL_DETECTED_PATTERNS_PATH;
  }

  throw new Error(
    [
      "Could not find the canonical Layer 2 detected-patterns JSON file.",
      "Checked the following location:",
      `  - ${CANONICAL_DETECTED_PATTERNS_PATH}`,
      "",
      "Either place your file at that location",
      "or pass an explicit file path on the command line.",
    ].join("\n"),
  );
}

function readPatternDetectionResultFromJson(
  filePath: string,
): PatternDetectionResult {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as PatternDetectionResult;
}

function printSectionHeader(title: string): void {
  console.log("");
  console.log("=================================");
  console.log(title);
  console.log("=================================");
}

function sortStrings(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function formatPatternLine(args: {
  patternId: string;
  patternName: string;
  family: string;
  patternType: string;
  normalizedRole: string;
  defaultPriority: number;
  specificityRank: number;
  suppressionReasons: string[];
}): string {
  const {
    patternId,
    patternName,
    family,
    patternType,
    normalizedRole,
    defaultPriority,
    specificityRank,
    suppressionReasons,
  } = args;

  const baseLine =
    `${patternId} | ${patternName} | family=${family}` +
    ` | type=${patternType}` +
    ` | role=${normalizedRole}` +
    ` | priority=${defaultPriority}` +
    ` | specificity=${specificityRank}`;

  if (suppressionReasons.length === 0) {
    return baseLine;
  }

  return `${baseLine} | suppressedBy=${suppressionReasons.join(" || ")}`;
}

function main(): void {
  const detectedPatternsFilePath = resolveDetectedPatternsFilePath();
  const detectionResult =
    readPatternDetectionResultFromJson(detectedPatternsFilePath);

  const normalizedResult = normalizeDetectedPatterns(detectionResult);
  const isCanonicalSample =
    path.resolve(detectedPatternsFilePath) === CANONICAL_DETECTED_PATTERNS_PATH;

  console.log("=================================");
  console.log("LAYER 3 PATTERN NORMALIZATION VERIFY");
  console.log("=================================");
  console.log(`Detected-patterns file: ${detectedPatternsFilePath}`);
  console.log(
    `Input detected pattern count: ${detectionResult.detectedPatterns.length}`,
  );
  console.log(
    `Output prioritized pattern count: ${normalizedResult.prioritizedPatterns.length}`,
  );

  printSectionHeader("PRIMARY PATTERNS");
  if (normalizedResult.primaryPatterns.length === 0) {
    console.log("(none)");
  } else {
    for (const pattern of normalizedResult.primaryPatterns) {
      console.log(
        `  - ${formatPatternLine({
          patternId: pattern.patternId,
          patternName: pattern.patternName,
          family: pattern.family,
          patternType: pattern.patternType,
          normalizedRole: pattern.normalizedRole,
          defaultPriority: pattern.metadata.defaultPriority,
          specificityRank: pattern.metadata.specificityRank,
          suppressionReasons: pattern.suppressionReasons,
        })}`,
      );
    }
  }

  printSectionHeader("SUPPORTING PATTERNS");
  if (normalizedResult.supportingPatterns.length === 0) {
    console.log("(none)");
  } else {
    for (const pattern of normalizedResult.supportingPatterns) {
      console.log(
        `  - ${formatPatternLine({
          patternId: pattern.patternId,
          patternName: pattern.patternName,
          family: pattern.family,
          patternType: pattern.patternType,
          normalizedRole: pattern.normalizedRole,
          defaultPriority: pattern.metadata.defaultPriority,
          specificityRank: pattern.metadata.specificityRank,
          suppressionReasons: pattern.suppressionReasons,
        })}`,
      );
    }
  }

  printSectionHeader("CONTEXTUAL PATTERNS");
  if (normalizedResult.contextualPatterns.length === 0) {
    console.log("(none)");
  } else {
    for (const pattern of normalizedResult.contextualPatterns) {
      console.log(
        `  - ${formatPatternLine({
          patternId: pattern.patternId,
          patternName: pattern.patternName,
          family: pattern.family,
          patternType: pattern.patternType,
          normalizedRole: pattern.normalizedRole,
          defaultPriority: pattern.metadata.defaultPriority,
          specificityRank: pattern.metadata.specificityRank,
          suppressionReasons: pattern.suppressionReasons,
        })}`,
      );
    }
  }

  printSectionHeader("FULL PRIORITIZED ORDER");
  for (const pattern of normalizedResult.prioritizedPatterns) {
    console.log(
      `  - ${formatPatternLine({
        patternId: pattern.patternId,
        patternName: pattern.patternName,
        family: pattern.family,
        patternType: pattern.patternType,
        normalizedRole: pattern.normalizedRole,
        defaultPriority: pattern.metadata.defaultPriority,
        specificityRank: pattern.metadata.specificityRank,
        suppressionReasons: pattern.suppressionReasons,
      })}`,
    );
  }

  printSectionHeader("PATTERNS BY FAMILY");
  const familyNames = Object.keys(normalizedResult.patternsByFamily).sort(
    (a, b) => a.localeCompare(b),
  );

  for (const familyName of familyNames) {
    console.log(`${familyName}:`);

    for (const pattern of normalizedResult.patternsByFamily[familyName]) {
      console.log(
        `  - ${formatPatternLine({
          patternId: pattern.patternId,
          patternName: pattern.patternName,
          family: pattern.family,
          patternType: pattern.patternType,
          normalizedRole: pattern.normalizedRole,
          defaultPriority: pattern.metadata.defaultPriority,
          specificityRank: pattern.metadata.specificityRank,
          suppressionReasons: pattern.suppressionReasons,
        })}`,
      );
    }

    console.log("");
  }

  printSectionHeader("PRIMARY PATTERNS BY FAMILY");
  const primaryFamilyNames = Object.keys(
    normalizedResult.primaryPatternsByFamily,
  ).sort((a, b) => a.localeCompare(b));

  if (primaryFamilyNames.length === 0) {
    console.log("(none)");
  } else {
    for (const familyName of primaryFamilyNames) {
      const pattern = normalizedResult.primaryPatternsByFamily[familyName];

      console.log(
        `  - ${familyName}: ${formatPatternLine({
          patternId: pattern.patternId,
          patternName: pattern.patternName,
          family: pattern.family,
          patternType: pattern.patternType,
          normalizedRole: pattern.normalizedRole,
          defaultPriority: pattern.metadata.defaultPriority,
          specificityRank: pattern.metadata.specificityRank,
          suppressionReasons: pattern.suppressionReasons,
        })}`,
      );
    }
  }

  if (!isCanonicalSample) {
    console.log("");
    console.log("Layer 3 normalization verification completed.");
    process.exit(0);
  }

  const actualPrimaryPatternIds = normalizedResult.primaryPatterns.map(
    (pattern) => pattern.patternId,
  );
  const actualSupportingPatternIds = normalizedResult.supportingPatterns.map(
    (pattern) => pattern.patternId,
  );
  const actualContextualPatternIds = normalizedResult.contextualPatterns.map(
    (pattern) => pattern.patternId,
  );

  const expectedPrimaryPatternIds = [...EXPECTED_PRIMARY_PATTERN_IDS];
  const expectedSupportingPatternIds = [...EXPECTED_SUPPORTING_PATTERN_IDS];
  const expectedContextualPatternIds = [...EXPECTED_CONTEXTUAL_PATTERN_IDS];

  const regressionFound =
    JSON.stringify(actualPrimaryPatternIds) !==
      JSON.stringify(expectedPrimaryPatternIds) ||
    JSON.stringify(actualSupportingPatternIds) !==
      JSON.stringify(expectedSupportingPatternIds) ||
    JSON.stringify(actualContextualPatternIds) !==
      JSON.stringify(expectedContextualPatternIds);

  printSectionHeader("CANONICAL REGRESSION CHECK");

  if (!regressionFound) {
    console.log("PASS");
    console.log("Layer 3 normalization verification completed.");
    process.exit(0);
  }

  console.log("FAIL");
  console.log("");
  console.log(
    `Expected primary IDs: ${expectedPrimaryPatternIds.join(", ")}`,
  );
  console.log(`Actual primary IDs:   ${actualPrimaryPatternIds.join(", ")}`);
  console.log("");
  console.log(
    `Expected supporting IDs: ${expectedSupportingPatternIds.join(", ")}`,
  );
  console.log(
    `Actual supporting IDs:   ${actualSupportingPatternIds.join(", ")}`,
  );
  console.log("");
  console.log(
    `Expected contextual IDs: ${expectedContextualPatternIds.join(", ")}`,
  );
  console.log(
    `Actual contextual IDs:   ${actualContextualPatternIds.join(", ")}`,
  );
  console.log("");
  console.log(
    `Sorted actual primary IDs: ${sortStrings(actualPrimaryPatternIds).join(", ")}`,
  );

  process.exit(1);
}

main();
