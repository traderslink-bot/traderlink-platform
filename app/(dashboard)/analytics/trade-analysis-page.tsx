import "server-only";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardPage } from "@/app/dashboard-template";
import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import type { JournalAnalyticsClosingDateRange } from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import {
  createJournalAnalyzedTradesOfflineViewModel,
  createJournalTradeAnalyzerOfflineViewModel,
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION,
  journalAnalyticsOfflineRouteCoverage,
} from "@/src/modules/journal-analytics/contracts/journal-analytics-offline-view-contracts";
import {
  buildJournalAnalyticsDashboardQuery,
  resolveJournalAnalyticsMoneyBasis,
  withJournalAnalyticsReportingDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { journalReportingCurrencyMultiplier } from "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";
import {
  buildDailyTradeLongTermAnalytics,
  readDailyTradeAnalysisCurrencies,
} from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";
import { readDailyTradeAnalyzedTrades } from "@/src/modules/level-analysis/server/daily-trade-analysis-evidence-service";
import { reportDailyTradeAnalyzedTrades } from "@/src/modules/level-analysis/server/daily-trade-analysis-reporting";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";

import { OverviewDateRangeControl, type OverviewDateRange } from "./overview-date-range-control";
import { AnalyzedTradesIndex } from "./analyzed-trades-index";
import { TradeAnalysisClient, type TradeAnalysisView } from "./trade-analysis-client";
import { TradeAnalyzerHelpLink } from "./trade-analyzer-help-link";

const VIEW_DETAILS: Readonly<Record<TradeAnalysisView, Readonly<{
  helpHref: string;
  title: string;
}>>> = Object.freeze({
  day: Object.freeze({ helpHref: "/help/trade-analyzer/day-trade-analysis", title: "Day Trade Analysis" }),
  "entry-exit": Object.freeze({ helpHref: "/help/trade-analyzer/entry-exit-analysis", title: "Entries and exits" }),
  "mfe-mae": Object.freeze({ helpHref: "/help/trade-analyzer/mfe-mae", title: "Room after entry" }),
  "green-to-red": Object.freeze({ helpHref: "/help/trade-analyzer/green-to-red-analysis", title: "Giving back profit" }),
  "scaling-out": Object.freeze({ helpHref: "/help/trade-analyzer/day-trade-analysis", title: "Scaling out" }),
  "candle-patterns": Object.freeze({ helpHref: "/help/trade-analyzer/candle-patterns", title: "Candle patterns" }),
  trades: Object.freeze({ helpHref: "/help/trade-analyzer/analyzed-trades", title: "Your analyzed trades" }),
});

function todayInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function addDays(date: string, count: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function startOfWeek(date: string): string {
  const value = new Date(`${date}T12:00:00Z`);
  const daysFromMonday = (value.getUTCDay() + 6) % 7;
  return addDays(date, -daysFromMonday);
}

function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

function subtractMonths(date: string, count: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  const day = value.getUTCDate();
  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() - count);
  const lastDayOfTargetMonth = new Date(Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth() + 1,
    0,
  )).getUTCDate();
  value.setUTCDate(Math.min(day, lastDayOfTargetMonth));
  return value.toISOString().slice(0, 10);
}

function selectedDateRange(
  searchParams: Readonly<Record<string, string | string[] | undefined>>,
  timezone: string,
): OverviewDateRange {
  const kind = typeof searchParams.range === "string" ? searchParams.range : "all";
  const today = todayInTimezone(timezone);
  if (kind === "today") return { endDate: today, kind, startDate: today };
  if (kind === "this_week") return { endDate: today, kind, startDate: startOfWeek(today) };
  if (kind === "last_week") {
    const thisWeek = startOfWeek(today);
    return { endDate: addDays(thisWeek, -1), kind, startDate: addDays(thisWeek, -7) };
  }
  if (kind === "this_month") return { endDate: today, kind, startDate: startOfMonth(today) };
  if (kind === "last_month") {
    const previousMonthEnd = addDays(startOfMonth(today), -1);
    return { endDate: previousMonthEnd, kind, startDate: startOfMonth(previousMonthEnd) };
  }
  if (kind === "30d") return { endDate: today, kind, startDate: addDays(today, -29) };
  if (kind === "3m" || kind === "6m" || kind === "12m") {
    return { endDate: today, kind, startDate: subtractMonths(today, Number(kind.slice(0, -1))) };
  }
  if (kind === "ytd") return { endDate: today, kind: "ytd", startDate: `${today.slice(0, 4)}-01-01` };
  const start = typeof searchParams.start === "string" ? searchParams.start : "";
  const end = typeof searchParams.end === "string" ? searchParams.end : "";
  if (kind === "custom" && /^\d{4}-\d{2}-\d{2}$/u.test(start) && /^\d{4}-\d{2}-\d{2}$/u.test(end) && start <= end) {
    return { endDate: end, kind: "custom", startDate: start };
  }
  return { endDate: null, kind: "all", startDate: null };
}

