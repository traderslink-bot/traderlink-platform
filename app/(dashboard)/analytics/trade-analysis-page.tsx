import "server-only";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardPage } from "@/app/dashboard-template";
import type { JournalAnalyticsClosingDateRange } from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalAnalyticsService } from "@/src/modules/journal-analytics/server/analytics-service";
import { buildJournalAnalyticsDashboardQuery } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import {
  buildDailyTradeLongTermAnalytics,
  readDailyTradeAnalysisCurrencies,
} from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

import { OverviewDateRangeControl, type OverviewDateRange } from "./overview-date-range-control";
import { AnalyzedTradesIndex } from "./analyzed-trades-index";
import { TradeAnalysisClient, type TradeAnalysisView } from "./trade-analysis-client";
import { TradeAnalyzerHelpLink } from "./trade-analyzer-help-link";

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

function currencyHref(
  baseHref: string,
  currency: string,
  searchParams: Readonly<Record<string, string | string[] | undefined>>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "currency") continue;
    if (typeof value === "string") params.set(key, value);
  }
  params.set("currency", currency);
  return `${baseHref}?${params.toString()}`;
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
  const requestedCurrency = typeof searchParams.currency === "string" ? searchParams.currency.toUpperCase() : null;
  const moneyBasis = searchParams.basis === "net" ? "net" as const : "gross" as const;
  const details = VIEW_DETAILS[view];

  if (view === "trades") {
    const tradeIndex = withReadonlyPlatformDatabase({}, (database) => {
      const availableCurrencies = readDailyTradeAnalysisCurrencies(database, scope);
      return Object.freeze({
        availableCurrencies,
        currency: requestedCurrency && availableCurrencies.includes(requestedCurrency)
          ? requestedCurrency
          : availableCurrencies[0] ?? null,
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
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
          <OverviewDateRangeControl href={baseHref} value={dateRange} />
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
            {(["gross", "net"] as const).map((basis) => (
              <Button href={basisHref(baseHref, basis, searchParams)} key={basis} size="small" variant={basis === moneyBasis ? "contained" : "outlined"}>
                {basis === "gross" ? "Gross" : "Net"}
              </Button>
            ))}
            {tradeIndex.availableCurrencies.length > 1 ? tradeIndex.availableCurrencies.map((currency) => (
              <Button href={currencyHref(baseHref, currency, searchParams)} key={currency} size="small" variant={currency === tradeIndex.currency ? "contained" : "outlined"}>
                {currency}
              </Button>
            )) : null}
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

  const result = withReadonlyPlatformDatabase({}, (database) => {
    const facts = new JournalAnalyticsFactSetService(new JournalAnalyticsFactSetRepository(database));
    const analytics = new JournalAnalyticsService(facts);
    const overview = analytics.getAnalyticsOverview(scope, buildJournalAnalyticsDashboardQuery(scope, {
      closingDateRange: closingRange(dateRange),
      metricIds: ["included_count"],
      moneyBasis: "gross",
    }));
    const currencies = Object.freeze(overview.partitions.flatMap((partition) => partition.currency ? [partition.currency] : []));
    const analyzedCurrencies = readDailyTradeAnalysisCurrencies(database, scope);
    const currency = requestedCurrency && currencies.includes(requestedCurrency)
      ? requestedCurrency
      : analyzedCurrencies.find((value) => currencies.includes(value)) ?? currencies[0] ?? null;
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
    return Object.freeze({
      availableCurrencies: currencies,
      model: buildDailyTradeLongTermAnalytics(database, scope, Object.freeze(rows), moneyBasis, currency, timezone),
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
          {result.availableCurrencies.length > 1 ? (
            <>
            {result.availableCurrencies.map((currency) => (
              <Button
                href={currencyHref(baseHref, currency, searchParams)}
                key={currency}
                size="small"
                variant={currency === result.model.currency ? "contained" : "outlined"}
              >
                {currency}
              </Button>
            ))}
            </>
          ) : null}
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
        view={view}
      />
    </DashboardPage>
  );
}
