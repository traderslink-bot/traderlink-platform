import { indicatorSignalLabels, type IntradayIndicatorFrame } from "../../market-data/indicators/indicator-signals";

export const scanSignalFrames = ["1m","5m","15m"] as const;
export type ScanSignalFrame = IntradayIndicatorFrame;
const additionalSignals = {
  macdCrossUp:"MACD crossed above its signal",
  macdCrossDown:"MACD crossed below its signal",
  macdZeroUp:"MACD crossed above zero",
  macdZeroDown:"MACD crossed below zero",
  upperBandBreak:"Closed above the upper Bollinger Band",
  lowerBandBreak:"Closed below the lower Bollinger Band",
  upperBandReentry:"Re-entered from above the Bollinger Bands",
  lowerBandReentry:"Re-entered from below the Bollinger Bands",
  stochasticCrossUp:"Stochastic %K crossed above %D",
  stochasticCrossDown:"Stochastic %K crossed below %D",
  stochasticOversoldExit:"Stochastic recovered above 20",
  stochasticOverboughtExit:"Stochastic fell below 80",
  priceEma20Up:"Price crossed above EMA 20",
  priceEma20Down:"Price crossed below EMA 20",
  priceSma50Up:"Price crossed above SMA 50",
  priceSma50Down:"Price crossed below SMA 50",
} as const;
const structureLabels = {
  higherSwingHigh:"Confirmed higher swing high", lowerSwingHigh:"Confirmed lower swing high",
  higherSwingLow:"Confirmed higher swing low", lowerSwingLow:"Confirmed lower swing low",
  structureBreakUp:"Bullish break of structure", structureBreakDown:"Bearish break of structure",
  characterChangeUp:"Bullish change of character", characterChangeDown:"Bearish change of character",
  structureRetestUp:"Bullish swing break retest held", structureRetestDown:"Bearish swing break retest held",
  failedStructureUp:"Bullish swing break failed", failedStructureDown:"Bearish swing break failed",
  reclaimedStructureUp:"Bullish swing level reclaimed", reclaimedStructureDown:"Bearish swing level reclaimed",
} as const;
export type StructureScanSignal = keyof typeof structureLabels;
export const isScannerStructureSignal = (signal: ScanSignalKind):signal is StructureScanSignal =>
  Object.hasOwn(structureLabels, signal);

export const scanSignalLabels = {...indicatorSignalLabels,...additionalSignals,...structureLabels};
export type ScanSignalKind = keyof typeof scanSignalLabels;
export const scanSignalKinds = (Object.keys(scanSignalLabels) as ScanSignalKind[])
  .filter(key=>key!=="vwapReclaimed"&&key!=="vwapLost");
export const RELEASE_LOOKBACK_HOURS = 168;
export const SIGNAL_LOOKBACK_MINUTES = 960;
const SCAN_ADDITIONAL_STUDIES = ["rsiChange","ema9SlopeAtr","ema20SlopeAtr","atrRatio","bollingerBandwidth","sameTimeRegularVolume"] as const;
export const SCAN_INDICATOR_METRICS = [...SCAN_ADDITIONAL_STUDIES,"rsi14","emaSpread","atrPercent","indicatorVolumeRatio",
  "macdHistogramPercent","bollingerPercentB","stochasticK","indicatorSignal"] as const;
export type ScanIndicatorMetric = typeof SCAN_INDICATOR_METRICS[number];
export const isScanIndicatorMetric = (key:string):key is ScanIndicatorMetric =>
  (SCAN_INDICATOR_METRICS as readonly string[]).includes(key);
export type ScanIndicatorFacts = Record<Exclude<ScanIndicatorMetric,"indicatorSignal" | typeof SCAN_ADDITIONAL_STUDIES[number]>,number|null> &
  Partial<Record<typeof SCAN_ADDITIONAL_STUDIES[number],number|null>> & {
  dataThrough:number;
  events:Partial<Record<ScanSignalKind,number>>;
  sma50Ready:boolean;
};
export type ScanMomentumMetric = "rsi14" | "macdHistogramPercent" | "stochasticK";
export const isScanMomentumMetric = (metric: string): metric is ScanMomentumMetric =>
  metric === "rsi14" || metric === "macdHistogramPercent" || metric === "stochasticK";
export type ScanMomentumReading = Readonly<{
  ruleIndex: number;
  metric: ScanMomentumMetric;
  frame: ScanSignalFrame;
  value: number | null;
  closedAt?: number;
  met?: boolean;
}>;
export type ScanPressRelease = { id:string; title:string; at:number; url:string };
export type ScanPressReleaseSnapshot = Readonly<{ releases: ReadonlyMap<string, ScanPressRelease> }>;
export type ReadScanPressReleases = (symbols: ReadonlyMap<string, unknown>, asOf: number) => ScanPressReleaseSnapshot | undefined;

export function indicatorReadyForSignal(fact:ScanIndicatorFacts, signal:ScanSignalKind) {
  if(signal.startsWith("macd"))return fact.macdHistogramPercent!==null;
  if(signal.includes("Band"))return fact.bollingerPercentB!==null;
  if(signal.startsWith("stochastic"))return fact.stochasticK!==null;
  if(signal.startsWith("priceSma"))return fact.sma50Ready;
  if(signal.startsWith("ema")||signal.startsWith("priceEma"))return fact.emaSpread!==null;
  if(signal.startsWith("rsi")||signal.startsWith("momentum")||signal.includes("Momentum"))return fact.rsi14!==null;
  if(signal.startsWith("volume"))return fact.indicatorVolumeRatio!==null;
  if(signal.startsWith("atr")||signal==="wideCandle")return fact.atrPercent!==null;
  return fact.atrPercent!==null&&fact.emaSpread!==null;
}

function signalFamily(kind:ScanSignalKind) {
  if(isScannerStructureSignal(kind))return "Market structure";
  if(kind.startsWith("macd"))return "MACD";
  if(kind.includes("Band"))return "Bollinger Bands";
  if(kind.startsWith("stochastic"))return "Stochastic";
  if(kind.startsWith("ema")||kind.startsWith("priceEma")||kind.startsWith("priceSma"))return "Moving averages";
  if(kind.toLowerCase().includes("trend"))return "Trend";
  if(kind.startsWith("volume"))return "Volume";
  if(kind.startsWith("atr")||kind==="wideCandle")return "Volatility";
  return "RSI and momentum";
}
const groupedSignals=new Map<string,ScanSignalKind[]>();
for(const signal of scanSignalKinds){
  const family=signalFamily(signal);
  const group=groupedSignals.get(family)??[];
  group.push(signal);groupedSignals.set(family,group);
}
export const scanSignalGroups=[...groupedSignals];
