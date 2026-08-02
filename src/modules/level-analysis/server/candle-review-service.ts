import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  analyzeTradeCandles,
  type TradeCandle,
} from "@/src/lib/trade-candle-analysis/candle-analysis";
import { selectExecutionRelevantPatterns } from "@/src/lib/trade-candle-analysis/execution-relevance";
import {
  calculateAdr20,
  calculateIndicatorPoints,
  indicatorSnapshot,
} from "@/src/lib/trade-candle-analysis/indicator-context";
import { detectMicroCapCandlePatterns } from "@/src/lib/trade-candle-analysis/pattern-detection";
import type {
  CandleReviewAnalysis,
  CandleReviewPageModel,
  CandleReviewRecord,
  CandleReviewTarget,
  MarketDataProvider,
  MarketDataProviderResult,
  NormalizedMarketCandle,
} from "../contracts/candle-review-contracts";
import type { CandleReviewRepository, PersistedMarketDataAttempt } from "./candle-review-repository";

const ONE_MINUTE_MAX_RANGE_SECONDS = 7 * 24 * 60 * 60;
const PRIMARY_BEFORE_ENTRY_SECONDS = 30 * 60;
const PRIMARY_AFTER_EXIT_SECONDS = 60 * 60;
const DAILY_CONTEXT_SECONDS = 180 * 24 * 60 * 60;
const REFRESH_COOLDOWN_MS = 60 * 1000;

function seconds(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) platformFailure("TRADERLINK_CANDLE_REVIEW_INVALID");
  return Math.floor(parsed / 1000);
}

function numericCandles(candles: readonly NormalizedMarketCandle[]): readonly TradeCandle[] {
  return Object.freeze(candles.map((candle) => Object.freeze({
    time: candle.time,
    open: Number(candle.openDecimal),
    high: Number(candle.highDecimal),
    low: Number(candle.lowDecimal),
    close: Number(candle.closeDecimal),
    volume: Number(candle.volumeDecimal),
  })));
}

function noCoverageAnalysis(): CandleReviewAnalysis {
  const unavailable = (detail: string) => Object.freeze({
    kind: "no_feedback" as const,
    title: "No feedback",
    detail,
  });
  return Object.freeze({
    entryTiming: unavailable("Required one-minute candle coverage was unavailable."),
    exitTiming: unavailable("Required one-minute candle coverage was unavailable."),
    profitGiveback: unavailable("The held-position candle window could not be verified."),
  });
}

function unsupportedAnalysis(): CandleReviewAnalysis {
  const unavailable = Object.freeze({
    kind: "no_feedback" as const,
    title: "No feedback",
    detail: "This trade needs a reviewed longer-duration market-data contract before analysis can be calculated.",
  });
  return Object.freeze({
    entryTiming: unavailable,
    exitTiming: unavailable,
    profitGiveback: unavailable,
  });
}

async function requestProvider(
  provider: MarketDataProvider,
  target: CandleReviewTarget,
  interval: "1m" | "1d",
  startTime: number,
  endTime: number,
  now: () => Date,
): Promise<PersistedMarketDataAttempt> {
  const requestedAtUtc = now().toISOString();
  let result: MarketDataProviderResult;
  try {
    result = await provider.fetch({
      symbol: target.symbol,
      interval,
      startTime,
      endTime,
      includeExtendedHours: true,
    });
  } catch {
    result = Object.freeze({
      ok: false,
      code: "provider_unavailable",
      failureReasonCode: "provider_adapter_threw",
      exchangeTimezone: null,
      utcOffsetSeconds: null,
    });
  }
  return Object.freeze({
    interval,
    startTime,
    endTime,
    requestedAtUtc,
    completedAtUtc: now().toISOString(),
    result,
  });
}

export class CandleReviewService {
  constructor(
    private readonly repository: CandleReviewRepository,
    private readonly provider: MarketDataProvider,
    private readonly now: () => Date = () => new Date(),
  ) {}

  pageModel(
    scope: AccountScope,
    roundTripId: string,
    expectedAccountSelectionRef: string,
  ): CandleReviewPageModel | null {
    const target = this.repository.findTarget(scope, roundTripId);
    return target ? Object.freeze({
      expectedAccountSelectionRef,
      target,
      review: this.repository.readCurrent(scope, target),
    }) : null;
  }

