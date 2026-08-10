export type DashboardNavigationIconKey =
  | "account"
  | "analytics"
  | "aiReviews"
  | "aiChat"
  | "calendar"
  | "tradingDay"
  | "swing"
  | "roundTrips"
  | "marketCharts"
  | "data"
  | "execution"
  | "help"
  | "import"
  | "lab"
  | "manualEntry"
  | "overview"
  | "reflection"
  | "results"
  | "rules"
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
}>;

export type DashboardNavigationGroup = Readonly<{
  id: "trades" | "analytics" | "tradeAnalyzer" | "data";
  label: string;
  icon: DashboardNavigationIconKey;
  items: readonly DashboardNavigationItem[];
}>;

export const DASHBOARD_HOME_ITEM: DashboardNavigationItem = Object.freeze({
  href: "/workspace",
  label: "Workspace",
  icon: "workspace",
});

export const DASHBOARD_MAIN_NAVIGATION_GROUPS: readonly DashboardNavigationGroup[] =
  Object.freeze([
    Object.freeze({
      id: "trades" as const,
      label: "Trades",
      icon: "tradeGroup" as const,
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
        Object.freeze({
          href: "/calendar",
          label: "Calendar",
          icon: "calendar" as const,
        }),
        Object.freeze({
          href: "/rules",
          label: "Trading Rules",
          icon: "rules" as const,
        }),
        Object.freeze({
          href: "/analytics/trade-explorer",
          label: "Trade Explorer",
          icon: "tradeExplorer" as const,
        }),
        Object.freeze({
          href: "/trades/open",
          label: "Open Positions",
          icon: "data" as const,
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
          label: "Results",
          icon: "results" as const,
        }),
        Object.freeze({
          href: "/analytics/timing",
          label: "Timing",
          icon: "timing" as const,
        }),
        Object.freeze({
          href: "/analytics/execution",
          label: "Execution",
          icon: "execution" as const,
        }),
      ]),
    }),
    Object.freeze({
      id: "tradeAnalyzer" as const,
      label: "Trade Analyzer",
      icon: "tradeAnalysis" as const,
      items: Object.freeze([
        Object.freeze({
          href: "/analytics/trade-analyzer/day",
          label: "Day Trade Analysis",
          icon: "overview" as const,
        }),
        Object.freeze({
          href: "/analytics/trade-analyzer/day/entry-exit",
          label: "Entry & Exit",
          icon: "execution" as const,
        }),
        Object.freeze({
          href: "/analytics/trade-analyzer/day/mfe-mae",
          label: "MFE & MAE",
          icon: "tradeAnalysis" as const,
        }),
        Object.freeze({
          href: "/analytics/trade-analyzer/day/green-to-red",
          label: "Green-to-Red",
          icon: "tradeAnalysis" as const,
        }),
        Object.freeze({
          href: "/analytics/trade-analyzer/day/candle-patterns",
          label: "Candle Patterns",
          icon: "marketCharts" as const,
        }),
        Object.freeze({
          href: "/analytics/trade-analyzer/day/trades",
          label: "Analyzed Trades",
          icon: "trades" as const,
        }),
      ]),
    }),
  ]);

export const DASHBOARD_STANDALONE_ITEMS: readonly DashboardNavigationItem[] =
  Object.freeze([
    Object.freeze({
      href: "/ai-chat",
      label: "AI Chat",
      icon: "aiChat" as const,
    }),
    Object.freeze({
      href: "/ai-reviews",
      label: "AI Reviews",
      icon: "aiReviews" as const,
    }),
    Object.freeze({
      href: "/charts",
      label: "Market Charts",
      icon: "marketCharts" as const,
    }),
    Object.freeze({
      href: "/help",
      label: "Help Center",
      icon: "help" as const,
    }),
    Object.freeze({
      href: "/account",
      label: "Account",
      icon: "account" as const,
    }),
  ]);

export const DASHBOARD_DATA_NAVIGATION_GROUP: DashboardNavigationGroup =
  Object.freeze({
    id: "data",
    label: "Data",
    icon: "import",
    items: Object.freeze([
      Object.freeze({
        href: "/imports",
        label: "Import Trades",
        icon: "import" as const,
      }),
      Object.freeze({
        href: "/data-decisions",
        label: "Data Decisions",
        icon: "data" as const,
      }),
    ]),
  });

export const DASHBOARD_ROUTE_TITLES: Readonly<Record<string, string>> =
  Object.freeze({
    "/workspace": "Workspace",
    "/workspace/readiness": "Platform Readiness",
    "/calendar": "Calendar",
    "/trade-tracker": "Daily Trade Tracker",
    "/trade-tracker/swings": "Swing Trade Tracker",
    "/quick-trade-entry": "Quick Trade Entry",
    "/trades/open": "Open Positions",
    "/analytics": "Analytics Overview",
    "/analytics/results": "Results by Ticker",
    "/analytics/timing": "Timing",
    "/analytics/execution": "Execution",
    "/analytics/trade-analysis": "Day Trade Analysis",
    "/analytics/trade-analyzer/day": "Day Trade Analysis",
    "/analytics/trade-analyzer/day/entry-exit": "Entry & Exit",
    "/analytics/trade-analyzer/day/mfe-mae": "MFE & MAE",
    "/analytics/trade-analyzer/day/green-to-red": "Green-to-Red",
    "/analytics/trade-analyzer/day/candle-patterns": "Candle Patterns",
    "/analytics/trade-analyzer/day/trades": "Analyzed Trades",
    "/analytics/trade-explorer": "Trade Explorer",
    "/charts": "Market Charts",
    "/help": "Help Center",
    "/ai-reviews": "AI Reviews",
    "/ai-chat": "AI Chat",
    "/rules": "Trading Rules",
    "/imports": "Import Trades",
    "/manual-entry": "Manual Entry",
    "/data-decisions": "Data Decisions",
    "/account": "Account",
    "/notifications": "Notifications",
  });

export const DASHBOARD_NAVIGATION_HREFS: readonly string[] = Object.freeze([
  DASHBOARD_HOME_ITEM.href,
  ...DASHBOARD_MAIN_NAVIGATION_GROUPS.flatMap((group) =>
    group.items.map((item) => item.href),
  ),
  ...DASHBOARD_STANDALONE_ITEMS.map((item) => item.href),
  ...DASHBOARD_DATA_NAVIGATION_GROUP.items.map((item) => item.href),
]);
