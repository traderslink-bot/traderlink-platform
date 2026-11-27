"use client";

import { Box, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { SCAN_METRICS, SCAN_SESSION_LABELS } from "@/src/modules/scanner/custom/definition";

export const quickRelativeVolumeMetrics = ["sameTimeRegularVolume", "sameTimePremarketVolume", "sameTimeAfterHoursVolume", "volumeVsDailyAverage20"] as const;
export const quickVolumeMetrics = ["dayVolume", "premarketVolume", "regularVolume", "postMarketVolume", "volume"] as const;
export type QuickRvolMetric = typeof quickRelativeVolumeMetrics[number];
export type QuickVolumeMetric = typeof quickVolumeMetrics[number];
export type QuickNumericFilter = "price" | "float" | "rvol" | "volume" | "dayChange";
export type QuickRange = Readonly<{ minimum: string; maximum: string }>;

const relativeVolumeLabels = {
  sameTimeRegularVolume: "Regular · same time",
  sameTimePremarketVolume: "Premarket · same time",
  sameTimeAfterHoursVolume: "After hours · same time",
  volumeVsDailyAverage20: "Regular · 20-session avg",
} satisfies Record<QuickRvolMetric, string>;

export function ScannerQuickFilters({ ranges, rvolMetric, volumeMetric, sessions, onRange, onRvolMetric, onVolumeMetric, onSessions }: {
  ranges: Record<QuickNumericFilter, QuickRange | undefined>;
  rvolMetric: QuickRvolMetric;
  volumeMetric: QuickVolumeMetric;
  sessions: string[];
  onRange: (filter: QuickNumericFilter, bound: keyof QuickRange, value: string) => void;
  onRvolMetric: (metric: QuickRvolMetric) => void;
  onVolumeMetric: (metric: QuickVolumeMetric) => void;
  onSessions: (sessions: string[]) => void;
}) {
  const numberField = (filter: QuickNumericFilter, bound: keyof QuickRange, label: string, name: string) =>
    <TextField size="small" label={label} value={ranges[filter]?.[bound] ?? ""}
      onChange={event => onRange(filter, bound, event.target.value)}
      slotProps={{ htmlInput: { "aria-label": name, inputMode: "text", maxLength: 16 } }}
      sx={{ minWidth: 0, width: "100%" }} />;

  return <Box role="group" aria-label="Common filters" sx={{
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
    alignItems: "start", gap: 1,
  }}>
    <Stack role="group" aria-label="Price" spacing={0.75}>
      <Typography variant="subtitle2">Price</Typography>
      <Stack direction="row" spacing={0.5}>
        {numberField("price", "minimum", "Min $", "Quick price minimum")}
        {numberField("price", "maximum", "Max $", "Quick price maximum")}
      </Stack>
    </Stack>
    <Stack role="group" aria-label="Float" spacing={0.75}>
      <Typography variant="subtitle2">Float</Typography>
      {numberField("float", "maximum", "Max shares", "Quick float maximum")}
    </Stack>
    <Stack role="group" aria-label="RVOL" spacing={0.75}>
      <Typography variant="subtitle2">RVOL</Typography>
      {numberField("rvol", "minimum", "Min ×", "Quick RVOL minimum")}
      <TextField size="small" select label="Compare with" value={rvolMetric}
        onChange={event => onRvolMetric(event.target.value as QuickRvolMetric)}>
        {quickRelativeVolumeMetrics.map(metric =>
          <MenuItem key={metric} value={metric}>{relativeVolumeLabels[metric]}</MenuItem>)}
      </TextField>
    </Stack>
    <Stack role="group" aria-label="Volume" spacing={0.75}>
      <Typography variant="subtitle2">Volume</Typography>
      {numberField("volume", "minimum", "Min shares", "Quick volume minimum")}
      <TextField size="small" select label="Volume basis" value={volumeMetric}
        onChange={event => onVolumeMetric(event.target.value as QuickVolumeMetric)}>
        {quickVolumeMetrics.map(metric => <MenuItem key={metric} value={metric}>{SCAN_METRICS[metric].label}</MenuItem>)}
      </TextField>
    </Stack>
    <Stack role="group" aria-label="Day change" spacing={0.75}>
      <Typography variant="subtitle2">Day change</Typography>
      <Stack direction="row" spacing={0.5}>
        {numberField("dayChange", "minimum", "Min %", "Quick day change minimum")}
        {numberField("dayChange", "maximum", "Max %", "Quick day change maximum")}
      </Stack>
    </Stack>
    <Stack role="group" aria-label="Session" spacing={0.75}>
      <Typography variant="subtitle2">Session</Typography>
      <TextField size="small" select label="Trading session" value={sessions}
        slotProps={{ select: { multiple: true, renderValue: selected =>
          (selected as string[]).map(value => SCAN_SESSION_LABELS[value as keyof typeof SCAN_SESSION_LABELS]).join(", "),
        } }}
        onChange={event => onSessions(Array.isArray(event.target.value) ? event.target.value : event.target.value.split(","))}>
        {Object.entries(SCAN_SESSION_LABELS).map(([session, label]) =>
          <MenuItem key={session} value={session}>{label}</MenuItem>)}
      </TextField>
    </Stack>
  </Box>;
}
