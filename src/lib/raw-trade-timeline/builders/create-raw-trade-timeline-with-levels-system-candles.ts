import type {
  Candle,
  TradeAnalysisCandleContext,
  TradeAnalysisCandleWindowOptions,
  TradeAnalysisExecutionInput,
} from "levels-system-phase1/support-resistance-engine";
import type { NormalizeCandleInput } from "../normalizers/normalize-candle";
import type { NormalizeExecutionInput } from "../normalizers/normalize-execution";
import type { RawTradeTimelineBuildResult } from "../types/raw-trade-timeline-build-result";
import type { SessionContextInput } from "../types/session-context";
import type { TradeDirection } from "../types/trade-timeline-input";
import {
  mapLevelsSystemExecutionRelationsToLocalRelations,
  mapSupportResistanceSymbolContextToLocalContext,
} from "../../support-resistance/build-support-resistance-context";
import { mapSharedDynamicLevels } from "../../support-resistance/levels-system-adapter";
import {
  buildLevelsSystemSupportResistanceOptions,
  type LevelsSystemRuntimeConfig,
} from "../../support-resistance/levels-system-runtime-options";
import {
  createRawTradeTimeline,
  type CreateRawTradeTimelineArgs,
} from "./create-raw-trade-timeline";

const DEFAULT_POST_TRADE_MINUTES = 60;
const DEFAULT_PADDING_MINUTES = 5;
const ONE_MINUTE_MS = 60_000;
const MAX_EXECUTION_TO_CANDLE_DISTANCE_PCT = 60;

type LevelsSystemSupportResistanceEngineModule = typeof import("levels-system-phase1/support-resistance-engine");

async function loadLevelsSystemSupportResistanceEngine(): Promise<Pick<
  LevelsSystemSupportResistanceEngineModule,
  "buildDefaultTradeAnalysisCandleContext" | "buildTradeAnalysisCandleContext"
>> {
  return await import(
    /* webpackIgnore: true */ "levels-system-phase1/support-resistance-engine"
  ) as Pick<
    LevelsSystemSupportResistanceEngineModule,
    "buildDefaultTradeAnalysisCandleContext" | "buildTradeAnalysisCandleContext"
  >;
}

export interface CreateRawTradeTimelineWithLevelsSystemCandlesArgs {
  symbol: string;
  tradeDirection: TradeDirection;
  executions: NormalizeExecutionInput[];
  sessionContext: SessionContextInput;
  levelsSystem?: LevelsSystemRuntimeConfig;
  tradeWindow?: TradeAnalysisCandleWindowOptions;
  executionWindowCandlesBeforeCount?: number;
  executionWindowCandlesAfterCount?: number;
}

export interface RawTradeTimelineWithLevelsSystemCandlesBuildResult
  extends RawTradeTimelineBuildResult {
  levelsSystemTradeAnalysisCandleContext: TradeAnalysisCandleContext;
}

function toIsoTimestamp(timestamp: number): string {
  const iso = new Date(timestamp).toISOString();

  if (Number.isNaN(Date.parse(iso))) {
    throw new Error(`Invalid levels-system candle timestamp: ${timestamp}.`);
  }

  return iso;
}

function mapSharedCandleToNormalizeInput(args: {
  symbol: string;
  timeframe: string;
  candle: Candle;
}): NormalizeCandleInput {
  return {
    symbol: args.symbol,
    timeframe: args.timeframe,
    timestamp: toIsoTimestamp(args.candle.timestamp),
    open: args.candle.open,
    high: args.candle.high,
    low: args.candle.low,
    close: args.candle.close,
    volume: args.candle.volume,
    source: "levels-system",
  };
}

