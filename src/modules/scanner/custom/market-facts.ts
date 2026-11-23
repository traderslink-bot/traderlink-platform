import Decimal from "decimal.js";
import type { NormalizedSnapshot } from "../live/contracts";
import { SNAPSHOT_MAX_AGE_MS } from "../live/snapshots";
import { scannerVolumeBreakdown } from "../live/volume";
import type { ScanMarketRow } from "./definition";

function observationIsCurrent(at: number | undefined, cutoff: number, maximumAge: number) {
  return at !== undefined && Number.isSafeInteger(at) && Number.isSafeInteger(cutoff) &&
    at > 0 && at <= cutoff && cutoff - at <= maximumAge;
}

const SCAN_QUOTE_MAX_AGE_MS = 30_000;

export const scannerPriceIsCurrent = (at: number | undefined, cutoff: number) =>
  observationIsCurrent(at, cutoff, SNAPSHOT_MAX_AGE_MS);
export const scannerQuoteIsCurrent = (at: number | undefined, cutoff: number) =>
  observationIsCurrent(at, cutoff, SCAN_QUOTE_MAX_AGE_MS);

function quoteSpread({ bid, ask, quoteObservedAt, receivedAt }: NormalizedSnapshot) {
  if (!scannerQuoteIsCurrent(quoteObservedAt, receivedAt) || bid === null || ask === null ||
    !Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask < bid) return null;
  const spread = new Decimal(ask).minus(bid);
  const midpoint = new Decimal(ask).plus(bid).dividedBy(2);
  return { dollars: spread.toNumber(), percent: spread.dividedBy(midpoint).times(100).toNumber() };
}

export function scanRowFromSnapshot(snapshot: NormalizedSnapshot, {
  exchange, country, industry, sector, securityType, collectedCap, float,
}: {
  exchange:ScanMarketRow["exchange"]; country?:string; industry?:string; sector?:ScanMarketRow["sector"]; collectedCap?:number; float?:number;
  securityType?: ScanMarketRow["securityType"];
}): ScanMarketRow {
  const { symbol, session, price, volume, dollarVolume, baseline, dayHigh, dayLow,
    regularClosePrice, receivedAt, providerAt } = snapshot;
  const sessionVwap = volume !== null && volume > 0 && dollarVolume !== null && dollarVolume > 0
    ? dollarVolume / volume : null;
  const change = (from:number|null|undefined) => from && from > 0 ? (price - from) / from * 100 : null;
  const pullback = (high: number | undefined) => high && high > 0 ? Math.max(0, (high - price) / high * 100) : null;
  const range = (high: number | null | undefined, low: number | null | undefined) =>
    typeof high === "number" && typeof low === "number" && Number.isFinite(high) && Number.isFinite(low) &&
    low > 0 && high >= low ? (high - low) / low * 100 : null;

  const spread = quoteSpread(snapshot);
  const fromVwap = change(sessionVwap);
  const openingBaseline = session === "after_hours" ? regularClosePrice : baseline;
  const sessionGap = snapshot.sessionOpen !== undefined && openingBaseline != null && openingBaseline > 0
    ? (snapshot.sessionOpen - openingBaseline) / openingBaseline * 100 : null;
  const hasPriceSourceClock = snapshot.provider === "alpaca" || snapshot.priceTimeBasis !== "session_observation";
  return { symbol, exchange, country, industry, sector, securityType, session, price, volume, dollarVolume,
    ...scannerVolumeBreakdown(snapshot),
    ...(hasPriceSourceClock && Number.isSafeInteger(providerAt) && providerAt > 0 && providerAt <= receivedAt
      ? { priceSourceAt: providerAt } : {}),
    ...(snapshot.halted !== undefined ? {halted:snapshot.halted,tradeResumedAt:snapshot.tradeResumedAt} : {}),
    marketCap:snapshot.marketCap ?? collectedCap ?? null, float:float ?? null,
    ...(spread && snapshot.quoteObservedAt !== undefined ? { quoteObservedAt: snapshot.quoteObservedAt } : {}),
    ...(snapshot.openingRanges ? {openingRanges:snapshot.openingRanges} : {}),
    dayChange:change(baseline), belowHigh:dayHigh > 0 ? (dayHigh - price) / dayHigh * 100 : null, observedAt:receivedAt,
    dailyClosedAt: snapshot.dailyClosedAt, weeklyClosedAt: snapshot.weeklyClosedAt,
    facts:{
      dayHigh,dayLow, aboveLow:change(dayLow),
      dayChangeDollars:baseline != null && baseline > 0 ? new Decimal(price).minus(baseline).toNumber() : null,
      dayRange:dayLow > 0 ? (dayHigh - dayLow) / dayLow * 100 : null,
      sessionVwap, fromVwap, distanceFromVwap: fromVwap === null ? null : Math.abs(fromVwap),
      bidAskSpread:spread?.dollars ?? null,bidAskSpreadPercent:spread?.percent ?? null,
      averageDailyVolume20:snapshot.averageDailyVolume20,averageDailyRange20:snapshot.averageDailyRange20,
      volumeVsDailyAverage20:session === "regular" && snapshot.averageDailyVolume20 && volume != null
        ? volume / snapshot.averageDailyVolume20 : null,
      closedDailyReturn:snapshot.closedDailyReturn,closedWeeklyReturn:snapshot.closedWeeklyReturn,
      dailyCloseVsSma20:snapshot.dailyCloseVsSma20,weeklyCloseVsSma4:snapshot.weeklyCloseVsSma4,
      dailyRelativeToSpy:snapshot.dailyRelativeToSpy,weeklyRelativeToSpy:snapshot.weeklyRelativeToSpy,
      pullbackFromFiveSessionHigh:pullback(snapshot.recentDailyHighs?.lastFiveSessions),
      pullbackFromSevenDayHigh:pullback(snapshot.recentDailyHighs?.lastSevenDays),
      pullbackFromPreviousWeekHigh:pullback(snapshot.recentDailyHighs?.previousWeek),
      floatTurnover:float && float > 0 && volume !== null ? volume / float * 100 : null,
      previousDayClose:baseline,previousDayHigh:snapshot.previousDayHigh,previousDayLow:snapshot.previousDayLow,
      fromPreviousDayHigh:change(snapshot.previousDayHigh),fromPreviousDayLow:change(snapshot.previousDayLow),
      sessionOpen:snapshot.sessionOpen ?? null,sessionGap,
      premarketHigh:snapshot.premarketHigh, premarketLow:snapshot.premarketLow, premarketVolume:snapshot.premarketVolume,
      premarketRange:range(snapshot.premarketHigh, snapshot.premarketLow),
      fromPremarketHigh:change(snapshot.premarketHigh), fromPremarketLow:change(snapshot.premarketLow),
      regularHigh:snapshot.regularHigh, regularLow:snapshot.regularLow, regularVolume:snapshot.regularVolume,
      regularRange:range(snapshot.regularHigh, snapshot.regularLow),
      fromRegularHigh:change(snapshot.regularHigh), fromRegularLow:change(snapshot.regularLow),
      postMarketHigh:snapshot.postMarketHigh, postMarketLow:snapshot.postMarketLow, postMarketVolume:snapshot.postMarketVolume,
      postMarketRange:range(snapshot.postMarketHigh, snapshot.postMarketLow),
      fromPostMarketHigh:change(snapshot.postMarketHigh), fromPostMarketLow:change(snapshot.postMarketLow),
      postMarketChange:session === "after_hours" ? change(regularClosePrice) : null,
    },
  };
}
