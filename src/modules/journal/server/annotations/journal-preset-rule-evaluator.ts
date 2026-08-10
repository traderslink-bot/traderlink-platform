import Decimal from "decimal.js";

import type { JournalTradingDayReadModel, JournalTradingDayRoundTrip } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import { journalAnalyticsLocalTimeFact } from "@/src/modules/journal-analytics/server/normalize-journal-analytics-facts";
import type { JournalRuleRecord } from "@/src/modules/journal/contracts/journal-annotation-contracts";

export type JournalPresetRuleResult = Readonly<{
  ruleId: string;
  ruleVersionId: string;
  status: "followed" | "broken" | "n/a";
  targetKind: "trading_day" | "round_trip";
  targetRoundTripId: string | null;
  evidence: JournalPresetRuleEvidence;
}>;

export type JournalPresetRuleEvidenceEvent = Readonly<{
  kind: "trigger" | "violation";
  occurredAtUtc: string;
  roundTripId: string;
  netPnlDecimal: string | null;
  valueAfter: string | null;
  valueBefore: string | null;
}>;

export type JournalPresetRuleEvidence = Readonly<{
  feeCoverage: "complete" | "partial" | "unavailable";
  limitation: string | null;
  trigger: JournalPresetRuleEvidenceEvent | null;
  violations: readonly JournalPresetRuleEvidenceEvent[];
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
  if (trade.entryAtUtc < rule.effectiveFromUtc || (rule.effectiveUntilUtc && trade.entryAtUtc >= rule.effectiveUntilUtc)) return false;
  return !rule.activeIntervals || rule.activeIntervals.some((interval) =>
    trade.entryAtUtc >= interval.fromUtc && (!interval.untilUtc || trade.entryAtUtc < interval.untilUtc));
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
  ruleVersionId: string,
  trades: readonly EligibleTrade[],
  evaluate: (
    trade: EligibleTrade,
    index: number,
  ) => Readonly<{
    evidence?: JournalPresetRuleEvidence;
    status: JournalPresetRuleResult["status"];
  }>,
): readonly JournalPresetRuleResult[] {
  return Object.freeze(trades.map((trade, index) => {
    const result = evaluate(trade, index);
    return Object.freeze({
      ruleId,
      ruleVersionId,
      status: result.status,
      targetKind: "round_trip" as const,
      targetRoundTripId: trade.roundTripId,
      evidence: result.evidence ?? emptyEvidence(),
    });
  }));
}

function dayResult(
  ruleId: string,
  ruleVersionId: string,
  status: JournalPresetRuleResult["status"],
  evidence: JournalPresetRuleEvidence = emptyEvidence(),
): JournalPresetRuleResult {
  return Object.freeze({
    feeCoverage: "unavailable",
    ruleId,
    ruleVersionId,
    status,
    targetKind: "trading_day",
    targetRoundTripId: null,
    evidence,
  });
}

function emptyEvidence(limitation: string | null = null): JournalPresetRuleEvidence {
  return Object.freeze({
    feeCoverage: "unavailable",
    limitation,
    trigger: null,
    violations: Object.freeze([]),
  });
}

function event(
  kind: JournalPresetRuleEvidenceEvent["kind"],
  trade: EligibleTrade,
  occurredAtUtc: string,
  valueBefore: string | null = null,
  valueAfter: string | null = null,
): JournalPresetRuleEvidenceEvent {
  return Object.freeze({
    kind,
    occurredAtUtc,
    roundTripId: trade.roundTripId,
    netPnlDecimal: trade.netPnlDecimal,
    valueAfter,
    valueBefore,
  });
}

function brokenEvidence(
  trigger: JournalPresetRuleEvidenceEvent,
  violations: readonly JournalPresetRuleEvidenceEvent[],
): JournalPresetRuleEvidence {
  return Object.freeze({
    feeCoverage: "unavailable",
    limitation: null,
    trigger,
    violations: Object.freeze([...violations]),
  });
}

