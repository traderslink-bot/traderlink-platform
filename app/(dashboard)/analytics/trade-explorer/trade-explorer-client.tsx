"use client";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Collapse,
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Fragment, useMemo, useRef, useState, useTransition } from "react";

import type {
  JournalAnalyticsGroupResult,
  JournalAnalyticsMetricResult,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMetric,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../../dashboard-template";
import type {
  AnalyticsLabPlatformPreview,
  AnalyticsLabPlatformQuery,
} from "../lab/analytics-lab-platform-types";

import { runTradeExplorer } from "./actions";
import type { TradeExplorerPageModel } from "./trade-explorer-service";

type ExplorerGroup = Readonly<{
  id: string;
  label: string;
  group: JournalAnalyticsGroupResult;
}>;

type ExplorerResultView = "trades" | "days" | "tickers" | "entry_times" | "holding_time" | "position_size" | "periods";

type ExplorerGroupColumn = Readonly<{
  label: string;
  metricId: string;
  kind?: "metric" | "day_path";
}>;

type TradeExecution = Readonly<{
  executed_at_utc: string;
  price_decimal: string | null;
  quantity_decimal: string;
  round_trip_id: string;
  side: "buy" | "sell";
}>;

type TradeExecutionDetails = Readonly<{
  executions: readonly TradeExecution[];
  roundTripId: string;
}>;

type ExplorerViewDefinition = Readonly<{
  label: string;
  firstColumnLabel: string;
  grouping: AnalyticsLabPlatformQuery["grouping"];
  defaultSortMetricId: string;
  columns: readonly ExplorerGroupColumn[];
}>;

const RESULT_VIEWS: Readonly<Record<Exclude<ExplorerResultView, "trades">, ExplorerViewDefinition>> = Object.freeze({
  days: Object.freeze({
    label: "Trading Days",
    firstColumnLabel: "Date",
    grouping: "closing_day",
    defaultSortMetricId: "net_pnl",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Wins", metricId: "win_count" },
      { label: "Losses", metricId: "loss_count" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Day movement", metricId: "red_to_green_day_count", kind: "day_path" },
    ]),
  }),
  tickers: Object.freeze({
    label: "Tickers",
    firstColumnLabel: "Ticker",
    grouping: "instrument",
    defaultSortMetricId: "net_pnl",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Wins", metricId: "win_count" },
      { label: "Losses", metricId: "loss_count" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Average P/L", metricId: "average_pnl" },
      { label: "Average hold", metricId: "average_holding_time" },
      { label: "Average shares", metricId: "average_share_quantity" },
      { label: "Average entry amount", metricId: "average_entry_notional" },
    ]),
  }),
  entry_times: Object.freeze({
    label: "Entry Times",
    firstColumnLabel: "Entry time",
    grouping: "entry_time_bucket",
    defaultSortMetricId: "net_pnl",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Average P/L", metricId: "average_pnl" },
      { label: "Average hold", metricId: "average_holding_time" },
      { label: "Average shares", metricId: "average_share_quantity" },
    ]),
  }),
  holding_time: Object.freeze({
    label: "Holding Time",
    firstColumnLabel: "Holding range",
    grouping: "holding_duration_bucket",
    defaultSortMetricId: "net_pnl",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Average P/L", metricId: "average_pnl" },
      { label: "Average hold", metricId: "average_holding_time" },
      { label: "Average shares", metricId: "average_share_quantity" },
    ]),
  }),
  position_size: Object.freeze({
    label: "Position Size",
    firstColumnLabel: "Maximum shares",
    grouping: "maximum_position_bucket",
    defaultSortMetricId: "net_pnl",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Average P/L", metricId: "average_pnl" },
      { label: "Average shares", metricId: "average_share_quantity" },
      { label: "Average entry amount", metricId: "average_entry_notional" },
      { label: "Average hold", metricId: "average_holding_time" },
    ]),
  }),
  periods: Object.freeze({
    label: "Periods",
    firstColumnLabel: "Period",
    grouping: "closing_month",
    defaultSortMetricId: "net_pnl",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Wins", metricId: "win_count" },
      { label: "Losses", metricId: "loss_count" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Average P/L", metricId: "average_pnl" },
      { label: "Best trade", metricId: "best_trade" },
      { label: "Worst trade", metricId: "worst_trade" },
    ]),
  }),
});

