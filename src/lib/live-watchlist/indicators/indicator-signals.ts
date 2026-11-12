export const indicatorSignalLabels = {
  emaBullishCross: "EMA 9 crossed above EMA 20",
  emaBearishCross: "EMA 9 crossed below EMA 20",
  uptrendEstablished: "Uptrend established",
  downtrendEstablished: "Downtrend established",
  uptrendRealigned: "Price and averages back in uptrend alignment",
  downtrendRealigned: "Price and averages back in downtrend alignment",
  uptrendPriceWeakening: "Uptrend weakening · price closed below EMA 20",
  downtrendPriceWeakening: "Downtrend weakening · price closed above EMA 20",
  uptrendLost: "Uptrend lost alignment",
  downtrendLost: "Downtrend lost alignment",
  rsiOverbought: "RSI moved above 70",
  rsiLeftOverbought: "RSI exited overbought",
  rsiAboveMidpoint: "RSI crossed above 50",
  rsiBelowMidpoint: "RSI crossed below 50",
  rsiRecovered: "RSI recovered from oversold",
  rsiOversold: "RSI moved below 30",
  momentumTurningHigher: "RSI momentum turning higher",
  momentumTurningLower: "RSI momentum turning lower",
  upsideMomentumEasing: "Upside momentum easing",
  downsideMomentumEasing: "Downside momentum easing",
  volumePickingUp: "Volume picking up",
  volumeFading: "Volume fading",
  atrExpandingFromQuiet: "Volatility expanding after a quiet stretch",
  atrContracting: "Volatility contracting",
  wideCandle: "Unusually wide candle",
  vwapReclaimed: "Price reclaimed VWAP",
  vwapLost: "Price lost VWAP",
} as const;

export type IndicatorSignalKind = keyof typeof indicatorSignalLabels;
export type IndicatorSignal = Readonly<{ kind: IndicatorSignalKind; at: number }>;
export type IntradayIndicatorFrame = "1m" | "5m" | "15m";
export const intradayIndicatorMinutes = { "1m": 1, "5m": 5, "15m": 15 } as const;

const signalGroups = {
  trend: ["uptrendEstablished", "downtrendEstablished", "uptrendRealigned", "downtrendRealigned",
    "uptrendPriceWeakening", "downtrendPriceWeakening", "uptrendLost", "downtrendLost"],
  averages: ["emaBullishCross", "emaBearishCross"],
  rsiUpper: ["rsiOverbought", "rsiLeftOverbought"],
  rsiMidpoint: ["rsiAboveMidpoint", "rsiBelowMidpoint"],
  rsiLower: ["rsiRecovered", "rsiOversold"],
  momentum: ["momentumTurningHigher", "momentumTurningLower", "upsideMomentumEasing", "downsideMomentumEasing"],
  volume: ["volumePickingUp", "volumeFading"],
  atr: ["atrExpandingFromQuiet", "atrContracting"],
  range: ["wideCandle"],
  vwap: ["vwapReclaimed", "vwapLost"],
} as const;

export type IndicatorSignalGroup = keyof typeof signalGroups;
export type IndicatorSignals = Readonly<Partial<Record<IndicatorSignalGroup, IndicatorSignal>>>;
export type VwapSignals = Readonly<Partial<Record<IntradayIndicatorFrame, IndicatorSignal>>>;

export function publicIndicatorSignals(signals: IndicatorSignals | undefined, through: number): IndicatorSignals | undefined {
  if (!signals) return undefined;
  const valid: Partial<Record<IndicatorSignalGroup, IndicatorSignal>> = {};
  for (const group of Object.keys(signalGroups) as IndicatorSignalGroup[]) {
    const event = signals[group];
    if (event && (signalGroups[group] as readonly IndicatorSignalKind[]).includes(event.kind)
        && Number.isSafeInteger(event.at) && event.at > 0 && event.at <= through) {
      valid[group] = { kind: event.kind, at: event.at };
    }
  }
  return valid;
}
