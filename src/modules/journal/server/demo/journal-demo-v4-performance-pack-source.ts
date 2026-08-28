import { createHash } from "node:crypto";

import {
  hasEveryExecutionMinute,
  hasTargetOrPriorMinute,
} from "@/src/modules/level-analysis/server/daily-trade-analyzer-candle-coverage";
import { newYorkExtendedSession } from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";

import {
  buildDemoSixFillQuantities,
  demoTradeTargetNotional,
  isVisibleDemoAnalyzerCandle,
  type JournalDemoDerivedTradeFact,
  type JournalDemoFinancialPackSource,
  type JournalDemoVerifiedMarketDaysInput,
  type JournalDemoVerifiedMarketSessionInput,
} from "./journal-demo-financial-pack-source";

const V4_PACK_KEY = "daily_tracker_demo" as const;
const V4_PACK_VERSION = 4;
const EXECUTION_FEE_DECIMAL = "0.5";
const REQUIRED_ANALYZER_PATH_MINUTES = Object.freeze([5, 15, 30, 60]);

type AnalyzerExecutionRecipe = Readonly<{
  minuteFromSessionStart: number;
  side: "buy" | "sell";
}>;

type AnalyzerTradeRecipe = Readonly<{
  executions: readonly AnalyzerExecutionRecipe[];
  symbol: string;
}>;

const BUY_BUY_SELL_BUY_SELL_SELL = Object.freeze([
  Object.freeze({ side: "buy" as const }),
  Object.freeze({ side: "buy" as const }),
  Object.freeze({ side: "sell" as const }),
  Object.freeze({ side: "buy" as const }),
  Object.freeze({ side: "sell" as const }),
  Object.freeze({ side: "sell" as const }),
]);

function recipe(
  symbol: string,
  minutes: readonly number[],
): AnalyzerTradeRecipe {
  if (minutes.length !== 6) throw new Error("journal_demo_v4_recipe_invalid");
  return Object.freeze({
    symbol,
    executions: Object.freeze(minutes.map((minuteFromSessionStart, index) => Object.freeze({
      ...BUY_BUY_SELL_BUY_SELL_SELL[index]!,
      minuteFromSessionStart,
    }))),
  });
}

// Every minute below is resolved to the retained verified Moomoo one-minute
// candle. Winners/losses deliberately demonstrate the range common in small caps.
const ANALYZER_PERFORMANCE_RECIPES = Object.freeze(new Map<string, readonly AnalyzerTradeRecipe[]>([
  ["2026-08-26", Object.freeze([
    recipe("YYGH", [720, 725, 740, 760, 800, 840]),
    recipe("CRE", [701, 710, 730, 750, 780, 800]),
    recipe("SOAR", [500, 510, 530, 550, 570, 600]),
    recipe("XPON", [720, 725, 740, 760, 800, 840]),
  ])],
  ["2026-08-27", Object.freeze([
    recipe("CELU", [662, 670, 680, 690, 700, 711]),
    recipe("PPCB", [581, 600, 630, 650, 680, 700]),
    recipe("LGPS", [610, 631, 660, 680, 690, 700]),
  ])],
]));

function canonicalJson(value: unknown): string {
  const normalize = (candidate: unknown): unknown => Array.isArray(candidate)
    ? candidate.map(normalize)
    : candidate && typeof candidate === "object"
      ? Object.fromEntries(Object.entries(candidate as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, normalize(child)]))
      : candidate;
  return `${JSON.stringify(normalize(value))}\n`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function sessionKey(date: string, symbol: string): string {
  return `${date}:${symbol}`;
}

function executionAt(sessionStartTime: number, minuteFromSessionStart: number): string {
  return new Date((sessionStartTime + minuteFromSessionStart * 60) * 1000).toISOString();
}

