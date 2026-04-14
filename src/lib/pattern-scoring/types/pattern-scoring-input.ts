import type {
  NormalizedDetectedPattern,
  NormalizedPatternResult,
} from "../../pattern-normalization/types/normalized-pattern-result";

export interface PatternScoringInput {
  normalizedPatternResult: NormalizedPatternResult;

  // Layer 4 should treat this as the trade's single top-level anchor.
  topOverallAnchorPattern: NormalizedDetectedPattern | null;

  // Layer 4 should treat these as the strongest family-level anchors.
  primaryPatternsByFamily: Record<string, NormalizedDetectedPattern>;

  primaryPatterns: NormalizedDetectedPattern[];
  supportingPatterns: NormalizedDetectedPattern[];
  contextualPatterns: NormalizedDetectedPattern[];
  prioritizedPatterns: NormalizedDetectedPattern[];
}
