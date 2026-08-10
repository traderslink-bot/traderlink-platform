import { AI_REVIEWS_HELP_GUIDES } from "./ai-reviews-guides";
import { CANDLE_REVIEW_HELP_GUIDES } from "./candle-review-guides";
import { CORE_ANALYTICS_HELP_GUIDES } from "./core-analytics-guides";
import { DAILY_TRADE_TRACKER_HELP_GUIDES } from "./daily-trade-tracker-guides";
import { CALENDAR_HELP_GUIDES } from "./calendar-guides";
import { DATA_DECISIONS_HELP_GUIDES } from "./data-decisions-guides";
import type { HelpGuide } from "./help-guide-types";
import { NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES } from "./notifications-and-imports-guides";
import { OPEN_POSITIONS_HELP_GUIDES } from "./open-positions-guides";
import { PAID_PLAN_HELP_GUIDES } from "./paid-plan-guides";
import { QUICK_TRADE_ENTRY_HELP_GUIDES } from "./quick-trade-entry-guides";
import { SWING_TRADE_TRACKER_HELP_GUIDES } from "./swing-trade-tracker-guides";
import { TRADE_ANALYZER_HELP_GUIDES } from "./trade-analyzer-guides";
import { TRADING_RULES_HELP_GUIDES } from "./trading-rules-guides";
import { TRADE_TAGS_HELP_GUIDES } from "./trade-tags-guides";

export type HelpNavigationItem = Readonly<{
  depth?: 0 | 1;
  href: string;
  icon: "home" | "trade_tracker" | "trade_analyzer" | "trading_rules" | "trade_tags" | "ai_reviews" | "paid_plan" | "notifications";
  label: string;
  summary: string;
}>;

export type HelpSearchRecord = Readonly<{
  href: string;
  id: string;
  keywords: readonly string[];
  section: string;
  summary: string;
  title: string;
}>;

function guideNavigationItems(
  baseHref: string,
  guides: readonly HelpGuide[],
  icon: HelpNavigationItem["icon"],
): readonly HelpNavigationItem[] {
  return guides.map((guide) => Object.freeze({
    depth: 1 as const,
    href: `${baseHref}/${guide.slug}`,
    icon,
    label: guide.title,
    summary: guide.description,
  }));
}

