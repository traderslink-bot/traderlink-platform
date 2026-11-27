import { scanPatterns, type ScanPattern } from "./candle-patterns";
import { crossReferences, type CrossReference, companyFilterLabels, needsBarVwap, eventFilters, isBenchmarkStudy, isCandleStudy, otherAuditFilters, studyFrames, studyPeriods, zoneStates, type StudyFrame } from "./audited-filters";
import { scannerSector, type ScannerSector } from "../live/sectors";
import { scannerSecurityType, type ScannerSecurityType } from "../live/security-types";
import { SCANNER_OPENING_RANGE_MINUTES, type ScannerOpeningRanges, type ScannerSession, type ScannerVolumeBreakdown } from "../live/contracts";
import { isCustomIndicatorMetric, isIndicatorCross, indicatorComparisons, MAX_CUSTOM_PERIOD,
  type CustomIndicator, type CustomIndicatorMetric, type IndicatorComparison } from "./custom-indicator";
import { isSameTimeVolumeMetric, isScanIndicatorMetric, RELEASE_LOOKBACK_HOURS, scanSignalFrames, scanSignalKinds, SIGNAL_LOOKBACK_MINUTES,
  type ScanIndicatorMetric, type ScanMomentumReading, type ScanPressRelease, type ScanSignalFrame, type ScanSignalKind } from "./signal-filters";

