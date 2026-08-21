import type { CoachAiChatFactualToolName } from "./coach-ai-chat-factual-tool-contracts";

export type LinksQuestionBankFamily =
  | "performance"
  | "rankings"
  | "period_summary"
  | "ticker"
  | "timing"
  | "rules"
  | "trade_explorer"
  | "positions"
  | "tracker"
  | "analyzer"
  | "conversation";

export type LinksQuestionBankAnswerKind =
  | "direct_fact"
  | "ranked_facts"
  | "period_summary"
  | "exact_unavailable";

export type LinksQuestionBankScopeKind =
  | "all_history"
  | "relative_period"
  | "named_month"
  | "named_day"
  | "named_year"
  | "follow_up";

/**
 * One question is a real acceptance obligation, not a prompt example. The
 * live-batch runner stores its actual saved Links result separately so expected
 * facts always come from the canonical service rather than an LLM.
 */
export type LinksQuestionBankCase = Readonly<{
  id: string;
  batch: number;
  family: LinksQuestionBankFamily;
  input: string;
  scopeKind: LinksQuestionBankScopeKind;
  answerKind: LinksQuestionBankAnswerKind;
  expectedToolNames: readonly CoachAiChatFactualToolName[];
  requiredFacts: readonly string[];
  followUpToId: string | null;
}>;
