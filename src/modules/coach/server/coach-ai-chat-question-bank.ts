import type {
  LinksQuestionBankAnswerKind,
  LinksQuestionBankCase,
  LinksQuestionBankFamily,
  LinksQuestionBankScopeKind,
} from "../contracts/coach-ai-chat-question-bank-contracts";
import type { CoachAiChatFactualToolName } from "../contracts/coach-ai-chat-factual-tool-contracts";

type Template = Readonly<{
  id: string;
  family: LinksQuestionBankFamily;
  answerKind: LinksQuestionBankAnswerKind;
  expectedToolNames: readonly CoachAiChatFactualToolName[];
  requiredFacts: readonly string[];
  question: (period: string) => string;
}>;

type Period = Readonly<{
  id: string;
  phrase: string;
  scopeKind: Exclude<LinksQuestionBankScopeKind, "follow_up">;
}>;

const periods = Object.freeze([
  { id: "all-history", phrase: "", scopeKind: "all_history" },
  { id: "this-year", phrase: " this year", scopeKind: "relative_period" },
  { id: "last-year", phrase: " last year", scopeKind: "relative_period" },
  { id: "last-7-days", phrase: " in the last 7 days", scopeKind: "relative_period" },
  { id: "last-30-days", phrase: " in the last 30 days", scopeKind: "relative_period" },
  { id: "last-90-days", phrase: " in the last 90 days", scopeKind: "relative_period" },
  { id: "march-2026", phrase: " in March 2026", scopeKind: "named_month" },
  { id: "april-2026", phrase: " in April 2026", scopeKind: "named_month" },
  { id: "may-2026", phrase: " in May 2026", scopeKind: "named_month" },
  { id: "january-2026", phrase: " in January 2026", scopeKind: "named_month" },
  { id: "march-2025", phrase: " in March 2025", scopeKind: "named_month" },
  { id: "april-15-2026", phrase: " on April 15, 2026", scopeKind: "named_day" },
  { id: "march-1-2026", phrase: " on March 1, 2026", scopeKind: "named_day" },
  { id: "year-2026", phrase: " in 2026", scopeKind: "named_year" },
  { id: "year-2025", phrase: " in 2025", scopeKind: "named_year" },
] satisfies readonly Period[]);

function caseId(family: LinksQuestionBankFamily, templateId: string, periodId: string): string {
  return `links-${family}-${templateId}-${periodId}`;
}

function createCase(input: Readonly<{
  id: string;
  batch: number;
  family: LinksQuestionBankFamily;
  question: string;
  scopeKind: LinksQuestionBankScopeKind;
  answerKind: LinksQuestionBankAnswerKind;
  expectedToolNames: readonly CoachAiChatFactualToolName[];
  requiredFacts: readonly string[];
  followUpToId?: string | null;
}>): LinksQuestionBankCase {
  return Object.freeze({
    id: input.id,
    batch: input.batch,
    family: input.family,
    input: input.question,
    scopeKind: input.scopeKind,
    answerKind: input.answerKind,
    expectedToolNames: Object.freeze([...input.expectedToolNames]),
    requiredFacts: Object.freeze([...input.requiredFacts]),
    followUpToId: input.followUpToId ?? null,
  });
}

/**
 * These are deliberately written-out first. They are the owner-reported
 * questions plus close natural variants and constitute batch one.
 */
