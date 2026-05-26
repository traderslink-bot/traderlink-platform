import type { TradeAnalysisEngineResult } from "../../trade-analysis-engine";
import type { PatternInputSupportResistanceContext } from "../../pattern-input/types/pattern-input";

export interface FieldComparison {
  field: keyof PatternInputSupportResistanceContext;
  localValue: PatternInputSupportResistanceContext[keyof PatternInputSupportResistanceContext];
  sharedValue: PatternInputSupportResistanceContext[keyof PatternInputSupportResistanceContext];
  changed: boolean;
}

export interface PatternIdComparison {
  localIds: string[];
  sharedIds: string[];
  addedIds: string[];
  removedIds: string[];
  unchangedIds: string[];
}

export interface LevelsSystemAnalysisComparison {
  levelCounts: {
    localSupportLevels: number;
    sharedSupportLevels: number;
    localResistanceLevels: number;
    sharedResistanceLevels: number;
  };
  dynamicLevels: {
    local: TradeAnalysisEngineResult["rawTradeTimeline"]["dynamicLevels"];
    shared: TradeAnalysisEngineResult["rawTradeTimeline"]["dynamicLevels"];
  };
  experimentalMarketStructure: {
    local: TradeAnalysisEngineResult["rawTradeTimeline"]["experimentalMarketStructure"];
    shared: TradeAnalysisEngineResult["rawTradeTimeline"]["experimentalMarketStructure"];
  };
  supportResistanceFields: FieldComparison[];
  changedSupportResistanceFields: FieldComparison[];
  detectedPatternIds: PatternIdComparison;
  normalizedPatternIds: PatternIdComparison;
}

function getDetectedPatternIds(result: TradeAnalysisEngineResult): string[] {
  return result.detectedPatterns.detectedPatterns.map(
    (pattern) => pattern.patternId,
  );
}

function getNormalizedPatternIds(result: TradeAnalysisEngineResult): string[] {
  return result.normalizedPatterns.prioritizedPatterns.map(
    (pattern) => pattern.patternId,
  );
}

function compareIds(localIds: string[], sharedIds: string[]): PatternIdComparison {
  return {
    localIds,
    sharedIds,
    addedIds: sharedIds.filter((id) => !localIds.includes(id)),
    removedIds: localIds.filter((id) => !sharedIds.includes(id)),
    unchangedIds: sharedIds.filter((id) => localIds.includes(id)),
  };
}

function valuesAreEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function compareSupportResistanceFields(
  local: PatternInputSupportResistanceContext,
  shared: PatternInputSupportResistanceContext,
): FieldComparison[] {
  return (Object.keys(local) as (keyof PatternInputSupportResistanceContext)[])
    .sort((left, right) => left.localeCompare(right))
    .map((field) => {
      const localValue = local[field];
      const sharedValue = shared[field];

      return {
        field,
        localValue,
        sharedValue,
        changed: !valuesAreEqual(localValue, sharedValue),
      };
    });
}

export function buildLevelsSystemAnalysisComparison(args: {
  local: TradeAnalysisEngineResult;
  shared: TradeAnalysisEngineResult;
}): LevelsSystemAnalysisComparison {
  const supportResistanceFields = compareSupportResistanceFields(
    args.local.patternInput.supportResistanceContext,
    args.shared.patternInput.supportResistanceContext,
  );

  return {
    levelCounts: {
      localSupportLevels: args.local.rawTradeTimeline.supportLevels?.length ?? 0,
      sharedSupportLevels: args.shared.rawTradeTimeline.supportLevels?.length ?? 0,
      localResistanceLevels:
        args.local.rawTradeTimeline.resistanceLevels?.length ?? 0,
      sharedResistanceLevels:
        args.shared.rawTradeTimeline.resistanceLevels?.length ?? 0,
    },
    dynamicLevels: {
      local: args.local.rawTradeTimeline.dynamicLevels,
      shared: args.shared.rawTradeTimeline.dynamicLevels,
    },
    experimentalMarketStructure: {
      local: args.local.rawTradeTimeline.experimentalMarketStructure,
      shared: args.shared.rawTradeTimeline.experimentalMarketStructure,
    },
    supportResistanceFields,
    changedSupportResistanceFields: supportResistanceFields.filter(
      (field) => field.changed,
    ),
    detectedPatternIds: compareIds(
      getDetectedPatternIds(args.local),
      getDetectedPatternIds(args.shared),
    ),
    normalizedPatternIds: compareIds(
      getNormalizedPatternIds(args.local),
      getNormalizedPatternIds(args.shared),
    ),
  };
}
