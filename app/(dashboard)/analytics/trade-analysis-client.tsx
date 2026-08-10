"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DashboardMetricCard } from "@/app/dashboard-template";
import type {
  DailyTradeLongTermAnalyticsModel,
  TradeAnalysisBreakdownRow,
  TradeAnalysisTradeRow,
} from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";

import { TradeAnalyzerHelpLink } from "./trade-analyzer-help-link";
import {
  boundedPage,
  paginatedRows,
  TradeAnalyzerTablePagination,
} from "./trade-analyzer-table-pagination";

export type TradeAnalysisView = "day" | "entry-exit" | "green-to-red" | "candle-patterns" | "trades";

function money(value: string | null, currency: string | null): string {
  if (value === null || currency === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(value));
}

function percent(value: number | null): string {
  return value === null ? "N/A" : `${value.toFixed(1)}%`;
}

function friendlyPattern(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ")
    .replace(/\b\w/gu, (character) => character.toUpperCase());
}

function greenToRedLabel(value: TradeAnalysisTradeRow["greenToRedStatus"]): string {
  switch (value) {
    case "never_green": return "Never green";
    case "green_no_red": return "Green, stayed above breakeven";
    case "green_to_red_ended_red": return "Green to red, ended red";
    case "green_to_red_recovered": return "Green to red, recovered";
    case "green_to_red_ended_flat": return "Green to red, ended flat";
    case "unavailable": return "Unavailable";
  }
}

function BreakdownTable({
  rows,
  valueLabel,
  valueSuffix = "",
  currency,
  showOccurrences = true,
}: {
  rows: readonly TradeAnalysisBreakdownRow[];
  valueLabel?: string;
  valueSuffix?: string;
  currency: string | null;
  showOccurrences?: boolean;
}) {
  if (rows.length === 0) return <Typography color="text.secondary">Not enough analyzed evidence is available for this breakdown.</Typography>;
  return (
    <TableContainer>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Group</TableCell>{showOccurrences ? <TableCell align="right">Executions</TableCell> : null}<TableCell align="right">Trades</TableCell><TableCell align="right">Opportunity trades</TableCell>
          <TableCell align="right">Win rate</TableCell><TableCell align="right">Avg return</TableCell><TableCell align="right">Avg result</TableCell>
          <TableCell align="right">Avg potential result</TableCell><TableCell align="right">Avg missed opportunity</TableCell>
          {valueLabel ? <TableCell align="right">{valueLabel}</TableCell> : null}
        </TableRow></TableHead>
        <TableBody>{rows.map((row) => (
          <TableRow hover key={row.label}>
            <TableCell sx={{ fontWeight: 750 }}>{row.label}</TableCell>
            {showOccurrences ? <TableCell align="right">{row.occurrenceCount}</TableCell> : null}
            <TableCell align="right">{row.tradeCount}</TableCell>
            <TableCell align="right">{row.opportunityTradeCount}</TableCell>
            <TableCell align="right">{percent(row.winRatePercent)}</TableCell>
            <TableCell align="right" sx={{ color: row.averageReturnPercent !== null && row.averageReturnPercent < 0 ? "error.main" : undefined }}>{percent(row.averageReturnPercent)}</TableCell>
            <TableCell align="right">{money(row.averagePnlDecimal, currency)}</TableCell>
            <TableCell align="right">{money(row.averagePotentialPnlDecimal, currency)}</TableCell>
            <TableCell align="right">{money(row.averageAdditionalOpportunityDecimal, currency)}</TableCell>
            {valueLabel ? <TableCell align="right">{row.averageValue === null ? "N/A" : `${row.averageValue.toFixed(1)}${valueSuffix}`}</TableCell> : null}
          </TableRow>
        ))}</TableBody>
      </Table>
    </TableContainer>
  );
}

