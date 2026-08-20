"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
  DashboardUnavailableState,
} from "../../dashboard-template";
import type { JournalCalendarReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import { formatJournalAnalyticsMoney } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
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
  if (value === null || currency === null) return "Unavailable";
  return formatJournalAnalyticsMoney(value, currency, { showPositiveSign: true });
}

function calendarDate(value: string): string {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
  });
}

function savedViewTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ruleOutcomeColor(status: "followed" | "broken"): "success" | "error" {
  return status === "followed" ? "success" : "error";
}

function CurrentFocusContent({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = content.trim().length > 500;

  return (
    <>
      <Typography
        color="text.secondary"
        sx={{
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
          ...(needsToggle && !expanded
            ? {
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 8,
              display: "-webkit-box",
              overflow: "hidden",
            }
            : {}),
        }}
        variant="body2"
      >
        {content}
      </Typography>
      {needsToggle ? (
        <Button onClick={() => setExpanded((current) => !current)} size="small" sx={{ mt: 0.75 }}>
          {expanded ? "Show less" : "View more"}
        </Button>
      ) : null}
    </>
  );
}

function ruleOutcomeLabel(input: Readonly<{
  ruleTitle: string;
  status: "followed" | "broken";
}>): string {
  return `${input.ruleTitle} · ${input.status === "followed" ? "Followed" : "Broken"}`;
}

export function WorkspaceDashboard({
  analyticsMetrics,
  calendarData,
  offlineSavedAtUtc,
  reviewSummary,
}: {
  analyticsMetrics?: readonly WorkspaceMetric[];
  calendarData?: JournalCalendarReadModel;
  offlineSavedAtUtc?: string;
  reviewSummary?: WorkspaceReviewSummary;
}) {
  const metrics = analyticsMetrics ?? unavailableMetrics;
  const currentFocuses = reviewSummary?.currentFocuses?.trim() || null;
  const focusRules = reviewSummary?.focusRules.filter((rule) =>
    rule.title.trim().length > 0 || rule.statement.trim().length > 0,
  ) ?? [];
  const previousReview = reviewSummary?.previousReview ?? null;
  const hasPreviousReviewContent = previousReview !== null && (
    previousReview.trades.length > 0 || previousReview.dayRuleOutcomes.length > 0
  );
  const recentTradingDays = calendarData?.days
    .filter((day) => day.tradeCount > 0)
    .slice(-7) ?? [];
  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">Workspace</Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
          <DashboardDataScopeChip />
          {offlineSavedAtUtc ? (
            <Chip
              color="primary"
              label={`Offline · Last updated ${savedViewTime(offlineSavedAtUtc)}`}
              size="small"
              variant="outlined"
            />
          ) : null}
        </Stack>
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
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            xl: "repeat(6, minmax(0, 1fr))",
          },
        }}
      >
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} {...metric} />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {currentFocuses ? (
          <DashboardPanel title="Current Focuses">
            <CurrentFocusContent content={currentFocuses} />
          </DashboardPanel>
        ) : null}

        {focusRules.length > 0 ? (
          <DashboardPanel title="Focus Rules">
            <Stack
              spacing={1.25}
              sx={{ "& > :not(:first-of-type)": { borderColor: "divider", borderTop: 1, pt: 1.25 } }}
            >
              {focusRules.map((rule) => (
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

        <DashboardPanel title="Add Trades">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {offlineSavedAtUtc ? (
              <DashboardPrimaryAction disabled>Import trades</DashboardPrimaryAction>
            ) : (
              <DashboardPrimaryAction href="/imports">Import trades</DashboardPrimaryAction>
            )}
            <DashboardSecondaryAction href="/quick-trade-entry">Quick trade entry</DashboardSecondaryAction>
          </Stack>
          {offlineSavedAtUtc ? (
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
              Reconnect to import trades. Quick Trade Entry remains available offline.
            </Typography>
          ) : null}
        </DashboardPanel>
      </Box>

      {previousReview && hasPreviousReviewContent ? (
        <DashboardPanel
          action={(
            <Button href={`/trade-tracker/${encodeURIComponent(previousReview.date)}`} size="small">
              Open Daily Trade Tracker
            </Button>
          )}
          title="Previous trading-day review"
        >
          <Stack spacing={1.25}>
            <Box>
              <Typography sx={{ fontWeight: 850 }}>{previousReview.date}</Typography>
              <Typography color="text.secondary" variant="body2">
                {previousReview.tradeCount} completed trade{previousReview.tradeCount === 1 ? "" : "s"}
                {" · "}{calendarMoney(
                  previousReview.netPnlDecimal,
                  previousReview.currency,
                )}
              </Typography>
            </Box>

            {previousReview.dayRuleOutcomes.length > 0 ? (
              <Box>
                <Typography color="text.secondary" variant="caption">Day rules</Typography>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mt: 0.5 }}>
                  {previousReview.dayRuleOutcomes.map((outcome) => (
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

            {previousReview.trades.map((trade) => (
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
                    {calendarMoney(trade.netPnlDecimal, previousReview.currency)}
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
              href="/analytics/trade-explorer"
              size="small"
            >
              Explore performance
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
                Compare daily P/L, drawdown, recovery, giveback, and other
                available performance groupings.
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
        title="Trading Calendar"
      >
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between" }}
          >
            <Button disabled size="small" sx={{ order: { xs: 2, sm: 1 } }}>
              Previous
            </Button>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", justifyContent: "center", order: { xs: 1, sm: 2 } }}
            >
              <CalendarMonthRoundedIcon color="primary" fontSize="small" />
              <Typography sx={{ fontWeight: 700 }}>Available trading history</Typography>
            </Stack>
            <Button disabled size="small" sx={{ order: 3 }}>
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