export const SCAN_METRICS = {
  ...otherAuditFilters,
  ...Object.fromEntries(Object.entries(companyFilterLabels).map(([id,label])=>[id,{label,category:"Company",
    unit:["revenueGrowth","incomeGrowth","annualNetMargin","annualGrossMargin","dividendYieldTtm"].includes(id)?"percent":
      ["priceEarningsTtm","priceSalesTtm","priceBookQuarter"].includes(id)?"multiple":id==="recentFiling"?"number":"money"}])) as
    Record<keyof typeof companyFilterLabels,{label:string;category:"Company";unit:"money"|"percent"|"multiple"|"number"}>,
  price: { label: "Price", unit: "money", category: "Price" },
  dayChange: { label: "Day change", unit: "percent", category: "Price" },
  belowHigh: { label: "Below day high", unit: "percent", category: "Price" },
  dayHigh: { label: "Day high", unit: "money", category: "Price" },
  dayLow: { label: "Day low", unit: "money", category: "Price" },
  aboveLow: { label: "Above day low", unit: "percent", category: "Price" },
  dayRange: { label: "Day range", unit: "percent", category: "Price" },
  sessionVwap: { label: "Session VWAP", unit: "money", category: "Price" },
  fromVwap: { label: "Change from VWAP", unit: "percent", category: "Price" },
  distanceFromVwap: { label: "Distance from session VWAP", unit: "percent", category: "Indicators" },
  rollingMove: { label: "Price move", unit: "percent", category: "Price" },
  rollingPriceChange: { label: "Price move in dollars", unit: "money", category: "Price" },
  dayChangeDollars: { label: "Session change in dollars", unit: "money", category: "Price" },
  dayVolume: { label: "Premarket + Regular volume", unit: "number", category: "Volume" },
  premarketVolume: { label: "Premarket volume", unit: "number", category: "Volume" },
  regularVolume: { label: "Regular volume", unit: "number", category: "Volume" },
  postMarketVolume: { label: "After-hours volume", unit: "number", category: "Volume" },
  volume: { label: "Session volume", unit: "number", category: "Volume" },
  dollarVolume: { label: "Dollar volume", unit: "money", category: "Volume" },
  rollingVolume: { label: "Rolling volume", unit: "number", category: "Volume" },
  rollingDollarVolume: { label: "Rolling dollar volume", unit: "money", category: "Volume" },
  volumePace: { label: "Volume pace vs prior window", unit: "multiple", category: "Volume" },
  bidAskSpread: { label: "Bid/ask spread", unit: "money", category: "Volume" },
  bidAskSpreadPercent: { label: "Bid/ask spread % of midpoint", unit: "percent", category: "Volume" },
  averageDailyVolume20: { label: "20-session average daily volume", unit: "number", category: "Volume" },
  sameTimePremarketVolume: { label: "Premarket same-time relative volume (3 sessions)", unit: "multiple", category: "Volume" },
  sameTimeAfterHoursVolume: { label: "After-hours same-time relative volume (3 sessions)", unit: "multiple", category: "Volume" },
  sameTimeRegularVolume: { label: "Regular same-time relative volume (3 sessions)", unit: "multiple", category: "Volume" },
  volumeVsDailyAverage20: { label: "Regular volume vs 20-session daily average", unit: "multiple", category: "Volume" },
  averageDailyRange20: { label: "20-session average daily range %", unit: "percent", category: "Price" },
  closedDailyReturn: { label: "Last completed daily return", unit: "percent", category: "Market context" },
  dailyCloseVsSma20: { label: "Daily close vs 20-session SMA %", unit: "percent", category: "Market context" },
  weeklyCloseVsSma4: { label: "Weekly close vs 4-week SMA %", unit: "percent", category: "Market context" },
  closedWeeklyReturn: { label: "Last completed weekly return", unit: "percent", category: "Market context" },
  dailyRelativeToSpy: { label: "Daily return vs SPY (percentage points)", unit: "number", category: "Market context" },
  weeklyRelativeToSpy: { label: "Weekly return vs SPY (percentage points)", unit: "number", category: "Market context" },
  pullbackFromFiveSessionHigh: { label: "Pullback from high in last 5 completed sessions", unit: "percent", category: "Market context" },
  pullbackFromSevenDayHigh: { label: "Pullback from high in prior 7 calendar days", unit: "percent", category: "Market context" },
  pullbackFromPreviousWeekHigh: { label: "Pullback from previous trading week high", unit: "percent", category: "Market context" },
  floatTurnover: { label: "Float turnover", unit: "percent", category: "Volume" },
  tradingSession: { label: "Trading session", unit: "number", category: "Session levels" },
  openingRangeHigh: { label: "Opening range high", unit: "money", category: "Session levels" },
  openingRangeLow: { label: "Opening range low", unit: "money", category: "Session levels" },
  fromOpeningRangeHigh: { label: "Change from opening range high", unit: "percent", category: "Session levels" },
  fromOpeningRangeLow: { label: "Change from opening range low", unit: "percent", category: "Session levels" },
  previousDayHigh: { label: "Previous day high", unit: "money", category: "Session levels" },
  previousDayLow: { label: "Previous day low", unit: "money", category: "Session levels" },
  previousDayClose: { label: "Previous day close", unit: "money", category: "Session levels" },
  fromPreviousDayHigh: { label: "Change from previous day high", unit: "percent", category: "Session levels" },
  fromPreviousDayLow: { label: "Change from previous day low", unit: "percent", category: "Session levels" },
  sessionOpen: { label: "Session open", unit: "money", category: "Session levels" },
  sessionGap: { label: "Session opening gap", unit: "percent", category: "Session levels" },
  premarketHigh: { label: "Premarket high", unit: "money", category: "Session levels" },
  premarketLow: { label: "Premarket low", unit: "money", category: "Session levels" },
  premarketRange: { label: "Premarket range %", unit: "percent", category: "Session levels" },
  fromPremarketHigh: { label: "Change from premarket high", unit: "percent", category: "Session levels" },
  fromPremarketLow: { label: "Change from premarket low", unit: "percent", category: "Session levels" },
  regularHigh: { label: "Regular high", unit: "money", category: "Session levels" },
  regularLow: { label: "Regular low", unit: "money", category: "Session levels" },
  regularRange: { label: "Regular session range %", unit: "percent", category: "Session levels" },
  fromRegularHigh: { label: "Change from regular high", unit: "percent", category: "Session levels" },
  fromRegularLow: { label: "Change from regular low", unit: "percent", category: "Session levels" },
  postMarketHigh: { label: "After-hours high", unit: "money", category: "Session levels" },
  postMarketLow: { label: "After-hours low", unit: "money", category: "Session levels" },
  postMarketRange: { label: "After-hours range %", unit: "percent", category: "Session levels" },
  fromPostMarketHigh: { label: "Change from after-hours high", unit: "percent", category: "Session levels" },
  fromPostMarketLow: { label: "Change from after-hours low", unit: "percent", category: "Session levels" },
  postMarketChange: { label: "After-hours change", unit: "percent", category: "Session levels" },
  distanceToVerifiedZone: { label: "Distance to verified setup zone %", unit: "percent", category: "Session levels" },
  roomToNextVerifiedZone: { label: "Room to next verified target %", unit: "percent", category: "Session levels" },
  confirmed4hBreak: { label: "Confirmed 4H level break", unit: "event", category: "Session levels" },
  activeHalt: { label: "Trading halt", unit: "number", category: "Catalyst" },
  tradeResumed: { label: "Trading resumed", unit: "event", category: "Catalyst" },
  pressRelease: { label: "Press release", unit: "event", category: "Catalyst" },
  customEma: { label: "Custom EMA", unit: "number", category: "Indicators" },
  customSma: { label: "Custom SMA", unit: "number", category: "Indicators" },
  customRsi: { label: "Custom RSI", unit: "number", category: "Indicators" },
  customVwap: { label: "VWAP state or cross", unit: "money", category: "Indicators" },
  indicatorSignal: { label: "Indicator signal", unit: "event", category: "Indicators" },
  rsiChange: { label: "RSI change", unit: "number", category: "Indicators" },
  ema9SlopeAtr: { label: "EMA 9 slope in ATR", unit: "multiple", category: "Indicators" },
  ema20SlopeAtr: { label: "EMA 20 slope in ATR", unit: "multiple", category: "Indicators" },
  atrRatio: { label: "ATR vs prior baseline", unit: "multiple", category: "Indicators" },
  bollingerBandwidth: { label: "Bollinger bandwidth %", unit: "percent", category: "Indicators" },
  rsi14: { label: "RSI 14", unit: "number", category: "Indicators" },
  emaSpread: { label: "EMA 9 vs EMA 20", unit: "percent", category: "Indicators" },
  atrPercent: { label: "ATR %", unit: "percent", category: "Indicators" },
  indicatorVolumeRatio: { label: "Volume vs indicator baseline", unit: "multiple", category: "Indicators" },
  macdHistogramPercent: { label: "MACD histogram %", unit: "percent", category: "Indicators" },
  bollingerPercentB: { label: "Bollinger %B", unit: "percent", category: "Indicators" },
  stochasticK: { label: "Stochastic %K", unit: "number", category: "Indicators" },
  tickerList: { label: "Tickers", unit: "number", category: "Company" },
  listingExchange: { label: "Listing exchange", unit: "number", category: "Company" },
  listingSector: { label: "Nasdaq sector", unit: "number", category: "Company" },
  listingSecurityType: { label: "Security type", unit: "number", category: "Company" },
  listingIndustry: { label: "Industry", unit: "number", category: "Company" },
  listingCountry: { label: "Listing country", unit: "number", category: "Company" },
  marketCap: { label: "Market cap", unit: "money", category: "Company" },
  float: { label: "Float", unit: "number", category: "Company" },
} as const;
export type ScanMetric = keyof typeof SCAN_METRICS;
export const isSwingPullbackMetric = (metric: ScanMetric) => metric === "pullbackFromFiveSessionHigh" ||
  metric === "pullbackFromSevenDayHigh" || metric === "pullbackFromPreviousWeekHigh";
