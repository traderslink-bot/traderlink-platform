import {
  analyzeTrade,
  analyzeTradeWithLevelsSystem,
  analyzeTradeWithLevelsSystemCandles,
  type TradeAnalysisEngineArgs,
  type TradeAnalysisEngineLevelsSystemCandleArgs,
  type TradeAnalysisEngineResult,
} from "../trade-analysis-engine";
import {
  buildLevelsSystemSupportResistanceOptions,
  type LevelsSystemRuntimeConfig,
} from "../support-resistance/levels-system-runtime-options";

export type SupportResistanceAnalysisMode =
  | "levels_system"
  | "provided_candles_only";

export interface RunTradeAnalysisSupportResistanceOptions {
  mode?: SupportResistanceAnalysisMode;
  levelsSystem?: LevelsSystemRuntimeConfig;
}

export interface RunTradeAnalysisRequest {
  trade: TradeAnalysisEngineArgs;
  supportResistance?: RunTradeAnalysisSupportResistanceOptions;
}

export interface RunTradeAnalysisFromLevelsSystemCandlesRequest {
  trade: Omit<TradeAnalysisEngineLevelsSystemCandleArgs, "levelsSystem">;
  levelsSystem?: LevelsSystemRuntimeConfig;
}

export interface AppTradeAnalysisResult extends TradeAnalysisEngineResult {
  supportResistanceMode: SupportResistanceAnalysisMode;
}

export async function runTradeAnalysis(
  request: RunTradeAnalysisRequest,
): Promise<AppTradeAnalysisResult> {
  const supportResistanceMode =
    request.supportResistance?.mode ?? "levels_system";

  if (supportResistanceMode === "provided_candles_only") {
    return {
      ...analyzeTrade(request.trade),
      supportResistanceMode,
    };
  }

  const result = await analyzeTradeWithLevelsSystem(
    request.trade,
    buildLevelsSystemSupportResistanceOptions(
      request.supportResistance?.levelsSystem,
    ),
  );

  return {
    ...result,
    supportResistanceMode,
  };
}

export async function runTradeAnalysisWithProvidedCandlesOnly(
  trade: TradeAnalysisEngineArgs,
): Promise<AppTradeAnalysisResult> {
  return runTradeAnalysis({
    trade,
    supportResistance: {
      mode: "provided_candles_only",
    },
  });
}

export async function runTradeAnalysisFromLevelsSystemCandles(
  request: RunTradeAnalysisFromLevelsSystemCandlesRequest,
): Promise<AppTradeAnalysisResult> {
  const result = await analyzeTradeWithLevelsSystemCandles({
    ...request.trade,
    levelsSystem: buildLevelsSystemSupportResistanceOptions(
      request.levelsSystem,
    ),
  });

  return {
    ...result,
    supportResistanceMode: "levels_system",
  };
}
