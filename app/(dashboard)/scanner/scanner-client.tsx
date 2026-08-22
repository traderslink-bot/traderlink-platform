"use client";

import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ScannerFilterId, ScannerRunRequest, ScannerRunResult } from "@/src/modules/scanner/scanner-contract";

import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../dashboard-template";

const resultColumns = Object.freeze([
  "Symbol",
  "Company",
  "Last",
  "Change",
  "Volume",
  "Market cap",
  "Updated",
]);

function formatUpdatedAt(updatedAtUtc: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(updatedAtUtc));
}

function MobileResultFact({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography color="text.secondary" variant="caption">{label}</Typography>
      <Typography sx={{ fontWeight: 700 }} variant="body2">{value}</Typography>
    </Stack>
  );
}

const filterGroups = Object.freeze([
  { id: "market", label: "Market & trading" },
  { id: "fundamentals", label: "Fundamentals" },
  { id: "technical", label: "Indicators" },
  { id: "patterns", label: "Chart patterns" },
  { id: "sentiment", label: "Sentiment & ownership" },
  { id: "options", label: "Options" },
] as const);

type FilterGroup = (typeof filterGroups)[number]["id"];
type FilterKind = "range" | "choice" | "signal";

type FilterDefinition = {
  id: string;
  group: FilterGroup;
  kind: FilterKind;
  label: string;
  detail: string;
  unit?: string;
  choices?: readonly string[];
};

