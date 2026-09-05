import Decimal from "decimal.js";

import type {
  DailyTradeAnalyzerDirection,
  DailyTradeAnalyzerEventKind,
} from "../contracts/daily-trade-analyzer-contracts";

export const DAILY_TRADE_V2_MEANINGFUL_PROFIT_RULES = Object.freeze([
  Object.freeze({ requiredCloseCount: 3, thresholdPercent: 50 }),
  Object.freeze({ requiredCloseCount: 5, thresholdPercent: 30 }),
  Object.freeze({ requiredCloseCount: 10, thresholdPercent: 20 }),
  Object.freeze({ requiredCloseCount: 15, thresholdPercent: 15 }),
] as const);

export type DailyTradeV2ScenarioEvent = Readonly<{
  executedAtUtc: string;
  feesDecimal: string | null;
  kind: DailyTradeAnalyzerEventKind;
  priceDecimal: string;
  quantityDecimal: string;
  sequence: number;
}>;

export type DailyTradeV2ScenarioCandle = Readonly<{
  closeDecimal: string;
  time: number;
}>;

export type DailyTradeV2ProfitQualification = Readonly<{
  calculatedGrossResultDecimal: string;
  calculatedNetResultDecimal: string | null;
  closePriceDecimal: string;
  openQuantityDecimal: string;
  qualifiedAtUtcSeconds: number;
  requiredCloseCount: number;
  thresholdPercent: number;
}>;

export type DailyTradeV2ScaleOut = Readonly<{
  eventCount: number;
  firstAtUtcSeconds: number | null;
  lastAtUtcSeconds: number | null;
  maximumOpenQuantityDecimal: string;
  positionReducedPercent: number | null;
  profitSecuredGrossDecimal: string;
  remainingQuantityDecimal: string | null;
  scaledQuantityDecimal: string;
}>;

export type DailyTradeV2ScenarioAnalysis = Readonly<{
  calculatedFinalGrossResultDecimal: string;
  calculatedFinalNetResultDecimal: string | null;
  feesComplete: boolean;
  firstRedAfterQualificationAtUtcSeconds: number | null;
  primaryQualification: DailyTradeV2ProfitQualification | null;
  qualifications: readonly DailyTradeV2ProfitQualification[];
  scaleOut: DailyTradeV2ScaleOut;
}>;

type PathPoint = Readonly<{
  averageEntryPrice: Decimal;
  closePrice: Decimal;
  grossResult: Decimal;
  openQuantity: Decimal;
  openShareReturnPercent: number;
  time: number;
}>;

type Reduction = Readonly<{
  grossProfit: Decimal;
  positionAfter: Decimal;
  quantity: Decimal;
  time: number;
}>;

function eventTimeSeconds(event: DailyTradeV2ScenarioEvent): number | null {
  const milliseconds = Date.parse(event.executedAtUtc);
  return Number.isFinite(milliseconds) ? milliseconds / 1000 : null;
}

function decimal(value: string): Decimal | null {
  try {
    const parsed = new Decimal(value);
    return parsed.isFinite() ? parsed : null;
  } catch {
    return null;
  }
}

function directionMove(
  direction: DailyTradeAnalyzerDirection,
  averageEntryPrice: Decimal,
  price: Decimal,
): Decimal {
  return direction === "long"
    ? price.minus(averageEntryPrice)
    : averageEntryPrice.minus(price);
}

function qualificationForRule(
  points: readonly PathPoint[],
  rule: (typeof DAILY_TRADE_V2_MEANINGFUL_PROFIT_RULES)[number],
  totalFees: Decimal,
  feesComplete: boolean,
): DailyTradeV2ProfitQualification | null {
  let consecutive = 0;
  let previousTime: number | null = null;
  for (const point of points) {
    if (point.openShareReturnPercent + Number.EPSILON < rule.thresholdPercent) {
      consecutive = 0;
      previousTime = null;
      continue;
    }
    consecutive = previousTime !== null && point.time - previousTime === 60
      ? consecutive + 1
      : 1;
    previousTime = point.time;
    if (consecutive < rule.requiredCloseCount) continue;
    return Object.freeze({
      calculatedGrossResultDecimal: point.grossResult.toFixed(),
      calculatedNetResultDecimal: feesComplete
        ? point.grossResult.plus(totalFees).toFixed()
        : null,
      closePriceDecimal: point.closePrice.toFixed(),
      openQuantityDecimal: point.openQuantity.toFixed(),
      qualifiedAtUtcSeconds: point.time,
      requiredCloseCount: rule.requiredCloseCount,
      thresholdPercent: rule.thresholdPercent,
    });
  }
  return null;
}

