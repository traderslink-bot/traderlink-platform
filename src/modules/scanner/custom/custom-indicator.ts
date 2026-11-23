export const CUSTOM_INDICATOR_METRICS = ["customEma", "customSma", "customRsi", "customVwap"] as const;
export type CustomIndicatorMetric = typeof CUSTOM_INDICATOR_METRICS[number];
export const isCustomIndicatorMetric = (value: string): value is CustomIndicatorMetric =>
  (CUSTOM_INDICATOR_METRICS as readonly string[]).includes(value);
export const indicatorComparisons = {
  above: "Above", below: "Below", crossUp: "Crossed above", crossDown: "Crossed below",
} as const;
export type IndicatorComparison = keyof typeof indicatorComparisons;
export const isIndicatorCross = (comparison: IndicatorComparison) => comparison === "crossUp" || comparison === "crossDown";
export const MAX_CUSTOM_PERIOD = 200;
export const DEFAULT_SIGNAL_HISTORY = 250;
export type CustomIndicator =
  | { kind:"ema"; fast:number; slow:number }
  | { kind:"sma"; fast:number; slow:number }
  | { kind:"priceEma" | "priceSma"; period:number }
  | { kind:"rsi"; period:number; level:number }
  | { kind:"vwap" };
export type IndicatorMatch = { value:number; comparison:number; readyToCross:boolean; closedAt?:number; crossUp?:number; crossDown?:number };
export const customIndicatorKey = (indicator:CustomIndicator) => {
  switch(indicator.kind){
    case "ema": case "sma": return `${indicator.kind}:${indicator.fast}:${indicator.slow}`;
    case "priceEma": case "priceSma": return `${indicator.kind}:${indicator.period}`;
    case "rsi": return `rsi:${indicator.period}:${indicator.level}`;
    case "vwap": return "vwap";
  }
};
export function customIndicatorTitle(indicator:CustomIndicator) {
  switch(indicator.kind){
    case "ema": case "sma": return `${indicator.kind.toUpperCase()} ${indicator.fast} vs ${indicator.slow}`;
    case "priceEma": case "priceSma": return `Close vs ${indicator.kind === "priceEma" ? "EMA" : "SMA"} ${indicator.period}`;
    case "rsi": return `RSI ${indicator.period} vs ${indicator.level}`;
    case "vwap": return "Session VWAP";
  }
}

export function customHistorySize(indicator:CustomIndicator, frameMinutes:number, lookbackMinutes:number){
  const period=(indicator.kind==="ema"||indicator.kind==="sma")?indicator.slow:indicator.kind==="vwap"?0:indicator.period;
  return Math.max(DEFAULT_SIGNAL_HISTORY,period+Math.ceil(lookbackMinutes/frameMinutes)+2);
}
