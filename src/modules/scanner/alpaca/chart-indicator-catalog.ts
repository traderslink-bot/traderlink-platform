const standard = {
  SMA: { name: "Simple Moving Average", short: "SMA", group: "Moving Averages" },
  EMA: { name: "Exponential Moving Average", short: "EMA", group: "Moving Averages" },
  VWAP: { name: "Volume Weighted Average Price", short: "VWAP", group: "Volume" },
  Bollinger: { name: "Bollinger Bands", short: "BOLL", group: "Volatility" },
  RSI: { name: "Relative Strength Index", short: "RSI", group: "Oscillators" },
  MACD: { name: "Moving Average Convergence Divergence", short: "MACD", group: "Oscillators" },
} as const;

type Group = "Moving Averages" | "Volume" | "Volatility" | "Trend" | "Oscillators";
type LengthField = "fastLength" | "slowLength" | "signalLength";
type Input = readonly [field: LengthField, label: string, value: number, maximum?: number];
type Study = {
  name: string;
  short: string;
  group: Group;
  period: number | null;
  source?: boolean;
  maxPeriod?: number;
  minPeriod?: number;
  periodLabel?: string;
  description?: string;
  profile?: boolean;
  defaultSource?: "hlc3" | "hl2";
  inputs?: readonly Input[];
  multiplier?: readonly [label: string, value: number];
  overlay?: boolean;
  dots?: boolean;
  scale?: "volume" | "price" | "percent";
  defaultPrecision?: number;
};
const study = (definition: Study) => definition;
const average = (name: string, short: string, period: number | null) =>
  study({ name, short, period, group: "Moving Averages", source: true, overlay: true });
const volume = (name: string, short: string, period: number | null, inputs?: readonly Input[]) =>
  study({ name, short, period, group: "Volume", inputs });
const oscillator = (name: string, short: string, period: number | null, source = false, inputs?: readonly Input[]) =>
  study({ name, short, period, group: "Oscillators", source, inputs });

