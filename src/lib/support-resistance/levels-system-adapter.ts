import type {
  BuildSupportResistanceContextForSymbolRequest,
  CandleMarketStructureContext,
  DynamicLevelsFromCandles,
  FinalLevelZone,
  LevelEngineOutput,
  RawLevelCandidateSourceType,
  SupportResistanceSymbolContext,
  SupportResistanceSymbolContextDiagnostic,
  SupportResistanceSymbolFetchSummary,
} from "levels-system-phase1/support-resistance-engine";
import { buildGapStructure } from "./gaps/build-gap-structure";
import { buildExecutionLevelRelations } from "./relations/build-execution-level-relations";
import { buildStructuralContextWindow } from "./windowing/build-structural-context-window";
import type { DynamicLevels } from "../raw-trade-timeline/types/dynamic-levels";
import type { ReferenceLevelLabel } from "../raw-trade-timeline/types/reference-level-label";
import type { ReferenceLevels } from "../raw-trade-timeline/types/reference-levels";
import type {
  StructuralLevel,
  StructuralLevelPivotSource,
  StructuralLevelReactionStrength,
  StructuralLevelStrengthBucket,
  StructuralLevelSourceStrengthLabel,
} from "../raw-trade-timeline/types/structural-level";
import type { TradeTimeline } from "../raw-trade-timeline/types/trade-timeline";
import type { SupportResistanceContext } from "./build-support-resistance-context";

type LevelsSystemSupportResistanceEngineModule = typeof import("levels-system-phase1/support-resistance-engine");

async function loadLevelsSystemSupportResistanceEngine(): Promise<Pick<
  LevelsSystemSupportResistanceEngineModule,
  "buildSupportResistanceContextForSymbol"
>> {
  return await import(
    /* webpackIgnore: true */ "levels-system-phase1/support-resistance-engine"
  ) as Pick<
    LevelsSystemSupportResistanceEngineModule,
    "buildSupportResistanceContextForSymbol"
  >;
}

export interface LevelsSystemSupportResistanceContext
  extends SupportResistanceContext {
  experimentalMarketStructure: CandleMarketStructureContext;
  sharedEngineDiagnostics: SupportResistanceSymbolContextDiagnostic[];
  sharedEngineFetches: SupportResistanceSymbolFetchSummary[];
}

export type BuildLevelsSystemSupportResistanceContextOptions = Omit<
  BuildSupportResistanceContextForSymbolRequest,
  "symbol" | "sessionDate" | "asOfTimestamp"
> & {
  sessionDate?: string;
  asOfTimestamp?: string | number | Date;
  warehouseDirectoryPath?: string;
  warehouseMode?: "read_write" | "refresh" | "replay";
};

