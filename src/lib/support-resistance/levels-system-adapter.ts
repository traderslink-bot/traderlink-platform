import type {
  BuildSupportResistanceContextRequest as BuildLevelsSystemV2ContextRequest,
  Candle,
  CandleTimeframe,
  FinalLevelZone,
  SharedSupportResistanceLevel,
  SupportResistanceContext as LevelsSystemV2SupportResistanceContext,
} from "levels-system-v2/support-resistance-engine";
import { SUPPORT_RESISTANCE_CONFIG } from "./config/support-resistance-config";
import { buildGapStructure } from "./gaps/build-gap-structure";
import { buildExecutionLevelRelations } from "./relations/build-execution-level-relations";
import { buildStructuralContextWindow } from "./windowing/build-structural-context-window";
import type { DynamicLevels } from "../raw-trade-timeline/types/dynamic-levels";
import type { ExecutionLevelRelation } from "../raw-trade-timeline/types/execution-level-relation";
import type { ReferenceLevels } from "../raw-trade-timeline/types/reference-levels";
import type {
  StructuralLevel,
  StructuralLevelFreshness,
  StructuralLevelImportance,
  StructuralLevelStrengthBucket,
  StructuralLevelSourceStrengthLabel,
} from "../raw-trade-timeline/types/structural-level";
import type { TradeTimeline } from "../raw-trade-timeline/types/trade-timeline";
import type { SupportResistanceContext } from "./build-support-resistance-context";

type LevelsSystemV2EngineModule =
  typeof import("levels-system-v2/support-resistance-engine");

type LevelsSystemV2Diagnostic =
  LevelsSystemV2SupportResistanceContext["diagnostics"][number];

async function loadLevelsSystemV2Engine(): Promise<
  Pick<LevelsSystemV2EngineModule, "buildSupportResistanceContext">
> {
  return (await import(
    /* webpackIgnore: true */ "levels-system-v2/support-resistance-engine"
  )) as Pick<LevelsSystemV2EngineModule, "buildSupportResistanceContext">;
}

export type LevelsSystemProviderName = "ibkr" | "stub";

export interface LevelsSystemV2FetchServiceOptions {
  host?: string;
  port?: number;
  clientId?: number;
  historicalTimeoutMs?: number;
  connectionTimeoutMs?: number;
  providerName?: LevelsSystemProviderName;
  ibkrTimeoutMs?: number;
  provider?: {
    providerName: LevelsSystemProviderName;
  };
}

export interface BuildLevelsSystemSupportResistanceContextOptions {
  sessionDate?: string;
  asOfTimestamp?: string | number | Date;
  lookbackBars?: Partial<Record<CandleTimeframe, number>>;
  preferredProvider?: LevelsSystemProviderName;
  warehouseDirectoryPath?: string;
  warehouseMode?: "read_write" | "refresh" | "replay";
  fetchService?: unknown;
  fetchServiceOptions?: LevelsSystemV2FetchServiceOptions;
  config?: unknown;
  runtimeOptions?: unknown;
}

export interface BuildLevelsSystemSupportResistanceContextArgs
  extends BuildLevelsSystemSupportResistanceContextOptions {
  timeline: TradeTimeline;
}

export interface LevelsSystemSupportResistanceContext
  extends SupportResistanceContext {
  experimentalMarketStructure?: undefined;
  sharedEngineDiagnostics: LevelsSystemV2Diagnostic[];
  sharedEngineFetches: [];
}

