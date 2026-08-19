import "server-only";

import Decimal from "decimal.js";

import { analyzeTradeCandles } from "@/src/lib/trade-candle-analysis/candle-analysis";
import {
  acceptedRsi14,
  isAcceptedRsi14CalculationVersion,
  RSI_14_CALCULATION_VERSION,
} from
  "@/src/lib/trade-candle-analysis/indicator-context";
import type {
  CandleReviewPageModel,
  CandleReviewRecord,
  CandleReviewTarget,
  NormalizedMarketCandle,
} from "../contracts/candle-review-contracts";
import {
  journalReportingCurrencyMultiplier,
  type JournalReportingCurrencyContext,
} from "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";

function scaleDecimal(value: string, multiplier: string): string {
  return new Decimal(value).times(multiplier).toString();
}

function scaleNumber(value: number | null, multiplier: string): number | null {
  return value === null ? null : new Decimal(value).times(multiplier).toNumber();
}

function scaleTarget(target: CandleReviewTarget, multiplier: string): CandleReviewTarget {
  return Object.freeze({
    ...target,
    entryPriceDecimal: scaleDecimal(target.entryPriceDecimal, multiplier),
    exitPriceDecimal: scaleDecimal(target.exitPriceDecimal, multiplier),
  });
}

function scaleCandle(
  candle: NormalizedMarketCandle,
  multiplier: string,
): NormalizedMarketCandle {
  return Object.freeze({
    ...candle,
    closeDecimal: scaleDecimal(candle.closeDecimal, multiplier),
    highDecimal: scaleDecimal(candle.highDecimal, multiplier),
    lowDecimal: scaleDecimal(candle.lowDecimal, multiplier),
    openDecimal: scaleDecimal(candle.openDecimal, multiplier),
    turnoverDecimal: candle.turnoverDecimal == null
      ? candle.turnoverDecimal
      : scaleDecimal(candle.turnoverDecimal, multiplier),
  });
}

function scaleRecord(
  record: CandleReviewRecord,
  multiplier: string,
  currency: string,
): CandleReviewRecord {
  const target = scaleTarget(record.target, multiplier);
  const candles = Object.freeze(record.candles.map((candle) =>
    scaleCandle(candle, multiplier)));
  const analysis = candles.length === 0
    ? record.analysis
    : analyzeTradeCandles({
        candles: candles.map((candle) => Object.freeze({
          close: Number(candle.closeDecimal),
          high: Number(candle.highDecimal),
          low: Number(candle.lowDecimal),
          open: Number(candle.openDecimal),
          time: candle.time,
          turnover: candle.turnoverDecimal == null
            ? null
            : Number(candle.turnoverDecimal),
          volume: Number(candle.volumeDecimal),
        })),
        currency,
        trade: Object.freeze({
          direction: target.direction,
          entryPrice: Number(target.entryPriceDecimal),
          entryTime: Math.floor(Date.parse(target.openedAtUtc) / 1000),
          exitPrice: Number(target.exitPriceDecimal),
          exitTime: Math.floor(Date.parse(target.closedAtUtc) / 1000),
        }),
      });
  return Object.freeze({
    ...record,
    analysis,
    candles,
    indicators: Object.freeze(record.indicators.map((indicator) => {
      const {
        rsi14CalculationVersion: storedRsi14CalculationVersion,
        ...indicatorWithoutRsi14CalculationVersion
      } = indicator;
      return Object.freeze({
        ...indicatorWithoutRsi14CalculationVersion,
        adr20: scaleNumber(indicator.adr20, multiplier),
        atr14: scaleNumber(indicator.atr14, multiplier),
        ema9: scaleNumber(indicator.ema9, multiplier),
        ema20: scaleNumber(indicator.ema20, multiplier),
        macd: scaleNumber(indicator.macd, multiplier),
        macdHistogram: scaleNumber(indicator.macdHistogram, multiplier),
        macdSignal: scaleNumber(indicator.macdSignal, multiplier),
        rsi14: acceptedRsi14(
          indicator.rsi14,
          storedRsi14CalculationVersion,
        ),
        ...(isAcceptedRsi14CalculationVersion(storedRsi14CalculationVersion)
          ? { rsi14CalculationVersion: RSI_14_CALCULATION_VERSION }
          : {}),
        vwap: scaleNumber(indicator.vwap, multiplier),
      });
    })),
    target,
  });
}

function multiplierFor(
  roundTripId: string,
  context: JournalReportingCurrencyContext,
): string {
  const sourceCurrency = context.sourceCurrencyByRoundTrip.get(roundTripId);
  const sourceDate = context.sourceDateByRoundTrip.get(roundTripId);
  if (!sourceCurrency || !sourceDate) {
    throw new TypeError("Reporting conversion is unavailable for this trade.");
  }
  return journalReportingCurrencyMultiplier(sourceCurrency, sourceDate, context);
}

export function reportCandleReviewRecord(
  record: CandleReviewRecord,
  context: JournalReportingCurrencyContext,
): CandleReviewRecord {
  return scaleRecord(
    record,
    multiplierFor(record.target.roundTripId, context),
    context.reportingCurrency,
  );
}

export function reportCandleReviewPageModel(
  model: CandleReviewPageModel,
  context: JournalReportingCurrencyContext,
): CandleReviewPageModel {
  const multiplier = multiplierFor(model.target.roundTripId, context);
  return Object.freeze({
    ...model,
    review: model.review
      ? scaleRecord(model.review, multiplier, context.reportingCurrency)
      : null,
    target: scaleTarget(model.target, multiplier),
  });
}
