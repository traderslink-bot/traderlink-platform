import Decimal from "decimal.js";

import type { JournalTradingDayReadModel, JournalTradingDayRoundTrip } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import { journalAnalyticsLocalTimeFact } from "@/src/modules/journal-analytics/server/normalize-journal-analytics-facts";
import type { JournalRuleRecord } from "@/src/modules/journal/contracts/journal-annotation-contracts";

export type JournalPresetRuleResult = Readonly<{
  ruleId: string;
  status: "followed" | "broken" | "n/a";
  targetKind: "trading_day" | "round_trip";
  targetRoundTripId: string | null;
}>;

type EligibleTrade = JournalTradingDayRoundTrip;

const ExactDecimal = Decimal.clone({
  precision: 160,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});
const clockFormatters = new Map<string, Intl.DateTimeFormat>();

function decimal(value: string): Decimal {
  return new ExactDecimal(value);
}

function localClockSeconds(atUtc: string, timeZone: string): number | null {
  let formatter = clockFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      second: "2-digit",
      timeZone,
    });
    clockFormatters.set(timeZone, formatter);
  }
  const parts = Object.fromEntries(formatter.formatToParts(new Date(atUtc))
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const second = Number(parts.second);
  return Number.isInteger(hour) && Number.isInteger(minute) && Number.isInteger(second)
    ? hour * 3600 + minute * 60 + second
    : null;
}

function ruleAppliesToTrade(rule: JournalRuleRecord, trade: EligibleTrade): boolean {
  const activationDate = journalAnalyticsLocalTimeFact(
    rule.effectiveFromUtc,
    trade.timezone,
  ).localDate;
  const tradeDate = journalAnalyticsLocalTimeFact(
    trade.entryAtUtc,
    trade.timezone,
  ).localDate;
  return activationDate <= tradeDate;
}

function eligibleDayTrades(
  model: JournalTradingDayReadModel,
  swingRoundTripIds: ReadonlySet<string>,
): readonly EligibleTrade[] {
  return Object.freeze(model.tickers
    .flatMap((ticker) => ticker.roundTrips)
    .filter((trade) =>
      !swingRoundTripIds.has(trade.roundTripId) &&
      journalAnalyticsLocalTimeFact(trade.entryAtUtc, trade.timezone).localDate === model.date &&
      journalAnalyticsLocalTimeFact(trade.exitAtUtc, trade.timezone).localDate === model.date)
    .sort((left, right) =>
      left.entryAtUtc.localeCompare(right.entryAtUtc) ||
      left.exitAtUtc.localeCompare(right.exitAtUtc) ||
      left.roundTripId.localeCompare(right.roundTripId)));
}

function configuredDecimal(rule: JournalRuleRecord, key: string): Decimal | null {
  const value = rule.configuration[key];
  if (!value) return null;
  try {
    const result = decimal(value);
    return result.isFinite() && result.greaterThan(0) ? result : null;
  } catch {
    return null;
  }
}

function configuredCount(rule: JournalRuleRecord, key: string): number | null {
  const value = configuredDecimal(rule, key);
  if (!value || !value.isInteger() || value.greaterThan(Number.MAX_SAFE_INTEGER)) return null;
  return value.toNumber();
}

