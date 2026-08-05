import type { JournalRuleRecord } from "@/src/modules/journal/contracts/journal-annotation-contracts";
import type {
  JournalTradingDayReadModel,
  JournalTradingDayRoundTrip,
} from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";

import { evaluateJournalPresetRules } from "./journal-preset-rule-evaluator";

const timezone = "America/New_York";
const day = "2026-08-05";

function trade(
  sequence: number,
  values: Readonly<{
    entryAtUtc: string;
    exitAtUtc: string;
    instrumentId?: string;
    netPnlDecimal: string | null;
  }>,
): JournalTradingDayRoundTrip {
  return Object.freeze({
    roundTripId: `trade-${sequence}`,
    instrumentId: values.instrumentId ?? "instrument-a",
    symbol: values.instrumentId === "instrument-b" ? "BBB" : "AAA",
    currency: "USD",
    timezone,
    direction: "long",
    entryAtUtc: values.entryAtUtc,
    exitAtUtc: values.exitAtUtc,
    entryPriceDecimal: "1",
    exitPriceDecimal: "1",
    netPnlDecimal: values.netPnlDecimal,
    gainLossPercentDecimal: "0",
  });
}

function model(roundTrips: readonly JournalTradingDayRoundTrip[]): JournalTradingDayReadModel {
  return Object.freeze({
    state: "ready",
    date: day,
    currency: "USD",
    availableCurrencies: ["USD"],
    timezone,
    netPnlDecimal: "0",
    decisionActivity: [],
    availableTradingDates: [day],
    executionActivity: [],
    previousTradingDate: null,
    nextTradingDate: null,
    latestTradingDate: day,
    tickers: Object.freeze([{
      instrumentId: "instrument-a",
      symbol: "AAA",
      currency: "USD",
      netPnlDecimal: "0",
      gainLossPercentDecimal: "0",
      roundTrips,
    }]),
    openPositions: [],
    positionSnapshots: [],
    week: Object.freeze({
      startDate: "2026-08-03",
      endDate: "2026-08-07",
      days: [],
      netPnlDecimal: "0",
      tickerCount: 1,
      tradeCount: roundTrips.length,
    }),
    coverage: Object.freeze({
      readyClosedCount: roundTrips.length,
      legitimateOpenCount: 0,
      needsDecisionCount: 0,
      feeCompleteCount: roundTrips.length,
      feeIncompleteCount: 0,
      limitationReasonCodes: [],
    }),
    factSetRevisionSha256: "a".repeat(64),
  });
}

function rule(
  templateKey: string,
  configuration: Readonly<Record<string, string>>,
): JournalRuleRecord {
  return Object.freeze({
    ruleId: `rule-${templateKey}`,
    sourceKind: "template",
    templateKey,
    title: templateKey,
    statement: templateKey,
    category: "trade",
    reviewScope: "trade",
    isFocus: false,
    configuration,
    lifecycleState: "active",
    versionNumber: 1,
    versionId: `version-${templateKey}`,
    revision: 1,
    effectiveFromUtc: "2026-08-05T00:00:00.000Z",
    createdAtUtc: "2026-08-05T00:00:00.000Z",
    updatedAtUtc: "2026-08-05T00:00:00.000Z",
  });
}