export const additionalChartIndicators = {
  WMA: average("Weighted Moving Average", "WMA", 20),
  HMA: average("Hull Moving Average", "HMA", 20),
  VWMA: average("Volume Weighted Moving Average", "VWMA", 20),
  DEMA: average("Double EMA", "DEMA", 20),
  TEMA: average("Triple EMA", "TEMA", 20),
  RMA: average("Smoothed Moving Average", "RMA", 20),
  ALMA: study({ ...average("Arnaud Legoux Moving Average", "ALMA", 9), maxPeriod: 500 }),
  KAMA: study({ ...average("Kaufman Adaptive Moving Average", "KAMA", 10), inputs: [["fastLength", "Fast length", 2], ["slowLength", "Slow length", 30]] }),
  LSMA: average("Least Squares Moving Average", "LSMA", 25),
  McGinley: average("McGinley Dynamic", "McGinley", 14),
  Ribbon: study({ ...average("Moving Average Ribbon", "MA Ribbon", null), period: null, inputs: [["fastLength", "First length", 8], ["slowLength", "Length step", 8]] }),
  MACross: study({ ...average("Moving Average Cross", "MA Cross", 9), inputs: [["slowLength", "Slow length", 21]] }),
  RangeVWAP: study({ name: "Anchored VWAP (Visible Range Start)", short: "Range VWAP", period: null, group: "Volume", source: true, defaultSource: "hlc3", overlay: true }),
  OBV: study({ ...volume("On Balance Volume", "OBV", null), scale: "volume" }),
  ADL: study({ ...volume("Accumulation/Distribution", "A/D", null), scale: "volume" }),
  CMF: study({ ...volume("Chaikin Money Flow", "CMF", 20), defaultPrecision: 4 }),
  Chaikin: volume("Chaikin Oscillator", "Chaikin", null, [["fastLength", "Fast length", 3], ["slowLength", "Slow length", 10]]),
  MFI: volume("Money Flow Index", "MFI", 14),
  PVT: study({ ...volume("Price Volume Trend", "PVT", null), scale: "volume" }),
  RVOL: study({ ...volume("Relative Volume", "RVOL", 10), defaultPrecision: 4 }),
  VolumeOsc: study({ ...volume("Volume Oscillator", "Volume Osc", null, [["fastLength", "Fast length", 5], ["slowLength", "Slow length", 10]]), scale: "percent" }),
  NetVolume: study({ ...volume("Net Volume", "Net Vol", null), scale: "volume" }),
  EFI: volume("Elder Force Index", "EFI", 13),
  EMV: study({ ...volume("Ease of Movement", "EMV", 14), defaultPrecision: 4 }),
  Klinger: volume("Klinger Oscillator", "Klinger", null, [["fastLength", "Fast length", 34], ["slowLength", "Slow length", 55], ["signalLength", "Signal length", 13]]),
  Keltner: study({ name: "Keltner Channels", short: "KC", period: 20, group: "Volatility", overlay: true, source: true, multiplier: ["ATR multiplier", 2], inputs: [["signalLength", "ATR length", 20]] }),
  Donchian: study({ name: "Donchian Channels", short: "DC", period: 20, group: "Volatility", overlay: true }),
  Envelope: study({ name: "Moving Average Envelope", short: "Envelope", period: 20, group: "Volatility", overlay: true, source: true, multiplier: ["Distance (%)", 2.5] }),
  ATR: study({ name: "Average True Range", short: "ATR", period: 14, group: "Volatility", scale: "price" }),
  StdDev: study({ name: "Standard Deviation", short: "StdDev", period: 20, group: "Volatility", source: true, scale: "price" }),
  HistVol: study({ name: "Historical Volatility", short: "HV", period: 10, group: "Volatility", source: true, scale: "percent" }),
  BBWidth: study({ name: "Bollinger BandWidth", short: "BBW", period: 20, group: "Volatility", source: true, multiplier: ["Standard deviations", 2], scale: "percent" }),
  BBPercent: study({ name: "Bollinger Bands %B", short: "BB %B", period: 20, group: "Volatility", source: true, multiplier: ["Standard deviations", 2], defaultPrecision: 4 }),
  Ulcer: study({ name: "Ulcer Index", short: "Ulcer", period: 14, group: "Volatility", source: true, scale: "percent" }),
  PriceChannel: study({ name: "Price Channel (Prior Bars)", short: "Price Channel", period: 20, group: "Trend", overlay: true }),
  PSAR: study({ name: "Parabolic SAR", short: "SAR", period: null, group: "Trend", overlay: true, dots: true }),
  Supertrend: study({ name: "Supertrend", short: "Supertrend", period: 10, group: "Trend", overlay: true, multiplier: ["ATR multiplier", 3] }),
  Chandelier: study({ name: "Chandelier Exit", short: "Chandelier", period: 22, group: "Trend", overlay: true, multiplier: ["ATR multiplier", 3] }),
  DMI: study({ name: "Directional Movement Index (ADX)", short: "DMI", period: 14, group: "Trend", inputs: [["signalLength", "ADX smoothing", 14]] }),
  Aroon: study({ name: "Aroon", short: "Aroon", period: 25, group: "Trend" }),
  AroonOsc: study({ name: "Aroon Oscillator", short: "Aroon Osc", period: 25, group: "Trend" }),
  Vortex: study({ name: "Vortex Indicator", short: "VI", period: 14, group: "Trend", defaultPrecision: 4 }),
  Chop: study({ name: "Choppiness Index", short: "CHOP", period: 14, group: "Trend" }),
  Mass: study({ name: "Mass Index", short: "Mass", period: 25, group: "Trend", inputs: [["signalLength", "EMA length", 9]] }),
  Stoch: oscillator("Stochastic", "Stoch", 14, false, [["slowLength", "%K smoothing", 3], ["signalLength", "%D smoothing", 3]]),
  StochRSI: oscillator("Stochastic RSI", "Stoch RSI", 14, true, [["fastLength", "RSI length", 14], ["slowLength", "%K smoothing", 3], ["signalLength", "%D smoothing", 3]]),
  CCI: study({ ...oscillator("Commodity Channel Index", "CCI", 20, true), maxPeriod: 500, defaultSource: "hlc3" }),
  WilliamsR: oscillator("Williams %R", "Williams %R", 14),
  Momentum: study({ ...oscillator("Momentum", "MOM", 10, true), scale: "price" }),
  ROC: study({ ...oscillator("Rate of Change", "ROC", 9, true), scale: "percent" }),
  AO: study({ ...oscillator("Awesome Oscillator", "AO", null, false, [["fastLength", "Fast length", 5], ["slowLength", "Slow length", 34]]), scale: "price" }),
  Ultimate: oscillator("Ultimate Oscillator", "UO", 7, false, [["slowLength", "Middle length", 14], ["signalLength", "Long length", 28]]),
  TRIX: study({ ...oscillator("TRIX", "TRIX", 18, true), scale: "percent" }),
  TSI: oscillator("True Strength Index", "TSI", null, true, [["fastLength", "Short length", 13], ["slowLength", "Long length", 25], ["signalLength", "Signal length", 13]]),
  DPO: study({ ...oscillator("Detrended Price Oscillator", "DPO", 21, true), scale: "price" }),
  Coppock: study({ ...oscillator("Coppock Curve", "Coppock", 10, true, [["fastLength", "Fast ROC length", 11], ["slowLength", "Slow ROC length", 14]]), scale: "percent" }),
  KST: oscillator("Know Sure Thing", "KST", null, true, [["signalLength", "Signal length", 9]]),
  CMO: oscillator("Chande Momentum Oscillator", "CMO", 14, true),
  RVI: study({ ...oscillator("Relative Vigor Index", "RVI", 10), defaultPrecision: 4 }),
  Fisher: study({ ...oscillator("Fisher Transform", "Fisher", 9, true), defaultSource: "hl2" }),
  STC: oscillator("Schaff Trend Cycle", "STC", 10, true, [["fastLength", "Fast EMA length", 23], ["slowLength", "Slow EMA length", 50]]),
  SMIErgodic: study({ ...oscillator("SMI Ergodic Oscillator", "SMI Ergodic", null, true, [["fastLength", "Short length", 5], ["slowLength", "Long length", 20], ["signalLength", "Signal length", 5]]), defaultPrecision: 4 }),
  ConnorsRSI: study({ ...oscillator("Connors RSI", "CRSI", 100, true, [["fastLength", "Price RSI length", 3], ["slowLength", "Streak RSI length", 2]]), maxPeriod: 500 }),
  BOP: study({ ...oscillator("Balance of Power", "BOP", null), defaultPrecision: 4 }),
  BullBear: study({ ...oscillator("Bull Bear Power", "BBP", 13), scale: "price" }),
} satisfies Record<string, Study>;