function Section({
  children,
  description,
  helpHref,
  title,
  defaultExpanded = false,
}: {
  children: React.ReactNode;
  defaultExpanded?: boolean;
  description: string;
  helpHref: string;
  title: string;
}) {
  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters sx={{ border: 1, borderColor: "divider", borderRadius: "8px !important", boxShadow: "none", overflow: "hidden", "&:before": { display: "none" } }}>
      <Box sx={{ alignItems: "center", display: "flex" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ flexGrow: 1, minWidth: 0, px: { xs: 1.5, sm: 2.25 }, py: 0.5 }}>
          <Box><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">{title}</Typography><Typography color="text.secondary" variant="body2">{description}</Typography></Box>
        </AccordionSummary>
        <Box sx={{ pr: { xs: 0.75, sm: 1.25 } }}>
          <TradeAnalyzerHelpLink href={helpHref} label={title} />
        </Box>
      </Box>
      <AccordionDetails sx={{ px: { xs: 1.5, sm: 2.25 }, pb: 2.25, pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

type SortColumn = "symbol" | "closeDate" | "actual" | "return" | "opportunity" | "additional" | "capture" | "peakToExit";

function sortValue(row: TradeAnalysisTradeRow, column: SortColumn): string | number {
  switch (column) {
    case "symbol": return row.symbol;
    case "closeDate": return row.closeDate;
    case "actual": return Number(row.actualPnlDecimal);
    case "return": return row.returnPercent ?? Number.NEGATIVE_INFINITY;
    case "opportunity": return Number(row.sustainedOpportunityDecimal ?? Number.NEGATIVE_INFINITY);
    case "additional": return Number(row.additionalOpportunityDecimal ?? Number.NEGATIVE_INFINITY);
    case "capture": return row.capturedPercent ?? Number.NEGATIVE_INFINITY;
    case "peakToExit": return row.peakToExitMinutes ?? Number.NEGATIVE_INFINITY;
  }
}

function TradeTable({ model }: { model: DailyTradeLongTermAnalyticsModel }) {
  const [ticker, setTicker] = useState("");
  const [outcome, setOutcome] = useState<"all" | TradeAnalysisTradeRow["greenToRedStatus"]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<SortColumn>("closeDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const rows = useMemo(() => model.trades.filter((row) =>
    row.symbol.toUpperCase().includes(ticker.trim().toUpperCase()) &&
    (outcome === "all" || row.greenToRedStatus === outcome))
    .sort((left, right) => {
      const leftValue = sortValue(left, sortColumn);
      const rightValue = sortValue(right, sortColumn);
      const comparison = typeof leftValue === "string"
        ? leftValue.localeCompare(rightValue as string)
        : leftValue - (rightValue as number);
      return sortDirection === "asc" ? comparison : -comparison;
    }), [model.trades, outcome, sortColumn, sortDirection, ticker]);
  const currentPage = boundedPage(page, rows.length, pageSize);
  const visibleRows = paginatedRows(rows, currentPage, pageSize);
  const changeSort = (column: SortColumn) => {
    if (column === sortColumn) setSortDirection((value) => value === "asc" ? "desc" : "asc");
    else {
      setSortColumn(column);
      setSortDirection(column === "symbol" ? "asc" : "desc");
    }
    setPage(1);
  };
  const heading = (column: SortColumn, label: string) => (
    <TableSortLabel active={sortColumn === column} direction={sortColumn === column ? sortDirection : "asc"} onClick={() => changeSort(column)}>{label}</TableSortLabel>
  );
  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField label="Ticker" onChange={(event) => { setTicker(event.target.value); setPage(1); }} size="small" value={ticker} />
        <TextField label="Green-to-red outcome" onChange={(event) => { setOutcome(event.target.value as typeof outcome); setPage(1); }} select size="small" sx={{ minWidth: 230 }} value={outcome}>
          <MenuItem value="all">All outcomes</MenuItem>
          <MenuItem value="never_green">Never green</MenuItem>
          <MenuItem value="green_no_red">Green, stayed above breakeven</MenuItem>
          <MenuItem value="green_to_red_ended_red">Green to red, ended red</MenuItem>
          <MenuItem value="green_to_red_recovered">Green to red, recovered</MenuItem>
          <MenuItem value="green_to_red_ended_flat">Green to red, ended flat</MenuItem>
        </TextField>
      </Stack>
      <TradeAnalyzerTablePagination
        onPageChange={setPage}
        onPageSizeChange={(nextSize) => { setPageSize(nextSize); setPage(1); }}
        page={currentPage}
        pageSize={pageSize}
        rowCount={rows.length}
      />
      {rows.length === 0 ? <Typography color="text.secondary">No analyzed trades match these filters.</Typography> : (
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>{heading("symbol", "Ticker")}</TableCell><TableCell>Direction</TableCell><TableCell>{heading("closeDate", "Closed")}</TableCell>
              <TableCell align="right">{heading("actual", `${model.moneyBasis === "gross" ? "Gross" : "Net"} P/L`)}</TableCell><TableCell align="right">{heading("return", "Return")}</TableCell><TableCell align="right">{heading("opportunity", "Sustained opportunity")}</TableCell>
              <TableCell align="right">{heading("additional", "Additional opportunity")}</TableCell><TableCell align="right">{heading("capture", "Captured")}</TableCell>
              <TableCell align="right">{heading("peakToExit", "Peak to exit")}</TableCell><TableCell>Outcome</TableCell><TableCell align="right">Executions</TableCell><TableCell />
            </TableRow></TableHead>
            <TableBody>{visibleRows.map((row) => (
              <TableRow hover key={row.roundTripId}>
                <TableCell sx={{ fontWeight: 850 }}>{row.symbol}</TableCell><TableCell sx={{ textTransform: "capitalize" }}>{row.direction}</TableCell><TableCell>{row.closeDate}</TableCell>
                <TableCell align="right" sx={{ color: Number(row.actualPnlDecimal) < 0 ? "error.main" : "success.main", fontWeight: 800 }}>{money(row.actualPnlDecimal, model.currency)}</TableCell>
                <TableCell align="right" sx={{ color: row.returnPercent !== null && row.returnPercent < 0 ? "error.main" : undefined }}>{percent(row.returnPercent)}</TableCell>
                <TableCell align="right">{money(row.sustainedOpportunityDecimal, model.currency)}</TableCell><TableCell align="right">{money(row.additionalOpportunityDecimal, model.currency)}</TableCell>
                <TableCell align="right">{percent(row.capturedPercent)}</TableCell><TableCell align="right">{row.peakToExitMinutes === null ? "N/A" : `${row.peakToExitMinutes} min`}</TableCell>
                <TableCell>{greenToRedLabel(row.greenToRedStatus)}</TableCell><TableCell align="right">{row.executionCount}</TableCell>
                <TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={`/trade-tracker/${row.trackerDate}`} size="small" variant="outlined">View day</Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

function PatternRanking({ model }: { model: DailyTradeLongTermAnalyticsModel }) {
  const rows = model.patterns.slice(0, 10);
  const maximum = Math.max(1, ...rows.map((row) => row.occurrenceCount));
  if (rows.length === 0) return <Typography color="text.secondary">No qualifying saved candle patterns are available in this range.</Typography>;
  return (
    <Stack spacing={1.25}>
      {rows.map((row) => (
        <Box key={`${row.timeframe}-${row.executionSide}-${row.location}-${row.pattern}`}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 750 }} variant="body2">{friendlyPattern(row.pattern)} · {row.timeframe} · {row.executionSide}</Typography>
            <Typography color="text.secondary" variant="caption">{row.occurrenceCount} occurrence{row.occurrenceCount === 1 ? "" : "s"}</Typography>
          </Stack>
          <Box sx={{ bgcolor: "rgba(1, 30, 86, 0.08)", borderRadius: 999, height: 8, mt: 0.5, overflow: "hidden" }}>
            <Box sx={{ bgcolor: "primary.main", borderRadius: 999, height: "100%", width: `${Math.max(4, row.occurrenceCount / maximum * 100)}%` }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

const CAPABILITIES = Object.freeze([
  Object.freeze({ href: "/analytics/trade-analyzer/day/entry-exit", title: "Entry & Exit", description: "Compare entry timing, favorable and adverse movement, market context and exit giveback." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/green-to-red", title: "Green-to-Red", description: "Review profit capture, reversals below breakeven, recoveries and risk-management behavior." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/candle-patterns", title: "Candle Patterns", description: "Compare saved one-minute and five-minute patterns observed on or before executions." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/trades", title: "Analyzed Trades", description: "Inspect the exact trades behind every summary and return to each Daily Trade Tracker replay." }),
]);

export function TradeAnalysisClient({
  model,
  view,
}: {
  model: DailyTradeLongTermAnalyticsModel;
  view: TradeAnalysisView;
}) {
  const [patternPage, setPatternPage] = useState(1);
  const [patternPageSize, setPatternPageSize] = useState(25);
  const currentPatternPage = boundedPage(patternPage, model.patterns.length, patternPageSize);
  const visiblePatterns = paginatedRows(model.patterns, currentPatternPage, patternPageSize);
  if (model.eligibleDayTradeCount === 0) {
    return <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined"><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">No completed day trades</Typography><Typography color="text.secondary" sx={{ mt: 0.75 }}>Trade Analysis will begin after completed day trades are available in this account.</Typography></Paper>;
  }
  if (model.analyzedTradeCount === 0) {
    return <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined"><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">No saved trade analyses</Typography><Typography color="text.secondary" sx={{ mt: 0.75 }}>This date range contains {model.eligibleDayTradeCount} completed day trades, but none has a current saved Daily Trade Tracker analysis.</Typography></Paper>;
  }
  return (
    <Stack spacing={2.5}>
      {view === "day" ? <Stack spacing={1.25}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Overall results</Typography>
          <TradeAnalyzerHelpLink href="/help/trade-analyzer/day-trade-analysis#overall-results" label="Overall results" />
        </Stack>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
        <DashboardMetricCard caption="Eligible trade count will appear after the paid lookback is configured" label="Analyzed trades" value={String(model.analyzedTradeCount)} />
        <DashboardMetricCard caption="Every saved buy and sell snapshot" label="Analyzed executions" value={String(model.analyzedExecutionCount)} />
        <DashboardMetricCard caption="Waiting for the approved eligibility boundary" label="Coverage" value="N/A" />
        <DashboardMetricCard caption="Trades that finished above breakeven" label="Win rate" value={percent(model.winRatePercent)} />
        <DashboardMetricCard caption="Average percentage return per analyzed trade" label="Average return" value={percent(model.averageReturnPercent)} />
        <DashboardMetricCard caption={`Journal ${model.moneyBasis} P/L per analyzed trade`} label={`Average ${model.moneyBasis} result`} value={money(model.averagePnlDecimal, model.currency)} />
        <DashboardMetricCard caption={`Combined Journal ${model.moneyBasis} P/L`} label="Total actual result" value={money(model.profitCapture.totalActualPnlDecimal, model.currency)} />
        <DashboardMetricCard caption="Actual result plus measured additional opportunity" label="Result at sustained opportunities" value={money(model.profitCapture.totalPotentialPnlDecimal, model.currency)} />
        <DashboardMetricCard caption="Difference between actual and measured opportunity" label="Total missed opportunity" value={money(model.profitCapture.totalAdditionalOpportunityDecimal, model.currency)} />
        </Box>
      </Stack> : null}

      <Paper sx={{ p: { xs: 1.5, sm: 2.25 } }} variant="outlined">
        <Stack spacing={0.75}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Analysis coverage</Typography>
              <TradeAnalyzerHelpLink href="/help/trade-analyzer/day-trade-analysis#eligibility-coverage" label="Analysis coverage" />
            </Stack>
            <Typography sx={{ fontWeight: 800 }} variant="body2">{model.analyzedTradeCount} analyzed</Typography>
          </Stack>
          <LinearProgress aria-label="Trade analysis eligibility is not configured" value={0} variant="determinate" />
          <Typography color="text.secondary" variant="body2">The eligible-trade total and coverage percentage will appear after the initial paid lookback is tested and configured. The {model.analyzedTradeCount} current saved analyses remain available; older historical imports are not being treated as failed or zero. {model.moneyBasis === "gross" ? "Gross results do not subtract fees." : "Net results include only trades with complete fee details."}</Typography>
        </Stack>
      </Paper>

      {view === "day" ? (
        <Stack spacing={1.25}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Explore your analysis</Typography>
            <TradeAnalyzerHelpLink href="/help/trade-analyzer/day-trade-analysis#capability-navigation" label="Capability pages" />
          </Stack>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}>
          {CAPABILITIES.map((capability) => (
            <Card key={capability.href} variant="outlined">
              <CardActionArea component={Link} href={capability.href} sx={{ height: "100%" }}>
                <CardContent sx={{ minHeight: 132 }}>
                  <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">{capability.title}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">{capability.description}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
          </Box>
        </Stack>
      ) : null}

      {view === "green-to-red" ? <Section defaultExpanded description="Actual results compared with the strongest profit opportunities that remained available through completed candle closes." helpHref="/help/trade-analyzer/green-to-red-analysis#profit-capture" title="Profit capture">
        <Stack spacing={2.25}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
            <DashboardMetricCard caption={`Combined Journal ${model.moneyBasis} P/L`} label="Total actual result" value={money(model.profitCapture.totalActualPnlDecimal, model.currency)} />
            <DashboardMetricCard caption="Actual result plus the measured additional opportunity" label="Result at best sustained opportunities" value={money(model.profitCapture.totalPotentialPnlDecimal, model.currency)} />
            <DashboardMetricCard caption={`${model.opportunityTradeCount} trades had a measured sustained opportunity`} label="Total additional opportunity" value={money(model.profitCapture.totalAdditionalOpportunityDecimal, model.currency)} />
            <DashboardMetricCard caption="Mean percentage retained" label="Average peak profit retained" value={percent(model.profitCapture.averageCapturedPercent)} />
            <DashboardMetricCard caption="Middle percentage retained" label="Median peak profit retained" value={percent(model.profitCapture.medianCapturedPercent)} />
            <DashboardMetricCard caption="Average drop from the measured peak to the final exit" label="Average peak-to-exit giveback" value={money(model.profitCapture.averagePeakToFinalGivebackDecimal, model.currency)} />
          </Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Time held after the profit peak</Typography><BreakdownTable currency={model.currency} rows={model.holding} showOccurrences={false} valueLabel="Avg peak-to-exit" valueSuffix=" min" /></Box>
        </Stack>
      </Section> : null}

      {view === "green-to-red" ? <Section defaultExpanded description="What happened after trades first moved above breakeven." helpHref="/help/trade-analyzer/green-to-red-analysis#green-to-red-outcomes" title="Green-to-red outcomes">
        <Stack spacing={2.25}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
            <DashboardMetricCard caption="Moved above breakeven and later fell below it" label="Green-to-red trades" value={`${model.greenToRedTradeCount} of ${model.analyzedTradeCount}`} />
            <DashboardMetricCard caption="Average time from first green to first red" label="Time before turning red" value={model.greenToRedDamage.averageGreenToRedMinutes === null ? "N/A" : `${model.greenToRedDamage.averageGreenToRedMinutes.toFixed(1)} min`} />
            <DashboardMetricCard caption="Turned positive again after first going red" label="Recovery rate" value={percent(model.greenToRedDamage.recoveryRatePercent)} />
            <DashboardMetricCard caption="Average time from first red to first recovery" label="Recovery time" value={model.greenToRedDamage.averageRecoveryMinutes === null ? "N/A" : `${model.greenToRedDamage.averageRecoveryMinutes.toFixed(1)} min`} />
            <DashboardMetricCard caption="Average profit reversal before first turning red" label="Peak-to-red damage" value={money(model.greenToRedDamage.averagePeakToRedDamageDecimal, model.currency)} />
            <DashboardMetricCard caption="Average profit reversal from peak to final exit" label="Peak-to-exit damage" value={money(model.greenToRedDamage.averagePeakToFinalDamageDecimal, model.currency)} />
            <DashboardMetricCard caption={`${model.greenToRedDamage.endedRedTradeCount} trades finished red after first moving green`} label="Ended-red actual result" value={money(model.greenToRedDamage.endedRedActualPnlDecimal, model.currency)} />
            <DashboardMetricCard caption="Combined result at each trade's best sustained opportunity" label="Ended-red potential result" value={money(model.greenToRedDamage.endedRedPotentialPnlDecimal, model.currency)} />
            <DashboardMetricCard caption="Difference between the actual and potential results" label="Ended-red missed opportunity" value={money(model.greenToRedDamage.endedRedAdditionalOpportunityDecimal, model.currency)} />
          </Box>
          <BreakdownTable currency={model.currency} rows={model.greenToRed} showOccurrences={false} />
        </Stack>
      </Section> : null}

      {view === "green-to-red" ? <Section description="Observed outcomes when the trader added after a measured peak or reduced the position before a green trade turned red." helpHref="/help/trade-analyzer/green-to-red-analysis#risk-management-behavior" title="Risk-management behavior">
        <Stack spacing={2.5}>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Adding after the peak</Typography><BreakdownTable currency={model.currency} rows={model.riskManagement.addedAfterPeak} showOccurrences={false} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Scaling out before red</Typography><BreakdownTable currency={model.currency} rows={model.riskManagement.partialExitBeforeRed} showOccurrences={false} /></Box>
          <Typography color="text.secondary" variant="body2">These are comparisons of what happened in your saved trades. They do not prove that adding or scaling out caused the result.</Typography>
        </Stack>
      </Section> : null}

      {view === "green-to-red" ? <Section description="The analyzed trades behind the profit-capture and Green-to-red comparisons." helpHref="/help/trade-analyzer/green-to-red-analysis#supporting-trades" title="Supporting trades">
        <TradeTable model={model} />
      </Section> : null}

      {view === "entry-exit" ? <Section defaultExpanded description="How far price moved in favor of and against each entry or add before the position became flat." helpHref="/help/trade-analyzer/entry-exit-analysis#entry-opportunity-risk" title="Entry opportunity and risk">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
          <DashboardMetricCard caption={`${model.entryOpportunityRisk.measuredExecutionCount} measured entry and add executions`} label="Average favorable move per share" value={money(model.entryOpportunityRisk.averageFavorableMoveDecimal, model.currency)} />
          <DashboardMetricCard caption="Middle favorable movement across measured executions" label="Median favorable move per share" value={money(model.entryOpportunityRisk.medianFavorableMoveDecimal, model.currency)} />
          <DashboardMetricCard caption="Average movement against the execution" label="Average adverse move per share" value={money(model.entryOpportunityRisk.averageAdverseMoveDecimal, model.currency)} />
          <DashboardMetricCard caption="Middle adverse movement across measured executions" label="Median adverse move per share" value={money(model.entryOpportunityRisk.medianAdverseMoveDecimal, model.currency)} />
        </Box>
      </Section> : null}

      {view === "entry-exit" ? <Section description={`Results grouped by entry time and total holding duration in ${model.timezone}.`} helpHref="/help/trade-analyzer/entry-exit-analysis#timing-holding" title="Timing and holding">
        <Stack spacing={2.5}>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Entry time</Typography><BreakdownTable currency={model.currency} rows={model.entryTime} showOccurrences={false} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Total holding time</Typography><BreakdownTable currency={model.currency} rows={model.holdingDuration} showOccurrences={false} valueLabel="Avg holding time" valueSuffix=" min" /></Box>
        </Stack>
      </Section> : null}

      {view === "entry-exit" ? <Section description="Every entry and add, grouped by its saved Session VWAP, EMA 9 and relative-volume context." helpHref="/help/trade-analyzer/entry-exit-analysis#entry-execution-context" title="Entry execution context">
        <Stack spacing={2.5}>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Distance from Session VWAP</Typography><BreakdownTable currency={model.currency} rows={model.entryContext.vwap} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Distance from EMA 9</Typography><BreakdownTable currency={model.currency} rows={model.entryContext.ema9} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Relative volume</Typography><BreakdownTable currency={model.currency} rows={model.entryContext.relativeVolume} valueLabel="Avg relative volume" valueSuffix="x" /></Box>
        </Stack>
      </Section> : null}

      {view === "entry-exit" ? <Section description="Every partial and final exit with a measurable giveback from its earlier favorable completed-candle price." helpHref="/help/trade-analyzer/entry-exit-analysis#exit-execution-context" title="Exit execution context">
        <BreakdownTable currency={model.currency} rows={model.exitContext} valueLabel="Avg giveback" valueSuffix="%" />
      </Section> : null}

      {view === "candle-patterns" ? <Section defaultExpanded description="The ten most frequently observed saved pattern groups in this filtered population." helpHref="/help/trade-analyzer/candle-patterns#ranked-patterns" title="Most observed patterns">
        <PatternRanking model={model} />
      </Section> : null}

      {view === "candle-patterns" ? <Section defaultExpanded description="Observed one-minute and five-minute candle patterns on or immediately before saved executions." helpHref="/help/trade-analyzer/candle-patterns#pattern-results" title="Candle patterns">
        <TradeAnalyzerTablePagination
          onPageChange={setPatternPage}
          onPageSizeChange={(nextSize) => { setPatternPageSize(nextSize); setPatternPage(1); }}
          page={currentPatternPage}
          pageSize={patternPageSize}
          rowCount={model.patterns.length}
        />
        {model.patterns.length === 0 ? <Typography color="text.secondary">No qualifying saved candle patterns are available in this range.</Typography> : (
          <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Pattern</TableCell><TableCell>Timeframe</TableCell><TableCell>Execution</TableCell><TableCell>Location</TableCell><TableCell align="right">Occurrences</TableCell><TableCell align="right">Trades</TableCell><TableCell align="right">Win rate</TableCell><TableCell align="right">Avg return</TableCell><TableCell align="right">Avg result</TableCell></TableRow></TableHead>
          <TableBody>{visiblePatterns.map((row) => <TableRow hover key={`${row.timeframe}-${row.executionSide}-${row.location}-${row.pattern}`}><TableCell sx={{ fontWeight: 750 }}>{friendlyPattern(row.pattern)}</TableCell><TableCell>{row.timeframe}</TableCell><TableCell>{row.executionSide}</TableCell><TableCell>{row.location}</TableCell><TableCell align="right">{row.occurrenceCount}</TableCell><TableCell align="right">{row.tradeCount}</TableCell><TableCell align="right">{percent(row.winRatePercent)}</TableCell><TableCell align="right" sx={{ color: row.averageReturnPercent !== null && row.averageReturnPercent < 0 ? "error.main" : undefined }}>{percent(row.averageReturnPercent)}</TableCell><TableCell align="right">{money(row.averagePnlDecimal, model.currency)}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
        )}
      </Section> : null}

      {view === "trades" ? <Section defaultExpanded description="The exact analyzed trades behind these summaries, with a link back to each Daily Trade Tracker replay." helpHref="/help/trade-analyzer/analyzed-trades#trade-table" title="Analyzed trades">
        <TradeTable model={model} />
      </Section> : null}

      {model.malformedSnapshotCount > 0 ? <Typography color="warning.main" variant="body2">{model.malformedSnapshotCount} saved execution snapshots could not be read and were excluded from execution-level breakdowns.</Typography> : null}
    </Stack>
  );
}
