import { AI_REVIEWS_HELP_GUIDES } from "./ai-reviews-guides";
import { DAILY_TRADE_TRACKER_HELP_GUIDES } from "./daily-trade-tracker-guides";
import type { HelpGuide } from "./help-guide-types";
import { NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES } from "./notifications-and-imports-guides";
import { PAID_PLAN_HELP_GUIDES } from "./paid-plan-guides";
import { TRADE_ANALYZER_HELP_GUIDES } from "./trade-analyzer-guides";

export type HelpNavigationItem = Readonly<{
  depth?: 0 | 1;
  href: string;
  icon: "home" | "trade_tracker" | "trade_analyzer" | "ai_reviews" | "paid_plan" | "notifications";
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
    keywords: Object.freeze(["journal", "day tracker", "trade review", "daily workflow"]),
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
