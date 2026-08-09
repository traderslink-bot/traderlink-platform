import "server-only";

import { normalizeJournalExecutionLocalTime } from "../imports/journal-value-normalization";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type {
  BrokerImportRangeSeed,
  MoomooImportCoverageInterval,
} from "./moomoo-execution-import-repository";

export const MOOMOO_TRADE_MARKET_BY_ACCOUNT_CODE = Object.freeze({
  1: "HK",
  2: "US",
  6: "SG",
  8: "AU",
  15: "JP",
  111: "BMS",
  112: "CA",
} as const);

type SupportedAccountMarketCode = keyof typeof MOOMOO_TRADE_MARKET_BY_ACCOUNT_CODE;
export type SupportedMoomooMarket = typeof MOOMOO_TRADE_MARKET_BY_ACCOUNT_CODE[SupportedAccountMarketCode];

const MARKET_TIMEZONE: Readonly<Record<BrokerImportRangeSeed["market"], string>> = Object.freeze({
  AU: "Australia/Sydney",
  BMS: "Asia/Kuala_Lumpur",
  CA: "America/Toronto",
  HK: "Asia/Hong_Kong",
  JP: "Asia/Tokyo",
  SG: "Asia/Singapore",
  SH: "Asia/Shanghai",
  SZ: "Asia/Shanghai",
  US: "America/New_York",
});

const MICROSECONDS_PER_DAY = 86_400_000_000;
const MAXIMUM_RANGE_MICROSECONDS = 90 * MICROSECONDS_PER_DAY;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/u;

function assertDate(value: string): void {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "earliestExecutionDate",
    });
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "earliestExecutionDate",
    });
  }
}

function localMidnightMicroseconds(date: string, timezone: string): number {
  return new Date(normalizeJournalExecutionLocalTime(
    `${date} 00:00:00`,
    timezone,
  )).getTime() * 1_000;
}

export function moomooExecutionDateFloorMicroseconds(
  date: string,
  market: BrokerImportRangeSeed["market"],
): number {
  assertDate(date);
  return localMidnightMicroseconds(date, MARKET_TIMEZONE[market]);
}

export function isMoomooExecutionWithinRequestedWindow(input: Readonly<{
  createdMicroseconds: number;
  requestedStartDate: string;
  market: BrokerImportRangeSeed["market"];
  cutoffMicroseconds: number;
}>): boolean {
  const floor = moomooExecutionDateFloorMicroseconds(
    input.requestedStartDate,
    input.market,
  );
  return Number.isSafeInteger(input.createdMicroseconds) &&
    Number.isSafeInteger(input.cutoffMicroseconds) &&
    input.createdMicroseconds >= floor &&
    input.createdMicroseconds <= input.cutoffMicroseconds;
}

export function supportedMoomooMarkets(
  enabledMarketCodes: readonly number[],
): readonly SupportedMoomooMarket[] {
  const markets = enabledMarketCodes.flatMap((code) => {
    const market = MOOMOO_TRADE_MARKET_BY_ACCOUNT_CODE[
      code as SupportedAccountMarketCode
    ];
    return market ? [market] : [];
  });
  return Object.freeze([...new Set(markets)].sort());
}

export type MoomooExecutionImportPlan = Readonly<{
  exactStartMicroseconds: number;
  exactEndMicroseconds: number;
  ranges: readonly BrokerImportRangeSeed[];
  supportedMarkets: readonly SupportedMoomooMarket[];
}>;

function boundedRanges(input: Readonly<{
  markets: readonly SupportedMoomooMarket[];
  startMicroseconds: number;
  endMicroseconds: number;
}>): readonly BrokerImportRangeSeed[] {
  const ranges: BrokerImportRangeSeed[] = [];
  for (const market of input.markets) {
    let rangeEnd = input.endMicroseconds;
    let workSequence = 1;
    while (rangeEnd > input.startMicroseconds) {
      const rangeStart = Math.max(
        input.startMicroseconds,
        rangeEnd - MAXIMUM_RANGE_MICROSECONDS + 1,
      );
      ranges.push(Object.freeze({
        brokerImportRangeId: createCanonicalUuidV4(),
        market,
        workSequence,
        startMicroseconds: rangeStart,
        endMicroseconds: rangeEnd,
      }));
      if (rangeStart === input.startMicroseconds) break;
      rangeEnd = rangeStart;
      workSequence += 1;
    }
  }
  return Object.freeze(ranges);
}