export const advancedChartIndicators = {
  Alligator: study({ name: "Williams Alligator", short: "Alligator", group: "Moving Averages",
    period: 13, periodLabel: "Jaw length", inputs: [["slowLength", "Teeth length", 8], ["fastLength", "Lips length", 5]], overlay: true }),
  Ichimoku: study({ name: "Ichimoku Cloud", short: "Ichimoku", group: "Trend", period: 9, periodLabel: "Conversion length",
    inputs: [["fastLength", "Base length", 26], ["slowLength", "Span B length", 52], ["signalLength", "Displacement", 26, 100]], overlay: true }),
  RegressionChannel: study({ name: "Linear Regression Channel", short: "Regression", group: "Trend",
    period: 100, minPeriod: 2, periodLabel: "Lookback bars", source: true, multiplier: ["Standard deviations", 2], overlay: true }),
  StandardPivots: study({ name: "Standard Pivot Points", short: "Pivots", group: "Trend", period: null, overlay: true,
    description: "Traditional levels from the previous completed regular-session daily candle on intraday charts. Higher timeframes use the previous completed calendar period." }),
  ZigZag: study({ name: "Zig Zag", short: "Zig Zag", group: "Trend", period: 10, minPeriod: 2, maxPeriod: 100, periodLabel: "Pivot legs",
    multiplier: ["Reversal (%)", 5], overlay: true, description: "Swings appear after confirmation. The latest endpoint can move as the swing extends." }),
  VisibleVolumeProfile: study({ name: "Visible Range Volume Profile", short: "Visible Profile", group: "Volume",
    period: 24, minPeriod: 8, maxPeriod: 96, periodLabel: "Price rows", multiplier: ["Value area (%)", 70], overlay: true, profile: true,
    description: "Estimated volume by price across the candles in view. Uses minute candles intraday and daily candles on higher timeframes." }),
  SessionVolumeProfile: study({ name: "Session Volume Profile", short: "Session Profile", group: "Volume",
    period: 24, minPeriod: 8, maxPeriod: 96, periodLabel: "Price rows", multiplier: ["Value area (%)", 70], overlay: true, profile: true,
    description: "Estimated volume by price for each trading date on intraday charts, each month on Daily, and each chart period on Weekly and above." }),
} satisfies Record<string, Study>;

export type AdvancedChartIndicator = keyof typeof advancedChartIndicators;
export type VolumeProfileType = "VisibleVolumeProfile" | "SessionVolumeProfile";
export function isVolumeProfile(type: string): type is VolumeProfileType {
  return type === "VisibleVolumeProfile" || type === "SessionVolumeProfile";
}
export type AdditionalChartIndicator = keyof typeof additionalChartIndicators;
export type ChartIndicatorType = keyof typeof standard | AdditionalChartIndicator | AdvancedChartIndicator;
export const standardChartIndicatorTypes = Object.keys(standard) as (keyof typeof standard)[];
export const additionalChartIndicatorTypes = Object.keys(additionalChartIndicators) as AdditionalChartIndicator[];
export const advancedChartIndicatorTypes = Object.keys(advancedChartIndicators) as AdvancedChartIndicator[];
export const indicatorGroups: readonly Group[] = ["Moving Averages", "Volume", "Volatility", "Trend", "Oscillators"];
export const chartIndicatorCatalog = { ...standard, ...additionalChartIndicators, ...advancedChartIndicators };

export function additionalIndicator(type: ChartIndicatorType): Study | undefined {
  if (Object.hasOwn(additionalChartIndicators, type)) return additionalChartIndicators[type as AdditionalChartIndicator];
  return Object.hasOwn(advancedChartIndicators, type) ? advancedChartIndicators[type as AdvancedChartIndicator] : undefined;
}