export const isDirectionalPriceMove = (metric: ScanMetric) => metric === "rollingMove" || metric === "rollingPriceChange";
export type RollingScanMetric = "rollingMove" | "rollingPriceChange" | "rollingVolume" | "rollingDollarVolume" | "volumePace" | "rollingFloatTurnover";
export const isRollingScanMetric = (metric: ScanMetric): metric is RollingScanMetric =>
  isDirectionalPriceMove(metric) || metric === "rollingFloatTurnover" || metric === "rollingVolume" || metric === "rollingDollarVolume" || metric === "volumePace";

export const isOpeningRangeMetric = (metric: ScanMetric) =>
  metric === "openingRangeHigh" || metric === "openingRangeLow" ||
  metric === "fromOpeningRangeHigh" || metric === "fromOpeningRangeLow";
export const scanMetricUsesMinutes = (metric: ScanMetric) => metric==="timedRebound" || isRollingScanMetric(metric) || isOpeningRangeMetric(metric);
export const isSignedScanMetric = (metric:ScanMetric) =>
  ["reboundFromLow","sectorRelativeMove","macdHistogram","anchoredFromLow","annualIncome","annualEps","revenueGrowth","incomeGrowth","annualNetMargin","annualGrossMargin","priceEarningsTtm","priceBookQuarter","smaAlignment","betaSpy","returnVsSpy","windowReturn","smaDistance","smaSlope","emaDistance","stochasticJ"].includes(metric) || metric === "dailyCloseVsSma20" || metric === "weeklyCloseVsSma4" || metric === "dayChangeDollars" || metric === "closedDailyReturn" || metric === "closedWeeklyReturn" || metric === "dailyRelativeToSpy" || metric === "weeklyRelativeToSpy" ||
  metric === "rsiChange" || metric === "ema9SlopeAtr" || metric === "ema20SlopeAtr" ||
  metric === "fromPreviousDayHigh" || metric === "fromPreviousDayLow" ||
  metric === "fromOpeningRangeHigh" || metric === "fromOpeningRangeLow" || metric === "dayChange" || metric === "sessionGap" || metric === "fromVwap" || metric === "postMarketChange" || metric === "fromPremarketHigh" ||
  metric === "fromPremarketLow" || metric === "fromRegularHigh" || metric === "fromRegularLow" ||
  metric === "fromPostMarketHigh" || metric === "fromPostMarketLow" || metric === "emaSpread" || metric === "macdHistogramPercent" || metric === "bollingerPercentB";