export function planMoomooIncrementalExecutionImport(input: Readonly<{
  earliestExecutionDate: string;
  enabledMarketCodes: readonly number[];
  latestCompletedCutoffAtUtc: string;
  cutoff: Date;
  overlapMilliseconds?: number;
}>): MoomooExecutionImportPlan {
  assertDate(input.earliestExecutionDate);
  const latestCutoff = new Date(input.latestCompletedCutoffAtUtc);
  const overlapMilliseconds = input.overlapMilliseconds ?? 24 * 60 * 60 * 1_000;
  if (
    !Number.isFinite(latestCutoff.getTime()) ||
    !Number.isFinite(input.cutoff.getTime()) ||
    !Number.isSafeInteger(overlapMilliseconds) ||
    overlapMilliseconds < 0
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "incrementalImportCutoff",
    });
  }
  const supportedMarkets = supportedMoomooMarkets(input.enabledMarketCodes);
  if (supportedMarkets.length === 0) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
      stage: "no_supported_trading_market",
    });
  }
  const exactEndMicroseconds = input.cutoff.getTime() * 1_000;
  const earliestFloor = Math.min(...supportedMarkets.map((market) =>
    moomooExecutionDateFloorMicroseconds(input.earliestExecutionDate, market)));
  const exactStartMicroseconds = Math.max(
    earliestFloor,
    (latestCutoff.getTime() - overlapMilliseconds) * 1_000,
  );
  if (
    !Number.isSafeInteger(exactStartMicroseconds) ||
    !Number.isSafeInteger(exactEndMicroseconds) ||
    exactStartMicroseconds <= 0 ||
    exactStartMicroseconds >= exactEndMicroseconds
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "incrementalImportCutoff",
    });
  }
  return Object.freeze({
    exactStartMicroseconds,
    exactEndMicroseconds,
    ranges: boundedRanges({
      markets: supportedMarkets,
      startMicroseconds: exactStartMicroseconds,
      endMicroseconds: exactEndMicroseconds,
    }),
    supportedMarkets,
  });
}

export function planMoomooExecutionImport(input: Readonly<{
  earliestExecutionDate: string;
  enabledMarketCodes: readonly number[];
  cutoff: Date;
  completedCoverage?: readonly MoomooImportCoverageInterval[];
}>): MoomooExecutionImportPlan {
  assertDate(input.earliestExecutionDate);
  if (!Number.isFinite(input.cutoff.getTime())) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "cutoff",
    });
  }
  const supportedMarkets = supportedMoomooMarkets(input.enabledMarketCodes);
  if (supportedMarkets.length === 0) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
      stage: "no_supported_trading_market",
    });
  }
  const exactEndMicroseconds = input.cutoff.getTime() * 1_000;
  const marketStarts = new Map(supportedMarkets.map((market) => [
    market,
    localMidnightMicroseconds(input.earliestExecutionDate, MARKET_TIMEZONE[market]),
  ] as const));
  const exactStartMicroseconds = Math.min(...marketStarts.values());
  if (
    !Number.isSafeInteger(exactStartMicroseconds) ||
    !Number.isSafeInteger(exactEndMicroseconds) ||
    exactStartMicroseconds <= 0 ||
    exactStartMicroseconds >= exactEndMicroseconds
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "earliestExecutionDate",
    });
  }

  const ranges: BrokerImportRangeSeed[] = [];
  for (const market of supportedMarkets) {
    const marketStart = marketStarts.get(market)!;
    const coverage = (input.completedCoverage ?? [])
      .filter((interval) => interval.market === market)
      .map((interval) => Object.freeze({
        start: Math.max(marketStart, interval.startMicroseconds),
        end: Math.min(exactEndMicroseconds, interval.endMicroseconds),
      }))
      .filter((interval) => interval.end > interval.start)
      .sort((left, right) => left.start - right.start || left.end - right.end);
    const merged: Array<{ start: number; end: number }> = [];
    for (const interval of coverage) {
      const previous = merged.at(-1);
      if (previous && interval.start <= previous.end) {
        previous.end = Math.max(previous.end, interval.end);
      } else {
        merged.push({ start: interval.start, end: interval.end });
      }
    }
    const missing: Array<Readonly<{ start: number; end: number }>> = [];
    let cursor = marketStart;
    for (const interval of merged) {
      if (interval.start > cursor) {
        missing.push(Object.freeze({ start: cursor, end: interval.start }));
      }
      cursor = Math.max(cursor, interval.end);
    }
    if (cursor < exactEndMicroseconds) {
      missing.push(Object.freeze({ start: cursor, end: exactEndMicroseconds }));
    }
    const boundaries: Array<Readonly<{ start: number; end: number }>> = [];
    for (const segment of missing.sort((left, right) => right.end - left.end)) {
      let rangeEnd = segment.end;
      while (rangeEnd > segment.start) {
        const rangeStart = Math.max(
          segment.start,
          rangeEnd - MAXIMUM_RANGE_MICROSECONDS + 1,
        );
        boundaries.push(Object.freeze({ start: rangeStart, end: rangeEnd }));
        if (rangeStart === segment.start) break;
        rangeEnd = rangeStart;
      }
    }
    boundaries.forEach((boundary, index) => {
      ranges.push(Object.freeze({
        brokerImportRangeId: createCanonicalUuidV4(),
        market,
        workSequence: index + 1,
        startMicroseconds: boundary.start,
        endMicroseconds: boundary.end,
      }));
    });
  }
  return Object.freeze({
    exactStartMicroseconds,
    exactEndMicroseconds,
    ranges: Object.freeze(ranges),
    supportedMarkets,
  });
}
