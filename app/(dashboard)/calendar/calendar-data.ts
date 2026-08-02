import "server-only";

import {
  withJournalAnalyticsDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import type { CalendarData, CalendarFilterInput } from "./calendar-types";

export function emptyCalendarData(): CalendarData {
  const today = new Date().toISOString().slice(0, 10);
  return Object.freeze({
    state: "unavailable",
    currency: null,
    availableCurrencies: Object.freeze([]),
    timezone: null,
    activeDate: today,
    minimumDate: today,
    maximumDate: today,
    days: Object.freeze([]),
    symbols: Object.freeze([]),
    summary: Object.freeze({
      netPnlDecimal: null,
      netPnlSign: null,
      tradeCount: 0,
      tradingDayCount: 0,
      winRatePercentDecimal: null,
    }),
    coverage: Object.freeze({
      readyClosedCount: 0,
      legitimateOpenCount: 0,
      needsDecisionCount: 0,
      feeCompleteCount: 0,
      feeIncompleteCount: 0,
      limitationReasonCodes: Object.freeze(["review_layout_only"]),
    }),
  });
}

export async function getCalendarData(input: CalendarFilterInput): Promise<CalendarData> {
  const scope = await requireTraderLinkPlatformPageScope();
  return withJournalAnalyticsDashboardRuntime(scope, ({ dashboard }) =>
    dashboard.getCalendar(scope, {
      currency: input.currency === "all" ? null : input.currency,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
      symbol: input.symbol === "all" ? null : input.symbol,
      direction: input.direction === "all" ? null : input.direction,
      performance: input.performance === "all" ? null : input.performance,
      pnlBand: input.pnlRange === "all" ? null : input.pnlRange,
      tradeCountBand: input.tradeCount === "all" ? null : input.tradeCount,
      session: input.session === "all" ? null : input.session,
    }));
}
