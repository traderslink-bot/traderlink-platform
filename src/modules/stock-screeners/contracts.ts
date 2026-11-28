export const SESSIONS = {
  latest: "Latest session",
  premarket: "Premarket",
  regular: "Regular",
  after_hours: "After hours",
  last_regular: "Last completed regular",
} as const;
export type Session = keyof typeof SESSIONS;
export type MarketSession = Exclude<Session, "latest">;

export const UNIVERSES = {
  all: "All covered U.S. stocks",
  list: "My tickers",
} as const;
export type Universe = keyof typeof UNIVERSES;

export const OPENING_RANGE_MINUTES = [5, 15, 30, 60] as const;

export const METRICS = {
  price: { label: "Price", unit: "price", group: "Price & performance" },
  change: { label: "Change", unit: "percent", group: "Price & performance" },
  openGap: { label: "Regular open gap", unit: "percent", group: "Price & performance" },
  open: { label: "Session open", unit: "price", group: "Price & performance" },
  high: { label: "Session high", unit: "price", group: "Price & performance" },
  low: { label: "Session low", unit: "price", group: "Price & performance" },
  range: { label: "Session range", unit: "percent", group: "Price & performance" },
  fromHigh: { label: "Below session high", unit: "percent", group: "Price & performance" },
  fromLow: { label: "Above session low", unit: "percent", group: "Price & performance" },
  week: { label: "1 week return", unit: "percent", group: "Price & performance" },
  month: { label: "1 month return", unit: "percent", group: "Price & performance" },
  quarter: { label: "3 month return", unit: "percent", group: "Price & performance" },
  halfYear: { label: "6 month return", unit: "percent", group: "Price & performance" },
  year: { label: "1 year return", unit: "percent", group: "Price & performance" },
  ytd: { label: "YTD return", unit: "percent", group: "Price & performance" },
  week52high: { label: "52-week high", unit: "price", group: "Price & performance" },
  week52low: { label: "52-week low", unit: "price", group: "Price & performance" },
  below52High: { label: "Below 52-week high", unit: "percent", group: "Price & performance" },
  above52Low: { label: "Above 52-week low", unit: "percent", group: "Price & performance" },
  cap: { label: "Market cap", unit: "money", group: "Listing" },
  volume: { label: "Volume", unit: "count", group: "Liquidity" },
  recentVolume5: { label: "Volume · last 5m", unit: "count", group: "Liquidity" },
  recentVolume15: { label: "Volume · last 15m", unit: "count", group: "Liquidity" },
  relativeVolume: { label: "Relative volume at time", unit: "ratio", group: "Liquidity" },
  dollarVolume: { label: "Dollar volume (est.)", unit: "money", group: "Liquidity" },
  avg10: { label: "Avg. volume · 10d", unit: "count", group: "Liquidity" },
  avg20: { label: "Avg. volume · 20d", unit: "count", group: "Liquidity" },
  avg50: { label: "Avg. volume · 50d", unit: "count", group: "Liquidity" },
  avgDollar: { label: "Avg. dollar volume · 20d (est.)", unit: "money", group: "Liquidity" },
  trades: { label: "Trades in bars", unit: "count", group: "Liquidity" },
  bid: { label: "Bid", unit: "price", group: "Liquidity" },
  ask: { label: "Ask", unit: "price", group: "Liquidity" },
  spreadDollar: { label: "Spread ($)", unit: "price", group: "Liquidity" },
  spread: { label: "Spread (bps)", unit: "bps", group: "Liquidity" },
  sma20: { label: "SMA 20 · Daily", unit: "price", group: "Technicals" },
  sma50: { label: "SMA 50 · Daily", unit: "price", group: "Technicals" },
  sma200: { label: "SMA 200 · Daily", unit: "price", group: "Technicals" },
  ema9: { label: "EMA 9 · Daily", unit: "price", group: "Technicals" },
  ema20: { label: "EMA 20 · Daily", unit: "price", group: "Technicals" },
  dist20: { label: "Distance from SMA 20 · Daily", unit: "percent", group: "Technicals" },
  dist50: { label: "Distance from SMA 50 · Daily", unit: "percent", group: "Technicals" },
  dist200: { label: "Distance from SMA 200 · Daily", unit: "percent", group: "Technicals" },
  rsi: { label: "RSI 14 · Daily", unit: "count", group: "Technicals" },
  atr: { label: "ATR 14 · Daily", unit: "price", group: "Technicals" },
  atrPercent: { label: "ATR % · Daily", unit: "percent", group: "Technicals" },
  or5Position: { label: "Price vs 5m opening range", unit: "openingPosition", group: "Opening range" },
  or5High: { label: "5m opening range high", unit: "price", group: "Opening range" },
  or5Low: { label: "5m opening range low", unit: "price", group: "Opening range" },
  or5Width: { label: "5m opening range width", unit: "percent", group: "Opening range" },
  or15Position: { label: "Price vs 15m opening range", unit: "openingPosition", group: "Opening range" },
  or15High: { label: "15m opening range high", unit: "price", group: "Opening range" },
  or15Low: { label: "15m opening range low", unit: "price", group: "Opening range" },
  or15Width: { label: "15m opening range width", unit: "percent", group: "Opening range" },
  or30Position: { label: "Price vs 30m opening range", unit: "openingPosition", group: "Opening range" },
  or30High: { label: "30m opening range high", unit: "price", group: "Opening range" },
  or30Low: { label: "30m opening range low", unit: "price", group: "Opening range" },
  or30Width: { label: "30m opening range width", unit: "percent", group: "Opening range" },
  or60Position: { label: "Price vs 60m opening range", unit: "openingPosition", group: "Opening range" },
  or60High: { label: "60m opening range high", unit: "price", group: "Opening range" },
  or60Low: { label: "60m opening range low", unit: "price", group: "Opening range" },
  or60Width: { label: "60m opening range width", unit: "percent", group: "Opening range" },
  sessionVwap: { label: "Session VWAP (est.)", unit: "price", group: "VWAP" },
  vwapPosition: { label: "Price vs session VWAP", unit: "vwapPosition", group: "VWAP" },
  vwapDistance: { label: "Distance from VWAP", unit: "percent", group: "VWAP" },
  vwapCross: { label: "VWAP cross · last 5m bar", unit: "vwapCross", group: "VWAP" },
  gapFillStatus: { label: "Gap fill status", unit: "gapFillStatus", group: "Regular session" },
  premarketHigh: { label: "Premarket high", unit: "price", group: "Regular session" },
  premarketHighBreak: { label: "Premarket high break", unit: "premarketHighBreak", group: "Regular session" },
  pressReleaseAge: { label: "Press release age", unit: "hours", group: "Catalysts" },
} as const;
export type Metric = keyof typeof METRICS;
export type Values = Partial<Record<Metric, number>>;
export const METRIC_KEYS = Object.keys(METRICS) as Metric[];