function deriveAnalyzerTrade(input: Readonly<{
  date: string;
  recipe: AnalyzerTradeRecipe;
  session: JournalDemoVerifiedMarketSessionInput;
  tradeIndex: number;
}>): JournalDemoDerivedTradeFact {
  const session = newYorkExtendedSession(input.date);
  if (!session) throw new Error("journal_demo_v4_session_invalid");
  if (input.recipe.executions.some((execution) => execution.minuteFromSessionStart < 240)) {
    throw new Error("journal_demo_v4_execution_before_visible_market_window");
  }
  const candles = new Map(input.session.bars.map((bar) => [bar.time, bar]));
  const executedAt = input.recipe.executions.map((execution) => executionAt(session.startTime, execution.minuteFromSessionStart));
  if (!hasEveryExecutionMinute(input.session.bars, executedAt.map((executedAtUtc) => ({ executedAtUtc }))) ||
    executedAt.some((timestamp) => REQUIRED_ANALYZER_PATH_MINUTES.some((minutes) =>
      !hasTargetOrPriorMinute(input.session.bars, timestamp, minutes)))) {
    throw new Error("journal_demo_v4_analyzer_candle_coverage_invalid");
  }
  const executionPrices = input.recipe.executions.map((execution) => {
    const candleTime = session.startTime + execution.minuteFromSessionStart * 60;
    const candle = candles.get(candleTime);
    if (!candle || !isVisibleDemoAnalyzerCandle(candle)) {
      throw new Error("journal_demo_v4_execution_visible_candle_missing");
    }
    return Number(candle.closeDecimal);
  });
  const quantities = buildDemoSixFillQuantities(
    demoTradeTargetNotional(input.date, input.recipe.symbol, input.tradeIndex, "v4"),
    [executionPrices[0]!, executionPrices[1]!, executionPrices[3]!],
  );
  const packTradeKey = `demo-v4-analyzer-${input.date}-${input.recipe.symbol.toLowerCase()}-${String(input.tradeIndex + 1).padStart(2, "0")}`;
  return Object.freeze({
    direction: "long" as const,
    executions: Object.freeze(input.recipe.executions.map((execution, index) => {
      const candleTime = session.startTime + execution.minuteFromSessionStart * 60;
      const candle = candles.get(candleTime);
      const executedAtUtc = executedAt[index];
      if (!candle || !executedAtUtc || !isVisibleDemoAnalyzerCandle(candle)) {
        throw new Error("journal_demo_v4_execution_visible_candle_missing");
      }
      return Object.freeze({
        analysisPolicy: "analyzer_backed" as const,
        executionFeeDecimal: EXECUTION_FEE_DECIMAL,
        executedAtUtc,
        marketCandleTimeUtcSeconds: candle.time,
        packExecutionKey: `${packTradeKey}-execution-${String(index + 1).padStart(2, "0")}`,
        priceDecimal: candle.closeDecimal,
        quantityDecimal: quantities[index]!,
        side: execution.side,
        source: "synthetic_demo_derived_from_verified_moomoo_1m" as const,
      });
    })),
    packTradeKey,
    symbol: input.recipe.symbol,
    tradingDateNewYork: input.date,
  });
}

/**
 * Adds high-range, six-execution Analyzer demonstrations without changing
 * prior immutable demo records. Every entry uses only saved verified candles.
 */
export function createJournalDemoV4PerformancePackSource(
  verifiedMarketDays: JournalDemoVerifiedMarketDaysInput,
): Readonly<{
  analyzerSource: JournalDemoFinancialPackSource;
  fullSource: JournalDemoFinancialPackSource;
  journalOnlySource: JournalDemoFinancialPackSource;
}> {
  const sessions = new Map(verifiedMarketDays.sessions.map((session) => [sessionKey(session.date, session.symbol), session]));
  const analyzerTrades: JournalDemoDerivedTradeFact[] = [];
  for (const [date, recipes] of ANALYZER_PERFORMANCE_RECIPES) {
    for (const [tradeIndex, recipe] of recipes.entries()) {
      const session = sessions.get(sessionKey(date, recipe.symbol));
      if (!session) throw new Error("journal_demo_v4_session_missing");
      analyzerTrades.push(deriveAnalyzerTrade({ date, recipe, session, tradeIndex }));
    }
  }
  const analyzerSource = Object.freeze({
    corporateActionReview: "required_before_materialization" as const,
    derivedFactManifestSha256: sha256(canonicalJson({ kind: "analyzer", packKey: V4_PACK_KEY, packVersion: V4_PACK_VERSION, trades: analyzerTrades })),
    marketDataManifestSha256: sha256(canonicalJson({ sourceEvidenceManifestSha256: verifiedMarketDays.sourceEvidenceManifestSha256, trades: analyzerTrades })),
    packKey: V4_PACK_KEY,
    packVersion: V4_PACK_VERSION,
    sourceEvidenceManifestSha256: verifiedMarketDays.sourceEvidenceManifestSha256,
    trades: Object.freeze(analyzerTrades),
  });
  const trades = analyzerSource.trades;
  if (analyzerTrades.length !== 7 ||
    trades.reduce((count, trade) => count + trade.executions.length, 0) !== 42) {
    throw new Error("journal_demo_v4_trade_inventory_invalid");
  }
  return Object.freeze({
    analyzerSource,
    fullSource: Object.freeze({
      corporateActionReview: "required_before_materialization" as const,
      derivedFactManifestSha256: sha256(canonicalJson({ packKey: V4_PACK_KEY, packVersion: V4_PACK_VERSION, trades })),
      marketDataManifestSha256: analyzerSource.marketDataManifestSha256,
      packKey: V4_PACK_KEY,
      packVersion: V4_PACK_VERSION,
      sourceEvidenceManifestSha256: analyzerSource.sourceEvidenceManifestSha256,
      trades,
    }),
    journalOnlySource: Object.freeze({
      corporateActionReview: "not_applicable_synthetic_journal_only" as const,
      derivedFactManifestSha256: sha256(canonicalJson({ kind: "journal_only", packKey: V4_PACK_KEY, packVersion: V4_PACK_VERSION, trades: [] })),
      marketDataManifestSha256: sha256(canonicalJson({ kind: "journal_only", trades: [] })),
      packKey: V4_PACK_KEY,
      packVersion: V4_PACK_VERSION,
      sourceEvidenceManifestSha256: sha256(canonicalJson({ kind: "journal_only", trades: [] })),
      trades: Object.freeze([]),
    }),
  });
}