const filterLibrary = Object.freeze([
  { id: "price", group: "market", kind: "range", label: "Price", detail: "Current share price", unit: "$" },
  { id: "market-cap", group: "market", kind: "range", label: "Market cap", detail: "Total company value", unit: "$" },
  { id: "daily-change", group: "market", kind: "range", label: "Price change", detail: "Move over a selected period", unit: "%" },
  { id: "amplitude", group: "market", kind: "range", label: "Daily range", detail: "High-to-low range over a selected period", unit: "%" },
  { id: "average-volume", group: "market", kind: "range", label: "Average volume", detail: "Average shares traded over a selected period", unit: "shares" },
  { id: "average-turnover", group: "market", kind: "range", label: "Average turnover", detail: "Average dollar value traded", unit: "$" },
  { id: "turnover-rate", group: "market", kind: "range", label: "Turnover rate", detail: "Shares traded relative to shares available", unit: "%" },
  { id: "pe", group: "market", kind: "range", label: "P/E", detail: "Price-to-earnings ratio" },
  { id: "pe-ttm", group: "market", kind: "range", label: "P/E (TTM)", detail: "Price-to-earnings using trailing 12 months" },
  { id: "pb", group: "market", kind: "range", label: "P/B", detail: "Price-to-book ratio" },
  { id: "dividend-yield", group: "market", kind: "range", label: "Dividend yield", detail: "Annual dividend yield", unit: "%" },
  { id: "listing-date", group: "market", kind: "range", label: "Listed since", detail: "How long the stock has been listed", unit: "days" },
  { id: "security-type", group: "market", kind: "choice", label: "Security type", detail: "Limit results to available instrument types", choices: ["Common stocks", "Has options", "Has ADR", "Has warrants", "Has futures"] },
  { id: "net-profit", group: "fundamentals", kind: "range", label: "Net profit", detail: "Latest reported profit", unit: "$" },
  { id: "profit-growth", group: "fundamentals", kind: "range", label: "Profit growth", detail: "Growth in reported profit", unit: "%" },
  { id: "revenue", group: "fundamentals", kind: "range", label: "Revenue", detail: "Latest reported revenue", unit: "$" },
  { id: "revenue-growth", group: "fundamentals", kind: "range", label: "Revenue growth", detail: "Growth in reported revenue", unit: "%" },
  { id: "net-margin", group: "fundamentals", kind: "range", label: "Net margin", detail: "Profit after costs as a percentage of revenue", unit: "%" },
  { id: "gross-margin", group: "fundamentals", kind: "range", label: "Gross margin", detail: "Revenue left after direct costs", unit: "%" },
  { id: "debt-ratio", group: "fundamentals", kind: "range", label: "Debt ratio", detail: "Debt relative to the company’s assets", unit: "%" },
  { id: "roe", group: "fundamentals", kind: "range", label: "Return on equity", detail: "Profit generated from shareholder equity", unit: "%" },
  { id: "eps", group: "fundamentals", kind: "range", label: "Earnings per share", detail: "Latest basic EPS", unit: "$" },
  { id: "float-market-cap", group: "fundamentals", kind: "range", label: "Float market cap", detail: "Value of shares available to trade", unit: "$" },
  { id: "ps-ttm", group: "fundamentals", kind: "range", label: "P/S (TTM)", detail: "Price-to-sales using trailing 12 months" },
  { id: "price-vs-average", group: "technical", kind: "signal", label: "Price versus MA or EMA", detail: "Position or crossover against a moving average", choices: ["Price above", "Price below", "Price crosses above", "Price crosses below"] },
  { id: "kdj", group: "technical", kind: "signal", label: "KDJ", detail: "KDJ crossover, top/bottom, or divergence", choices: ["Golden cross", "Death cross", "Top divergence", "Bottom divergence"] },
  { id: "macd", group: "technical", kind: "signal", label: "MACD", detail: "MACD crossover or divergence", choices: ["Bullish crossover", "Bearish crossover", "Top divergence", "Bottom divergence"] },
  { id: "rsi", group: "technical", kind: "signal", label: "RSI", detail: "RSI crossover or divergence", choices: ["Bullish crossover", "Bearish crossover", "Top divergence", "Bottom divergence"] },
  { id: "bollinger", group: "technical", kind: "signal", label: "Bollinger Bands", detail: "Price location or crossover around the bands", choices: ["Breaks above upper band", "Breaks below lower band", "Above middle band", "Below middle band"] },
  { id: "trend-pattern", group: "technical", kind: "choice", label: "Trend pattern", detail: "Indicator-pattern conditions", choices: ["MA bullish alignment", "MA bearish alignment", "EMA bullish alignment", "EMA bearish alignment", "Any bullish signal", "Any bearish signal"] },
  { id: "bullish-chart-pattern", group: "patterns", kind: "choice", label: "Bullish chart pattern", detail: "Recognized from daily or hourly candles", choices: ["W bottom", "Triple bottom", "Head and shoulders bottom", "Rounding bottom", "Megaphone bottom", "Bull flag", "Bullish symmetrical triangle", "Bullish diamond", "Bullish wedge", "Bullish triangle", "Any bullish pattern"] },
  { id: "bearish-chart-pattern", group: "patterns", kind: "choice", label: "Bearish chart pattern", detail: "Recognized from daily or hourly candles", choices: ["W top", "Triple top", "Head and shoulders top", "Rounding top", "Megaphone top", "Bear flag", "Bearish symmetrical triangle", "Bearish diamond", "Bearish wedge", "Bearish triangle", "Any bearish pattern"] },
  { id: "chip-profit", group: "sentiment", kind: "range", label: "Chip profit ratio", detail: "Estimated profitable-position ratio", unit: "%" },
  { id: "chip-overlap", group: "sentiment", kind: "range", label: "Chip overlap", detail: "How closely market participants’ cost bases cluster", unit: "%" },
  { id: "beta", group: "sentiment", kind: "range", label: "Beta", detail: "Sensitivity to the overall market" },
  { id: "trade-heat", group: "sentiment", kind: "range", label: "Trading heat", detail: "Relative market-trading interest" },
  { id: "search-heat", group: "sentiment", kind: "range", label: "Search heat", detail: "Relative investor search interest" },
  { id: "combined-heat", group: "sentiment", kind: "range", label: "Combined heat", detail: "Combined trading and search interest" },
  { id: "institutional-holdings", group: "sentiment", kind: "range", label: "Institutional holdings", detail: "Institutional ownership", unit: "%" },
  { id: "analyst-rating", group: "sentiment", kind: "choice", label: "Analyst rating", detail: "Available analyst-rating categories", choices: ["Strong buy", "Buy", "Hold", "Sell", "Strong sell"] },
  { id: "target-price", group: "sentiment", kind: "range", label: "Analyst target price", detail: "Available analyst target", unit: "$" },
  { id: "morningstar-rating", group: "sentiment", kind: "choice", label: "Morningstar rating", detail: "Available Morningstar star rating", choices: ["5 stars", "4 stars", "3 stars", "2 stars", "1 star"] },
  { id: "broker-concentration", group: "sentiment", kind: "range", label: "Broker concentration", detail: "Broker holding concentration", unit: "%" },
  { id: "broker-holding-change", group: "sentiment", kind: "range", label: "Broker holding change", detail: "Change in broker holdings", unit: "%" },
  { id: "option-iv", group: "options", kind: "range", label: "Implied volatility", detail: "Options implied volatility", unit: "%" },
  { id: "option-iv-rank", group: "options", kind: "range", label: "IV rank", detail: "Implied volatility rank", unit: "%" },
  { id: "option-iv-percentile", group: "options", kind: "range", label: "IV percentile", detail: "Implied volatility percentile", unit: "%" },
  { id: "option-earnings-iv", group: "options", kind: "range", label: "Earnings IV", detail: "Implied volatility around earnings", unit: "%" },
  { id: "option-hv", group: "options", kind: "range", label: "Historical volatility", detail: "Historical price volatility", unit: "%" },
  { id: "option-volume", group: "options", kind: "range", label: "Option volume", detail: "Options contracts traded" },
  { id: "option-open-interest", group: "options", kind: "range", label: "Option open interest", detail: "Open options contracts" },
] satisfies readonly FilterDefinition[]);