const SIGNAL_LABELS = {
  openingPosition: { 1: "Above range", 0: "Inside range", [-1]: "Below range" },
  vwapPosition: { 1: "Above VWAP", 0: "At VWAP", [-1]: "Below VWAP" },
  vwapCross: { 1: "Crossed above", 0: "No cross", [-1]: "Crossed below" },
  gapFillStatus: { 1: "Filled", 0: "Open gap", [-1]: "No opening gap" },
  premarketHighBreak: { 1: "Broke above", 0: "No break" },
} as const;

export function signalChoices(metric: Metric): Readonly<Record<number, string>> | undefined {
  const unit = METRICS[metric].unit;
  return Object.hasOwn(SIGNAL_LABELS, unit) ? SIGNAL_LABELS[unit as keyof typeof SIGNAL_LABELS] : undefined;
}
export const OPERATORS = { gte: "At least", lte: "At most", between: "Between", gt: "Above", lt: "Below", eq: "Exactly" } as const;
export type Rule = { metric: Metric; operator: keyof typeof OPERATORS; value: number; upper?: number; exclude?: true };
export type SortKey = { metric: Metric | "ticker"; dir: "asc" | "desc" };
export type Sort = SortKey & { secondary?: SortKey };
export const EXCHANGES = ["NASDAQ", "NYSE", "AMEX", "ARCA", "BATS", "IEX", "TXSE"] as const;
export type Exchange = typeof EXCHANGES[number];
export const EXCHANGE_LABELS: Partial<Record<Exchange, string>> = { AMEX: "NYSE American", ARCA: "NYSE Arca", BATS: "Cboe BZX" };
export type Listing = { symbol: string; exchange: Exchange; name: string; marketCap?: number };
export const VIEWS = { table: "Table", two: "Two rows", cards: "Cards" } as const;
export type View = keyof typeof VIEWS;
export type Definition = {
  session: Session; universe: Universe; tickers: string[]; exchanges: Exchange[]; rules: Rule[];
  groups?: Rule[][]; sort: Sort; columns: Metric[]; view: View;
};