export const HELP_NAVIGATION_ITEMS: readonly HelpNavigationItem[] = Object.freeze([
  Object.freeze({
    href: "/help",
    icon: "home",
    label: "Help Center",
    summary: "Search TraderLink help and browse available guides.",
  }),
  Object.freeze({
    href: "/help/daily-trade-tracker",
    icon: "trade_tracker",
    label: "Daily Trade Tracker",
    summary: "Record trades, review executions and finish your trading day.",
  }),
  ...guideNavigationItems("/help/daily-trade-tracker", DAILY_TRADE_TRACKER_HELP_GUIDES, "trade_tracker"),
  Object.freeze({
    href: "/help/quick-trade-entry",
    icon: "trade_tracker",
    label: "Quick Trade Entry",
    summary: "Enter completed executions across past trading dates without a Tracker review.",
  }),
  ...guideNavigationItems("/help/quick-trade-entry", QUICK_TRADE_ENTRY_HELP_GUIDES, "trade_tracker"),
  Object.freeze({
    href: "/help/swing-trade-tracker",
    icon: "trade_tracker",
    label: "Swing Trade Tracker",
    summary: "Use the current beta workflow for intentional swing positions and dated notes.",
  }),
  ...guideNavigationItems("/help/swing-trade-tracker", SWING_TRADE_TRACKER_HELP_GUIDES, "trade_tracker"),
  Object.freeze({
    href: "/help/calendar",
    icon: "trade_tracker",
    label: "Calendar",
    summary: "Read completed Trade Tracker trades by month or week and inspect a trading day.",
  }),
  ...guideNavigationItems("/help/calendar", CALENDAR_HELP_GUIDES, "trade_tracker"),
  Object.freeze({
    href: "/help/open-positions",
    icon: "trade_tracker",
    label: "Open Positions",
    summary: "See confirmed positions and record their current trader-defined status.",
  }),
  ...guideNavigationItems("/help/open-positions", OPEN_POSITIONS_HELP_GUIDES, "trade_tracker"),
  Object.freeze({
    href: "/help/data-decisions",
    icon: "trade_tracker",
    label: "Data Decisions",
    summary: "Answer the specific Trade Tracker questions that need broker evidence.",
  }),
  ...guideNavigationItems("/help/data-decisions", DATA_DECISIONS_HELP_GUIDES, "trade_tracker"),
  Object.freeze({
    href: "/help/candle-review",
    icon: "trade_tracker",
    label: "Candle Review",
    summary: "Request and read optional market context for an eligible completed trade.",
  }),
  ...guideNavigationItems("/help/candle-review", CANDLE_REVIEW_HELP_GUIDES, "trade_tracker"),
  Object.freeze({
    href: "/help/core-analytics",
    icon: "trade_tracker",
    label: "Core Analytics",
    summary: "Compare completed Trade Tracker facts by date, ticker, timing and execution characteristics.",
  }),
  ...guideNavigationItems("/help/core-analytics", CORE_ANALYTICS_HELP_GUIDES, "trade_tracker"),
  Object.freeze({
    href: "/help/trading-rules",
    icon: "trading_rules",
    label: "Trading Rules",
    summary: "Choose rules, review results and understand the evidence behind each check.",
  }),
  ...guideNavigationItems("/help/trading-rules", TRADING_RULES_HELP_GUIDES, "trading_rules"),
  Object.freeze({
    href: "/help/trade-tags",
    icon: "trade_tags",
    label: "Trade Tags",
    summary: "Label individual trades with preset or custom observations you choose.",
  }),
  ...guideNavigationItems("/help/trade-tags", TRADE_TAGS_HELP_GUIDES, "trade_tags"),
  Object.freeze({
    href: "/help/trade-analyzer",
    icon: "trade_analyzer",
    label: "Trade Analyzer",
    summary: "Replay trades and understand entry, exit, Green-to-red and candle-pattern analysis.",
  }),
  ...guideNavigationItems("/help/trade-analyzer", TRADE_ANALYZER_HELP_GUIDES, "trade_analyzer"),
  Object.freeze({
    href: "/help/ai-reviews",
    icon: "ai_reviews",
    label: "AI Reviews",
    summary: "Schedule, prepare, read and troubleshoot your AI Reviews.",
  }),
  ...guideNavigationItems("/help/ai-reviews", AI_REVIEWS_HELP_GUIDES, "ai_reviews"),
  Object.freeze({
    href: "/help/paid-plan",
    icon: "paid_plan",
    label: "Paid plan and billing",
    summary: "Connect Whop, manage billing and understand paid access.",
  }),
  ...guideNavigationItems("/help/paid-plan", PAID_PLAN_HELP_GUIDES, "paid_plan"),
  Object.freeze({
    href: "/help/notifications-and-imports",
    icon: "notifications",
    label: "Notifications and imports",
    summary: "Find updates, choose Discord messages and finish a statement that needs help.",
  }),
  ...guideNavigationItems("/help/notifications-and-imports", NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES, "notifications"),
]);

function guideSearchRecords(
  collectionId: string,
  collectionTitle: string,
  baseHref: string,
  guides: readonly HelpGuide[],
): readonly HelpSearchRecord[] {
  return guides.flatMap((guide) => [
    Object.freeze({
      href: `${baseHref}/${guide.slug}`,
      id: `${collectionId}-${guide.slug}`,
      keywords: Object.freeze(guide.sections.flatMap((section) => section.keywords)),
      section: collectionTitle,
      summary: guide.description,
      title: guide.title,
    }),
    ...guide.sections.map((section) => Object.freeze({
      href: `${baseHref}/${guide.slug}#${section.id}`,
      id: `${collectionId}-${guide.slug}-${section.id}`,
      keywords: section.keywords,
      section: guide.title,
      summary: section.summary,
      title: section.title,
    })),
  ]);
}