function parseOptionalNumber(
  value: number | string | undefined,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseExecutionTimestamp(timestamp: string | Date): number | null {
  const parsed =
    timestamp instanceof Date ? timestamp.getTime() : Date.parse(timestamp);

  return Number.isFinite(parsed) ? parsed : null;
}

function resolveExecutionTradeBounds(
  executions: NormalizeExecutionInput[],
): { tradeStartTimestamp: string; tradeEndTimestamp: string } | undefined {
  const timestamps = executions
    .map((execution) => parseExecutionTimestamp(execution.timestamp))
    .filter((timestamp): timestamp is number => timestamp !== null)
    .sort((left, right) => left - right);

  const tradeStartTimestamp = timestamps[0];
  const tradeEndTimestamp = timestamps[timestamps.length - 1];

  if (tradeStartTimestamp === undefined || tradeEndTimestamp === undefined) {
    return undefined;
  }

  return {
    tradeStartTimestamp: new Date(tradeStartTimestamp).toISOString(),
    tradeEndTimestamp: new Date(tradeEndTimestamp).toISOString(),
  };
}

function resolveAsOfTimestamp(args: {
  explicitAsOfTimestamp: LevelsSystemRuntimeConfig["asOfTimestamp"];
  tradeEndTimestamp: string | undefined;
  tradeWindow: TradeAnalysisCandleWindowOptions | undefined;
}): LevelsSystemRuntimeConfig["asOfTimestamp"] {
  if (args.explicitAsOfTimestamp !== undefined) {
    return args.explicitAsOfTimestamp;
  }
  if (args.tradeEndTimestamp === undefined) {
    return undefined;
  }

  const tradeEndTimestamp = Date.parse(args.tradeEndTimestamp);

  if (!Number.isFinite(tradeEndTimestamp)) {
    return undefined;
  }

  const postTradeMinutes =
    args.tradeWindow?.postTradeMinutes ?? DEFAULT_POST_TRADE_MINUTES;
  const paddingMinutes =
    args.tradeWindow?.paddingMinutes ?? DEFAULT_PADDING_MINUTES;
  const asOfTimestamp =
    tradeEndTimestamp + (postTradeMinutes + paddingMinutes) * ONE_MINUTE_MS;

  return new Date(asOfTimestamp).toISOString();
}

function mapExecutionInputToSharedExecution(
  execution: NormalizeExecutionInput,
): TradeAnalysisExecutionInput {
  const side = execution.side.trim().toLowerCase();

  return {
    timestamp: execution.timestamp,
    price: parseOptionalNumber(execution.price),
    quantity: parseOptionalNumber(execution.shares),
    side: side === "buy" || side === "sell" ? side : "unknown",
  };
}

function candleDistancePctFromPrice(candle: Candle, price: number): number {
  if (price <= 0 || !Number.isFinite(price)) {
    return 0;
  }

  if (price >= candle.low && price <= candle.high) {
    return 0;
  }

  const nearestBoundary = price < candle.low ? candle.low : candle.high;

  return (Math.abs(nearestBoundary - price) / price) * 100;
}

function nearestCandleDistancePct(args: {
  candles: Candle[];
  executionTimestamp: number;
  executionPrice: number;
}): number {
  const nearestCandle = [...args.candles].sort(
    (left, right) =>
      Math.abs(left.timestamp - args.executionTimestamp) -
      Math.abs(right.timestamp - args.executionTimestamp),
  )[0];

  return nearestCandle === undefined
    ? 0
    : candleDistancePctFromPrice(nearestCandle, args.executionPrice);
}

function tradeWindowCandlesLookPriceAligned(args: {
  context: TradeAnalysisCandleContext;
  executions: NormalizeExecutionInput[];
  allowStubProvider: boolean;
}): boolean {
  if (args.context.tradeWindow.fetch.provider === "stub" && !args.allowStubProvider) {
    return false;
  }

  const candles = args.context.tradeWindow.tradeCandles;

  if (candles.length === 0) {
    return true;
  }

  const distances = args.executions
    .map((execution) => ({
      timestamp: parseExecutionTimestamp(execution.timestamp),
      price: parseOptionalNumber(execution.price),
    }))
    .filter(
      (execution): execution is { timestamp: number; price: number } =>
        execution.timestamp !== null &&
        execution.price !== undefined &&
        execution.price > 0,
    )
    .map((execution) =>
      nearestCandleDistancePct({
        candles,
        executionTimestamp: execution.timestamp,
        executionPrice: execution.price,
      }),
    );

  if (distances.length === 0) {
    return true;
  }

  return Math.max(...distances) <= MAX_EXECUTION_TO_CANDLE_DISTANCE_PCT;
}

function buildTimelineContext(args: {
  context: TradeAnalysisCandleContext;
  useTradeWindowCandles: boolean;
}): TradeAnalysisCandleContext {
  if (args.useTradeWindowCandles) {
    return args.context;
  }

  return {
    ...args.context,
    tradeWindow: {
      ...args.context.tradeWindow,
      allCandles: [],
      preTradeCandles: [],
      tradeCandles: [],
      postTradeCandles: [],
    },
  };
}

function buildTradeTimelineArgsFromSharedContext(args: {
  request: CreateRawTradeTimelineWithLevelsSystemCandlesArgs;
  context: TradeAnalysisCandleContext;
}): CreateRawTradeTimelineArgs {
  const { request, context } = args;
  const symbol = context.symbol;
  const timeframe = context.tradeWindow.timeframe;
  const mapCandle = (candle: Candle) =>
    mapSharedCandleToNormalizeInput({ symbol, timeframe, candle });

  return {
    symbol,
    timeframe,
    tradeDirection: request.tradeDirection,
    preTradeCandles: context.tradeWindow.preTradeCandles.map(mapCandle),
    tradeCandles: context.tradeWindow.tradeCandles.map(mapCandle),
    postTradeCandles: context.tradeWindow.postTradeCandles.map(mapCandle),
    executions: request.executions,
    sessionContext: request.sessionContext,
    executionWindowCandlesBeforeCount:
      request.executionWindowCandlesBeforeCount,
    executionWindowCandlesAfterCount: request.executionWindowCandlesAfterCount,
  };
}

function formatDiagnostics(
  context: TradeAnalysisCandleContext,
): string[] {
  return [
    ...context.supportResistanceContext.diagnostics.map(
      (diagnostic) =>
        `levels-system ${diagnostic.severity}: ${diagnostic.message}`,
    ),
    ...context.diagnostics.map(
      (diagnostic) =>
        `levels-system trade-window ${diagnostic.severity}: ${diagnostic.message}`,
    ),
  ];
}

export async function createRawTradeTimelineWithLevelsSystemCandles(
  args: CreateRawTradeTimelineWithLevelsSystemCandlesArgs,
): Promise<RawTradeTimelineWithLevelsSystemCandlesBuildResult> {
  const levelsSystemOptions = buildLevelsSystemSupportResistanceOptions(
    args.levelsSystem,
  );
  const {
    buildDefaultTradeAnalysisCandleContext,
    buildTradeAnalysisCandleContext,
  } = await loadLevelsSystemSupportResistanceEngine();
  const executionTradeBounds = resolveExecutionTradeBounds(args.executions);
  const asOfTimestamp = resolveAsOfTimestamp({
    explicitAsOfTimestamp: levelsSystemOptions.asOfTimestamp,
    tradeEndTimestamp: executionTradeBounds?.tradeEndTimestamp,
    tradeWindow: args.tradeWindow,
  });
  const sharedRequest = {
    symbol: args.symbol,
    sessionDate:
      levelsSystemOptions.sessionDate ?? args.sessionContext.sessionDate,
    asOfTimestamp,
    executions: args.executions.map(mapExecutionInputToSharedExecution),
    tradeStartTimestamp: executionTradeBounds?.tradeStartTimestamp,
    tradeEndTimestamp: executionTradeBounds?.tradeEndTimestamp,
    preferredProvider: levelsSystemOptions.preferredProvider,
    warehouseDirectoryPath: levelsSystemOptions.warehouseDirectoryPath,
    warehouseMode: levelsSystemOptions.warehouseMode,
    fetchServiceOptions: levelsSystemOptions.fetchServiceOptions,
    supportResistance: {
      lookbackBars: levelsSystemOptions.lookbackBars,
      config: levelsSystemOptions.config,
      runtimeOptions: levelsSystemOptions.runtimeOptions,
    },
    tradeWindow: args.tradeWindow,
  };
  const context =
    levelsSystemOptions.fetchService === undefined
      ? await buildDefaultTradeAnalysisCandleContext(sharedRequest)
      : await buildTradeAnalysisCandleContext({
          ...sharedRequest,
          fetchService: levelsSystemOptions.fetchService,
        });
  const isImplicitStubProvider =
    context.tradeWindow.fetch.provider === "stub" &&
    levelsSystemOptions.fetchService === undefined;
  const useTradeWindowCandles = tradeWindowCandlesLookPriceAligned({
    context,
    executions: args.executions,
    allowStubProvider: levelsSystemOptions.fetchService !== undefined,
  });
  const timelineContext = buildTimelineContext({
    context,
    useTradeWindowCandles,
  });
  const result = createRawTradeTimeline(
    buildTradeTimelineArgsFromSharedContext({
      request: args,
      context: timelineContext,
    }),
  );
  const supportResistanceContext = isImplicitStubProvider
    ? undefined
    : mapSupportResistanceSymbolContextToLocalContext({
        timeline: result.timeline,
        context: context.supportResistanceContext,
      });
  const sharedWarnings = formatDiagnostics(context);
  const priceAlignmentWarning =
    useTradeWindowCandles
      ? []
      : context.tradeWindow.fetch.provider === "stub" &&
          levelsSystemOptions.fetchService === undefined
        ? [
            "levels-system trade-window warning: Trade-window candles were ignored because the default provider resolved to deterministic stub data. Configure a real historical candle provider before using candle-backed trade-window evidence.",
          ]
        : [
            `levels-system trade-window warning: Trade-window candles were ignored because their prices were disconnected from execution prices by more than ${MAX_EXECUTION_TO_CANDLE_DISTANCE_PCT}%.`,
          ];

  return {
    ...result,
    structuralContextWindow: supportResistanceContext?.structuralContextWindow,
    referenceLevels: supportResistanceContext?.referenceLevels,
    dynamicLevels: isImplicitStubProvider
      ? undefined
      : mapSharedDynamicLevels(context.tradeWindow.dynamicLevels),
    supportLevels: supportResistanceContext?.supportLevels,
    resistanceLevels: supportResistanceContext?.resistanceLevels,
    gapStructure: supportResistanceContext?.gapStructure,
    executionLevelRelations: isImplicitStubProvider
      ? undefined
      : mapLevelsSystemExecutionRelationsToLocalRelations({
          timeline: result.timeline,
          relations: context.executionRelations,
        }),
    levelsSystemTradeWindowFacts: useTradeWindowCandles
      ? context.tradeWindowFacts
      : undefined,
    levelsSystemExecutionRelations: isImplicitStubProvider
      ? undefined
      : context.executionRelations,
    levelsSystemMarketFacts: isImplicitStubProvider
      ? undefined
      : context.marketFacts,
    experimentalMarketStructure:
      supportResistanceContext?.experimentalMarketStructure,
    hadInsufficientCandleDataForStructure:
      isImplicitStubProvider
        ? true
        : supportResistanceContext?.hadInsufficientCandleDataForStructure,
    warnings:
      result.warnings ||
      sharedWarnings.length > 0 ||
      priceAlignmentWarning.length > 0
        ? [
            ...(result.warnings ?? []),
            ...sharedWarnings,
            ...priceAlignmentWarning,
          ]
        : undefined,
    levelsSystemTradeAnalysisCandleContext: context,
  };
}