export function screenRules(definition: Pick<Definition, "rules" | "groups">): Rule[] {
  return definition.groups ? definition.rules.concat(...definition.groups) : definition.rules;
}

export function sortIncludes(sort: Sort, metric: SortKey["metric"]) {
  return sort.metric === metric || sort.secondary?.metric === metric;
}
export type NewsHeadline = { publishedAt: number; headline: string; url: string };
export type Candidate = {
  symbol: string; exchange: Exchange; name?: string; priceAt?: number; quoteAt?: number;
  values: Values; pressRelease?: NewsHeadline;
};
export type Snapshot = {
  version: 2; source: "Alpaca SIP" | "Moomoo" | "Preview data"; date: string; universeDate: string;
  session: MarketSession; asOf: number; capturedAt: number; closed: boolean; partial: boolean;
  rows: Candidate[];
};
export type ScreenerProviderSelection = { provider: "alpaca" | "moomoo"; revision: number };
export type MarketPack = { latest: MarketSession; snapshots: Record<MarketSession, Snapshot>; selection?: ScreenerProviderSelection;
  /** Opaque confirmed-correction identity; ordinary market updates do not change it. */
  correctionRevision?: string; correctionGeneration?: number;
  /** Internal provenance for canonical overrides of the selected native feed. */
  correctionProvenance?: { source: "alpaca-sip"; symbols: string[] } };
export type LiveScreenerFreshness = { priceAt?: number; vwapAt?: number };
export type RunResult = Omit<Snapshot, "rows" | "source"> & {
  source: Snapshot["source"] | "TradersLink";
  id: string; total: number; eligible: number; evaluated: number; unavailable: number;
  rows: Candidate[]; page: number; pageSize: number; missingTickers: string[];
  snapshotFallback?: true;
  live?: LiveScreenerFreshness;
  pressReleases?: { checkedAt: number; available: boolean };
};

export const PRESS_RELEASE_LOOKBACK_HOURS = 48;
export type SavedScreen = { id: string; name: string; definition: Definition };
export type SavedScreens = { revision: number; defaultId: string | null; screens: SavedScreen[] };

export const DEFAULT_COLUMNS: Metric[] = ["price", "change", "volume", "cap", "dollarVolume"];
export const DEFAULT_DEFINITION: Definition = {
  session: "latest", universe: "all", tickers: [], exchanges: [], rules: [], sort: { metric: "change", dir: "desc" }, columns: DEFAULT_COLUMNS, view: "table",
};
export const MAX_RULES = 21;
export const MAX_TICKERS = 100;
export const MAX_SAVED = 30;
// Input and file validation bound corrupt provider payloads. The eligible population is not trimmed.
export const MAX_LISTINGS = 30_000;
export const CAP_SHORTCUTS = [5e6, 20e6, 50e6, 100e6, 200e6, 500e6, 1e9, 10e9] as const;

export const tickerPattern = /^[A-Z][A-Z0-9.-]{0,14}$/;
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSortKey(input: unknown): SortKey {
  if (!isObject(input) || typeof input.metric !== "string"
    || (input.metric !== "ticker" && !Object.hasOwn(METRICS, input.metric))
    || (input.dir !== "asc" && input.dir !== "desc")) throw Error("invalid_screen");
  return { metric: input.metric as SortKey["metric"], dir: input.dir };
}

export function parseSort(input: unknown): Sort {
  const primary = parseSortKey(input);
  if (!isObject(input) || input.secondary === undefined) return primary;
  const secondary = parseSortKey(input.secondary);
  if (secondary.metric === primary.metric) throw Error("invalid_screen");
  return { ...primary, secondary };
}