const TRADE_STATISTIC_GROUPS = Object.freeze([
  Object.freeze({ label: "P/L and results", metricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "best_trade", "worst_trade", "profit_factor", "expectancy", "return_on_entry_notional"]) }),
  Object.freeze({ label: "Wins and losses", metricIds: Object.freeze(["win_count", "loss_count", "flat_count", "win_rate", "loss_rate", "flat_rate", "average_winning_trade", "average_losing_trade", "average_win_loss_ratio"]) }),
  Object.freeze({ label: "Holding time", metricIds: Object.freeze(["average_holding_time", "median_holding_time", "minimum_holding_time", "maximum_holding_time", "average_winner_holding_time", "average_loser_holding_time"]) }),
  Object.freeze({ label: "Shares and entry amount", metricIds: Object.freeze(["average_share_quantity", "median_share_quantity", "maximum_share_quantity", "average_entry_notional", "median_entry_notional", "maximum_entry_notional"]) }),
  Object.freeze({ label: "Trade prices", metricIds: Object.freeze(["average_entry_price", "average_exit_price"]) }),
] as const);

const DAY_STATISTIC_GROUPS = Object.freeze([
  Object.freeze({ label: "Trading-day results", metricIds: Object.freeze(["profitable_trading_day_count", "losing_trading_day_count", "flat_trading_day_count", "average_daily_pnl", "median_daily_pnl", "best_trading_day", "worst_trading_day"]) }),
  Object.freeze({ label: "Daily movement", metricIds: Object.freeze(["red_to_green_day_count", "green_to_red_day_count", "maximum_intraday_realized_drawdown", "maximum_intraday_realized_recovery_from_trough", "maximum_peak_profit_giveback", "average_peak_profit_giveback"]) }),
] as const);

function explorerMetricLabel(metricId: string, title: string): string {
  if (metricId.includes("entry_notional")) return title.replaceAll("Entry Notional", "Entry Amount").replaceAll("entry notional", "entry amount");
  return title;
}

function tradeOutcomeForStatistic(metricId: string): "win" | "loss" | "flat" | null {
  if (metricId === "flat_count") return "flat";
  if (metricId === "win_count" || metricId.includes("winning_trade") || metricId.includes("winner_")) return "win";
  if (metricId === "loss_count" || metricId.includes("losing_trade") || metricId.includes("loser_")) return "loss";
  return null;
}

function dayStatisticIsSubset(metricId: string): boolean {
  return [
    "profitable_trading_day_count",
    "losing_trading_day_count",
    "flat_trading_day_count",
    "red_to_green_day_count",
    "green_to_red_day_count",
  ].includes(metricId);
}

