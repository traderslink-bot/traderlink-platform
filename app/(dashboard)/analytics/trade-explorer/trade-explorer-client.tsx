"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BookmarkAddRoundedIcon from "@mui/icons-material/BookmarkAddRounded";
import BookmarksRoundedIcon from "@mui/icons-material/BookmarksRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  ButtonBase,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  ListSubheader,
  Link as MuiLink,
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
import NextLink from "next/link";
import { Fragment, useMemo, useRef, useState, useTransition } from "react";

import type {
  JournalAnalyticsGroupResult,
  JournalAnalyticsMetricResult,
  JournalAnalyticsRoundTripTableRow,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  TRADE_EXPLORER_SAVED_VIEW_VERSION,
} from "@/src/modules/journal-analytics/contracts/trade-explorer-saved-view";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsDuration,
  formatJournalAnalyticsMetric,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import {
  financialOutcomeColor,
  financialOutcomeMetricColor,
} from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import {
  canonicalTradeExplorerDecimalInput,
  canonicalTradeExplorerTimeInput,
  compareTradeExplorerMetricValues,
  TRADE_EXPLORER_TRADE_SORT_OPTIONS,
  tradeExplorerDefaultRankDirection,
  tradeExplorerMetricForMoneyBasis,
  tradeExplorerMetricForOutcome,
  tradeExplorerMetricMatchesMoneyBasis,
  tradeExplorerMetricMatchesOutcome,
  tradeExplorerTradeSortForOutcome,
  type TradeExplorerTradeSort,
} from "@/src/modules/journal-analytics/presentation/trade-explorer-ordering";
import { OfflineSavedViewStatus } from "@/app/pwa/offline-saved-view-status";
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
import { HorizontalScrollRegion } from "../../horizontal-scroll-region";

import { createTradeExplorerSavedView, runTradeExplorer } from "./actions";
import type {
  TradeExplorerResultView as ExplorerResultView,
  TradeExplorerQuery,
  TradeExplorerSavedView,
  TradeExplorerSavedViewDefinition,
} from "./trade-explorer-saved-view-model";
import { TradeExplorerReviewEditor } from "./trade-review-editor";
import type { TradeExplorerReviewTarget } from "./trade-review-model";
import type { TradeExplorerPageModel } from "./trade-explorer-service";

type ExplorerGroup = Readonly<{
  id: string;
  label: string;
  partitionKey: string;
  partitionLabel: string;
  timeZone: string;
  group: JournalAnalyticsGroupResult;
}>;

type ExplorerGroupColumn = Readonly<{
  label: string;
  metricId?: string;
  kind?: "metric" | "day_path" | "first_open" | "last_close" | "symbol_count" | "literal";
  literal?: string;
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
  rankMetricIds: readonly string[];
  columns: readonly ExplorerGroupColumn[];
}>;

const RESULTS_UPDATE_FAILURE = "The results could not be updated. The table still shows your last successful results. Try again.";
const REPORT_DOWNLOAD_FAILURE = "The PDF report could not be downloaded. Try again.";
const SAVED_VIEW_SAVE_FAILURE = "This view could not be saved. Check its name and try again.";

const RESULT_VIEWS: Readonly<Record<Exclude<ExplorerResultView, "trades">, ExplorerViewDefinition>> = Object.freeze({
  days: Object.freeze({
    label: "Trading Days",
    firstColumnLabel: "Date",
    grouping: "closing_day",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "maximum_intraday_realized_drawdown", "maximum_intraday_realized_recovery_from_trough", "maximum_peak_profit_giveback"]),
    columns: Object.freeze([
      { label: "First entry", kind: "first_open" as const },
      { label: "Last exit", kind: "last_close" as const },
      { label: "Tickers", kind: "symbol_count" as const },
      { label: "Trades", metricId: "total_trades" },
      { label: "Wins", metricId: "win_count" },
      { label: "Losses", metricId: "loss_count" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Largest winner", metricId: "best_trade" },
      { label: "Largest loser", metricId: "worst_trade" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Max realized drawdown", metricId: "maximum_intraday_realized_drawdown" },
      { label: "Realized recovery", metricId: "maximum_intraday_realized_recovery_from_trough" },
      { label: "Peak-profit giveback", metricId: "maximum_peak_profit_giveback" },
      { label: "Day movement", metricId: "red_to_green_day_count", kind: "day_path" as const },
    ]),
  }),
  tickers: Object.freeze({
    label: "Tickers",
    firstColumnLabel: "Ticker",
    grouping: "instrument",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "win_rate", "profit_factor", "return_on_entry_notional", "average_holding_time"]),
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Wins", metricId: "win_count" },
      { label: "Losses", metricId: "loss_count" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg hold", metricId: "average_holding_time" },
      { label: "Avg shares entered", metricId: "average_share_quantity" },
      { label: "Avg entry value", metricId: "average_entry_notional" },
    ]),
  }),
  entry_times: Object.freeze({
    label: "Entry Times",
    firstColumnLabel: "Entry time",
    grouping: "entry_time_bucket",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "win_rate", "profit_factor", "return_on_entry_notional", "average_holding_time"]),
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg hold", metricId: "average_holding_time" },
      { label: "Avg shares entered", metricId: "average_share_quantity" },
    ]),
  }),
  exit_times: Object.freeze({
    label: "Exit Times",
    firstColumnLabel: "Exit time",
    grouping: "exit_time_bucket",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "win_rate", "profit_factor", "return_on_entry_notional", "average_holding_time"]),
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Median P/L", metricId: "median_pnl" },
      { label: "Avg hold", metricId: "average_holding_time" },
    ]),
  }),
  entry_weekday: Object.freeze({
    label: "Entry Weekday",
    firstColumnLabel: "Weekday",
    grouping: "entry_weekday",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "win_rate", "profit_factor", "return_on_entry_notional", "average_holding_time"]),
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Wins", metricId: "win_count" },
      { label: "Losses", metricId: "loss_count" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg hold", metricId: "average_holding_time" },
    ]),
  }),
  direction: Object.freeze({
    label: "Direction",
    firstColumnLabel: "Direction",
    grouping: "direction",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "win_rate", "profit_factor", "return_on_entry_notional", "average_holding_time"]),
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Median P/L", metricId: "median_pnl" },
      { label: "Avg hold", metricId: "average_holding_time" },
    ]),
  }),
  entered_quantity: Object.freeze({
    label: "Entered Quantity",
    firstColumnLabel: "Shares entered",
    grouping: "entered_quantity_bucket",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "win_rate", "profit_factor", "return_on_entry_notional", "average_holding_time"]),
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg entry value", metricId: "average_entry_notional" },
      { label: "Avg hold", metricId: "average_holding_time" },
    ]),
  }),
  entry_value: Object.freeze({
    label: "Entry Value",
    firstColumnLabel: "Entry value",
    grouping: "entry_notional_bucket",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "win_rate", "profit_factor", "return_on_entry_notional", "average_holding_time"]),
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg shares entered", metricId: "average_share_quantity" },
      { label: "Avg hold", metricId: "average_holding_time" },
    ]),
  }),
  entry_price: Object.freeze({
    label: "Entry Price",
    firstColumnLabel: "Average entry price",
    grouping: "entry_price_bucket",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "win_rate", "profit_factor", "return_on_entry_notional", "average_holding_time"]),
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg entry value", metricId: "average_entry_notional" },
      { label: "Avg shares entered", metricId: "average_share_quantity" },
    ]),
  }),
  holding_time: Object.freeze({
    label: "Holding Time",
    firstColumnLabel: "Holding range",
    grouping: "holding_duration_bucket",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "win_rate", "profit_factor", "return_on_entry_notional"]),
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg hold", metricId: "average_holding_time" },
      { label: "Avg shares entered", metricId: "average_share_quantity" },
    ]),
  }),
  position_size: Object.freeze({
    label: "Position Size",
    firstColumnLabel: "Maximum shares held",
    grouping: "maximum_position_bucket",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "win_rate", "profit_factor", "return_on_entry_notional", "average_holding_time"]),
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg shares entered", metricId: "average_share_quantity" },
      { label: "Avg entry value", metricId: "average_entry_notional" },
      { label: "Avg hold", metricId: "average_holding_time" },
    ]),
  }),
  periods: Object.freeze({
    label: "Periods",
    firstColumnLabel: "Period",
    grouping: "closing_month",
    defaultSortMetricId: "net_pnl",
    rankMetricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "win_rate", "profit_factor", "best_trade", "worst_trade"]),
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Wins", metricId: "win_count" },
      { label: "Losses", metricId: "loss_count" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Best trade", metricId: "best_trade" },
      { label: "Worst trade", metricId: "worst_trade" },
    ]),
  }),
});

function explorerMetricLabel(metricId: string, title: string): string {
  if (metricId === "net_pnl") return "Net P/L";
  if (metricId === "gross_pnl") return "Gross P/L";
  if (metricId.includes("entry_notional")) return title.replaceAll("Entry Notional", "Entry Value").replaceAll("entry notional", "entry value");
  return title;
}

function SelectField({
  children,
  idSuffix = "",
  label,
  onChange,
  value,
}: Readonly<{
  children: React.ReactNode;
  idSuffix?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}>) {
  const id = `trade-explorer-${label.toLowerCase().replaceAll(" ", "-")}${idSuffix}`;
  return (
    <FormControl fullWidth size="small">
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select label={label} labelId={`${id}-label`} onChange={(event) => onChange(event.target.value)} value={value}>
        {children}
      </Select>
    </FormControl>
  );
}

function metric(
  group: Pick<JournalAnalyticsGroupResult, "metrics"> | null,
  metricId: string,
): JournalAnalyticsMetricResult | null {
  return group?.metrics.find((candidate) => candidate.metricId === metricId) ?? null;
}

function value(
  group: Pick<JournalAnalyticsGroupResult, "metrics"> | null,
  metricId: string,
): string {
  const result = metric(group, metricId);
  return result?.state === "unavailable" || result?.state === "empty"
    ? "N/A"
    : result ? formatExplorerMetric(result) : "N/A";
}

function formatExplorerMetric(result: JournalAnalyticsMetricResult): string {
  return formatJournalAnalyticsMetric(result);
}

function metricSortValue(
  group: JournalAnalyticsGroupResult,
  metricId: string,
): JournalAnalyticsMetricResult["value"] {
  return metric(group, metricId)?.value ?? null;
}

function dayMovement(group: JournalAnalyticsGroupResult): string {
  const redToGreenResult = metric(group, "red_to_green_day_count");
  const greenToRedResult = metric(group, "green_to_red_day_count");
  if (
    redToGreenResult === null || redToGreenResult.value === null ||
    greenToRedResult === null || greenToRedResult.value === null
  ) return "N/A";
  const redToGreen = value(group, "red_to_green_day_count") === "1";
  const greenToRed = value(group, "green_to_red_day_count") === "1";
  if (redToGreen && greenToRed) return "Red → green and green → red";
  if (redToGreen) return "Red → green";
  if (greenToRed) return "Green → red";
  return "Neither";
}