type FilterDraft = {
  definitionId: string;
  lower: string;
  upper: string;
  averageType: "MA" | "EMA";
  period: "1" | "5" | "20" | "60";
  averageLength: "5" | "9" | "10" | "20" | "50" | "100" | "200";
  timeframe: "1 minute" | "5 minutes" | "15 minutes" | "1 hour" | "Daily" | "Weekly" | "Monthly";
  choice: string;
};

type AddedFilter = FilterDraft & {
  id: string;
  label: string;
};

const initialDraft: FilterDraft = {
  averageLength: "9",
  averageType: "EMA",
  choice: "",
  definitionId: "price",
  lower: "",
  period: "1",
  timeframe: "Daily",
  upper: "",
};

function conditionLabel(definition: FilterDefinition, draft: FilterDraft) {
  if (definition.kind === "range") {
    const lower = draft.lower ? `${definition.unit ? `${definition.unit} ` : ""}${draft.lower} and above` : "no minimum";
    const upper = draft.upper ? `${definition.unit ? `${definition.unit} ` : ""}${draft.upper} and below` : "no maximum";
    const period = definition.id === "daily-change" || definition.id === "amplitude" || definition.id === "average-volume" || definition.id === "average-turnover" || definition.id === "turnover-rate"
      ? ` over ${draft.period} day${draft.period === "1" ? "" : "s"}`
      : "";
    return `${definition.label}: ${lower}, ${upper}${period}`;
  }

  const average = definition.id === "price-vs-average"
    ? ` ${draft.averageType} ${draft.averageLength}`
    : "";
  const timeframe = definition.kind === "signal" ? ` on ${draft.timeframe}` : "";
  return `${definition.label}: ${draft.choice || "Choose a condition"}${average}${timeframe}`;
}

type ReadyScanner = Readonly<{
  id: string;
  label: string;
  request: ScannerRunRequest;
}>;

type ReadyScannerGroup = Readonly<{
  id: string;
  label: string;
  scanners: readonly ReadyScanner[];
}>;

function presetFilter(filter: ScannerRunRequest["filters"][number], scannerId: string, index: number): AddedFilter {
  const definition = filterLibrary.find((candidate) => candidate.id === filter.id);
  const draft: FilterDraft = {
    ...initialDraft,
    ...filter,
    definitionId: filter.id,
    lower: filter.lower ?? "",
    upper: filter.upper ?? "",
  };
  return {
    ...draft,
    id: `${scannerId}-${index}`,
    label: definition ? conditionLabel(definition, draft) : filter.id,
  };
}