export const isEventScanMetric = (metric:ScanMetric) => Object.hasOwn(eventFilters, metric) || metric==="pressRelease" || metric==="tradeResumed" || metric==="indicatorSignal" || metric==="confirmed4hBreak";
export const requiresScannerLevelRead = (metric: ScanMetric) =>
  metric === "zoneRewardRisk" || metric === "zoneState" || metric === "confirmed4hBreak" || metric === "distanceToVerifiedZone" || metric === "roomToNextVerifiedZone";
export const MAX_LEVEL_BREAK_HOURS = 168;
export const isScanSelectionMetric = (metric: ScanMetric) =>
  metric === "recentFiling" || metric === "prHeadline" || metric === "zoneState" || metric === "haltCode" || metric === "tickerList" || metric === "listingExchange" || metric === "listingCountry" || metric === "listingSector" ||
  metric === "listingSecurityType" || metric === "listingIndustry" || metric === "tradingSession";
export const SCAN_SESSION_LABELS = { PREMARKET: "Premarket", REGULAR: "Regular", AFTER_HOURS: "After hours" } as const;
export const SCAN_EXCHANGE_CHOICES = ["NASDAQ", "NYSE", "AMEX"] as const;
const exchangeChoices = new Set<string>(SCAN_EXCHANGE_CHOICES);

function parseSelection(metric: ScanMetric, selection: unknown) {
  if (!Array.isArray(selection) || selection.length < 1 || selection.length > 100) throw Error("invalid_scan_selection");
  const items = selection.map(item => {
    if (typeof item !== "string" || item.length > (metric === "listingIndustry" || metric === "prHeadline" ? 100 : 32)) throw Error("invalid_scan_selection");
    const value = item.trim().replace(/\s+/gu," ").toUpperCase();
    if (metric === "listingIndustry" || metric === "prHeadline") {
      if (!value || /[\p{Cc}\p{Cf}]/u.test(value)) throw Error("invalid_scan_selection");
      return value;
    }
    const valid = metric==="recentFiling" ? /^[A-Z0-9][A-Z0-9 /-]{0,23}$/.test(value) : metric === "haltCode" ? /^[A-Z0-9]{1,8}$/.test(value) : metric === "zoneState" ? Object.hasOwn(zoneStates,value) : metric === "tickerList" ? /^[A-Z][A-Z0-9.-]{0,15}$/.test(value) :
      metric === "listingExchange" ? exchangeChoices.has(value) :
        metric === "tradingSession" ? Object.hasOwn(SCAN_SESSION_LABELS, value) :
          metric === "listingSector" ? !!scannerSector(value) :
            metric === "listingSecurityType" ? !!scannerSecurityType(value) : /^[A-Z]{2}$/.test(value);
    if (!valid) throw Error("invalid_scan_selection");
    return value;
  });
  return [...new Set(items)].sort();
}
export type ScanRule = {
  metric: ScanMetric;
  minimum: number | null;
  maximum: number | null;
  minutes?: number;
  frame?: ScanSignalFrame;
  studyFrame?: StudyFrame;
  pattern?:ScanPattern;
  reference?:CrossReference;
  period?: number;
  fastPeriod?:number;
  signalPeriod?:number;
  signal?: ScanSignalKind;
  indicator?: CustomIndicator;
  comparison?: IndicatorComparison;
  absence?:boolean;
  direction?: "up" | "down" | "either";
  includeUnknown?: boolean;
  selection?: string[];
};
export type ScanMatch = "all" | "any";
export type ScanRuleGroup = { match: ScanMatch; rules: ScanRule[] };
export type ScanDefinition = {
  /** Older scans and live drafts keep the existing streaming cadence. */
  cadence?: "swing";
  rules: ScanRule[];
  match?: ScanMatch;
  groups?: ScanRuleGroup[];
  sort: { metric: ScanMetric; direction: "asc" | "desc"; minutes?: number; frame?: ScanSignalFrame };
};
export const scanRules = (definition:ScanDefinition) =>
  [...definition.rules, ...(definition.groups??[]).flatMap(group=>group.rules)];
