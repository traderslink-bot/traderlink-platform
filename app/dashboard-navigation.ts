import { areTraderLinkPlatformAiFeaturesEnabled } from
  "@/src/modules/platform/contracts/platform-ai-launch-state";

export type DashboardNavigationIconKey =
  | "account"
  | "admin"
  | "analytics"
  | "aiReviews"
  | "aiChat"
  | "calendar"
  | "compareArrows"
  | "tradingDay"
  | "swing"
  | "roundTrips"
  | "marketCharts"
  | "data"
  | "execution"
  | "halt"
  | "help"
  | "import"
  | "lab"
  | "manualEntry"
  | "newspaper"
  | "overview"
  | "openPositions"
  | "tradeAnalyzer"
  | "tradeBreakdown"
  | "dayTradeAnalysis"
  | "entryExit"
  | "greenToRed"
  | "mfeMae"
  | "reflection"
  | "results"
  | "rules"
  | "scanner"
  | "ticker"
  | "timing"
  | "tradeAnalysis"
  | "tradeExplorer"
  | "tradeGroup"
  | "trades"
  | "workspace";

export type DashboardNavigationItem = Readonly<{
  href: string;
  label: string;
  icon: DashboardNavigationIconKey;
  depth?: 1 | 2;
  statusLabel?: "Coming soon";
}>;

const aiStatusLabel = areTraderLinkPlatformAiFeaturesEnabled()
  ? undefined
  : "Coming soon" as const;

export type DashboardNavigationDrawerItem = Readonly<{
  id: "marketHaltAlerts";
  label: string;
  icon: DashboardNavigationIconKey;
}>;

export type DashboardNavigationGroupItem =
  | DashboardNavigationDrawerItem
  | DashboardNavigationItem;

export function isDashboardNavigationItem(
  item: DashboardNavigationGroupItem,
): item is DashboardNavigationItem {
  return "href" in item;
}

export type DashboardNavigationGroup = Readonly<{
  id: "tradeEntry" | "trades" | "rules" | "pressReleases" | "analytics" | "tradeAnalyzer" | "ai" | "stockTools" | "tradeRecords";
  label: string;
  icon: DashboardNavigationIconKey;
  items: readonly DashboardNavigationGroupItem[];
}>;

export const DASHBOARD_MARKET_HALT_ALERTS_ITEM: DashboardNavigationDrawerItem =
  Object.freeze({
    id: "marketHaltAlerts",
    label: "Halt Alerts",
    icon: "halt",
  });

export const DASHBOARD_HOME_ITEM: DashboardNavigationItem = Object.freeze({
  href: "/workspace",
  label: "Workspace",
  icon: "workspace",
});

