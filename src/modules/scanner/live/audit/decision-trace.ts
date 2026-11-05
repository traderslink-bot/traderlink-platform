import { createHash } from "node:crypto";
import type { FocusControls, LiveScannerRow, ScannerConfiguration, ScreenFilters } from "../contracts";
import type { ScannerAuditScore } from "./contracts";

export function scannerConfigurationHash(configuration: ScannerConfiguration): string {
  const canonical=(value:unknown):unknown=>Array.isArray(value)?value.map(canonical):value&&typeof value==="object"
    ?Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([left],[right])=>left.localeCompare(right)).map(([key,item])=>[key,canonical(item)]))
    :value;
  return createHash("sha256").update(JSON.stringify(canonical(configuration))).digest("hex");
}

export function scannerFilterFailures(row: LiveScannerRow, filters: ScreenFilters): readonly string[] {
  const failures: string[] = [];
  if (row.price < filters.minimumPrice) failures.push("price_below_minimum");
  if (filters.maximumPrice !== null && row.price > filters.maximumPrice) failures.push("price_above_maximum");
  if (row.marketCapAtCollection > filters.maximumMarketCap) failures.push("market_cap_above_maximum");
  if (filters.maximumFloat !== null && row.float > filters.maximumFloat) failures.push("float_above_maximum");
  if (row.volume === null) failures.push("volume_unavailable");
  else if (row.volume < filters.minimumVolume) failures.push("volume_below_minimum");
  if (row.dollarVolume === null) failures.push("dollar_volume_unavailable");
  else if (row.dollarVolume < filters.minimumDollarVolume) failures.push("dollar_volume_below_minimum");
  if (filters.minimumSessionGain !== null) {
    if (row.sessionGain === null) failures.push("gain_unavailable");
    else if (row.sessionGain < filters.minimumSessionGain) failures.push("gain_below_minimum");
  }
  if (filters.maximumSpreadPercent !== null) {
    if (row.spreadPercent === null) failures.push("spread_unavailable");
    else if (row.spreadPercent > filters.maximumSpreadPercent) failures.push("spread_above_maximum");
  }
  return Object.freeze(failures);
}

const EARLY_LIQUIDITY_SIGNALS = new Set(["volume_ignition", "building_volume", "developing_activity"]);

/**
 * Strong early-event signals already require two of episode shares, episode
 * dollar volume and float turnover. Let that adaptive liquidity proof replace
 * only the cumulative session volume floors; all risk and universe filters
 * continue to apply. A price burst alone never receives this exception.
 */
export function scannerMomentumFilterFailures(row: LiveScannerRow, filters: ScreenFilters, allowEarlyLiquidityBypass = false): readonly string[] {
  const failures = scannerFilterFailures(row, filters);
  const adaptiveLiquidity = allowEarlyLiquidityBypass && (row.momentumSignals?.some(signal => EARLY_LIQUIDITY_SIGNALS.has(signal)) ?? false);
  return adaptiveLiquidity
    ? Object.freeze(failures.filter(reason => reason !== "volume_below_minimum" && reason !== "dollar_volume_below_minimum"))
    : failures;
}

export function scannerMovementFailures(row: LiveScannerRow, controls: FocusControls): readonly string[] {
  const one = row.activity.oneMinuteGain;
  const five = row.activity.fiveMinuteGain;
  return row.momentumState==="cooling"||Boolean(row.momentumSignals?.length)||one !== null && one >= controls.minimumOneMinuteGain || five !== null && five >= controls.minimumFiveMinuteGain
    ? Object.freeze([])
    : Object.freeze([one === null && five === null ? "price_windows_warming" : "recent_price_move_below_minimum"]);
}

export function scannerMomentumScore(row: LiveScannerRow, controls: FocusControls, filters: ScreenFilters): ScannerAuditScore {
  const activity = row.activity;
  const gain = Math.max(0,activity.intervalGain??0,activity.oneMinuteGain ?? 0,(activity.fiveMinuteGain ?? 0)/5);
  const gainFloor = Math.max(0.1,controls.minimumOneMinuteGain,controls.minimumFiveMinuteGain/5);
  const price = Math.min(gain/gainFloor,3)/3*40;
  const acceleration=Math.max(activity.volumeAcceleration??0,activity.intervalVolumeRateMultiple??0);
  const volumeAcceleration = Math.min(acceleration/Math.max(1,controls.minimumVolumeAcceleration),3)/3*25;
  const relativeVolume = row.relativeVolume === null ? 0 : Math.min(row.relativeVolume/5,1)*15;
  const recentDollars=Math.max(activity.oneMinuteDollarVolume??0,activity.episodeDollarVolume??0);
  const dollarVolume = Math.min(recentDollars/Math.max(1,controls.minimumOneMinuteDollarVolume),3)/3*15;
  const spreadCeiling = filters.maximumSpreadPercent ?? 3;
  const spread = row.spreadPercent === null ? 0 : Math.max(0,1-row.spreadPercent/Math.max(0.01,spreadCeiling))*5;
  return { total:price+volumeAcceleration+relativeVolume+dollarVolume+spread,
    price,volumeAcceleration,relativeVolume,dollarVolume,spread };
}