export const EMPTY_SCAN: ScanDefinition = { rules: [], sort: { metric: "dayChange", direction: "desc" } };
export const SAVED_SCAN_ID = /^[a-f0-9-]{36}$/;
export type SavedScan = { id: string; name: string; definition: ScanDefinition };
export type SavedScanBook = { revision: number; scans: SavedScan[] };
export const SCAN_PAGE_SIZE = 50;
export const SCAN_STREAM_PATH = "/api/scanners/custom";
export const SCAN_CATEGORIES = ["Price", "Volume", "Session levels", "Company", "Catalyst", "Indicators", "Market context"] as const;
export const SIDE_CARD_SCAN_PAGE_SIZE = 20;

// One trading day is the scope of this preview's intraday windows.
export const MAX_INTRADAY_MINUTES = 16 * 60;
const record = (input: unknown): input is Record<string, unknown> =>
  Boolean(input) && typeof input === "object" && !Array.isArray(input);
const metricValue = (value: unknown): value is ScanMetric => typeof value === "string" && Object.hasOwn(SCAN_METRICS, value);
const boundary = (value: unknown): value is number | null =>
  value === null || typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
function windowValue(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > MAX_INTRADAY_MINUTES) throw Error("invalid_scan_window");
  return value;
}
function scanMinutes(metric: ScanMetric, value: unknown) {
  if (isOpeningRangeMetric(metric) && !SCANNER_OPENING_RANGE_MINUTES.some(minutes => minutes === value))
    throw Error("invalid_opening_range_window");
  return windowValue(value);
}
function signalFrame(value:unknown) {
  if(value===undefined)return "5m";
  const frame=scanSignalFrames.find(frame=>frame===value);
  if(!frame)throw Error("invalid_indicator_timeframe");
  return frame;
}
function scanMatch(value: unknown): ScanMatch {
  if (value === undefined || value === "all") return "all";
  if (value === "any") return "any";
  throw Error("invalid_scan_match");
}

function parseCustomIndicator(item:Record<string,unknown>, metric:ScanMetric): ScanRule {
  const { indicator, comparison, maximum, minimum } = item;
  if (!record(indicator) || typeof comparison !== "string" || !Object.hasOwn(indicatorComparisons, comparison) ||
    minimum !== null || item.includeUnknown !== undefined) throw Error("invalid_custom_indicator");
  const compare=comparison as IndicatorComparison;
  if (isIndicatorCross(compare)
    ? typeof maximum !== "number" || !Number.isSafeInteger(maximum) || maximum < 1 || maximum > SIGNAL_LOOKBACK_MINUTES
    : maximum !== null) throw Error("invalid_custom_indicator_window");

  const period = (value:unknown): value is number =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 2 && value <= MAX_CUSTOM_PERIOD;
  let config:CustomIndicator;
  if (((metric === "customEma" && indicator.kind === "ema") || (metric === "customSma" && indicator.kind === "sma")) &&
    period(indicator.fast) && period(indicator.slow) && indicator.fast < indicator.slow)
    config={kind:indicator.kind,fast:indicator.fast,slow:indicator.slow};
  else if (((metric === "customEma" && indicator.kind === "priceEma") ||
    (metric === "customSma" && indicator.kind === "priceSma")) && period(indicator.period))
    config={kind:indicator.kind,period:indicator.period};
  else if (metric === "customRsi" && indicator.kind === "rsi" && period(indicator.period) &&
    typeof indicator.level === "number" && Number.isFinite(indicator.level) && indicator.level>=0 && indicator.level<=100)
    config={kind:"rsi",period:indicator.period,level:indicator.level};
  else if (metric === "customVwap" && indicator.kind === "vwap") config={kind:"vwap"};
  else throw Error("invalid_custom_indicator");
  return {metric,minimum:null,maximum:maximum as number|null,frame:signalFrame(item.frame),indicator:config,comparison:compare};
}