const firstBatch = Object.freeze([
  createCase({ id: "links-core-best-trade-all-history", batch: 1, family: "rankings", question: "what was my most profitable trade", scopeKind: "all_history", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["trade identity", "net profit and loss", "close date"] }),
  createCase({ id: "links-core-best-trade-this-year", batch: 1, family: "rankings", question: "what was my most profitable trade this year", scopeKind: "relative_period", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["trade identity", "net profit and loss", "year scope"] }),
  createCase({ id: "links-core-best-trade-march", batch: 1, family: "rankings", question: "what was my most profitable trade in march 2026", scopeKind: "named_month", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["trade identity", "net profit and loss", "March 2026 scope"] }),
  createCase({ id: "links-core-march-summary", batch: 1, family: "period_summary", question: "summarize my trading in march 2026", scopeKind: "named_month", answerKind: "period_summary", expectedToolNames: ["summarize_journal_period", "summarize_closed_trades"], requiredFacts: ["trade count", "net profit and loss", "wins and losses", "March 2026 scope"] }),
  createCase({ id: "links-core-march-win-rate", batch: 1, family: "performance", question: "what was my win rate in march 2026", scopeKind: "named_month", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["win rate", "trade population", "March 2026 scope"] }),
  createCase({ id: "links-core-march-trade-count", batch: 1, family: "performance", question: "how many trades did I do in march 2026", scopeKind: "named_month", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["trade count", "March 2026 scope"] }),
  createCase({ id: "links-core-worst-three", batch: 1, family: "rankings", question: "give me the worst 3 losses", scopeKind: "all_history", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["three losing trades", "net profit and loss", "descending loss order"] }),
  createCase({ id: "links-core-worst-three-march", batch: 1, family: "rankings", question: "give me the worst three losses in march 2026", scopeKind: "named_month", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["three losing trades", "net profit and loss", "March 2026 scope"] }),
  createCase({ id: "links-core-profit-ticker", batch: 1, family: "ticker", question: "what ticker did i profit the most from in march 2026", scopeKind: "named_month", answerKind: "ranked_facts", expectedToolNames: ["get_results_by_ticker"], requiredFacts: ["ticker", "net profit and loss", "March 2026 scope"] }),
  createCase({ id: "links-core-best-session", batch: 1, family: "timing", question: "what session do I perform best in", scopeKind: "all_history", answerKind: "ranked_facts", expectedToolNames: ["get_timing_analytics"], requiredFacts: ["session", "net profit and loss", "trade population"] }),
  createCase({ id: "links-core-best-entry-time", batch: 1, family: "timing", question: "what time of day am i most profitable", scopeKind: "all_history", answerKind: "ranked_facts", expectedToolNames: ["get_timing_analytics"], requiredFacts: ["time period", "net profit and loss", "trade population"] }),
  createCase({ id: "links-core-weakest-weekday", batch: 1, family: "timing", question: "what day of the week should i avoid trade", scopeKind: "all_history", answerKind: "ranked_facts", expectedToolNames: ["get_timing_analytics"], requiredFacts: ["weekday", "net profit and loss", "trade population"] }),
  createCase({ id: "links-core-rule-most-broken", batch: 1, family: "rules", question: "what rule have I broken the most", scopeKind: "all_history", answerKind: "ranked_facts", expectedToolNames: ["get_trading_rule_results"], requiredFacts: ["rule", "break count", "period"] }),
  createCase({ id: "links-core-rule-losses", batch: 1, family: "rules", question: "what broken rule caused me the most losses", scopeKind: "all_history", answerKind: "ranked_facts", expectedToolNames: ["get_trading_rule_results", "list_closed_trades"], requiredFacts: ["rule", "associated loss total", "break count", "supporting trades"] }),
  createCase({ id: "links-core-open-positions", batch: 1, family: "positions", question: "what are my open positions", scopeKind: "all_history", answerKind: "ranked_facts", expectedToolNames: ["list_open_positions"], requiredFacts: ["open position list", "ticker", "remaining quantity"] }),
  createCase({ id: "links-core-gtr-worst", batch: 1, family: "analyzer", question: "what was my worst green to red trade", scopeKind: "all_history", answerKind: "ranked_facts", expectedToolNames: ["get_trade_analyzer_results", "list_analyzed_trades"], requiredFacts: ["Green-to-Red result or exact saved-analysis limitation"] }),
  createCase({ id: "links-core-explorer-loss-filter", batch: 1, family: "trade_explorer", question: "filter my win/loss in trade exploer", scopeKind: "all_history", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["explicit requested outcome filter"] }),
  createCase({ id: "links-core-explorer-loss-follow-up", batch: 1, family: "conversation", question: "losses", scopeKind: "follow_up", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["loss filter retained"], followUpToId: "links-core-explorer-loss-filter" }),
  createCase({ id: "links-core-explorer-worst-follow-up", batch: 1, family: "conversation", question: "give me the worst 3 losses", scopeKind: "follow_up", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["three losing trades", "descending loss order"], followUpToId: "links-core-explorer-loss-follow-up" }),
  createCase({ id: "links-core-march-pnl", batch: 1, family: "performance", question: "what was my profit and loss in march 2026", scopeKind: "named_month", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["net profit and loss", "March 2026 scope"] }),
  createCase({ id: "links-core-march-gross-loss", batch: 1, family: "performance", question: "how much did i lose in march 2026", scopeKind: "named_month", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["gross loss", "March 2026 scope"] }),
  createCase({ id: "links-core-march-gross-profit", batch: 1, family: "performance", question: "how much did i make in march 2026", scopeKind: "named_month", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["gross profit", "March 2026 scope"] }),
  createCase({ id: "links-core-march-average", batch: 1, family: "performance", question: "what was my average trade in march 2026", scopeKind: "named_month", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["average net profit and loss", "March 2026 scope"] }),
  createCase({ id: "links-core-march-best-day", batch: 1, family: "timing", question: "what was my best trading day in march 2026", scopeKind: "named_month", answerKind: "ranked_facts", expectedToolNames: ["get_timing_analytics"], requiredFacts: ["weekday or day", "net profit and loss", "March 2026 scope"] }),
  createCase({ id: "links-core-march-worst-day", batch: 1, family: "timing", question: "what was my worst trading day in march 2026", scopeKind: "named_month", answerKind: "ranked_facts", expectedToolNames: ["get_timing_analytics"], requiredFacts: ["weekday or day", "net profit and loss", "March 2026 scope"] }),
  createCase({ id: "links-core-march-most-traded", batch: 1, family: "ticker", question: "what ticker did I trade the most in march 2026", scopeKind: "named_month", answerKind: "ranked_facts", expectedToolNames: ["get_results_by_ticker"], requiredFacts: ["ticker", "trade count", "March 2026 scope"] }),
  createCase({ id: "links-core-best-long", batch: 1, family: "rankings", question: "what was my best long trade in march 2026", scopeKind: "named_month", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["long trade", "net profit and loss", "March 2026 scope"] }),
  createCase({ id: "links-core-best-short", batch: 1, family: "rankings", question: "what was my best short trade in march 2026", scopeKind: "named_month", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["short trade", "net profit and loss", "March 2026 scope"] }),
  createCase({ id: "links-core-spelling-suggest", batch: 1, family: "rules", question: "can you suugest a rule", scopeKind: "all_history", answerKind: "direct_fact", expectedToolNames: ["list_trading_rules", "get_trading_rule_results"], requiredFacts: ["useful rule suggestion grounded in saved rules or exact clarification"] }),
  createCase({ id: "links-core-spelling-most-profitable", batch: 1, family: "rankings", question: "what was my most profitable trad", scopeKind: "all_history", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["trade identity", "net profit and loss"] }),
] satisfies readonly LinksQuestionBankCase[]);