function closingRange(value: OverviewDateRange): JournalAnalyticsClosingDateRange {
  return value.startDate && value.endDate
    ? Object.freeze({ endDate: value.endDate, kind: "inclusive_closing_date" as const, startDate: value.startDate })
    : Object.freeze({ kind: "all_available" as const });
}

function basisHref(
  baseHref: string,
  basis: "gross" | "net",
  searchParams: Readonly<Record<string, string | string[] | undefined>>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "basis") continue;
    if (typeof value === "string") params.set(key, value);
  }
  params.set("basis", basis);
  return `${baseHref}?${params.toString()}`;
}

export async function TradeAnalysisPage({
  baseHref,
  searchParams,
  view,
}: {
  baseHref: string;
  searchParams: Readonly<Record<string, string | string[] | undefined>>;
  view: TradeAnalysisView;
}) {
  const scope = await requireTraderLinkPlatformPageScope();
  const accountTimezone = withReadonlyPlatformDatabase({}, (database) => {
    const accountId = scope.activeAccountId;
    return accountId
      ? new JournalAccountRepository(database).findActiveAccount(scope.workspaceId, accountId)?.tradingTimezone
        ?? "America/New_York"
      : "America/New_York";
  });
  const dateRange = selectedDateRange(searchParams, accountTimezone);
  const details = VIEW_DETAILS[view];
  const moneyBasis = withReadonlyPlatformDatabase({}, (database) =>
    resolveJournalAnalyticsMoneyBasis(
      searchParams.basis,
      new PlatformUserPreferenceRepository(database).getActiveUserPnlReportingBasis(scope.userId),
    ));

  if (view === "trades") {
    const tradeIndex = await withJournalAnalyticsReportingDashboardRuntime(
      scope,
      ({ reportingContext }) => withReadonlyPlatformDatabase({}, (database) => {
        const availableCurrencies = readDailyTradeAnalysisCurrencies(database, scope);
        const currency = availableCurrencies.length > 0
          ? new PlatformUserPreferenceRepository(database)
              .getActiveUserReportingCurrency(scope.userId)
          : null;
        const page = currency === null ? null : reportDailyTradeAnalyzedTrades(
          readDailyTradeAnalyzedTrades(database, scope, {
            afterCursor: null,
            currency,
            endDate: dateRange.endDate,
            moneyBasis,
            pageSize: 25,
            startDate: dateRange.startDate,
            ticker: "",
          }),
          reportingContext,
        );
        return Object.freeze({ currency, page });
      }),
    );
    const offlineModel = createJournalAnalyzedTradesOfflineViewModel({
      currency: tradeIndex.currency,
      dateRange,
      moneyBasis,
      page: tradeIndex.page,
    });
    return (
      <>
      <OfflineSavedViewCapture
        accountTimezone={tradeIndex.page?.timezone ?? null}
        calculationVersion="daily-trade-analyzed-trades-v1"
        coverage={journalAnalyticsOfflineRouteCoverage("trade-analyzer-trades")}
        generatedAtUtc={new Date().toISOString()}
        model={offlineModel}
        pathname={baseHref}
        queryIdentity={`range:${dateRange.kind}:${dateRange.startDate ?? "all"}:${dateRange.endDate ?? "all"}:basis:${moneyBasis}`}
        reportingCurrency={tradeIndex.currency}
        routeViewVersion={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION}
        viewKey={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS["trade-analyzer-trades"]}
      />
      <DashboardPage>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Trade Analyzer</Typography>
            <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">{details.title}</Typography>
          </Box>
          <TradeAnalyzerHelpLink href={details.helpHref} label={details.title} size="medium" />
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
          <OverviewDateRangeControl href={baseHref} value={dateRange} />
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
            {(["gross", "net"] as const).map((basis) => (
              <Button href={basisHref(baseHref, basis, searchParams)} key={basis} size="small" variant={basis === moneyBasis ? "contained" : "outlined"}>
                {basis === "gross" ? "Gross" : "Net"}
              </Button>
            ))}
          </Stack>
        </Stack>
        <AnalyzedTradesIndex
          currency={tradeIndex.currency}
          endDate={dateRange.endDate}
          initialPage={tradeIndex.page}
          moneyBasis={moneyBasis}
          startDate={dateRange.startDate}
        />
      </DashboardPage>
      </>
    );
  }

  const result = await withJournalAnalyticsReportingDashboardRuntime(scope, ({
    reportingContext,
    reportingCurrency,
    service: analytics,
  }) => withReadonlyPlatformDatabase({}, (database) => {
    const overview = analytics.getAnalyticsOverview(scope, buildJournalAnalyticsDashboardQuery(scope, {
      closingDateRange: closingRange(dateRange),
      metricIds: ["included_count"],
      moneyBasis: "gross",
    }));
    const currencies = Object.freeze(overview.partitions.flatMap((partition) => partition.currency ? [partition.currency] : []));
    const currency = currencies.includes(reportingCurrency)
      ? reportingCurrency
      : currencies[0] ?? null;
    const rows = [];
    let cursor: string | null = null;
    let timezone = "America/New_York";
    if (currency !== null) do {
      const response = analytics.getRoundTripAnalyticsTable(scope, buildJournalAnalyticsDashboardQuery(scope, {
        afterCursor: cursor,
        closingDateRange: closingRange(dateRange),
        currency,
        metricIds: ["included_count"],
        moneyBasis,
        pageSize: 200,
      }));
      timezone = response.timezone;
      rows.push(...response.rows);
      cursor = response.continuationCursor;
    } while (cursor !== null);
    const multipliers = new Map(rows.flatMap((row) => {
      const sourceCurrency = reportingContext.sourceCurrencyByRoundTrip.get(row.roundTripId);
      const sourceDate = reportingContext.sourceDateByRoundTrip.get(row.roundTripId);
      return sourceCurrency && sourceDate
        ? [[row.roundTripId, journalReportingCurrencyMultiplier(
            sourceCurrency,
            sourceDate,
            reportingContext,
          )] as const]
        : [];
    }));
    return Object.freeze({
      generatedAtUtc: overview.generatedAtUtc,
      calculationVersion: overview.registryVersion,
      model: buildDailyTradeLongTermAnalytics(
        database,
        scope,
        Object.freeze(rows),
        moneyBasis,
        currency,
        timezone,
        multipliers,
      ),
    });
  }));
  const evidenceQuery = Object.freeze({
    currency: result.model.currency,
    direction: searchParams.direction === "short" && result.model.directionTradeCounts.short > 0
      ? "short" as const
      : result.model.directionTradeCounts.long > 0 ? "long" as const : "short" as const,
    endDate: dateRange.endDate,
    moneyBasis,
    rangeKind: dateRange.kind,
    startDate: dateRange.startDate,
  });
  const offlineModel = createJournalTradeAnalyzerOfflineViewModel({
    dateRange,
    evidenceQuery,
    model: result.model,
    view,
  });
  return (
    <>
    <OfflineSavedViewCapture
      accountTimezone={result.model.timezone}
      calculationVersion={`daily-trade-analysis-${result.calculationVersion}`}
      coverage={journalAnalyticsOfflineRouteCoverage(offlineModel.kind)}
      generatedAtUtc={result.generatedAtUtc}
      model={offlineModel}
      pathname={baseHref}
      queryIdentity={`range:${dateRange.kind}:${dateRange.startDate ?? "all"}:${dateRange.endDate ?? "all"}:basis:${moneyBasis}`}
      reportingCurrency={result.model.currency}
      routeViewVersion={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION}
      viewKey={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS[offlineModel.kind]}
    />
    <DashboardPage>
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Trade Analyzer</Typography>
          <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">{details.title}</Typography>
        </Box>
        <TradeAnalyzerHelpLink href={details.helpHref} label={details.title} size="medium" />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
        <OverviewDateRangeControl href={baseHref} value={dateRange} />
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
          {(["gross", "net"] as const).map((basis) => (
            <Button
              href={basisHref(baseHref, basis, searchParams)}
              key={basis}
              size="small"
              variant={basis === moneyBasis ? "contained" : "outlined"}
            >
              {basis === "gross" ? "Gross" : "Net"}
            </Button>
          ))}
        </Stack>
      </Stack>
      <TradeAnalysisClient
        evidenceQuery={evidenceQuery}
        model={result.model}
        view={view}
      />
    </DashboardPage>
    </>
  );
}