function unavailable(reason: string): Readonly<{
  evidence: JournalPresetRuleEvidence;
  status: "n/a";
}> {
  return Object.freeze({
    evidence: emptyEvidence(reason),
    status: "n/a",
  });
}

function status(status: "followed" | "broken"): Readonly<{ status: "followed" | "broken" }> {
  return Object.freeze({ status });
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
      return Object.freeze([dayResult(rule.ruleId, rule.versionId, "n/a", emptyEvidence(
        "No eligible completed Day trades were available for this rule.",
      ))]);
    }
    return resultForTrades(rule.ruleId, rule.versionId, applicable, () => unavailable(
      "No eligible completed Day trade was available for this rule.",
    ));
  }

  if (rule.templateKey === "exclude_entry_price_range") {
    const lower = configuredDecimal(rule, "lowerEntryPrice");
    const upper = configuredDecimal(rule, "upperEntryPrice");
    if (!lower || !upper) return resultForTrades(rule.ruleId, rule.versionId, applicable, () => unavailable(
      "The configured entry-price range was unavailable.",
    ));
    return resultForTrades(rule.ruleId, rule.versionId, applicable, (trade) => {
      if (trade.entryPriceDecimal === null) return unavailable(
        "The weighted entry price was unavailable.",
      );
      const price = decimal(trade.entryPriceDecimal);
      if (!price.greaterThanOrEqualTo(lower) || !price.lessThanOrEqualTo(upper)) {
        return status("followed");
      }
      const violation = event(
        "violation",
        trade,
        trade.entryAtUtc,
        `${lower.toFixed()}-${upper.toFixed()}`,
        price.toFixed(),
      );
      return Object.freeze({
        status: "broken" as const,
        evidence: brokenEvidence(violation, [violation]),
      });
    });
  }

  if (rule.templateKey === "no_new_trades_after_time") {
    const cutoff = rule.configuration.cutoffTime;
    if (!cutoff || !/^\d{2}:\d{2}:\d{2}$/u.test(cutoff)) {
      return resultForTrades(rule.ruleId, rule.versionId, applicable, () => unavailable(
        "The configured cutoff time was unavailable.",
      ));
    }
    const [hour, minute, second] = cutoff.split(":").map(Number);
    const cutoffSeconds = hour! * 3600 + minute! * 60 + second!;
    return resultForTrades(rule.ruleId, rule.versionId, applicable, (trade) => {
      const entrySeconds = localClockSeconds(trade.entryAtUtc, trade.timezone);
      if (entrySeconds === null) return unavailable("The entry time was unavailable.");
      if (entrySeconds < cutoffSeconds) return status("followed");
      const violation = event("violation", trade, trade.entryAtUtc, cutoff, cutoff);
      return Object.freeze({
        status: "broken" as const,
        evidence: brokenEvidence(violation, [violation]),
      });
    });
  }

  if (rule.templateKey === "cooldown_after_loss") {
    const cooldownMinutes = configuredCount(rule, "cooldownMinutes");
    if (cooldownMinutes === null) {
      return resultForTrades(rule.ruleId, rule.versionId, applicable, () => unavailable(
        "The cooldown setting was unavailable.",
      ));
    }
    const cooldownMilliseconds = cooldownMinutes * 60 * 1000;
    return resultForTrades(rule.ruleId, rule.versionId, applicable, (trade) => {
      const entryAt = timestampMilliseconds(trade.entryAtUtc);
      if (entryAt === null) return unavailable("The entry time was unavailable.");
      const earlierTrades = applicable.filter((candidate) => {
        if (candidate.roundTripId === trade.roundTripId) return false;
        const exitAt = timestampMilliseconds(candidate.exitAtUtc);
        return exitAt !== null && exitAt <= entryAt;
      });
      for (const earlierTrade of earlierTrades) {
        const exitAt = timestampMilliseconds(earlierTrade.exitAtUtc);
        if (exitAt === null) continue;
        if (earlierTrade.netPnlDecimal === null) {
          if (entryAt < exitAt + cooldownMilliseconds) {
            return unavailable("The prior trade result was unavailable inside the cooldown window.");
          }
          continue;
        }
        if (
          decimal(earlierTrade.netPnlDecimal).lessThan(0) &&
          entryAt < exitAt + cooldownMilliseconds
        ) {
          const trigger = event(
            "trigger",
            earlierTrade,
            earlierTrade.exitAtUtc,
            earlierTrade.netPnlDecimal,
            new Date(exitAt + cooldownMilliseconds).toISOString(),
          );
          const violation = event(
            "violation",
            trade,
            trade.entryAtUtc,
            new Date(exitAt + cooldownMilliseconds).toISOString(),
            trade.entryAtUtc,
          );
          return Object.freeze({
            status: "broken" as const,
            evidence: brokenEvidence(trigger, [violation]),
          });
        }
      }
      return status("followed");
    });
  }

  if (rule.templateKey === "cooldown_before_same_ticker_reentry") {
    const cooldownMinutes = configuredCount(rule, "cooldownMinutes");
    if (cooldownMinutes === null) {
      return resultForTrades(rule.ruleId, rule.versionId, applicable, () => unavailable(
        "The same-ticker cooldown setting was unavailable.",
      ));
    }
    const cooldownMilliseconds = cooldownMinutes * 60 * 1000;
    return resultForTrades(rule.ruleId, rule.versionId, applicable, (trade) => {
      const entryAt = timestampMilliseconds(trade.entryAtUtc);
      if (entryAt === null) return unavailable("The entry time was unavailable.");
      const sameTickerCompletedTrades = applicable.filter((candidate) =>
        candidate.roundTripId !== trade.roundTripId &&
        candidate.instrumentId === trade.instrumentId &&
        candidate.exitAtUtc <= trade.entryAtUtc,
      );
      if (sameTickerCompletedTrades.length === 0) return status("followed");
      const prior = sameTickerCompletedTrades.at(-1)!;
      const exitAt = timestampMilliseconds(prior.exitAtUtc);
      if (exitAt === null || exitAt >= entryAt) {
        return unavailable("The prior same-ticker exit time was unavailable or ambiguous.");
      }
      if (entryAt >= exitAt + cooldownMilliseconds) return status("followed");
      const allowedAt = new Date(exitAt + cooldownMilliseconds).toISOString();
      const trigger = event("trigger", prior, prior.exitAtUtc, prior.exitAtUtc, allowedAt);
      const violation = event("violation", trade, trade.entryAtUtc, allowedAt, trade.entryAtUtc);
      return Object.freeze({
        status: "broken" as const,
        evidence: brokenEvidence(trigger, [violation]),
      });
    });
  }

  if (rule.templateKey === "maximum_attempts_per_ticker") {
    const maximum = configuredCount(rule, "maximumAttempts");
    if (maximum === null) return resultForTrades(rule.ruleId, rule.versionId, applicable, () => unavailable(
      "The ticker-attempt limit was unavailable.",
    ));
    const byInstrument = new Map<string, number>();
    const limitTrades = new Map<string, EligibleTrade>();
    return resultForTrades(rule.ruleId, rule.versionId, applicable, (trade) => {
      const count = (byInstrument.get(trade.instrumentId) ?? 0) + 1;
      byInstrument.set(trade.instrumentId, count);
      if (count === maximum) limitTrades.set(trade.instrumentId, trade);
      if (count <= maximum) return status("followed");
      const limitTrade = limitTrades.get(trade.instrumentId) ?? trade;
      return Object.freeze({
        status: "broken" as const,
        evidence: brokenEvidence(
          event("trigger", limitTrade, limitTrade.entryAtUtc, String(maximum - 1), String(maximum)),
          [event("violation", trade, trade.entryAtUtc, String(maximum), String(count))],
        ),
      });
    });
  }

  if (rule.templateKey === "stop_after_losing_ticker_attempts") {
    const threshold = configuredCount(rule, "losingAttemptThreshold");
    if (threshold === null || !sequenceIsUnambiguous(applicable)) {
      return resultForTrades(rule.ruleId, rule.versionId, applicable, () => unavailable(
        "The losing-attempt limit or exact trade order was unavailable.",
      ));
    }
    const losses = new Map<string, number>();
    const triggerTrades = new Map<string, EligibleTrade>();
    return resultForTrades(rule.ruleId, rule.versionId, applicable, (trade) => {
      const priorLosses = losses.get(trade.instrumentId) ?? 0;
      if (trade.netPnlDecimal === null) return unavailable("The trade result was unavailable.");
      const result = priorLosses >= threshold
        ? Object.freeze({
            status: "broken" as const,
            evidence: brokenEvidence(
              event(
                "trigger",
                triggerTrades.get(trade.instrumentId) ?? trade,
                (triggerTrades.get(trade.instrumentId) ?? trade).exitAtUtc,
                String(Math.max(0, threshold - 1)),
                String(threshold),
              ),
              [event("violation", trade, trade.entryAtUtc, String(threshold), String(priorLosses))],
            ),
          })
        : status("followed");
      if (decimal(trade.netPnlDecimal).lessThan(0)) {
        losses.set(trade.instrumentId, priorLosses + 1);
        if (priorLosses + 1 === threshold) triggerTrades.set(trade.instrumentId, trade);
      }
      return result;
    });
  }

  if (rule.templateKey === "maximum_trades_per_day") {
    const maximum = configuredCount(rule, "maximumTrades");
    if (maximum === null) return Object.freeze([dayResult(
      rule.ruleId,
      rule.versionId,
      "n/a",
      emptyEvidence("The completed-trade limit was unavailable."),
    )]);
    if (applicable.length <= maximum) {
      return Object.freeze([dayResult(rule.ruleId, rule.versionId, "followed")]);
    }
    const triggerTrade = applicable[maximum - 1]!;
    const violatingTrades = applicable.slice(maximum);
    return Object.freeze([dayResult(rule.ruleId, rule.versionId, "broken", brokenEvidence(
      event("trigger", triggerTrade, triggerTrade.entryAtUtc, String(maximum - 1), String(maximum)),
      violatingTrades.map((trade, index) => event(
        "violation",
        trade,
        trade.entryAtUtc,
        String(maximum + index),
        String(maximum + index + 1),
      )),
    ))]);
  }

  if (rule.templateKey === "stop_after_consecutive_losses") {
    const threshold = configuredCount(rule, "consecutiveLossThreshold");
    if (threshold === null || !sequenceIsUnambiguous(applicable) ||
        applicable.some((trade) => trade.netPnlDecimal === null)) {
      return Object.freeze([dayResult(rule.ruleId, rule.versionId, "n/a", emptyEvidence(
        "The loss-streak setting, exact trade order or trade P/L was unavailable.",
      ))]);
    }
    let streak = 0;
    let triggerTrade: EligibleTrade | null = null;
    for (let index = 0; index < applicable.length; index += 1) {
      const trade = applicable[index]!;
      if (streak >= threshold && triggerTrade) {
        return Object.freeze([dayResult(rule.ruleId, rule.versionId, "broken", brokenEvidence(
          event("trigger", triggerTrade, triggerTrade.exitAtUtc, String(threshold - 1), String(threshold)),
          applicable.slice(index).map((item) => event(
            "violation",
            item,
            item.entryAtUtc,
            String(threshold),
            String(threshold),
          )),
        ))]);
      }
      streak = decimal(trade.netPnlDecimal!).lessThan(0) ? streak + 1 : 0;
      if (streak === threshold) triggerTrade = trade;
      if (streak === 0) triggerTrade = null;
    }
    return Object.freeze([dayResult(rule.ruleId, rule.versionId, "followed")]);
  }

  if (rule.templateKey === "stop_after_total_daily_losses") {
    const threshold = configuredCount(rule, "dailyLossCountLimit");
    if (threshold === null || !sequenceIsUnambiguous(applicable) ||
        applicable.some((trade) => trade.netPnlDecimal === null)) {
      return Object.freeze([dayResult(rule.ruleId, rule.versionId, "n/a", emptyEvidence(
        "The daily-loss count, exact trade order or trade P/L was unavailable.",
      ))]);
    }
    let lossCount = 0;
    let triggerTrade: EligibleTrade | null = null;
    for (let index = 0; index < applicable.length; index += 1) {
      const trade = applicable[index]!;
      if (lossCount >= threshold && triggerTrade) {
        return Object.freeze([dayResult(rule.ruleId, rule.versionId, "broken", brokenEvidence(
          event("trigger", triggerTrade, triggerTrade.exitAtUtc, String(threshold - 1), String(threshold)),
          applicable.slice(index).map((item) => event(
            "violation",
            item,
            item.entryAtUtc,
            String(threshold),
            String(lossCount),
          )),
        ))]);
      }
      if (decimal(trade.netPnlDecimal!).lessThan(0)) {
        lossCount += 1;
        if (lossCount === threshold) triggerTrade = trade;
      }
    }
    return Object.freeze([dayResult(rule.ruleId, rule.versionId, "followed")]);
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
      return Object.freeze([dayResult(rule.ruleId, rule.versionId, "n/a", emptyEvidence(
        "The configured threshold, exact trade order or trade P/L was unavailable.",
      ))]);
    }
    let realized = new ExactDecimal(0);
    let peak = new ExactDecimal(0);
    let trigger: JournalPresetRuleEvidenceEvent | null = null;
    for (let index = 0; index < applicable.length; index += 1) {
      const trade = applicable[index]!;
      if (trigger) {
        return Object.freeze([dayResult(rule.ruleId, rule.versionId, "broken", brokenEvidence(
          trigger,
          applicable.slice(index).map((item) => event(
            "violation",
            item,
            item.entryAtUtc,
            trigger!.valueAfter,
            trigger!.valueAfter,
          )),
        ))]);
      }
      const before = rule.templateKey === "stop_after_profit_giveback"
        ? peak.minus(realized)
        : realized;
      realized = realized.plus(trade.netPnlDecimal!);
      if (realized.greaterThan(peak)) peak = realized;
      const after = rule.templateKey === "stop_after_profit_giveback"
        ? peak.minus(realized)
        : realized;
      const reached = rule.templateKey === "stop_after_daily_realized_loss"
        ? realized.lessThanOrEqualTo(limit.negated())
        : rule.templateKey === "stop_after_daily_realized_gain_limit"
          ? realized.greaterThanOrEqualTo(limit)
          : after.greaterThanOrEqualTo(limit);
      if (reached) {
        trigger = event("trigger", trade, trade.exitAtUtc, before.toFixed(), after.toFixed());
      }
    }
    return Object.freeze([dayResult(rule.ruleId, rule.versionId, "followed")]);
  }

  return Object.freeze([]);
}

export function evaluateJournalPresetRules(
  rules: readonly JournalRuleRecord[],
  model: JournalTradingDayReadModel,
  swingRoundTripIds: ReadonlySet<string>,
): readonly JournalPresetRuleResult[] {
  const trades = eligibleDayTrades(model, swingRoundTripIds);
  const feeCoverage = model.coverage.readyClosedCount > 0 &&
      model.coverage.feeCompleteCount === model.coverage.readyClosedCount
    ? "complete" as const
    : model.coverage.feeCompleteCount > 0
      ? "partial" as const
      : "unavailable" as const;
  return Object.freeze(rules
    .filter((rule) => rule.lifecycleState === "active" && rule.sourceKind === "template")
    .flatMap((rule) => evaluateTemplate(rule, trades))
    .map((result) => Object.freeze({
      ...result,
      evidence: Object.freeze({ ...result.evidence, feeCoverage }),
    })));
}
