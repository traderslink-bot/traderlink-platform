"use client";

import Alert from "@mui/material/Alert";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import EditNoteIcon from "@mui/icons-material/EditNote";
import GavelIcon from "@mui/icons-material/Gavel";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
  DashboardSecondaryAction,
} from "../../dashboard-template";
import { DemoDataCallout, DemoTradeTrackerInvitation } from "../demo-data-callout";
import type { FinancialOutcomeColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type { WorkspaceFirstTimeOnboardingResult } from "./workspace-first-time-onboarding-panel";
import { WorkspaceFirstTimeOnboardingPanel } from "./workspace-first-time-onboarding-panel";
import type { WorkspaceReviewSummary } from "./workspace-review-summary";
import type { WorkspaceTradeLibraryModel } from "./workspace-trade-library";
import { WorkspaceTradeLibrary } from "./workspace-trade-library-client";
import { WorkspaceMoreFiltersDrawer } from "./workspace-more-filters-drawer";
import { openWorkspaceTradeDrawer } from "./workspace-trade-drawer-events";
import { DashboardChartAction, DashboardChartPanelSlot, DashboardChartProvider } from "../dashboard-chart-tool";
import { JournalNotesDrawer, type JournalNotesDrawerInitialView } from "../notes/journal-notes-drawer";

const WorkspaceCalendarPanel = dynamic(
  () => import("./workspace-calendar-panel").then((module) => module.WorkspaceCalendarPanel),
  { ssr: false },
);
const WorkspaceRulesPanel = dynamic(
  () => import("./workspace-rules-panel").then((module) => module.WorkspaceRulesPanel),
  { ssr: false },
);
const WorkspaceNewsScannerCard = dynamic(
  () => import("./workspace-news-scanner-card").then((module) => module.WorkspaceNewsScannerCard),
  { ssr: false },
);
const WorkspaceNewsScannerPanel = dynamic(
  () => import("./workspace-news-scanner-panel").then((module) => module.WorkspaceNewsScannerPanel),
  { ssr: false },
);

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
  newsScannerAvailable?: boolean;
  offlineSavedAtUtc?: string;
  period?: "today" | "week" | "month" | "all";
  ruleResultsCard?: Readonly<{ brokenRuleCount: number; recentBrokenRuleTitles: readonly string[] }>;
  ruleResultsCardPreference?: Readonly<{ revision: number | null; showInWorkspace: boolean }>;
  reviewSummary?: WorkspaceReviewSummary;
  showDemoTradeTrackerInvitation?: boolean;
}> & (WorkspaceLiveTradeLibraryProps | WorkspaceOfflineTradeLibraryProps);