export interface BuildLevelsSystemSupportResistanceContextArgs
  extends BuildLevelsSystemSupportResistanceContextOptions {
  timeline: TradeTimeline;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function sortByPrice(levels: StructuralLevel[]): StructuralLevel[] {
  return [...levels].sort((left, right) => left.price - right.price);
}

function mapStrengthBucket(
  strengthLabel: FinalLevelZone["strengthLabel"],
): StructuralLevelStrengthBucket {
  if (strengthLabel === "major" || strengthLabel === "strong") {
    return "strong";
  }

  if (strengthLabel === "moderate") {
    return "medium";
  }

  return "weak";
}

function mapSourceStrengthLabel(
  strengthLabel: FinalLevelZone["strengthLabel"],
): StructuralLevelSourceStrengthLabel {
  return strengthLabel;
}

function mapPivotSource(
  sourceType: RawLevelCandidateSourceType,
): StructuralLevelPivotSource {
  switch (sourceType) {
    case "premarket_high":
    case "premarket_low":
    case "opening_range_high":
    case "opening_range_low":
      return "reference_level";
    case "swing_high":
    case "swing_low":
    default:
      return "strict_pivot";
  }
}

function deriveReactionStrength(
  zone: FinalLevelZone,
): StructuralLevelReactionStrength {
  const reactionScore = Math.max(
    zone.reactionQualityScore,
    zone.followThroughScore,
    zone.rejectionScore,
  );

  if (reactionScore >= 7) {
    return "strong";
  }

  if (reactionScore >= 4) {
    return "moderate";
  }

  if (reactionScore > 0) {
    return "weak";
  }

  return "none";
}

function deriveReferenceLabel(
  zone: FinalLevelZone,
): ReferenceLevelLabel | null {
  if (zone.sourceTypes.includes("premarket_high")) {
    return "premarket_high";
  }

  if (zone.sourceTypes.includes("premarket_low")) {
    return "premarket_low";
  }

  return null;
}

function getSourcePrices(zone: FinalLevelZone): number[] {
  return unique([zone.zoneLow, zone.representativePrice, zone.zoneHigh])
    .filter((price) => Number.isFinite(price))
    .sort((left, right) => left - right);
}

export function mapFinalLevelZoneToStructuralLevel(
  zone: FinalLevelZone,
): StructuralLevel {
  const pivotSources = unique(zone.sourceTypes.map(mapPivotSource));

  return {
    levelId: zone.id,
    price: zone.representativePrice,
    side: zone.kind,
    score: zone.strengthScore,
    strengthBucket: mapStrengthBucket(zone.strengthLabel),
    sourceStrengthLabel: mapSourceStrengthLabel(zone.strengthLabel),
    timeframeSources: zone.timeframeSources,
    pivotSources: pivotSources.length > 0 ? pivotSources : ["strict_pivot"],
    touchCount: zone.touchCount,
    touchClusterCount: zone.sourceEvidenceCount || zone.confluenceCount,
    reactionStrength: deriveReactionStrength(zone),
    confluenceCount: zone.confluenceCount,
    isMandatoryAnchor:
      zone.strengthLabel === "major" ||
      zone.timeframeSources.includes("daily"),
    referenceLabel: deriveReferenceLabel(zone),
    sourcePrices: getSourcePrices(zone),
  };
}

function uniqueLevelsById(levels: StructuralLevel[]): StructuralLevel[] {
  const byId = new Map<string, StructuralLevel>();

  for (const level of levels) {
    if (!byId.has(level.levelId)) {
      byId.set(level.levelId, level);
    }
  }

  return [...byId.values()];
}

function isPrimaryTraderFeedbackLevel(zone: FinalLevelZone): boolean {
  return zone.timeframeSources.some(
    (timeframe) => timeframe === "daily" || timeframe === "4h",
  );
}

export function mapLevelEngineOutputToStructuralLevels(
  levels: LevelEngineOutput,
): {
  supportLevels: StructuralLevel[];
  resistanceLevels: StructuralLevel[];
} {
  return {
    supportLevels: sortByPrice(
      uniqueLevelsById(
        [
          ...levels.majorSupport,
          ...levels.intermediateSupport,
          ...levels.intradaySupport,
          ...levels.extensionLevels.support,
        ]
          .filter(isPrimaryTraderFeedbackLevel)
          .map(mapFinalLevelZoneToStructuralLevel),
      ),
    ),
    resistanceLevels: sortByPrice(
      uniqueLevelsById(
        [
          ...levels.majorResistance,
          ...levels.intermediateResistance,
          ...levels.intradayResistance,
          ...levels.extensionLevels.resistance,
        ]
          .filter(isPrimaryTraderFeedbackLevel)
          .map(mapFinalLevelZoneToStructuralLevel),
      ),
    ),
  };
}

export function mapSharedDynamicLevels(
  dynamicLevels: DynamicLevelsFromCandles,
): DynamicLevels {
  return {
    vwap: dynamicLevels.vwap,
    ema9: dynamicLevels.ema9,
    ema20: dynamicLevels.ema20,
  };
}

export function mapSharedReferenceLevels(
  levels: LevelEngineOutput,
): ReferenceLevels {
  return {
    previousDayHigh: null,
    previousDayLow: null,
    previousDayClose: null,
    premarketHigh: levels.specialLevels.premarketHigh ?? null,
    premarketLow: levels.specialLevels.premarketLow ?? null,
    premarketBase: null,
  };
}

function getDefaultAsOfTimestamp(timeline: TradeTimeline): string {
  return (
    timeline.executions[timeline.executions.length - 1]?.timestamp ??
    timeline.tradeCandles[timeline.tradeCandles.length - 1]?.timestamp ??
    timeline.allCandles[timeline.allCandles.length - 1]?.timestamp ??
    new Date().toISOString()
  );
}

function hasErrorDiagnostic(
  diagnostics: SupportResistanceSymbolContextDiagnostic[],
): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

export function mapSupportResistanceSymbolContextToLocalContext(args: {
  timeline: TradeTimeline;
  context: SupportResistanceSymbolContext;
}): LevelsSystemSupportResistanceContext {
  const { timeline, context } = args;
  const { supportLevels, resistanceLevels } =
    mapLevelEngineOutputToStructuralLevels(context.levels);
  const finalExecutionPrice =
    timeline.executions[timeline.executions.length - 1]?.price ??
    timeline.tradeCandles[timeline.tradeCandles.length - 1]?.close ??
    timeline.allCandles[timeline.allCandles.length - 1]?.close ??
    0;

  return {
    structuralContextWindow: buildStructuralContextWindow({
      timeframe: timeline.timeframe,
      executions: timeline.executions,
      preTradeCandles: timeline.preTradeCandles,
      postTradeCandles: timeline.postTradeCandles,
    }),
    referenceLevels: mapSharedReferenceLevels(context.levels),
    dynamicLevels: mapSharedDynamicLevels(context.dynamicLevels),
    supportLevels,
    resistanceLevels,
    gapStructure: buildGapStructure(
      [...timeline.preTradeCandles, ...timeline.tradeCandles],
      finalExecutionPrice,
    ),
    executionLevelRelations: buildExecutionLevelRelations({
      executions: timeline.executions,
      supportLevels,
      resistanceLevels,
    }),
    hadInsufficientCandleDataForStructure:
      hasErrorDiagnostic(context.diagnostics) ||
      (supportLevels.length === 0 && resistanceLevels.length === 0),
    experimentalMarketStructure: context.marketStructure,
    sharedEngineDiagnostics: context.diagnostics,
    sharedEngineFetches: context.fetches,
  };
}

export async function buildLevelsSystemSupportResistanceContext(
  args: BuildLevelsSystemSupportResistanceContextArgs,
): Promise<LevelsSystemSupportResistanceContext> {
  const { timeline, sessionDate, asOfTimestamp, ...requestOptions } = args;
  const { buildSupportResistanceContextForSymbol } =
    await loadLevelsSystemSupportResistanceEngine();
  const context = await buildSupportResistanceContextForSymbol({
    ...requestOptions,
    symbol: timeline.symbol,
    sessionDate: sessionDate ?? timeline.sessionContext.sessionDate,
    asOfTimestamp: asOfTimestamp ?? getDefaultAsOfTimestamp(timeline),
  });

  return mapSupportResistanceSymbolContextToLocalContext({
    timeline,
    context,
  });
}