export const HELP_SEARCH_RECORDS: readonly HelpSearchRecord[] = Object.freeze([
  Object.freeze({
    href: "/help/daily-trade-tracker",
    id: "daily-trade-tracker-overview",
    keywords: Object.freeze(["trade tracker", "day tracker", "trade review", "daily workflow"]),
    section: "Daily Trade Tracker",
    summary: "See how executions, trades, charts, rules and notes fit into one daily review.",
    title: "Daily Trade Tracker overview",
  }),
  ...guideSearchRecords(
    "daily-trade-tracker",
    "Daily Trade Tracker",
    "/help/daily-trade-tracker",
    DAILY_TRADE_TRACKER_HELP_GUIDES,
  ),
  Object.freeze({
    href: "/help/quick-trade-entry",
    id: "quick-trade-entry-overview",
    keywords: Object.freeze(["quick entry", "manual entry", "past trades", "multiple trading dates"]),
    section: "Quick Trade Entry",
    summary: "Enter completed executions across past trading dates without starting a Tracker review.",
    title: "Quick Trade Entry overview",
  }),
  ...guideSearchRecords("quick-trade-entry", "Quick Trade Entry", "/help/quick-trade-entry", QUICK_TRADE_ENTRY_HELP_GUIDES),
  Object.freeze({
    href: "/help/swing-trade-tracker",
    id: "swing-trade-tracker-overview",
    keywords: Object.freeze(["swing trade", "active swing", "swing notes", "swing beta"]),
    section: "Swing Trade Tracker",
    summary: "Use the current beta workflow for intentional swing positions and dated notes.",
    title: "Swing Trade Tracker overview",
  }),
  ...guideSearchRecords("swing-trade-tracker", "Swing Trade Tracker", "/help/swing-trade-tracker", SWING_TRADE_TRACKER_HELP_GUIDES),
  Object.freeze({
    href: "/help/calendar",
    id: "calendar-overview",
    keywords: Object.freeze(["calendar", "month view", "week view", "trading day"]),
    section: "Calendar",
    summary: "Read completed Trade Tracker trades by month or week and inspect a trading day.",
    title: "Calendar overview",
  }),
  ...guideSearchRecords("calendar", "Calendar", "/help/calendar", CALENDAR_HELP_GUIDES),
  Object.freeze({
    href: "/help/open-positions",
    id: "open-positions-overview",
    keywords: Object.freeze(["open positions", "active swing", "day trade still open", "bag hold"]),
    section: "Open Positions",
    summary: "See confirmed positions and record their current trader-defined status.",
    title: "Open Positions overview",
  }),
  ...guideSearchRecords("open-positions", "Open Positions", "/help/open-positions", OPEN_POSITIONS_HELP_GUIDES),
  Object.freeze({
    href: "/help/data-decisions",
    id: "data-decisions-overview",
    keywords: Object.freeze(["data decisions", "duplicate trade", "statement issue", "fix execution"]),
    section: "Data Decisions",
    summary: "Answer the specific Trade Tracker questions that need broker evidence.",
    title: "Data Decisions overview",
  }),
  ...guideSearchRecords("data-decisions", "Data Decisions", "/help/data-decisions", DATA_DECISIONS_HELP_GUIDES),
  Object.freeze({
    href: "/help/candle-review",
    id: "candle-review-overview",
    keywords: Object.freeze(["candle review", "price path", "entry exit chart", "market data", "review trade"]),
    section: "Candle Review",
    summary: "Request and read optional market context for an eligible completed trade.",
    title: "Candle Review overview",
  }),
  ...guideSearchRecords("candle-review", "Candle Review", "/help/candle-review", CANDLE_REVIEW_HELP_GUIDES),
  Object.freeze({
    href: "/help/core-analytics",
    id: "core-analytics-overview",
    keywords: Object.freeze(["analytics", "performance", "results", "timing", "execution", "date range"]),
    section: "Core Analytics",
    summary: "Compare completed Trade Tracker facts by date, ticker, timing and execution characteristics.",
    title: "Core Analytics overview",
  }),
  ...guideSearchRecords("core-analytics", "Core Analytics", "/help/core-analytics", CORE_ANALYTICS_HELP_GUIDES),
  Object.freeze({
    href: "/help/trading-rules",
    id: "trading-rules-overview",
    keywords: Object.freeze(["trading rules", "preset rules", "custom rules", "rule results"]),
    section: "Trading Rules",
    summary: "Choose, manage and review preset and custom Trading Rules.",
    title: "Trading Rules overview",
  }),
  ...guideSearchRecords(
    "trading-rules",
    "Trading Rules",
    "/help/trading-rules",
    TRADING_RULES_HELP_GUIDES,
  ),
  Object.freeze({
    href: "/help/trade-tags",
    id: "trade-tags-overview",
    keywords: Object.freeze(["trade tags", "preset tags", "custom tags", "tag a trade"]),
    section: "Trade Tags",
    summary: "Label individual Day trades and supported Swing positions with tags you choose.",
    title: "Trade Tags overview",
  }),
  ...guideSearchRecords(
    "trade-tags",
    "Trade Tags",
    "/help/trade-tags",
    TRADE_TAGS_HELP_GUIDES,
  ),
  Object.freeze({
    href: "/help/trade-analyzer",
    id: "trade-analyzer-overview",
    keywords: Object.freeze(["trade analyzer", "chart replay", "entry exit", "green to red", "candle patterns"]),
    section: "Trade Analyzer",
    summary: "Replay supported trades and understand every saved Analyzer result.",
    title: "Trade Analyzer overview",
  }),
  ...guideSearchRecords(
    "trade-analyzer",
    "Trade Analyzer",
    "/help/trade-analyzer",
    TRADE_ANALYZER_HELP_GUIDES,
  ),
  Object.freeze({
    href: "/help/ai-reviews",
    id: "ai-reviews-overview",
    keywords: Object.freeze(["AI feedback", "weekly review", "monthly review", "trade review"]),
    section: "AI Reviews",
    summary: "Choose a schedule, understand review evidence and use saved feedback.",
    title: "AI Reviews overview",
  }),
  ...guideSearchRecords("ai-reviews", "AI Reviews", "/help/ai-reviews", AI_REVIEWS_HELP_GUIDES),
  Object.freeze({
    href: "/help/paid-plan",
    id: "paid-plan-overview",
    keywords: Object.freeze(["subscription", "Whop", "billing", "paid access", "membership"]),
    section: "Paid plan and billing",
    summary: "Connect Whop, manage the wider TraderLink paid plan and fix access problems.",
    title: "Paid plan and billing overview",
  }),
  ...guideSearchRecords("paid-plan", "Paid plan and billing", "/help/paid-plan", PAID_PLAN_HELP_GUIDES),
  Object.freeze({
    href: "/help/notifications-and-imports",
    id: "notifications-and-imports-overview",
    keywords: Object.freeze(["notifications", "Discord", "statement import", "unsupported statement", "import help"]),
    section: "Notifications and imports",
    summary: "Find updates, choose Discord messages and finish a statement that needs help.",
    title: "Notifications and imports overview",
  }),
  ...guideSearchRecords("notifications-and-imports", "Notifications and imports", "/help/notifications-and-imports", NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES),
]);

