"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
} from "../../dashboard-template";
import { InstallTradersLinkPwaMethods } from "@/app/pwa/install-traderslink-pwa-card";
import { DemoDataCallout, DemoTradeTrackerInvitation } from "../demo-data-callout";
import type { FinancialOutcomeColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type { WorkspaceFirstTimeOnboardingResult } from "./workspace-first-time-onboarding-panel";
import { WorkspaceFirstTimeOnboardingPanel } from "./workspace-first-time-onboarding-panel";
import type { WorkspaceReviewSummary } from "./workspace-review-summary";
import type { WorkspaceTradeLibraryModel } from "./workspace-trade-library";
import { WorkspaceTradeLibrary } from "./workspace-trade-library-client";
import { WorkspaceMoreFiltersDrawer } from "./workspace-more-filters-drawer";

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
  period?: "today" | "week" | "month" | "all";
  reviewSummary?: WorkspaceReviewSummary;
  showDemoTradeTrackerInvitation?: boolean;
}> & (WorkspaceLiveTradeLibraryProps | WorkspaceOfflineTradeLibraryProps);

const unavailableMetrics: readonly WorkspaceMetric[] = [
  { label: "P/L", value: "—", caption: "Completed trades" },
  { label: "Win rate", value: "—", caption: "Completed round trips" },
  { label: "Trades", value: "—", caption: "All available history" },
  { label: "Largest win", value: "—", caption: "" },
  { label: "Largest loss", value: "—", caption: "" },
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
  period = "all",
  reviewSummary: _reviewSummary,
  showDemoTradeTrackerInvitation,
  ...tradeLibraryProps
}: WorkspaceDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addTradeOpen, setAddTradeOpen] = useState(false);
  const metrics = analyticsMetrics ?? unavailableMetrics;
  if (showDemoTradeTrackerInvitation) {
    return <DashboardPage><DemoTradeTrackerInvitation hasRealAcceptedExecution={hasRealAcceptedExecution ?? false} /></DashboardPage>;
  }
  return (
    <DashboardPage>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {hasLiveTradeLibraryProps(tradeLibraryProps) ? <Button onClick={() => setAddTradeOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Add trade</Button> : null}
          {hasLiveTradeLibraryProps(tradeLibraryProps) ? ([[
            "today", "Today",
          ], ["week", "This week"], ["month", "This month"], ["all", "All time"]] as const).map(([value, label]) => <Button key={value} onClick={() => { const next = new URLSearchParams(searchParams.toString()); if (value === "all") next.delete("period"); else next.set("period", value); next.delete("startDate"); next.delete("endDate"); router.push(next.size === 0 ? "/workspace" : `/workspace?${next.toString()}`); }} variant={period === value ? "contained" : "text"}>{label}</Button>)}
          : null}
          {hasLiveTradeLibraryProps(tradeLibraryProps) ? <Button onClick={() => setFiltersOpen(true)}>More filters</Button> : null}
          <InstallTradersLinkPwaMethods />
          <DashboardDataScopeChip />
          {offlineSavedAtUtc ? <Chip color="primary" label={`Offline · Last updated ${savedViewTime(offlineSavedAtUtc)}`} size="small" variant="outlined" /> : null}
      </Stack>
      {demoAccountSelectionRef ? <DemoDataCallout expectedAccountSelectionRef={demoAccountSelectionRef} variant="workspace" /> : null}
      {firstTimeOnboardingResult !== undefined ? <WorkspaceFirstTimeOnboardingPanel moomooConnected={firstTimeMoomooConnected ?? false} moomooConnectionPending={firstTimeMoomooConnectionPending ?? false} result={firstTimeOnboardingResult} /> : null}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
        {metrics.map((metric) => <DashboardMetricCard hideCaption key={metric.label} {...metric} />)}
      </Box>
      {hasLiveTradeLibraryProps(tradeLibraryProps) ? (
        <>
          <WorkspaceTradeLibrary {...tradeLibraryProps} addTradeOpen={addTradeOpen} onAddTradeClose={() => setAddTradeOpen(false)} />
          <WorkspaceMoreFiltersDrawer onClose={() => setFiltersOpen(false)} open={filtersOpen} query={tradeLibraryProps.trades.query} />
        </>
      ) : null}
    </DashboardPage>
  );
}
