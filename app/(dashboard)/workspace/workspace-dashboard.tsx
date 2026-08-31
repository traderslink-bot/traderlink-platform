"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
} from "../../dashboard-template";
import { InstallTradersLinkPwaCard } from "@/app/pwa/install-traderslink-pwa-card";
import { DemoDataCallout, DemoTradeTrackerInvitation } from "../demo-data-callout";
import type { FinancialOutcomeColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type { WorkspaceFirstTimeOnboardingResult } from "./workspace-first-time-onboarding-panel";
import { WorkspaceFirstTimeOnboardingPanel } from "./workspace-first-time-onboarding-panel";
import type { WorkspaceReviewSummary } from "./workspace-review-summary";
import type { WorkspaceTradeLibraryModel } from "./workspace-trade-library";
import { WorkspaceTradeLibrary } from "./workspace-trade-library-client";
import { formatJournalAnalyticsMoney } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";

export type WorkspaceMetric = Readonly<{
  label: string;
  value: string;
  valueColor?: FinancialOutcomeColor;
  caption: string;
}>;

type WorkspaceLiveTradeLibraryProps = Readonly<{
  accountCurrency: string;
  accountTimezone: string;
  expectedAccountSelectionRef: string;
  offlineScopeRef: string;
  trades: WorkspaceTradeLibraryModel;
}>;

type WorkspaceOfflineTradeLibraryProps = Readonly<{
  accountCurrency?: never;
  accountTimezone?: never;
  expectedAccountSelectionRef?: never;
  offlineScopeRef?: never;
  trades?: never;
}>;

type WorkspaceDashboardProps = Readonly<{
  analyticsMetrics?: readonly WorkspaceMetric[];
  demoAccountSelectionRef?: string;
  firstTimeMoomooConnectionPending?: boolean;
  firstTimeMoomooConnected?: boolean;
  firstTimeOnboardingResult?: WorkspaceFirstTimeOnboardingResult;
  hasRealAcceptedExecution?: boolean;
  offlineSavedAtUtc?: string;
  reviewSummary?: WorkspaceReviewSummary;
  showDemoTradeTrackerInvitation?: boolean;
}> & (WorkspaceLiveTradeLibraryProps | WorkspaceOfflineTradeLibraryProps);

const unavailableMetrics: readonly WorkspaceMetric[] = [
  { label: "P/L", value: "—", caption: "Completed trades" },
  { label: "Expectancy", value: "—", caption: "Per completed trade" },
  { label: "Win rate", value: "—", caption: "Completed round trips" },
  { label: "Profit factor", value: "—", caption: "Gross wins divided by losses" },
  { label: "Trades", value: "—", caption: "All available history" },
];

function hasLiveTradeLibraryProps(
  value: WorkspaceLiveTradeLibraryProps | WorkspaceOfflineTradeLibraryProps,
): value is WorkspaceLiveTradeLibraryProps {
  return typeof value.accountCurrency === "string" &&
    typeof value.accountTimezone === "string" &&
    typeof value.expectedAccountSelectionRef === "string" &&
    typeof value.offlineScopeRef === "string" &&
    value.trades !== undefined;
}

function savedViewTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Compares canonical Journal decimals without converting financial values to JS numbers. */
function compareWorkspaceDecimals(left: string, right: string): number {
  const leftNegative = left.startsWith("-");
  const rightNegative = right.startsWith("-");
  if (leftNegative !== rightNegative) return leftNegative ? -1 : 1;
  const unsigned = (value: string) => value.startsWith("-") ? value.slice(1) : value;
  const [leftWhole, leftFraction = ""] = unsigned(left).split(".");
  const [rightWhole, rightFraction = ""] = unsigned(right).split(".");
  let comparison = leftWhole.length === rightWhole.length
    ? leftWhole.localeCompare(rightWhole)
    : leftWhole.length - rightWhole.length;
  if (comparison === 0) {
    const width = Math.max(leftFraction.length, rightFraction.length);
    comparison = leftFraction.padEnd(width, "0").localeCompare(rightFraction.padEnd(width, "0"));
  }
  return leftNegative ? -comparison : comparison;
}

export function WorkspaceDashboard({
  analyticsMetrics,
  demoAccountSelectionRef,
  firstTimeMoomooConnectionPending,
  firstTimeMoomooConnected,
  firstTimeOnboardingResult,
  hasRealAcceptedExecution,
  offlineSavedAtUtc,
  reviewSummary: _reviewSummary,
  showDemoTradeTrackerInvitation,
  ...tradeLibraryProps
}: WorkspaceDashboardProps) {
  const metrics = analyticsMetrics ?? unavailableMetrics;
  if (showDemoTradeTrackerInvitation) {
    return <DashboardPage><DemoTradeTrackerInvitation hasRealAcceptedExecution={hasRealAcceptedExecution ?? false} /></DashboardPage>;
  }
  return (
    <DashboardPage>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
        <Typography component="h1" variant="h1">Workspace</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <DashboardDataScopeChip />
          {offlineSavedAtUtc ? <Chip color="primary" label={`Offline · Last updated ${savedViewTime(offlineSavedAtUtc)}`} size="small" variant="outlined" /> : null}
        </Stack>
      </Stack>
      {demoAccountSelectionRef ? <DemoDataCallout expectedAccountSelectionRef={demoAccountSelectionRef} variant="workspace" /> : null}
      {firstTimeOnboardingResult !== undefined ? <WorkspaceFirstTimeOnboardingPanel moomooConnected={firstTimeMoomooConnected ?? false} moomooConnectionPending={firstTimeMoomooConnectionPending ?? false} result={firstTimeOnboardingResult} /> : null}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", xl: "repeat(5, minmax(0, 1fr))" } }}>
        {metrics.map((metric) => <DashboardMetricCard hideCaption key={metric.label} {...metric} />)}
      </Box>
      {hasLiveTradeLibraryProps(tradeLibraryProps) ? (() => {
        const outcomes = tradeLibraryProps.trades.rows.filter((row) => row.netPnlDecimal !== null);
        const best = [...outcomes].sort((left, right) => compareWorkspaceDecimals(
          right.netPnlDecimal!,
          left.netPnlDecimal!,
        ))[0] ?? null;
        const worst = [...outcomes].sort((left, right) => compareWorkspaceDecimals(
          left.netPnlDecimal!,
          right.netPnlDecimal!,
        ))[0] ?? null;
        return best || worst ? <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {best ? <Card variant="outlined"><CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}><Typography color="text.secondary" variant="caption">Best trade</Typography><Typography sx={{ color: "success.main", fontWeight: 800 }} variant="body2">{best.symbol} · {formatJournalAnalyticsMoney(best.netPnlDecimal!, best.tradeCurrency, { showPositiveSign: true })}</Typography></CardContent></Card> : null}
          {worst ? <Card variant="outlined"><CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}><Typography color="text.secondary" variant="caption">Worst trade</Typography><Typography sx={{ color: "error.main", fontWeight: 800 }} variant="body2">{worst.symbol} · {formatJournalAnalyticsMoney(worst.netPnlDecimal!, worst.tradeCurrency, { showPositiveSign: true })}</Typography></CardContent></Card> : null}
        </Stack> : null;
      })() : null}
      <Box sx={{ maxWidth: 390 }}><InstallTradersLinkPwaCard /></Box>
      {hasLiveTradeLibraryProps(tradeLibraryProps) ? (
        <WorkspaceTradeLibrary {...tradeLibraryProps} />
      ) : null}
    </DashboardPage>
  );
}
