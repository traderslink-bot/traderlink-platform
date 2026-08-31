"use client";

import Box from "@mui/material/Box";
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
        {metrics.map((metric) => <DashboardMetricCard key={metric.label} {...metric} />)}
      </Box>
      <Box sx={{ maxWidth: 390 }}><InstallTradersLinkPwaCard /></Box>
      {hasLiveTradeLibraryProps(tradeLibraryProps) ? (
        <WorkspaceTradeLibrary {...tradeLibraryProps} />
      ) : null}
    </DashboardPage>
  );
}
