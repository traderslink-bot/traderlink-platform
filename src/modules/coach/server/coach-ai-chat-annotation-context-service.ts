import "server-only";

import Decimal from "decimal.js";

import type { CoachAiChatAnalysisScope } from "../contracts/ai-chat-contracts";
import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  CoachAiChatFactualToolError,
  type CoachAiChatFactualToolResponse,
  type CoachAiChatTradeAnnotationsRequest,
  type CoachAiChatTradingRuleResultsRequest,
  type CoachAiChatTradingRulesRequest,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import type { JournalDashboardReadModelService } from
  "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import type { JournalAnalyticsFactSetService } from
  "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import type { JournalAnnotationService } from
  "@/src/modules/journal/server/annotations/journal-annotation-service";
import { evaluateJournalPresetRules } from
  "@/src/modules/journal/server/annotations/journal-preset-rule-evaluator";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from
  "@/src/modules/platform/contracts/workspace-access-scope";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const MAX_RULE_RESULT_DAYS = 62;
const MAX_RULE_RESULT_EVENTS = 50;

type RuleEvent = Readonly<{
  date: string;
  feeCoverage: "complete" | "partial" | "unavailable" | null;
  label: string;
  netPnlDecimal: string | null;
  note: string;
  result: "Broken" | "Followed" | "N/A" | "Not selected";
  ruleKey: string;
  ruleVersion: number;
  source: "Preset" | "Custom";
  target: "Day" | "Trade";
  ticker: string | null;
}>;

function invalid(): never {
  throw new CoachAiChatFactualToolError("invalid_request");
}

function notFound(): never {
  throw new CoachAiChatFactualToolError("not_found");
}

function assertDate(value: string): void {
  if (!DATE_PATTERN.test(value) || !Number.isFinite(Date.parse(`${value}T12:00:00.000Z`))) {
    invalid();
  }
}

function dateSpan(startDate: string, endDate: string): number {
  return Math.floor((Date.parse(`${endDate}T12:00:00.000Z`) -
    Date.parse(`${startDate}T12:00:00.000Z`)) / 86_400_000) + 1;
}

function exactKeys(value: object, expected: readonly string[]): void {
  const allowed = new Set(expected);
  if (Object.keys(value).some((key) => !allowed.has(key)) ||
      Object.keys(value).length !== expected.length) invalid();
}

function localDate(instantUtc: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instantUtc));
}

function closingDateRange(scope: CoachAiChatAnalysisScope) {
  if (scope.kind === "day") {
    return Object.freeze({ kind: "inclusive_closing_date" as const,
      startDate: scope.date, endDate: scope.date });
  }
  if (scope.kind === "custom") {
    return Object.freeze({ kind: "inclusive_closing_date" as const,
      startDate: scope.startDate, endDate: scope.endDate });
  }
  if (scope.kind === "month") {
    return Object.freeze({
      kind: "inclusive_closing_date" as const,
      startDate: `${scope.month}-01`,
      endDate: new Date(Date.UTC(
        Number(scope.month.slice(0, 4)),
        Number(scope.month.slice(5, 7)),
        0,
      )).toISOString().slice(0, 10),
    });
  }
  if (scope.kind === "week") {
    const anchor = new Date(`${scope.anchorDate}T12:00:00.000Z`);
    const start = new Date(anchor);
    start.setUTCDate(anchor.getUTCDate() - ((anchor.getUTCDay() + 6) % 7));
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return Object.freeze({ kind: "inclusive_closing_date" as const,
      startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) });
  }
  return Object.freeze({ kind: "all_available" as const });
}