const performanceTemplates = Object.freeze([
  { id: "net-pnl", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["net profit and loss", "scope"], question: (period) => `what was my net profit and loss${period}` },
  { id: "gross-profit", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["gross profit", "scope"], question: (period) => `what was my gross profit${period}` },
  { id: "gross-loss", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["gross loss", "scope"], question: (period) => `what was my gross loss${period}` },
  { id: "trade-count", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["trade count", "scope"], question: (period) => `how many completed trades did i have${period}` },
  { id: "win-rate", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["win rate", "trade population", "scope"], question: (period) => `what was my win rate${period}` },
  { id: "loss-rate", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["loss rate", "trade population", "scope"], question: (period) => `what was my loss rate${period}` },
  { id: "profit-factor", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["profit factor", "scope"], question: (period) => `what was my profit factor${period}` },
  { id: "expectancy", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["expectancy", "scope"], question: (period) => `what was my expectancy${period}` },
  { id: "average-trade", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["average trade", "scope"], question: (period) => `what was my average net profit and loss per trade${period}` },
  { id: "average-winner", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["average winning trade", "scope"], question: (period) => `what was my average winning trade${period}` },
  { id: "average-loser", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["average losing trade", "scope"], question: (period) => `what was my average losing trade${period}` },
  { id: "long-pnl", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["long trade profit and loss", "scope"], question: (period) => `how did my long trades perform${period}` },
  { id: "short-pnl", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["short trade profit and loss", "scope"], question: (period) => `how did my short trades perform${period}` },
  { id: "winning-count", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["winning trade count", "scope"], question: (period) => `how many winning trades did i have${period}` },
  { id: "losing-count", family: "performance", answerKind: "direct_fact", expectedToolNames: ["summarize_closed_trades"], requiredFacts: ["losing trade count", "scope"], question: (period) => `how many losing trades did i have${period}` },
] satisfies readonly Template[]);

