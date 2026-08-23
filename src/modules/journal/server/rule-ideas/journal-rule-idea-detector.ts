import Decimal from "decimal.js";

import type { JournalTradingDayReadModel, JournalTradingDayRoundTrip } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import { journalAnalyticsLocalTimeFact } from "@/src/modules/journal-analytics/server/normalize-journal-analytics-facts";
import type { JournalRuleRecord } from "@/src/modules/journal/contracts/journal-annotation-contracts";
import {
  JOURNAL_RULE_IDEA_EVIDENCE_VERSION,
  type JournalRuleIdeaEvidence,
  type JournalRuleIdeaTemplateId,
} from "@/src/modules/journal/contracts/journal-rule-idea-contracts";
import { evaluateJournalPresetRules } from "@/src/modules/journal/server/annotations/journal-preset-rule-evaluator";

const ExactDecimal = Decimal.clone({ precision: 160, rounding: Decimal.ROUND_HALF_UP });
const LIMITATION = "Historical results do not prove what a rule would do in future trading." as const;

type Candidate = Readonly<{
  templateId: JournalRuleIdeaTemplateId;
  configuration: Readonly<Record<string, string>>;
  minimumAffectedTrades: number;
  minimumTriggerEvents: number;
}>;

type TradeWithDate = Readonly<{ date: string; trade: JournalTradingDayRoundTrip }>;

export function compareJournalRuleIdeaSupport(
  left: JournalRuleIdeaEvidence,
  right: JournalRuleIdeaEvidence,
): number {
  return right.triggerDays - left.triggerDays ||
    right.affectedTradeCount - left.affectedTradeCount ||
    right.triggerCount - left.triggerCount ||
    left.templateId.localeCompare(right.templateId) ||
    JSON.stringify(left.configuration).localeCompare(JSON.stringify(right.configuration)) ||
    left.currency.localeCompare(right.currency);
}

function tradesForDay(model: JournalTradingDayReadModel, swings: ReadonlySet<string>): readonly JournalTradingDayRoundTrip[] {
  return Object.freeze(model.tickers.flatMap((ticker) => ticker.roundTrips).filter((trade) =>
    !swings.has(trade.roundTripId) &&
    journalAnalyticsLocalTimeFact(trade.entryAtUtc, trade.timezone).localDate === model.date &&
    journalAnalyticsLocalTimeFact(trade.exitAtUtc, trade.timezone).localDate === model.date,
  ).sort((left, right) => left.entryAtUtc.localeCompare(right.entryAtUtc) ||
    left.exitAtUtc.localeCompare(right.exitAtUtc) || left.roundTripId.localeCompare(right.roundTripId)));
}

function sum(values: readonly Decimal[]): Decimal {
  return values.reduce((total, value) => total.plus(value), new ExactDecimal(0));
}

function rule(candidate: Candidate, asOfUtc: string): JournalRuleRecord {
  return Object.freeze({
    ruleId: `candidate:${candidate.templateId}`,
    versionId: `candidate:${candidate.templateId}:${JSON.stringify(candidate.configuration)}`,
    sourceKind: "template" as const,
    templateKey: candidate.templateId,
    title: candidate.templateId,
    statement: candidate.templateId,
    category: "trade",
    reviewScope: "both" as const,
    isFocus: false,
    configuration: candidate.configuration,
    lifecycleState: "active" as const,
    versionNumber: 1,
    revision: 1,
    effectiveFromUtc: "0000-01-01T00:00:00.000Z",
    createdAtUtc: asOfUtc,
    updatedAtUtc: asOfUtc,
  });
}

function moneyThresholds(models: readonly JournalTradingDayReadModel[], swings: ReadonlySet<string>): readonly string[] {
  const points: Decimal[] = [];
  for (const model of models) {
    let realized = new ExactDecimal(0);
    let peak = new ExactDecimal(0);
    for (const trade of tradesForDay(model, swings)) {
      if (trade.netPnlDecimal === null) continue;
      realized = realized.plus(trade.netPnlDecimal);
      if (realized.gt(peak)) peak = realized;
      if (!realized.isZero()) points.push(realized.abs());
      if (peak.gt(realized)) points.push(peak.minus(realized));
    }
  }
  const sorted = points.filter((value) => value.gt(0)).sort((a, b) => a.comparedTo(b));
  if (sorted.length === 0) return Object.freeze([]);
  return Object.freeze([...new Set([0.25, 0.5, 0.75].map((quantile) => {
    const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * quantile));
    return sorted[index]!.toDecimalPlaces(2).toFixed();
  }).filter((value) => new ExactDecimal(value).gt(0)))].sort((a, b) => new ExactDecimal(a).comparedTo(b)));
}

