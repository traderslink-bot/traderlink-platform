// 2026-04-14
// PURPOSE:
// Defines the normalized structural level contract for Layer 1
// support/resistance context.

import type { ReferenceLevelLabel } from "./reference-level-label";

export type StructuralLevelSide = "support" | "resistance";
export type StructuralLevelStrengthBucket = "strong" | "medium" | "weak";
export type StructuralLevelSourceStrengthLabel =
  | "weak"
  | "moderate"
  | "strong"
  | "major";
export type StructuralLevelReactionStrength =
  | "none"
  | "weak"
  | "moderate"
  | "strong";
export type StructuralLevelImportance =
  | "major"
  | "actionable"
  | "secondary"
  | "weak"
  | "synthetic_extension";
export type StructuralLevelFreshness = "fresh" | "aging" | "stale";
export type StructuralLevelPivotSource =
  | "tight_pivot"
  | "strict_pivot"
  | "reference_level";

export interface StructuralLevel {
  levelId: string;
  price: number;
  side: StructuralLevelSide;
  score: number;
  strengthBucket: StructuralLevelStrengthBucket;
  sourceStrengthLabel?: StructuralLevelSourceStrengthLabel | null;
  importance: StructuralLevelImportance;
  timeframeBias?: string | null;
  zoneLow?: number | null;
  zoneHigh?: number | null;
  zoneWidthPct?: number | null;
  isExtension?: boolean;
  extensionSource?: string | null;
  isSyntheticExtension?: boolean;
  freshness?: StructuralLevelFreshness | null;
  timeframeSources: string[];
  pivotSources: StructuralLevelPivotSource[];
  touchCount: number;
  touchClusterCount: number;
  reactionStrength: StructuralLevelReactionStrength;
  confluenceCount: number;
  isMandatoryAnchor: boolean;
  referenceLabel: ReferenceLevelLabel | null;
  sourcePrices: number[];
}