const rankingTemplates = Object.freeze([
  { id: "best-trade", family: "rankings", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["best trade", "net profit and loss", "scope"], question: (period) => `what was my best trade${period}` },
  { id: "worst-trade", family: "rankings", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["worst trade", "net profit and loss", "scope"], question: (period) => `what was my worst trade${period}` },
  { id: "top-three", family: "rankings", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["three winning trades", "descending profit order", "scope"], question: (period) => `show me my top three winning trades${period}` },
  { id: "bottom-three", family: "rankings", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["three losing trades", "descending loss order", "scope"], question: (period) => `show me my worst three losses${period}` },
  { id: "best-long", family: "rankings", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["best long trade", "scope"], question: (period) => `what was my best long trade${period}` },
  { id: "best-short", family: "rankings", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["best short trade", "scope"], question: (period) => `what was my best short trade${period}` },
  { id: "largest-winner", family: "rankings", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["largest winner", "scope"], question: (period) => `what was my largest winner${period}` },
  { id: "largest-loser", family: "rankings", answerKind: "ranked_facts", expectedToolNames: ["query_trade_explorer"], requiredFacts: ["largest loss", "scope"], question: (period) => `what was my largest loss${period}` },
] satisfies readonly Template[]);

const tickerTemplates = Object.freeze([
  { id: "best-ticker", family: "ticker", answerKind: "ranked_facts", expectedToolNames: ["get_results_by_ticker"], requiredFacts: ["ticker", "highest net profit and loss", "scope"], question: (period) => `what ticker was most profitable${period}` },
  { id: "worst-ticker", family: "ticker", answerKind: "ranked_facts", expectedToolNames: ["get_results_by_ticker"], requiredFacts: ["ticker", "lowest net profit and loss", "scope"], question: (period) => `what ticker lost me the most${period}` },
  { id: "most-traded", family: "ticker", answerKind: "ranked_facts", expectedToolNames: ["get_results_by_ticker"], requiredFacts: ["ticker", "trade count", "scope"], question: (period) => `what ticker did i trade the most${period}` },
  { id: "best-win-rate", family: "ticker", answerKind: "ranked_facts", expectedToolNames: ["get_results_by_ticker"], requiredFacts: ["ticker", "win rate", "scope"], question: (period) => `what ticker had my best win rate${period}` },
  { id: "worst-win-rate", family: "ticker", answerKind: "ranked_facts", expectedToolNames: ["get_results_by_ticker"], requiredFacts: ["ticker", "win rate", "scope"], question: (period) => `what ticker had my worst win rate${period}` },
] satisfies readonly Template[]);

const timingTemplates = Object.freeze([
  { id: "best-weekday", family: "timing", answerKind: "ranked_facts", expectedToolNames: ["get_timing_analytics"], requiredFacts: ["weekday", "net profit and loss", "scope"], question: (period) => `what weekday did i perform best${period}` },
  { id: "worst-weekday", family: "timing", answerKind: "ranked_facts", expectedToolNames: ["get_timing_analytics"], requiredFacts: ["weekday", "net profit and loss", "scope"], question: (period) => `what weekday did i perform worst${period}` },
  { id: "best-session", family: "timing", answerKind: "ranked_facts", expectedToolNames: ["get_timing_analytics"], requiredFacts: ["session", "net profit and loss", "scope"], question: (period) => `what session did i perform best${period}` },
  { id: "worst-session", family: "timing", answerKind: "ranked_facts", expectedToolNames: ["get_timing_analytics"], requiredFacts: ["session", "net profit and loss", "scope"], question: (period) => `what session did i perform worst${period}` },
  { id: "best-entry-time", family: "timing", answerKind: "ranked_facts", expectedToolNames: ["get_timing_analytics"], requiredFacts: ["entry time", "net profit and loss", "scope"], question: (period) => `what entry time was most profitable${period}` },
  { id: "best-exit-time", family: "timing", answerKind: "ranked_facts", expectedToolNames: ["get_timing_analytics"], requiredFacts: ["exit time", "net profit and loss", "scope"], question: (period) => `what exit time was most profitable${period}` },
] satisfies readonly Template[]);

