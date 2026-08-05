"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

export type TimingMetricId = "net_pnl" | "average_pnl" | "win_rate" | "included_count";
type TimingChartId = "entry_time_bucket" | "exit_time_bucket" | "entry_weekday" | "entry_session";
type TimingPoint = Readonly<{
  key: string;
  label: string;
  metrics: Readonly<Record<TimingMetricId, Readonly<{ display: string; value: number | null }>>>;
}>;
export type TimingChartData = Readonly<Record<TimingChartId, readonly TimingPoint[]>>;

const CHARTS: readonly Readonly<{ id: TimingChartId; label: string; title: string; timezone: boolean }>[] = [
  { id: "entry_time_bucket", label: "Entry time", title: "Entry time", timezone: true },
  { id: "exit_time_bucket", label: "Exit time", title: "Exit time", timezone: true },
  { id: "entry_weekday", label: "Day of week", title: "Day of week", timezone: false },
  { id: "entry_session", label: "Trading session", title: "Trading session", timezone: false },
];

const MEASURES: readonly Readonly<{ id: TimingMetricId; label: string }>[] = [
  { id: "net_pnl", label: "Net P/L" },
  { id: "average_pnl", label: "Average P/L per trade" },
  { id: "win_rate", label: "Win rate" },
  { id: "included_count", label: "Trade count" },
];

function timeLabel(value: string): string {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function displayedLabel(chart: TimingChartId, point: TimingPoint): string {
  return chart === "entry_time_bucket" || chart === "exit_time_bucket"
    ? timeLabel(point.label)
    : point.label;
}

function timingTitle(chart: Readonly<{ title: string; timezone: boolean }>, timezone: string): string {
  return chart.timezone ? `${chart.title} (${timezone === "America/New_York" ? "Eastern Time" : timezone})` : chart.title;
}

export function TimingAnalyticsClient({
  chartData,
  completedTradeCount,
  timezone,
}: {
  chartData: TimingChartData;
  completedTradeCount: number;
  timezone: string;
}) {
  const [chartId, setChartId] = useState<TimingChartId>("entry_time_bucket");
  const [metricId, setMetricId] = useState<TimingMetricId>("net_pnl");
  const chart = CHARTS.find((entry) => entry.id === chartId) ?? CHARTS[0]!;
  const measure = MEASURES.find((entry) => entry.id === metricId) ?? MEASURES[0]!;
  const points = chartData[chartId];
  const values = useMemo(() => points.map((point) => point.metrics[metricId].value ?? 0), [metricId, points]);
  const largestAbsoluteValue = Math.max(1, ...values.map((value) => Math.abs(value)));
  const includesNegativeValue = values.some((value) => value < 0);
  const bestPoint = useMemo(() => points
    .filter((point) => point.metrics[metricId].value !== null)
    .sort((left, right) => (right.metrics[metricId].value ?? Number.NEGATIVE_INFINITY) -
      (left.metrics[metricId].value ?? Number.NEGATIVE_INFINITY))[0] ?? null, [metricId, points]);

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }} variant="outlined">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            label="Chart"
            onChange={(event) => setChartId(event.target.value as TimingChartId)}
            select
            size="small"
            sx={{ minWidth: { sm: 190 } }}
            value={chartId}
          >
            {CHARTS.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
          </TextField>
          <TextField
            label="Measure"
            onChange={(event) => setMetricId(event.target.value as TimingMetricId)}
            select
            size="small"
            sx={{ minWidth: { sm: 220 } }}
            value={metricId}
          >
            {MEASURES.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ overflow: "hidden", p: { xs: 1.5, sm: 2.5 } }} variant="outlined">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ alignItems: { sm: "baseline" }, justifyContent: "space-between" }}>
          <Typography component="h2" sx={{ fontWeight: 850 }} variant="h5">
            {timingTitle(chart, timezone)}
          </Typography>
          {bestPoint ? (
            <Typography color="text.secondary" variant="body2">
              Best {chart.label.toLowerCase()}: <Box component="span" sx={{ color: "text.primary", fontWeight: 800 }}>{displayedLabel(chartId, bestPoint)}</Box>
            </Typography>
          ) : null}
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
          {measure.label}
        </Typography>

        {points.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 7 }} variant="body2">No completed trades are available for this view.</Typography>
        ) : (
          <Box sx={{ mt: 3, overflowX: "auto", pb: 1 }}>
            <Box
              sx={{
                display: "grid",
                gap: { xs: 0.75, sm: 1.25 },
                gridTemplateColumns: `repeat(${points.length}, minmax(58px, 1fr))`,
                minWidth: Math.max(320, points.length * 68),
              }}
            >
              {points.map((point) => {
                const metric = point.metrics[metricId];
                const value = metric.value ?? 0;
                const height = `${Math.max(4, (Math.abs(value) / largestAbsoluteValue) * 100)}%`;
                const positive = value >= 0;
                const baseline = includesNegativeValue ? "50%" : "100%";
                return (
                  <Box key={point.key} sx={{ minWidth: 0 }} title={`${displayedLabel(chartId, point)}: ${metric.display}`}>
                    <Box sx={{ borderBottom: 1, borderColor: "divider", height: 220, position: "relative" }}>
                      <Box sx={{ borderTop: includesNegativeValue ? 1 : 0, borderColor: "divider", left: 0, position: "absolute", right: 0, top: baseline }} />
                      <Box
                        sx={{
                          bgcolor: value < 0 ? "error.main" : "success.main",
                          borderRadius: "4px 4px 0 0",
                          bottom: positive ? baseline : "auto",
                          height,
                          left: "18%",
                          minHeight: 4,
                          position: "absolute",
                          right: "18%",
                          top: positive ? "auto" : baseline,
                        }}
                      />
                    </Box>
                    <Typography align="center" color="text.secondary" sx={{ fontSize: 11, mt: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {displayedLabel(chartId, point)}
                    </Typography>
                    <Typography align="center" sx={{ fontSize: 11, fontWeight: 800, mt: 0.25, whiteSpace: "nowrap" }}>
                      {metric.display}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Paper>

      <Typography color="text.secondary" variant="caption">
        Based on {completedTradeCount.toLocaleString("en-US")} completed trade{completedTradeCount === 1 ? "" : "s"}.
      </Typography>
    </Stack>
  );
}