export const DASHBOARD_MAIN_NAVIGATION_GROUPS: readonly DashboardNavigationGroup[] =
  Object.freeze([
    Object.freeze({
      id: "tradeEntry" as const,
      label: "Trade Entry",
      icon: "manualEntry" as const,
      items: Object.freeze([
        Object.freeze({
          href: "/trade-tracker",
          label: "Daily Trade Tracker",
          icon: "tradingDay" as const,
        }),
        Object.freeze({
          href: "/trade-tracker/swings",
          label: "Swing Trade Tracker",
          icon: "swing" as const,
        }),
        Object.freeze({
          href: "/quick-trade-entry",
          label: "Quick Trade Entry",
          icon: "manualEntry" as const,
        }),
      ]),
    }),
    Object.freeze({
      id: "trades" as const,
      label: "Trades",
      icon: "tradeGroup" as const,
      items: Object.freeze([
        Object.freeze({
          href: "/calendar",
          label: "Calendar",
          icon: "calendar" as const,
        }),
        Object.freeze({
          href: "/analytics/trade-explorer",
          label: "Trade Explorer",
          icon: "tradeExplorer" as const,
        }),
        Object.freeze({
          href: "/analytics/trade-explorer/compare",
          label: "Compare Trades",
          icon: "compareArrows" as const,
        }),
      ]),
    }),
    Object.freeze({
      id: "rules" as const,
      label: "Rules",
      icon: "rules" as const,
      items: Object.freeze([
        Object.freeze({
          href: "/rules",
          label: "Trading Rules",
          icon: "rules" as const,
        }),
        Object.freeze({
          href: "/rules/results",
          label: "Rule Results",
          icon: "results" as const,
        }),
      ]),
    }),
    Object.freeze({
      id: "tradeAnalyzer" as const,
      label: "Trade Analyzer",
      icon: "tradeAnalyzer" as const,
      items: Object.freeze([
        Object.freeze({
          href: "/analytics/trade-analyzer/day",
          label: "Day Trade Analysis",
          icon: "dayTradeAnalysis" as const,
          depth: 1 as const,
        }),
        Object.freeze({
          href: "/analytics/trade-analyzer/day/entry-exit",
          label: "Entry & Exit",
          icon: "entryExit" as const,
          depth: 2 as const,
        }),
        Object.freeze({
          href: "/analytics/trade-analyzer/day/mfe-mae",
          label: "MFE & MAE",
          icon: "mfeMae" as const,
          depth: 2 as const,
        }),
        Object.freeze({
          href: "/analytics/trade-analyzer/day/green-to-red",
          label: "Green-to-Red",
          icon: "greenToRed" as const,
          depth: 2 as const,
        }),
        Object.freeze({
          href: "/analytics/trade-analyzer/day/candle-patterns",
          label: "Candle Patterns",
          icon: "marketCharts" as const,
          depth: 2 as const,
        }),
        Object.freeze({
          href: "/analytics/trade-analyzer/day/trades",
          label: "Analyzed Trades",
          icon: "trades" as const,
          depth: 2 as const,
        }),
      ]),
    }),
    Object.freeze({
      id: "analytics" as const,
      label: "Analytics",
      icon: "analytics" as const,
      items: Object.freeze([
        Object.freeze({
          href: "/analytics",
          label: "Overview",
          icon: "overview" as const,
        }),
        Object.freeze({
          href: "/analytics/results",
          label: "Ticker",
          icon: "ticker" as const,
        }),
        Object.freeze({
          href: "/analytics/timing",
          label: "Timing",
          icon: "timing" as const,
        }),
        Object.freeze({
          href: "/analytics/execution",
          label: "Trade Breakdown",
          icon: "tradeBreakdown" as const,
        }),
      ]),
    }),
    Object.freeze({
      id: "ai" as const,
      label: "AI",
      icon: "aiChat" as const,
      items: Object.freeze([
        Object.freeze({ href: "/ai-chat", label: "Links AI Chat", icon: "aiChat" as const, statusLabel: aiStatusLabel }),
        Object.freeze({ href: "/ai-reviews", label: "AI Reviews", icon: "aiReviews" as const, statusLabel: aiStatusLabel }),
      ]),
    }),
    Object.freeze({
      id: "stockTools" as const,
      label: "Stock Tools",
      icon: "marketCharts" as const,
      items: Object.freeze([
        Object.freeze({ href: "/scanner", label: "Scanner", icon: "scanner" as const }),
        Object.freeze({ href: "/levels", label: "Levels Generator", icon: "marketCharts" as const }),
        Object.freeze({ href: "/admin/watchlist", label: "Watchlist Admin", icon: "admin" as const }),
        Object.freeze({ href: "/charts", label: "Market Charts", icon: "marketCharts" as const }),
        DASHBOARD_MARKET_HALT_ALERTS_ITEM,
      ]),
    }),
    Object.freeze({
      id: "pressReleases" as const,
      label: "Market News",
      icon: "newspaper" as const,
      items: Object.freeze([
        Object.freeze({ href: "/market-news/week-ahead", label: "The Week Ahead", icon: "newspaper" as const }),
        Object.freeze({ href: "/press-releases/news-filtered", label: "News Scanner", icon: "newspaper" as const }),
        Object.freeze({ href: "/press-releases/market-cap/under-30m", label: "Under $30M", icon: "newspaper" as const }),
        Object.freeze({ href: "/press-releases/market-cap/30m-50m", label: "$30M-$50M", icon: "newspaper" as const }),
        Object.freeze({ href: "/press-releases/market-cap/50m-100m", label: "$50M-$100M", icon: "newspaper" as const }),
      ]),
    }),
    Object.freeze({
      id: "tradeRecords" as const,
      label: "Trade Records",
      icon: "data" as const,
      items: Object.freeze([
        Object.freeze({ href: "/trades/open", label: "Open Positions", icon: "openPositions" as const }),
        Object.freeze({ href: "/imports", label: "Import Trades", icon: "import" as const }),
        Object.freeze({ href: "/data-decisions", label: "Data Decisions", icon: "data" as const }),
      ]),
    }),
  ]);

// Kept for dashboard-template compatibility. Scanner and Market Charts now live
// in Stock Tools, so there are no standalone sidebar links.
export const DASHBOARD_STANDALONE_ITEMS: readonly DashboardNavigationItem[] =
  Object.freeze([]);