function parseRule(item:unknown): ScanRule {
    if (!record(item) || !metricValue(item.metric)) throw Error("invalid_scan_rule");
    if (isScanSelectionMetric(item.metric)) {
      return { metric: item.metric, minimum: null, maximum: null, selection: parseSelection(item.metric, item.selection) };
    }
    if (item.metric === "floatMissing") return { metric: item.metric, minimum: 1, maximum: null };
    if (item.metric === "activeHalt") return { metric: item.metric, minimum: 1, maximum: null };
    if (isCustomIndicatorMetric(item.metric)) return parseCustomIndicator(item,item.metric);
    if (!boundary(item.minimum) || !boundary(item.maximum) ||
      (item.minimum !== null && item.maximum !== null && item.minimum > item.maximum) ||
      (item.minimum === null && item.maximum === null) ||
      (item.includeUnknown !== undefined && (item.metric !== "float" || typeof item.includeUnknown !== "boolean"))) throw Error("invalid_scan_rule");
    if(item.metric==="crossReference"){
      if(typeof item.reference!=="string" || !Object.hasOwn(crossReferences,item.reference) || (item.direction!=="up" && item.direction!=="down"))
        throw Error("invalid_cross_reference");
      return {metric:item.metric,reference:item.reference as CrossReference,direction:item.direction,minimum:null,maximum:1};
    }
    if(item.metric==="breakPremarketHigh" || item.metric==="breakOpeningHigh")return {metric:item.metric,minimum:null,maximum:1};
    if (item.metric === "tradeResumed" || Object.hasOwn(eventFilters,item.metric)) {
      if (item.minimum !== null || item.maximum === null) throw Error("invalid_trade_resumption_window");
      return {metric:item.metric,minimum:null,maximum:windowValue(item.maximum)};
    }
    if(item.metric==="pressRelease"){
      if(item.minimum!==null || item.maximum===null || item.maximum<1/60 || item.maximum>RELEASE_LOOKBACK_HOURS ||
        (item.absence!==undefined && typeof item.absence!=="boolean")) throw Error("invalid_press_release_window");
      return {metric:item.metric,minimum:null,maximum:item.maximum,...(item.absence===true?{absence:true}:{})};
    }
    if(item.metric==="indicatorSignal"){
      const signal=scanSignalKinds.find(signal=>signal===item.signal);
      if(!signal || item.minimum!==null || item.maximum===null || item.maximum<1 || item.maximum>SIGNAL_LOOKBACK_MINUTES)
        throw Error("invalid_indicator_signal");
      return {metric:item.metric,minimum:null,maximum:item.maximum,frame:signalFrame(item.frame),signal};
    }
    if (item.metric === "confirmed4hBreak") {
      const direction = item.direction;
      if (item.minimum !== null || item.maximum === null || !Number.isInteger(item.maximum) ||
        item.maximum < 1 || item.maximum > MAX_LEVEL_BREAK_HOURS ||
        (direction !== "up" && direction !== "down" && direction !== "either")) throw Error("invalid_level_break");
      return { metric: item.metric, minimum: null, maximum: item.maximum, direction };
    }
    const direction = isDirectionalPriceMove(item.metric) ? item.direction ?? "up" : undefined;
    if (direction !== undefined && direction !== "up" && direction !== "down" && direction !== "either") throw Error("invalid_scan_direction");
    if (!isSignedScanMetric(item.metric) && (item.minimum !== null && item.minimum < 0 || item.maximum !== null && item.maximum < 0)) throw Error("invalid_scan_threshold");
    const studyFrame = studyFrames.find(value => value === item.studyFrame);
    const period = studyPeriods.find(value => value === item.period);
    if (isCandleStudy(item.metric) && (!studyFrame || !period || (isBenchmarkStudy(item.metric) && studyFrame!=="1D" && studyFrame!=="1W"))) throw Error("invalid_candle_study");
    if(needsBarVwap(item.metric) && !["1m","5m","15m"].includes(String(studyFrame)))throw Error("invalid_weighted_frame");
    if(item.metric==="candlePattern" && (period!<9 || typeof item.pattern!=="string" || !Object.hasOwn(scanPatterns,item.pattern) || item.minimum!==1 || item.maximum!==null))throw Error("invalid_scan_pattern");
    const fastPeriod=item.fastPeriod??12, signalPeriod=item.signalPeriod??9;
    if(item.metric==="macdHistogram" && (typeof fastPeriod!=="number" || !Number.isInteger(fastPeriod) || fastPeriod<1 ||
      fastPeriod>=period! || typeof signalPeriod!=="number" || !Number.isInteger(signalPeriod) || signalPeriod<1 || signalPeriod>100))throw Error("invalid_macd_period");
    return { metric:item.metric, minimum:item.minimum, maximum:item.maximum,
      ...(item.metric==="candlePattern" && {pattern:item.pattern as ScanPattern}),
      ...(item.metric==="macdHistogram" && {fastPeriod:fastPeriod as number,signalPeriod:signalPeriod as number}),
      ...(isCandleStudy(item.metric) && {studyFrame,period}),
      ...(isScanIndicatorMetric(item.metric)?{frame:isSameTimeVolumeMetric(item.metric) ? "15m" as const : signalFrame(item.frame)}:{}),
      ...(scanMetricUsesMinutes(item.metric) ? { minutes: scanMinutes(item.metric,item.minutes) } : {}),
      ...(direction === undefined ? {} : { direction }),
      ...(item.includeUnknown === true ? { includeUnknown:true } : {}) };
}

