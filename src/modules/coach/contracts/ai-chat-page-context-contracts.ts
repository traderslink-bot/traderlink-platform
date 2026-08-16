export const COACH_AI_CHAT_PAGE_CONTEXT_CONTRACT_VERSION =
  "traderlink_coach_ai_chat_page_context_v1" as const;

/**
 * A page hint helps the assistant understand what the trader is looking at.
 * It is never Journal evidence and cannot supply facts to an answer or action.
 */
export const COACH_AI_CHAT_PAGE_CONTEXT_AUTHORITY =
  "conversation_hint_only" as const;

export type CoachAiChatPageFeature =
  | "workspace"
  | "daily_trade_tracker"
  | "swing_trade_tracker"
  | "quick_trade_entry"
  | "calendar"
  | "trading_rules"
  | "trading_rule_results"
  | "trade_explorer"
  | "open_positions"
  | "analytics_overview"
  | "analytics_results"
  | "analytics_timing"
  | "analytics_execution"
  | "trade_analyzer_day"
  | "trade_analyzer_entry_exit"
  | "trade_analyzer_mfe_mae"
  | "trade_analyzer_green_to_red"
  | "trade_analyzer_candle_patterns"
  | "trade_analyzer_trades"
  | "candle_review"
  | "ai_chat"
  | "ai_reviews"
  | "market_charts"
  | "imports"
  | "data_decisions"
  | "notifications"
  | "account_profile"
  | "account_trading"
  | "account_preferences"
  | "account_ai"
  | "account_privacy"
  | "help_center";

export type CoachAiChatPageContext = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_PAGE_CONTEXT_CONTRACT_VERSION;
  authority: typeof COACH_AI_CHAT_PAGE_CONTEXT_AUTHORITY;
  feature: CoachAiChatPageFeature;
  featureLabel: string;
  canonicalPath: string;
  tradingDate: string | null;
}>;
