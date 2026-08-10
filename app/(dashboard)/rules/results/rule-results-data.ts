import "server-only";

import Decimal from "decimal.js";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { withJournalAnalyticsDashboardRuntime } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { withReadonlyJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { evaluateJournalPresetRules } from "@/src/modules/journal/server/annotations/journal-preset-rule-evaluator";

export type RuleResultEvent = Readonly<{
  date: string;
  feeCoverage: "complete" | "partial" | "unavailable" | null;
  label: string;
  netPnl: string | null;
  note: string;
  result: "Broken" | "Followed" | "N/A" | "Not selected";
  ruleId: string;
  ruleVersion: number;
  source: "Preset" | "Manual";
  target: string;
  ticker: string | null;
}>;

export type RuleResultSummary = Readonly<{
  broken: number;
  brokenLosses: number;
  brokenWins: number;
  combinedPnl: string | null;
  eligibleChecks: number;
  eligibleTradingDays: number;
  followed: number;
  feeCoverage: "complete" | "partial" | "unavailable" | null;
  label: string;
  largestGain: string | null;
  largestGainSharePercent: number | null;
  largestLoss: string | null;
  mostFrequentTicker: string | null;
  mostFrequentTickerCount: number;
  nA: number;
  notSelected: number;
  ruleId: string;
  ruleVersion: number;
  source: "Preset" | "Manual";
  tradingDays: number;
}>;

export type RuleResultsView = Readonly<{
  events: readonly RuleResultEvent[];
  summaries: readonly RuleResultSummary[];
}>;

function summarize(events: readonly RuleResultEvent[]): readonly RuleResultSummary[] {
  const groups = new Map<string, RuleResultEvent[]>();
  for (const event of events) {
    const key = `${event.ruleId}:${event.ruleVersion}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return Object.freeze([...groups.values()].map((items) => {
    const brokenItems = items.filter((item) => item.result === "Broken");
    const pnl = brokenItems.flatMap((item) => item.netPnl === null ? [] : [new Decimal(item.netPnl)]);
    const total = pnl.length ? Decimal.sum(...pnl) : null;
    const gains = pnl.filter((value) => value.greaterThan(0));
    const largestGain = gains.sort((a, b) => b.comparedTo(a))[0] ?? null;
    const gainTotal = gains.length ? Decimal.sum(...gains) : null;
    const tickerCounts = new Map<string, number>();
    for (const item of brokenItems) if (item.ticker) tickerCounts.set(item.ticker, (tickerCounts.get(item.ticker) ?? 0) + 1);
    const mostFrequentTicker = [...tickerCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0] ?? null;
    const feeCoverageValues = new Set(items.flatMap((item) => item.feeCoverage ? [item.feeCoverage] : []));
    return Object.freeze({
      broken: items.filter((item) => item.result === "Broken").length,
      brokenLosses: pnl.filter((value) => value.lessThan(0)).length,
      brokenWins: pnl.filter((value) => value.greaterThan(0)).length,
      combinedPnl: total?.toFixed() ?? null,
      eligibleChecks: items.length,
      eligibleTradingDays: new Set(items.map((item) => item.date)).size,
      followed: items.filter((item) => item.result === "Followed").length,
      feeCoverage: feeCoverageValues.size === 0 ? null : feeCoverageValues.size === 1 ? [...feeCoverageValues][0]! : "partial",
      label: items[0]!.label,
      largestGain: largestGain?.toFixed() ?? null,
      largestGainSharePercent: largestGain && gainTotal
        ? Number(largestGain.dividedBy(gainTotal).times(100).toDecimalPlaces(0).toFixed())
        : null,
      largestLoss: pnl.filter((value) => value.lessThan(0)).sort((a, b) => a.comparedTo(b))[0]?.toFixed() ?? null,
      mostFrequentTicker: mostFrequentTicker?.[0] ?? null,
      mostFrequentTickerCount: mostFrequentTicker?.[1] ?? 0,
      nA: items.filter((item) => item.result === "N/A").length,
      notSelected: items.filter((item) => item.result === "Not selected").length,
      ruleId: items[0]!.ruleId,
      ruleVersion: items[0]!.ruleVersion,
      source: items[0]!.source,
      tradingDays: new Set(brokenItems.map((item) => item.date)).size,
    });
  }).sort((left, right) => left.label.localeCompare(right.label)));
}

export function readRuleResults(scope: WorkspaceAccessScope): RuleResultsView {
  const models = withJournalAnalyticsDashboardRuntime(scope, ({ dashboard }) => {
    const latest = dashboard.getTradingDay(scope, { currency: null, requestedDate: null });
    return latest.availableTradingDates.map((date) => dashboard.getTradingDay(scope, {
      currency: latest.currency,
      requestedDate: date,
    }));
  });
  return withReadonlyJournalAnnotations(scope, (service, account) => {
    const events: RuleResultEvent[] = [];
    for (const model of models) {
      const rangeStart = `${model.date}T00:00:00.000Z`;
      const rangeEndDate = new Date(rangeStart);
      rangeEndDate.setUTCDate(rangeEndDate.getUTCDate() + 2);
      const rules = service.listRulesForEvaluation(account, rangeStart, rangeEndDate.toISOString());
      const trades = model.tickers.flatMap((ticker) => ticker.roundTrips.map((trade) => ({
        id: trade.roundTripId,
        entryAt: trade.entryAtUtc,
        pnl: trade.netPnlDecimal,
        ticker: ticker.symbol,
      })));
      const tradeById = new Map(trades.map((trade) => [trade.id, trade]));
      for (const result of evaluateJournalPresetRules(rules, model, new Set())) {
        const rule = rules.find((candidate) => candidate.ruleId === result.ruleId && candidate.versionId === result.ruleVersionId);
        if (!rule) continue;
        const brokenEvents = result.status === "broken" && result.evidence.violations.length
          ? result.evidence.violations
          : [null];
        for (const evidence of brokenEvents) {
          const trade = evidence ? tradeById.get(evidence.roundTripId) : result.targetRoundTripId ? tradeById.get(result.targetRoundTripId) : null;
          events.push(Object.freeze({
            date: model.date,
            feeCoverage: result.evidence.feeCoverage,
            label: rule.title,
            netPnl: trade?.pnl ?? null,
            note: "",
            result: result.status === "n/a" ? "N/A" : result.status === "broken" ? "Broken" : "Followed",
            ruleId: rule.ruleId,
            ruleVersion: rule.versionNumber,
            source: "Preset",
            target: trade ? "Trade" : "Day",
            ticker: trade?.ticker ?? null,
          }));
        }
      }
      const tradingDayId = service.resolveTradingDayId(account, model.date);
      const reviews = tradingDayId ? service.listRuleReviews(account, {
        roundTripIds: trades.map((trade) => trade.id),
        tradingDayId,
      }) : [];
      for (const rule of rules.filter((candidate) => candidate.sourceKind === "custom")) {
        const targets = [
          ...(tradingDayId && (rule.reviewScope === "day" || rule.reviewScope === "both") ? [{ id: tradingDayId, target: "Day", trade: null }] : []),
          ...(rule.reviewScope === "trade" || rule.reviewScope === "both" ? trades
            .filter((trade) => trade.entryAt >= rule.effectiveFromUtc &&
              (!rule.effectiveUntilUtc || trade.entryAt < rule.effectiveUntilUtc) &&
              (!rule.activeIntervals || rule.activeIntervals.some((interval) =>
                trade.entryAt >= interval.fromUtc && (!interval.untilUtc || trade.entryAt < interval.untilUtc))))
            .map((trade) => ({ id: trade.id, target: "Trade", trade })) : []),
        ];
        for (const target of targets) {
          const review = reviews.find((candidate) => candidate.ruleId === rule.ruleId && candidate.ruleVersionId === rule.versionId && (candidate.tradingDayId === target.id || candidate.roundTripId === target.id));
          events.push(Object.freeze({
            date: model.date,
            feeCoverage: null,
            label: rule.title,
            netPnl: target.trade?.pnl ?? model.netPnlDecimal,
            note: review?.note ?? "",
            result: review?.status === "broken" ? "Broken" : review?.status === "followed" ? "Followed" : "Not selected",
            ruleId: rule.ruleId,
            ruleVersion: rule.versionNumber,
            source: "Manual",
            target: target.target,
            ticker: target.trade?.ticker ?? null,
          }));
        }
      }
    }
    return Object.freeze({ events: Object.freeze(events), summaries: summarize(events) });
  });
}
