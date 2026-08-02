import { formatJournalAnalyticsPartitionedMetric } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import {
  buildJournalAnalyticsDashboardQuery,
  withJournalAnalyticsDashboardService,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireDevelopmentDashboardRequestScope } from "@/src/modules/platform/server/authentication/require-development-dashboard-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKSPACE_METRICS = [
  ["Net realized P/L", "net_pnl", "Fee-covered completed trades"],
  ["Gross P/L", "gross_pnl", "Before trading costs"],
  ["Expectancy", "expectancy", "Per completed trade"],
  ["Win rate", "win_rate", "Completed round trips"],
  ["Profit factor", "profit_factor", "Gross wins divided by losses"],
  ["Round trips", "included_count", "All available history"],
] as const;

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireDevelopmentDashboardRequestScope(request.headers);
    const query = buildJournalAnalyticsDashboardQuery(scope, {
      metricIds: WORKSPACE_METRICS.map(([, metricId]) => metricId),
    });
    const response = withJournalAnalyticsDashboardService(scope, (service) =>
      service.getWorkspaceJournalAnalyticsSummary(scope, query));
    return Response.json({
      status: "ready",
      metrics: WORKSPACE_METRICS.map(([label, metricId, caption]) => ({
        label,
        caption,
        value: formatJournalAnalyticsPartitionedMetric(response, metricId),
      })),
      coverage: response.crossPartitionCounts,
    });
  } catch (error) {
    const unauthorized = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED";
    return Response.json(
      { status: "unavailable" },
      { status: unauthorized ? 401 : 503 },
    );
  }
}
