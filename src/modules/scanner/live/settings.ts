import type { DeclineControls, FocusControls, MomentumDetectionControls, MomentumDetectionSessionControls, MomentumLiquidityBypassControls, PremarketPullbackControls, ScannerConfiguration, ScannerSession, ScreenControls, ScreenFilters } from "./contracts";

const SESSIONS: readonly ScannerSession[] = ["premarket", "regular", "after_hours"];
const FILTER_KEYS = ["minimumPrice", "maximumPrice", "maximumMarketCap", "maximumFloat", "minimumVolume", "minimumDollarVolume", "minimumSessionGain", "maximumSpreadPercent"];
const FOCUS_KEYS = ["maximumStocks", "confirmationScans", "replacementImprovementPercent", "minimumOneMinuteGain", "minimumFiveMinuteGain", "minimumVolumeAcceleration", "minimumOneMinuteDollarVolume"];
const MOMENTUM_DETECTION_KEYS=["immediateVolumeRateMultiple","buildingVolumeRateMultiple","minimumEpisodeShares","minimumEpisodeDollarVolume","minimumEpisodeFloatTurnoverPercent","priceBurstPercent","maximumPriceBurstSeconds","buildingConfirmationScans","episodeQuietScans","episodeQuietSeconds"];
const detection=(shares:number,dollars:number):MomentumDetectionSessionControls=>Object.freeze({immediateVolumeRateMultiple:5,buildingVolumeRateMultiple:2,
  minimumEpisodeShares:shares,minimumEpisodeDollarVolume:dollars,minimumEpisodeFloatTurnoverPercent:.05,priceBurstPercent:1.5,maximumPriceBurstSeconds:30,
  buildingConfirmationScans:2,episodeQuietScans:3,episodeQuietSeconds:90});
