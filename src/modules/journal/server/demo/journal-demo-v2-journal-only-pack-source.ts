import { createHash } from "node:crypto";

import {
  buildDemoSixFillQuantities,
  demoTradeTargetNotional,
  type JournalDemoDerivedExecutionFact,
  type JournalDemoDerivedTradeFact,
  type JournalDemoFinancialPackSource,
} from "./journal-demo-financial-pack-source";

/**
 * These facts are deliberate synthetic demo content. They are not market
 * claims, were not selected from candles, and are permanently Journal-only:
 * the Analyzer never receives a job, candle source, or result for them.
 */
export const JOURNAL_DEMO_V2_SYNTHETIC_TICKERS = Object.freeze([
  ["2026-08-17", "ACON", 4],
  ["2026-08-18", "ACXP", 4], ["2026-08-18", "ADGM", 4],
  ["2026-08-19", "ALP", 3], ["2026-08-19", "ALZN", 4], ["2026-08-19", "AMIX", 5],
  ["2026-08-20", "AMOD", 4], ["2026-08-20", "AMSS", 3], ["2026-08-20", "AMST", 4],
  ["2026-08-21", "ARTL", 5], ["2026-08-21", "ARTW", 3], ["2026-08-21", "ASBP", 4],
  ["2026-08-24", "ASTC", 5], ["2026-08-24", "ATCX", 3],
  ["2026-08-25", "ERNA", 4], ["2026-08-25", "EZGO", 4],
  ["2026-08-26", "FABC", 4], ["2026-08-26", "FAMI", 5],
  ["2026-08-27", "GCTK", 4],
] as const satisfies readonly (readonly [string, string, number])[]);

type SessionPattern = "premarket_only" | "premarket_to_regular" | "regular_only" | "regular_to_postmarket" | "postmarket_only";

const V2_PACK_KEY = "daily_tracker_demo" as const;
const V2_PACK_VERSION = 2;
const SYNTHETIC_OUTCOME_MOVES = Object.freeze([
  0.24, 0.42, -0.25, 0.58, 0.31, -0.32, 0.20, 0.72,
  -0.22, 0.35, 0.48, -0.28, 0.27, 0.62, -0.30, 0.40,
] as const);

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

function executedAtUtc(date: string, timeNewYork: string): string {
  const value = new Date(`${date}T${timeNewYork}:00-04:00`);
  if (!Number.isFinite(value.getTime())) throw new Error("journal_demo_v2_timestamp_invalid");
  return value.toISOString();
}

function newYorkClockTime(minutesSinceMidnight: number): string {
  return `${String(Math.floor(minutesSinceMidnight / 60)).padStart(2, "0")}:${String(minutesSinceMidnight % 60).padStart(2, "0")}`;
}

function timesFor(
  pattern: SessionPattern,
  patternOccurrence: number,
): readonly string[] {
  switch (pattern) {
    case "premarket_only": {
      const start = 6 * 60 + 15 + patternOccurrence * 35;
      return [newYorkClockTime(start), newYorkClockTime(start + 3), newYorkClockTime(start + 12),
        newYorkClockTime(start + 16), newYorkClockTime(start + 23), newYorkClockTime(start + 28)];
    }
    case "premarket_to_regular": {
      const entry = 9 * 60 + 10 + patternOccurrence;
      return [newYorkClockTime(entry), newYorkClockTime(entry + 6), newYorkClockTime(9 * 60 + 35 + patternOccurrence),
        newYorkClockTime(9 * 60 + 40 + patternOccurrence), newYorkClockTime(9 * 60 + 47 + patternOccurrence), newYorkClockTime(9 * 60 + 52 + patternOccurrence)];
    }
    case "regular_only": {
      const start = 10 * 60 + patternOccurrence * 90;
      const at = (offset: number): string => newYorkClockTime(start + offset);
      return [at(0), at(10), at(35), at(50), at(70), at(85)];
    }
    case "regular_to_postmarket": {
      const entry = 15 * 60 + 30 + patternOccurrence;
      return [newYorkClockTime(entry), newYorkClockTime(entry + 6), newYorkClockTime(16 * 60 + 8 + patternOccurrence),
        newYorkClockTime(16 * 60 + 16 + patternOccurrence), newYorkClockTime(16 * 60 + 30 + patternOccurrence), newYorkClockTime(16 * 60 + 45 + patternOccurrence)];
    }
    case "postmarket_only": {
      const start = 16 * 60 + 20 + patternOccurrence * 2;
      return [newYorkClockTime(start), newYorkClockTime(start + 7), newYorkClockTime(start + 18),
        newYorkClockTime(start + 24), newYorkClockTime(start + 35), newYorkClockTime(start + 50)];
    }
  }
}

function price(value: number): string {
  return value.toFixed(4).replace(/\.?0+$/u, "");
}