function groupColumnIsUnavailable(
  group: JournalAnalyticsGroupResult,
  column: ExplorerGroupColumn,
): boolean {
  if (column.kind === "first_open") return !group.facts?.firstOpenedAtUtc;
  if (column.kind === "last_close") return !group.facts?.lastClosedAtUtc;
  if (column.kind === "symbol_count") return false;
  if (column.kind === "literal") return false;
  if (column.kind === "day_path") {
    return ["red_to_green_day_count", "green_to_red_day_count"].some((metricId) => {
      const result = metric(group, metricId);
      return result === null || result.value === null;
    });
  }
  if (!column.metricId) return true;
  const result = metric(group, column.metricId);
  return result === null || result.value === null;
}

function groupColumnDisplaysMetric(
  column: ExplorerGroupColumn,
  metricId: string,
): boolean {
  return column.metricId === metricId;
}

function groupColumnValue(
  group: JournalAnalyticsGroupResult,
  column: ExplorerGroupColumn,
  timeZone: string,
): string {
  if (column.kind === "first_open") {
    return !group.facts?.firstOpenedAtUtc
      ? "N/A"
      : tradeCloseTime(group.facts.firstOpenedAtUtc, timeZone);
  }
  if (column.kind === "last_close") {
    return !group.facts?.lastClosedAtUtc
      ? "N/A"
      : tradeCloseTime(group.facts.lastClosedAtUtc, timeZone);
  }
  if (column.kind === "symbol_count") return group.facts ? String(group.facts.uniqueSymbolCount) : "N/A";
  if (column.kind === "literal") return column.literal ?? "N/A";
  if (column.kind === "day_path") return dayMovement(group);
  return column.metricId ? value(group, column.metricId) : "N/A";
}

function money(valueDecimal: string | null, currency: string | null): string {
  if (valueDecimal === null) return "N/A";
  return formatJournalAnalyticsMoney(valueDecimal, currency);
}

function executionTime(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    timeZone,
    timeZoneName: "short",
    year: "numeric",
  }).format(new Date(value));
}

function tradeCloseTime(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(value));
}

function executionStructure(trade: JournalAnalyticsRoundTripTableRow): string {
  return `${trade.uniqueExecutionCount} total · ${trade.entryExecutionCount} entry · ${trade.additionExecutionCount} add · ${trade.reductionExecutionCount} reduction · ${trade.exitExecutionCount} exit`;
}

function savedViewDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function savedViewCreatedDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
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

function canonicalizeExactQueryFields(
  input: TradeExplorerQuery,
): TradeExplorerQuery {
  const basisMetricId = tradeExplorerMetricForMoneyBasis(
    input.metricId,
    input.moneyBasis,
  );
  return Object.freeze({
    ...input,
    metricId: tradeExplorerMetricForOutcome(basisMetricId, input.outcome),
    minimumHoldingSeconds: canonicalTradeExplorerDecimalInput(input.minimumHoldingSeconds),
    maximumHoldingSeconds: canonicalTradeExplorerDecimalInput(input.maximumHoldingSeconds),
    minimumEnteredQuantity: canonicalTradeExplorerDecimalInput(input.minimumEnteredQuantity),
    maximumEnteredQuantity: canonicalTradeExplorerDecimalInput(input.maximumEnteredQuantity),
    minimumPositionQuantity: canonicalTradeExplorerDecimalInput(input.minimumPositionQuantity),
    maximumPositionQuantity: canonicalTradeExplorerDecimalInput(input.maximumPositionQuantity),
    minimumEntryNotional: canonicalTradeExplorerDecimalInput(input.minimumEntryNotional),
    maximumEntryNotional: canonicalTradeExplorerDecimalInput(input.maximumEntryNotional),
    entryTimeBucket: canonicalTradeExplorerTimeInput(input.entryTimeBucket),
  });
}

function tradeExplorerQueriesMatch(
  left: TradeExplorerQuery,
  right: TradeExplorerQuery,
): boolean {
  const leftKeys = Object.keys(left) as readonly (keyof TradeExplorerQuery)[];
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => left[key] === right[key]);
}

