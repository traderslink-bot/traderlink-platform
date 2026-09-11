import "server-only";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  withJournalAnalyticsDashboardRuntime,
  withJournalAnalyticsReportingDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import type { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import {
  withReadonlyJournalAnnotations,
  withScopedJournalAnnotations,
} from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
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
  currency: string;
  events: readonly RuleResultEvent[];
  summaries: readonly RuleResultSummary[];
}>;

export type RuleResultsDateRange = Readonly<{
  endDate: string | null;
  startDate: string | null;
}>;

export type WorkspaceRuleResultsCard = Readonly<{
  brokenRuleCount: number;
  recentBrokenRuleTitles: readonly string[];
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

type WorkspaceBrokenRule = Readonly<{
  date: string;
  label: string;
  ruleId: string;
}>;

export type WorkspaceRuleResultsCardTimings = Readonly<{
  annotations: number;
  customAndAggregation: number;
  models: number;
  presets: number;
}>;

function elapsedMilliseconds(started: number): number {
  return performance.now() - started;
}

function workspaceRuleResultsCardFromBrokenRules(
  brokenRules: readonly WorkspaceBrokenRule[],
): WorkspaceRuleResultsCard {
  const broken = [...brokenRules].sort((left, right) =>
    right.date.localeCompare(left.date) || left.label.localeCompare(right.label));
  return Object.freeze({
    brokenRuleCount: new Set(broken.map((item) => item.ruleId)).size,
    recentBrokenRuleTitles: Object.freeze(
      [...new Set(broken.map((item) => item.label))].slice(0, 3),
    ),
  });
}

export function workspaceRuleResultsCard(view: RuleResultsView): WorkspaceRuleResultsCard {
  return workspaceRuleResultsCardFromBrokenRules(
    view.events.filter((event) => event.result === "Broken"),
  );
}

export function readWorkspaceRuleResultsCardFromRuntime(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  dashboard: JournalDashboardReadModelService,
  dateRange: RuleResultsDateRange = { endDate: null, startDate: null },
  onTiming?: (timings: WorkspaceRuleResultsCardTimings) => void,
): WorkspaceRuleResultsCard {
  let annotations = 0;
  let customAndAggregation = 0;
  let models = 0;
  let presets = 0;
  let started = performance.now();
  const latest = dashboard.getTradingDay(scope, {
    currency: null,
    requestedDate: null,
  });
  const dates = latest.availableTradingDates.filter((date) =>
    (!dateRange.startDate || date >= dateRange.startDate) &&
    (!dateRange.endDate || date <= dateRange.endDate));
  models += elapsedMilliseconds(started);

  const card = withScopedJournalAnnotations(database, scope, (service, account) => {
    const broken: WorkspaceBrokenRule[] = [];
    for (const date of dates) {
      started = performance.now();
      const model = dashboard.getTradingDay(scope, {
        currency: null,
        requestedDate: date,
      });
      models += elapsedMilliseconds(started);
      const rangeStart = `${date}T00:00:00.000Z`;
      const rangeEndDate = new Date(rangeStart);
      rangeEndDate.setUTCDate(rangeEndDate.getUTCDate() + 2);
      started = performance.now();
      const rules = service.listRulesForEvaluation(
        account,
        rangeStart,
        rangeEndDate.toISOString(),
      );
      annotations += elapsedMilliseconds(started);
      started = performance.now();
      const trades = model.tickers.flatMap((ticker) =>
        ticker.roundTrips.map((trade) => Object.freeze({
          entryAt: trade.entryAtUtc,
          id: trade.roundTripId,
        })));
      models += elapsedMilliseconds(started);

      started = performance.now();
      for (const result of evaluateJournalPresetRules(rules, model, new Set())) {
        if (result.status !== "broken") continue;
        const rule = rules.find((candidate) =>
          candidate.ruleId === result.ruleId &&
          candidate.versionId === result.ruleVersionId);
        if (rule) broken.push(Object.freeze({ date, label: rule.title, ruleId: rule.ruleId }));
      }
      presets += elapsedMilliseconds(started);

      started = performance.now();
      const tradingDayId = service.resolveTradingDayId(account, date);
      const reviews = tradingDayId ? service.listRuleReviews(account, {
        roundTripIds: trades.map((trade) => trade.id),
        tradingDayId,
      }) : [];
      annotations += elapsedMilliseconds(started);
      started = performance.now();
      for (const rule of rules.filter((candidate) => candidate.sourceKind === "custom")) {
        const eligibleTargetIds = new Set<string>();
        if (tradingDayId && (rule.reviewScope === "day" || rule.reviewScope === "both")) {
          eligibleTargetIds.add(tradingDayId);
        }
        if (rule.reviewScope === "trade" || rule.reviewScope === "both") {
          for (const trade of trades) {
            if (trade.entryAt >= rule.effectiveFromUtc &&
                (!rule.effectiveUntilUtc || trade.entryAt < rule.effectiveUntilUtc) &&
                (!rule.activeIntervals || rule.activeIntervals.some((interval) =>
                  trade.entryAt >= interval.fromUtc &&
                  (!interval.untilUtc || trade.entryAt < interval.untilUtc)))) {
              eligibleTargetIds.add(trade.id);
            }
          }
        }
        if (reviews.some((review) =>
          review.ruleId === rule.ruleId &&
          review.ruleVersionId === rule.versionId &&
          review.status === "broken" &&
          eligibleTargetIds.has(review.tradingDayId ?? review.roundTripId ?? ""))) {
          broken.push(Object.freeze({ date, label: rule.title, ruleId: rule.ruleId }));
        }
      }
      customAndAggregation += elapsedMilliseconds(started);
    }

    started = performance.now();
    const result = workspaceRuleResultsCardFromBrokenRules(broken);
    customAndAggregation += elapsedMilliseconds(started);
    return result;
  });
  try {
    onTiming?.(Object.freeze({ annotations, customAndAggregation, models, presets }));
  } catch {
    // Timing diagnostics must never alter the Rules card result.
  }
  return card;
}

export async function readRuleResults(
  scope: WorkspaceAccessScope,
  dateRange: RuleResultsDateRange = { endDate: null, startDate: null },
): Promise<RuleResultsView> {
  const reporting = await withJournalAnalyticsReportingDashboardRuntime(scope, ({ dashboard, reportingCurrency }) => {
    const latest = dashboard.getTradingDay(scope, { currency: null, requestedDate: null });
    return Object.freeze({
      currency: reportingCurrency,
      models: latest.availableTradingDates
        .filter((date) => (!dateRange.startDate || date >= dateRange.startDate) && (!dateRange.endDate || date <= dateRange.endDate))
        .map((date) => dashboard.getTradingDay(scope, {
        currency: reportingCurrency,
        requestedDate: date,
        })),
    });
  });
  const sourceModels = withJournalAnalyticsDashboardRuntime(scope, ({ dashboard }) =>
    reporting.models.map((model) => dashboard.getTradingDay(scope, {
      currency: null,
      requestedDate: model.date,
    })));
  return withReadonlyJournalAnnotations(scope, (service, account) => {
    const events: RuleResultEvent[] = [];
    for (const [modelIndex, model] of sourceModels.entries()) {
      const reportingModel = reporting.models[modelIndex]!;
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
      const reportingPnlByRoundTrip = new Map(reportingModel.tickers.flatMap((ticker) =>
        ticker.roundTrips.map((trade) => [trade.roundTripId, trade.netPnlDecimal] as const)));
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
            netPnl: trade ? reportingPnlByRoundTrip.get(trade.id) ?? null : null,
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
            netPnl: target.trade
              ? reportingPnlByRoundTrip.get(target.trade.id) ?? null
              : reportingModel.netPnlDecimal,
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
    return Object.freeze({
      currency: reporting.currency,
      events: Object.freeze(events),
      summaries: summarize(events),
    });
  });
}
