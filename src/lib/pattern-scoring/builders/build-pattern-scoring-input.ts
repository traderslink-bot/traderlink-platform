import type { NormalizedPatternResult } from "../../pattern-normalization/types/normalized-pattern-result";
import type { PatternScoringInput } from "../types/pattern-scoring-input";

export function buildPatternScoringInput(
  normalizedPatternResult: NormalizedPatternResult,
): PatternScoringInput {
  return {
    normalizedPatternResult,
    topOverallAnchorPattern:
      normalizedPatternResult.topOverallAnchorPattern,
    primaryPatternsByFamily:
      normalizedPatternResult.primaryPatternsByFamily,
    primaryPatterns: normalizedPatternResult.primaryPatterns,
    supportingPatterns: normalizedPatternResult.supportingPatterns,
    contextualPatterns: normalizedPatternResult.contextualPatterns,
    prioritizedPatterns: normalizedPatternResult.prioritizedPatterns,
  };
}