function candidates(models: readonly JournalTradingDayReadModel[], swings: ReadonlySet<string>): readonly Candidate[] {
  const allTrades = models.map((model) => tradesForDay(model, swings));
  const maxTrades = Math.max(0, ...allTrades.map((trades) => trades.length));
  const maxTickerAttempts = Math.max(0, ...allTrades.flatMap((trades) => {
    const counts = new Map<string, number>();
    for (const trade of trades) counts.set(trade.instrumentId, (counts.get(trade.instrumentId) ?? 0) + 1);
    return [...counts.values()];
  }));
  const result: Candidate[] = [];
  const add = (templateId: JournalRuleIdeaTemplateId, key: string, values: readonly string[], minimumAffectedTrades: number, minimumTriggerEvents: number) => {
    for (const value of values) result.push(Object.freeze({
      templateId,
      configuration: Object.freeze({ [key]: value }),
      minimumAffectedTrades,
      minimumTriggerEvents,
    }));
  };
  add("cooldown_after_loss", "cooldownMinutes", ["5", "10", "15", "30", "60"], 8, 8);
  add("cooldown_before_same_ticker_reentry", "cooldownMinutes", ["5", "10", "15", "30", "60"], 8, 8);
  add("maximum_attempts_per_ticker", "maximumAttempts", Array.from({ length: Math.min(5, Math.max(0, maxTickerAttempts - 1)) }, (_, index) => String(index + 1)), 8, 8);
  add("maximum_trades_per_day", "maximumTrades", Array.from({ length: Math.min(8, Math.max(0, maxTrades - 1)) }, (_, index) => String(index + 1)), 8, 8);
  add("no_new_trades_after_time", "cutoffTime", Array.from({ length: 12 }, (_, index) => `${String(10 + Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}:00`), 8, 8);
  add("stop_after_consecutive_losses", "consecutiveLossThreshold", ["2", "3", "4"], 8, 5);
  add("stop_after_total_daily_losses", "dailyLossCountLimit", ["2", "3", "4"], 8, 5);
  add("stop_after_losing_ticker_attempts", "losingAttemptThreshold", ["1", "2", "3", "4"], 6, 6);
  const thresholds = moneyThresholds(models, swings);
  add("stop_after_daily_realized_loss", "maximumDailyDrawdown", thresholds, 8, 5);
  add("stop_after_profit_giveback", "maximumProfitGiveback", thresholds, 8, 5);
  add("stop_after_daily_realized_gain_limit", "dailyRealizedGainLimit", thresholds, 8, 5);
  return Object.freeze(result);
}

