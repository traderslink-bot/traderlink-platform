// 2026-04-12 12:50 PM America/Toronto
// PURPOSE:
// Builds trade-level derived signals from the raw trade timeline.
// This file computes factual whole-trade measurements only.
// No pattern labeling, no scoring, no interpretation.

// file name build-trade-derived-signals.ts


import type { Candle } from "../types/candle";
import type { Execution } from "../types/execution";
import type { TradeDirection } from "../types/trade-timeline-input";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function getMaxHigh(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  return Math.max(...candles.map((candle) => candle.high));
}

function getMinLow(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  return Math.min(...candles.map((candle) => candle.low));
}

function getMaxExecutionPrice(executions: Execution[]): number {
  return Math.max(...executions.map((execution) => execution.price));
}

function getMinExecutionPrice(executions: Execution[]): number {
  return Math.min(...executions.map((execution) => execution.price));
}

function getTradeDurationMs(
  firstExecutionTimestamp: string,
  lastExecutionTimestamp: string,
): number {
  return Date.parse(lastExecutionTimestamp) - Date.parse(firstExecutionTimestamp);
}

export interface TradeDerivedSignals {
  symbol: string;
  tradeDirection: TradeDirection;

  firstExecutionTimestamp: string;
  lastExecutionTimestamp: string;

  firstExecutionPrice: number;
  lastExecutionPrice: number;

  peakPriceDuringTrade: number | null;
  worstPriceDuringTrade: number | null;

  tradeMfe: number | null;
  tradeMae: number | null;

  tradeMfePct: number | null;
  tradeMaePct: number | null;

  tradeDurationMs: number;
  tradeDurationSeconds: number;
  tradeCandleCount: number;
  executionCount: number;
}

export interface BuildTradeDerivedSignalsArgs {
  symbol: string;
  tradeDirection: TradeDirection;
  executions: Execution[];
  tradeCandles: Candle[];
}

export function buildTradeDerivedSignals(
  args: BuildTradeDerivedSignalsArgs,
): TradeDerivedSignals {
  const { symbol, tradeDirection, executions, tradeCandles } = args;

  if (executions.length === 0) {
    throw new Error("Cannot build trade-derived signals without executions.");
  }

  const firstExecution = executions[0];
  const lastExecution = executions[executions.length - 1];

  const firstExecutionPrice = firstExecution.price;
  const lastExecutionPrice = lastExecution.price;

  const maxHigh = getMaxHigh(tradeCandles) ?? getMaxExecutionPrice(executions);
  const minLow = getMinLow(tradeCandles) ?? getMinExecutionPrice(executions);

  let peakPriceDuringTrade: number | null = null;
  let worstPriceDuringTrade: number | null = null;

  let tradeMfe: number | null = null;
  let tradeMae: number | null = null;

  let tradeMfePct: number | null = null;
  let tradeMaePct: number | null = null;

  if (tradeDirection === "long") {
    peakPriceDuringTrade = maxHigh;
    worstPriceDuringTrade = minLow;
  } else {
    peakPriceDuringTrade = minLow;
    worstPriceDuringTrade = maxHigh;
  }

  if (peakPriceDuringTrade !== null) {
    tradeMfe = round(Math.abs(peakPriceDuringTrade - firstExecutionPrice));
    tradeMfePct = round(tradeMfe / firstExecutionPrice);
  }

  if (worstPriceDuringTrade !== null) {
    tradeMae = round(Math.abs(worstPriceDuringTrade - firstExecutionPrice));
    tradeMaePct = round(tradeMae / firstExecutionPrice);
  }

  const tradeDurationMs = getTradeDurationMs(
    firstExecution.timestamp,
    lastExecution.timestamp,
  );

  return {
    symbol,
    tradeDirection,
    firstExecutionTimestamp: firstExecution.timestamp,
    lastExecutionTimestamp: lastExecution.timestamp,
    firstExecutionPrice,
    lastExecutionPrice,
    peakPriceDuringTrade,
    worstPriceDuringTrade,
    tradeMfe,
    tradeMae,
    tradeMfePct,
    tradeMaePct,
    tradeDurationMs,
    tradeDurationSeconds: round(tradeDurationMs / 1000),
    tradeCandleCount: tradeCandles.length,
    executionCount: executions.length,
  };
}