  async run(scope: AccountScope, roundTripId: string): Promise<Readonly<{
    reused: boolean;
    record: CandleReviewRecord;
  }>> {
    const target = this.repository.findTarget(scope, roundTripId);
    if (!target) platformFailure("TRADERLINK_CANDLE_REVIEW_INVALID");
    const current = this.repository.readCurrent(scope, target);
    const now = this.now();
    if (current && Date.parse(current.refreshAvailableAtUtc) > now.getTime()) {
      return Object.freeze({ reused: true, record: current });
    }
    const analyzedAtUtc = now.toISOString();
    const refreshAvailableAtUtc = new Date(now.getTime() + REFRESH_COOLDOWN_MS).toISOString();
    const entryTime = seconds(target.openedAtUtc);
    const exitTime = seconds(target.closedAtUtc);
    const primaryStart = entryTime - PRIMARY_BEFORE_ENTRY_SECONDS;
    const primaryEnd = exitTime + PRIMARY_AFTER_EXIT_SECONDS;
    if (
      target.assetClass !== "stock" ||
      primaryEnd - primaryStart > ONE_MINUTE_MAX_RANGE_SECONDS
    ) {
      const record = this.repository.persist(scope, target, {
        status: "unsupported",
        analysis: unsupportedAnalysis(),
        observations: Object.freeze([]),
        indicators: Object.freeze([]),
        primary: null,
        daily: null,
        refreshAvailableAtUtc,
        analyzedAtUtc,
      });
      return Object.freeze({ reused: false, record });
    }

    const primary = await requestProvider(
      this.provider,
      target,
      "1m",
      primaryStart,
      primaryEnd,
      this.now,
    );
    if (!primary.result.ok) {
      const record = this.repository.persist(scope, target, {
        status: primary.result.code === "provider_unavailable"
          ? "provider_unavailable"
          : "no_coverage",
        analysis: noCoverageAnalysis(),
        observations: Object.freeze([]),
        indicators: Object.freeze([]),
        primary,
        daily: null,
        refreshAvailableAtUtc,
        analyzedAtUtc,
      });
      return Object.freeze({ reused: false, record });
    }

    const daily = await requestProvider(
      this.provider,
      target,
      "1d",
      exitTime - DAILY_CONTEXT_SECONDS,
      exitTime + 24 * 60 * 60,
      this.now,
    );
    const candles = numericCandles(primary.result.candles);
    const trade = Object.freeze({
      direction: target.direction,
      entryPrice: Number(target.entryPriceDecimal),
      entryTime,
      exitPrice: Number(target.exitPriceDecimal),
      exitTime,
    });
    const analysis = analyzeTradeCandles({ candles, trade });
    const noUsableCoverage = [
      analysis.entryTiming,
      analysis.exitTiming,
      analysis.profitGiveback,
    ].every((feedback) => feedback.kind === "no_feedback");
    const indicatorPoints = calculateIndicatorPoints(candles);
    const dailyCandles = daily.result.ok ? numericCandles(daily.result.candles) : Object.freeze([]);
    const adr20 = daily.result.ok
      ? calculateAdr20(dailyCandles.map((candle) => candle.high - candle.low))
      : null;
    const indicators = Object.freeze([
      indicatorSnapshot({ adr20, phase: "entry", points: indicatorPoints, time: entryTime }),
      indicatorSnapshot({ adr20, phase: "exit", points: indicatorPoints, time: exitTime }),
    ].filter((value): value is NonNullable<typeof value> => value !== null));
    const observations = Object.freeze(selectExecutionRelevantPatterns({
      candles,
      events: detectMicroCapCandlePatterns(candles),
      trade,
    }));
    const record = this.repository.persist(scope, target, {
      status: noUsableCoverage ? "no_coverage" : "ready",
      analysis,
      observations,
      indicators,
      primary,
      daily,
      refreshAvailableAtUtc,
      analyzedAtUtc,
    });
    return Object.freeze({ reused: false, record });
  }
}