function parseRule(rule: unknown): Rule {
  const validNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
  if (!isObject(rule) || typeof rule.metric !== "string" || !Object.hasOwn(METRICS, rule.metric)
    || typeof rule.operator !== "string" || !Object.hasOwn(OPERATORS, rule.operator) || !validNumber(rule.value)
    || (rule.operator === "between" && (!validNumber(rule.upper) || rule.upper < rule.value))
    || (rule.exclude !== undefined && typeof rule.exclude !== "boolean")) throw Error("invalid_rule");
  const metric = rule.metric as Metric;
  const unit = METRICS[metric].unit;
  const choices = signalChoices(metric);
  if (choices ? rule.operator !== "eq" || !Object.hasOwn(choices, rule.value) : unit !== "percent" && rule.value < 0) {
    throw Error("invalid_rule");
  }
  if (unit === "hours" && (rule.value > PRESS_RELEASE_LOOKBACK_HOURS
    || (rule.operator === "between" && Number(rule.upper) > PRESS_RELEASE_LOOKBACK_HOURS))) throw Error("invalid_rule");
  return { metric, operator: rule.operator as Rule["operator"], value: rule.value,
    ...(rule.operator === "between" ? { upper: rule.upper as number } : {}),
    ...(rule.exclude === true ? { exclude: true } : {}) };
}

export function parseDefinition(input: unknown): Definition {
  if (!isObject(input) || typeof input.session !== "string" || !Object.hasOwn(SESSIONS, input.session)
    || typeof input.universe !== "string" || !Object.hasOwn(UNIVERSES, input.universe)
    || typeof input.view !== "string" || !Object.hasOwn(VIEWS, input.view)
    || !Array.isArray(input.tickers) || input.tickers.length > MAX_TICKERS
    || input.tickers.some(ticker => typeof ticker !== "string" || !tickerPattern.test(ticker))
    || (input.universe === "list" && !input.tickers.length)
    || !Array.isArray(input.exchanges) || input.exchanges.length > EXCHANGES.length
    || input.exchanges.some(exchange => !EXCHANGES.includes(exchange))
    || !Array.isArray(input.columns) || !input.columns.length || input.columns.length > 10
    || input.columns.some(metric => typeof metric !== "string" || !Object.hasOwn(METRICS, metric))
    || !Array.isArray(input.rules) || input.rules.length > MAX_RULES) throw Error("invalid_screen");

  const groups: Rule[][] = [];
  if (input.groups !== undefined) {
    if (!Array.isArray(input.groups) || input.groups.length > MAX_RULES) throw Error("invalid_screen");
    let count = input.rules.length;
    for (const group of input.groups) {
      if (!Array.isArray(group) || !group.length || (count += group.length) > MAX_RULES) throw Error("invalid_screen");
      groups.push(group.map(parseRule));
    }
  }
  return {
    session: input.session as Session, universe: input.universe as Universe, view: input.view as View,
    exchanges: [...new Set(input.exchanges as Exchange[])], tickers: [...new Set(input.tickers as string[])],
    columns: [...new Set(input.columns as Metric[])], rules: input.rules.map(parseRule),
    ...(groups.length ? { groups } : {}),
    sort: parseSort(input.sort),
  };
}

export function parseThreshold(input: string, metric: Metric): number {
  let value = input.trim();
  switch (METRICS[metric].unit) {
    case "price":
    case "money":
      value = value.replace(/^\$\s*/, "");
      break;
    case "percent":
      value = value.replace(/\s*%$/, "");
      break;
    case "bps":
      value = value.replace(/\s*bps?$/i, "");
      break;
    case "ratio":
      value = value.replace(/\s*[x×]$/i, "");
      break;
    case "hours":
      value = value.replace(/\s*h$/i, "");
      break;
  }
  const matched = value
    .match(/^(-?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*([kmbt])?$/i);
  if (!matched) return NaN;
  const magnitude = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[matched[2]?.toLowerCase() as "k" | "m" | "b" | "t"] ?? 1;
  return Number(matched[1].replaceAll(",", "")) * magnitude;
}
