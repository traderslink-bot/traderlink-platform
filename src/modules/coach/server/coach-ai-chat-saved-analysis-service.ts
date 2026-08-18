import type Database from "better-sqlite3";

import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  CoachAiChatFactualToolError,
  type CoachAiChatRuleIdeasRequest,
  type CoachAiChatSavedAnalysisResponse,
  type CoachAiChatSavedTradeComparisonsRequest,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import { TradeExplorerComparisonStudyRepository } from
  "@/src/modules/journal-analytics/server/trade-explorer-comparison-study-repository";
import { TradeExplorerComparisonStudyService } from
  "@/src/modules/journal-analytics/server/trade-explorer-comparison-study-service";
import { JournalRuleIdeaRepository } from
  "@/src/modules/journal/server/rule-ideas/journal-rule-idea-repository";
import { JournalRuleIdeaService } from
  "@/src/modules/journal/server/rule-ideas/journal-rule-idea-service";
import {
  narrowWorkspaceAccessToAccount,
  type WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";

const MAX_ITEMS = 10;
const STUDY_QUERY_KEYS = Object.freeze([
  "metricId", "grouping", "moneyBasis", "currency", "symbol", "direction",
  "tradeClassification", "provenance", "outcome", "entryWeekday",
  "entryTimeBucketMinutes", "entryTimeBucket", "startDate", "endDate",
  "minimumHoldingSeconds", "maximumHoldingSeconds", "minimumEnteredQuantity",
  "maximumEnteredQuantity", "minimumPositionQuantity", "maximumPositionQuantity",
  "minimumEntryNotional", "maximumEntryNotional", "evidenceRows",
] as const);

function invalid(): never {
  throw new CoachAiChatFactualToolError("invalid_request");
}

function limit(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_ITEMS) invalid();
  return value;
}

function record(value: unknown): Readonly<Record<string, unknown>> {
  if (!value || Array.isArray(value) || typeof value !== "object") invalid();
  return value as Readonly<Record<string, unknown>>;
}

function studyGroups(value: string): readonly Readonly<Record<string, unknown>>[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    invalid();
  }
  const document = record(parsed);
  if (!Array.isArray(document.groups) || document.groups.length < 2 || document.groups.length > 4) invalid();
  return Object.freeze(document.groups.map((candidate) => {
    const group = record(candidate);
    const query = record(group.query);
    if (typeof group.name !== "string") invalid();
    return Object.freeze({
      name: group.name,
      query: Object.freeze(Object.fromEntries(STUDY_QUERY_KEYS.map((key) => [key, query[key]]))),
    });
  }));
}

export class CoachAiChatSavedAnalysisService {
  constructor(private readonly database: Database.Database) {}

  listComparisons(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatSavedTradeComparisonsRequest,
  ): CoachAiChatSavedAnalysisResponse {
    if (request.toolName !== "list_saved_trade_comparisons" ||
        Object.keys(request).some((key) => !["contractVersion", "toolName", "limit"].includes(key))) invalid();
    const account = narrowWorkspaceAccessToAccount(scope, selectedAccountId);
    const studies = new TradeExplorerComparisonStudyService(
      new TradeExplorerComparisonStudyRepository(this.database),
    ).list(account).slice(0, limit(request.limit));
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze(studies.map((study) => Object.freeze({
        name: study.name,
        groups: studyGroups(study.normalizedStudyJson),
        createdAtUtc: study.createdAtUtc,
        updatedAtUtc: study.updatedAtUtc,
        link: "/analytics/trade-explorer/compare",
      }))),
    });
  }

  listRuleIdeas(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatRuleIdeasRequest,
  ): CoachAiChatSavedAnalysisResponse {
    if (request.toolName !== "list_rule_ideas" ||
        !["available", "saved_for_later", "not_for_me", "added", "all"].includes(request.disposition) ||
        Object.keys(request).some((key) => !["contractVersion", "toolName", "disposition", "limit"].includes(key))) invalid();
    const account = narrowWorkspaceAccessToAccount(scope, selectedAccountId);
    const ideas = new JournalRuleIdeaService(new JournalRuleIdeaRepository(this.database))
      .list(account)
      .filter((idea) => request.disposition === "all" || idea.disposition === request.disposition)
      .slice(0, limit(request.limit));
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze(ideas.map((idea) => Object.freeze({
        disposition: idea.disposition,
        templateId: idea.evidence.templateId,
        configuration: idea.evidence.configuration,
        currency: idea.evidence.currency,
        periodStart: idea.evidence.periodStart,
        periodEnd: idea.evidence.periodEnd,
        eligibleTradingDays: idea.evidence.eligibleTradingDays,
        eligibleTrades: idea.evidence.eligibleTrades,
        eligibleExecutions: idea.evidence.eligibleExecutions,
        triggerCount: idea.evidence.triggerCount,
        triggerDays: idea.evidence.triggerDays,
        affectedTradeCount: idea.evidence.affectedTradeCount,
        comparisonTradeCount: idea.evidence.comparisonTradeCount,
        affectedPnlDecimal: idea.evidence.affectedPnlDecimal,
        comparisonPnlDecimal: idea.evidence.comparisonPnlDecimal,
        affectedAveragePnlDecimal: idea.evidence.affectedAveragePnlDecimal,
        comparisonAveragePnlDecimal: idea.evidence.comparisonAveragePnlDecimal,
        affectedPnlWithoutWorstTradeDecimal: idea.evidence.affectedPnlWithoutWorstTradeDecimal,
        dominantTicker: idea.evidence.dominantTicker,
        dominantTickerShareDecimal: idea.evidence.dominantTickerShareDecimal,
        recentAndEarlierConsistent: idea.evidence.recentAndEarlierConsistent,
        limitation: idea.evidence.limitation,
        updatedAtUtc: idea.updatedAtUtc,
        link: "/rules",
      }))),
    });
  }
}