export default function TradeExplorerClient({
  initialResultView = "trades",
  initialSavedViews = Object.freeze([]),
  model,
  offlineSavedAtUtc,
}: Readonly<{
  initialResultView?: ExplorerResultView;
  initialSavedViews?: readonly TradeExplorerSavedView[];
  model: TradeExplorerPageModel;
  offlineSavedAtUtc?: string;
}>) {
  const [query, setQuery] = useState(model.initialQuery);
  const [appliedQuery, setAppliedQuery] = useState(model.initialQuery);
  const [preview, setPreview] = useState<AnalyticsLabPlatformPreview>(model.initialPreview);
  const [resultView, setResultView] = useState<ExplorerResultView>(initialResultView);
  const [appliedResultView, setAppliedResultView] = useState<ExplorerResultView>(initialResultView);
  const [tradeSort, setTradeSort] = useState<TradeExplorerTradeSort>("closed_desc");
  const [appliedTradeSort, setAppliedTradeSort] = useState<TradeExplorerTradeSort>("closed_desc");
  const [sortMetricId, setSortMetricId] = useState(model.initialQuery.metricId);
  const [sortDirection, setSortDirection] = useState<"descending" | "ascending">("descending");
  const [pageCursors, setPageCursors] = useState<readonly (string | null)[]>(Object.freeze([null]));
  const [pageIndex, setPageIndex] = useState(0);
  const [groupPageSize, setGroupPageSize] = useState<10 | 25 | 50 | 100>(25);
  const [groupPageIndex, setGroupPageIndex] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [reviewRoundTripId, setReviewRoundTripId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [savedViews, setSavedViews] = useState(initialSavedViews);
  const [savedViewsOpen, setSavedViewsOpen] = useState(false);
  const [expandedSavedViewIds, setExpandedSavedViewIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState("");
  const [saveViewError, setSaveViewError] = useState<string | null>(null);
  const [isSavingView, startSavingViewTransition] = useTransition();
  const [expandedRoundTripId, setExpandedRoundTripId] = useState<string | null>(null);
  const [expandedExecutions, setExpandedExecutions] = useState<readonly TradeExecution[]>(Object.freeze([]));
  const [executionDetailsStatus, setExecutionDetailsStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const executionRequestRef = useRef(0);
  const previewRequestRef = useRef(0);
  const sortDirectionRevisionRef = useRef(0);
  const [isPending, startTransition] = useTransition();
  const patch = <K extends keyof TradeExplorerQuery>(key: K, next: TradeExplorerQuery[K]) =>
    setQuery((current) => Object.freeze({ ...current, [key]: next }));
  const showPartitionColumn = preview.response.partitions.length > 1;
  const showPartitionTimezone = new Set(preview.response.partitions.map((partition) =>
    partition.timezone)).size > 1;
  const partitionColumnLabel = showPartitionTimezone
    ? "Currency / timezone"
    : "Currency";
  const hasUnappliedChanges = !tradeExplorerQueriesMatch(
    canonicalizeExactQueryFields(query),
    appliedQuery,
  ) ||
    resultView !== appliedResultView ||
    tradeSort !== appliedTradeSort;
  const groups = useMemo<readonly ExplorerGroup[]>(() => preview.response.partitions.flatMap((partition) => {
    const partitionKey = `${partition.currency ?? "none"}:${partition.timezone ?? "none"}`;
    const currencyLabel = partition.currency ?? "No currency";
    const partitionLabel = showPartitionTimezone
      ? `${currencyLabel} · ${partition.timezone ?? "No timezone"}`
      : currencyLabel;
    return partition.groups.map((group) => Object.freeze({
      id: `${partitionKey}:${group.groupKey}`,
      label: group.label,
      partitionKey,
      partitionLabel,
      timeZone: partition.timezone ?? "UTC",
      group,
    }));
  }), [preview, showPartitionTimezone]);
  const activeView = appliedResultView === "trades" ? null : RESULT_VIEWS[appliedResultView];
  const requestedView = resultView === "trades" ? null : RESULT_VIEWS[resultView];
  const statisticGroups = requestedView === null
    ? Object.freeze([])
    : Object.freeze([Object.freeze({
        label: "Useful rankings",
        metricIds: Object.freeze(requestedView.rankMetricIds.filter((metricId) =>
          tradeExplorerMetricMatchesMoneyBasis(metricId, query.moneyBasis) &&
          tradeExplorerMetricMatchesOutcome(metricId, query.outcome))),
      })]);
  const statisticMetricIds = statisticGroups.flatMap((group) => [...group.metricIds]);
  const tradeSortOptions = TRADE_EXPLORER_TRADE_SORT_OPTIONS.filter((option) =>
    tradeExplorerTradeSortForOutcome(option.value, query.outcome) === option.value &&
    (!option.value.startsWith("trading_costs_") || query.moneyBasis === "net"));
  const explorerMetrics = useMemo(() => new Map(model.metrics.map((item) => [item.metricId, item])), [model.metrics]);
  const selectedStatistic = explorerMetrics.get(appliedQuery.metricId) ?? null;
  const tradeSummaryPartition = preview.response.partitions.length === 1
    ? preview.response.partitions[0]
    : null;
  const feeIncompleteTradeCount = preview.response.crossPartitionCounts
    .feeIncompleteCount;
  const filteredPopulationLabel = appliedQuery.outcome === "win"
    ? "Winning trades"
    : appliedQuery.outcome === "loss"
      ? "Losing trades"
      : appliedQuery.outcome === "flat"
        ? "Flat trades"
        : appliedQuery.moneyBasis === "net"
          ? "Fee-covered trades"
          : "Completed trades";
  const tradeProfitFactorUnavailable = appliedQuery.outcome === null &&
    tradeSummaryPartition !== null &&
    preview.response.crossPartitionCounts.includedCount > 0 &&
    metric(tradeSummaryPartition, "profit_factor")?.value === null;
  const tradeRowsHaveUnavailable = preview.evidence?.rows.some((trade) =>
    trade.averageEntryPriceDecimal === null ||
    trade.averageExitPriceDecimal === null ||
    trade.selectedPnlDecimal === null ||
    trade.returnPercentDecimal === null) ?? false;
  const emptyTradeMessage = appliedQuery.moneyBasis === "net"
    ? "No fee-covered trades match these filters."
    : "No completed trades match these filters.";
  const onlyTradingCostsAreMissing = appliedQuery.moneyBasis === "net" &&
    appliedQuery.symbol !== null &&
    preview.response.crossPartitionCounts.readyClosedCount > 0 &&
    preview.response.crossPartitionCounts.includedCount === 0 &&
    preview.response.crossPartitionCounts.feeIncompleteCount ===
      preview.response.crossPartitionCounts.readyClosedCount;
  const tradeSummary = tradeSummaryPartition === null
    ? Object.freeze([
        Object.freeze({
          label: filteredPopulationLabel,
          value: String(preview.evidence?.totalRowCount ?? preview.response.crossPartitionCounts.includedCount),
          valueColor: "text.primary" as const,
        }),
      ])
    : Object.freeze([
        Object.freeze({ label: filteredPopulationLabel, value: String(preview.evidence?.totalRowCount ?? value(tradeSummaryPartition, "total_trades")), valueColor: "text.primary" as const }),
        Object.freeze({
          label: appliedQuery.moneyBasis === "gross" ? "Gross P/L" : "Net P/L",
          value: value(tradeSummaryPartition, appliedQuery.moneyBasis === "gross" ? "gross_pnl" : "net_pnl"),
          valueColor: financialOutcomeMetricColor(
            appliedQuery.moneyBasis === "gross" ? "gross_pnl" : "net_pnl",
            metric(tradeSummaryPartition, appliedQuery.moneyBasis === "gross" ? "gross_pnl" : "net_pnl")?.value,
          ),
        }),
        ...(appliedQuery.outcome === null
          ? [Object.freeze({ label: "Win rate", value: value(tradeSummaryPartition, "win_rate"), valueColor: "text.primary" as const })]
          : []),
        ...(appliedQuery.outcome === null
          ? [Object.freeze({ label: "Profit factor", value: value(tradeSummaryPartition, "profit_factor"), valueColor: "text.primary" as const })]
          : []),
      ]);
  const populationSummary = tradeSummaryPartition === null
    ? Object.freeze([])
    : Object.freeze([
        ["Average P/L", "average_pnl"],
        ["Median P/L", "median_pnl"],
        ["Profit factor", "profit_factor"],
        ["P/L percentile 10", "pnl_percentile_10"],
        ["P/L percentile 25", "pnl_percentile_25"],
        ["P/L percentile 50", "pnl_percentile_50"],
        ["P/L percentile 75", "pnl_percentile_75"],
        ["P/L percentile 90", "pnl_percentile_90"],
        ["P/L standard deviation", "population_pnl_standard_deviation"],
        ["P/L without largest winner", "selected_pnl_excluding_largest_winner"],
        ["P/L without largest loser", "selected_pnl_excluding_largest_loser"],
        ["P/L without largest winner and loser", "selected_pnl_excluding_largest_winner_and_loser"],
        ["Largest winner share of gross profit", "largest_winner_contribution"],
        ["Largest loser share of gross loss", "largest_loser_contribution"],
        ["Longest winning streak", "longest_winning_trade_streak"],
        ["Current winning streak", "current_winning_trade_streak"],
        ["Longest losing streak", "longest_losing_trade_streak"],
        ["Current losing streak", "current_losing_trade_streak"],
        ["Average executions per trade", "average_executions_per_trade"],
        ["Trades with scale-ins", "scale_in_trade_count"],
        ["Trades with scale-outs", "scale_out_trade_count"],
        ["Largest ticker P/L concentration", "largest_instrument_pnl_share"],
        ["Largest trading-day P/L concentration", "largest_day_pnl_share"],
        ["Trading days", "trading_day_count"],
        ["Average daily P/L", "average_daily_pnl"],
        ["Median daily P/L", "median_daily_pnl"],
        ["Green days", "profitable_trading_day_count"],
        ["Red days", "losing_trading_day_count"],
        ["Flat days", "flat_trading_day_count"],
      ].map(([label, metricId]) => Object.freeze({
        label,
        metricId,
        value: value(tradeSummaryPartition, metricId),
      })));
  const baseActiveViewColumns = activeView?.columns.filter((column) =>
    appliedQuery.outcome === null || (
      !["win_count", "loss_count", "win_rate"].includes(column.metricId) &&
      column.kind !== "day_path"
    )).map((column) =>
      column.metricId === "net_pnl"
      ? Object.freeze({
          ...column,
          label: appliedQuery.moneyBasis === "gross" ? "Gross P/L" : "Net P/L",
          metricId: tradeExplorerMetricForMoneyBasis(
            column.metricId,
            appliedQuery.moneyBasis,
          ),
        })
      : column) ?? Object.freeze([]);
  const activeViewColumns: readonly ExplorerGroupColumn[] = Object.freeze([
    ...baseActiveViewColumns,
    ...(appliedResultView === "days" && appliedQuery.dayNoteState !== null
      ? [Object.freeze({
          label: "Day note",
          kind: "literal" as const,
          literal: appliedQuery.dayNoteState === "present" ? "Present" : "Missing",
        })]
      : []),
    ...(appliedResultView === "days" && appliedQuery.dayRuleId !== null
      ? [Object.freeze({
          label: "Day rule result",
          kind: "literal" as const,
          literal: appliedQuery.dayRuleStatus?.replaceAll("_", " ") ?? "Applicable",
        })]
      : []),
  ]);
  const displayedColumns: readonly ExplorerGroupColumn[] = activeView === null || activeViewColumns.some((column) =>
    groupColumnDisplaysMetric(column, appliedQuery.metricId))
    ? activeViewColumns
    : Object.freeze([...activeViewColumns, Object.freeze({
        label: selectedStatistic ? explorerMetricLabel(selectedStatistic.metricId, selectedStatistic.title) : "Selected statistic",
        metricId: appliedQuery.metricId,
      })]);
  const sortedGroups = useMemo(() => [...groups].sort((left, right) => {
    if (showPartitionColumn) {
      const partitionComparison = left.partitionKey.localeCompare(right.partitionKey);
      if (partitionComparison !== 0) return partitionComparison;
    }
    const leftValue = metricSortValue(left.group, sortMetricId);
    const rightValue = metricSortValue(right.group, sortMetricId);
    if (leftValue === null && rightValue === null) return left.label.localeCompare(right.label);
    if (leftValue === null) return 1;
    if (rightValue === null) return -1;
    const comparison = compareTradeExplorerMetricValues(leftValue, rightValue);
    if (comparison === null) return left.label.localeCompare(right.label);
    return sortDirection === "ascending" ? comparison : -comparison;
  }), [groups, showPartitionColumn, sortDirection, sortMetricId]);
  const groupPageStart = groupPageIndex * groupPageSize;
  const visibleGroups = sortedGroups.slice(groupPageStart, groupPageStart + groupPageSize);
  const groupPageEnd = Math.min(groupPageStart + visibleGroups.length, sortedGroups.length);
  const selectedRankingUnavailable = activeView !== null && groups.length > 0 &&
    groups.every((item) => {
      const result = metric(item.group, appliedQuery.metricId);
      return result === null || result.value === null;
    });
  const groupedResultsHaveUnavailable = activeView !== null && visibleGroups.some((item) =>
    displayedColumns.some((column) => groupColumnIsUnavailable(item.group, column)));
  const reviewTargets = useMemo<readonly TradeExplorerReviewTarget[]>(() =>
    Object.freeze((preview.evidence?.rows ?? []).map((trade) => Object.freeze({
      closeLocalDate: trade.closeLocalDate,
      closedAtUtc: trade.closedAtUtc,
      direction: trade.direction,
      displayedSymbol: trade.displayedSymbol,
      roundTripId: trade.roundTripId,
    }))), [preview.evidence]);
  const reviewOpen = reviewRoundTripId !== null && reviewTargets.some((trade) =>
    trade.roundTripId === reviewRoundTripId);

  function clearExpandedTrade(): void {
    executionRequestRef.current += 1;
    setExpandedRoundTripId(null);
    setExpandedExecutions(Object.freeze([]));
    setExecutionDetailsStatus("idle");
  }

  function viewLabel(view: ExplorerResultView): string {
    return view === "trades" ? "Trades" : RESULT_VIEWS[view].label;
  }

  function savedViewDetails(
    view: TradeExplorerSavedViewDefinition,
  ): readonly Readonly<{ label: string; value: string }>[] {
    const savedQuery = view.query;
    const tradeSortLabel = TRADE_EXPLORER_TRADE_SORT_OPTIONS.find((option) =>
      option.value === view.tradeSort)?.label ?? "Newest first";
    const rankMetric = explorerMetrics.get(savedQuery.metricId);
    const rankLabel = rankMetric
      ? explorerMetricLabel(rankMetric.metricId, rankMetric.title)
      : savedQuery.metricId.replaceAll("_", " ");
    const details: Readonly<{ label: string; value: string }>[] = [
      Object.freeze({
        label: "Date",
        value: `${savedViewDate(savedQuery.startDate)} to ${savedViewDate(savedQuery.endDate)}`,
      }),
      Object.freeze({ label: "View", value: viewLabel(view.resultView) }),
      Object.freeze({
        label: view.resultView === "trades" ? "Sort" : "Rank",
        value: view.resultView === "trades"
          ? tradeSortLabel
          : `${rankLabel} · ${view.sortDirection === "descending" ? "Highest first" : "Lowest first"}`,
      }),
      Object.freeze({
        label: "Result",
        value: savedQuery.outcome === null
          ? "All results"
          : savedQuery.outcome === "win"
            ? "Wins"
            : savedQuery.outcome === "loss"
              ? "Losses"
              : "Flat",
      }),
      Object.freeze({
        label: "Currency",
        value: `${savedQuery.currency ?? "All currencies"} · ${savedQuery.moneyBasis === "gross" ? "Gross P/L" : "Net P/L"}`,
      }),
      Object.freeze({ label: "Ticker", value: savedQuery.symbol ?? "All tickers" }),
      Object.freeze({
        label: "Direction",
        value: savedQuery.direction === null
          ? "All directions"
          : savedQuery.direction === "long" ? "Long" : "Short",
      }),
    ];
    if (view.resultView === "periods") {
      const periodLabel = new Map(model.groupings.map((item) => [item.value, item.label]))
        .get(savedQuery.grouping);
      if (periodLabel) details.push(Object.freeze({ label: "Period", value: periodLabel }));
    }
    if (view.resultView === "trades") {
      details.push(Object.freeze({
        label: "Page size",
        value: `${savedQuery.evidenceRows} results per page`,
      }));
    }
    if (savedQuery.tradeClassification !== null) {
      details.push(Object.freeze({
        label: "Trade type",
        value: savedQuery.tradeClassification === "day_trade" ? "Day trade" : "Multi-day trade",
      }));
    }
    if (savedQuery.tagId !== null || savedQuery.untaggedOnly) {
      details.push(Object.freeze({
        label: "Trade tag",
        value: savedQuery.untaggedOnly
          ? "Untagged"
          : model.annotationOptions.tags.find((tag) => tag.tagId === savedQuery.tagId)?.name ?? "Saved tag",
      }));
    }
    if (savedQuery.noteState !== null) {
      details.push(Object.freeze({
        label: "Trade note",
        value: savedQuery.noteState === "present" ? "Note present" : "No note",
      }));
    }
    if (savedQuery.reviewIncompleteOnly) {
      details.push(Object.freeze({ label: "Review", value: "Incomplete" }));
    }
    if (savedQuery.ruleId !== null) {
      const selectedRule = model.annotationOptions.tradeRules.find((rule) =>
        rule.ruleId === savedQuery.ruleId && rule.ruleVersionId === savedQuery.ruleVersionId);
      details.push(Object.freeze({
        label: "Trade rule",
        value: `${selectedRule?.title ?? "Saved rule version"} · ${savedQuery.ruleStatus?.replaceAll("_", " ") ?? "Applicable"}`,
      }));
    }
    if (savedQuery.dayNoteState !== null) {
      details.push(Object.freeze({
        label: "Day note",
        value: savedQuery.dayNoteState === "present" ? "Day note present" : "No day note",
      }));
    }
    if (savedQuery.dayRuleId !== null) {
      const selectedRule = model.annotationOptions.dayRules.find((rule) =>
        rule.ruleId === savedQuery.dayRuleId && rule.ruleVersionId === savedQuery.dayRuleVersionId);
      details.push(Object.freeze({
        label: "Day rule",
        value: `${selectedRule?.title ?? "Saved rule version"} · ${savedQuery.dayRuleStatus?.replaceAll("_", " ") ?? "Applicable"}`,
      }));
    }
    if (savedQuery.entryWeekday !== null) {
      details.push(Object.freeze({
        label: "Entry weekday",
        value: savedQuery.entryWeekday.slice(0, 1).toUpperCase() + savedQuery.entryWeekday.slice(1),
      }));
    }
    if (savedQuery.entryTimeBucket !== null) {
      details.push(Object.freeze({
        label: "Entry time",
        value: `${savedQuery.entryTimeBucket} · ${savedQuery.entryTimeBucketMinutes}-minute detail`,
      }));
    }
    const ranges = [
      ["Holding seconds", savedQuery.minimumHoldingSeconds, savedQuery.maximumHoldingSeconds],
      ["Entered quantity", savedQuery.minimumEnteredQuantity, savedQuery.maximumEnteredQuantity],
      ["Maximum position", savedQuery.minimumPositionQuantity, savedQuery.maximumPositionQuantity],
      ["Entry value", savedQuery.minimumEntryNotional, savedQuery.maximumEntryNotional],
    ] as const;
    for (const [label, minimum, maximum] of ranges) {
      if (minimum !== null || maximum !== null) {
        details.push(Object.freeze({
          label,
          value: `${minimum ?? "No minimum"} to ${maximum ?? "No maximum"}`,
        }));
      }
    }
    return Object.freeze(details);
  }

  function openSaveViewDialog(): void {
    if (hasUnappliedChanges || isPending) return;
    setSaveViewError(null);
    setSaveViewName("");
    setSaveViewDialogOpen(true);
  }

  function saveCurrentView(): void {
    const name = saveViewName.trim();
    if (name.length < 1 || name.length > 80 || isSavingView) {
      setSaveViewError("Enter a view name between 1 and 80 characters.");
      return;
    }
    setSaveViewError(null);
    startSavingViewTransition(async () => {
      try {
        const result = await createTradeExplorerSavedView(Object.freeze({
          name,
          view: Object.freeze({
            viewVersion: TRADE_EXPLORER_SAVED_VIEW_VERSION,
            query: appliedQuery,
            resultView: appliedResultView,
            tradeSort: appliedTradeSort,
            sortDirection,
          }),
        }));
        if (!result.ok) {
          if (result.refreshRequired) {
            window.location.reload();
            return;
          }
          setSaveViewError(result.message);
          return;
        }
        setSavedViews(result.savedViews);
        setSaveViewDialogOpen(false);
        setSaveViewName("");
        setSavedViewsOpen(true);
      } catch {
        setSaveViewError(SAVED_VIEW_SAVE_FAILURE);
      }
    });
  }

  function openSavedView(savedView: TradeExplorerSavedView): void {
    const saved = savedView.view;
    sortDirectionRevisionRef.current += 1;
    setQuery(saved.query);
    setResultView(saved.resultView);
    setTradeSort(saved.tradeSort);
    setSortDirection(saved.sortDirection);
    setAdvanced(Boolean(
      saved.query.entryWeekday ||
      saved.query.entryTimeBucket ||
      saved.query.minimumHoldingSeconds ||
      saved.query.maximumHoldingSeconds ||
      saved.query.minimumEnteredQuantity ||
      saved.query.maximumEnteredQuantity ||
      saved.query.minimumPositionQuantity ||
      saved.query.maximumPositionQuantity ||
      saved.query.minimumEntryNotional ||
      saved.query.maximumEntryNotional ||
      saved.query.tagId ||
      saved.query.untaggedOnly ||
      saved.query.noteState ||
      saved.query.reviewIncompleteOnly ||
      saved.query.ruleId ||
      saved.query.dayNoteState ||
      saved.query.dayRuleId
    ));
    setSavedViewsOpen(false);
    run(saved.query, saved.tradeSort, saved.resultView, saved.sortDirection);
  }

  function toggleSavedViewDetails(savedViewId: string): void {
    setExpandedSavedViewIds((current) => {
      const next = new Set(current);
      if (next.has(savedViewId)) {
        next.delete(savedViewId);
      } else {
        next.add(savedViewId);
      }
      return next;
    });
  }

  async function downloadPdfReport(): Promise<void> {
    if (hasUnappliedChanges || isPending || isDownloadingReport) return;
    setReportError(null);
    setIsDownloadingReport(true);
    try {
      const response = await fetch("/api/platform/journal/analytics/trade-explorer-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: appliedQuery,
          resultView: appliedResultView,
          sortDirection,
          tradeSort: appliedTradeSort,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as Readonly<{
          message?: string;
          refreshRequired?: boolean;
        }> | null;
        if (body?.refreshRequired) {
          window.location.reload();
          return;
        }
        throw new Error(body?.message ?? REPORT_DOWNLOAD_FAILURE);
      }
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = /filename="([^"]+)"/u.exec(disposition)?.[1] ??
        `traderslink-trade-explorer-${appliedResultView}.pdf`;
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (downloadError) {
      setReportError(downloadError instanceof Error
        ? downloadError.message
        : REPORT_DOWNLOAD_FAILURE);
    } finally {
      setIsDownloadingReport(false);
    }
  }

  function run(
    nextQuery = query,
    nextTradeSort = tradeSort,
    nextResultView = resultView,
    nextSortDirection = sortDirection,
  ): void {
    const canonicalQuery = canonicalizeExactQueryFields(nextQuery);
    const canonicalTradeSort = tradeExplorerTradeSortForOutcome(
      nextTradeSort,
      canonicalQuery.outcome,
    );
    const sortDirectionRevision = sortDirectionRevisionRef.current;
    const requestNumber = previewRequestRef.current + 1;
    previewRequestRef.current = requestNumber;
    setError(null);
    setReportError(null);
    clearExpandedTrade();
    startTransition(async () => {
      try {
        const result = await runTradeExplorer(canonicalQuery, null, canonicalTradeSort);
        if (previewRequestRef.current !== requestNumber) return;
        if (!result.ok) {
          if (result.refreshRequired) {
            window.location.reload();
            return;
          }
          setError(result.message);
          return;
        }
        setQuery((current) => tradeExplorerQueriesMatch(
          canonicalizeExactQueryFields(current),
          canonicalQuery,
        )
          ? canonicalQuery
          : current);
        setAppliedQuery(canonicalQuery);
        setAppliedResultView(nextResultView);
        setTradeSort((current) => current === nextTradeSort ? canonicalTradeSort : current);
        setAppliedTradeSort(canonicalTradeSort);
        setSortMetricId(canonicalQuery.metricId);
        if (sortDirectionRevisionRef.current === sortDirectionRevision) {
          setSortDirection(nextSortDirection);
        }
        setPreview(result.preview);
        setPageCursors(Object.freeze([null]));
        setPageIndex(0);
        setGroupPageIndex(0);
      } catch {
        if (previewRequestRef.current !== requestNumber) return;
        setError(RESULTS_UPDATE_FAILURE);
      }
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

  function chooseTradeSort(nextTradeSort: TradeExplorerTradeSort): void {
    setTradeSort(nextTradeSort);
    run(query, nextTradeSort);
  }

  function chooseMoneyBasis(moneyBasis: "gross" | "net"): void {
    setQuery((current) => Object.freeze({
      ...current,
      moneyBasis,
      metricId: tradeExplorerMetricForMoneyBasis(current.metricId, moneyBasis),
    }));
    if (moneyBasis === "gross" && tradeSort.startsWith("trading_costs_")) {
      setTradeSort("closed_desc");
    }
  }

  function viewGrossResults(): void {
    const nextQuery = Object.freeze({
      ...query,
      moneyBasis: "gross" as const,
      metricId: tradeExplorerMetricForMoneyBasis(query.metricId, "gross"),
    });
    setQuery(nextQuery);
    run(nextQuery);
  }

  function emptyResults() {
    if (!onlyTradingCostsAreMissing) {
      return <Typography color="text.secondary">{emptyTradeMessage}</Typography>;
    }
    const count = preview.response.crossPartitionCounts.readyClosedCount;
    return (
      <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
        <Typography color="text.secondary">
          {appliedQuery.symbol} has {count} completed trade{count === 1 ? "" : "s"}, but Net P/L is unavailable because trading costs are incomplete.
        </Typography>
        <Button onClick={viewGrossResults} variant="outlined">
          View Gross P/L
        </Button>
      </Stack>
    );
  }

  function chooseOutcome(outcome: "win" | "loss" | "flat" | null): void {
    setQuery((current) => Object.freeze({
      ...current,
      outcome,
      metricId: tradeExplorerMetricForOutcome(current.metricId, outcome),
    }));
    setTradeSort((current) => tradeExplorerTradeSortForOutcome(current, outcome));
  }

  function chooseEntryTimeDetail(entryTimeBucketMinutes: 5 | 15 | 30 | 60): void {
    setQuery((current) => {
      const canonicalTime = canonicalTradeExplorerTimeInput(current.entryTimeBucket);
      const selectedMinute = canonicalTime === null || !/^\d{2}:\d{2}$/u.test(canonicalTime)
        ? null
        : Number(canonicalTime.slice(3));
      return Object.freeze({
        ...current,
        entryTimeBucketMinutes,
        entryTimeBucket: selectedMinute !== null && selectedMinute % entryTimeBucketMinutes === 0
          ? canonicalTime
          : null,
      });
    });
  }

  function chooseStatistic(metricId: string): void {
    const nextQuery = Object.freeze({ ...query, metricId });
    setQuery(nextQuery);
    run(
      nextQuery,
      tradeSort,
      resultView,
      tradeExplorerDefaultRankDirection(metricId),
    );
  }

  function chooseSortDirection(nextSortDirection: "descending" | "ascending"): void {
    sortDirectionRevisionRef.current += 1;
    setSortDirection(nextSortDirection);
    setGroupPageIndex(0);
  }

  function chooseResultView(nextView: ExplorerResultView): void {
    setResultView(nextView);
    const definition = nextView === "trades" ? null : RESULT_VIEWS[nextView];
    const metricId = nextView === "days"
      ? tradeExplorerMetricForMoneyBasis("net_pnl", query.moneyBasis)
      : tradeExplorerMetricForMoneyBasis(
          definition?.defaultSortMetricId ?? "total_trades",
          query.moneyBasis,
        );
    const nextQuery = Object.freeze({
      ...query,
      grouping: definition?.grouping ?? "closing_month",
      metricId,
      ...(nextView === "days" ? {} : {
        dayNoteState: null,
        dayRuleId: null,
        dayRuleVersionId: null,
        dayRuleStatus: null,
      }),
    });
    setQuery(nextQuery);
    run(nextQuery, tradeSort, nextView, "descending");
  }

  function choosePeriodGrouping(grouping: "closing_day" | "closing_iso_week" | "closing_month" | "closing_year"): void {
    const nextQuery = Object.freeze({ ...query, grouping });
    setQuery(nextQuery);
    run(nextQuery);
  }

  function loadTradePage(nextPageIndex: number, cursor: string | null): void {
    const requestNumber = previewRequestRef.current + 1;
    previewRequestRef.current = requestNumber;
    setError(null);
    clearExpandedTrade();
    startTransition(async () => {
      try {
        const result = await runTradeExplorer(appliedQuery, cursor, appliedTradeSort);
        if (previewRequestRef.current !== requestNumber) return;
        if (!result.ok) {
          if (result.refreshRequired) {
            window.location.reload();
            return;
          }
          setError(result.message);
          return;
        }
        setPreview(result.preview);
        setPageCursors((current) => nextPageIndex > pageIndex
          ? Object.freeze([...current.slice(0, pageIndex + 1), cursor])
          : current);
        setPageIndex(nextPageIndex);
      } catch {
        if (previewRequestRef.current !== requestNumber) return;
        setError(RESULTS_UPDATE_FAILURE);
      }
    });
  }

  function reset(): void {
    previewRequestRef.current += 1;
    sortDirectionRevisionRef.current += 1;
    clearExpandedTrade();
    setQuery(model.initialQuery);
    setAppliedQuery(model.initialQuery);
    setPreview(model.initialPreview);
    setResultView("trades");
    setAppliedResultView("trades");
    setTradeSort("closed_desc");
    setAppliedTradeSort("closed_desc");
    setSortMetricId(model.initialQuery.metricId);
    setSortDirection("descending");
    setPageCursors(Object.freeze([null]));
    setPageIndex(0);
    setGroupPageSize(25);
    setGroupPageIndex(0);
    setError(null);
    setReportError(null);
  }

  function chooseTagFilter(value: string): void {
    setQuery((current) => Object.freeze({
      ...current,
      tagId: value === "all" || value === "untagged" ? null : value,
      untaggedOnly: value === "untagged",
    }));
  }

  function chooseRuleFilter(value: string, target: "trade" | "day"): void {
    const options = target === "trade"
      ? model.annotationOptions.tradeRules
      : model.annotationOptions.dayRules;
    const selected = value === "all"
      ? null
      : options.find((rule) => `${rule.ruleId}:${rule.ruleVersionId}` === value) ?? null;
    const ruleId = selected?.ruleId ?? null;
    const ruleVersionId = selected?.ruleVersionId ?? null;
    setQuery((current) => Object.freeze(target === "trade" ? {
      ...current,
      ruleId,
      ruleVersionId,
      ruleStatus: null,
    } : {
      ...current,
      dayRuleId: ruleId,
      dayRuleVersionId: ruleVersionId,
      dayRuleStatus: null,
    }));
  }

  function renderFilterControls(compact: boolean) {
    const idSuffix = compact ? "-drawer" : "-desktop";
    return <>
      <Box sx={{
        display: "grid",
        gap: compact ? 2 : 1.25,
        gridTemplateColumns: compact
          ? "1fr"
          : { md: "repeat(3, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" },
      }}>
        <TextField fullWidth label="Closed from" onChange={(event) => patch("startDate", event.target.value)} size="small" type="date" value={query.startDate} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField fullWidth label="Closed to" onChange={(event) => patch("endDate", event.target.value)} size="small" type="date" value={query.endDate} slotProps={{ inputLabel: { shrink: true } }} />
        <Autocomplete
          autoHighlight
          fullWidth
          onChange={(_event, next) => patch("symbol", next)}
          options={model.symbols}
          renderInput={(params) => <TextField {...params} label="Ticker" size="small" />}
          value={query.symbol}
        />
        <SelectField idSuffix={idSuffix} label="Direction" onChange={(next) => patch("direction", next === "all" ? null : next as "long" | "short")} value={query.direction ?? "all"}>
          <MenuItem value="all">All directions</MenuItem><MenuItem value="long">Long</MenuItem><MenuItem value="short">Short</MenuItem>
        </SelectField>
        <SelectField idSuffix={idSuffix} label="Currency" onChange={(next) => patch("currency", next === "all" ? null : next)} value={query.currency ?? "all"}>
          <MenuItem value="all">All currencies</MenuItem>
          {model.currencies.map((currency) => <MenuItem key={currency} value={currency}>{currency}</MenuItem>)}
        </SelectField>
        <SelectField idSuffix={idSuffix} label="Trade type" onChange={(next) => patch("tradeClassification", next === "all" ? null : next as AnalyticsLabPlatformQuery["tradeClassification"])} value={query.tradeClassification ?? "all"}>
          <MenuItem value="all">All trade types</MenuItem><MenuItem value="day_trade">Day trade</MenuItem><MenuItem value="multi_day_trade">Multi-day trade</MenuItem>
        </SelectField>
        <SelectField idSuffix={idSuffix} label="Result basis" onChange={(next) => chooseMoneyBasis(next as "gross" | "net")} value={query.moneyBasis}>
          <MenuItem value="net">Net P/L</MenuItem><MenuItem value="gross">Gross P/L</MenuItem>
        </SelectField>
        <SelectField idSuffix={idSuffix} label="Result" onChange={(next) => chooseOutcome(next === "all" ? null : next as "win" | "loss" | "flat")} value={query.outcome ?? "all"}>
          <MenuItem value="all">All results</MenuItem><MenuItem value="win">Wins</MenuItem><MenuItem value="loss">Losses</MenuItem><MenuItem value="flat">Flat</MenuItem>
        </SelectField>
        <SelectField idSuffix={idSuffix} label="View" onChange={(next) => chooseResultView(next as ExplorerResultView)} value={resultView}>
          <MenuItem value="trades">Trades</MenuItem>
          <MenuItem value="days">Trading Days</MenuItem>
          <MenuItem value="tickers">Tickers</MenuItem>
          <MenuItem value="entry_times">Entry Times</MenuItem>
          <MenuItem value="exit_times">Exit Times</MenuItem>
          <MenuItem value="entry_weekday">Entry Weekday</MenuItem>
          <MenuItem value="direction">Direction</MenuItem>
          <MenuItem value="entered_quantity">Entered Quantity</MenuItem>
          <MenuItem value="entry_value">Entry Value</MenuItem>
          <MenuItem value="entry_price">Entry Price</MenuItem>
          <MenuItem value="holding_time">Holding Time</MenuItem>
          <MenuItem value="position_size">Position Size</MenuItem>
          <MenuItem value="periods">Periods</MenuItem>
        </SelectField>
        {resultView === "trades" ? (
          <SelectField idSuffix={idSuffix} label="Sort trades" onChange={(next) => chooseTradeSort(next as TradeExplorerTradeSort)} value={tradeSort}>
            {tradeSortOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
          </SelectField>
        ) : (
          <SelectField idSuffix={idSuffix} label="Rank by" onChange={chooseStatistic} value={statisticMetricIds.includes(query.metricId) ? query.metricId : statisticMetricIds[0] ?? "total_trades"}>
            {statisticGroups.map((group) => [
              <ListSubheader key={`${group.label}-heading`}>{group.label}</ListSubheader>,
              ...group.metricIds.flatMap((metricId) => {
                const item = explorerMetrics.get(metricId);
                return item ? [<MenuItem key={item.metricId} value={item.metricId}>{explorerMetricLabel(item.metricId, item.title)}</MenuItem>] : [];
              }),
            ])}
          </SelectField>
        )}
        {resultView === "trades" ? (
          <SelectField idSuffix={idSuffix} label="Results per page" onChange={(next) => choosePageSize(Number(next) as 12 | 24 | 50 | 100)} value={String(query.evidenceRows)}>
            <MenuItem value="12">12</MenuItem><MenuItem value="24">24</MenuItem><MenuItem value="50">50</MenuItem><MenuItem value="100">100</MenuItem>
          </SelectField>
        ) : null}
      </Box>
      <Button
        endIcon={<ExpandMoreRoundedIcon sx={{ transform: advanced ? "rotate(180deg)" : "none" }} />}
        onClick={() => setAdvanced((current) => !current)}
        sx={{ minHeight: 44, mt: 1.5 }}
      >
        More filters
      </Button>
      <Collapse in={advanced}>
        <Box sx={{ display: "grid", gap: compact ? 2 : 1.25, gridTemplateColumns: compact ? "1fr" : "repeat(3, minmax(0, 1fr))", mt: 1.5 }}>
          <SelectField idSuffix={idSuffix} label="Entry weekday" onChange={(next) => patch("entryWeekday", next === "all" ? null : next as AnalyticsLabPlatformQuery["entryWeekday"])} value={query.entryWeekday ?? "all"}>
            <MenuItem value="all">Any weekday</MenuItem>{["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => <MenuItem key={day} value={day}>{day.slice(0, 1).toUpperCase() + day.slice(1)}</MenuItem>)}
          </SelectField>
          <SelectField idSuffix={idSuffix} label="Time bucket detail" onChange={(next) => chooseEntryTimeDetail(Number(next) as 5 | 15 | 30 | 60)} value={String(query.entryTimeBucketMinutes)}>
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
          <SelectField idSuffix={idSuffix} label="Trade tag" onChange={chooseTagFilter} value={query.untaggedOnly ? "untagged" : query.tagId ?? "all"}>
            <MenuItem value="all">All tags</MenuItem>
            <MenuItem value="untagged">Untagged</MenuItem>
            {model.annotationOptions.tags.map((tag) => <MenuItem key={tag.tagId} value={tag.tagId}>{tag.name} ({tag.assignmentCount})</MenuItem>)}
          </SelectField>
          <SelectField idSuffix={idSuffix} label="Trade note" onChange={(next) => patch("noteState", next === "all" ? null : next as "present" | "missing")} value={query.noteState ?? "all"}>
            <MenuItem value="all">Any note state</MenuItem><MenuItem value="present">Note present</MenuItem><MenuItem value="missing">No note</MenuItem>
          </SelectField>
          <SelectField idSuffix={idSuffix} label="Review workflow" onChange={(next) => patch("reviewIncompleteOnly", next === "incomplete")} value={query.reviewIncompleteOnly ? "incomplete" : "all"}>
            <MenuItem value="all">All review states</MenuItem><MenuItem value="incomplete">Review incomplete</MenuItem>
          </SelectField>
          <SelectField idSuffix={idSuffix} label="Trade rule" onChange={(next) => chooseRuleFilter(next, "trade")} value={query.ruleId && query.ruleVersionId ? `${query.ruleId}:${query.ruleVersionId}` : "all"}>
            <MenuItem value="all">All trade rules</MenuItem>
            {model.annotationOptions.tradeRules.map((rule) => <MenuItem key={`${rule.ruleId}:${rule.ruleVersionId}`} value={`${rule.ruleId}:${rule.ruleVersionId}`}>{rule.title} · v{rule.versionNumber}</MenuItem>)}
          </SelectField>
          {query.ruleId ? (
            <SelectField idSuffix={idSuffix} label="Trade rule result" onChange={(next) => patch("ruleStatus", next === "all" ? null : next as TradeExplorerQuery["ruleStatus"])} value={query.ruleStatus ?? "all"}>
              <MenuItem value="all">Applicable trades</MenuItem><MenuItem value="followed">Followed</MenuItem><MenuItem value="broken">Broken</MenuItem><MenuItem value="not_reviewed">Not reviewed</MenuItem><MenuItem value="not_applicable">Not applicable</MenuItem>
            </SelectField>
          ) : null}
          {resultView === "days" ? (
            <>
              <SelectField idSuffix={idSuffix} label="Day note" onChange={(next) => patch("dayNoteState", next === "all" ? null : next as "present" | "missing")} value={query.dayNoteState ?? "all"}>
                <MenuItem value="all">Any day-note state</MenuItem><MenuItem value="present">Day note present</MenuItem><MenuItem value="missing">No day note</MenuItem>
              </SelectField>
              <SelectField idSuffix={idSuffix} label="Day rule" onChange={(next) => chooseRuleFilter(next, "day")} value={query.dayRuleId && query.dayRuleVersionId ? `${query.dayRuleId}:${query.dayRuleVersionId}` : "all"}>
                <MenuItem value="all">All day rules</MenuItem>
                {model.annotationOptions.dayRules.map((rule) => <MenuItem key={`${rule.ruleId}:${rule.ruleVersionId}`} value={`${rule.ruleId}:${rule.ruleVersionId}`}>{rule.title} · v{rule.versionNumber}</MenuItem>)}
              </SelectField>
              {query.dayRuleId ? (
                <SelectField idSuffix={idSuffix} label="Day rule result" onChange={(next) => patch("dayRuleStatus", next === "all" ? null : next as TradeExplorerQuery["dayRuleStatus"])} value={query.dayRuleStatus ?? "all"}>
                  <MenuItem value="all">Applicable days</MenuItem><MenuItem value="followed">Followed</MenuItem><MenuItem value="broken">Broken</MenuItem><MenuItem value="not_reviewed">Not reviewed</MenuItem><MenuItem value="not_applicable">Not applicable</MenuItem>
                </SelectField>
              ) : null}
            </>
          ) : null}
        </Box>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
          Tag filters use exact saved memberships. A trade can belong to more than one tag, so results from separate tag selections can overlap. Rule filters use the selected immutable rule version; they show association in this history, not cause.
        </Typography>
      </Collapse>
      {hasUnappliedChanges && !isPending ? (
        <Typography aria-live="polite" color="text.secondary" sx={{ mt: 1 }} variant="body2">
          Some controls have changed. Choose Update results to apply them.
        </Typography>
      ) : null}
    </>;
  }

  return (
    <Box component="fieldset" disabled={Boolean(offlineSavedAtUtc)} sx={{ border: 0, m: 0, minWidth: 0, p: 0 }}>
    <DashboardPage>
      <Typography component="h1" variant="h1">Trade Explorer</Typography>
      {offlineSavedAtUtc ? <OfflineSavedViewStatus savedAtUtc={offlineSavedAtUtc} /> : null}
      <DashboardPanel
        action={
          <>
            <Box sx={{ display: { xs: "block", md: "none" } }}>
              <DashboardPrimaryAction
                aria-label="Open Trade Explorer filters"
                onClick={() => setMobileFiltersOpen(true)}
                startIcon={<FilterAltRoundedIcon />}
                sx={{ minHeight: 44 }}
              >
                Filters
              </DashboardPrimaryAction>
            </Box>
            <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
              <DashboardSecondaryAction onClick={reset} startIcon={<RefreshRoundedIcon />}>Reset</DashboardSecondaryAction>
              <DashboardPrimaryAction disabled={isPending} onClick={() => run()} startIcon={<FilterAltRoundedIcon />}>
                {isPending ? "Updating" : "Update results"}
              </DashboardPrimaryAction>
            </Stack>
          </>
        }
        title="Explore trades"
      >
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <Stack direction="row" sx={{ alignItems: "center", columnGap: 1, flexWrap: "wrap", rowGap: 0.75 }}>
            <Chip label={resultView === "trades" ? "Trades" : RESULT_VIEWS[resultView].label} size="small" />
            {query.symbol ? <Chip label={query.symbol} size="small" variant="outlined" /> : null}
            {hasUnappliedChanges && !isPending ? (
              <Typography aria-live="polite" color="text.secondary" variant="body2">Filters need to be applied.</Typography>
            ) : null}
          </Stack>
        </Box>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          {renderFilterControls(false)}
        </Box>

        <Box sx={{ borderTop: 1, borderColor: "divider", mt: 2, pt: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }}>{activeView?.label ?? "Trades"}</Typography>
              {activeView ? (
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    {showPartitionColumn
                      ? "Results are ranked separately within each currency and trading timezone."
                      : <>{selectedStatistic ? `${explorerMetricLabel(selectedStatistic.metricId, selectedStatistic.title)}: ` : ""}<Box component="span" sx={{ color: financialOutcomeMetricColor(appliedQuery.metricId, preview.selectedMetric?.value) }}>{preview.selectedMetric ? formatExplorerMetric(preview.selectedMetric) : "N/A"}</Box></>}
                  </Typography>
                  {tradeSummaryPartition ? (
                    <Typography color="text.secondary" variant="body2">
                      Trading timezone: {tradeSummaryPartition.timezone ?? "Not recorded"}
                    </Typography>
                  ) : null}
                  {selectedRankingUnavailable ? (
                    <Typography color="text.secondary" variant="body2">
                      This Rank by result cannot be calculated for any matching group. Choose another result.
                    </Typography>
                  ) : null}
                </Box>
              ) : (
                <Box>
                  <Stack direction="row" sx={{ columnGap: 2, flexWrap: "wrap", rowGap: 0.25 }}>
                    {tradeSummary.map((item) => (
                      <Typography color="text.secondary" key={item.label} variant="body2">
                        {item.label}: <Box component="span" sx={{ color: item.valueColor ?? "text.primary", fontWeight: 700 }}>{item.value}</Box>
                      </Typography>
                    ))}
                  </Stack>
                  {tradeProfitFactorUnavailable ? (
                    <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                      Profit factor needs at least one winning trade and one losing trade in these results.
                    </Typography>
                  ) : null}
                </Box>
              )}
            </Box>
            <Stack direction="row" sx={{ columnGap: 1, flexWrap: "wrap", justifyContent: { xs: "flex-start", sm: "flex-end" }, rowGap: 1 }}>
              <DashboardSecondaryAction
                disabled={isPending || hasUnappliedChanges}
                onClick={openSaveViewDialog}
                startIcon={<BookmarkAddRoundedIcon />}
              >
                Save view
              </DashboardSecondaryAction>
              <DashboardSecondaryAction
                onClick={() => setSavedViewsOpen(true)}
                startIcon={<BookmarksRoundedIcon />}
              >
                Saved views
              </DashboardSecondaryAction>
              <DashboardSecondaryAction
                disabled={
                  isDownloadingReport ||
                  isPending ||
                  hasUnappliedChanges ||
                  preview.response.crossPartitionCounts.includedCount === 0 ||
                  (appliedResultView === "trades" && preview.evidence === null)
                }
                onClick={() => void downloadPdfReport()}
                startIcon={<DownloadRoundedIcon />}
              >
                {isDownloadingReport ? "Preparing PDF" : "Download PDF"}
              </DashboardSecondaryAction>
            </Stack>
          </Stack>
          {reportError ? <Alert severity="error" sx={{ mb: 1.5 }}>{reportError}</Alert> : null}
          {appliedQuery.moneyBasis === "net" ? (
            <Stack spacing={0.25} sx={{ mb: 1.5 }}>
              <Typography color="text.secondary" variant="body2">
                Manually entered trades with no fee entered are included in Net P/L.{" "}
                <MuiLink
                  component={NextLink}
                  href="/workspace?filter=fees_not_entered"
                  sx={{ fontWeight: 700 }}
                >
                  View no-fee trades
                </MuiLink>
              </Typography>
              <Typography color="text.secondary" variant="body2">
                When broker fee details are missing from imported trades, they are excluded from Net P/L.
              </Typography>
              {feeIncompleteTradeCount > 0 ? (
                <Typography color="text.secondary" variant="body2">
                  This report excludes{" "}
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {feeIncompleteTradeCount}
                  </Box>{" "}
                  {feeIncompleteTradeCount === 1 ? "trade" : "trades"} with missing fee details.
                </Typography>
              ) : null}
            </Stack>
          ) : null}
          {populationSummary.length > 0 ? (
            <Box
              component="section"
              sx={{
                bgcolor: "action.hover",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                mb: 2,
                p: 1.5,
              }}
            >
              <Typography component="h3" sx={{ fontWeight: 800, mb: 1 }} variant="subtitle1">
                Selected trades
              </Typography>
              <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" } }}>
                {populationSummary.map((item) => (
                  <Box key={item.metricId} sx={{ minWidth: 0 }}>
                    <Typography color="text.secondary" variant="caption">{item.label}</Typography>
                    <Typography
                      sx={{
                        color: financialOutcomeMetricColor(
                          item.metricId,
                          metric(tradeSummaryPartition, item.metricId)?.value,
                        ),
                        fontWeight: 800,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
                Percentiles use the selected trade population. Concentration is association in this history, not proof of cause.
              </Typography>
            </Box>
          ) : null}
          {activeView ? (
            <>
              <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, mb: 1.5 }}>
                {appliedResultView === "periods" ? (
                  <SelectField label="Period" onChange={(next) => choosePeriodGrouping(next as "closing_day" | "closing_iso_week" | "closing_month" | "closing_year")} value={appliedQuery.grouping}>
                    <MenuItem value="closing_day">Day</MenuItem><MenuItem value="closing_iso_week">Week</MenuItem><MenuItem value="closing_month">Month</MenuItem><MenuItem value="closing_year">Year</MenuItem>
                  </SelectField>
                ) : null}
                <SelectField label="Order" onChange={(next) => chooseSortDirection(next as "descending" | "ascending")} value={sortDirection}>
                  <MenuItem value="descending">Highest first</MenuItem><MenuItem value="ascending">Lowest first</MenuItem>
                </SelectField>
                <SelectField
                  label="Rows per page"
                  onChange={(next) => {
                    setGroupPageSize(Number(next) as 10 | 25 | 50 | 100);
                    setGroupPageIndex(0);
                  }}
                  value={String(groupPageSize)}
                >
                  <MenuItem value="10">10</MenuItem><MenuItem value="25">25</MenuItem><MenuItem value="50">50</MenuItem><MenuItem value="100">100</MenuItem>
                </SelectField>
              </Box>
              {visibleGroups.length === 0 ? (
                emptyResults()
              ) : (
                <>
                  <Stack spacing={1} sx={{ display: { xs: "flex", md: "none" } }}>
                    {visibleGroups.map((item) => (
                      <Box key={item.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                        <Typography sx={{ fontWeight: 800 }}>{item.label}</Typography>
                        {showPartitionColumn ? <Typography color="text.secondary" variant="caption">{item.partitionLabel}</Typography> : null}
                        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", mt: 1 }}>
                          {displayedColumns.map((column) => (
                            <Box key={column.label}>
                              <Typography color="text.secondary" variant="caption">{column.label}</Typography>
                              <Typography sx={{ color: !column.metricId || column.kind === "day_path" ? "text.primary" : financialOutcomeMetricColor(column.metricId, metric(item.group, column.metricId)?.value), fontWeight: 700 }}>
                                {groupColumnValue(item.group, column, item.timeZone)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                  <Box sx={{ display: { xs: "none", md: "block" } }}>
                    <HorizontalScrollRegion
                      label={`${activeView.label} results table`}
                      maxHeight={560}
                      minTableWidth={Math.max(760, 220 + (showPartitionColumn ? 150 : 0) + displayedColumns.length * 150)}
                      stickyFirstColumn
                    >
                      <Table size="small" stickyHeader>
                        <TableHead><TableRow><TableCell>{activeView.firstColumnLabel}</TableCell>{showPartitionColumn ? <TableCell>{partitionColumnLabel}</TableCell> : null}{displayedColumns.map((column) => <TableCell key={column.label}>{column.label}</TableCell>)}</TableRow></TableHead>
                        <TableBody>
                          {visibleGroups.map((item) => (
                            <TableRow hover key={item.id}>
                              <TableCell sx={{ fontWeight: 800, textTransform: ["entry_times", "exit_times"].includes(appliedResultView) ? "none" : "capitalize" }}>{item.label}</TableCell>
                              {showPartitionColumn ? <TableCell>{item.partitionLabel}</TableCell> : null}
                              {displayedColumns.map((column) => <TableCell key={column.label} sx={{ color: !column.metricId || column.kind === "day_path" ? "text.primary" : financialOutcomeMetricColor(column.metricId, metric(item.group, column.metricId)?.value) }}>{groupColumnValue(item.group, column, item.timeZone)}</TableCell>)}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </HorizontalScrollRegion>
                  </Box>
                </>
              )}
              {sortedGroups.length > groupPageSize ? (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: { xs: "space-between", md: "flex-end" }, mt: 1.5 }}>
                  <Button
                    disabled={groupPageIndex === 0}
                    onClick={() => setGroupPageIndex((current) => Math.max(0, current - 1))}
                    sx={{ minHeight: 44 }}
                    variant="outlined"
                  >
                    Previous
                  </Button>
                  <Typography color="text.secondary" sx={{ whiteSpace: "nowrap" }} variant="body2">
                    {groupPageStart + 1}-{groupPageEnd} of {sortedGroups.length}
                  </Typography>
                  <Button
                    disabled={groupPageEnd >= sortedGroups.length}
                    onClick={() => setGroupPageIndex((current) => current + 1)}
                    sx={{ minHeight: 44 }}
                    variant="outlined"
                  >
                    Next
                  </Button>
                </Stack>
              ) : null}
              {groupedResultsHaveUnavailable ? (
                <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                  N/A means the matching trades do not have the facts or mix of results needed for that calculation.
                </Typography>
              ) : null}
            </>
          ) : preview.evidence === null ? (
            preview.response.crossPartitionCounts.includedCount === 0
              ? emptyResults()
              : <Typography color="text.secondary">{preview.evidenceUnavailableReason ?? "Choose one currency to view individual trades."}</Typography>
          ) : preview.evidence.rows.length === 0 ? (
            emptyResults()
          ) : (
            <>
              <Stack spacing={1} sx={{ display: { xs: "flex", md: "none" } }}>
                {preview.evidence.rows.map((trade) => {
                  const expanded = expandedRoundTripId === trade.roundTripId;
                  const tradeTimeZone = preview.evidence?.timezone ?? "UTC";
                  const tradeCurrency = preview.evidence?.currency ?? null;
                  const cardFacts = [
                    ["Opened", `${trade.entryLocalDate} · ${tradeCloseTime(trade.openedAtUtc, tradeTimeZone)}`],
                    ["Closed", `${trade.closeLocalDate} · ${tradeCloseTime(trade.closedAtUtc, tradeTimeZone)}`],
                    ["Direction", trade.direction === "long" ? "Long" : "Short"],
                    ["Trade type", trade.tradeClassification === "day_trade" ? "Day trade" : "Multi-day trade"],
                    ["Shares entered", formatJournalAnalyticsDecimal(trade.enteredQuantityDecimal)],
                    ["Maximum shares held", formatJournalAnalyticsDecimal(trade.maximumPositionQuantityDecimal)],
                    ["Average entry", trade.averageEntryPriceDecimal ? money(trade.averageEntryPriceDecimal, tradeCurrency) : "N/A"],
                    ["Average exit", trade.averageExitPriceDecimal ? money(trade.averageExitPriceDecimal, tradeCurrency) : "N/A"],
                    ["Entry value", money(trade.entryNotionalDecimal, tradeCurrency)],
                    ["Return on entry value", trade.returnPercentDecimal === null || trade.returnPercentDecimal === undefined ? "N/A" : `${formatJournalAnalyticsDecimal(trade.returnPercentDecimal)}%`],
                    ["Holding time", formatJournalAnalyticsDuration(trade.holdingDurationMilliseconds)],
                    ["Trading costs", money(trade.tradingCostsDecimal, tradeCurrency)],
                    ["Execution structure", executionStructure(trade)],
                  ] as const;
                  return (
                    <Box component="article" key={trade.roundTripId} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 900 }}>{trade.displayedSymbol}</Typography>
                          <Typography sx={{ color: financialOutcomeColor(trade.selectedPnlDecimal), fontWeight: 900 }}>
                            {money(trade.selectedPnlDecimal, tradeCurrency)}
                          </Typography>
                        </Box>
                        <Button onClick={() => setReviewRoundTripId(trade.roundTripId)} size="small" variant="outlined">Review</Button>
                      </Stack>
                      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", mt: 1 }}>
                        {cardFacts.map(([label, factValue]) => (
                          <Box key={label} sx={{ gridColumn: label === "Execution structure" ? "1 / -1" : "auto" }}>
                            <Typography color="text.secondary" variant="caption">{label}</Typography>
                            <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }} variant="body2">{factValue}</Typography>
                          </Box>
                        ))}
                      </Box>
                      <Button onClick={() => void toggleTradeExecutions(trade.roundTripId)} sx={{ minHeight: 44, mt: 1 }}>
                        {expanded ? "Hide exact executions" : "Show exact executions"}
                      </Button>
                      {expanded ? (
                        <Box sx={{ bgcolor: "action.hover", borderRadius: 1, mt: 0.5, p: 1 }}>
                          {executionDetailsStatus === "loading" ? <Typography color="text.secondary">Loading executions…</Typography> : null}
                          {executionDetailsStatus === "error" ? <Alert severity="error">The executions could not be loaded.</Alert> : null}
                          {executionDetailsStatus === "ready" && expandedExecutions.length === 0 ? <Typography color="text.secondary">No executions are available for this trade.</Typography> : null}
                          {executionDetailsStatus === "ready" ? expandedExecutions.map((execution, index) => (
                            <Box key={`${execution.executed_at_utc}-${execution.side}-${index}`} sx={{ borderBottom: index < expandedExecutions.length - 1 ? 1 : 0, borderColor: "divider", py: 0.75 }}>
                              <Typography sx={{ fontWeight: 700 }} variant="body2">{executionTime(execution.executed_at_utc, tradeTimeZone)}</Typography>
                              <Typography color="text.secondary" variant="caption">
                                {execution.side === "buy" ? "Buy" : "Sell"} · {formatJournalAnalyticsDecimal(execution.quantity_decimal)} shares · {execution.price_decimal === null ? "Price not recorded" : money(execution.price_decimal, tradeCurrency)}
                              </Typography>
                            </Box>
                          )) : null}
                        </Box>
                      ) : null}
                    </Box>
                  );
                })}
              </Stack>
              <Box sx={{ display: { xs: "none", md: "block" } }}>
              <HorizontalScrollRegion label="Individual trades table" maxHeight={560} minTableWidth={1900} stickyFirstColumn>
                <Table
                  size="small"
                  stickyHeader
                  sx={{
                    width: "max-content",
                    "& > tbody > tr > td, & > thead > tr > th": {
                      px: 1,
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <TableHead><TableRow><TableCell>Ticker</TableCell><TableCell>Review</TableCell><TableCell>Opened</TableCell><TableCell>Closed</TableCell><TableCell>Direction</TableCell><TableCell>Trade type</TableCell><TableCell>Shares entered</TableCell><TableCell>Maximum shares held</TableCell><TableCell>Avg entry</TableCell><TableCell>Avg exit</TableCell><TableCell>Entry value</TableCell><TableCell>{appliedQuery.moneyBasis === "gross" ? "Gross P/L" : "Net P/L"}</TableCell><TableCell>Return on entry value</TableCell><TableCell>Hold</TableCell><TableCell>Trading costs</TableCell><TableCell>Execution structure</TableCell></TableRow></TableHead>
                  <TableBody>
                    {preview.evidence.rows.map((trade) => {
                      const expanded = expandedRoundTripId === trade.roundTripId;
                      return <Fragment key={trade.roundTripId}>
                        <TableRow
                          aria-label={`${expanded ? "Hide" : "Show"} executions for ${trade.displayedSymbol} closed ${trade.closeLocalDate}`}
                          aria-expanded={expanded}
                          hover
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            void toggleTradeExecutions(trade.roundTripId);
                          }}
                          onClick={() => void toggleTradeExecutions(trade.roundTripId)}
                          selected={expanded}
                          sx={{ cursor: "pointer" }}
                          tabIndex={0}
                        >
                          <TableCell sx={{ fontWeight: 800 }}>{trade.displayedSymbol}</TableCell>
                          <TableCell>
                            <Button
                              aria-label={`Review notes, tags and rules for ${trade.displayedSymbol} closed ${trade.closeLocalDate}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setReviewRoundTripId(trade.roundTripId);
                              }}
                              onKeyDown={(event) => event.stopPropagation()}
                              size="small"
                              sx={{ minHeight: 36 }}
                              variant="outlined"
                            >
                              Review
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Box>{trade.entryLocalDate}</Box>
                            <Typography color="text.secondary" variant="caption">
                              {tradeCloseTime(trade.openedAtUtc, preview.evidence?.timezone ?? "UTC")}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>{trade.closeLocalDate}</Box>
                            <Typography color="text.secondary" variant="caption">
                              {tradeCloseTime(trade.closedAtUtc, preview.evidence?.timezone ?? "UTC")}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textTransform: "capitalize" }}>{trade.direction}</TableCell>
                          <TableCell>{trade.tradeClassification === "day_trade" ? "Day trade" : "Multi-day trade"}</TableCell>
                          <TableCell>{formatJournalAnalyticsDecimal(trade.enteredQuantityDecimal)}</TableCell>
                          <TableCell>{formatJournalAnalyticsDecimal(trade.maximumPositionQuantityDecimal)}</TableCell>
                          <TableCell>{trade.averageEntryPriceDecimal ? money(trade.averageEntryPriceDecimal, preview.evidence?.currency ?? null) : "N/A"}</TableCell>
                          <TableCell>{trade.averageExitPriceDecimal ? money(trade.averageExitPriceDecimal, preview.evidence?.currency ?? null) : "N/A"}</TableCell>
                          <TableCell>{money(trade.entryNotionalDecimal, preview.evidence?.currency ?? null)}</TableCell>
                          <TableCell sx={{ color: financialOutcomeColor(trade.selectedPnlDecimal), fontWeight: 800 }}>{money(trade.selectedPnlDecimal, preview.evidence?.currency ?? null)}</TableCell>
                          <TableCell sx={{ color: financialOutcomeColor(trade.returnPercentDecimal) }}>{trade.returnPercentDecimal === null || trade.returnPercentDecimal === undefined ? "N/A" : `${formatJournalAnalyticsDecimal(trade.returnPercentDecimal)}%`}</TableCell>
                          <TableCell>{formatJournalAnalyticsDuration(trade.holdingDurationMilliseconds)}</TableCell>
                          <TableCell>{money(trade.tradingCostsDecimal, preview.evidence?.currency ?? null)}</TableCell>
                          <TableCell>{executionStructure(trade)}</TableCell>
                        </TableRow>
                        {expanded ? <TableRow>
                          <TableCell colSpan={16} sx={{ backgroundColor: "action.hover", boxShadow: "none !important", left: "auto !important", position: "static !important", px: 3, py: 2, whiteSpace: "normal" }}>
                            {executionDetailsStatus === "loading" ? <Typography color="text.secondary">Loading executions…</Typography> : null}
                            {executionDetailsStatus === "error" ? <Alert severity="error">The executions could not be loaded.</Alert> : null}
                            {executionDetailsStatus === "ready" && expandedExecutions.length === 0 ? <Typography color="text.secondary">No executions are available for this trade.</Typography> : null}
                            {executionDetailsStatus === "ready" && expandedExecutions.length > 0 ? <TableContainer sx={{ maxWidth: 650 }}>
                              <Table aria-label={`${trade.displayedSymbol} trade executions`} size="small" sx={{ tableLayout: "fixed" }}>
                                <TableHead><TableRow><TableCell sx={{ width: 230 }}>Executed</TableCell><TableCell sx={{ width: 90 }}>Side</TableCell><TableCell sx={{ width: 110 }}>Shares</TableCell><TableCell sx={{ width: 110 }}>Price</TableCell></TableRow></TableHead>
                                <TableBody>{expandedExecutions.map((execution, index) => <TableRow key={`${execution.executed_at_utc}-${execution.side}-${index}`}>
                                  <TableCell>{executionTime(execution.executed_at_utc, preview.evidence?.timezone ?? "UTC")}</TableCell>
                                  <TableCell sx={{ textTransform: "capitalize" }}>{execution.side}</TableCell>
                                  <TableCell>{formatJournalAnalyticsDecimal(execution.quantity_decimal)}</TableCell>
                                  <TableCell>{execution.price_decimal === null ? "Not recorded" : money(execution.price_decimal, preview.evidence?.currency ?? null)}</TableCell>
                                </TableRow>)}</TableBody>
                              </Table>
                            </TableContainer> : null}
                          </TableCell>
                        </TableRow> : null}
                      </Fragment>;
                    })}
                  </TableBody>
                </Table>
              </HorizontalScrollRegion>
              </Box>
              {tradeRowsHaveUnavailable ? (
                <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                  N/A means this trade does not have the confirmed details needed for that value.
                </Typography>
              ) : null}
            </>
          )}
          {!activeView && preview.evidence && (pageIndex > 0 || preview.evidence.continuationCursor) ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: { xs: "space-between", md: "flex-end" }, mt: 1.5 }}>
              <Button disabled={isPending || pageIndex === 0} onClick={() => loadTradePage(pageIndex - 1, pageCursors[pageIndex - 1] ?? null)} sx={{ minHeight: 44 }} variant="outlined">Previous</Button>
              <Typography color="text.secondary" sx={{ whiteSpace: "nowrap" }} variant="body2">Page {pageIndex + 1}</Typography>
              <Button disabled={isPending || !preview.evidence.continuationCursor} onClick={() => loadTradePage(pageIndex + 1, preview.evidence!.continuationCursor)} sx={{ minHeight: 44 }} variant="outlined">Next</Button>
            </Stack>
          ) : null}
        </Box>
      </DashboardPanel>

      <Drawer
        anchor="right"
        onClose={() => setSavedViewsOpen(false)}
        open={savedViewsOpen}
        slotProps={{
          paper: {
            sx: {
              height: "100dvh",
              maxWidth: 440,
              width: "100%",
            },
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              borderBottom: 1,
              borderColor: "divider",
              justifyContent: "space-between",
              px: 2,
              py: 1.25,
            }}
          >
            <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">Saved views</Typography>
            <IconButton aria-label="Close saved views" onClick={() => setSavedViewsOpen(false)} sx={{ minHeight: 44, minWidth: 44 }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
            {savedViews.length === 0 ? (
              <Typography color="text.secondary">
                No saved views yet. Apply your filters, then choose Save view.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {savedViews.map((savedView) => {
                  const detailsExpanded = expandedSavedViewIds.has(savedView.savedViewId);
                  const detailsId = `saved-view-details-${savedView.savedViewId}`;
                  return (
                    <Box
                      component="article"
                      key={savedView.savedViewId}
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        overflow: "hidden",
                        width: "100%",
                        "&:hover": {
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <ButtonBase
                        aria-controls={detailsId}
                        aria-expanded={detailsExpanded}
                        focusRipple
                        onClick={() => toggleSavedViewDetails(savedView.savedViewId)}
                        sx={{
                          alignItems: "center",
                          display: "flex",
                          justifyContent: "space-between",
                          minHeight: 68,
                          p: 2,
                          textAlign: "left",
                          width: "100%",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Box sx={{ minWidth: 0, pr: 1, width: "100%" }}>
                          <Typography noWrap sx={{ fontWeight: 800 }}>{savedView.name}</Typography>
                          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                            Created {savedViewCreatedDate(savedView.createdAtUtc)}
                          </Typography>
                        </Box>
                        <ExpandMoreRoundedIcon
                          aria-hidden="true"
                          sx={{
                            color: "text.secondary",
                            flexShrink: 0,
                            transform: detailsExpanded ? "rotate(180deg)" : "none",
                            transition: (theme) => theme.transitions.create("transform"),
                          }}
                        />
                      </ButtonBase>
                      <Collapse id={detailsId} in={detailsExpanded} unmountOnExit>
                        <Box sx={{ borderTop: 1, borderColor: "divider", px: 2, pb: 1, pt: 1.5 }}>
                          <Stack component="dl" spacing={0.5} sx={{ m: 0, width: "100%" }}>
                            {savedViewDetails(savedView.view).map((detail) => (
                              <Box
                                component="div"
                                key={`${detail.label}:${detail.value}`}
                                sx={{ display: "grid", gap: 1, gridTemplateColumns: "88px minmax(0, 1fr)" }}
                              >
                                <Typography color="text.secondary" component="dt" variant="body2">{detail.label}</Typography>
                                <Typography component="dd" sx={{ m: 0 }} variant="body2">{detail.value}</Typography>
                              </Box>
                            ))}
                          </Stack>
                          <ButtonBase
                            aria-label={`Open saved view ${savedView.name}`}
                            focusRipple
                            onClick={() => openSavedView(savedView)}
                            sx={{
                              borderRadius: 1,
                              color: "primary.main",
                              display: "flex",
                              justifyContent: "flex-start",
                              minHeight: 44,
                              mt: 0.75,
                              px: 1,
                              width: "100%",
                              "&:hover": { bgcolor: "action.hover" },
                            }}
                          >
                            <Typography sx={{ fontWeight: 800 }} variant="body2">Open view</Typography>
                            <ArrowForwardRoundedIcon fontSize="small" sx={{ ml: 0.5 }} />
                          </ButtonBase>
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      </Drawer>

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => {
          if (!isSavingView) setSaveViewDialogOpen(false);
        }}
        open={saveViewDialogOpen}
      >
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            saveCurrentView();
          }}
        >
          <DialogTitle sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", pb: 1 }}>
            Save view
            <IconButton
              aria-label="Close save view dialog"
              disabled={isSavingView}
              onClick={() => setSaveViewDialogOpen(false)}
              sx={{ minHeight: 44, minWidth: 44 }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              error={saveViewName.trim().length > 80}
              fullWidth
              helperText={`${saveViewName.trim().length}/80`}
              slotProps={{ htmlInput: { maxLength: 80 } }}
              label="View name"
              onChange={(event) => {
                setSaveViewName(event.target.value);
                setSaveViewError(null);
              }}
              required
              value={saveViewName}
            />
            <Box sx={{ bgcolor: "action.hover", borderRadius: 1, mt: 2, p: 1.5 }}>
              <Typography sx={{ fontWeight: 800 }} variant="body2">This saves the current Explorer setup</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                {viewLabel(appliedResultView)} · {savedViewDate(appliedQuery.startDate)} to {savedViewDate(appliedQuery.endDate)} · {appliedQuery.moneyBasis === "gross" ? "Gross P/L" : "Net P/L"} · {appliedQuery.outcome === null ? "All results" : appliedQuery.outcome === "win" ? "Wins" : appliedQuery.outcome === "loss" ? "Losses" : "Flat"}
              </Typography>
            </Box>
            {saveViewError ? <Alert severity="error" sx={{ mt: 2 }}>{saveViewError}</Alert> : null}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <DashboardSecondaryAction disabled={isSavingView} onClick={() => setSaveViewDialogOpen(false)}>
              Cancel
            </DashboardSecondaryAction>
            <DashboardPrimaryAction disabled={isSavingView || saveViewName.trim().length < 1} type="submit">
              {isSavingView ? "Saving" : "Save view"}
            </DashboardPrimaryAction>
          </DialogActions>
        </Box>
      </Dialog>

      <Drawer
          anchor="right"
          onClose={() => setMobileFiltersOpen(false)}
          open={mobileFiltersOpen}
          slotProps={{
            paper: {
              sx: {
                height: "100dvh",
                maxWidth: 480,
                width: "100%",
              },
            },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                borderBottom: 1,
                borderColor: "divider",
                justifyContent: "space-between",
                px: 2,
                py: 1.25,
              }}
            >
              <Box>
                <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">Filter trades</Typography>
                <Typography color="text.secondary" variant="body2">Choose the trades and results to explore.</Typography>
              </Box>
              <IconButton aria-label="Close Trade Explorer filters" onClick={() => setMobileFiltersOpen(false)} sx={{ minHeight: 44, minWidth: 44 }}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, py: 2 }}>
              {renderFilterControls(true)}
            </Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                borderTop: 1,
                borderColor: "divider",
                pb: "calc(12px + env(safe-area-inset-bottom))",
                px: 2,
                pt: 1.5,
              }}
            >
              <DashboardSecondaryAction
                fullWidth
                onClick={() => {
                  reset();
                  setMobileFiltersOpen(false);
                }}
                startIcon={<RefreshRoundedIcon />}
                sx={{ minHeight: 44 }}
              >
                Reset
              </DashboardSecondaryAction>
              <DashboardPrimaryAction
                disabled={isPending}
                fullWidth
                onClick={() => {
                  run();
                  setMobileFiltersOpen(false);
                }}
                startIcon={<FilterAltRoundedIcon />}
                sx={{ minHeight: 44 }}
              >
                {isPending ? "Updating" : "Apply"}
              </DashboardPrimaryAction>
            </Stack>
          </Box>
      </Drawer>

      {offlineSavedAtUtc ? null : <TradeExplorerReviewEditor
        expectedAccountSelectionRef={model.expectedAccountSelectionRef}
        onClose={() => setReviewRoundTripId(null)}
        onSelectTrade={setReviewRoundTripId}
        open={reviewOpen}
        selectedRoundTripId={reviewRoundTripId}
        trades={reviewTargets}
      />}

      {error ? <Alert severity="error">{error}</Alert> : null}
    </DashboardPage>
    </Box>
  );
}
