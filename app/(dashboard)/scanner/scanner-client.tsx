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

import type { ScannerRunRequest, ScannerRunResult } from "@/src/modules/scanner/scanner-contract";

import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
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
  { id: "trend-pattern", group: "technical", kind: "choice", label: "Trend pattern", detail: "Moomoo indicator-pattern conditions", choices: ["MA bullish alignment", "MA bearish alignment", "EMA bullish alignment", "EMA bearish alignment", "Any bullish signal", "Any bearish signal"] },
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
        averageLength, averageType, choice, id: definitionId, lower, period, timeframe, upper,
      })),
      limit: rowLimit,
      sortBy: sortBy as ScannerRunRequest["sortBy"],
    };
  }

  function runCurrentScan() {
    const scan = currentScan();
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
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <TextField label="Show" onChange={(event) => setRowLimit(Number(event.target.value) as 25 | 50 | 100)} select size="small" value={rowLimit}>
            <MenuItem value={25}>25</MenuItem><MenuItem value={50}>50</MenuItem><MenuItem value={100}>100</MenuItem>
          </TextField>
          <DashboardPrimaryAction disabled={runState === "loading"} onClick={runCurrentScan}>{lastRun ? "Refresh" : "Run scan"}</DashboardPrimaryAction>
        </Stack>
      } title="Matches">
        <Box sx={{ maxWidth: "100%", overflowX: "auto" }}>
          <Table aria-label="Scanner results" size="small" sx={{ minWidth: 760 }}>
            <TableHead><TableRow>{resultColumns.map((column) => <TableCell key={column}>{column}</TableCell>)}</TableRow></TableHead>
            <TableBody>{result ? result.rows.map((row) => <TableRow key={row.symbol}>
              <TableCell sx={{ fontWeight: 700 }}>{row.symbol.replace(/^US\./u, "")}</TableCell><TableCell>{row.company}</TableCell><TableCell>{row.last ?? "—"}</TableCell><TableCell>{row.changePercent === null ? "—" : `${row.changePercent}%`}</TableCell><TableCell>{row.volume ?? "—"}</TableCell><TableCell>{row.marketCap ?? "—"}</TableCell><TableCell>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(row.updatedAtUtc))}</TableCell>
            </TableRow>) : <TableRow><TableCell colSpan={resultColumns.length} sx={{ py: 5, textAlign: "center" }}>
              {runState === "loading" ? <Typography sx={{ fontWeight: 700 }}>Running your screen…</Typography> : runError === "connection" ? <Typography sx={{ fontWeight: 700 }}>Connect Moomoo before running this screen.</Typography> : runError === "unavailable" ? <Typography sx={{ fontWeight: 700 }}>Moomoo could not provide results right now. Try again shortly.</Typography> : <Typography sx={{ fontWeight: 700 }}>Add your conditions, then run the screen.</Typography>}
            </TableCell></TableRow>}
            </TableBody>
          </Table>
        </Box>
        {result ? <Typography color="text.secondary" sx={{ mt: 1.25 }} variant="body2">{result.total.toLocaleString()} matches · Updated {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(result.updatedAtUtc))}{result.cached ? " · Current shared result" : ""}</Typography> : null}
      </DashboardPanel>
    </DashboardPage>
  );
}
