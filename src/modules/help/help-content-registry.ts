import { DAILY_TRADE_TRACKER_HELP_GUIDES } from "./daily-trade-tracker-guides";

export type HelpNavigationItem = Readonly<{
  depth?: 0 | 1;
  href: string;
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

export const HELP_NAVIGATION_ITEMS: readonly HelpNavigationItem[] = Object.freeze([
  Object.freeze({
    href: "/help",
    label: "Help Center",
    summary: "Search TraderLink help and browse available guides.",
  }),
  Object.freeze({
    href: "/help/daily-trade-tracker",
    label: "Daily Trade Tracker",
    summary: "Record trades, review executions and finish your trading day.",
  }),
  ...DAILY_TRADE_TRACKER_HELP_GUIDES.map((guide) => Object.freeze({
    depth: 1 as const,
    href: `/help/daily-trade-tracker/${guide.slug}`,
    label: guide.title,
    summary: guide.description,
  })),
]);

export const HELP_SEARCH_RECORDS: readonly HelpSearchRecord[] = Object.freeze([
  Object.freeze({
    href: "/help/daily-trade-tracker",
    id: "daily-trade-tracker-overview",
    keywords: Object.freeze(["journal", "day tracker", "trade review", "daily workflow"]),
    section: "Daily Trade Tracker",
    summary: "See how executions, trades, charts, rules and notes fit into one daily review.",
    title: "Daily Trade Tracker overview",
  }),
  ...DAILY_TRADE_TRACKER_HELP_GUIDES.flatMap((guide) => [
    Object.freeze({
      href: `/help/daily-trade-tracker/${guide.slug}`,
      id: `daily-trade-tracker-${guide.slug}`,
      keywords: Object.freeze(guide.sections.flatMap((section) => section.keywords)),
      section: "Daily Trade Tracker",
      summary: guide.description,
      title: guide.title,
    }),
    ...guide.sections.map((section) => Object.freeze({
      href: `/help/daily-trade-tracker/${guide.slug}#${section.id}`,
      id: `daily-trade-tracker-${guide.slug}-${section.id}`,
      keywords: section.keywords,
      section: guide.title,
      summary: section.summary,
      title: section.title,
    })),
  ]),
]);

export const HELP_POPULAR_RECORD_IDS: readonly string[] = Object.freeze([
  "daily-trade-tracker-add-edit-trades-enter-executions",
  "daily-trade-tracker-review-trades-view-analysis",
  "daily-trade-tracker-charts-analysis-candle-patterns",
  "daily-trade-tracker-rules-notes-day-review-mark-reviewed",
  "daily-trade-tracker-data-timing-limitations-same-day-timing",
]);

export function helpPopularRecords(): readonly HelpSearchRecord[] {
  const popularIds = new Set(HELP_POPULAR_RECORD_IDS);
  return HELP_SEARCH_RECORDS.filter((record) => popularIds.has(record.id));
}
