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
  if (value === null || currency === null) return "P/L unavailable";
  const prefix = value.startsWith("-") ? "" : "+";
  return `${currency} ${prefix}${formatJournalAnalyticsDecimal(value)}`;
}

function calendarDate(value: string): string {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
  });
}

export function WorkspaceDashboard({
  analyticsCoverage,
  analyticsMetrics,
  calendarData,
}: {
  analyticsCoverage?: Readonly<{
    readyClosedCount: number;
    legitimateOpenCount: number;
    needsDecisionCount: number;
    feeCompleteCount: number;
    feeIncompleteCount: number;
  }>;
  analyticsMetrics?: readonly WorkspaceMetric[];
  calendarData?: JournalCalendarReadModel;
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

      {analyticsCoverage ? (
        <Alert
          action={analyticsCoverage.needsDecisionCount > 0 ? (
            <Button color="inherit" href="/data-decisions" size="small">
              Review Data Decisions
            </Button>
          ) : undefined}
          severity={analyticsCoverage.needsDecisionCount > 0 ? "warning" : "success"}
        >
          {analyticsCoverage.readyClosedCount} closed round trips are available.
          {` ${analyticsCoverage.legitimateOpenCount} positions are classified as open.`}
          {` ${analyticsCoverage.needsDecisionCount} items need a trader decision.`}
          {` Fees are complete for ${analyticsCoverage.feeCompleteCount} included trades`}
          {analyticsCoverage.feeIncompleteCount > 0
            ? ` and incomplete for ${analyticsCoverage.feeIncompleteCount}.`
            : "."}
        </Alert>
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
                Replacement Journal analytics are connected.
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
              Enter the symbol, side, execution date and time, quantity, price,
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
              description="Trading days appear here after the selected Journal account has a confirmed completed trade. Open positions and decisions remain visible in their own workflows."
              title="No completed trading days available"
            />
          )}
        </Stack>
      </DashboardPanel>
    </DashboardPage>
  );
}
