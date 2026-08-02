export type LegacyIntelligenceRouteDispositionKind =
  | "canonical_redirect"
  | "compatibility_redirect"
  | "operations_only"
  | "owner_rejected_test_surface";

export type LegacyIntelligenceRouteDisposition = Readonly<{
  source: `/intelligence${string}`;
  capability: string;
  destination: `/${string}`;
  kind: LegacyIntelligenceRouteDispositionKind;
}>;

function disposition(
  source: LegacyIntelligenceRouteDisposition["source"],
  capability: string,
  destination: LegacyIntelligenceRouteDisposition["destination"],
  kind: LegacyIntelligenceRouteDispositionKind = "canonical_redirect",
): LegacyIntelligenceRouteDisposition {
  return Object.freeze({ capability, destination, kind, source });
}

export const LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS = Object.freeze([
  disposition("/intelligence", "legacy-entry", "/workspace"),
  disposition(
    "/intelligence/admin",
    "legacy-admin",
    "/workspace/readiness?capability=legacy-admin",
    "operations_only",
  ),
  disposition(
    "/intelligence/admin/broker-mappings",
    "broker-statement-mapping",
    "/imports?mode=mapping",
  ),
  disposition("/intelligence/analytics", "analytics-overview", "/analytics"),
  disposition(
    "/intelligence/analytics/behavior",
    "execution-behavior-analysis",
    "/analytics/execution",
  ),
  disposition(
    "/intelligence/analytics/chart-evidence",
    "chart-evidence",
    "/trades/candle-review",
  ),
  disposition(
    "/intelligence/analytics/details",
    "analytics-detail",
    "/analytics/results",
  ),
  disposition(
    "/intelligence/analytics/results",
    "analytics-results",
    "/analytics/results",
  ),
  disposition(
    "/intelligence/analytics/review-plan",
    "review-plan",
    "/reflection-loop",
  ),
  disposition(
    "/intelligence/analytics/session-stories",
    "trading-day-performance",
    "/analytics/performance",
  ),
  disposition(
    "/intelligence/analytics/ticker-stories",
    "ticker-performance",
    "/trades/ticker",
  ),
  disposition(
    "/intelligence/analytics/timing",
    "timing-analysis",
    "/analytics/timing",
  ),
  disposition(
    "/intelligence/analytics/trade-explorer",
    "analytics-exploration",
    "/analytics/lab",
  ),
  disposition(
    "/intelligence/calibration",
    "analytics-calibration",
    "/analytics/lab?view=calibration",
  ),
  disposition("/intelligence/coach", "coaching-overview", "/reflection-loop"),
  disposition(
    "/intelligence/coach/behavior-sequence",
    "execution-sequence-review",
    "/reflection-loop?view=behavior-sequence",
  ),
  disposition(
    "/intelligence/coach/details",
    "review-detail",
    "/reflection-loop",
  ),
  disposition(
    "/intelligence/coach/next-session",
    "next-session-focus",
    "/reflection-loop?view=next-session",
  ),
  disposition(
    "/intelligence/coach/progress",
    "reflection-progress",
    "/reflection-loop",
  ),
  disposition(
    "/intelligence/coach/review-backlog",
    "review-backlog",
    "/reflection-loop?view=backlog",
  ),
  disposition(
    "/intelligence/coach/review-session",
    "daily-review",
    "/trade-tracker",
  ),
  disposition(
    "/intelligence/coach/session-stories",
    "day-reflection",
    "/reflection-loop?period=daily",
  ),
  disposition(
    "/intelligence/coach/ticker-stories",
    "ticker-reflection",
    "/trades/ticker",
  ),
  disposition(
    "/intelligence/compare-trades",
    "trade-comparison",
    "/analytics/lab?view=trade-comparison",
  ),
  disposition(
    "/intelligence/csv-mapping-review",
    "manual-statement-mapping",
    "/imports?mode=mapping",
  ),
  disposition(
    "/intelligence/debug/execution-feedback",
    "execution-feedback-debug",
    "/workspace/readiness?capability=execution-feedback-debug",
    "operations_only",
  ),
  disposition(
    "/intelligence/debug/trade-analysis",
    "trade-analysis-debug",
    "/workspace/readiness?capability=trade-analysis-debug",
    "operations_only",
  ),
  disposition(
    "/intelligence/debug/trader-analytics",
    "analytics-debug",
    "/workspace/readiness?capability=analytics-debug",
    "operations_only",
  ),
  disposition("/intelligence/first-run", "first-import-guidance", "/imports"),
  disposition(
    "/intelligence/import-dry-run",
    "pre-commit-import-inspection",
    "/imports?mode=preview",
  ),
  disposition("/intelligence/import-health", "import-health", "/imports"),
  disposition(
    "/intelligence/import-trials",
    "import-trials",
    "/workspace/readiness?capability=import-trials",
    "operations_only",
  ),
  disposition("/intelligence/imports", "import-history", "/imports"),
  disposition(
    "/intelligence/imports/:batchId",
    "batch-repair-detail",
    "/data-decisions",
  ),
  disposition("/intelligence/onboarding", "journal-onboarding", "/imports"),
  disposition(
    "/intelligence/progress",
    "review-progress",
    "/reflection-loop",
  ),
  disposition(
    "/intelligence/repair-wizard",
    "import-repair",
    "/data-decisions",
  ),
  disposition("/intelligence/review", "guided-review", "/reflection-loop"),
  disposition(
    "/intelligence/review-cockpit",
    "review-queue",
    "/reflection-loop?view=backlog",
  ),
  disposition(
    "/intelligence/session-recap",
    "daily-recap",
    "/reflection-loop?period=daily",
  ),
  disposition(
    "/intelligence/trader-intelligence",
    "mock-review-cases",
    "/workspace",
    "owner_rejected_test_surface",
  ),
  disposition("/intelligence/trades", "saved-trade-list", "/trades/roundtrips"),
  disposition(
    "/intelligence/trades/:tradeId",
    "trade-detail-review",
    "/trades/roundtrips",
  ),
  disposition("/intelligence/trades/calendar", "trading-calendar", "/calendar"),
  disposition(
    "/intelligence/trades/day-session/:sessionDate",
    "dated-trade-tracker",
    "/trade-tracker/:sessionDate",
    "compatibility_redirect",
  ),
  disposition(
    "/intelligence/trades/day-sessions",
    "trade-tracker",
    "/trade-tracker",
    "compatibility_redirect",
  ),
  disposition(
    "/intelligence/trades/open-swing",
    "intentional-swing-and-open-position-review",
    "/trades/open",
  ),
  disposition(
    "/intelligence/trades/review-needed",
    "facts-needing-trader-decision",
    "/data-decisions",
  ),
  disposition(
    "/intelligence/trades/round-trips",
    "reconstructed-round-trips",
    "/trades/roundtrips",
  ),
  disposition(
    "/intelligence/trades/ticker-stories",
    "ticker-history",
    "/trades/ticker",
  ),
  disposition(
    "/intelligence/trades/ticker-story/:threadId",
    "legacy-ticker-thread",
    "/trades/ticker",
  ),
  disposition("/intelligence/upload-csv", "statement-upload", "/imports"),
] satisfies readonly LegacyIntelligenceRouteDisposition[]);

export const LEGACY_INTELLIGENCE_ROUTE_COUNT = 52;

export function legacyIntelligenceRedirects(): Array<{
  source: string;
  destination: string;
  permanent: false;
}> {
  return [...LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS]
    .sort((left, right) => {
      const leftDynamic = left.source.includes(":") ? 1 : 0;
      const rightDynamic = right.source.includes(":") ? 1 : 0;
      if (leftDynamic !== rightDynamic) return leftDynamic - rightDynamic;
      return right.source.length - left.source.length;
    })
    .map(({ destination, source }) => ({
      destination,
      permanent: false as const,
      source,
    }));
}
