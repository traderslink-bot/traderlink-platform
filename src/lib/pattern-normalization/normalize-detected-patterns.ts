// =========================
// 2026-04-12 08:24 PM America/Toronto
// NORMALIZE DETECTED PATTERNS
// =========================
//
// PURPOSE:
// Layer 3 normalization engine.
//
// WHAT THIS FILE DOES NOW:
// 1. Consumes Layer 2 PatternDetectionResult
// 2. Attaches normalization metadata to each detected pattern
// 3. Sorts patterns deterministically by default priority, specificity,
//    and pattern type
// 4. Applies soft suppression and demotion rules
// 5. Classifies patterns into primary, supporting, and contextual buckets
// 6. Groups normalized patterns by family
//
// IMPORTANT:
// This file does NOT:
// - re-detect patterns
// - access Layer 1 raw inputs
// - score trades
// - generate coaching
// - generate narrative text
//

import type {
  DetectedPattern,
  PatternDetectionResult,
  PatternType,
} from "../pattern-detection/types/pattern-detection-types";
import type {
  NormalizationRole,
  PatternMetadata,
} from "./pattern-metadata";
import type {
  NormalizedDetectedPattern,
  NormalizedPatternResult,
} from "./types/normalized-pattern-result";
import { getPatternMetadata } from "./pattern-metadata";
import {
  getDominanceRulesForDominantPattern,
} from "./pattern-suppression-rules";

// =========================
// INTERNAL HELPERS
// =========================

// 2026-04-12 08:24 PM America/Toronto
// Composite patterns generally outrank atomic patterns when other factors are
// close because they represent higher-order structure.
function getPatternTypeRank(patternType: PatternType): number {
  return patternType === "composite" ? 2 : 1;
}

// 2026-04-12 08:24 PM America/Toronto
// Baseline role before any suppression logic is applied.
function deriveInitialNormalizedRole(
  pattern: DetectedPattern,
  metadata: PatternMetadata,
): NormalizationRole {
  if (metadata.defaultRole === "context_only") {
    return "context_only";
  }

  if (metadata.defaultRole === "supporting_candidate") {
    return "supporting_candidate";
  }

  if (
    metadata.defaultRole === "primary_candidate" &&
    metadata.canBePrimary
  ) {
    return "primary_candidate";
  }

  // 2026-04-12 08:24 PM America/Toronto
  // Defensive fallback. Metadata should normally make this unnecessary.
  if (pattern.patternType === "composite" && metadata.canBePrimary) {
    return "primary_candidate";
  }

  return "supporting_candidate";
}

// 2026-04-12 08:24 PM America/Toronto
// Deterministic Layer 3 ordering.
// Order:
// 1. defaultPriority descending
// 2. specificityRank descending
// 3. patternType rank descending
// 4. patternId alphabetical
function compareNormalizedPatterns(
  a: NormalizedDetectedPattern,
  b: NormalizedDetectedPattern,
): number {
  if (b.metadata.defaultPriority !== a.metadata.defaultPriority) {
    return b.metadata.defaultPriority - a.metadata.defaultPriority;
  }

  if (b.metadata.specificityRank !== a.metadata.specificityRank) {
    return b.metadata.specificityRank - a.metadata.specificityRank;
  }

  const patternTypeRankA = getPatternTypeRank(a.patternType);
  const patternTypeRankB = getPatternTypeRank(b.patternType);

  if (patternTypeRankB !== patternTypeRankA) {
    return patternTypeRankB - patternTypeRankA;
  }

  return a.patternId.localeCompare(b.patternId);
}

function buildPatternsByFamily(
  patterns: NormalizedDetectedPattern[],
): Record<string, NormalizedDetectedPattern[]> {
  const grouped: Record<string, NormalizedDetectedPattern[]> = {};

  for (const pattern of patterns) {
    if (!grouped[pattern.family]) {
      grouped[pattern.family] = [];
    }

    grouped[pattern.family].push(pattern);
  }

  for (const family of Object.keys(grouped)) {
    grouped[family].sort(compareNormalizedPatterns);
  }

  return grouped;
}

function buildPrimaryPatternsByFamily(
  primaryPatterns: NormalizedDetectedPattern[],
): Record<string, NormalizedDetectedPattern> {
  return Object.fromEntries(
    primaryPatterns.map((pattern) => [pattern.family, pattern]),
  );
}

function buildTopOverallAnchorPattern(
  primaryPatterns: NormalizedDetectedPattern[],
  prioritizedPatterns: NormalizedDetectedPattern[],
): NormalizedDetectedPattern | null {
  if (primaryPatterns.length > 0) {
    return primaryPatterns[0];
  }

  return prioritizedPatterns[0] ?? null;
}

// 2026-04-12 08:24 PM America/Toronto
// Applies a one-step demotion. We only allow movement downward:
//
// primary_candidate -> supporting_candidate -> context_only
//
// A pattern is never promoted here.
function applyDemotion(
  currentRole: NormalizationRole,
  outcome: "demote_to_supporting" | "demote_to_contextual",
): NormalizationRole {
  if (outcome === "demote_to_contextual") {
    return "context_only";
  }

  if (currentRole === "primary_candidate") {
    return "supporting_candidate";
  }

  if (currentRole === "supporting_candidate") {
    return "supporting_candidate";
  }

  return "context_only";
}