function sortByPrice(levels: StructuralLevel[]): StructuralLevel[] {
  return [...levels].sort((left, right) => left.price - right.price);
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

function normalizeAsOfTimestamp(
  timestamp: string | number | Date | undefined,
): number | undefined {
  if (timestamp === undefined) {
    return undefined;
  }

  const parsed =
    timestamp instanceof Date
      ? timestamp.getTime()
      : typeof timestamp === "string"
        ? Date.parse(timestamp)
        : timestamp;

  return Number.isFinite(parsed) ? parsed : undefined;
}

function getDefaultAsOfTimestamp(timeline: TradeTimeline): number | undefined {
  return normalizeAsOfTimestamp(
    timeline.executions[timeline.executions.length - 1]?.timestamp ??
      timeline.tradeCandles[timeline.tradeCandles.length - 1]?.timestamp ??
      timeline.allCandles[timeline.allCandles.length - 1]?.timestamp,
  );
}

function isLevelsSystemV2Timeframe(
  timeframe: string,
): timeframe is CandleTimeframe {
  return timeframe === "daily" || timeframe === "4h" || timeframe === "5m";
}

function mapTimelineCandleToLevelsSystemCandle(
  candle: TradeTimeline["allCandles"][number],
): Candle {
  return {
    timestamp: Date.parse(candle.timestamp),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: Number.isFinite(candle.volume) ? candle.volume : 0,
  };
}

function aggregateCandlesToFiveMinutes(candles: Candle[]): Candle[] {
  const groups = new Map<number, Candle[]>();

  for (const candle of candles) {
    const bucket = Math.floor(candle.timestamp / 300_000) * 300_000;
    const group = groups.get(bucket) ?? [];

    group.push(candle);
    groups.set(bucket, group);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .map(([timestamp, group]) => {
      const sorted = [...group].sort(
        (left, right) => left.timestamp - right.timestamp,
      );

      return {
        timestamp,
        open: sorted[0].open,
        high: Math.max(...sorted.map((candle) => candle.high)),
        low: Math.min(...sorted.map((candle) => candle.low)),
        close: sorted[sorted.length - 1].close,
        volume: sorted.reduce((sum, candle) => sum + candle.volume, 0),
      };
    });
}

function buildCandlesByTimeframe(
  timeline: TradeTimeline,
): BuildLevelsSystemV2ContextRequest["candlesByTimeframe"] {
  const candles = timeline.allCandles
    .map(mapTimelineCandleToLevelsSystemCandle)
    .filter((candle) => Number.isFinite(candle.timestamp));

  if (timeline.timeframe === "1m") {
    return {
      "5m": aggregateCandlesToFiveMinutes(candles),
    };
  }

  if (!isLevelsSystemV2Timeframe(timeline.timeframe)) {
    return {};
  }

  return {
    [timeline.timeframe]: candles,
  };
}

function deriveStrengthBucket(
  level: SharedSupportResistanceLevel,
): StructuralLevelStrengthBucket {
  return level.timeframe === "daily" || level.timeframe === "4h"
    ? "strong"
    : "medium";
}

function deriveSourceStrengthLabel(
  level: SharedSupportResistanceLevel,
): StructuralLevelSourceStrengthLabel {
  return level.timeframe === "daily" || level.timeframe === "4h"
    ? "strong"
    : "moderate";
}

function deriveLevelScore(level: SharedSupportResistanceLevel): number {
  switch (level.timeframe) {
    case "daily":
      return 80;
    case "4h":
      return 70;
    case "5m":
    default:
      return 50;
  }
}

function zoneWidthPct(level: FinalLevelZone): number {
  if (!Number.isFinite(level.representativePrice) || level.representativePrice === 0) {
    return 0;
  }

  return Number(
    (
      (Math.abs(level.zoneHigh - level.zoneLow) /
        Math.abs(level.representativePrice)) *
      100
    ).toFixed(6),
  );
}

function deriveFinalZoneImportance(
  level: FinalLevelZone,
): StructuralLevelImportance {
  if (level.extensionMetadata?.extensionSource === "synthetic_continuation_map") {
    return "synthetic_extension";
  }

  if (level.strengthLabel === "major") {
    return "major";
  }

  if (
    level.strengthLabel === "strong" ||
    level.strengthScore >= 25 ||
    level.confluenceCount >= 2
  ) {
    return "actionable";
  }

  if (level.strengthLabel === "moderate" || level.strengthScore >= 12) {
    return "secondary";
  }

  return "weak";
}

function deriveSharedLevelImportance(
  level: SharedSupportResistanceLevel,
): StructuralLevelImportance {
  if (level.timeframe === "daily" || level.timeframe === "4h") {
    return "actionable";
  }

  return "secondary";
}

function isFinalLevelZone(
  level: SharedSupportResistanceLevel | FinalLevelZone,
): level is FinalLevelZone {
  return "representativePrice" in level;
}

export function mapLevelsSystemV2LevelToStructuralLevel(
  level: SharedSupportResistanceLevel | FinalLevelZone,
): StructuralLevel {
  if (isFinalLevelZone(level)) {
    return {
      levelId: level.id,
      price: level.representativePrice,
      side: level.kind,
      score: level.strengthScore,
      strengthBucket:
        level.strengthLabel === "weak"
          ? "weak"
          : level.strengthLabel === "moderate"
            ? "medium"
            : "strong",
      sourceStrengthLabel: level.strengthLabel,
      importance: deriveFinalZoneImportance(level),
      timeframeBias: level.timeframeBias,
      zoneLow: level.zoneLow,
      zoneHigh: level.zoneHigh,
      zoneWidthPct: zoneWidthPct(level),
      isExtension: level.isExtension,
      extensionSource: level.extensionMetadata?.extensionSource ?? null,
      isSyntheticExtension:
        level.extensionMetadata?.extensionSource ===
        "synthetic_continuation_map",
      freshness: level.freshness as StructuralLevelFreshness,
      timeframeSources: level.timeframeSources,
      pivotSources: level.sourceTypes.includes("premarket_low") ||
        level.sourceTypes.includes("premarket_high") ||
        level.sourceTypes.includes("opening_range_low") ||
        level.sourceTypes.includes("opening_range_high")
        ? ["reference_level", "strict_pivot"]
        : ["strict_pivot"],
      touchCount: level.touchCount,
      touchClusterCount: level.sourceEvidenceCount || level.confluenceCount,
      reactionStrength:
        Math.max(
          level.reactionQualityScore,
          level.followThroughScore,
          level.rejectionScore,
        ) >= 7
          ? "strong"
          : Math.max(
                level.reactionQualityScore,
                level.followThroughScore,
                level.rejectionScore,
              ) >= 4
            ? "moderate"
            : "weak",
      confluenceCount: level.confluenceCount,
      isMandatoryAnchor:
        level.strengthLabel === "major" ||
        level.timeframeSources.includes("daily"),
      referenceLabel: level.sourceTypes.includes("premarket_low")
        ? "premarket_low"
        : level.sourceTypes.includes("premarket_high")
          ? "premarket_high"
          : null,
      sourcePrices: [...new Set([
        level.zoneLow,
        level.representativePrice,
        level.zoneHigh,
      ])].sort((left, right) => left - right),
    };
  }

  return {
    levelId: [
      "levels-system-v2",
      level.symbol,
      level.timeframe,
      level.kind,
      level.sourceTimestamp,
      level.price,
    ].join(":"),
    price: level.price,
    side: level.kind,
    score: deriveLevelScore(level),
    strengthBucket: deriveStrengthBucket(level),
    sourceStrengthLabel: deriveSourceStrengthLabel(level),
    importance: deriveSharedLevelImportance(level),
    timeframeBias: level.timeframe,
    zoneLow: level.price,
    zoneHigh: level.price,
    zoneWidthPct: 0,
    isExtension: false,
    extensionSource: null,
    isSyntheticExtension: false,
    freshness: null,
    timeframeSources: [level.timeframe],
    pivotSources: ["strict_pivot"],
    touchCount: 1,
    touchClusterCount: 1,
    reactionStrength: "none",
    confluenceCount: 1,
    isMandatoryAnchor:
      level.timeframe === "daily" || level.timeframe === "4h",
    referenceLabel: null,
    sourcePrices: [level.price],
  };
}

export const mapFinalLevelZoneToStructuralLevel =
  mapLevelsSystemV2LevelToStructuralLevel;

export function mapLevelsSystemV2ContextToStructuralLevels(
  context: LevelsSystemV2SupportResistanceContext,
): {
  supportLevels: StructuralLevel[];
  resistanceLevels: StructuralLevel[];
} {
  const sourceLevels =
    context.finalLevelZones.length > 0 ? context.finalLevelZones : context.levels;
  const structuralLevels = uniqueLevelsById(
    sourceLevels.map(mapLevelsSystemV2LevelToStructuralLevel),
  );

  return {
    supportLevels: sortByPrice(
      structuralLevels.filter((level) => level.side === "support"),
    ),
    resistanceLevels: sortByPrice(
      structuralLevels.filter((level) => level.side === "resistance"),
    ),
  };
}

export const mapLevelEngineOutputToStructuralLevels =
  mapLevelsSystemV2ContextToStructuralLevels;

export function mapSharedDynamicLevels(): DynamicLevels {
  return {
    vwap: null,
    ema9: null,
    ema20: null,
  };
}

export function mapSharedReferenceLevels(): ReferenceLevels {
  return {
    previousDayHigh: null,
    previousDayLow: null,
    previousDayClose: null,
    premarketHigh: null,
    premarketLow: null,
    premarketBase: null,
  };
}

function hasInsufficientStructure(args: {
  context: LevelsSystemV2SupportResistanceContext;
  supportLevels: StructuralLevel[];
  resistanceLevels: StructuralLevel[];
}): boolean {
  return (
    args.supportLevels.length === 0 ||
    args.resistanceLevels.length === 0 ||
    args.context.diagnostics.some((diagnostic) => diagnostic.excludedCount > 0)
  );
}

export function mapSupportResistanceSymbolContextToLocalContext(args: {
  timeline: TradeTimeline;
  context: LevelsSystemV2SupportResistanceContext;
}): LevelsSystemSupportResistanceContext {
  const { timeline, context } = args;
  const { supportLevels, resistanceLevels } =
    mapLevelsSystemV2ContextToStructuralLevels(context);
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
    referenceLevels: mapSharedReferenceLevels(),
    dynamicLevels: mapSharedDynamicLevels(),
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
    hadInsufficientCandleDataForStructure: hasInsufficientStructure({
      context,
      supportLevels,
      resistanceLevels,
    }),
    sharedEngineDiagnostics: context.diagnostics,
    sharedEngineFetches: [],
    experimentalMarketStructure: undefined,
  };
}

export function mapLevelsSystemExecutionRelationsToLocalRelations(args: {
  timeline: TradeTimeline;
}): ExecutionLevelRelation[] | undefined {
  void args;
  return undefined;
}

export async function buildLevelsSystemSupportResistanceContext(
  args: BuildLevelsSystemSupportResistanceContextArgs,
): Promise<LevelsSystemSupportResistanceContext> {
  const { timeline, asOfTimestamp } = args;
  const { buildSupportResistanceContext } = await loadLevelsSystemV2Engine();
  const context = buildSupportResistanceContext({
    symbol: timeline.symbol,
    candlesByTimeframe: buildCandlesByTimeframe(timeline),
    asOfTimestamp: normalizeAsOfTimestamp(asOfTimestamp) ??
      getDefaultAsOfTimestamp(timeline),
  });

  return mapSupportResistanceSymbolContextToLocalContext({
    timeline,
    context,
  });
}

export { SUPPORT_RESISTANCE_CONFIG };