function SelectField({
  children,
  label,
  onChange,
  value,
}: Readonly<{
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}>) {
  const id = `trade-explorer-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <FormControl fullWidth size="small">
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select label={label} labelId={`${id}-label`} onChange={(event) => onChange(event.target.value)} value={value}>
        {children}
      </Select>
    </FormControl>
  );
}

function metric(group: JournalAnalyticsGroupResult | null, metricId: string): JournalAnalyticsMetricResult | null {
  return group?.metrics.find((candidate) => candidate.metricId === metricId) ?? null;
}

function value(group: JournalAnalyticsGroupResult | null, metricId: string): string {
  const result = metric(group, metricId);
  return result?.state === "unavailable" || result?.state === "empty"
    ? "N/A"
    : result ? formatJournalAnalyticsMetric(result) : "N/A";
}

function metricSortValue(group: JournalAnalyticsGroupResult, metricId: string): number | null {
  const exactValue = metric(group, metricId)?.value;
  if (!exactValue) return null;
  const numeric = exactValue.kind === "integer"
    ? exactValue.value
    : exactValue.kind === "decimal"
      ? Number(exactValue.valueDecimal)
      : exactValue.kind === "rational"
        ? Number(exactValue.roundedDecimal)
        : exactValue.kind === "duration"
          ? exactValue.milliseconds
          : Number.NaN;
  return Number.isFinite(numeric) ? numeric : null;
}

function dayMovement(group: JournalAnalyticsGroupResult): string {
  const redToGreen = value(group, "red_to_green_day_count") === "1";
  const greenToRed = value(group, "green_to_red_day_count") === "1";
  if (redToGreen && greenToRed) return "Red → green and green → red";
  if (redToGreen) return "Red → green";
  if (greenToRed) return "Green → red";
  return "Neither";
}

function money(valueDecimal: string | null): string {
  if (valueDecimal === null) return "N/A";
  const formatted = formatJournalAnalyticsDecimal(valueDecimal, 2, true);
  return formatted.startsWith("-") ? `-$${formatted.slice(1)}` : `$${formatted}`;
}

function holdingTime(milliseconds: number): string {
  if (milliseconds < 60_000) return `${Math.round(milliseconds / 1_000)} sec`;
  if (milliseconds < 3_600_000) return `${Math.round(milliseconds / 60_000)} min`;
  return `${formatJournalAnalyticsDecimal(String(milliseconds / 3_600_000))} hr`;
}

function executionTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function exactField(
  label: string,
  value: string | null,
  onChange: (value: string | null) => void,
) {
  return (
    <TextField
      fullWidth
      inputMode="decimal"
      label={label}
      onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)}
      size="small"
      value={value ?? ""}
    />
  );
}

export default function TradeExplorerClient({ model }: Readonly<{ model: TradeExplorerPageModel }>) {
  const [query, setQuery] = useState(model.initialQuery);
  const [preview, setPreview] = useState<AnalyticsLabPlatformPreview>(model.initialPreview);
  const [resultView, setResultView] = useState<ExplorerResultView>("trades");
  const [sortMetricId, setSortMetricId] = useState("net_pnl");
  const [sortDirection, setSortDirection] = useState<"descending" | "ascending">("descending");
  const [pageCursors, setPageCursors] = useState<readonly (string | null)[]>(Object.freeze([null]));
  const [pageIndex, setPageIndex] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoundTripId, setExpandedRoundTripId] = useState<string | null>(null);
  const [expandedExecutions, setExpandedExecutions] = useState<readonly TradeExecution[]>(Object.freeze([]));
  const [executionDetailsStatus, setExecutionDetailsStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const executionRequestRef = useRef(0);
  const [isPending, startTransition] = useTransition();
  const patch = <K extends keyof AnalyticsLabPlatformQuery>(key: K, next: AnalyticsLabPlatformQuery[K]) =>
    setQuery((current) => Object.freeze({ ...current, [key]: next }));
  const groups = useMemo<readonly ExplorerGroup[]>(() => preview.response.partitions.flatMap((partition) =>
    partition.groups.map((group) => Object.freeze({
      id: `${partition.currency ?? "none"}:${group.groupKey}`,
      label: group.label,
      group,
    }))), [preview]);
  const activeView = resultView === "trades" ? null : RESULT_VIEWS[resultView];
  const statisticGroups = resultView === "days" ? DAY_STATISTIC_GROUPS : TRADE_STATISTIC_GROUPS;
  const statisticMetricIds = statisticGroups.flatMap((group) => [...group.metricIds]);
  const explorerMetrics = useMemo(() => new Map(model.metrics.map((item) => [item.metricId, item])), [model.metrics]);
  const selectedStatistic = explorerMetrics.get(query.metricId) ?? null;
  const displayedColumns = activeView === null || activeView.columns.some((column) => column.metricId === query.metricId)
    ? activeView?.columns ?? Object.freeze([])
    : Object.freeze([...activeView.columns, Object.freeze({
        label: selectedStatistic ? explorerMetricLabel(selectedStatistic.metricId, selectedStatistic.title) : "Selected statistic",
        metricId: query.metricId,
      })]);
  const sortedGroups = useMemo(() => [...groups].sort((left, right) => {
    const leftValue = metricSortValue(left.group, sortMetricId);
    const rightValue = metricSortValue(right.group, sortMetricId);
    if (leftValue === null && rightValue === null) return left.label.localeCompare(right.label);
    if (leftValue === null) return 1;
    if (rightValue === null) return -1;
    const comparison = leftValue - rightValue;
    return sortDirection === "ascending" ? comparison : -comparison;
  }), [groups, sortDirection, sortMetricId]);
  const visibleGroups = useMemo(() => resultView === "days" && dayStatisticIsSubset(query.metricId)
    ? sortedGroups.filter((item) => {
        const selectedValue = metricSortValue(item.group, query.metricId);
        return selectedValue !== null && selectedValue > 0;
      })
    : sortedGroups, [query.metricId, resultView, sortedGroups]);

  function run(nextQuery = query): void {
    setError(null);
    setExpandedRoundTripId(null);
    setExpandedExecutions(Object.freeze([]));
    setExecutionDetailsStatus("idle");
    startTransition(async () => {
      const result = await runTradeExplorer(nextQuery);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setPreview(result.preview);
      setPageCursors(Object.freeze([null]));
      setPageIndex(0);
    });
  }

  async function toggleTradeExecutions(roundTripId: string): Promise<void> {
    const requestNumber = executionRequestRef.current + 1;
    executionRequestRef.current = requestNumber;
    if (expandedRoundTripId === roundTripId) {
      setExpandedRoundTripId(null);
      setExpandedExecutions(Object.freeze([]));
      setExecutionDetailsStatus("idle");
      return;
    }

    setExpandedRoundTripId(roundTripId);
    setExpandedExecutions(Object.freeze([]));
    setExecutionDetailsStatus("loading");
    try {
      const response = await fetch(`/api/platform/journal/calendar/ticker-details?roundTripIds=${encodeURIComponent(roundTripId)}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Execution details request failed.");
      const body = await response.json() as Readonly<{ trades?: readonly TradeExecutionDetails[] }>;
      if (executionRequestRef.current !== requestNumber) return;
      const details = body.trades?.find((trade) => trade.roundTripId === roundTripId);
      setExpandedExecutions(Object.freeze([...(details?.executions ?? [])]));
      setExecutionDetailsStatus("ready");
    } catch {
      if (executionRequestRef.current !== requestNumber) return;
      setExpandedExecutions(Object.freeze([]));
      setExecutionDetailsStatus("error");
    }
  }

  function choosePageSize(evidenceRows: 12 | 24 | 50 | 100): void {
    const nextQuery = Object.freeze({ ...query, evidenceRows });
    setQuery(nextQuery);
    run(nextQuery);
  }

  function chooseStatistic(metricId: string): void {
    const statisticOutcome = tradeOutcomeForStatistic(metricId);
    const selectedOutcome = resultView === "trades" && statisticOutcome !== null
      ? statisticOutcome
      : query.outcome;
    const nextQuery = Object.freeze({ ...query, metricId, outcome: selectedOutcome });
    setQuery(nextQuery);
    if (resultView !== "trades") setSortMetricId(metricId);
    run(nextQuery);
  }

  function chooseResultView(nextView: ExplorerResultView): void {
    setResultView(nextView);
    const definition = nextView === "trades" ? null : RESULT_VIEWS[nextView];
    const metricId = nextView === "days"
      ? "average_daily_pnl"
      : definition?.defaultSortMetricId ?? "total_trades";
    setSortMetricId(definition?.defaultSortMetricId ?? "net_pnl");
    setSortDirection("descending");
    const nextQuery = Object.freeze({
      ...query,
      grouping: definition?.grouping ?? "closing_month",
      metricId,
    });
    setQuery(nextQuery);
    run(nextQuery);
  }

  function choosePeriodGrouping(grouping: "closing_day" | "closing_iso_week" | "closing_month" | "closing_year"): void {
    const nextQuery = Object.freeze({ ...query, grouping });
    setQuery(nextQuery);
    run(nextQuery);
  }

  function loadTradePage(nextPageIndex: number, cursor: string | null): void {
    setError(null);
    startTransition(async () => {
      const result = await runTradeExplorer(query, cursor);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setPreview(result.preview);
      setPageCursors((current) => nextPageIndex > pageIndex
        ? Object.freeze([...current.slice(0, pageIndex + 1), cursor])
        : current);
      setPageIndex(nextPageIndex);
    });
  }

  function reset(): void {
    setQuery(model.initialQuery);
    setPreview(model.initialPreview);
    setResultView("trades");
    setSortMetricId("net_pnl");
    setSortDirection("descending");
    setPageCursors(Object.freeze([null]));
    setPageIndex(0);
    setError(null);
  }

  return (
    <DashboardPage>
      <Box>
        <Typography component="h1" variant="h1">Trade Explorer</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>Explore completed trades, narrow the results and find the details that matter to you.</Typography>
      </Box>
      <DashboardPanel
        action={
          <Stack direction="row" spacing={1}>
            <DashboardSecondaryAction onClick={reset} startIcon={<RefreshRoundedIcon />}>Reset</DashboardSecondaryAction>
            <DashboardPrimaryAction disabled={isPending} onClick={() => run()} startIcon={<FilterAltRoundedIcon />}>
              {isPending ? "Updating" : "Update results"}
            </DashboardPrimaryAction>
          </Stack>
        }
        title="Explore trades"
      >
        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" } }}>
          <TextField fullWidth label="From" onChange={(event) => patch("startDate", event.target.value)} size="small" type="date" value={query.startDate} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField fullWidth label="To" onChange={(event) => patch("endDate", event.target.value)} size="small" type="date" value={query.endDate} slotProps={{ inputLabel: { shrink: true } }} />
          <SelectField label="Currency" onChange={(next) => patch("currency", next === "all" ? null : next)} value={query.currency ?? "all"}>
            <MenuItem value="all">All currencies</MenuItem>
            {model.currencies.map((currency) => <MenuItem key={currency} value={currency}>{currency}</MenuItem>)}
          </SelectField>
          <Autocomplete
            autoHighlight
            fullWidth
            onChange={(_event, next) => patch("symbol", next)}
            options={model.symbols}
            renderInput={(params) => <TextField {...params} label="Ticker" size="small" />}
            value={query.symbol}
          />
          <SelectField label="Direction" onChange={(next) => patch("direction", next === "all" ? null : next as "long" | "short")} value={query.direction ?? "all"}>
            <MenuItem value="all">All directions</MenuItem><MenuItem value="long">Long</MenuItem><MenuItem value="short">Short</MenuItem>
          </SelectField>
          <SelectField label="Result basis" onChange={(next) => patch("moneyBasis", next as "gross" | "net")} value={query.moneyBasis}>
            <MenuItem value="net">Net P/L</MenuItem><MenuItem value="gross">Gross P/L</MenuItem>
          </SelectField>
          <SelectField label="Result" onChange={(next) => patch("outcome", next === "all" ? null : next as "win" | "loss" | "flat")} value={query.outcome ?? "all"}>
            <MenuItem value="all">All results</MenuItem><MenuItem value="win">Wins</MenuItem><MenuItem value="loss">Losses</MenuItem><MenuItem value="flat">Flat</MenuItem>
          </SelectField>
          <SelectField label="View" onChange={(next) => chooseResultView(next as ExplorerResultView)} value={resultView}>
            <MenuItem value="trades">Trades</MenuItem>
            <MenuItem value="days">Trading Days</MenuItem>
            <MenuItem value="tickers">Tickers</MenuItem>
            <MenuItem value="entry_times">Entry Times</MenuItem>
            <MenuItem value="holding_time">Holding Time</MenuItem>
            <MenuItem value="position_size">Position Size</MenuItem>
            <MenuItem value="periods">Periods</MenuItem>
          </SelectField>
          <SelectField label="Statistic" onChange={chooseStatistic} value={statisticMetricIds.includes(query.metricId) ? query.metricId : statisticMetricIds[0] ?? "total_trades"}>
            {statisticGroups.map((group) => [
              <ListSubheader key={`${group.label}-heading`}>{group.label}</ListSubheader>,
              ...group.metricIds.flatMap((metricId) => {
                const item = explorerMetrics.get(metricId);
                return item ? [<MenuItem key={item.metricId} value={item.metricId}>{explorerMetricLabel(item.metricId, item.title)}</MenuItem>] : [];
              }),
            ])}
          </SelectField>
          {resultView === "trades" ? (
            <SelectField label="Results per page" onChange={(next) => choosePageSize(Number(next) as 12 | 24 | 50 | 100)} value={String(query.evidenceRows)}>
              <MenuItem value="12">12</MenuItem><MenuItem value="24">24</MenuItem><MenuItem value="50">50</MenuItem><MenuItem value="100">100</MenuItem>
            </SelectField>
          ) : null}
        </Box>
        <Button endIcon={<ExpandMoreRoundedIcon sx={{ transform: advanced ? "rotate(180deg)" : "none" }} />} onClick={() => setAdvanced((current) => !current)} sx={{ mt: 1.5 }}>
          More filters
        </Button>
        <Collapse in={advanced}>
          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, mt: 1.5 }}>
            <SelectField label="Entry weekday" onChange={(next) => patch("entryWeekday", next === "all" ? null : next as AnalyticsLabPlatformQuery["entryWeekday"])} value={query.entryWeekday ?? "all"}>
              <MenuItem value="all">Any weekday</MenuItem>{["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => <MenuItem key={day} value={day}>{day.slice(0, 1).toUpperCase() + day.slice(1)}</MenuItem>)}
            </SelectField>
            <SelectField label="Entry-time detail" onChange={(next) => patch("entryTimeBucketMinutes", Number(next) as 5 | 15 | 30 | 60)} value={String(query.entryTimeBucketMinutes)}>
              <MenuItem value="5">5 minutes</MenuItem><MenuItem value="15">15 minutes</MenuItem><MenuItem value="30">30 minutes</MenuItem><MenuItem value="60">60 minutes</MenuItem>
            </SelectField>
            <TextField fullWidth label="Entry time (HH:MM)" onChange={(event) => patch("entryTimeBucket", event.target.value === "" ? null : event.target.value)} placeholder="09:30" size="small" value={query.entryTimeBucket ?? ""} />
            {exactField("Minimum hold (seconds)", query.minimumHoldingSeconds, (next) => patch("minimumHoldingSeconds", next))}
            {exactField("Maximum hold (seconds)", query.maximumHoldingSeconds, (next) => patch("maximumHoldingSeconds", next))}
            {exactField("Minimum entered quantity", query.minimumEnteredQuantity, (next) => patch("minimumEnteredQuantity", next))}
            {exactField("Maximum entered quantity", query.maximumEnteredQuantity, (next) => patch("maximumEnteredQuantity", next))}
            {exactField("Minimum position size", query.minimumPositionQuantity, (next) => patch("minimumPositionQuantity", next))}
            {exactField("Maximum position size", query.maximumPositionQuantity, (next) => patch("maximumPositionQuantity", next))}
            {exactField("Minimum entry value", query.minimumEntryNotional, (next) => patch("minimumEntryNotional", next))}
            {exactField("Maximum entry value", query.maximumEntryNotional, (next) => patch("maximumEntryNotional", next))}
          </Box>
        </Collapse>

        <Box sx={{ borderTop: 1, borderColor: "divider", mt: 2, pt: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }}>{activeView?.label ?? "Trades"}</Typography>
              <Typography color="text.secondary" variant="body2">
                {selectedStatistic ? `${explorerMetricLabel(selectedStatistic.metricId, selectedStatistic.title)}: ` : ""}
                {preview.selectedMetric ? formatJournalAnalyticsMetric(preview.selectedMetric) : "N/A"}
              </Typography>
            </Box>
          </Stack>
          {activeView ? (
            <>
              <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, mb: 1.5 }}>
                {resultView === "periods" ? (
                  <SelectField label="Period" onChange={(next) => choosePeriodGrouping(next as "closing_day" | "closing_iso_week" | "closing_month" | "closing_year")} value={query.grouping}>
                    <MenuItem value="closing_day">Day</MenuItem><MenuItem value="closing_iso_week">Week</MenuItem><MenuItem value="closing_month">Month</MenuItem><MenuItem value="closing_year">Year</MenuItem>
                  </SelectField>
                ) : null}
                <SelectField label="Sort by" onChange={setSortMetricId} value={sortMetricId}>
                  {displayedColumns.filter((column) => column.kind !== "day_path").map((column) => <MenuItem key={column.metricId} value={column.metricId}>{column.label}</MenuItem>)}
                </SelectField>
                <SelectField label="Order" onChange={(next) => setSortDirection(next as "descending" | "ascending")} value={sortDirection}>
                  <MenuItem value="descending">Highest first</MenuItem><MenuItem value="ascending">Lowest first</MenuItem>
                </SelectField>
              </Box>
              {sortedGroups.length === 0 ? (
                <Typography color="text.secondary">No completed trades match these filters.</Typography>
              ) : (
                <TableContainer sx={{ maxHeight: 560 }}>
                  <Table size="small" stickyHeader>
                    <TableHead><TableRow><TableCell>{activeView.firstColumnLabel}</TableCell>{displayedColumns.map((column) => <TableCell key={column.label}>{column.label}</TableCell>)}</TableRow></TableHead>
                    <TableBody>
                      {visibleGroups.map((item) => (
                        <TableRow hover key={item.id}>
                          <TableCell sx={{ fontWeight: 800, textTransform: resultView === "entry_times" ? "none" : "capitalize" }}>{item.label}</TableCell>
                          {displayedColumns.map((column) => <TableCell key={column.label}>{column.kind === "day_path" ? dayMovement(item.group) : value(item.group, column.metricId)}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          ) : preview.evidence === null ? (
            <Typography color="text.secondary">Choose one currency to view individual trades.</Typography>
          ) : preview.evidence.rows.length === 0 ? (
            <Typography color="text.secondary">No completed trades match these filters.</Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 560 }}>
              <Table size="small" stickyHeader>
                <TableHead><TableRow><TableCell>Closed</TableCell><TableCell>Ticker</TableCell><TableCell>Direction</TableCell><TableCell>Shares</TableCell><TableCell>Average entry</TableCell><TableCell>Average exit</TableCell><TableCell>Total entry amount</TableCell><TableCell>P/L</TableCell><TableCell>Return</TableCell><TableCell>Hold</TableCell><TableCell>Executions</TableCell></TableRow></TableHead>
                <TableBody>
                  {preview.evidence.rows.map((trade) => {
                    const expanded = expandedRoundTripId === trade.roundTripId;
                    return <Fragment key={trade.roundTripId}>
                      <TableRow
                        aria-expanded={expanded}
                        hover
                        onClick={() => void toggleTradeExecutions(trade.roundTripId)}
                        selected={expanded}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{trade.closeLocalDate}</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>{trade.displayedSymbol}</TableCell>
                        <TableCell sx={{ textTransform: "capitalize" }}>{trade.direction}</TableCell>
                        <TableCell>{formatJournalAnalyticsDecimal(trade.enteredQuantityDecimal)}</TableCell>
                        <TableCell>{trade.averageEntryPriceDecimal ? money(trade.averageEntryPriceDecimal) : "N/A"}</TableCell>
                        <TableCell>{trade.averageExitPriceDecimal ? money(trade.averageExitPriceDecimal) : "N/A"}</TableCell>
                        <TableCell>{money(trade.entryNotionalDecimal)}</TableCell>
                        <TableCell sx={{ color: trade.selectedPnlDecimal?.startsWith("-") ? "error.main" : "success.main", fontWeight: 800 }}>{money(trade.selectedPnlDecimal)}</TableCell>
                        <TableCell>{trade.returnPercentDecimal === null || trade.returnPercentDecimal === undefined ? "N/A" : `${formatJournalAnalyticsDecimal(trade.returnPercentDecimal)}%`}</TableCell>
                        <TableCell>{holdingTime(trade.holdingDurationMilliseconds)}</TableCell>
                        <TableCell>{trade.uniqueExecutionCount}</TableCell>
                      </TableRow>
                      {expanded ? <TableRow>
                        <TableCell colSpan={11} sx={{ backgroundColor: "action.hover", px: 3, py: 2 }}>
                          {executionDetailsStatus === "loading" ? <Typography color="text.secondary">Loading executions…</Typography> : null}
                          {executionDetailsStatus === "error" ? <Alert severity="error">The executions could not be loaded.</Alert> : null}
                          {executionDetailsStatus === "ready" && expandedExecutions.length === 0 ? <Typography color="text.secondary">No executions are available for this trade.</Typography> : null}
                          {executionDetailsStatus === "ready" && expandedExecutions.length > 0 ? <TableContainer sx={{ maxWidth: 650 }}>
                            <Table aria-label={`${trade.displayedSymbol} trade executions`} size="small" sx={{ tableLayout: "fixed" }}>
                              <TableHead><TableRow><TableCell sx={{ width: 230 }}>Executed (Eastern Time)</TableCell><TableCell sx={{ width: 90 }}>Side</TableCell><TableCell sx={{ width: 110 }}>Shares</TableCell><TableCell sx={{ width: 110 }}>Price</TableCell></TableRow></TableHead>
                              <TableBody>{expandedExecutions.map((execution, index) => <TableRow key={`${execution.executed_at_utc}-${execution.side}-${index}`}>
                                <TableCell>{executionTime(execution.executed_at_utc)}</TableCell>
                                <TableCell sx={{ textTransform: "capitalize" }}>{execution.side}</TableCell>
                                <TableCell>{formatJournalAnalyticsDecimal(execution.quantity_decimal)}</TableCell>
                                <TableCell>{execution.price_decimal === null ? "N/A" : money(execution.price_decimal)}</TableCell>
                              </TableRow>)}</TableBody>
                            </Table>
                          </TableContainer> : null}
                        </TableCell>
                      </TableRow> : null}
                    </Fragment>;
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {!activeView && preview.evidence && (pageIndex > 0 || preview.evidence.continuationCursor) ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end", mt: 1.5 }}>
              <Button disabled={isPending || pageIndex === 0} onClick={() => loadTradePage(pageIndex - 1, pageCursors[pageIndex - 1] ?? null)} variant="outlined">Previous</Button>
              <Typography color="text.secondary" variant="body2">Page {pageIndex + 1}</Typography>
              <Button disabled={isPending || !preview.evidence.continuationCursor} onClick={() => loadTradePage(pageIndex + 1, preview.evidence!.continuationCursor)} variant="outlined">Next</Button>
            </Stack>
          ) : null}
        </Box>
      </DashboardPanel>

      {error ? <Alert severity="error">{error}</Alert> : null}
    </DashboardPage>
  );
}
