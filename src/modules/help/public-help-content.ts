import { ACCOUNT_HELP_GUIDES } from "./account-guides";
import { AI_CHAT_HELP_GUIDES } from "./ai-chat-guides";
import { AI_REVIEWS_HELP_GUIDES } from "./ai-reviews-guides";
import { CALENDAR_HELP_GUIDES } from "./calendar-guides";
import { CANDLE_REVIEW_HELP_GUIDES } from "./candle-review-guides";
import { CORE_ANALYTICS_HELP_GUIDES } from "./core-analytics-guides";
import { DAILY_TRADE_TRACKER_HELP_GUIDES } from "./daily-trade-tracker-guides";
import { DATA_DECISIONS_HELP_GUIDES } from "./data-decisions-guides";
import type { HelpGuide } from "./help-guide-types";
import { NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES } from "./notifications-and-imports-guides";
import { OPEN_POSITIONS_HELP_GUIDES } from "./open-positions-guides";
import { PAID_PLAN_HELP_GUIDES } from "./paid-plan-guides";
import { QUICK_TRADE_ENTRY_HELP_GUIDES } from "./quick-trade-entry-guides";
import { SWING_TRADE_TRACKER_HELP_GUIDES } from "./swing-trade-tracker-guides";
import { TOOLS_HELP_GUIDES } from "./tools-guides";
import { TRADE_ANALYZER_HELP_GUIDES } from "./trade-analyzer-guides";
import { TRADE_EXPLORER_HELP_GUIDES } from "./trade-explorer-guides";
import { TRADE_TAGS_HELP_GUIDES } from "./trade-tags-guides";
import { TRADERSLINK_APP_HELP_GUIDES } from "./traderslink-app-guides";
import { TRADING_RULES_HELP_GUIDES } from "./trading-rules-guides";

export type PublicHelpCollection = Readonly<{
  guides: readonly HelpGuide[];
  href: string;
  id: string;
  summary: string;
  title: string;
}>;

function collection(
  id: string,
  title: string,
  summary: string,
  guides: readonly HelpGuide[],
): PublicHelpCollection {
  return Object.freeze({ guides, href: `/help/${id}`, id, summary, title });
}

export const PUBLIC_HELP_COLLECTIONS: readonly PublicHelpCollection[] = Object.freeze([
  collection("account", "Account", "Manage settings and control where your TraderLink account stays signed in.", ACCOUNT_HELP_GUIDES),
  collection("daily-trade-tracker", "Daily Trade Tracker", "Record trades, review executions and finish your trading day.", DAILY_TRADE_TRACKER_HELP_GUIDES),
  collection("quick-trade-entry", "Quick Trade Entry", "Enter completed executions across past trading dates without starting a Tracker review.", QUICK_TRADE_ENTRY_HELP_GUIDES),
  collection("swing-trade-tracker", "Swing Trade Tracker", "Review intentional swing positions and dated notes.", SWING_TRADE_TRACKER_HELP_GUIDES),
  collection("calendar", "Calendar", "Read completed Trade Tracker trades by month or week and inspect a trading day.", CALENDAR_HELP_GUIDES),
  collection("open-positions", "Open Positions", "See confirmed positions and record their current trader-defined status.", OPEN_POSITIONS_HELP_GUIDES),
  collection("data-decisions", "Data Decisions", "Answer the specific Trade Tracker questions that need broker evidence.", DATA_DECISIONS_HELP_GUIDES),
  collection("candle-review", "Candle Review", "Request and read optional market context for an eligible completed trade.", CANDLE_REVIEW_HELP_GUIDES),
  collection("core-analytics", "Analytics", "Read Analytics Overview and compare completed trades by ticker, timing and execution characteristics.", CORE_ANALYTICS_HELP_GUIDES),
  collection("trade-explorer", "Trade Explorer", "Inspect individual completed trades or compare factual results of two to four groups.", TRADE_EXPLORER_HELP_GUIDES),
  collection("trading-rules", "Trading Rules", "Choose, manage and review preset and custom Trading Rules.", TRADING_RULES_HELP_GUIDES),
  collection("trade-tags", "Trade Tags", "Label individual Day trades and supported Swing positions with tags you choose.", TRADE_TAGS_HELP_GUIDES),
  collection("trade-analyzer", "Trade Analyzer", "Replay supported trades and understand every saved Analyzer result.", TRADE_ANALYZER_HELP_GUIDES),
  collection("ai-chat", "Links AI Chat", "Ask about your trading, choose what to explore and prepare editable drafts.", AI_CHAT_HELP_GUIDES),
  collection("ai-reviews", "AI Reviews", "Choose a schedule, understand review evidence and use saved feedback.", AI_REVIEWS_HELP_GUIDES),
  collection("paid-plan", "Paid plan and billing", "Connect Whop, manage the wider TraderLink paid plan and fix access problems.", PAID_PLAN_HELP_GUIDES),
  collection("tools", "Tools", "Learn how to use TraderLink tools such as Halt Alerts.", TOOLS_HELP_GUIDES),
  collection("traderslink-app", "TradersLink app", "Install TradersLink, use saved pages and trade entry offline, manage device storage and choose push alerts.", TRADERSLINK_APP_HELP_GUIDES),
  collection("notifications-and-imports", "Notifications and imports", "Find updates, choose Discord messages and finish a statement that needs help.", NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES),
]);

export function publicHelpCollectionById(id: string): PublicHelpCollection | undefined {
  return PUBLIC_HELP_COLLECTIONS.find((candidate) => candidate.id === id);
}
