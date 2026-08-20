import "server-only";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardPage } from "@/app/dashboard-template";
import type { JournalAnalyticsClosingDateRange } from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import {
  buildJournalAnalyticsDashboardQuery,
  withJournalAnalyticsReportingDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { journalReportingCurrencyMultiplier } from "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";
import {
  buildDailyTradeLongTermAnalytics,
  readDailyTradeAnalysisCurrencies,
} from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";
import { readMoomooMarketDataAccess } from "@/src/modules/level-analysis/server/moomoo-market-data-access";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";

import { OverviewDateRangeControl, type OverviewDateRange } from "./overview-date-range-control";
import { AnalyzedTradesIndex } from "./analyzed-trades-index";
import { TradeAnalysisClient, type TradeAnalysisView } from "./trade-analysis-client";
import { TradeAnalyzerHelpLink } from "./trade-analyzer-help-link";
import { MoomooMarketDataConnectionPrompt } from "../moomoo-market-data-connection-prompt";

const VIEW_DETAILS: Readonly<Record<TradeAnalysisView, Readonly<{
  helpHref: string;
  title: string;
}>>> = Object.freeze({
  day: Object.freeze({ helpHref: "/help/trade-analyzer/day-trade-analysis", title: "Day Trade Analysis" }),
  "entry-exit": Object.freeze({ helpHref: "/help/trade-analyzer/entry-exit-analysis", title: "Entry & Exit" }),
  "mfe-mae": Object.freeze({ helpHref: "/help/trade-analyzer/mfe-mae", title: "MFE & MAE" }),
  "green-to-red": Object.freeze({ helpHref: "/help/trade-analyzer/green-to-red-analysis", title: "Green-to-Red" }),
  "candle-patterns": Object.freeze({ helpHref: "/help/trade-analyzer/candle-patterns", title: "Candle Patterns" }),
  trades: Object.freeze({ helpHref: "/help/trade-analyzer/analyzed-trades", title: "Analyzed Trades" }),
});

function easternToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function subtractMonths(date: string, count: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() - count);
  return value.toISOString().slice(0, 10);
}

function selectedDateRange(searchParams: Readonly<Record<string, string | string[] | undefined>>): OverviewDateRange {
  const kind = typeof searchParams.range === "string" ? searchParams.range : "all";
  const today = easternToday();
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
  const dateRange = selectedDateRange(searchParams);
  const moneyBasis = searchParams.basis === "net" ? "net" as const : "gross" as const;
  const details = VIEW_DETAILS[view];
  const moomooMarketDataAccess = withReadonlyPlatformDatabase({}, (database) =>
    readMoomooMarketDataAccess(database, scope));

  if (view === "trades") {
    const tradeIndex = withReadonlyPlatformDatabase({}, (database) => {
      const availableCurrencies = readDailyTradeAnalysisCurrencies(database, scope);
      return Object.freeze({
        currency: availableCurrencies.length > 0
          ? new PlatformUserPreferenceRepository(database)
              .getActiveUserReportingCurrency(scope.userId)
          : null,
      });
    });
    return (
      <DashboardPage>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Trade Analyzer</Typography>
            <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">{details.title}</Typography>
          </Box>
          <TradeAnalyzerHelpLink href={details.helpHref} label={details.title} size="medium" />
        </Stack>
        {moomooMarketDataAccess.shouldShowConnectionGuidance ? <MoomooMarketDataConnectionPrompt surface="analyzer" /> : null}
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
          moneyBasis={moneyBasis}
          startDate={dateRange.startDate}
        />
      </DashboardPage>
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
  return (
    <DashboardPage>
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Trade Analyzer</Typography>
          <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">{details.title}</Typography>
        </Box>
        <TradeAnalyzerHelpLink href={details.helpHref} label={details.title} size="medium" />
      </Stack>
      {moomooMarketDataAccess.shouldShowConnectionGuidance ? <MoomooMarketDataConnectionPrompt surface="analyzer" /> : null}
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
        evidenceQuery={{
          currency: result.model.currency,
          endDate: dateRange.endDate,
          moneyBasis,
          startDate: dateRange.startDate,
        }}
        model={result.model}
        showMoomooConnectionGuidance={moomooMarketDataAccess.shouldShowConnectionGuidance}
        view={view}
      />
    </DashboardPage>
  );
}
