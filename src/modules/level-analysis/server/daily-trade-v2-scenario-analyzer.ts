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

export const DAILY_TRADE_V2_PROFIT_ZONE_LEVELS = Object.freeze([
  20, 30, 40, 50, 60, 70, 80, 90, 100,
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

export type DailyTradeV2ProfitZone = Readonly<{
  firstReachedAtUtcSeconds: number | null;
  firstReachSource: "completed_close" | "exit" | null;
  longestConsecutiveMinutesAtOrAbove: number;
  lowerBoundPercent: number;
  minutesFromEntryToFirstReach: number | null;
  observedOutcome: "did_not_reach" | "dropped_before_next" | "exited_before_next" | "reached_next";
  profitAvailableAtLevelGrossDecimal: string | null;
  profitTakenInZoneGrossDecimal: string;
  quantitySoldInZoneDecimal: string;
  reachedNextLevel: boolean;
  totalCompletedMinutesInZone: number;
  upperBoundPercent: number | null;
}>;

export type DailyTradeV2ScenarioAnalysis = Readonly<{
  calculatedFinalGrossResultDecimal: string;
  calculatedFinalNetResultDecimal: string | null;
  feesComplete: boolean;
  firstRedAfterQualificationAtUtcSeconds: number | null;
  primaryQualification: DailyTradeV2ProfitQualification | null;
  profitZones: readonly DailyTradeV2ProfitZone[];
  qualifications: readonly DailyTradeV2ProfitQualification[];
  scaleOut: DailyTradeV2ScaleOut;
}>;

type PathPoint = Readonly<{
  averageEntryPrice: Decimal;
  basisVersion: number;
  closePrice: Decimal;
  grossResult: Decimal;
  openQuantity: Decimal;
  openShareReturnPercent: number;
  time: number;
}>;

type ProfitObservation = Readonly<{
  averageEntryPrice: Decimal;
  basisVersion: number;
  openQuantity: Decimal;
  openShareReturnPercent: number;
  source: "completed_close" | "exit";
  time: number;
}>;

type ExitProfit = Readonly<{
  grossProfit: Decimal;
  quantity: Decimal;
  returnPercent: number;
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
  let previousBasisVersion: number | null = null;
  let previousTime: number | null = null;
  for (const point of points) {
    if (point.openShareReturnPercent + Number.EPSILON < rule.thresholdPercent) {
      consecutive = 0;
      previousBasisVersion = null;
      previousTime = null;
      continue;
    }
    consecutive = previousTime !== null && previousBasisVersion === point.basisVersion && point.time - previousTime === 60
      ? consecutive + 1
      : 1;
    previousBasisVersion = point.basisVersion;
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

function buildProfitZones(input: Readonly<{
  entryAtUtcSeconds: number;
  exitProfits: readonly ExitProfit[];
  observations: readonly ProfitObservation[];
}>): readonly DailyTradeV2ProfitZone[] {
  const completedCloses = input.observations.filter((observation) => observation.source === "completed_close");
  return Object.freeze(DAILY_TRADE_V2_PROFIT_ZONE_LEVELS.map((lowerBoundPercent, index) => {
    const upperBoundPercent = DAILY_TRADE_V2_PROFIT_ZONE_LEVELS[index + 1] ?? null;
    const firstReachedIndex = input.observations.findIndex((observation) =>
      observation.openShareReturnPercent + Number.EPSILON >= lowerBoundPercent);
    const firstReached = firstReachedIndex < 0 ? null : input.observations[firstReachedIndex]!;
    const reachedNextLevel = firstReached !== null && upperBoundPercent !== null &&
      input.observations.slice(firstReachedIndex).some((observation) =>
        observation.openShareReturnPercent + Number.EPSILON >= upperBoundPercent);
    let observedOutcome: DailyTradeV2ProfitZone["observedOutcome"] = "did_not_reach";
    if (firstReached) {
      observedOutcome = upperBoundPercent !== null &&
        firstReached.openShareReturnPercent + Number.EPSILON >= upperBoundPercent
        ? "reached_next"
        : "exited_before_next";
      for (let observationIndex = firstReachedIndex + 1;
        observationIndex < input.observations.length && observedOutcome === "exited_before_next";
        observationIndex += 1) {
        const observation = input.observations[observationIndex]!;
        if (upperBoundPercent !== null &&
            observation.openShareReturnPercent + Number.EPSILON >= upperBoundPercent) {
          observedOutcome = "reached_next";
        } else if (observation.openShareReturnPercent + Number.EPSILON < lowerBoundPercent) {
          observedOutcome = "dropped_before_next";
        }
      }
    }

    let longestConsecutiveMinutesAtOrAbove = 0;
    let currentConsecutive = 0;
    let previousBasisVersion: number | null = null;
    let previousTime: number | null = null;
    for (const close of completedCloses) {
      if (close.openShareReturnPercent + Number.EPSILON < lowerBoundPercent) {
        currentConsecutive = 0;
        previousBasisVersion = null;
        previousTime = null;
        continue;
      }
      currentConsecutive = previousTime !== null && previousBasisVersion === close.basisVersion &&
        close.time - previousTime === 60
        ? currentConsecutive + 1
        : 1;
      previousBasisVersion = close.basisVersion;
      previousTime = close.time;
      longestConsecutiveMinutesAtOrAbove = Math.max(longestConsecutiveMinutesAtOrAbove, currentConsecutive);
    }

    const exitProfits = input.exitProfits.filter((exit) =>
      exit.returnPercent + Number.EPSILON >= lowerBoundPercent &&
      (upperBoundPercent === null || exit.returnPercent < upperBoundPercent));
    const profitTaken = exitProfits.reduce((total, exit) => total.plus(Decimal.max(exit.grossProfit, 0)), new Decimal(0));
    const quantitySold = exitProfits.reduce((total, exit) =>
      exit.grossProfit.isPositive() ? total.plus(exit.quantity) : total, new Decimal(0));
    const profitAvailable = firstReached
      ? firstReached.averageEntryPrice
          .times(lowerBoundPercent)
          .dividedBy(100)
          .times(firstReached.openQuantity)
      : null;
    return Object.freeze({
      firstReachedAtUtcSeconds: firstReached?.time ?? null,
      firstReachSource: firstReached?.source ?? null,
      longestConsecutiveMinutesAtOrAbove,
      lowerBoundPercent,
      minutesFromEntryToFirstReach: firstReached
        ? Math.max(0, (firstReached.time - input.entryAtUtcSeconds) / 60)
        : null,
      observedOutcome,
      profitAvailableAtLevelGrossDecimal: profitAvailable?.toFixed() ?? null,
      profitTakenInZoneGrossDecimal: profitTaken.toFixed(),
      quantitySoldInZoneDecimal: quantitySold.toFixed(),
      reachedNextLevel,
      totalCompletedMinutesInZone: completedCloses.filter((close) =>
        close.openShareReturnPercent + Number.EPSILON >= lowerBoundPercent &&
        (upperBoundPercent === null || close.openShareReturnPercent < upperBoundPercent)).length,
      upperBoundPercent,
    });
  }));
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
  const observations: ProfitObservation[] = [];
  const exitProfits: ExitProfit[] = [];
  const reductions: Reduction[] = [];
  let averageEntryPrice: Decimal | null = null;
  let positionQuantity = new Decimal(0);
  let maximumOpenQuantity = new Decimal(0);
  let realizedGross = new Decimal(0);
  let candleIndex = 0;
  let basisVersion = 0;
  const entryAtUtcSeconds = events.find(({ event }) => event.kind === "entry")?.time ?? events[0]!.time;

  const appendCompletedClosesBefore = (eventTime: number) => {
    while (candleIndex < candles.length) {
      const candle = candles[candleIndex]!;
      const closeTime = candle.time + 60;
      if (closeTime > eventTime) break;
      if (averageEntryPrice && positionQuantity.isPositive()) {
        const perShare = directionMove(input.direction, averageEntryPrice, candle.close);
        pathPoints.push(Object.freeze({
          averageEntryPrice,
          basisVersion,
          closePrice: candle.close,
          grossResult: realizedGross.plus(perShare.times(positionQuantity)),
          openQuantity: positionQuantity,
          openShareReturnPercent: perShare.dividedBy(averageEntryPrice).times(100).toNumber(),
          time: closeTime,
        }));
        observations.push(Object.freeze({
          averageEntryPrice,
          basisVersion,
          openQuantity: positionQuantity,
          openShareReturnPercent: perShare.dividedBy(averageEntryPrice).times(100).toNumber(),
          source: "completed_close",
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
      basisVersion += 1;
      maximumOpenQuantity = Decimal.max(maximumOpenQuantity, positionQuantity);
      continue;
    }
    if (!averageEntryPrice || positionQuantity.isZero()) continue;
    const closingQuantity = Decimal.min(positionQuantity, quantity);
    const perShare = directionMove(input.direction, averageEntryPrice, price);
    const returnPercent = perShare.dividedBy(averageEntryPrice).times(100).toNumber();
    const grossProfit = perShare.times(closingQuantity);
    observations.push(Object.freeze({
      averageEntryPrice,
      basisVersion,
      openQuantity: positionQuantity,
      openShareReturnPercent: returnPercent,
      source: "exit",
      time,
    }));
    exitProfits.push(Object.freeze({ grossProfit, quantity: closingQuantity, returnPercent }));
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
  const profitZones = buildProfitZones({
    entryAtUtcSeconds,
    exitProfits,
    observations,
  });

  return Object.freeze({
    calculatedFinalGrossResultDecimal: realizedGross.toFixed(),
    calculatedFinalNetResultDecimal: feesComplete ? realizedGross.plus(totalFees).toFixed() : null,
    feesComplete,
    firstRedAfterQualificationAtUtcSeconds: firstRedAfterQualification?.time ?? null,
    primaryQualification,
    profitZones,
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