export const DEFAULT_MOMENTUM_DETECTION:MomentumDetectionControls=Object.freeze({premarket:detection(10_000,10_000),regular:detection(25_000,25_000),after_hours:detection(10_000,10_000)});
export const DEFAULT_MOMENTUM_LIQUIDITY_BYPASS:MomentumLiquidityBypassControls=Object.freeze({premarket:false,regular:false,after_hours:false});
export function momentumDetectionControls(configuration:ScannerConfiguration):MomentumDetectionControls{return configuration.momentumDetection??DEFAULT_MOMENTUM_DETECTION;}
export function momentumLiquidityBypassControls(configuration:ScannerConfiguration):MomentumLiquidityBypassControls{return configuration.momentumLiquidityBypass??DEFAULT_MOMENTUM_LIQUIDITY_BYPASS;}
function record(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function bounded(value: unknown, minimum: number, maximum: number, nullable = false): boolean {
  return nullable && value === null || typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}
function filtersValid(value: unknown): value is ScreenFilters {
  if (!record(value) || !exactKeys(value, FILTER_KEYS)) return false;
  return bounded(value.minimumPrice, 0, 1_000_000) && bounded(value.maximumPrice, 0.000001, 1_000_000, true)
    && (value.maximumPrice === null || Number(value.maximumPrice) >= Number(value.minimumPrice))
    && bounded(value.maximumMarketCap, 1, 500_000_000) && bounded(value.maximumFloat, 1, 1e12, true)
    && bounded(value.minimumVolume, 0, 1e12) && bounded(value.minimumDollarVolume, 0, 1e15)
    && bounded(value.minimumSessionGain, -100, 100_000, true) && bounded(value.maximumSpreadPercent, 0.01, 100, true);
}
function focusValid(value: unknown): value is FocusControls {
  if (!record(value) || !exactKeys(value, FOCUS_KEYS)) return false;
  return Number.isInteger(value.maximumStocks) && bounded(value.maximumStocks, 1, 4000)
    && Number.isInteger(value.confirmationScans) && bounded(value.confirmationScans, 1, 6)
    && bounded(value.replacementImprovementPercent, 0, 100)
    && bounded(value.minimumOneMinuteGain, 0, 100_000) && bounded(value.minimumFiveMinuteGain, 0, 100_000)
    && bounded(value.minimumVolumeAcceleration, 1, 100_000)
    && bounded(value.minimumOneMinuteDollarVolume, 1, 1e15);
}
function controlsValid(value: unknown): value is ScreenControls {
  if (!record(value) || !record(value.filters)) return false;
  const filters = value.filters;
  return exactKeys(value, ["displayLimit", "filters", "focus"])
    && Number.isInteger(value.displayLimit) && bounded(value.displayLimit, 1, 4000)
    && exactKeys(filters, SESSIONS)
    && SESSIONS.every(session => filtersValid(filters[session])) && focusValid(value.focus);
}
function momentumDetectionSessionValid(value:unknown):value is MomentumDetectionSessionControls{return record(value)&&exactKeys(value,MOMENTUM_DETECTION_KEYS)
  &&bounded(value.immediateVolumeRateMultiple,1,100_000)&&bounded(value.buildingVolumeRateMultiple,1,100_000)
  &&Number(value.immediateVolumeRateMultiple)>=Number(value.buildingVolumeRateMultiple)
  &&bounded(value.minimumEpisodeShares,1,1e12)&&bounded(value.minimumEpisodeDollarVolume,1,1e15)
  &&bounded(value.minimumEpisodeFloatTurnoverPercent,.000001,100_000)
  &&bounded(value.priceBurstPercent,0.01,100_000)&&bounded(value.maximumPriceBurstSeconds,5,120)
  &&Number.isInteger(value.buildingConfirmationScans)&&bounded(value.buildingConfirmationScans,2,10)
  &&Number.isInteger(value.episodeQuietScans)&&bounded(value.episodeQuietScans,1,20)
  &&bounded(value.episodeQuietSeconds,15,600);}
function momentumDetectionValid(value:unknown):value is MomentumDetectionControls{return record(value)&&exactKeys(value,SESSIONS)
  &&SESSIONS.every(session=>momentumDetectionSessionValid(value[session]));}
function momentumLiquidityBypassValid(value:unknown):value is MomentumLiquidityBypassControls{return record(value)&&exactKeys(value,SESSIONS)
  &&SESSIONS.every(session=>typeof value[session]==="boolean");}
function declinesValid(value:unknown):value is DeclineControls {
  return record(value)&&exactKeys(value,["enabled","displayLimit","minimumDropPercent","windowMinutes","retentionMinutes"])
    &&typeof value.enabled==="boolean"&&Number.isInteger(value.displayLimit)&&bounded(value.displayLimit,1,100)
    &&bounded(value.minimumDropPercent,1,99)&&bounded(value.windowMinutes,0.5,15)&&bounded(value.retentionMinutes,1,60);
}
export function validateConfiguration(value: unknown): ScannerConfiguration {
  if (!record(value) || !exactKeys(value, ["version", "revision", "enabled", "updatedAtUtc", "gainers", "momentum",...(Object.hasOwn(value,"momentumDetection")?["momentumDetection"]:[]),...(Object.hasOwn(value,"momentumLiquidityBypass")?["momentumLiquidityBypass"]:[]),...(Object.hasOwn(value,"declines")?["declines"]:[]),...(Object.hasOwn(value,"premarketPullbacks")?["premarketPullbacks"]:[])])
    || value.version !== 1 || !Number.isSafeInteger(value.revision) || Number(value.revision) < 0
    || typeof value.enabled !== "boolean"
    || !(value.updatedAtUtc === null || typeof value.updatedAtUtc === "string" && Number.isFinite(Date.parse(value.updatedAtUtc)))
    || !controlsValid(value.gainers) || !controlsValid(value.momentum)
    || Object.hasOwn(value,"momentumDetection")&&!momentumDetectionValid(value.momentumDetection)
    || Object.hasOwn(value,"momentumLiquidityBypass")&&!momentumLiquidityBypassValid(value.momentumLiquidityBypass)
    || Object.hasOwn(value,"declines")&&!declinesValid(value.declines)
    || Object.hasOwn(value,"premarketPullbacks")&&!premarketPullbacksValid(value.premarketPullbacks)) throw Error("scanner_settings_invalid");
  return structuredClone(value) as ScannerConfiguration;
}
function premarketPullbacksValid(value:unknown):value is PremarketPullbackControls {
  return record(value)&&exactKeys(value,["enabled","displayLimit","minimumPullbackPercent","removeWithinPercent"])
    &&typeof value.enabled==="boolean"&&Number.isInteger(value.displayLimit)&&bounded(value.displayLimit,1,100)
    &&bounded(value.minimumPullbackPercent,1,99)&&bounded(value.removeWithinPercent,0,99)
    &&Number(value.removeWithinPercent)<=Number(value.minimumPullbackPercent);
}

/** Proposed editable starting settings, not validated trading thresholds or owner acceptance. */
export function initialConfiguration(): ScannerConfiguration {
  const filters = (minimumSessionGain: number | null): Record<ScannerSession, ScreenFilters> => Object.fromEntries(SESSIONS.map(session => [session, {
    minimumPrice: 0, maximumPrice: null, maximumMarketCap: 100_000_000, maximumFloat: null,
    minimumVolume: session === "regular" ? 300_000 : session === "premarket" ? 15_000 : 40_000,
    minimumDollarVolume: session === "regular" ? 500_000 : session === "premarket" ? 15_000 : 50_000,
    minimumSessionGain, maximumSpreadPercent: session === "regular" ? 2 : 3,
  }])) as Record<ScannerSession, ScreenFilters>;
  const focus = (one: number, five: number): FocusControls => ({ maximumStocks: 3, confirmationScans: 2,
    replacementImprovementPercent: 20, minimumOneMinuteGain: one, minimumFiveMinuteGain: five,
    minimumVolumeAcceleration: 2, minimumOneMinuteDollarVolume: 25_000 });
  return { version: 1, revision: 0, enabled: false, updatedAtUtc: null,momentumDetection:DEFAULT_MOMENTUM_DETECTION,momentumLiquidityBypass:DEFAULT_MOMENTUM_LIQUIDITY_BYPASS,
    gainers: { displayLimit: 20, filters: filters(3), focus: focus(1, 2) },
    momentum: { displayLimit: 20, filters: filters(null), focus: focus(2.5, 3) } };
}

export function updateConfiguration(current: ScannerConfiguration, candidate: unknown, now: number): ScannerConfiguration {
  const next = validateConfiguration(candidate);
  if (next.revision !== current.revision) throw Error("scanner_settings_conflict");
  if (current.revision >= Number.MAX_SAFE_INTEGER) throw Error("scanner_settings_revision_limit");
  return { ...next, revision: current.revision + 1, updatedAtUtc: new Date(now).toISOString() };
}