const unavailableMetrics: readonly WorkspaceMetric[] = [
  { label: "P/L", value: "—", caption: "Completed trades" },
  { label: "Win rate", value: "—", caption: "Completed round trips" },
  { label: "Best trade", value: "—", caption: "" },
  { label: "Worst trade", value: "—", caption: "" },
  { label: "Closed trades", value: "—", caption: "All available history" },
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

function sessionDateInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

function CurrentFocusContent({ content }: Readonly<{ content: string }>) {
  return <Box sx={{
    flex: 1,
    height: "100%",
    maxHeight: "100%",
    minHeight: 0,
    overflowY: "auto",
    pr: 0.5,
    scrollbarWidth: "thin",
    scrollbarColor: (theme) => theme.palette.mode === "dark"
      ? `${theme.palette.primary.main} ${theme.palette.action.selected}`
      : `${theme.palette.primary.dark} ${theme.palette.action.hover}`,
    "&::-webkit-scrollbar": { width: 6 },
    "&::-webkit-scrollbar-track": {
      backgroundColor: (theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : theme.palette.action.hover,
      borderRadius: 999,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: (theme) => theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.dark,
      borderRadius: 999,
    },
    "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "primary.main" },
  }}>
    <Typography color="text.secondary" sx={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }} variant="body2">
      {content}
    </Typography>
  </Box>;
}

export function WorkspaceDashboard({
  analyticsMetrics,
  demoAccountSelectionRef,
  firstTimeMoomooConnectionPending,
  firstTimeMoomooConnected,
  firstTimeOnboardingResult,
  hasRealAcceptedExecution,
  newsScannerAvailable = false,
  offlineSavedAtUtc,
  period = "all",
  ruleResultsCard,
  ruleResultsCardPreference,
  reviewSummary,
  showDemoTradeTrackerInvitation,
  ...tradeLibraryProps
}: WorkspaceDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sessionNotesOpen, setSessionNotesOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [newsScannerOpen, setNewsScannerOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesAccountSelectionRef, setRulesAccountSelectionRef] = useState<string | null>(null);
  const [rulesInitialView, setRulesInitialView] = useState<"custom" | "presets" | "results" | "rules">("rules");
  const [showRuleResultsCard, setShowRuleResultsCard] = useState(ruleResultsCardPreference?.showInWorkspace ?? false);
  const [sessionNotesInitialView, setSessionNotesInitialView] = useState<JournalNotesDrawerInitialView>("add");
  const activeAccountSelectionRef = hasLiveTradeLibraryProps(tradeLibraryProps)
    ? tradeLibraryProps.expectedAccountSelectionRef
    : null;
  const openRules = (view: "custom" | "presets" | "results" | "rules") => {
    if (!activeAccountSelectionRef) return;
    setRulesInitialView(view);
    setRulesAccountSelectionRef(activeAccountSelectionRef);
    setRulesOpen(true);
  };
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
  const summaryCurrentFocuses = reviewSummary?.currentFocuses?.trim() || null;
  const [currentFocuses, setCurrentFocuses] = useState(summaryCurrentFocuses);
  useEffect(() => { setCurrentFocuses(summaryCurrentFocuses); }, [summaryCurrentFocuses]);
  useEffect(() => { setShowRuleResultsCard(ruleResultsCardPreference?.showInWorkspace ?? false); }, [ruleResultsCardPreference?.showInWorkspace]);
  useEffect(() => { setRulesOpen(false); setRulesAccountSelectionRef(null); }, [activeAccountSelectionRef]);
  if (showDemoTradeTrackerInvitation) {
    return <DashboardPage><DemoTradeTrackerInvitation hasRealAcceptedExecution={hasRealAcceptedExecution ?? false} /></DashboardPage>;
  }
  return (
    <DashboardChartProvider>
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
        {hasLiveTradeLibraryProps(tradeLibraryProps) ? <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: { xs: "flex-end", md: "flex-start" } }}>
          <Button onClick={openWorkspaceTradeDrawer} variant="contained">Add Trade</Button>
          <Button onClick={() => openRules("rules")} startIcon={<GavelIcon />} variant="outlined">Rules</Button>
          <Tooltip title="Session Review"><DashboardSecondaryAction onClick={() => { setSessionNotesInitialView("add"); setSessionNotesOpen(true); }} startIcon={<EditNoteIcon />}>Sessions</DashboardSecondaryAction></Tooltip>
          <Tooltip title="Current Focuses"><DashboardSecondaryAction onClick={() => { setSessionNotesInitialView("focuses"); setSessionNotesOpen(true); }} startIcon={<VisibilityIcon />}>Focuses</DashboardSecondaryAction></Tooltip>
          <DashboardSecondaryAction onClick={() => setCalendarOpen(true)} startIcon={<CalendarMonthIcon />}>Calendar</DashboardSecondaryAction>
          <DashboardChartAction />
        </Stack> : null}
      </Stack>
      {hasLiveTradeLibraryProps(tradeLibraryProps) && calendarOpen ? <WorkspaceCalendarPanel onClose={() => setCalendarOpen(false)} /> : hasLiveTradeLibraryProps(tradeLibraryProps) && newsScannerOpen ? <WorkspaceNewsScannerPanel onClose={() => setNewsScannerOpen(false)} /> : <>
      {demoAccountSelectionRef ? <DemoDataCallout expectedAccountSelectionRef={demoAccountSelectionRef} variant="workspace" /> : null}
      {multipleTradeSave ? <Alert onClose={() => { const next = new URLSearchParams(searchParams.toString()); next.delete("tradeSave"); router.replace(next.size === 0 ? "/workspace" : `/workspace?${next.toString()}`); }} severity="success" sx={{ mt: 1.5 }}>Trade saved. Multiple trades were updated. Select a trade to review it. Next time, use Day Trade Tracker when entering executions for multiple trades. <Typography color="primary" component={Link} href="/trade-tracker" sx={{ fontWeight: 800, textDecoration: "underline" }} variant="inherit">Open Day Trade Tracker</Typography></Alert> : null}
      {firstTimeOnboardingResult !== undefined ? <WorkspaceFirstTimeOnboardingPanel moomooConnected={firstTimeMoomooConnected ?? false} moomooConnectionPending={firstTimeMoomooConnectionPending ?? false} result={firstTimeOnboardingResult} /> : null}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" } }}>
        {metrics.map((metric) => <DashboardMetricCard hideCaption key={metric.label} {...metric} />)}
      </Box>
      {hasLiveTradeLibraryProps(tradeLibraryProps) && (currentFocuses || (showRuleResultsCard && ruleResultsCard) || newsScannerAvailable) ? <Box sx={{
        "& .MuiButton-root": { fontSize: "0.7rem", minWidth: 0, px: 0.5 },
        "& h2": { fontSize: "1rem", lineHeight: 1.25 },
        "& [data-traderlink-platform-dashboard-card='panel'] > .MuiCardContent-root": {
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: { xs: 1.5, sm: 1.25 },
          "&:last-child": { pb: { xs: 1.5, sm: 1.25 } },
        },
        "& [data-traderlink-platform-dashboard-card='panel'] > .MuiCardContent-root > .MuiBox-root:last-child": {
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
          mt: 1,
        },
        display: "grid",
        gap: 1.5,
        gridAutoRows: { xs: "minmax(220px, auto)", sm: 220 },
        gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" },
        mt: 1.5,
      }}>{currentFocuses ? <DashboardPanel title="Current Focuses">
        <CurrentFocusContent content={currentFocuses} />
      </DashboardPanel> : null}{showRuleResultsCard && ruleResultsCard ? <DashboardPanel action={<Typography sx={{ fontSize: "1.25rem", fontWeight: 750, lineHeight: 1 }}>{ruleResultsCard.brokenRuleCount}</Typography>} title="Rules broken">
        <Stack spacing={0.75} sx={{ height: "100%", minHeight: 0 }}>
          <Typography color="text.secondary" sx={{ fontWeight: 700 }} variant="caption">Recent broken rules</Typography>
          {ruleResultsCard.recentBrokenRuleTitles.length ? <Stack spacing={0.5} sx={{ minWidth: 0 }}>{ruleResultsCard.recentBrokenRuleTitles.map((title) => <Typography key={title} color="text.secondary" noWrap title={title} variant="body2">{title}</Typography>)}</Stack> : <Typography color="text.secondary" variant="body2">No broken rules in this period.</Typography>}
          <Box sx={{ mt: "auto" }}><Button onClick={() => openRules("results")} size="small">View results</Button></Box>
        </Stack>
      </DashboardPanel> : null}{newsScannerAvailable ? <WorkspaceNewsScannerCard onViewMore={() => setNewsScannerOpen(true)} /> : null}</Box> : null}
      <DashboardChartPanelSlot />
      {hasLiveTradeLibraryProps(tradeLibraryProps) ? (
        <>
          <Box sx={{ color: (theme) => theme.palette.mode === "dark" ? theme.palette.text.primary : undefined }}>
            <WorkspaceTradeLibrary {...tradeLibraryProps} addTradeOpen={false} onAddTradeClose={() => undefined} />
          </Box>
          <WorkspaceMoreFiltersDrawer customEndDate={tradeLibraryProps.customEndDate} customStartDate={tradeLibraryProps.customStartDate} onClose={() => setFiltersOpen(false)} open={filtersOpen} query={tradeLibraryProps.trades.query} />
          <JournalNotesDrawer expectedAccountSelectionRef={tradeLibraryProps.expectedAccountSelectionRef} focusOnly={sessionNotesInitialView === "focuses"} initialView={sessionNotesInitialView} key={sessionNotesInitialView} launch={{ kind: "session", sessionDate: sessionDateInTimezone(tradeLibraryProps.accountTimezone) }} onClose={() => setSessionNotesOpen(false)} onFocusSaved={(focus) => setCurrentFocuses(focus.showInWorkspace && focus.focusText.trim() ? focus.focusText.trim() : null)} open={sessionNotesOpen} />
          {rulesOpen && rulesAccountSelectionRef === activeAccountSelectionRef ? <WorkspaceRulesPanel initialView={rulesInitialView} key={rulesInitialView} onClose={() => setRulesOpen(false)} onPreferenceSaved={(preference) => { setShowRuleResultsCard(preference.showInWorkspace); router.refresh(); }} /> : null}
        </>
      ) : null}
      </>}
      </DashboardPage>
    </DashboardChartProvider>
  );
}