export const HELP_POPULAR_RECORD_IDS: readonly string[] = Object.freeze([
  "daily-trade-tracker-add-edit-trades-enter-executions",
  "quick-trade-entry-enter-executions-add-rows",
  "swing-trade-tracker-getting-started-what-you-can-do-today",
  "calendar-inspect-a-day-open-details",
  "open-positions-choose-status-choose-the-best-description",
  "data-decisions-getting-started-why-a-decision-appears",
  "candle-review-run-and-read-review-analyze-on-demand",
  "core-analytics-overview-and-date-range-set-a-date-range",
  "trading-rules-understand-results-result-meanings",
  "trade-tags-add-edit-tags-open-tag-editor",
  "trade-analyzer-entry-exit-analysis-individual-executions",
  "trade-analyzer-green-to-red-analysis-profit-capture",
  "ai-reviews-choose-schedule-frequency-options",
  "ai-reviews-what-ai-uses-saved-reflections",
  "ai-reviews-weekly-two-week-cross-month-week",
  "paid-plan-access-troubleshooting-active-in-whop-not-traderlink",
  "notifications-and-imports-statement-will-not-import",
]);

export function helpPopularRecords(): readonly HelpSearchRecord[] {
  const popularIds = new Set(HELP_POPULAR_RECORD_IDS);
  return HELP_SEARCH_RECORDS.filter((record) => popularIds.has(record.id));
}
