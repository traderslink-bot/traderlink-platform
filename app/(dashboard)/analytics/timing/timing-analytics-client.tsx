"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import { FeatureHelpLink } from "../../feature-help-link";
import { HorizontalScrollHint } from "../../horizontal-scroll-region";

export type TimingMetricId = "net_pnl" | "average_pnl" | "win_rate" | "included_count";
type TimingChartId = "entry_time_bucket" | "exit_time_bucket" | "entry_weekday" | "entry_session";
type TimingChartStyle = "columns" | "line" | "horizontal_bars";
type TimingPoint = Readonly<{
  key: string;
  label: string;
  metrics: Readonly<Record<TimingMetricId, Readonly<{ display: string; value: number | null }>>>;
}>;
export type TimingChartData = Readonly<Record<TimingChartId, readonly TimingPoint[]>>;

const MEASURES: readonly Readonly<{ id: TimingMetricId; label: string }>[] = [
  { id: "net_pnl", label: "Net P/L" },
  { id: "average_pnl", label: "Average P/L per trade" },
  { id: "win_rate", label: "Win rate" },
  { id: "included_count", label: "Trade count" },
];

const CHARTS: readonly Readonly<{ id: TimingChartId; title: string; bestLabel: string; showTimezone?: boolean }>[] = [
  { id: "entry_time_bucket", title: "Entry time", bestLabel: "Best entry time", showTimezone: true },
  { id: "exit_time_bucket", title: "Exit time", bestLabel: "Best exit time", showTimezone: true },
  { id: "entry_weekday", title: "Day of week", bestLabel: "Best day" },
  { id: "entry_session", title: "Trading session", bestLabel: "Best session" },
];

const CHART_STYLES: readonly Readonly<{ id: TimingChartStyle; label: string }>[] = [
  { id: "columns", label: "Columns" },
  { id: "line", label: "Line" },
  { id: "horizontal_bars", label: "Horizontal bars" },
];

const TIME_CHART_STYLES = CHART_STYLES.filter((style) => style.id === "horizontal_bars" || style.id === "line");
const CATEGORY_CHART_STYLES = CHART_STYLES.filter((style) => style.id === "horizontal_bars" || style.id === "columns");

function timeLabel(value: string): string {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return value;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function labelFor(chartId: TimingChartId, point: TimingPoint): string {
  return chartId === "entry_time_bucket" || chartId === "exit_time_bucket" ? timeLabel(point.label) : point.label;
}

function valuesFor(points: readonly TimingPoint[], metricId: TimingMetricId): readonly number[] {
  return points.map((point) => point.metrics[metricId].value ?? 0);
}

function chartRange(values: readonly number[]) {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const padding = Math.max((max - min) * 0.12, 1);
  return { min: min - padding, max: max + padding };
}

function yFor(value: number, range: Readonly<{ min: number; max: number }>, height = 158) {
  return 16 + ((range.max - value) / (range.max - range.min)) * height;
}

function BestLabel({ chart, points, metricId }: { chart: (typeof CHARTS)[number]; points: readonly TimingPoint[]; metricId: TimingMetricId }) {
  const best = useMemo(() => points
    .filter((point) => point.metrics[metricId].value !== null)
    .sort((left, right) => (right.metrics[metricId].value ?? Number.NEGATIVE_INFINITY) - (left.metrics[metricId].value ?? Number.NEGATIVE_INFINITY))[0] ?? null, [metricId, points]);
  return best ? (
    <Typography color="text.secondary" sx={{ fontSize: 12 }}>
      {chart.bestLabel}: <Box component="span" sx={{ color: "text.primary", fontWeight: 800 }}>{labelFor(chart.id, best)}</Box>
    </Typography>
  ) : null;
}

function EmptyChart() {
  return <Typography color="text.secondary" sx={{ display: "block", py: 9 }} variant="body2">No completed trades are available for this view.</Typography>;
}

function MobileChartScrollHint() {
  return <HorizontalScrollHint label="Swipe sideways to see the full chart" />;
}

function TrendChart({ chartId, points, metricId }: { chartId: TimingChartId; points: readonly TimingPoint[]; metricId: TimingMetricId }) {
  if (!points.length) return <EmptyChart />;
  const values = valuesFor(points, metricId);
  const range = chartRange(values);
  const width = 640;
  const baseline = yFor(0, range);
  const pointX = (index: number) => points.length === 1 ? width / 2 : 30 + (index * (width - 60)) / (points.length - 1);
  const line = points.map((point, index) => `${pointX(index)},${yFor(point.metrics[metricId].value ?? 0, range)}`).join(" ");
  const labelIndexes = new Set([0, Math.floor((points.length - 1) / 3), Math.floor(((points.length - 1) * 2) / 3), points.length - 1]);
  return (
    <>
      <MobileChartScrollHint />
      <Box sx={{ WebkitOverflowScrolling: "touch", "&::-webkit-scrollbar": { display: "none" }, mt: 0.5, overflowX: "auto", overscrollBehaviorX: "contain", scrollbarWidth: "none" }}>
        <Box component="svg" preserveAspectRatio="none" sx={{ display: "block", height: 230, minWidth: 480, width: "100%" }} viewBox="0 0 640 230">
        <line stroke="#d9e1ec" strokeWidth="1" x1="30" x2="610" y1={baseline} y2={baseline} />
        <polyline fill="none" points={line} stroke="#00796b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {points.map((point, index) => {
          const value = point.metrics[metricId].value ?? 0;
          const x = pointX(index);
          const y = yFor(value, range);
          return <g key={point.key}>
            <title>{`${labelFor(chartId, point)}: ${point.metrics[metricId].display}`}</title>
            <circle cx={x} cy={y} fill={value < 0 ? "#c62828" : "#00796b"} r="4" />
            {labelIndexes.has(index) ? <text fill="#627083" fontSize="11" textAnchor="middle" x={x} y="211">{labelFor(chartId, point)}</text> : null}
          </g>;
        })}
        </Box>
      </Box>
    </>
  );
}