function patternsForTicker(tickerIndex: number, tradeCount: number): readonly SessionPattern[] {
  const patterns: SessionPattern[] = [];
  if (tickerIndex < 16) patterns.push("premarket_only");
  if (tickerIndex < 18) patterns.push("premarket_to_regular");
  if (tickerIndex < 14) patterns.push("regular_to_postmarket");
  if (tickerIndex >= 14 && tickerIndex <= 17) patterns.push("postmarket_only");
  while (patterns.length < tradeCount) patterns.push("regular_only");
  if (patterns.length !== tradeCount) throw new Error("journal_demo_v2_pattern_inventory_invalid");
  const order: Readonly<Record<SessionPattern, number>> = Object.freeze({
    premarket_only: 0,
    premarket_to_regular: 1,
    regular_only: 2,
    regular_to_postmarket: 3,
    postmarket_only: 4,
  });
  return Object.freeze([...patterns].sort((left, right) => order[left] - order[right]));
}

function executionsFor(input: Readonly<{
  date: string;
  tradeIndex: number;
  symbol: string;
  tickerIndex: number;
  pattern: SessionPattern;
  patternOccurrence: number;
}>): readonly JournalDemoDerivedExecutionFact[] {
  const base = 0.72 + input.tickerIndex * 0.31 + (input.tradeIndex % 5) * 0.027;
  const move = SYNTHETIC_OUTCOME_MOVES[input.tradeIndex % SYNTHETIC_OUTCOME_MOVES.length]!;
  const times = timesFor(input.pattern, input.patternOccurrence);
  const side = ["buy", "buy", "sell", "buy", "sell", "sell"] as const;
  const prices = move > 0
    ? [base, base * 0.96, base * (1 + move * 0.45), base * 1.03, base * (1 + move * 0.7), base * (1 + move)]
    : [base, base * 1.08, base * (1 + move * 0.35), base * 1.02, base * (1 + move * 0.6), base * (1 + move)];
  const quantities = buildDemoSixFillQuantities(
    demoTradeTargetNotional(input.date, input.symbol, input.tradeIndex, "v2"),
    [prices[0]!, prices[1]!, prices[3]!],
  );
  return Object.freeze(times.map((timeNewYork, index) => Object.freeze({
    analysisPolicy: "journal_only" as const,
    executionFeeDecimal: "0.5",
    executedAtUtc: executedAtUtc(input.date, timeNewYork),
    marketCandleTimeUtcSeconds: null,
    packExecutionKey: `demo-v2-${input.date}-${input.symbol.toLowerCase()}-${String(input.tradeIndex + 1).padStart(2, "0")}-execution-${String(index + 1).padStart(2, "0")}`,
    priceDecimal: price(prices[index]!),
    quantityDecimal: quantities[index]!,
    side: side[index]!,
    source: "synthetic_demo_invented_journal_only_v2" as const,
  })));
}

/** Builds the fixed 76-trade Journal-only extension without accessing a provider or database. */
export function createJournalDemoV2JournalOnlyPackSource(): JournalDemoFinancialPackSource {
  const trades: JournalDemoDerivedTradeFact[] = [];
  const sessionMix: Record<SessionPattern, number> = {
    premarket_only: 0,
    premarket_to_regular: 0,
    regular_only: 0,
    regular_to_postmarket: 0,
    postmarket_only: 0,
  };
  let tradeIndex = 0;
  for (const [tickerIndex, [date, symbol, tradeCount]] of JOURNAL_DEMO_V2_SYNTHETIC_TICKERS.entries()) {
    const patternOccurrences = new Map<SessionPattern, number>();
    const patterns = patternsForTicker(tickerIndex, tradeCount);
    for (let localIndex = 0; localIndex < tradeCount; localIndex += 1) {
      const pattern = patterns[localIndex];
      if (!pattern) throw new Error("journal_demo_v2_pattern_inventory_invalid");
      sessionMix[pattern] += 1;
      const patternOccurrence = patternOccurrences.get(pattern) ?? 0;
      patternOccurrences.set(pattern, patternOccurrence + 1);
      trades.push(Object.freeze({
        direction: "long" as const,
        executions: executionsFor({ date, pattern, patternOccurrence, symbol, tickerIndex, tradeIndex }),
        packTradeKey: `demo-v2-${date}-${symbol.toLowerCase()}-${String(localIndex + 1).padStart(2, "0")}`,
        symbol,
        tradingDateNewYork: date,
      }));
      tradeIndex += 1;
    }
  }
  const executionCount = trades.reduce((count, trade) => count + trade.executions.length, 0);
  if (trades.length !== 76 || executionCount !== 456 ||
    sessionMix.premarket_only !== 16 || sessionMix.premarket_to_regular !== 18 ||
    sessionMix.regular_only !== 24 || sessionMix.regular_to_postmarket !== 14 ||
    sessionMix.postmarket_only !== 4) {
    throw new Error("journal_demo_v2_trade_inventory_invalid");
  }
  const syntheticInventorySha256 = sha256(canonicalJson({
    sessionMix,
    tickers: JOURNAL_DEMO_V2_SYNTHETIC_TICKERS,
    trades,
  }));
  return Object.freeze({
    corporateActionReview: "not_applicable_synthetic_journal_only" as const,
    derivedFactManifestSha256: sha256(canonicalJson({ packKey: V2_PACK_KEY, packVersion: V2_PACK_VERSION, syntheticInventorySha256, trades })),
    marketDataManifestSha256: syntheticInventorySha256,
    packKey: V2_PACK_KEY,
    packVersion: V2_PACK_VERSION,
    sourceEvidenceManifestSha256: syntheticInventorySha256,
    trades: Object.freeze(trades),
  });
}