export function parseScanDefinition(input: unknown): ScanDefinition {
  if (!record(input) || !Array.isArray(input.rules) || input.rules.length > 128 || !record(input.sort)) throw Error("invalid_scan");
  if (input.cadence !== undefined && input.cadence !== "swing") throw Error("invalid_scan_cadence");
  const match = scanMatch(input.match);
  const rawGroups = input.groups === undefined ? [] : input.groups;
  if (!Array.isArray(rawGroups) || rawGroups.length > 128) throw Error("invalid_scan_groups");
  let ruleCount = input.rules.length;
  const groups: ScanRuleGroup[] = rawGroups.map(group => {
    if (!record(group) || !Array.isArray(group.rules) || !group.rules.length || group.groups !== undefined)
      throw Error("invalid_scan_groups");
    ruleCount += group.rules.length;
    if (ruleCount > 128) throw Error("invalid_scan");
    return {match:scanMatch(group.match),rules:group.rules.map(parseRule)};
  });
  const { metric, direction, minutes, frame } = input.sort;
  if (!metricValue(metric) || metric === "activeHalt" || metric === "floatMissing" || isCandleStudy(metric) || isScanSelectionMetric(metric) || requiresScannerLevelRead(metric) || isEventScanMetric(metric) || isCustomIndicatorMetric(metric) || direction !== "asc" && direction !== "desc")
    throw Error("invalid_scan_sort");
  return { ...(input.cadence === "swing" ? { cadence: "swing" as const } : {}), rules:input.rules.map(parseRule), ...(match==="any"?{match}:{}), ...(groups.length?{groups}:{}),
    sort: { metric, direction, ...(scanMetricUsesMinutes(metric) ? { minutes:scanMinutes(metric,minutes) } : {}),
      ...(isScanIndicatorMetric(metric)?{frame:isSameTimeVolumeMetric(metric) ? "15m" as const : signalFrame(frame)}:{}) } };
}
export function parseSavedScanBook(input: unknown): SavedScanBook {
  if (!record(input) || typeof input.revision !== "number" || !Number.isSafeInteger(input.revision) ||
    input.revision < 0 || input.revision >= Number.MAX_SAFE_INTEGER || !Array.isArray(input.scans)) throw Error("invalid_scan_book");
  const ids = new Set<string>(), names = new Set<string>();
  const scans = input.scans.map((scan): SavedScan => {
    if (!record(scan) || typeof scan.id !== "string" || !SAVED_SCAN_ID.test(scan.id) || ids.has(scan.id) ||
      typeof scan.name !== "string" || /[\u0000-\u001f\u007f]/u.test(scan.name)) throw Error("invalid_saved_scan");
    const name = scan.name.trim(), key = name.toLowerCase();
    if (!name || name.length > 70 || names.has(key)) throw Error("invalid_saved_scan_name");
    ids.add(scan.id);
    names.add(key);
    return { id:scan.id, name, definition:parseScanDefinition(scan.definition) };
  });
  return { revision:input.revision, scans };
}

