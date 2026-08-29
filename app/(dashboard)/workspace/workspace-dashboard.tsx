"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
  DashboardSecondaryAction,
  DashboardUnavailableState,
} from "../../dashboard-template";
import { InstallTradersLinkPwaCard } from "@/app/pwa/install-traderslink-pwa-card";
import { DemoDataCallout, DemoTradeTrackerInvitation } from "../demo-data-callout";
import type { JournalCalendarReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import { formatJournalAnalyticsMoney } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import type { WorkspaceReviewSummary } from "./workspace-review-summary";
import { CalendarWeekView } from "../calendar/calendar-client";
import {
  WorkspaceFirstTimeOnboardingPanel,
  type WorkspaceFirstTimeOnboardingResult,
} from "./workspace-first-time-onboarding-panel";

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
    label: "Trades",
    value: "—",
    caption: "Selected period",
  },
];

function calendarMoney(value: string | null, currency: string | null): string {
  if (value === null || currency === null) return "Unavailable";
  return formatJournalAnalyticsMoney(value, currency, { showPositiveSign: true });
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
  demoAccountSelectionRef,
  showDemoTradeTrackerInvitation,
  firstTimeMoomooConnectionPending,
  firstTimeMoomooConnected,
  firstTimeOnboardingResult,
  hasRealAcceptedExecution,
  offlineSavedAtUtc,
  reviewSummary,
}: {
  analyticsMetrics?: readonly WorkspaceMetric[];
  calendarData?: JournalCalendarReadModel;
  demoAccountSelectionRef?: string;
  firstTimeMoomooConnectionPending?: boolean;
  firstTimeMoomooConnected?: boolean;
  firstTimeOnboardingResult?: WorkspaceFirstTimeOnboardingResult;
  hasRealAcceptedExecution?: boolean;
  offlineSavedAtUtc?: string;
  reviewSummary?: WorkspaceReviewSummary;
  showDemoTradeTrackerInvitation?: boolean;
}) {
  const router = useRouter();
  const metrics = analyticsMetrics ?? unavailableMetrics;
  const currentFocuses = reviewSummary?.currentFocuses?.trim() || null;
  const focusRules = reviewSummary?.focusRules.filter((rule) =>
    rule.title.trim().length > 0 || rule.statement.trim().length > 0,
  ) ?? [];
  const previousReview = reviewSummary?.previousReview ?? null;
  const hasPreviousReviewContent = previousReview !== null && (
    previousReview.trades.length > 0 || previousReview.dayRuleOutcomes.length > 0
  );
  const workspaceCalendarDays = calendarData?.days.map((day) => ({
    ...day,
    hasDailyTracker: day.tradeCount > 0,
  })) ?? [];
  if (showDemoTradeTrackerInvitation) {
    return (
      <DashboardPage>
        <DemoTradeTrackerInvitation
          hasRealAcceptedExecution={hasRealAcceptedExecution ?? false}
        />
      </DashboardPage>
    );
  }
  const openWorkspacePath = (pathname: string) => {
    if (offlineSavedAtUtc) {
      window.location.assign(pathname);
      return;
    }
    router.push(pathname);
  };
  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">Welcome to TradersLink Beta App.</Typography>
      {demoAccountSelectionRef ? (
        <DemoDataCallout expectedAccountSelectionRef={demoAccountSelectionRef} variant="workspace" />
      ) : null}
      <Stack spacing={1.25} sx={{ maxWidth: 920 }}>
        <Typography color="text.secondary" variant="body2">
          TradersLink Platform is currently in beta testing, so you may come across a few bugs or unfinished details as the app continues to improve. Feedback and bug reports are always welcome—they directly help make the platform better for traders. If you need help, support is available with quick responses.
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Use TradersLink Platform to track trades, review your performance, and spot patterns in your own decisions. Start with the Trade Tracker for manual entries and use the Trade Analyzer to better understand your entries, exits, profit taking, and risk management. Import broker statements to see the bigger picture across your trading history. The more accurate your records, the more useful your Journal becomes.
        </Typography>
        <Typography color="text.secondary" variant="body2">
          You can also use trader tools such as Press Release Alerts, the News Scanner, and Halt Alerts to stay informed about market-moving news and trading halts.
        </Typography>
      </Stack>
      {firstTimeOnboardingResult !== undefined ? (
        <WorkspaceFirstTimeOnboardingPanel
          moomooConnectionPending={firstTimeMoomooConnectionPending ?? false}
          moomooConnected={firstTimeMoomooConnected ?? false}
          result={firstTimeOnboardingResult}
        />
      ) : null}
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
        <InstallTradersLinkPwaCard />

        {currentFocuses ? (
          <DashboardPanel title="Current Focuses">
            <CurrentFocusContent content={currentFocuses} />
          </DashboardPanel>
        ) : null}

        {focusRules.length > 0 ? (
          <DashboardPanel title="Focus Rules">
            <Stack
              spacing={1.5}
            >
              {focusRules.map((rule, index) => (
                <Box
                  key={rule.ruleId}
                  sx={{
                    borderColor: "divider",
                    borderTop: index === 0 ? 0 : 1,
                    minWidth: 0,
                    pt: index === 0 ? 0 : 1.5,
                    width: "100%",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", flexWrap: "wrap" }}
                    useFlexGap
                  >
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
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            <DashboardSecondaryAction href="/trade-tracker" sx={{ justifyContent: "flex-start" }}>
              Daily Trades
            </DashboardSecondaryAction>
            <DashboardSecondaryAction href="/trade-tracker/swings" sx={{ justifyContent: "flex-start" }}>
              Swing Trades
            </DashboardSecondaryAction>
            <DashboardSecondaryAction href="/quick-trade-entry" sx={{ justifyContent: "flex-start" }}>
              Quick Trade Entry
            </DashboardSecondaryAction>
            {offlineSavedAtUtc ? (
              <DashboardSecondaryAction disabled sx={{ justifyContent: "flex-start" }}>
                Import Statements
              </DashboardSecondaryAction>
            ) : (
              <DashboardSecondaryAction href="/imports" sx={{ justifyContent: "flex-start" }}>
                Import Statements
              </DashboardSecondaryAction>
            )}
          </Box>
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
                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{ flexWrap: "wrap", mt: 0.5 }}
                  useFlexGap
                >
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
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ flexWrap: "wrap", mt: 0.75 }}
                    useFlexGap
                  >
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

      <DashboardPanel
        action={
          <Button endIcon={<ArrowForwardRoundedIcon />} href="/calendar" size="small">
            View full calendar
          </Button>
        }
        eyebrow="Day sessions"
        title="Trading Calendar"
      >
          {calendarData && workspaceCalendarDays.length > 0 ? (
            <CalendarWeekView
              activeDate={calendarData.activeDate}
              currency={calendarData.currency}
              days={workspaceCalendarDays}
              onSelect={(day) => openWorkspacePath(`/trade-tracker/${day.date}`)}
              onTickerClick={(day) => openWorkspacePath(`/calendar?view=week&week=${day.date}`)}
              selectedDate={calendarData.activeDate}
              showReviewStatus={false}
            />
          ) : (
            <DashboardUnavailableState
              actionHref="/imports"
              actionLabel="Add trading history"
              compact
              description="Trading days appear here after the selected Trade Tracker account has a confirmed completed trade. Open positions and decisions remain visible in their own workflows."
              title="No completed trading days available"
            />
          )}
      </DashboardPanel>
    </DashboardPage>
  );
}
