export type DashboardNavigationIconKey =
  | "account"
  | "analytics"
  | "calendar"
  | "tradingDay"
  | "swing"
  | "roundTrips"
  | "marketCharts"
  | "data"
  | "execution"
  | "import"
  | "lab"
  | "manualEntry"
  | "overview"
  | "reflection"
  | "results"
  | "rules"
  | "ticker"
  | "timing"
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
  id: "trades" | "analytics" | "data";
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
          href: "/calendar",
          label: "Calendar",
          icon: "calendar" as const,
        }),
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
          href: "/trades/roundtrips",
          label: "Round Trips",
          icon: "roundTrips" as const,
        }),
        Object.freeze({
          href: "/trades/ticker",
          label: "Trades by Ticker",
          icon: "ticker" as const,
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
        Object.freeze({
          href: "/analytics/lab",
          label: "Analytics Lab",
          icon: "lab" as const,
        }),
      ]),
    }),
  ]);

export const DASHBOARD_STANDALONE_ITEMS: readonly DashboardNavigationItem[] =
  Object.freeze([
    Object.freeze({
      href: "/reflection-loop",
      label: "Reflection Loop",
      icon: "reflection" as const,
    }),
    Object.freeze({
      href: "/rules",
      label: "Trading Rules",
      icon: "rules" as const,
    }),
    Object.freeze({
      href: "/charts",
      label: "Market Charts",
      icon: "marketCharts" as const,
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
    "/trades/roundtrips": "Round Trips",
    "/trade-tracker": "Daily Trade Tracker",
    "/trade-tracker/swings": "Swing Trade Tracker",
    "/trades/ticker": "Trades by Ticker",
    "/trades/open": "Open Positions",
    "/analytics": "Analytics Overview",
    "/analytics/results": "Results",
    "/analytics/timing": "Timing",
    "/analytics/execution": "Execution",
    "/analytics/lab": "Analytics Lab",
    "/analytics/trade-explorer": "Trade Explorer",
    "/charts": "Market Charts",
    "/reflection-loop": "Reflection Loop",
    "/rules": "Trading Rules",
    "/imports": "Import Trades",
    "/manual-entry": "Manual Entry",
    "/data-decisions": "Data Decisions",
    "/account": "Account",
  });

export const DASHBOARD_NAVIGATION_HREFS: readonly string[] = Object.freeze([
  DASHBOARD_HOME_ITEM.href,
  ...DASHBOARD_MAIN_NAVIGATION_GROUPS.flatMap((group) =>
    group.items.map((item) => item.href),
  ),
  ...DASHBOARD_STANDALONE_ITEMS.map((item) => item.href),
  ...DASHBOARD_DATA_NAVIGATION_GROUP.items.map((item) => item.href),
]);