type CoreMetric = "price" | "volume" | "dayVolume" | "dollarVolume" | "marketCap" | "float" | "dayChange" | "belowHigh";
export type ScanMarketFacts = Partial<Record<Exclude<ScanMetric, CoreMetric | RollingScanMetric | ScanIndicatorMetric | CustomIndicatorMetric | "pressRelease" | "confirmed4hBreak">,number | null>>;
export type ScanMarketRow = ScannerVolumeBreakdown & {
  symbol: string; exchange: "NYSE" | "NASDAQ" | "AMEX"; session?: ScannerSession;
  price: number; volume: number | null; dollarVolume: number | null;
  marketCap: number | null; float: number | null; dayChange: number | null; belowHigh: number | null;
  observedAt: number; priceSourceAt?: number; quoteObservedAt?: number; openingRanges?: ScannerOpeningRanges; facts?:ScanMarketFacts; haltCode?:string; halted?: boolean; country?:string | null; industry?:string; sector?:ScannerSector; tradeResumedAt?:number;
  dailyClosedAt?: number;
  weeklyClosedAt?: number;
  securityType?: ScannerSecurityType;
};
export type ScanAlternativeReading =
  | readonly [state: "unavailable"]
  | readonly [state: "passed" | "failed", value: number | null, closedAt?: number];
export type ScanTrendReading = { distance: number; closedAt: number };
export type ScanResultRow = Omit<ScanMarketRow, "observedAt" | "facts" | "openingRanges" | "dailyClosedAt" | "weeklyClosedAt"> & {
  sortValue: number | null;
  matches: (number | null)[];
  matchSummary?: string;
  matchedRuleIndexes?: number[];
  matchedLevelEvidence?: Record<number, string>;
  momentumReadings?: ScanMomentumReading[];
  matchedStudyTimes?: Record<number, number>;
  alternativeReadings?: Partial<Record<number, ScanAlternativeReading>>;
  trendContext?: { daily?: ScanTrendReading; weekly?: ScanTrendReading };
  priceObservedAt?: number;
  matchedNewsIds?:string[];
  pressRelease?: ScanPressRelease;
  evidenceReference?: string;
};
export type ScanStatus = "waiting" | "open" | "closed" | "unavailable";
export type ScanFilterCoverage = { checked: number; failed: number; unknown: number };
export type ScanResult = {
  status: ScanStatus; total: number; eligible: number; incomplete: number; rows: ScanResultRow[]; updatedAt: number;
  excluded?: number;
  ruleCoverage?: ReadonlyArray<ScanFilterCoverage>;
  groupCoverage?: ReadonlyArray<ScanFilterCoverage>;
};
export type ScanQuery = { key:string; definition: ScanDefinition; page:number; compact?: boolean };
/** Exact owner-scoped results read at the publication cutoff. Missing coverage stays unknown. */
export type ScanLevelBreakFact = {
  at: number; reference: string;
  setup?: { direction:"up"|"down"; lower:number; upper:number; targets:readonly ScannerLevelRoom[] };
};
export type ReadScanLevelBreak = (symbol: string, rule: ScanRule, cutoffMs: number) =>
  ScanLevelBreakFact | null | undefined;
export type ScannerLevelRoom = Readonly<{
  zoneId: string;
  frame: "4h" | "1D";
  side: "support" | "resistance";
  lower: number;
  upper: number;
  distance: number;
}>;
export type ScanPublication = Record<string, ScanResult>;
export const SAVED_SCAN_STREAM_PATH = "/api/scanners/saved";
export type SavedScanCatalogue = { revision: number; scans: Pick<SavedScan, "id" | "name">[] };
export type ScanResultColumn = { metric: ScanMetric; label: string; index?: number; cross?: boolean };
export type SavedScanResults = SavedScanCatalogue & {
  results: Record<string, { state: "ready"; result: ScanResult; columns?: ScanResultColumn[] } | { state: "unavailable" }>;
};
export const CLOSED_SCAN_MESSAGE = "Scanners run from premarket open to post-market close (4 AM–8 PM ET).";