// 2026-04-12 08:24 PM America/Toronto
// Applies soft suppression from stronger patterns already kept earlier in the
// priority order. This keeps normalization deterministic and same-directional.
function applySuppressionRules(
  prioritizedPatterns: NormalizedDetectedPattern[],
): NormalizedDetectedPattern[] {
  const keptPatternIds = new Set<string>();

  for (const dominantPattern of prioritizedPatterns) {
    keptPatternIds.add(dominantPattern.patternId);

    const dominanceRules = getDominanceRulesForDominantPattern(
      dominantPattern.patternId,
    );

    if (dominanceRules.length === 0) {
      continue;
    }

    for (const rule of dominanceRules) {
      // 2026-04-12 08:24 PM America/Toronto
      // Only suppress patterns that are actually present in this result set.
      const suppressedPattern = prioritizedPatterns.find(
        (pattern) => pattern.patternId === rule.suppressedPatternId,
      );

      if (!suppressedPattern) {
        continue;
      }

      // 2026-04-12 08:24 PM America/Toronto
      // Only allow already-prioritized dominant patterns to demote weaker ones.
      // This ensures deterministic top-down normalization.
      if (!keptPatternIds.has(dominantPattern.patternId)) {
        continue;
      }

      const nextRole = applyDemotion(
        suppressedPattern.normalizedRole,
        rule.outcome,
      );

      if (nextRole !== suppressedPattern.normalizedRole) {
        suppressedPattern.normalizedRole = nextRole;
      }

      suppressedPattern.suppressionReasons.push(
        `${rule.dominantPatternId} -> ${rule.suppressedPatternId}: ${rule.reason}`,
      );
    }
  }

  return prioritizedPatterns;
}

// 2026-04-13 12:11 AM America/Toronto
// Keeps Layer 3 from producing multiple competing primary anchors inside the
// same family. The highest-priority primary in each family remains primary;
// additional primary candidates are preserved as supporting patterns.
function enforceSinglePrimaryPerFamily(
  prioritizedPatterns: NormalizedDetectedPattern[],
): NormalizedDetectedPattern[] {
  const primaryFamilyAnchors = new Map<string, string>();

  for (const pattern of prioritizedPatterns) {
    if (pattern.normalizedRole !== "primary_candidate") {
      continue;
    }

    const existingAnchorPatternId = primaryFamilyAnchors.get(pattern.family);

    if (!existingAnchorPatternId) {
      primaryFamilyAnchors.set(pattern.family, pattern.patternId);
      continue;
    }

    pattern.normalizedRole = "supporting_candidate";
    pattern.suppressionReasons.push(
      `${existingAnchorPatternId} -> ${pattern.patternId}: ${pattern.family} keeps a single primary anchor pattern in Layer 3.`,
    );
  }

  return prioritizedPatterns;
}

// =========================
// ENGINE
// =========================

export function normalizeDetectedPatterns(
  result: PatternDetectionResult,
): NormalizedPatternResult {
  const normalizedPatterns: NormalizedDetectedPattern[] =
    result.detectedPatterns.map((pattern) => {
      const metadata = getPatternMetadata(pattern.patternId);

      if (!metadata) {
        throw new Error(
          `Missing pattern metadata for detected pattern: ${pattern.patternId}`,
        );
      }

      return {
        ...pattern,
        metadata,
        normalizedRole: deriveInitialNormalizedRole(pattern, metadata),
        suppressionReasons: [],
      };
    });

  const prioritizedPatterns = [...normalizedPatterns].sort(
    compareNormalizedPatterns,
  );

  const suppressedAndPrioritizedPatterns =
    applySuppressionRules(prioritizedPatterns);

  const familyNormalizedPatterns = enforceSinglePrimaryPerFamily(
    suppressedAndPrioritizedPatterns,
  );

  const primaryPatterns = familyNormalizedPatterns.filter(
    (pattern) => pattern.normalizedRole === "primary_candidate",
  );

  const supportingPatterns = familyNormalizedPatterns.filter(
    (pattern) => pattern.normalizedRole === "supporting_candidate",
  );

  const contextualPatterns = familyNormalizedPatterns.filter(
    (pattern) => pattern.normalizedRole === "context_only",
  );

  const patternsByFamily = buildPatternsByFamily(
    familyNormalizedPatterns,
  );
  const primaryPatternsByFamily = buildPrimaryPatternsByFamily(
    primaryPatterns,
  );
  const topOverallAnchorPattern = buildTopOverallAnchorPattern(
    primaryPatterns,
    familyNormalizedPatterns,
  );

  return {
    primaryPatterns,
    supportingPatterns,
    contextualPatterns,
    prioritizedPatterns: familyNormalizedPatterns,
    patternsByFamily,
    primaryPatternsByFamily,
    topOverallAnchorPattern,
  };
}