export function analyzeDailyTradeV2Scenario(input: Readonly<{
  candles: readonly DailyTradeV2ScenarioCandle[];
  direction: DailyTradeAnalyzerDirection;
  events: readonly DailyTradeV2ScenarioEvent[];
}>): DailyTradeV2ScenarioAnalysis | null {
  const events = [...input.events]
    .flatMap((event) => {
      const time = eventTimeSeconds(event);
      const price = decimal(event.priceDecimal);
      const quantity = decimal(event.quantityDecimal);
      return time === null || price === null || quantity === null || !quantity.isPositive()
        ? []
        : [{ event, price, quantity, time }];
    })
    .sort((left, right) => left.time - right.time || left.event.sequence - right.event.sequence);
  const candles = [...input.candles]
    .flatMap((candle) => {
      const close = decimal(candle.closeDecimal);
      return !Number.isSafeInteger(candle.time) || close === null
        ? []
        : [{ close, time: candle.time }];
    })
    .sort((left, right) => left.time - right.time);
  if (events.length === 0 || candles.length === 0 || events.at(-1)?.event.kind !== "final_exit") {
    return null;
  }

  const feesComplete = events.every(({ event }) => event.feesDecimal !== null);
  const totalFees = feesComplete
    ? events.reduce((sum, { event }) => sum.plus(decimal(event.feesDecimal!) ?? 0), new Decimal(0))
    : new Decimal(0);
  const pathPoints: PathPoint[] = [];
  const reductions: Reduction[] = [];
  let averageEntryPrice: Decimal | null = null;
  let positionQuantity = new Decimal(0);
  let maximumOpenQuantity = new Decimal(0);
  let realizedGross = new Decimal(0);
  let candleIndex = 0;

  const appendCompletedClosesBefore = (eventTime: number) => {
    while (candleIndex < candles.length) {
      const candle = candles[candleIndex]!;
      const closeTime = candle.time + 60;
      if (closeTime > eventTime) break;
      if (averageEntryPrice && positionQuantity.isPositive()) {
        const perShare = directionMove(input.direction, averageEntryPrice, candle.close);
        pathPoints.push(Object.freeze({
          averageEntryPrice,
          closePrice: candle.close,
          grossResult: realizedGross.plus(perShare.times(positionQuantity)),
          openQuantity: positionQuantity,
          openShareReturnPercent: perShare.dividedBy(averageEntryPrice).times(100).toNumber(),
          time: closeTime,
        }));
      }
      candleIndex += 1;
    }
  };

  for (const { event, price, quantity, time } of events) {
    appendCompletedClosesBefore(time);
    if (event.kind === "entry" || event.kind === "add") {
      const quantityAfter = positionQuantity.plus(quantity);
      averageEntryPrice = quantityAfter.isZero()
        ? null
        : (averageEntryPrice ?? price).times(positionQuantity)
            .plus(price.times(quantity))
            .dividedBy(quantityAfter);
      positionQuantity = quantityAfter;
      maximumOpenQuantity = Decimal.max(maximumOpenQuantity, positionQuantity);
      continue;
    }
    if (!averageEntryPrice || positionQuantity.isZero()) continue;
    const closingQuantity = Decimal.min(positionQuantity, quantity);
    const grossProfit = directionMove(input.direction, averageEntryPrice, price).times(closingQuantity);
    realizedGross = realizedGross.plus(grossProfit);
    positionQuantity = Decimal.max(0, positionQuantity.minus(closingQuantity));
    if (event.kind === "partial_exit" && grossProfit.isPositive()) {
      reductions.push(Object.freeze({
        grossProfit,
        positionAfter: positionQuantity,
        quantity: closingQuantity,
        time,
      }));
    }
    if (positionQuantity.isZero()) averageEntryPrice = null;
  }

  const qualifications = Object.freeze(DAILY_TRADE_V2_MEANINGFUL_PROFIT_RULES.flatMap((rule) => {
    const qualification = qualificationForRule(pathPoints, rule, totalFees, feesComplete);
    return qualification ? [qualification] : [];
  }));
  const primaryQualification = qualifications[0] ?? null;
  const firstRedAfterQualification = primaryQualification
    ? pathPoints.find((point) =>
        point.time >= primaryQualification.qualifiedAtUtcSeconds && point.grossResult.isNegative()) ?? null
    : null;
  const relevantReductions = reductions.filter((reduction) =>
    primaryQualification !== null &&
    reduction.time >= primaryQualification.qualifiedAtUtcSeconds &&
    (firstRedAfterQualification === null || reduction.time < firstRedAfterQualification.time));
  const scaledQuantity = relevantReductions.reduce((sum, reduction) => sum.plus(reduction.quantity), new Decimal(0));
  const securedGross = relevantReductions.reduce((sum, reduction) => sum.plus(reduction.grossProfit), new Decimal(0));
  const lastReduction = relevantReductions.at(-1) ?? null;

  return Object.freeze({
    calculatedFinalGrossResultDecimal: realizedGross.toFixed(),
    calculatedFinalNetResultDecimal: feesComplete ? realizedGross.plus(totalFees).toFixed() : null,
    feesComplete,
    firstRedAfterQualificationAtUtcSeconds: firstRedAfterQualification?.time ?? null,
    primaryQualification,
    qualifications,
    scaleOut: Object.freeze({
      eventCount: relevantReductions.length,
      firstAtUtcSeconds: relevantReductions[0]?.time ?? null,
      lastAtUtcSeconds: lastReduction?.time ?? null,
      maximumOpenQuantityDecimal: maximumOpenQuantity.toFixed(),
      positionReducedPercent: maximumOpenQuantity.isPositive()
        ? Decimal.max(
            0,
            Decimal.min(
              maximumOpenQuantity.minus(lastReduction?.positionAfter ?? maximumOpenQuantity)
                .dividedBy(maximumOpenQuantity)
                .times(100),
              100,
            ),
          ).toNumber()
        : null,
      profitSecuredGrossDecimal: securedGross.toFixed(),
      remainingQuantityDecimal: (lastReduction?.positionAfter ?? primaryQualification?.openQuantityDecimal ?? maximumOpenQuantity).toString(),
      scaledQuantityDecimal: scaledQuantity.toFixed(),
    }),
  });
}
