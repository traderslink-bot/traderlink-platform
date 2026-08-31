"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
} from "../../dashboard-template";
import { DemoDataCallout, DemoTradeTrackerInvitation } from "../demo-data-callout";
import type { FinancialOutcomeColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type { WorkspaceFirstTimeOnboardingResult } from "./workspace-first-time-onboarding-panel";
import { WorkspaceFirstTimeOnboardingPanel } from "./workspace-first-time-onboarding-panel";
import type { WorkspaceReviewSummary } from "./workspace-review-summary";
import type { WorkspaceTradeLibraryModel } from "./workspace-trade-library";
import { WorkspaceTradeLibrary } from "./workspace-trade-library-client";
import { WorkspaceMoreFiltersDrawer } from "./workspace-more-filters-drawer";
import { TradeTagCreationDrawer } from "../analytics/trade-explorer/trade-tag-creation-drawer";
import { openWorkspaceTradeDrawer } from "./workspace-trade-drawer-events";

export type WorkspaceMetric = Readonly<{
  label: string;
  value: string;
  valueColor?: FinancialOutcomeColor;
  caption: string;
}>;

type WorkspaceLiveTradeLibraryProps = Readonly<{
  accountCurrency: string;
  accountTimezone: string;
  customEndDate: string | null;
  customStartDate: string | null;
  expectedAccountSelectionRef: string;
  offlineScopeRef: string;
  periodEndDate: string | null;
  periodStartDate: string | null;
  trades: WorkspaceTradeLibraryModel;
}>;

type WorkspaceOfflineTradeLibraryProps = Readonly<{
  accountCurrency?: never;
  accountTimezone?: never;
  customEndDate?: never;
  customStartDate?: never;
  expectedAccountSelectionRef?: never;
  offlineScopeRef?: never;
  periodEndDate?: never;
  periodStartDate?: never;
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
  { label: "Best trade", value: "—", caption: "" },
  { label: "Worst trade", value: "—", caption: "" },
  { label: "Trades", value: "—", caption: "All available history" },
];

function hasLiveTradeLibraryProps(
  value: WorkspaceLiveTradeLibraryProps | WorkspaceOfflineTradeLibraryProps,
): value is WorkspaceLiveTradeLibraryProps {
  return typeof value.accountCurrency === "string" &&
    typeof value.accountTimezone === "string" &&
    (typeof value.customEndDate === "string" || value.customEndDate === null) &&
    (typeof value.customStartDate === "string" || value.customStartDate === null) &&
    typeof value.expectedAccountSelectionRef === "string" &&
    typeof value.offlineScopeRef === "string" &&
    (typeof value.periodEndDate === "string" || value.periodEndDate === null) &&
    (typeof value.periodStartDate === "string" || value.periodStartDate === null) &&
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
  const [tagCreationOpen, setTagCreationOpen] = useState(false);
  const multipleTradeSave = searchParams.get("tradeSave") === "multiple";
  const hasActiveTableFilters = hasLiveTradeLibraryProps(tradeLibraryProps) && (
    Boolean(tradeLibraryProps.trades.query.searchTicker) || tradeLibraryProps.trades.query.filter !== "all" ||
    Boolean(tradeLibraryProps.customStartDate) || Boolean(tradeLibraryProps.customEndDate) ||
    tradeLibraryProps.trades.query.sort !== "newest" || tradeLibraryProps.trades.query.group !== "none"
  );
  const activeFilterCount = hasLiveTradeLibraryProps(tradeLibraryProps)
    ? Number(Boolean(tradeLibraryProps.trades.query.searchTicker)) + Number(tradeLibraryProps.trades.query.filter !== "all") +
      Number(Boolean(tradeLibraryProps.customStartDate)) + Number(Boolean(tradeLibraryProps.customEndDate)) +
      Number(tradeLibraryProps.trades.query.sort !== "newest") + Number(tradeLibraryProps.trades.query.group !== "none")
    : 0;
  const metrics = analyticsMetrics ?? unavailableMetrics;
  if (showDemoTradeTrackerInvitation) {
    return <DashboardPage><DemoTradeTrackerInvitation hasRealAcceptedExecution={hasRealAcceptedExecution ?? false} /></DashboardPage>;
  }
  return (
    <DashboardPage>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          {hasLiveTradeLibraryProps(tradeLibraryProps) ? (
            ([
              ["today", "Today"],
              ["week", "This week"],
              ["month", "This month"],
              ["all", "All time"],
            ] as const).map(([value, label]) => (
              <Button key={value} onClick={() => { const next = new URLSearchParams(searchParams.toString()); if (value === "all") next.delete("period"); else next.set("period", value); next.delete("startDate"); next.delete("endDate"); router.push(next.size === 0 ? "/workspace" : `/workspace?${next.toString()}`); }} variant={period === value ? "contained" : "text"}>
                {label}
              </Button>
            ))
          ) : null}
          {hasLiveTradeLibraryProps(tradeLibraryProps) ? <Button onClick={() => setFiltersOpen(true)}>More filters{activeFilterCount ? ` (${activeFilterCount})` : ""}</Button> : null}
          {hasActiveTableFilters ? <Button onClick={() => { const next = new URLSearchParams(searchParams.toString()); ["endDate", "filter", "group", "searchTicker", "sort", "startDate"].forEach((key) => next.delete(key)); router.push(next.size === 0 ? "/workspace" : `/workspace?${next.toString()}`); }}>Clear filters</Button> : null}
          <DashboardDataScopeChip />
          {offlineSavedAtUtc ? <Chip color="primary" label={`Offline · Last updated ${savedViewTime(offlineSavedAtUtc)}`} size="small" variant="outlined" /> : null}
        </Stack>
        {hasLiveTradeLibraryProps(tradeLibraryProps) ? <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: { xs: "flex-end", md: "flex-start" } }}><Button onClick={openWorkspaceTradeDrawer} variant="contained">+ Trade</Button><Button onClick={() => router.push("/rules")} variant="outlined">+ Rules</Button><Button onClick={() => setTagCreationOpen(true)} variant="outlined">+ Tags</Button></Stack> : null}
      </Stack>
      {demoAccountSelectionRef ? <DemoDataCallout expectedAccountSelectionRef={demoAccountSelectionRef} variant="workspace" /> : null}
      {multipleTradeSave ? <Alert onClose={() => { const next = new URLSearchParams(searchParams.toString()); next.delete("tradeSave"); router.replace(next.size === 0 ? "/workspace" : `/workspace?${next.toString()}`); }} severity="success" sx={{ mt: 1.5 }}>Trade saved. Multiple trades were updated. Select a trade to review it. Next time, use Day Trade Tracker when entering executions for multiple trades. <Link href="/trade-tracker">Open Day Trade Tracker</Link></Alert> : null}
      {firstTimeOnboardingResult !== undefined ? <WorkspaceFirstTimeOnboardingPanel moomooConnected={firstTimeMoomooConnected ?? false} moomooConnectionPending={firstTimeMoomooConnectionPending ?? false} result={firstTimeOnboardingResult} /> : null}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" } }}>
        {metrics.map((metric) => <DashboardMetricCard hideCaption key={metric.label} {...metric} />)}
      </Box>
      {hasLiveTradeLibraryProps(tradeLibraryProps) ? (
        <>
          <WorkspaceTradeLibrary {...tradeLibraryProps} addTradeOpen={false} onAddTradeClose={() => undefined} />
          <WorkspaceMoreFiltersDrawer customEndDate={tradeLibraryProps.customEndDate} customStartDate={tradeLibraryProps.customStartDate} onClose={() => setFiltersOpen(false)} open={filtersOpen} query={tradeLibraryProps.trades.query} />
          <TradeTagCreationDrawer expectedAccountSelectionRef={tradeLibraryProps.expectedAccountSelectionRef} onClose={() => setTagCreationOpen(false)} open={tagCreationOpen} />
        </>
      ) : null}
    </DashboardPage>
  );
}