function ColumnChart({ points, metricId }: { points: readonly TimingPoint[]; metricId: TimingMetricId }) {
  if (!points.length) return <EmptyChart />;
  const values = valuesFor(points, metricId);
  const range = chartRange(values);
  const baseline = yFor(0, range);
  return (
    <>
      <MobileChartScrollHint />
      <Box sx={{ WebkitOverflowScrolling: "touch", "&::-webkit-scrollbar": { display: "none" }, mt: 0.5, overflowX: "auto", overscrollBehaviorX: "contain", scrollbarWidth: "none" }}>
        <Box component="svg" preserveAspectRatio="none" sx={{ display: "block", height: 230, minWidth: 480, width: "100%" }} viewBox="0 0 640 230">
        <line stroke="#d9e1ec" strokeWidth="1" x1="20" x2="620" y1={baseline} y2={baseline} />
        {points.map((point, index) => {
          const value = point.metrics[metricId].value ?? 0;
          const x = 38 + index * (560 / points.length);
          const y = yFor(value, range);
          const height = Math.abs(y - baseline);
          return <g key={point.key}>
            <title>{`${point.label}: ${point.metrics[metricId].display}`}</title>
            <rect fill={value < 0 ? "#c62828" : "#00796b"} height={Math.max(2, height)} rx="4" width={Math.max(28, 430 / points.length)} x={x} y={value >= 0 ? y : baseline} />
            <text fill="#627083" fontSize="11" textAnchor="middle" x={x + Math.max(28, 430 / points.length) / 2} y="211">{point.label.slice(0, 3)}</text>
          </g>;
        })}
        </Box>
      </Box>
    </>
  );
}

