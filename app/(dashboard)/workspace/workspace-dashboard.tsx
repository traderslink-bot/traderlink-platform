"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../dashboard-template";
import type { JournalCalendarReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import type { WorkspaceReportingSummary } from "@/src/modules/platform/server/reporting/workspace-reporting-summary";
import { DismissibleDataDecisionNotice } from "../../dismissible-data-decision-notice";
import type { WorkspaceReviewSummary } from "./workspace-review-summary";

export type WorkspaceMetric = Readonly<{
  label: string;
  value: string;
  caption: string;
}>;

const unavailableMetrics: readonly WorkspaceMetric[] = [
  {
    label: "Net realized P/L",
    value: "—",
    caption: "Completed trades",
  },
  {
    label: "Gross P/L",
    value: "—",
    caption: "Before trading costs",
  },
  {
    label: "Expectancy",
    value: "—",
    caption: "Per completed trade",
  },
  {
    label: "Win rate",
    value: "—",
    caption: "Completed round trips",
  },
  {
    label: "Profit factor",
    value: "—",
    caption: "Gross wins ÷ losses",
  },
  {
    label: "Round trips",
    value: "—",
    caption: "Selected period",
  },
];

function calendarMoney(value: string | null, currency: string | null): string {
  if (value === null || currency === null) return "N/A";
  const formatted = formatJournalAnalyticsDecimal(value, 2, true);
  return formatted.startsWith("-") ? `-$${formatted.slice(1)}` : `+$${formatted}`;
}

function calendarDate(value: string): string {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
  });
}

function reportingMoney(value: string, currency: string): string {
  const formatted = formatJournalAnalyticsDecimal(value, 2, true);
  return formatted.startsWith("-")
    ? `-${currency} ${formatted.slice(1)}`
    : `${currency} ${formatted}`;
}

function ruleOutcomeColor(status: "followed" | "broken"): "success" | "error" {
  return status === "followed" ? "success" : "error";
}

function ruleOutcomeLabel(input: Readonly<{
  ruleTitle: string;
  status: "followed" | "broken";
}>): string {
  return `${input.ruleTitle} · ${input.status === "followed" ? "Followed" : "Broken"}`;
}