function evaluateCandidate(input: Readonly<{
  candidate: Candidate;
  models: readonly JournalTradingDayReadModel[];
  swings: ReadonlySet<string>;
  asOfUtc: string;
  eligibleExecutions: number;
}>): JournalRuleIdeaEvidence | null {
  const dayTrades = new Map(input.models.map((model) => [model.date, tradesForDay(model, input.swings)]));
  const affected = new Map<string, TradeWithDate>();
  const triggerKeys = new Set<string>();
  const triggerDays = new Set<string>();
  const candidateRule = rule(input.candidate, input.asOfUtc);
  for (const model of input.models) {
    for (const result of evaluateJournalPresetRules([candidateRule], model, input.swings)) {
      if (result.status !== "broken") continue;
      triggerDays.add(model.date);
      if (result.evidence.trigger) triggerKeys.add(`${model.date}:${result.evidence.trigger.roundTripId}:${result.evidence.trigger.occurredAtUtc}`);
      for (const violation of result.evidence.violations) {
        const trade = dayTrades.get(model.date)?.find((item) => item.roundTripId === violation.roundTripId);
        if (trade) affected.set(trade.roundTripId, Object.freeze({ date: model.date, trade }));
      }
    }
  }
  const affectedRows = [...affected.values()];
  const comparisons = [...triggerDays].flatMap((date) => (dayTrades.get(date) ?? [])
    .filter((trade) => !affected.has(trade.roundTripId))
    .map((trade) => Object.freeze({ date, trade })));
  if (triggerDays.size < 3 || triggerKeys.size < input.candidate.minimumTriggerEvents ||
      affectedRows.length < input.candidate.minimumAffectedTrades || comparisons.length === 0) return null;
  if ([...affectedRows, ...comparisons].some((row) => row.trade.netPnlDecimal === null)) return null;
  const affectedValues = affectedRows.map((row) => new ExactDecimal(row.trade.netPnlDecimal!));
  const comparisonValues = comparisons.map((row) => new ExactDecimal(row.trade.netPnlDecimal!));
  const affectedPnl = sum(affectedValues);
  const comparisonPnl = sum(comparisonValues);
  const affectedAverage = affectedPnl.dividedBy(affectedValues.length);
  const comparisonAverage = comparisonPnl.dividedBy(comparisonValues.length);
  const worst = [...affectedValues].sort((left, right) => left.comparedTo(right))[0]!;
  const withoutWorst = affectedPnl.minus(worst);
  if (!affectedPnl.lt(0) || !affectedPnl.lt(comparisonPnl) || !affectedAverage.lt(comparisonAverage) ||
      affectedValues.length < 2 || !withoutWorst.lt(0) || !withoutWorst.dividedBy(affectedValues.length - 1).lt(comparisonAverage)) return null;
  const tickerCounts = new Map<string, number>();
  for (const row of affectedRows) tickerCounts.set(row.trade.symbol, (tickerCounts.get(row.trade.symbol) ?? 0) + 1);
  const dominant = [...tickerCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0] ?? null;
  const dominantShare = new ExactDecimal(dominant?.[1] ?? 0).dividedBy(affectedRows.length);
  if (dominantShare.gt(0.5)) return null;
  const dates = [...new Set(input.models.map((model) => model.date))].sort();
  let recentAndEarlierConsistent = true;
  if (dates.length >= 6) {
    const split = dates[Math.floor(dates.length / 2)]!;
    const earlier = sum(affectedRows.filter((row) => row.date < split).map((row) => new ExactDecimal(row.trade.netPnlDecimal!)));
    const recent = sum(affectedRows.filter((row) => row.date >= split).map((row) => new ExactDecimal(row.trade.netPnlDecimal!)));
    recentAndEarlierConsistent = earlier.lt(0) && recent.lt(0);
  }
  if (!recentAndEarlierConsistent) return null;
  const revisions = [...new Set(input.models.map((model) => model.factSetRevisionSha256))];
  if (revisions.length !== 1 || input.models.length === 0) return null;
  return Object.freeze({
    evidenceVersion: JOURNAL_RULE_IDEA_EVIDENCE_VERSION,
    templateId: input.candidate.templateId,
    configuration: input.candidate.configuration,
    currency: input.models[0]!.currency!,
    periodStart: input.models[0]!.date,
    periodEnd: input.models.at(-1)!.date,
    eligibleTradingDays: input.models.filter((model) => (dayTrades.get(model.date)?.length ?? 0) > 0).length,
    eligibleTrades: [...dayTrades.values()].reduce((count, trades) => count + trades.length, 0),
    eligibleExecutions: input.eligibleExecutions,
    triggerCount: triggerKeys.size,
    triggerDays: triggerDays.size,
    affectedTradeCount: affectedRows.length,
    comparisonTradeCount: comparisons.length,
    affectedPnlDecimal: affectedPnl.toFixed(),
    comparisonPnlDecimal: comparisonPnl.toFixed(),
    affectedAveragePnlDecimal: affectedAverage.toFixed(),
    comparisonAveragePnlDecimal: comparisonAverage.toFixed(),
    affectedPnlWithoutWorstTradeDecimal: withoutWorst.toFixed(),
    dominantTicker: dominant?.[0] ?? null,
    dominantTickerShareDecimal: dominantShare.toFixed(),
    recentAndEarlierConsistent,
    factSetRevisionSha256: revisions[0]!,
    affectedRoundTripIds: Object.freeze(affectedRows.map((row) => row.trade.roundTripId).sort()),
    comparisonRoundTripIds: Object.freeze(comparisons.map((row) => row.trade.roundTripId).sort()),
    limitation: LIMITATION,
  });
}

export function detectJournalRuleIdeas(input: Readonly<{
  models: readonly JournalTradingDayReadModel[];
  swingRoundTripIds: ReadonlySet<string>;
  activeTemplateIds?: ReadonlySet<string>;
  asOfUtc: string;
}>): readonly JournalRuleIdeaEvidence[] {
  const models = [...input.models].filter((model) => model.currency !== null).sort((left, right) => left.date.localeCompare(right.date));
  const eligibleTrades = models.reduce((count, model) => count + tradesForDay(model, input.swingRoundTripIds).length, 0);
  const executionIds = new Set(models.flatMap((model) => model.executionActivity
    .filter((execution) => !execution.needsDecision && execution.projectionStates.includes("ready_closed"))
    .map((execution) => execution.executionVersionId)));
  const activeDays = models.filter((model) => tradesForDay(model, input.swingRoundTripIds).length > 0).length;
  if (activeDays < 3 || eligibleTrades < 20 || executionIds.size < 50) return Object.freeze([]);
  const evidence = candidates(models, input.swingRoundTripIds).flatMap((candidate) => {
    if (input.activeTemplateIds?.has(candidate.templateId)) return [];
    const result = evaluateCandidate({
      candidate,
      models,
      swings: input.swingRoundTripIds,
      asOfUtc: input.asOfUtc,
      eligibleExecutions: executionIds.size,
    });
    return result ? [result] : [];
  });
  const bestByTemplate = new Map<JournalRuleIdeaTemplateId, JournalRuleIdeaEvidence>();
  for (const item of evidence) {
    const current = bestByTemplate.get(item.templateId);
    if (!current || compareJournalRuleIdeaSupport(item, current) < 0) {
      bestByTemplate.set(item.templateId, item);
    }
  }
  return Object.freeze([...bestByTemplate.values()].sort(compareJournalRuleIdeaSupport));
}