const readyScannerGroups = Object.freeze([
  {
    id: "market-activity",
    label: "Market activity",
    scanners: [
      { id: "biggest-percentage-move", label: "Biggest percentage move", request: { filters: [], limit: 25, sortBy: "daily-change" } },
      { id: "most-volume", label: "Most volume", request: { filters: [], limit: 25, sortBy: "average-volume" } },
      { id: "highest-trading-heat", label: "Highest trading heat", request: { filters: [], limit: 25, sortBy: "trade-heat" } },
      { id: "most-option-volume", label: "Most option volume", request: { filters: [], limit: 25, sortBy: "option-volume" } },
      { id: "largest-market-cap", label: "Largest market cap", request: { filters: [], limit: 25, sortBy: "market-cap" } },
    ],
  },
  {
    id: "price-volume",
    label: "Price & volume",
    scanners: [
      { id: "under-5-most-volume", label: "Under $5 by volume", request: { filters: [{ id: "price", upper: "5" }], limit: 25, sortBy: "average-volume" } },
      { id: "under-10-most-volume", label: "Under $10 by volume", request: { filters: [{ id: "price", upper: "10" }], limit: 25, sortBy: "average-volume" } },
      { id: "under-20-most-volume", label: "Under $20 by volume", request: { filters: [{ id: "price", upper: "20" }], limit: 25, sortBy: "average-volume" } },
      { id: "million-share-average-volume", label: "1M+ average volume", request: { filters: [{ id: "average-volume", lower: "1000000", period: "20" }], limit: 25, sortBy: "average-volume" } },
      { id: "ten-million-share-average-volume", label: "10M+ average volume", request: { filters: [{ id: "average-volume", lower: "10000000", period: "20" }], limit: 25, sortBy: "average-volume" } },
      { id: "high-turnover", label: "High turnover rate", request: { filters: [{ id: "turnover-rate", lower: "5", period: "1" }], limit: 25, sortBy: "daily-change" } },
      { id: "wide-daily-range", label: "5%+ daily range", request: { filters: [{ id: "amplitude", lower: "5", period: "1" }], limit: 25, sortBy: "daily-change" } },
      { id: "up-10-percent", label: "Up 10% or more", request: { filters: [{ id: "daily-change", lower: "10", period: "1" }], limit: 25, sortBy: "daily-change" } },
      { id: "down-10-percent", label: "Down 10% or more", request: { filters: [{ id: "daily-change", upper: "-10", period: "1" }], limit: 25, sortBy: "daily-change" } },
    ],
  },
  {
    id: "moving-averages",
    label: "Moving averages",
    scanners: [
      { id: "above-daily-ema-9", label: "Above daily EMA 9", request: { filters: [{ id: "price-vs-average", averageLength: "9", averageType: "EMA", choice: "Price above", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "above-daily-ema-20", label: "Above daily EMA 20", request: { filters: [{ id: "price-vs-average", averageLength: "20", averageType: "EMA", choice: "Price above", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "above-daily-ema-50", label: "Above daily EMA 50", request: { filters: [{ id: "price-vs-average", averageLength: "50", averageType: "EMA", choice: "Price above", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "above-daily-ma-200", label: "Above daily MA 200", request: { filters: [{ id: "price-vs-average", averageLength: "200", averageType: "MA", choice: "Price above", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "crosses-daily-ema-9", label: "Crosses above daily EMA 9", request: { filters: [{ id: "price-vs-average", averageLength: "9", averageType: "EMA", choice: "Price crosses above", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "crosses-daily-ema-20", label: "Crosses above daily EMA 20", request: { filters: [{ id: "price-vs-average", averageLength: "20", averageType: "EMA", choice: "Price crosses above", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "ema-bullish-alignment", label: "Daily EMA bullish alignment", request: { filters: [{ id: "trend-pattern", choice: "EMA bullish alignment", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "ma-bullish-alignment", label: "Daily MA bullish alignment", request: { filters: [{ id: "trend-pattern", choice: "MA bullish alignment", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "below-daily-ema-9", label: "Below daily EMA 9", request: { filters: [{ id: "price-vs-average", averageLength: "9", averageType: "EMA", choice: "Price below", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "ema-bearish-alignment", label: "Daily EMA bearish alignment", request: { filters: [{ id: "trend-pattern", choice: "EMA bearish alignment", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
    ],
  },
  {
    id: "momentum",
    label: "Momentum",
    scanners: [
      { id: "bullish-macd-crossover", label: "Bullish daily MACD crossover", request: { filters: [{ id: "macd", choice: "Bullish crossover", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "bullish-rsi-crossover", label: "Bullish daily RSI crossover", request: { filters: [{ id: "rsi", choice: "Bullish crossover", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "bearish-macd-crossover", label: "Bearish daily MACD crossover", request: { filters: [{ id: "macd", choice: "Bearish crossover", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "bearish-rsi-crossover", label: "Bearish daily RSI crossover", request: { filters: [{ id: "rsi", choice: "Bearish crossover", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "kdj-golden-cross", label: "Daily KDJ golden cross", request: { filters: [{ id: "kdj", choice: "Golden cross", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "kdj-death-cross", label: "Daily KDJ death cross", request: { filters: [{ id: "kdj", choice: "Death cross", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "breaks-bollinger-upper", label: "Breaks above daily Bollinger band", request: { filters: [{ id: "bollinger", choice: "Breaks above upper band", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "breaks-bollinger-lower", label: "Breaks below daily Bollinger band", request: { filters: [{ id: "bollinger", choice: "Breaks below lower band", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "any-bullish-signal", label: "Any bullish daily signal", request: { filters: [{ id: "trend-pattern", choice: "Any bullish signal", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "any-bearish-signal", label: "Any bearish daily signal", request: { filters: [{ id: "trend-pattern", choice: "Any bearish signal", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
    ],
  },
  {
    id: "chart-patterns",
    label: "Chart patterns",
    scanners: [
      { id: "bullish-chart-patterns", label: "Bullish daily chart patterns", request: { filters: [{ id: "bullish-chart-pattern", choice: "Any bullish pattern", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "bearish-chart-patterns", label: "Bearish daily chart patterns", request: { filters: [{ id: "bearish-chart-pattern", choice: "Any bearish pattern", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "w-bottom", label: "Daily W bottom", request: { filters: [{ id: "bullish-chart-pattern", choice: "W bottom", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "w-top", label: "Daily W top", request: { filters: [{ id: "bearish-chart-pattern", choice: "W top", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "bull-flag", label: "Daily bull flag", request: { filters: [{ id: "bullish-chart-pattern", choice: "Bull flag", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "bear-flag", label: "Daily bear flag", request: { filters: [{ id: "bearish-chart-pattern", choice: "Bear flag", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "head-shoulders-bottom", label: "Head and shoulders bottom", request: { filters: [{ id: "bullish-chart-pattern", choice: "Head and shoulders bottom", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "head-shoulders-top", label: "Head and shoulders top", request: { filters: [{ id: "bearish-chart-pattern", choice: "Head and shoulders top", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "bullish-triangle", label: "Bullish daily triangle", request: { filters: [{ id: "bullish-chart-pattern", choice: "Bullish triangle", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "bearish-triangle", label: "Bearish daily triangle", request: { filters: [{ id: "bearish-chart-pattern", choice: "Bearish triangle", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
    ],
  },
  {
    id: "fundamentals-options",
    label: "Fundamentals & options",
    scanners: [
      { id: "profitable-companies", label: "Profitable companies", request: { filters: [{ id: "net-profit", lower: "0" }], limit: 25, sortBy: "daily-change" } },
      { id: "revenue-growth-20", label: "20%+ revenue growth", request: { filters: [{ id: "revenue-growth", lower: "20" }], limit: 25, sortBy: "daily-change" } },
      { id: "roe-15", label: "15%+ return on equity", request: { filters: [{ id: "roe", lower: "15" }], limit: 25, sortBy: "daily-change" } },
      { id: "pe-under-15", label: "P/E under 15", request: { filters: [{ id: "pe", lower: "0", upper: "15" }], limit: 25, sortBy: "daily-change" } },
      { id: "large-cap", label: "$10B+ market cap", request: { filters: [{ id: "market-cap", lower: "10000000000" }], limit: 25, sortBy: "daily-change" } },
      { id: "high-iv-rank", label: "High IV rank", request: { filters: [{ id: "option-iv-rank", lower: "80" }], limit: 25, sortBy: "option-volume" } },
      { id: "high-option-open-interest", label: "High option open interest", request: { filters: [{ id: "option-open-interest", lower: "10000" }], limit: 25, sortBy: "option-volume" } },
    ],
  },
  {
    id: "combined-screens",
    label: "Combined screens",
    scanners: [
      { id: "ema-9-with-volume", label: "Above EMA 9 with 1M+ volume", request: { filters: [{ id: "price-vs-average", averageLength: "9", averageType: "EMA", choice: "Price above", timeframe: "Daily" }, { id: "average-volume", lower: "1000000", period: "20" }], limit: 25, sortBy: "daily-change" } },
      { id: "macd-above-ema-9", label: "MACD crossover above EMA 9", request: { filters: [{ id: "macd", choice: "Bullish crossover", timeframe: "Daily" }, { id: "price-vs-average", averageLength: "9", averageType: "EMA", choice: "Price above", timeframe: "Daily" }], limit: 25, sortBy: "daily-change" } },
      { id: "bullish-pattern-with-volume", label: "Bullish pattern with 1M+ volume", request: { filters: [{ id: "bullish-chart-pattern", choice: "Any bullish pattern", timeframe: "Daily" }, { id: "average-volume", lower: "1000000", period: "20" }], limit: 25, sortBy: "daily-change" } },
      { id: "high-growth-large-cap", label: "20%+ growth with $10B+ market cap", request: { filters: [{ id: "revenue-growth", lower: "20" }, { id: "market-cap", lower: "10000000000" }], limit: 25, sortBy: "daily-change" } },
    ],
  },
] satisfies readonly ReadyScannerGroup[]);

export function ScannerClient() {
  const [activeGroup, setActiveGroup] = useState<FilterGroup>("market");
  const [draft, setDraft] = useState<FilterDraft>(initialDraft);
  const [filters, setFilters] = useState<AddedFilter[]>([]);
  const [sortBy, setSortBy] = useState("daily-change");
  const [rowLimit, setRowLimit] = useState<25 | 50 | 100>(25);
  const [result, setResult] = useState<ScannerRunResult | null>(null);
  const [lastRun, setLastRun] = useState<ScannerRunRequest | null>(null);
  const [runState, setRunState] = useState<"idle" | "loading" | "error">("idle");
  const [runError, setRunError] = useState<"connection" | "unavailable" | null>(null);
  const [selectedReadyScanner, setSelectedReadyScanner] = useState<string | null>(null);

  const availableFilters = useMemo(
    () => filterLibrary.filter((filter) => filter.group === activeGroup),
    [activeGroup],
  );
  const selectedDefinition = useMemo(
    () => filterLibrary.find((filter) => filter.id === draft.definitionId) ?? filterLibrary[0],
    [draft.definitionId],
  );

  function selectGroup(group: FilterGroup) {
    const nextDefinition = filterLibrary.find((filter) => filter.group === group) ?? filterLibrary[0];
    setActiveGroup(group);
    setDraft((current) => ({ ...current, choice: "", definitionId: nextDefinition.id, lower: "", upper: "" }));
  }

  function addFilter() {
    if (!selectedDefinition || (selectedDefinition.kind === "range" && !draft.lower && !draft.upper) || (selectedDefinition.kind !== "range" && !draft.choice)) return;
    setFilters((current) => [
      ...current,
      {
        ...draft,
        id: `${selectedDefinition.id}-${Date.now()}-${current.length}`,
        label: conditionLabel(selectedDefinition, draft),
      },
    ]);
    setDraft((current) => ({ ...current, choice: "", lower: "", upper: "" }));
    setSelectedReadyScanner(null);
  }

  const requestScan = useCallback(async (scan: ScannerRunRequest) => {
    setRunState("loading");
    setRunError(null);
    try {
      const response = await fetch("/api/scanner/run", {
        body: JSON.stringify(scan),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const body = await response.json() as ScannerRunResult | { code?: string };
      if (!response.ok || !("rows" in body)) {
        setRunError(("code" in body && body.code === "scanner_connection_required") ? "connection" : "unavailable");
        setRunState("error");
        return;
      }
      setResult(body);
      setRunState("idle");
    } catch {
      setRunError("unavailable");
      setRunState("error");
    }
  }, []);

  function currentScan(): ScannerRunRequest {
    return {
      filters: filters.map(({ averageLength, averageType, choice, definitionId, lower, period, timeframe, upper }) => ({
        averageLength, averageType, choice, id: definitionId as ScannerFilterId, lower, period, timeframe, upper,
      })),
      limit: rowLimit,
      sortBy: sortBy as ScannerRunRequest["sortBy"],
    };
  }

  function runCurrentScan() {
    const scan = currentScan();
    setSelectedReadyScanner(null);
    setLastRun(scan);
    void requestScan(scan);
  }

  function runReadyScanner(scanner: ReadyScanner) {
    const scan: ScannerRunRequest = {
      filters: scanner.request.filters.map((filter) => ({ ...filter })),
      limit: scanner.request.limit,
      sortBy: scanner.request.sortBy,
    };
    setFilters(scan.filters.map((filter, index) => presetFilter(filter, scanner.id, index)));
    setRowLimit(scan.limit);
    setSortBy(scan.sortBy);
    setSelectedReadyScanner(scanner.id);
    setLastRun(scan);
    void requestScan(scan);
  }

  useEffect(() => {
    if (!lastRun) return undefined;
    const refresh = window.setInterval(() => { void requestScan(lastRun); }, 60_000);
    return () => window.clearInterval(refresh);
  }, [lastRun, requestScan]);

  return (
    <DashboardPage>
      <DashboardPanel title="TradersLink Scanners">
        <Stack spacing={2}>
          {readyScannerGroups.map((group) => (
            <Stack key={group.id} spacing={1}>
              <Typography sx={{ fontWeight: 800 }}>{group.label}</Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
                }}
              >
                {group.scanners.map((scanner) => (
                  <DashboardSecondaryAction
                    aria-pressed={selectedReadyScanner === scanner.id}
                    key={scanner.id}
                    onClick={() => runReadyScanner(scanner)}
                    sx={{
                      alignItems: "center",
                      borderWidth: selectedReadyScanner === scanner.id ? 2 : 1,
                      justifyContent: "flex-start",
                      lineHeight: 1.2,
                      minHeight: 56,
                      px: 1.25,
                      py: 0.75,
                      textAlign: "left",
                      whiteSpace: "normal",
                      width: "100%",
                    }}
                  >
                    {scanner.label}
                  </DashboardSecondaryAction>
                ))}
              </Box>
            </Stack>
          ))}
        </Stack>
      </DashboardPanel>

      <DashboardPanel>
        <Stack spacing={2.5}>
          <Tabs
            aria-label="Scanner filter categories"
            onChange={(_, value: FilterGroup) => selectGroup(value)}
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
            value={activeGroup}
            variant="scrollable"
          >
            {filterGroups.map((group) => <Tab key={group.id} label={group.label} value={group.id} />)}
          </Tabs>
          <Box
                sx={{
                  alignItems: "start",
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 1.4fr) repeat(2, minmax(150px, 1fr)) minmax(150px, 1fr) auto" },
                }}
              >
                <TextField
                  helperText={selectedDefinition?.detail}
                  label="Add a filter"
                  onChange={(event) => setDraft((current) => ({ ...current, choice: "", definitionId: event.target.value, lower: "", upper: "" }))}
                  select
                  size="small"
                  value={draft.definitionId}
                >
                  {availableFilters.map((filter) => <MenuItem key={filter.id} value={filter.id}>{filter.label}</MenuItem>)}
                </TextField>
                {selectedDefinition?.kind === "range" ? (
                  <>
                    <TextField label={selectedDefinition.unit ? `Minimum (${selectedDefinition.unit})` : "Minimum"} onChange={(event) => setDraft((current) => ({ ...current, lower: event.target.value }))} placeholder="No minimum" size="small" type="number" value={draft.lower} />
                    <TextField label={selectedDefinition.unit ? `Maximum (${selectedDefinition.unit})` : "Maximum"} onChange={(event) => setDraft((current) => ({ ...current, upper: event.target.value }))} placeholder="No maximum" size="small" type="number" value={draft.upper} />
                    {["daily-change", "amplitude", "average-volume", "average-turnover", "turnover-rate"].includes(selectedDefinition.id) ? (
                      <TextField label="Period" onChange={(event) => setDraft((current) => ({ ...current, period: event.target.value as FilterDraft["period"] }))} select size="small" value={draft.period}>
                        <MenuItem value="1">1 day</MenuItem><MenuItem value="5">5 days</MenuItem><MenuItem value="20">20 days</MenuItem><MenuItem value="60">60 days</MenuItem>
                      </TextField>
                    ) : <Box />}
                  </>
                ) : (
                  <>
                    <TextField label="Condition" onChange={(event) => setDraft((current) => ({ ...current, choice: event.target.value }))} select size="small" value={draft.choice}>
                      <MenuItem value="">Choose a condition</MenuItem>
                      {selectedDefinition?.choices?.map((choice) => <MenuItem key={choice} value={choice}>{choice}</MenuItem>)}
                    </TextField>
                    {selectedDefinition?.id === "price-vs-average" ? (
                      <TextField label="Average" onChange={(event) => setDraft((current) => ({ ...current, averageType: event.target.value as FilterDraft["averageType"] }))} select size="small" value={draft.averageType}>
                        <MenuItem value="MA">MA</MenuItem><MenuItem value="EMA">EMA</MenuItem>
                      </TextField>
                    ) : selectedDefinition?.kind === "signal" ? (
                      <TextField label="Timeframe" onChange={(event) => setDraft((current) => ({ ...current, timeframe: event.target.value as FilterDraft["timeframe"] }))} select size="small" value={draft.timeframe}>
                        {(["1 minute", "5 minutes", "15 minutes", "1 hour", "Daily", "Weekly", "Monthly"] as const).map((timeframe) => <MenuItem key={timeframe} value={timeframe}>{timeframe}</MenuItem>)}
                      </TextField>
                    ) : <Box />}
                    {selectedDefinition?.id === "price-vs-average" ? (
                      <TextField label="Average length" onChange={(event) => setDraft((current) => ({ ...current, averageLength: event.target.value as FilterDraft["averageLength"] }))} select size="small" value={draft.averageLength}>
                        <MenuItem value="5">5</MenuItem><MenuItem value="9">9</MenuItem><MenuItem value="10">10</MenuItem><MenuItem value="20">20</MenuItem><MenuItem value="50">50</MenuItem><MenuItem value="100">100</MenuItem><MenuItem value="200">200</MenuItem>
                      </TextField>
                    ) : <Box />}
                    {selectedDefinition?.id === "price-vs-average" ? (
                      <TextField label="Timeframe" onChange={(event) => setDraft((current) => ({ ...current, timeframe: event.target.value as FilterDraft["timeframe"] }))} select size="small" value={draft.timeframe}>
                        {(["1 minute", "5 minutes", "15 minutes", "1 hour", "Daily", "Weekly", "Monthly"] as const).map((timeframe) => <MenuItem key={timeframe} value={timeframe}>{timeframe}</MenuItem>)}
                      </TextField>
                    ) : <Box />}
                  </>
                )}
                <DashboardPrimaryAction disabled={(selectedDefinition?.kind === "range" && !draft.lower && !draft.upper) || (selectedDefinition?.kind !== "range" && !draft.choice)} onClick={addFilter} startIcon={<FilterAltRoundedIcon />}>
                  Add filter
                </DashboardPrimaryAction>
          </Box>

          <Divider />

          <Stack spacing={1.25}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: 800 }}>Your filters ({filters.length})</Typography>
              <TextField label="Sort matches by" onChange={(event) => setSortBy(event.target.value)} select size="small" sx={{ minWidth: { sm: 210 } }} value={sortBy}>
                <MenuItem value="daily-change">Biggest percentage move</MenuItem>
                <MenuItem value="average-volume">Most volume</MenuItem>
                <MenuItem value="market-cap">Largest market cap</MenuItem>
                <MenuItem value="trade-heat">Highest trading heat</MenuItem>
                <MenuItem value="option-volume">Most option volume</MenuItem>
              </TextField>
            </Stack>
            {filters.length === 0 ? (
              <Typography color="text.secondary" variant="body2">Choose a category, select a condition, then add it to this scan.</Typography>
            ) : (
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
                {filters.map((filter) => <Chip key={filter.id} label={filter.label} onDelete={() => setFilters((current) => current.filter((item) => item.id !== filter.id))} />)}
              </Stack>
            )}
          </Stack>
        </Stack>
      </DashboardPanel>

      <DashboardPanel action={
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", width: { xs: "100%", sm: "auto" } }}>
          <TextField label="Show" onChange={(event) => setRowLimit(Number(event.target.value) as 25 | 50 | 100)} select size="small" sx={{ flex: { xs: 1, sm: "initial" }, minWidth: 100 }} value={rowLimit}>
            <MenuItem value={25}>25</MenuItem><MenuItem value={50}>50</MenuItem><MenuItem value={100}>100</MenuItem>
          </TextField>
          <DashboardPrimaryAction disabled={runState === "loading"} onClick={runCurrentScan} sx={{ flex: { xs: 1, sm: "initial" } }}>{lastRun ? "Refresh" : "Run scan"}</DashboardPrimaryAction>
        </Stack>
      } title="Matches">
        <Box sx={{ display: { xs: "block", sm: "none" } }}>
          {result ? (
            <Stack divider={<Divider flexItem />} spacing={0}>
              {result.rows.map((row) => (
                <Stack key={row.symbol} spacing={1.25} sx={{ py: 1.5 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
                    <Typography sx={{ fontWeight: 800 }}>{row.symbol.replace(/^US\./u, "")}</Typography>
                    <Typography sx={{ fontWeight: 800 }} variant="body2">{row.changePercent === null ? "—" : `${row.changePercent}%`}</Typography>
                  </Stack>
                  <Typography color="text.secondary" variant="body2">{row.company}</Typography>
                  <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                    <MobileResultFact label="Last" value={row.last ?? "—"} />
                    <MobileResultFact label="Change" value={row.changePercent === null ? "—" : `${row.changePercent}%`} />
                    <MobileResultFact label="Volume" value={row.volume ?? "—"} />
                    <MobileResultFact label="Market cap" value={row.marketCap ?? "—"} />
                    <Box sx={{ gridColumn: "1 / -1" }}><MobileResultFact label="Updated" value={formatUpdatedAt(row.updatedAtUtc)} /></Box>
                  </Box>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Box sx={{ py: 5, textAlign: "center" }}>
              {runState === "loading" ? <Typography sx={{ fontWeight: 700 }}>Running your screen…</Typography> : runError === "connection" ? <Typography sx={{ fontWeight: 700 }}>Connect market data before running this screen.</Typography> : runError === "unavailable" ? <Typography sx={{ fontWeight: 700 }}>Market data could not provide results right now. Try again shortly.</Typography> : <Typography sx={{ fontWeight: 700 }}>Add your conditions, then run the screen.</Typography>}
            </Box>
          )}
        </Box>
        <Box sx={{ display: { xs: "none", sm: "block" }, maxWidth: "100%", overflowX: "auto" }}>
          <Table aria-label="Scanner results" size="small" sx={{ minWidth: 760 }}>
            <TableHead><TableRow>{resultColumns.map((column) => <TableCell key={column}>{column}</TableCell>)}</TableRow></TableHead>
            <TableBody>{result ? result.rows.map((row) => <TableRow key={row.symbol}>
              <TableCell sx={{ fontWeight: 700 }}>{row.symbol.replace(/^US\./u, "")}</TableCell><TableCell>{row.company}</TableCell><TableCell>{row.last ?? "—"}</TableCell><TableCell>{row.changePercent === null ? "—" : `${row.changePercent}%`}</TableCell><TableCell>{row.volume ?? "—"}</TableCell><TableCell>{row.marketCap ?? "—"}</TableCell><TableCell>{formatUpdatedAt(row.updatedAtUtc)}</TableCell>
            </TableRow>) : <TableRow><TableCell colSpan={resultColumns.length} sx={{ py: 5, textAlign: "center" }}>
              {runState === "loading" ? <Typography sx={{ fontWeight: 700 }}>Running your screen…</Typography> : runError === "connection" ? <Typography sx={{ fontWeight: 700 }}>Connect market data before running this screen.</Typography> : runError === "unavailable" ? <Typography sx={{ fontWeight: 700 }}>Market data could not provide results right now. Try again shortly.</Typography> : <Typography sx={{ fontWeight: 700 }}>Add your conditions, then run the screen.</Typography>}
            </TableCell></TableRow>}
            </TableBody>
          </Table>
        </Box>
        {result ? <Typography color="text.secondary" sx={{ mt: 1.25 }} variant="body2">{result.total.toLocaleString()} matches · Updated {formatUpdatedAt(result.updatedAtUtc)}{result.cached ? " · Current shared result" : ""}</Typography> : null}
      </DashboardPanel>
    </DashboardPage>
  );
}