function summarize(events: readonly RuleEvent[]) {
  const groups = new Map<string, RuleEvent[]>();
  for (const event of events) {
    groups.set(event.ruleKey, [...(groups.get(event.ruleKey) ?? []), event]);
  }
  return Object.freeze([...groups.values()].map((items) => {
    const broken = items.filter((item) => item.result === "Broken");
    const pnl = broken.flatMap((item) => item.netPnlDecimal === null
      ? [] : [new Decimal(item.netPnlDecimal)]);
    const total = pnl.length ? Decimal.sum(...pnl) : null;
    const tickerCounts = new Map<string, number>();
    for (const item of broken) {
      if (item.ticker) tickerCounts.set(item.ticker, (tickerCounts.get(item.ticker) ?? 0) + 1);
    }
    const frequentTicker = [...tickerCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0] ?? null;
    const coverage = new Set(items.flatMap((item) => item.feeCoverage ? [item.feeCoverage] : []));
    return Object.freeze({
      label: items[0]!.label,
      source: items[0]!.source,
      ruleVersion: items[0]!.ruleVersion,
      eligibleChecks: items.length,
      followed: items.filter((item) => item.result === "Followed").length,
      broken: broken.length,
      unavailable: items.filter((item) => item.result === "N/A").length,
      notSelected: items.filter((item) => item.result === "Not selected").length,
      brokenCombinedPnlDecimal: total?.toFixed() ?? null,
      brokenWins: pnl.filter((value) => value.greaterThan(0)).length,
      brokenLosses: pnl.filter((value) => value.lessThan(0)).length,
      affectedTradingDays: new Set(broken.map((item) => item.date)).size,
      mostFrequentTicker: frequentTicker?.[0] ?? null,
      mostFrequentTickerCount: frequentTicker?.[1] ?? 0,
      feeCoverage: coverage.size === 0 ? null : coverage.size === 1
        ? [...coverage][0]! : "partial",
    });
  }).sort((left, right) => left.label.localeCompare(right.label)));
}

export class CoachAiChatAnnotationContextService {
  constructor(
    private readonly facts: Pick<JournalAnalyticsFactSetService, "getJournalAnalyticsFactSet">,
    private readonly dashboard: Pick<JournalDashboardReadModelService, "getTradingDay">,
    private readonly annotations: Pick<JournalAnnotationService,
      "listRules" | "listRulesForEvaluation" | "listRuleReviews" |
      "readRoundTripNotes" | "listTagsForRoundTrips" | "resolveTradingDayId">,
  ) {}