export type DashboardSidebarNavigationSection = Readonly<
  {
    kind: "group";
    group: DashboardNavigationGroup;
    dividerBefore?: boolean;
  }
>;

export const DASHBOARD_SIDEBAR_NAVIGATION_SECTIONS: readonly DashboardSidebarNavigationSection[] =
  Object.freeze([
    Object.freeze({ kind: "group" as const, group: DASHBOARD_MAIN_NAVIGATION_GROUPS[0] }),
    Object.freeze({ kind: "group" as const, group: DASHBOARD_MAIN_NAVIGATION_GROUPS[1] }),
    Object.freeze({ kind: "group" as const, group: DASHBOARD_MAIN_NAVIGATION_GROUPS[2] }),
    Object.freeze({ kind: "group" as const, group: DASHBOARD_MAIN_NAVIGATION_GROUPS[3] }),
    Object.freeze({ kind: "group" as const, group: DASHBOARD_MAIN_NAVIGATION_GROUPS[4] }),
    Object.freeze({ kind: "group" as const, group: DASHBOARD_MAIN_NAVIGATION_GROUPS[5] }),
    Object.freeze({ kind: "group" as const, group: DASHBOARD_MAIN_NAVIGATION_GROUPS[6] }),
    Object.freeze({ kind: "group" as const, group: DASHBOARD_MAIN_NAVIGATION_GROUPS[7] }),
    Object.freeze({ kind: "group" as const, group: DASHBOARD_MAIN_NAVIGATION_GROUPS[8] }),
  ]);

export const DASHBOARD_ROUTE_TITLES: Readonly<Record<string, string>> =
  Object.freeze({
    "/workspace": "Welcome to TradersLink Beta App.",
    "/workspace/readiness": "Platform Readiness",
    "/calendar": "Calendar",
    "/scanner": "Scanner",
    "/levels": "Stock Levels",
    "/admin/watchlist": "Watchlist Admin",
    "/trade-tracker": "Daily Trade Tracker",
    "/trade-tracker/swings": "Swing Trade Tracker",
    "/quick-trade-entry": "Quick Trade Entry",
    "/trades/open": "Open Positions",
    "/analytics": "Analytics Overview",
    "/analytics/results": "Ticker",
    "/analytics/timing": "Timing",
    "/analytics/execution": "Trade Breakdown",
    "/analytics/trade-analysis": "Day Trade Analysis",
    "/analytics/trade-analyzer/day": "Day Trade Analysis",
    "/analytics/trade-analyzer/day/entry-exit": "Entry & Exit",
    "/analytics/trade-analyzer/day/mfe-mae": "MFE & MAE",
    "/analytics/trade-analyzer/day/green-to-red": "Green-to-Red",
    "/analytics/trade-analyzer/day/candle-patterns": "Candle Patterns",
    "/analytics/trade-analyzer/day/trades": "Analyzed Trades",
    "/analytics/trade-explorer": "Trade Explorer",
    "/analytics/trade-explorer/compare": "Compare Trades",
    "/charts": "Market Charts",
    "/help": "Help Center",
    "/ai-reviews": "AI Reviews",
    "/ai-chat": "Links AI Chat",
    "/rules": "Trading Rules",
    "/rules/results": "Rule Results",
    "/imports": "Import Trades",
    "/manual-entry": "Manual Entry",
    "/data-decisions": "Data Decisions",
    "/account": "Account",
    "/notifications": "Notifications",
    "/press-releases": "All Press Releases",
    "/press-releases/news-filtered": "News Scanner",
    "/market-news/week-ahead": "The Week Ahead",
    "/press-releases/market-cap": "All Market Cap",
    "/press-releases/market-cap/under-30m": "Under $30M Market Cap",
    "/press-releases/market-cap/30m-50m": "$30M–$50M Market Cap",
    "/press-releases/market-cap/50m-100m": "$50M–$100M Market Cap",
  });

export const DASHBOARD_NAVIGATION_HREFS: readonly string[] = Object.freeze([
  DASHBOARD_HOME_ITEM.href,
  ...DASHBOARD_MAIN_NAVIGATION_GROUPS.flatMap((group) =>
    group.items.filter(isDashboardNavigationItem).map((item) => item.href),
  ),
]);

export type DashboardHelpTarget = Readonly<{
  href: string;
  label: string;
}>;