function timestampMilliseconds(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resultForTrades(
  ruleId: string,
  trades: readonly EligibleTrade[],
  evaluate: (trade: EligibleTrade, index: number) => JournalPresetRuleResult["status"],
): readonly JournalPresetRuleResult[] {
  return Object.freeze(trades.map((trade, index) => Object.freeze({
    ruleId,
    status: evaluate(trade, index),
    targetKind: "round_trip" as const,
    targetRoundTripId: trade.roundTripId,
  })));
}

function dayResult(
  ruleId: string,
  status: JournalPresetRuleResult["status"],
): JournalPresetRuleResult {
  return Object.freeze({
    ruleId,
    status,
    targetKind: "trading_day",
    targetRoundTripId: null,
  });
}

function sequenceIsUnambiguous(trades: readonly EligibleTrade[]): boolean {
  return !trades.some((trade, index) => index > 0 &&
    (trade.entryAtUtc === trades[index - 1]!.entryAtUtc ||
      trade.exitAtUtc === trades[index - 1]!.exitAtUtc));
}

function evaluateTemplate(
  rule: JournalRuleRecord,
  trades: readonly EligibleTrade[],
): readonly JournalPresetRuleResult[] {
  const applicable = trades.filter((trade) => ruleAppliesToTrade(rule, trade));
  if (!rule.templateKey) return Object.freeze([]);
  if (applicable.length === 0) {
    if (
      rule.templateKey === "maximum_trades_per_day" ||
      rule.templateKey === "stop_after_consecutive_losses" ||
      rule.templateKey === "stop_after_total_daily_losses" ||
      rule.templateKey === "stop_after_daily_realized_loss" ||
      rule.templateKey === "stop_after_daily_realized_gain_limit" ||
      rule.templateKey === "stop_after_profit_giveback"
    ) {
      return Object.freeze([dayResult(rule.ruleId, "n/a")]);
    }
    return resultForTrades(rule.ruleId, trades, () => "n/a");
  }

  if (rule.templateKey === "exclude_entry_price_range") {
    const lower = configuredDecimal(rule, "lowerEntryPrice");
    const upper = configuredDecimal(rule, "upperEntryPrice");
    if (!lower || !upper) return resultForTrades(rule.ruleId, applicable, () => "n/a");
    return resultForTrades(rule.ruleId, applicable, (trade) => {
      if (trade.entryPriceDecimal === null) return "n/a";
      const price = decimal(trade.entryPriceDecimal);
      return price.greaterThanOrEqualTo(lower) && price.lessThanOrEqualTo(upper)
        ? "broken"
        : "followed";
    });
  }

  if (rule.templateKey === "no_new_trades_after_time") {
    const cutoff = rule.configuration.cutoffTime;
    if (!cutoff || !/^\d{2}:\d{2}:\d{2}$/u.test(cutoff)) {
      return resultForTrades(rule.ruleId, applicable, () => "n/a");
    }
    const [hour, minute, second] = cutoff.split(":").map(Number);
    const cutoffSeconds = hour! * 3600 + minute! * 60 + second!;
    return resultForTrades(rule.ruleId, applicable, (trade) => {
      const entrySeconds = localClockSeconds(trade.entryAtUtc, trade.timezone);
      return entrySeconds === null ? "n/a" : entrySeconds >= cutoffSeconds
        ? "broken"
        : "followed";
    });
  }

  if (rule.templateKey === "cooldown_after_loss") {
    const cooldownMinutes = configuredCount(rule, "cooldownMinutes");
    if (cooldownMinutes === null) {
      return resultForTrades(rule.ruleId, applicable, () => "n/a");
    }
    const cooldownMilliseconds = cooldownMinutes * 60 * 1000;
    return resultForTrades(rule.ruleId, applicable, (trade) => {
      const entryAt = timestampMilliseconds(trade.entryAtUtc);
      if (entryAt === null) return "n/a";
      const earlierTrades = applicable.filter((candidate) => {
        if (candidate.roundTripId === trade.roundTripId) return false;
        const exitAt = timestampMilliseconds(candidate.exitAtUtc);
        return exitAt !== null && exitAt <= entryAt;
      });
      for (const earlierTrade of earlierTrades) {
        const exitAt = timestampMilliseconds(earlierTrade.exitAtUtc);
        if (exitAt === null) continue;
        if (earlierTrade.netPnlDecimal === null) {
          if (entryAt < exitAt + cooldownMilliseconds) return "n/a";
          continue;
        }
        if (
          decimal(earlierTrade.netPnlDecimal).lessThan(0) &&
          entryAt < exitAt + cooldownMilliseconds
        ) {
          return "broken";
        }
      }
      return "followed";
    });
  }

  if (rule.templateKey === "cooldown_before_same_ticker_reentry") {
    const cooldownMinutes = configuredCount(rule, "cooldownMinutes");
    if (cooldownMinutes === null) {
      return resultForTrades(rule.ruleId, applicable, () => "n/a");
    }
    const cooldownMilliseconds = cooldownMinutes * 60 * 1000;
    return resultForTrades(rule.ruleId, applicable, (trade) => {
      const entryAt = timestampMilliseconds(trade.entryAtUtc);
      if (entryAt === null) return "n/a";
      const sameTickerCompletedTrades = applicable.filter((candidate) =>
        candidate.roundTripId !== trade.roundTripId &&
        candidate.instrumentId === trade.instrumentId &&
        candidate.exitAtUtc <= trade.entryAtUtc,
      );
      if (sameTickerCompletedTrades.length === 0) return "followed";
      const prior = sameTickerCompletedTrades.at(-1)!;
      const exitAt = timestampMilliseconds(prior.exitAtUtc);
      if (exitAt === null || exitAt >= entryAt) return "n/a";
      return entryAt < exitAt + cooldownMilliseconds ? "broken" : "followed";
    });
  }

  if (rule.templateKey === "maximum_attempts_per_ticker") {
    const maximum = configuredCount(rule, "maximumAttempts");
    if (maximum === null) return resultForTrades(rule.ruleId, applicable, () => "n/a");
    const byInstrument = new Map<string, number>();
    return resultForTrades(rule.ruleId, applicable, (trade) => {
      const count = (byInstrument.get(trade.instrumentId) ?? 0) + 1;
      byInstrument.set(trade.instrumentId, count);
      return count > maximum ? "broken" : "followed";
    });
  }

  if (rule.templateKey === "stop_after_losing_ticker_attempts") {
    const threshold = configuredCount(rule, "losingAttemptThreshold");
    if (threshold === null || !sequenceIsUnambiguous(applicable)) {
      return resultForTrades(rule.ruleId, applicable, () => "n/a");
    }
    const losses = new Map<string, number>();
    return resultForTrades(rule.ruleId, applicable, (trade) => {
      const priorLosses = losses.get(trade.instrumentId) ?? 0;
      const status = priorLosses >= threshold ? "broken" : "followed";
      if (trade.netPnlDecimal === null) return "n/a";
      if (decimal(trade.netPnlDecimal).lessThan(0)) {
        losses.set(trade.instrumentId, priorLosses + 1);
      }
      return status;
    });
  }

  if (rule.templateKey === "maximum_trades_per_day") {
    const maximum = configuredCount(rule, "maximumTrades");
    if (maximum === null) return Object.freeze([dayResult(rule.ruleId, "n/a")]);
    return Object.freeze([dayResult(rule.ruleId,
      applicable.length > maximum ? "broken" : "followed")]);
  }

  if (rule.templateKey === "stop_after_consecutive_losses") {
    const threshold = configuredCount(rule, "consecutiveLossThreshold");
    if (threshold === null || !sequenceIsUnambiguous(applicable) ||
        applicable.some((trade) => trade.netPnlDecimal === null)) {
      return Object.freeze([dayResult(rule.ruleId, "n/a")]);
    }
    let streak = 0;
    for (const trade of applicable) {
      if (streak >= threshold) return Object.freeze([dayResult(rule.ruleId, "broken")]);
      streak = decimal(trade.netPnlDecimal!).lessThan(0) ? streak + 1 : 0;
    }
    return Object.freeze([dayResult(rule.ruleId, "followed")]);
  }

  if (rule.templateKey === "stop_after_total_daily_losses") {
    const threshold = configuredCount(rule, "dailyLossCountLimit");
    if (threshold === null || !sequenceIsUnambiguous(applicable) ||
        applicable.some((trade) => trade.netPnlDecimal === null)) {
      return Object.freeze([dayResult(rule.ruleId, "n/a")]);
    }
    let lossCount = 0;
    for (const trade of applicable) {
      if (lossCount >= threshold) return Object.freeze([dayResult(rule.ruleId, "broken")]);
      if (decimal(trade.netPnlDecimal!).lessThan(0)) lossCount += 1;
    }
    return Object.freeze([dayResult(rule.ruleId, "followed")]);
  }

  if (
    rule.templateKey === "stop_after_daily_realized_loss" ||
    rule.templateKey === "stop_after_daily_realized_gain_limit" ||
    rule.templateKey === "stop_after_profit_giveback"
  ) {
    const configurationKey = rule.templateKey === "stop_after_daily_realized_loss"
      ? "maximumDailyDrawdown"
      : rule.templateKey === "stop_after_daily_realized_gain_limit"
        ? "dailyRealizedGainLimit"
        : "maximumProfitGiveback";
    const limit = configuredDecimal(rule, configurationKey);
    if (!limit || !sequenceIsUnambiguous(applicable) ||
        applicable.some((trade) => trade.netPnlDecimal === null)) {
      return Object.freeze([dayResult(rule.ruleId, "n/a")]);
    }
    let realized = new ExactDecimal(0);
    let peak = new ExactDecimal(0);
    for (const trade of applicable) {
      const breached = rule.templateKey === "stop_after_daily_realized_loss"
        ? realized.lessThanOrEqualTo(limit.negated())
        : rule.templateKey === "stop_after_daily_realized_gain_limit"
          ? realized.greaterThanOrEqualTo(limit)
          : peak.minus(realized).greaterThanOrEqualTo(limit);
      if (breached) return Object.freeze([dayResult(rule.ruleId, "broken")]);
      realized = realized.plus(trade.netPnlDecimal!);
      if (realized.greaterThan(peak)) peak = realized;
    }
    return Object.freeze([dayResult(rule.ruleId, "followed")]);
  }

  return Object.freeze([]);
}

export function evaluateJournalPresetRules(
  rules: readonly JournalRuleRecord[],
  model: JournalTradingDayReadModel,
  swingRoundTripIds: ReadonlySet<string>,
): readonly JournalPresetRuleResult[] {
  const trades = eligibleDayTrades(model, swingRoundTripIds);
  return Object.freeze(rules
    .filter((rule) => rule.lifecycleState === "active" && rule.sourceKind === "template")
    .flatMap((rule) => evaluateTemplate(rule, trades)));
}