  listRules(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatTradingRulesRequest,
  ): CoachAiChatFactualToolResponse {
    if (request.contractVersion !== COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION ||
        request.toolName !== "list_trading_rules") invalid();
    exactKeys(request, ["contractVersion", "toolName", "state"]);
    const account = narrowWorkspaceAccessToAccount(scope, selectedAccountId);
    const rules = this.annotations.listRules(account)
      .filter((rule) => request.state === "all" || rule.lifecycleState === request.state)
      .sort((left, right) => left.title.localeCompare(right.title) ||
        left.versionNumber - right.versionNumber);
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        state: request.state,
        rules: Object.freeze(rules.map((rule) => Object.freeze({
          title: rule.title,
          description: rule.statement,
          kind: rule.sourceKind === "template" ? "Preset" : "Custom",
          presetKey: rule.templateKey,
          category: rule.category,
          appliesTo: rule.reviewScope === "day" ? "Trading day"
            : rule.reviewScope === "trade" ? "Trade" : "Trading day and trade",
          isFocusRule: rule.isFocus,
          status: rule.lifecycleState,
          configuration: rule.configuration,
          version: rule.versionNumber,
          effectiveFromUtc: rule.effectiveFromUtc,
          effectiveUntilUtc: rule.effectiveUntilUtc ?? null,
        }))),
        links: Object.freeze({ tradingRules: "/rules", ruleResults: "/rules/results" }),
      }),
    });
  }

  ruleResults(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatTradingRuleResultsRequest,
  ): CoachAiChatFactualToolResponse {
    if (request.contractVersion !== COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION ||
        request.toolName !== "get_trading_rule_results") invalid();
    exactKeys(request, ["contractVersion", "toolName", "startDate", "endDate"]);
    assertDate(request.startDate);
    assertDate(request.endDate);
    if (request.startDate > request.endDate ||
        dateSpan(request.startDate, request.endDate) > MAX_RULE_RESULT_DAYS) invalid();
    const account = narrowWorkspaceAccessToAccount(scope, selectedAccountId);
    const latest = this.dashboard.getTradingDay(scope, { currency: null, requestedDate: null });
    const dates = latest.availableTradingDates.filter((date) =>
      date >= request.startDate && date <= request.endDate);
    const events: RuleEvent[] = [];
    for (const date of dates) {
      const model = this.dashboard.getTradingDay(scope, {
        currency: latest.currency,
        requestedDate: date,
      });
      const rangeStart = `${model.date}T00:00:00.000Z`;
      const rangeEnd = new Date(rangeStart);
      rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 2);
      const rules = this.annotations.listRulesForEvaluation(
        account,
        rangeStart,
        rangeEnd.toISOString(),
      );
      const trades = model.tickers.flatMap((ticker) => ticker.roundTrips.map((trade) => ({
        id: trade.roundTripId,
        entryAt: trade.entryAtUtc,
        pnl: trade.netPnlDecimal,
        ticker: ticker.symbol,
      })));
      const tradeById = new Map(trades.map((trade) => [trade.id, trade]));
      for (const result of evaluateJournalPresetRules(rules, model, new Set())) {
        const rule = rules.find((candidate) => candidate.ruleId === result.ruleId &&
          candidate.versionId === result.ruleVersionId);
        if (!rule) continue;
        const evidenceRows = result.status === "broken" && result.evidence.violations.length
          ? result.evidence.violations : [null];
        for (const evidence of evidenceRows) {
          const trade = evidence ? tradeById.get(evidence.roundTripId)
            : result.targetRoundTripId ? tradeById.get(result.targetRoundTripId) : null;
          events.push(Object.freeze({
            date: model.date,
            feeCoverage: result.evidence.feeCoverage,
            label: rule.title,
            netPnlDecimal: trade?.pnl ?? null,
            note: "",
            result: result.status === "n/a" ? "N/A"
              : result.status === "broken" ? "Broken" : "Followed",
            ruleKey: `${rule.ruleId}:${rule.versionNumber}`,
            ruleVersion: rule.versionNumber,
            source: "Preset",
            target: trade ? "Trade" : "Day",
            ticker: trade?.ticker ?? null,
          }));
        }
      }
      const tradingDayId = this.annotations.resolveTradingDayId(account, model.date);
      const reviews = tradingDayId ? this.annotations.listRuleReviews(account, {
        roundTripIds: trades.map((trade) => trade.id), tradingDayId,
      }) : [];
      for (const rule of rules.filter((candidate) => candidate.sourceKind === "custom")) {
        const targets = [
          ...(tradingDayId && (rule.reviewScope === "day" || rule.reviewScope === "both")
            ? [{ id: tradingDayId, target: "Day" as const, trade: null }] : []),
          ...(rule.reviewScope === "trade" || rule.reviewScope === "both" ? trades
            .filter((trade) => trade.entryAt >= rule.effectiveFromUtc &&
              (!rule.effectiveUntilUtc || trade.entryAt < rule.effectiveUntilUtc) &&
              (!rule.activeIntervals || rule.activeIntervals.some((interval) =>
                trade.entryAt >= interval.fromUtc &&
                (!interval.untilUtc || trade.entryAt < interval.untilUtc))))
            .map((trade) => ({ id: trade.id, target: "Trade" as const, trade })) : []),
        ];
        for (const target of targets) {
          const review = reviews.find((candidate) => candidate.ruleId === rule.ruleId &&
            candidate.ruleVersionId === rule.versionId &&
            (candidate.tradingDayId === target.id || candidate.roundTripId === target.id));
          events.push(Object.freeze({
            date: model.date,
            feeCoverage: null,
            label: rule.title,
            netPnlDecimal: target.trade?.pnl ?? model.netPnlDecimal,
            note: review?.note ?? "",
            result: review?.status === "broken" ? "Broken"
              : review?.status === "followed" ? "Followed" : "Not selected",
            ruleKey: `${rule.ruleId}:${rule.versionNumber}`,
            ruleVersion: rule.versionNumber,
            source: "Custom",
            target: target.target,
            ticker: target.trade?.ticker ?? null,
          }));
        }
      }
    }
    const ordered = events.sort((left, right) => right.date.localeCompare(left.date) ||
      left.label.localeCompare(right.label) || (left.ticker ?? "").localeCompare(right.ticker ?? ""));
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        startDate: request.startDate,
        endDate: request.endDate,
        tradingDayCount: dates.length,
        summaries: summarize(events),
        events: Object.freeze(ordered.slice(0, MAX_RULE_RESULT_EVENTS).map((event) => Object.freeze({
          date: event.date,
          feeCoverage: event.feeCoverage,
          label: event.label,
          netPnlDecimal: event.netPnlDecimal,
          note: event.note,
          result: event.result,
          ruleVersion: event.ruleVersion,
          source: event.source,
          target: event.target,
          ticker: event.ticker,
        }))),
        eventCount: events.length,
        eventsTruncated: events.length > MAX_RULE_RESULT_EVENTS,
        link: "/rules/results",
      }),
    });
  }

  tradeAnnotations(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatTradeAnnotationsRequest,
    analysisScope: CoachAiChatAnalysisScope,
  ): CoachAiChatFactualToolResponse {
    if (request.contractVersion !== COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION ||
        request.toolName !== "get_trade_annotations") invalid();
    exactKeys(request, ["contractVersion", "toolName", "roundTripId"]);
    const account = narrowWorkspaceAccessToAccount(scope, selectedAccountId);
    const factSet = this.facts.getJournalAnalyticsFactSet(scope, {
      accountIds: Object.freeze([selectedAccountId]),
      closingDateRange: closingDateRange(analysisScope),
      currencySelection: Object.freeze({ kind: "all_partitions" }),
    });
    const trade = factSet.roundTrips.find((candidate) =>
      candidate.accountId === selectedAccountId &&
      candidate.roundTripId === request.roundTripId &&
      candidate.projectionState === "ready_closed" &&
      candidate.closedAtUtc !== null &&
      (analysisScope.kind !== "ticker" ||
        candidate.displayedSymbol.toUpperCase() === analysisScope.ticker));
    if (!trade || trade.closedAtUtc === null) notFound();
    const note = this.annotations.readRoundTripNotes(account, [trade.roundTripId])[
      trade.roundTripId
    ] ?? null;
    const tags = this.annotations.listTagsForRoundTrips(account, [trade.roundTripId])[
      trade.roundTripId
    ] ?? [];
    const reviews = this.annotations.listRuleReviews(account, {
      tradingDayId: trade.roundTripId,
      roundTripIds: Object.freeze([trade.roundTripId]),
    });
    const rules = new Map(this.annotations.listRules(account).map((rule) => [rule.ruleId, rule]));
    const timezone = factSet.accounts.find((candidate) => candidate.accountId === selectedAccountId)
      ?.tradingTimezone;
    if (!timezone) notFound();
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        trade: Object.freeze({
          ticker: trade.displayedSymbol,
          currency: trade.tradeCurrency,
          direction: trade.direction,
          openedAtUtc: trade.openedAtUtc,
          closedAtUtc: trade.closedAtUtc,
        }),
        tradeNote: note ? Object.freeze({
          text: note.tradeNote,
          updatedAtUtc: note.updatedAtUtc,
        }) : null,
        tags: Object.freeze(tags.map((tag) => tag.name)
          .sort((left, right) => left.localeCompare(right))),
        customRuleReviews: Object.freeze(reviews.map((review) => {
          const rule = rules.get(review.ruleId);
          return Object.freeze({
            title: rule?.title ?? "Retired custom rule",
            status: review.status === "not_reviewed" ? "Not selected"
              : review.status === "broken" ? "Broken" : "Followed",
            note: review.note,
            updatedAtUtc: review.updatedAtUtc,
          });
        }).sort((left, right) => left.title.localeCompare(right.title))),
        link: `/trade-tracker/${localDate(trade.openedAtUtc, timezone)}`,
      }),
    });
  }
}