describe("Journal preset rule evaluator", () => {
  it("evaluates a same-ticker cooldown from completed flat-to-flat trade times regardless of P/L", () => {
    const results = evaluateJournalPresetRules([
      rule("cooldown_before_same_ticker_reentry", { cooldownMinutes: "15" }),
    ], model([
      trade(1, { entryAtUtc: "2026-08-05T13:30:00.000Z", exitAtUtc: "2026-08-05T14:00:00.000Z", netPnlDecimal: "5" }),
      trade(2, { entryAtUtc: "2026-08-05T14:10:00.000Z", exitAtUtc: "2026-08-05T14:30:00.000Z", netPnlDecimal: "-2" }),
      trade(3, { entryAtUtc: "2026-08-05T14:45:00.000Z", exitAtUtc: "2026-08-05T15:00:00.000Z", netPnlDecimal: "1" }),
    ]), new Set());

    expect(results.map((item) => item.status)).toEqual(["followed", "broken", "followed"]);
  });

  it("does not use a completed trade in a different ticker to start a cooldown", () => {
    const results = evaluateJournalPresetRules([
      rule("cooldown_before_same_ticker_reentry", { cooldownMinutes: "30" }),
    ], model([
      trade(1, { entryAtUtc: "2026-08-05T13:30:00.000Z", exitAtUtc: "2026-08-05T14:00:00.000Z", netPnlDecimal: "-5" }),
      trade(2, { instrumentId: "instrument-b", entryAtUtc: "2026-08-05T14:05:00.000Z", exitAtUtc: "2026-08-05T14:20:00.000Z", netPnlDecimal: "1" }),
    ]), new Set());

    expect(results.map((item) => item.status)).toEqual(["followed", "followed"]);
  });

  it("returns N/A for a same-ticker re-entry whose exact order cannot be established", () => {
    const results = evaluateJournalPresetRules([
      rule("cooldown_before_same_ticker_reentry", { cooldownMinutes: "15" }),
    ], model([
      trade(1, { entryAtUtc: "2026-08-05T13:30:00.000Z", exitAtUtc: "2026-08-05T14:00:00.000Z", netPnlDecimal: "5" }),
      trade(2, { entryAtUtc: "2026-08-05T14:00:00.000Z", exitAtUtc: "2026-08-05T14:30:00.000Z", netPnlDecimal: "-2" }),
    ]), new Set());

    expect(results.map((item) => item.status)).toEqual(["followed", "n/a"]);
  });

  it("marks the daily rule broken only when an entry follows the configured total loss count", () => {
    const results = evaluateJournalPresetRules([
      rule("stop_after_total_daily_losses", { dailyLossCountLimit: "2" }),
    ], model([
      trade(1, { entryAtUtc: "2026-08-05T13:30:00.000Z", exitAtUtc: "2026-08-05T13:40:00.000Z", netPnlDecimal: "-1" }),
      trade(2, { entryAtUtc: "2026-08-05T13:45:00.000Z", exitAtUtc: "2026-08-05T13:55:00.000Z", netPnlDecimal: "2" }),
      trade(3, { entryAtUtc: "2026-08-05T14:00:00.000Z", exitAtUtc: "2026-08-05T14:10:00.000Z", netPnlDecimal: "-1" }),
      trade(4, { entryAtUtc: "2026-08-05T14:15:00.000Z", exitAtUtc: "2026-08-05T14:25:00.000Z", netPnlDecimal: "1" }),
    ]), new Set());

    expect(results).toEqual([expect.objectContaining({
      targetKind: "trading_day",
      targetRoundTripId: null,
      status: "broken",
    })]);
  });

  it("keeps the daily total-loss rule followed when the threshold is reached on the final trade", () => {
    const results = evaluateJournalPresetRules([
      rule("stop_after_total_daily_losses", { dailyLossCountLimit: "2" }),
    ], model([
      trade(1, { entryAtUtc: "2026-08-05T13:30:00.000Z", exitAtUtc: "2026-08-05T13:40:00.000Z", netPnlDecimal: "-1" }),
      trade(2, { entryAtUtc: "2026-08-05T13:45:00.000Z", exitAtUtc: "2026-08-05T13:55:00.000Z", netPnlDecimal: "1" }),
      trade(3, { entryAtUtc: "2026-08-05T14:00:00.000Z", exitAtUtc: "2026-08-05T14:10:00.000Z", netPnlDecimal: "-1" }),
    ]), new Set());

    expect(results).toEqual([expect.objectContaining({ status: "followed" })]);
  });

  it("returns N/A for the daily total-loss rule when realized P/L is unavailable", () => {
    const results = evaluateJournalPresetRules([
      rule("stop_after_total_daily_losses", { dailyLossCountLimit: "1" }),
    ], model([
      trade(1, { entryAtUtc: "2026-08-05T13:30:00.000Z", exitAtUtc: "2026-08-05T13:40:00.000Z", netPnlDecimal: null }),
    ]), new Set());

    expect(results).toEqual([expect.objectContaining({ status: "n/a" })]);
  });
});