export function WorkspaceDashboard({
  accountSelectionRef,
  analyticsCoverage,
  analyticsMetrics,
  calendarData,
  decisionNoticeRef,
  reportingSummary,
  reviewSummary,
}: {
  accountSelectionRef?: string;
  analyticsCoverage?: Readonly<{
    readyClosedCount: number;
    legitimateOpenCount: number;
    needsDecisionCount: number;
    feeCompleteCount: number;
    feeIncompleteCount: number;
  }>;
  analyticsMetrics?: readonly WorkspaceMetric[];
  calendarData?: JournalCalendarReadModel;
  decisionNoticeRef?: string | null;
  reportingSummary?: WorkspaceReportingSummary;
  reviewSummary?: WorkspaceReviewSummary;
}) {
  const metrics = analyticsMetrics ?? unavailableMetrics;
  const recentTradingDays = calendarData?.days
    .filter((day) => day.tradeCount > 0)
    .slice(-7) ?? [];
  return (
    <DashboardPage>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <DashboardDataScopeChip />
        <Button
          disabled
          startIcon={<DateRangeRoundedIcon />}
          variant="outlined"
        >
          All available history
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            xl: "repeat(6, minmax(0, 1fr))",
          },
        }}
      >
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} {...metric} />
        ))}
      </Box>

      {analyticsCoverage && analyticsCoverage.needsDecisionCount > 0 &&
      accountSelectionRef && decisionNoticeRef ? (
        <DismissibleDataDecisionNotice
          accountSelectionRef={accountSelectionRef}
          evidenceRef={decisionNoticeRef}
          surface="workspace"
        >
          {analyticsCoverage.readyClosedCount} closed round trips are available.
          {` ${analyticsCoverage.legitimateOpenCount} positions are classified as open.`}
        </DismissibleDataDecisionNotice>
      ) : analyticsCoverage ? (
        <Alert severity="success">
          {analyticsCoverage.readyClosedCount} closed round trips are available.
          {` ${analyticsCoverage.legitimateOpenCount} positions are classified as open.`}
        </Alert>
      ) : null}

      {reportingSummary ? (
        <DashboardPanel title="Reporting equivalent">
          {reportingSummary.status === "native_usd" ? (
            <Typography color="text.secondary" variant="body2">
              You are viewing your original USD Trade Tracker amounts. Choose another currency in Account Settings to see a daily reporting equivalent here.
            </Typography>
          ) : reportingSummary.status === "ready" && reportingSummary.convertedNetPnlDecimal !== null ? (
            <Stack spacing={0.5}>
              <Typography sx={{ fontWeight: 850 }} variant="h2">
                {reportingMoney(
                  reportingSummary.convertedNetPnlDecimal,
                  reportingSummary.reportingCurrency,
                )}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Net realized P/L reporting equivalent from {reportingSummary.convertedTradingDayCount} USD trading day{reportingSummary.convertedTradingDayCount === 1 ? "" : "s"}, using Bank of Canada daily indicative rates.
              </Typography>
              <Typography color="text.secondary" variant="caption">
                Your original USD Trade Tracker amounts remain authoritative.
              </Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary" variant="body2">
              A {reportingSummary.reportingCurrency} reporting equivalent is not available for all {reportingSummary.tradingDayCount} USD trading day{reportingSummary.tradingDayCount === 1 ? "" : "s"}. Your original USD Trade Tracker amounts remain visible and unchanged.
            </Typography>
          )}
        </DashboardPanel>
      ) : null}

      {reviewSummary?.currentFocuses || reviewSummary?.focusRules.length ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              lg: "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          {reviewSummary.currentFocuses ? (
            <DashboardPanel title="Current Focuses">
              <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }} variant="body2">
                {reviewSummary.currentFocuses}
              </Typography>
            </DashboardPanel>
          ) : null}

          {reviewSummary.focusRules.length > 0 ? (
            <DashboardPanel title="Focus rules">
              <Stack
                spacing={1.25}
                sx={{ "& > :not(:first-of-type)": { borderColor: "divider", borderTop: 1, pt: 1.25 } }}
              >
                {reviewSummary.focusRules.map((rule) => (
                  <Box key={rule.ruleId}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 800 }}>{rule.title}</Typography>
                      <Chip label={rule.reviewScope} size="small" variant="outlined" />
                    </Stack>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                      {rule.statement}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </DashboardPanel>
          ) : null}
        </Box>
      ) : null}

      {reviewSummary?.previousReview ? (
        <DashboardPanel
          action={(
            <Button href={`/trade-tracker/${encodeURIComponent(reviewSummary.previousReview.date)}`} size="small">
              Open Daily Trade Tracker
            </Button>
          )}
          title="Previous trading-day review"
        >
          <Stack spacing={1.25}>
            <Box>
              <Typography sx={{ fontWeight: 850 }}>{reviewSummary.previousReview.date}</Typography>
              <Typography color="text.secondary" variant="body2">
                {reviewSummary.previousReview.tradeCount} completed trade{reviewSummary.previousReview.tradeCount === 1 ? "" : "s"}
                {" · "}{calendarMoney(
                  reviewSummary.previousReview.netPnlDecimal,
                  reviewSummary.previousReview.currency,
                )}
              </Typography>
            </Box>

            {reviewSummary.previousReview.dayRuleOutcomes.length > 0 ? (
              <Box>
                <Typography color="text.secondary" variant="caption">Day rules</Typography>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mt: 0.5 }}>
                  {reviewSummary.previousReview.dayRuleOutcomes.map((outcome) => (
                    <Chip
                      color={ruleOutcomeColor(outcome.status)}
                      key={`${outcome.ruleId}-${outcome.status}`}
                      label={ruleOutcomeLabel(outcome)}
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>
            ) : null}

            {reviewSummary.previousReview.trades.map((trade) => (
              <Box
                key={trade.roundTripId}
                sx={{ borderColor: "divider", borderTop: 1, pt: 1.25 }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={0.5}
                  sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
                >
                  <Typography sx={{ fontWeight: 800 }}>
                    {trade.symbol} <Box component="span" sx={{ color: "text.secondary", fontWeight: 500, textTransform: "capitalize" }}>{trade.direction}</Box>
                  </Typography>
                  <Typography
                    color={trade.netPnlDecimal === null
                      ? "text.secondary"
                      : trade.netPnlDecimal.startsWith("-") ? "error.main" : "success.main"}
                    sx={{ fontWeight: 800 }}
                    variant="body2"
                  >
                    {calendarMoney(trade.netPnlDecimal, reviewSummary.previousReview.currency)}
                  </Typography>
                </Stack>
                {trade.ruleOutcomes.length > 0 ? (
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mt: 0.75 }}>
                    {trade.ruleOutcomes.map((outcome) => (
                      <Chip
                        color={ruleOutcomeColor(outcome.status)}
                        key={`${outcome.ruleId}-${outcome.status}`}
                        label={ruleOutcomeLabel(outcome)}
                        size="small"
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
                    No followed or broken rules recorded for this trade.
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </DashboardPanel>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            lg: "minmax(0, 2fr) minmax(300px, 0.8fr)",
          },
        }}
      >
        <DashboardPanel
          action={
            <Button
              endIcon={<ArrowForwardRoundedIcon />}
              href="/analytics/performance"
              size="small"
            >
              Performance details
            </Button>
          }
          eyebrow="Account performance"
          title="Performance over time"
        >
          {analyticsMetrics ? (
            <Stack spacing={1}>
              <Typography color="success.main" sx={{ fontWeight: 700 }}>
                Trade Tracker analytics are connected.
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Open Performance details for exact daily, drawdown, streak,
                outlier, and period packets.
              </Typography>
            </Stack>
          ) : (
            <DashboardUnavailableState
              actionHref="/imports"
              actionLabel="Import trades"
              description="Performance will appear when the selected account period has complete, verified execution authority. No legacy or estimated values are substituted."
            />
          )}
        </DashboardPanel>

        <Card sx={{ height: "100%" }}>
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              p: { xs: 2, sm: 2.5 },
              "&:last-child": { pb: { xs: 2, sm: 2.5 } },
            }}
          >
            <Typography color="primary.main" sx={{ fontWeight: 700 }} variant="caption">
              Quick action
            </Typography>
            <Typography component="h2" variant="h2">
              Add a manual trade
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
              Enter the ticker, side, execution date and time, quantity, price,
              and trading costs in the complete manual-entry form.
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <Button
                href="/manual-entry"
                startIcon={<AddRoundedIcon />}
                variant="contained"
              >
                Open manual entry
              </Button>
              <Button
                href="/imports"
                startIcon={<FileUploadRoundedIcon />}
                variant="outlined"
              >
                Import a statement
              </Button>
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            <Divider sx={{ my: 2 }} />
            <Typography color="text.secondary" variant="caption">
              Account and owner scope are assigned securely by the server.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <DashboardPanel
        action={
          <ButtonGroup aria-label="Day session view" size="small">
            <Button variant="contained">Calendar</Button>
            <Button href="/trade-tracker" variant="outlined">
              List
            </Button>
          </ButtonGroup>
        }
        eyebrow="Day sessions"
        title="Trading calendar"
      >
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Button disabled size="small">
              Previous
            </Button>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <CalendarMonthRoundedIcon color="primary" fontSize="small" />
              <Typography sx={{ fontWeight: 700 }}>Available trading history</Typography>
            </Stack>
            <Button disabled size="small">
              Next
            </Button>
          </Stack>
          {recentTradingDays.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(4, minmax(0, 1fr))",
                  xl: "repeat(7, minmax(0, 1fr))",
                },
              }}
            >
              {recentTradingDays.map((day) => (
                <Box
                  key={day.date}
                  sx={{
                    backgroundColor: day.pnlSign === -1
                      ? "rgba(216, 91, 106, 0.07)"
                      : day.pnlSign === 1
                        ? "rgba(67, 184, 131, 0.075)"
                        : "background.paper",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1.5,
                    p: 1.5,
                  }}
                >
                  <Typography color="text.secondary" variant="caption">
                    {calendarDate(day.date)}
                  </Typography>
                  <Typography
                    color={day.pnlSign === -1 ? "error.main" : "success.main"}
                    sx={{ fontWeight: 850, mt: 0.5 }}
                    variant="body2"
                  >
                    {calendarMoney(day.pnlDecimal, calendarData?.currency ?? null)}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {day.tradeCount} completed trade{day.tradeCount === 1 ? "" : "s"}
                  </Typography>
                  <Button href={`/trade-tracker/${day.date}`} size="small" sx={{ mt: 1 }}>
                    Review day
                  </Button>
                </Box>
              ))}
            </Box>
          ) : (
            <DashboardUnavailableState
              actionHref="/imports"
              actionLabel="Add trading history"
              compact
              description="Trading days appear here after the selected Trade Tracker account has a confirmed completed trade. Open positions and decisions remain visible in their own workflows."
              title="No completed trading days available"
            />
          )}
        </Stack>
      </DashboardPanel>
    </DashboardPage>
  );
}