function HorizontalBarChart({ points, metricId }: { points: readonly TimingPoint[]; metricId: TimingMetricId }) {
  if (!points.length) return <EmptyChart />;
  const values = valuesFor(points, metricId);
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  return (
    <Stack spacing={1.1} sx={{ mt: 2.25 }}>
      {points.map((point) => {
        const value = point.metrics[metricId].value ?? 0;
        return (
          <Stack direction="row" key={point.key} spacing={1} sx={{ alignItems: "center" }} title={`${point.label}: ${point.metrics[metricId].display}`}>
            <Typography color="text.secondary" sx={{ flex: "0 0 92px", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{labelFor("entry_time_bucket", point)}</Typography>
            <Box sx={{ bgcolor: "#edf1f6", borderRadius: 99, flex: 1, height: 14, overflow: "hidden" }}>
              <Box sx={{ bgcolor: value < 0 ? "error.main" : "success.main", borderRadius: 99, height: "100%", width: `${Math.max(3, (Math.abs(value) / max) * 100)}%` }} />
            </Box>
            <Typography sx={{ flex: "0 0 68px", fontSize: 12, fontWeight: 800, textAlign: "right", whiteSpace: "nowrap" }}>{point.metrics[metricId].display}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

function PieChart({ points, donut }: { points: readonly TimingPoint[]; donut: boolean }) {
  const values = points.map((point) => Math.max(0, point.metrics.included_count.value ?? 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return <EmptyChart />;
  const circumference = 2 * Math.PI * 76;
  const colors = ["#00796b", "#1565c0", "#7b1fa2", "#ef6c00", "#c62828", "#455a64", "#6d4c41"];
  const lengths = values.map((value) => (value / total) * circumference);
  const offsets = lengths.map((_length, index) =>
    lengths.slice(0, index).reduce((sum, length) => sum + length, 0));
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ alignItems: "center", mt: 2.5 }}>
      <Box component="svg" sx={{ flex: "0 0 auto", height: 210, width: 210 }} viewBox="0 0 210 210">
        {points.map((point, index) => {
          const length = lengths[index]!;
          return <circle cx="105" cy="105" fill="none" key={point.key} r="76" stroke={colors[index % colors.length]} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offsets[index]!} strokeWidth={donut ? 42 : 152} transform="rotate(-90 105 105)"><title>{`${point.label}: ${values[index]} trades`}</title></circle>;
        })}
        {donut ? <><circle cx="105" cy="105" fill="white" r="48" /><text fill="#1c2736" fontSize="13" fontWeight="700" textAnchor="middle" x="105" y="101">Trade count</text><text fill="#1c2736" fontSize="22" fontWeight="800" textAnchor="middle" x="105" y="126">{total}</text></> : null}
      </Box>
      <Stack spacing={0.75} sx={{ minWidth: 0, width: "100%" }}>
        {points.map((point, index) => <Stack direction="row" key={point.key} spacing={0.75} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}><Box sx={{ bgcolor: colors[index % colors.length], borderRadius: 99, height: 9, width: 9 }} /><Typography sx={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{point.label}</Typography></Stack>
          <Typography sx={{ fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>{values[index]}</Typography>
        </Stack>)}
      </Stack>
    </Stack>
  );
}

function ChartPanel({ chart, points, metricId, timezone, styles }: { chart: (typeof CHARTS)[number]; points: readonly TimingPoint[]; metricId: TimingMetricId; timezone: string; styles: readonly Readonly<{ id: TimingChartStyle; label: string }>[] }) {
  const [chartStyle, setChartStyle] = useState<TimingChartStyle>("horizontal_bars");
  return (
    <Paper sx={{ minWidth: 0, p: { xs: 1.5, sm: 2.25 } }} variant="outlined">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ alignItems: { sm: "baseline" }, justifyContent: "space-between" }}>
        <Box>
          <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">
            {chart.title}{chart.showTimezone ? ` (${timezone === "America/New_York" ? "Eastern Time" : timezone})` : ""}
          </Typography>
          <Typography color="text.secondary" variant="body2">{MEASURES.find((measure) => measure.id === metricId)?.label}</Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
          <BestLabel chart={chart} metricId={metricId} points={points} />
          <TextField
            aria-label={`${chart.title} chart type`}
            onChange={(event) => setChartStyle(event.target.value as TimingChartStyle)}
            select
            size="small"
            sx={{ minWidth: { sm: 112 } }}
            value={chartStyle}
          >
            {styles.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
          </TextField>
        </Stack>
      </Stack>
      {chartStyle === "columns" ? <ColumnChart metricId={metricId} points={points} /> : null}
      {chartStyle === "line" ? <TrendChart chartId={chart.id} metricId={metricId} points={points} /> : null}
      {chartStyle === "horizontal_bars" ? <HorizontalBarChart metricId={metricId} points={points} /> : null}
    </Paper>
  );
}

function TradeDistributionPanel({ chart, points }: { chart: (typeof CHARTS)[number]; points: readonly TimingPoint[] }) {
  return (
    <Paper sx={{ minWidth: 0, p: { xs: 1.5, sm: 2.25 } }} variant="outlined">
      <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Trades by {chart.title.toLowerCase()}</Typography>
      <Typography color="text.secondary" variant="body2">Trade count</Typography>
      <PieChart donut points={points} />
    </Paper>
  );
}

export function TimingAnalyticsClient({ chartData, completedTradeCount, timezone }: { chartData: TimingChartData; completedTradeCount: number; timezone: string }) {
  const [metricId, setMetricId] = useState<TimingMetricId>("net_pnl");
  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ alignItems: { sm: "center" }, justifyContent: "flex-end" }}>
        <TextField label="Measure" onChange={(event) => setMetricId(event.target.value as TimingMetricId)} select size="small" sx={{ minWidth: { sm: 220 } }} value={metricId}>
          {MEASURES.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
        </TextField>
        <FeatureHelpLink href="/help/core-analytics/timing-and-execution#read-timing" label="Timing measures" />
      </Stack>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(2, minmax(0, 1fr))" } }}>
        {CHARTS.map((chart) => <ChartPanel chart={chart} key={chart.id} metricId={metricId} points={chartData[chart.id]} styles={chart.id === "entry_time_bucket" || chart.id === "exit_time_bucket" ? TIME_CHART_STYLES : CATEGORY_CHART_STYLES} timezone={timezone} />)}
      </Box>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(2, minmax(0, 1fr))" } }}>
        <TradeDistributionPanel chart={CHARTS[2]!} points={chartData.entry_weekday} />
        <TradeDistributionPanel chart={CHARTS[3]!} points={chartData.entry_session} />
      </Box>
      <Typography color="text.secondary" variant="caption">Based on {completedTradeCount.toLocaleString("en-US")} completed trade{completedTradeCount === 1 ? "" : "s"}.</Typography>
    </Stack>
  );
}
