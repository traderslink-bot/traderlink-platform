import { createHash } from "node:crypto";

import type { NormalizedMarketCandle } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import {
  hasEveryExecutionMinute,
  hasStrictlyIncreasingCandleTimes,
  hasTargetOrPriorMinute,
} from "@/src/modules/level-analysis/server/daily-trade-analyzer-candle-coverage";
import { newYorkExtendedSession } from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";
import { isLowercaseSha256, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

const SOURCE_EVIDENCE_MANIFEST_SHA256 = "f3976daae06a3949bcdacba1e922cabb7f72c5614877745dfa33ae446af40b1a";
const PACK_KEY = "daily_tracker_demo";
const PACK_VERSION = 1;
const EXECUTION_FEE_DECIMAL = "0.5";
const REQUIRED_ANALYZER_PATH_MINUTES = Object.freeze([5, 15, 30, 60]);

type MarketSessionExpectation = Readonly<{
  barCount: number;
  date: string;
  daySourceSha256: string;
  evidenceFileSha256: string;
  normalizedBarsSha256: string;
  rawPagesSha256: string;
  symbol: string;
}>;

const MARKET_SESSION_EXPECTATIONS = Object.freeze([
  Object.freeze({
    date: "2026-08-26", symbol: "CRE", barCount: 960,
    daySourceSha256: "06ad6185b048f8ec16dae8e20b736b7cda8f3773824507cc229498973e3bcd0f",
    evidenceFileSha256: "4a5fc612586d6187ced94cc0039e8f59084a21f6ab4cc3baffefbd4e449854b2",
    normalizedBarsSha256: "c56cc2a416ec45c92cad4197b069ccb4016b36ea3055ed94ffb6a86a803b84a9",
    rawPagesSha256: "66127d718b04037eed858b7752e93342ed5e7b85846ffcfcf1a9416a24ae4282",
  }),
  Object.freeze({
    date: "2026-08-26", symbol: "SOAR", barCount: 960,
    daySourceSha256: "06ad6185b048f8ec16dae8e20b736b7cda8f3773824507cc229498973e3bcd0f",
    evidenceFileSha256: "eb564bc3f0df014c64c58ce1aeac740d5dda598ee60fa388dea6b18bda975535",
    normalizedBarsSha256: "2c1b05a3eb7e9bab2d2bee468f49c474669fdc290c8e97f6c05ffb1006211751",
    rawPagesSha256: "a189925ce960210e89e6bd65cf6b5628281c945bcbd6821260d3e679b9d5b77f",
  }),
  Object.freeze({
    date: "2026-08-26", symbol: "XPON", barCount: 960,
    daySourceSha256: "06ad6185b048f8ec16dae8e20b736b7cda8f3773824507cc229498973e3bcd0f",
    evidenceFileSha256: "96a3985e739b43d71e1eb94a3aa310127c84ebb372f1cce06eaa83b1a5bb94a0",
    normalizedBarsSha256: "cd51e569b46295a3019d6d8975026c3c8857d888fa439ff56726ded9f4568c69",
    rawPagesSha256: "4717506925dc246cdf8eba2271cdb75fbcefd0d1111e95796e9581815de1e7be",
  }),
  Object.freeze({
    date: "2026-08-26", symbol: "YYGH", barCount: 960,
    daySourceSha256: "06ad6185b048f8ec16dae8e20b736b7cda8f3773824507cc229498973e3bcd0f",
    evidenceFileSha256: "24c566babb028e081c49d95d201c11d67afb58e58e5ea4dfe1f725f20a2c25cf",
    normalizedBarsSha256: "7ae9e6bb98179efbed747e65066c63b00b83a9fb961015eb2b95a6ed65034068",
    rawPagesSha256: "007f180a3e3697a0ca83016011dd68658f6841eb49982a18569b0085566d6862",
  }),
  Object.freeze({
    date: "2026-08-27", symbol: "CELU", barCount: 772,
    daySourceSha256: "e1a2032a6ebff198c330ec4227058c4dfce9db88ed4c9a383ddff7e6b38029b7",
    evidenceFileSha256: "d5d172cbb7b7ebab3c5391e02f07495fcc9eafab3d88fcdd9b1bd5311fdd7bef",
    normalizedBarsSha256: "cf9495a22c4e142ce84f46da342ee3b42f229887939b715e167c12b0fa5e77e7",
    rawPagesSha256: "31d22f97855a6f1786ccbf6f52c0948d68a2efee056e60bdb66477849fe586dd",
  }),
  Object.freeze({
    date: "2026-08-27", symbol: "CHOW", barCount: 772,
    daySourceSha256: "e1a2032a6ebff198c330ec4227058c4dfce9db88ed4c9a383ddff7e6b38029b7",
    evidenceFileSha256: "f41da4130e49f4675777a0f70f61c3591488d72a8d98855d6a40d69a1b2dceed",
    normalizedBarsSha256: "3c5668ed7e0b691595f1e7572c96ee5988920acae522376ac66785c35e0e2fbf",
    rawPagesSha256: "61de3a22efd090f56274073436c96fb9589fd20198cd3165d4f7b70d9433060e",
  }),
  Object.freeze({
    date: "2026-08-27", symbol: "LGPS", barCount: 772,
    daySourceSha256: "e1a2032a6ebff198c330ec4227058c4dfce9db88ed4c9a383ddff7e6b38029b7",
    evidenceFileSha256: "7879419c4755c038861d425f70a1d686f21b4f822df3adfd05cb0ce4225386dc",
    normalizedBarsSha256: "655c0f53db99c253f4c15a8b03b2f08f6ecbddcf4a61c9635aa3b78bfde9e38c",
    rawPagesSha256: "26b0cf62a06c6f0fd77fa64474be38372ab6ded7a5ee62b065d24fc851cc64b1",
  }),
  Object.freeze({
    date: "2026-08-27", symbol: "PPCB", barCount: 772,
    daySourceSha256: "e1a2032a6ebff198c330ec4227058c4dfce9db88ed4c9a383ddff7e6b38029b7",
    evidenceFileSha256: "8607ecfc5a6b16b962b22049e20d49c328fc1ce1841b15244bf45271fdde9ad9",
    normalizedBarsSha256: "3c2febfbd9f5163a07b2b2129b051f69ac1f6768371c944978d8a9d4932b334b",
    rawPagesSha256: "c92aabe766df8dff2c530485c4dc765981e5190fe092d29fe24818281dac8dbb",
  }),
] satisfies readonly MarketSessionExpectation[]);

type ExecutionRecipe = Readonly<{
  kind: "add" | "entry" | "exit" | "partial_exit";
  minuteFromSessionStart: number;
}>;

type TradeRecipe = Readonly<{
  executions: readonly ExecutionRecipe[];
  symbol: string;
}>;

const SIX_FILL_KINDS = Object.freeze([
  "entry", "add", "partial_exit", "add", "partial_exit", "exit",
] as const);

const DEMO_TRADE_NOTIONAL_TARGETS = Object.freeze([
  600, 650, 700, 750, 800, 850, 900, 950, 1_000,
  1_050, 1_100, 1_200, 1_300, 1_400, 1_550, 1_700, 1_850, 2_000,
] as const);

/**
 * Stable variation keeps every immutable demo replay reproducible while
 * constraining entry capital to a realistic small-account $500-$3,000 range.
 */
export function demoTradeTargetNotional(
  date: string,
  symbol: string,
  tradeIndex: number,
  sourceKey: string,
): number {
  const seed = `${date}:${symbol}:${tradeIndex}:${sourceKey}`;
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return DEMO_TRADE_NOTIONAL_TARGETS[hash % DEMO_TRADE_NOTIONAL_TARGETS.length]!;
}

/** Builds balanced BUY, BUY, SELL, BUY, SELL, SELL quantities for one trade. */
export function buildDemoSixFillQuantities(
  targetNotional: number,
  entryPrices: readonly [number, number, number],
): readonly [string, string, string, string, string, string] {
  const weightedEntryPrice = entryPrices[0] * 0.4 + entryPrices[1] * 0.35 + entryPrices[2] * 0.25;
  const totalShares = Math.floor(targetNotional / weightedEntryPrice);
  if (!Number.isFinite(weightedEntryPrice) || weightedEntryPrice <= 0 || totalShares < 4) {
    return failure("demoTradeSizing");
  }
  const firstBuy = Math.floor(totalShares * 0.4);
  const secondBuy = Math.floor(totalShares * 0.35);
  const thirdBuy = totalShares - firstBuy - secondBuy;
  const firstSell = Math.floor(totalShares * 0.3);
  const secondSell = Math.floor(totalShares * 0.3);
  const finalSell = totalShares - firstSell - secondSell;
  if (firstBuy < 1 || secondBuy < 1 || thirdBuy < 1 || firstSell < 1 || secondSell < 1 || finalSell < 1) {
    return failure("demoTradeSizing");
  }
  return Object.freeze([
    String(firstBuy), String(secondBuy), String(firstSell),
    String(thirdBuy), String(secondSell), String(finalSell),
  ]);
}

function sixFillTrade(
  symbol: string,
  minutes: readonly [number, number, number, number, number, number],
): TradeRecipe {
  return Object.freeze({
    symbol,
    executions: Object.freeze(SIX_FILL_KINDS.map((kind, index) => Object.freeze({
      kind,
      minuteFromSessionStart: minutes[index]!,
    }))),
  });
}

const DAY_TRADE_RECIPES = Object.freeze(new Map<string, readonly TradeRecipe[]>([
  ["2026-08-26", Object.freeze([
    sixFillTrade("YYGH", [241, 250, 270, 300, 330, 359]),
    sixFillTrade("YYGH", [470, 480, 500, 520, 540, 560]),
    sixFillTrade("YYGH", [600, 610, 630, 650, 680, 700]),
    sixFillTrade("CRE", [241, 250, 270, 300, 330, 386]),
    sixFillTrade("CRE", [387, 390, 410, 430, 460, 522]),
    sixFillTrade("CRE", [540, 560, 600, 630, 660, 700]),
    sixFillTrade("SOAR", [241, 242, 243, 244, 245, 246]),
    sixFillTrade("SOAR", [247, 250, 270, 290, 320, 357]),
    sixFillTrade("SOAR", [368, 380, 400, 420, 440, 480]),
    sixFillTrade("XPON", [241, 260, 300, 340, 360, 374]),
    sixFillTrade("XPON", [375, 376, 388, 400, 450, 500]),
    sixFillTrade("XPON", [547, 560, 600, 640, 680, 718]),
  ])],
  ["2026-08-27", Object.freeze([
    sixFillTrade("CELU", [312, 320, 340, 360, 400, 426]),
    sixFillTrade("CELU", [427, 430, 450, 470, 500, 554]),
    sixFillTrade("CELU", [600, 610, 630, 640, 650, 660]),
    sixFillTrade("PPCB", [271, 280, 300, 320, 340, 360]),
    sixFillTrade("PPCB", [361, 365, 380, 400, 430, 450]),
    sixFillTrade("PPCB", [451, 460, 500, 540, 560, 580]),
    sixFillTrade("LGPS", [241, 250, 270, 300, 330, 360]),
    sixFillTrade("LGPS", [361, 365, 380, 400, 430, 458]),
    sixFillTrade("LGPS", [473, 476, 478, 480, 482, 484]),
  ])],
]));

export type JournalDemoVerifiedMarketSessionInput = Readonly<{
  bars: readonly NormalizedMarketCandle[];
  date: string;
  daySourceSha256: string;
  evidenceFileSha256: string;
  normalizedBarsSha256: string;
  rawPagesSha256: string;
  symbol: string;
}>;

export type JournalDemoVerifiedMarketDaysInput = Readonly<{
  sourceEvidenceManifestSha256: string;
  sessions: readonly JournalDemoVerifiedMarketSessionInput[];
}>;

export type JournalDemoDerivedExecutionFact = Readonly<{
  analysisPolicy: "analyzer_backed" | "journal_only";
  executionFeeDecimal: string;
  executedAtUtc: string;
  marketCandleTimeUtcSeconds: number | null;
  packExecutionKey: string;
  priceDecimal: string;
  quantityDecimal: string;
  side: "buy" | "sell";
  source:
    | "synthetic_demo_derived_from_verified_moomoo_1m"
    | "synthetic_demo_invented_journal_only_v2"
    | "synthetic_demo_invented_journal_only_v4";
}>;

export type JournalDemoDerivedTradeFact = Readonly<{
  direction: "long";
  executions: readonly JournalDemoDerivedExecutionFact[];
  packTradeKey: string;
  symbol: string;
  tradingDateNewYork: string;
}>;

export type JournalDemoFinancialPackSource = Readonly<{
  corporateActionReview:
    | "required_before_materialization"
    | "not_applicable_synthetic_journal_only";
  derivedFactManifestSha256: string;
  marketDataManifestSha256: string;
  packKey: "daily_tracker_demo";
  packVersion: number;
  sourceEvidenceManifestSha256: string;
  trades: readonly JournalDemoDerivedTradeFact[];
}>;

function failure(field: string): never {
  return platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizedBarsJson(candles: readonly NormalizedMarketCandle[]): string {
  // The provider hashes its normalized contract order, whereas the downloadable
  // attachment is canonicalized alphabetically. Reconstruct the provider order
  // before checking the immutable normalized-bars receipt.
  return JSON.stringify(candles.map((candle) => Object.freeze({
    time: candle.time,
    openDecimal: candle.openDecimal,
    highDecimal: candle.highDecimal,
    lowDecimal: candle.lowDecimal,
    closeDecimal: candle.closeDecimal,
    volumeDecimal: candle.volumeDecimal,
    ...(candle.turnoverDecimal === undefined ? {} : { turnoverDecimal: candle.turnoverDecimal }),
  })));
}

function canonicalJson(value: unknown): string {
  const normalize = (candidate: unknown): unknown => {
    if (Array.isArray(candidate)) return candidate.map(normalize);
    if (candidate && typeof candidate === "object") {
      return Object.fromEntries(Object.entries(candidate as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, normalize(child)]));
    }
    return candidate;
  };
  return `${JSON.stringify(normalize(value))}\n`;
}

function sessionKey(date: string, symbol: string): string {
  return `${date}:${symbol}`;
}

function assertCandleContinuity(candles: readonly NormalizedMarketCandle[]): void {
  for (let index = 1; index < candles.length; index += 1) {
    const prior = candles[index - 1];
    const candle = candles[index];
    if (!prior || !candle) failure("demoMarketCandleContinuity");
    const ratio = Number(candle.openDecimal) / Number(prior.closeDecimal);
    if (!Number.isFinite(ratio) || ratio <= 0.25 || ratio >= 4) {
      failure("demoMarketCorporateActionAmbiguity");
    }
  }
}

function assertVerifiedInputs(
  input: JournalDemoVerifiedMarketDaysInput,
): ReadonlyMap<string, JournalDemoVerifiedMarketSessionInput> {
  if (input.sourceEvidenceManifestSha256 !== SOURCE_EVIDENCE_MANIFEST_SHA256) {
    failure("demoMarketEvidenceManifest");
  }
  const expected = new Map(MARKET_SESSION_EXPECTATIONS.map((item) => [sessionKey(item.date, item.symbol), item]));
  if (input.sessions.length !== expected.size) failure("demoMarketSessionCount");
  const sessions = new Map<string, JournalDemoVerifiedMarketSessionInput>();
  for (const sessionInput of input.sessions) {
    const key = sessionKey(sessionInput.date, sessionInput.symbol);
    const expectation = expected.get(key);
    if (!expectation || sessions.has(key)) failure("demoMarketSessionIdentity");
    if (
      sessionInput.daySourceSha256 !== expectation.daySourceSha256 ||
      sessionInput.evidenceFileSha256 !== expectation.evidenceFileSha256 ||
      sessionInput.normalizedBarsSha256 !== expectation.normalizedBarsSha256 ||
      sessionInput.rawPagesSha256 !== expectation.rawPagesSha256 ||
      !isLowercaseSha256(sessionInput.evidenceFileSha256) ||
      !isLowercaseSha256(sessionInput.rawPagesSha256)
    ) {
      failure("demoMarketSessionChecksum");
    }
    const session = newYorkExtendedSession(sessionInput.date);
    if (!session || sessionInput.bars.length !== expectation.barCount ||
      !hasStrictlyIncreasingCandleTimes(sessionInput.bars)) {
      failure("demoMarketSessionIntegrity");
    }
    if (sessionInput.bars.some((bar) => bar.time < session.startTime || bar.time > session.endTime)) {
      failure("demoMarketSessionWindow");
    }
    if (sha256(`${normalizedBarsJson(sessionInput.bars)}\n`) !== expectation.normalizedBarsSha256) {
      failure("demoMarketNormalizedBarsChecksum");
    }
    assertCandleContinuity(sessionInput.bars);
    sessions.set(key, Object.freeze({ ...sessionInput, bars: Object.freeze([...sessionInput.bars]) }));
  }
  return sessions;
}

function executionAt(sessionStartTime: number, minuteFromSessionStart: number): string {
  if (!Number.isSafeInteger(minuteFromSessionStart) || minuteFromSessionStart < 0) {
    return failure("demoExecutionMinute");
  }
  return new Date((sessionStartTime + minuteFromSessionStart * 60) * 1000).toISOString();
}

/** A zero-volume, zero-range provider placeholder cannot anchor a visible chart execution. */
export function isVisibleDemoAnalyzerCandle(candle: NormalizedMarketCandle): boolean {
  const open = Number(candle.openDecimal);
  const high = Number(candle.highDecimal);
  const low = Number(candle.lowDecimal);
  const close = Number(candle.closeDecimal);
  const volume = Number(candle.volumeDecimal);
  return [open, high, low, close, volume].every(Number.isFinite) &&
    volume > 0 && high > low && close >= low && close <= high;
}

function deriveTrade(input: Readonly<{
  date: string;
  recipe: TradeRecipe;
  tradeIndex: number;
  session: JournalDemoVerifiedMarketSessionInput;
}>): JournalDemoDerivedTradeFact {
  const session = newYorkExtendedSession(input.date);
  if (!session) return failure("demoTradingDate");
  if (input.recipe.executions.some((recipe) => recipe.minuteFromSessionStart < 240)) {
    return failure("demoExecutionBeforeVisibleMarketWindow");
  }
  const candlesByTime = new Map(input.session.bars.map((bar) => [bar.time, bar]));
  const executedAt = input.recipe.executions.map((recipe) => executionAt(session.startTime, recipe.minuteFromSessionStart));
  if (!hasEveryExecutionMinute(input.session.bars, executedAt.map((executedAtUtc) => ({ executedAtUtc })))) {
    return failure("demoExecutionMinuteCoverage");
  }
  if (executedAt.some((timestamp) => REQUIRED_ANALYZER_PATH_MINUTES.some((minutes) =>
    !hasTargetOrPriorMinute(input.session.bars, timestamp, minutes)))) {
    return failure("demoAnalyzerPathCoverage");
  }
  const executionPrices = input.recipe.executions.map((recipe) => {
    const candleTime = session.startTime + recipe.minuteFromSessionStart * 60;
    const candle = candlesByTime.get(candleTime);
    if (!candle || !isVisibleDemoAnalyzerCandle(candle)) return failure("demoExecutionVisibleCandle");
    return Number(candle.closeDecimal);
  });
  const quantities = buildDemoSixFillQuantities(
    demoTradeTargetNotional(input.date, input.recipe.symbol, input.tradeIndex, "v1"),
    [executionPrices[0]!, executionPrices[1]!, executionPrices[3]!],
  );
  const packTradeKey = `${input.date.toLowerCase()}-${input.recipe.symbol.toLowerCase()}-${String(input.tradeIndex + 1).padStart(2, "0")}`;
  const executions = input.recipe.executions.map((recipe, index) => {
    const executedAtUtc = executedAt[index];
    const candleTime = session.startTime + recipe.minuteFromSessionStart * 60;
    const candle = candlesByTime.get(candleTime);
    if (!executedAtUtc || !candle || !isVisibleDemoAnalyzerCandle(candle)) {
      return failure("demoExecutionVisibleCandle");
    }
    return Object.freeze({
      analysisPolicy: "analyzer_backed" as const,
      executionFeeDecimal: EXECUTION_FEE_DECIMAL,
      executedAtUtc,
      marketCandleTimeUtcSeconds: candle.time,
      packExecutionKey: `demo-${packTradeKey}-execution-${String(index + 1).padStart(2, "0")}`,
      priceDecimal: candle.closeDecimal,
      quantityDecimal: quantities[index]!,
      side: recipe.kind === "entry" || recipe.kind === "add" ? "buy" as const : "sell" as const,
      source: "synthetic_demo_derived_from_verified_moomoo_1m" as const,
    });
  });
  return Object.freeze({
    direction: "long" as const,
    executions: Object.freeze(executions),
    packTradeKey,
    symbol: input.recipe.symbol,
    tradingDateNewYork: input.date,
  });
}

/**
 * Builds immutable, synthetic demo financial facts from verified candle inputs.
 * It is pure: this source opens no database, makes no provider request, and
 * cannot materialize an account by itself.
 */
export function createJournalDemoDailyTrackerFinancialPackSource(
  input: JournalDemoVerifiedMarketDaysInput,
): JournalDemoFinancialPackSource {
  const sessions = assertVerifiedInputs(input);
  const trades: JournalDemoDerivedTradeFact[] = [];
  for (const [date, recipes] of DAY_TRADE_RECIPES) {
    for (const [tradeIndex, recipe] of recipes.entries()) {
      const session = sessions.get(sessionKey(date, recipe.symbol));
      if (!session) return failure("demoTradeSession");
      trades.push(deriveTrade({ date, recipe, session, tradeIndex }));
    }
  }
  const executionCountByDay = new Map<string, number>();
  for (const trade of trades) {
    executionCountByDay.set(
      trade.tradingDateNewYork,
      (executionCountByDay.get(trade.tradingDateNewYork) ?? 0) + trade.executions.length,
    );
  }
  if (trades.length !== 21 || executionCountByDay.get("2026-08-26") !== 72 ||
    executionCountByDay.get("2026-08-27") !== 54) {
    return failure("demoTradeRecipeInventory");
  }
  const marketDataManifestSha256 = sha256(canonicalJson(MARKET_SESSION_EXPECTATIONS));
  const derivedFactManifestSha256 = sha256(canonicalJson({
    marketDataManifestSha256,
    packKey: PACK_KEY,
    packVersion: PACK_VERSION,
    sourceEvidenceManifestSha256: SOURCE_EVIDENCE_MANIFEST_SHA256,
    trades,
  }));
  return Object.freeze({
    corporateActionReview: "required_before_materialization" as const,
    derivedFactManifestSha256,
    marketDataManifestSha256,
    packKey: PACK_KEY,
    packVersion: PACK_VERSION,
    sourceEvidenceManifestSha256: SOURCE_EVIDENCE_MANIFEST_SHA256,
    trades: Object.freeze(trades),
  });
}
