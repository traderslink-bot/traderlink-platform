import type { DetectedPattern } from "../../pattern-detection/types/pattern-detection-types";
import type {
  NormalizationRole,
  PatternMetadata,
} from "../pattern-metadata";

export interface NormalizedDetectedPattern extends DetectedPattern {
  metadata: PatternMetadata;
  normalizedRole: NormalizationRole;
  suppressionReasons: string[];
}

export interface NormalizedPatternResult {
  primaryPatterns: NormalizedDetectedPattern[];
  supportingPatterns: NormalizedDetectedPattern[];
  contextualPatterns: NormalizedDetectedPattern[];
  prioritizedPatterns: NormalizedDetectedPattern[];
  patternsByFamily: Record<string, NormalizedDetectedPattern[]>;
  primaryPatternsByFamily: Record<string, NormalizedDetectedPattern>;

  // Layer 4+ should use this as the single trade-level anchor pattern.
  // It prefers the highest-priority primary pattern and falls back to the
  // highest-priority normalized pattern if no primary exists.
  topOverallAnchorPattern: NormalizedDetectedPattern | null;
}