const DASHBOARD_HELP_TARGETS: readonly Readonly<DashboardHelpTarget & { route: string }>[] =
  Object.freeze([
    Object.freeze({ route: "/analytics/trade-analyzer/day/candle-patterns", href: "/help/trade-analyzer/candle-patterns", label: "Candle Patterns" }),
    Object.freeze({ route: "/analytics/trade-analyzer/day/green-to-red", href: "/help/trade-analyzer/green-to-red-analysis", label: "Green-to-Red" }),
    Object.freeze({ route: "/analytics/trade-analyzer/day/entry-exit", href: "/help/trade-analyzer/entry-exit-analysis", label: "Entry & Exit" }),
    Object.freeze({ route: "/analytics/trade-analyzer/day/mfe-mae", href: "/help/trade-analyzer/mfe-mae", label: "MFE & MAE" }),
    Object.freeze({ route: "/analytics/trade-analyzer/day/trades", href: "/help/trade-analyzer/analyzed-trades", label: "Analyzed Trades" }),
    Object.freeze({ route: "/analytics/trade-analyzer/day", href: "/help/trade-analyzer/day-trade-analysis", label: "Day Trade Analysis" }),
    Object.freeze({ route: "/analytics/trade-explorer", href: "/help/core-analytics", label: "Trade Explorer" }),
    Object.freeze({ route: "/analytics/results", href: "/help/core-analytics/compare-results-by-ticker", label: "Ticker" }),
    Object.freeze({ route: "/analytics/timing", href: "/help/core-analytics/timing-and-execution", label: "Timing" }),
    Object.freeze({ route: "/analytics/execution", href: "/help/core-analytics/timing-and-execution", label: "Trade Breakdown" }),
    Object.freeze({ route: "/analytics", href: "/help/core-analytics/overview-and-date-range", label: "Analytics Overview" }),
    Object.freeze({ route: "/charts", href: "/help", label: "Market Charts" }),
    Object.freeze({ route: "/trade-tracker/swings", href: "/help/swing-trade-tracker", label: "Swing Trade Tracker" }),
    Object.freeze({ route: "/trade-tracker", href: "/help/daily-trade-tracker", label: "Daily Trade Tracker" }),
    Object.freeze({ route: "/quick-trade-entry", href: "/help/quick-trade-entry", label: "Quick Trade Entry" }),
    Object.freeze({ route: "/trades/candle-review", href: "/help/candle-review", label: "Candle Review" }),
    Object.freeze({ route: "/trades/open", href: "/help/open-positions", label: "Open Positions" }),
    Object.freeze({ route: "/rules/results", href: "/help/trading-rules/results-history", label: "Rule Results" }),
    Object.freeze({ route: "/rules", href: "/help/trading-rules", label: "Trading Rules" }),
    Object.freeze({ route: "/calendar", href: "/help/calendar", label: "Trading Calendar" }),
    Object.freeze({ route: "/levels", href: "/help/stock-levels", label: "Stock Levels" }),
    Object.freeze({ route: "/imports", href: "/help/notifications-and-imports", label: "Import Trades" }),
    Object.freeze({ route: "/notifications", href: "/help/notifications-and-imports/notifications", label: "Notifications" }),
    Object.freeze({ route: "/press-releases", href: "/help/notifications-and-imports/notifications", label: "Press Releases" }),
    Object.freeze({ route: "/data-decisions", href: "/help/data-decisions", label: "Data Decisions" }),
    Object.freeze({ route: "/ai-chat", href: "/help/ai-chat", label: "Links AI Chat" }),
    Object.freeze({ route: "/ai-reviews", href: "/help/ai-reviews", label: "AI Reviews" }),
    Object.freeze({ route: "/trade-tags", href: "/help/trade-tags", label: "Trade Tags" }),
  ]);

export function dashboardHelpTarget(pathname: string): DashboardHelpTarget | null {
  if (pathname === "/help" || pathname.startsWith("/help/")) {
    return null;
  }
  const exactOrParent = DASHBOARD_HELP_TARGETS.find((target) =>
    pathname === target.route || pathname.startsWith(`${target.route}/`));
  if (exactOrParent) {
    return Object.freeze({ href: exactOrParent.href, label: exactOrParent.label });
  }
  const routeTitle = Object.entries(DASHBOARD_ROUTE_TITLES)
    .sort(([left], [right]) => right.length - left.length)
    .find(([route]) => pathname === route || pathname.startsWith(`${route}/`))?.[1];
  return Object.freeze({ href: "/help", label: routeTitle ?? "this page" });
}