const periodTemplates = Object.freeze([
  { id: "summary", family: "period_summary", answerKind: "period_summary", expectedToolNames: ["summarize_journal_period", "summarize_closed_trades"], requiredFacts: ["trade count", "net profit and loss", "wins", "losses", "scope"], question: (period) => `summarize my trading${period}` },
  { id: "journal-summary", family: "period_summary", answerKind: "period_summary", expectedToolNames: ["summarize_journal_period"], requiredFacts: ["trades", "notes", "tags", "rules", "scope"], question: (period) => `give me a full journal summary${period}` },
  { id: "daily-detail", family: "tracker", answerKind: "period_summary", expectedToolNames: ["get_trading_day_details"], requiredFacts: ["trades", "executions", "notes", "rule results"], question: (period) => `show me my trading day details${period}` },
] satisfies readonly Template[]);

const ruleTemplates = Object.freeze([
  { id: "most-broken", family: "rules", answerKind: "ranked_facts", expectedToolNames: ["get_trading_rule_results"], requiredFacts: ["rule", "break count", "scope"], question: (period) => `what rule did i break most often${period}` },
  { id: "rule-loss-total", family: "rules", answerKind: "ranked_facts", expectedToolNames: ["get_trading_rule_results", "list_closed_trades"], requiredFacts: ["rule", "associated profit and loss", "break count", "scope"], question: (period) => `which broken rule was associated with my biggest losses${period}` },
  { id: "rule-largest-loss", family: "rules", answerKind: "ranked_facts", expectedToolNames: ["get_trading_rule_results", "list_closed_trades"], requiredFacts: ["rule", "largest associated loss", "scope"], question: (period) => `which broken rule had my largest loss${period}` },
  { id: "rule-followed", family: "rules", answerKind: "ranked_facts", expectedToolNames: ["get_trading_rule_results"], requiredFacts: ["rule", "followed result count", "scope"], question: (period) => `which rule did i follow most consistently${period}` },
] satisfies readonly Template[]);

function templateCases(templates: readonly Template[], batchStart: number): readonly LinksQuestionBankCase[] {
  return Object.freeze(templates.flatMap((template, templateIndex) => periods.map((period, periodIndex) =>
    createCase({
      id: caseId(template.family, template.id, period.id),
      batch: batchStart + Math.floor((templateIndex * periods.length + periodIndex) / 30),
      family: template.family,
      question: template.question(period.phrase),
      scopeKind: period.scopeKind,
      answerKind: template.answerKind,
      expectedToolNames: template.expectedToolNames,
      requiredFacts: template.requiredFacts,
    }),
  )));
}

const generatedCases = Object.freeze([
  ...templateCases(performanceTemplates, 2),
  ...templateCases(rankingTemplates, 10),
  ...templateCases(tickerTemplates, 14),
  ...templateCases(timingTemplates, 17),
  ...templateCases(periodTemplates, 20),
  ...templateCases(ruleTemplates, 22),
]);

const followUps = Object.freeze([
  "show me the top three instead",
  "what about march 2026",
  "and the worst one",
  "only losses",
  "what ticker was that",
  "give me the supporting trades",
] as const);

const conversationCases = Object.freeze(generatedCases
  .filter((item) => item.answerKind === "ranked_facts" || item.answerKind === "period_summary")
  .flatMap((item, index) => followUps.map((input, followUpIndex) => createCase({
    id: `${item.id}-follow-up-${followUpIndex + 1}`,
    batch: 26 + Math.floor((index * followUps.length + followUpIndex) / 30),
    family: "conversation",
    question: input,
    scopeKind: "follow_up",
    answerKind: item.answerKind,
    expectedToolNames: item.expectedToolNames,
    requiredFacts: [...item.requiredFacts, "prior conversation scope"],
    followUpToId: item.id,
  }))));

export const linksQuestionBank: readonly LinksQuestionBankCase[] = Object.freeze([
  ...firstBatch,
  ...generatedCases,
  ...conversationCases,
]);

const uniqueIds = new Set(linksQuestionBank.map((item) => item.id));
if (uniqueIds.size !== linksQuestionBank.length) {
  throw new Error("Links question bank has duplicate IDs.");
}
if (linksQuestionBank.length < 800) {
  throw new Error(`Links question bank must contain at least 800 cases; found ${linksQuestionBank.length}.`);
}

export function listLinksQuestionBankBatch(batch: number): readonly LinksQuestionBankCase[] {
  return Object.freeze(linksQuestionBank.filter((item) => item.batch === batch));
}
