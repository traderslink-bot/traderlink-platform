"use client";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState, useTransition } from "react";

import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMetric,
  journalAnalyticsMetricCaption,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import type { JournalAnalyticsMetricResult } from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../../dashboard-template";

import {
  createAnalyticsLabSavedView,
  retireAnalyticsLabSavedView,
  runAnalyticsLabQuery,
  updateAnalyticsLabSavedView,
} from "./actions";
import type {
  AnalyticsLabPlatformPageModel,
  AnalyticsLabPlatformPreview,
  AnalyticsLabPlatformQuery,
} from "./analytics-lab-platform-types";

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/^./u, (letter) => letter.toUpperCase());
}

function metricNumber(metric: JournalAnalyticsMetricResult | null): number | null {
  const value = metric?.value;
  if (!value) return null;
  const numeric = value.kind === "integer"
    ? value.value
    : value.kind === "decimal"
      ? Number(value.valueDecimal)
      : value.kind === "rational"
        ? Number(value.roundedDecimal)
        : value.kind === "duration"
          ? value.milliseconds
          : Number.NaN;
  return Number.isFinite(numeric) ? numeric : null;
}

function QuerySelect({
  label,
  value,
  children,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  children: React.ReactNode;
  onChange: (value: string) => void;
}>) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <FormControl fullWidth size="small">
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        label={label}
        labelId={`${id}-label`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </Select>
    </FormControl>
  );
}

function SummaryCards({ preview }: { preview: AnalyticsLabPlatformPreview }) {
  const metrics = ["total_trades", "net_pnl", "gross_pnl", "win_rate", "average_pnl"];
  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { lg: "repeat(5, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", xs: "1fr" } }}>
      {metrics.map((metricId) => {
        const values = preview.response.partitions.flatMap((partition) => {
          const metric = partition.metrics.find((item) => item.metricId === metricId);
          return metric ? [formatJournalAnalyticsMetric(metric)] : [];
        });
        const metric = preview.response.partitions
          .flatMap((partition) => partition.metrics)
          .find((item) => item.metricId === metricId);
        return (
          <DashboardMetricCard
            caption={metric ? journalAnalyticsMetricCaption(metric) : "N/A"}
            key={metricId}
            label={metric?.title ?? humanize(metricId)}
            value={values.length > 0 ? values.join(" / ") : "N/A"}
          />
        );
      })}
    </Box>
  );
}

function GroupChart({ preview }: { preview: AnalyticsLabPlatformPreview }) {
  const rows = preview.response.partitions.flatMap((partition) =>
    partition.groups.flatMap((group) => {
      const metric = group.metrics.find((item) =>
        item.metricId === preview.selectedMetric?.metricId);
      const value = metricNumber(metric ?? null);
      return metric && value !== null
        ? [{ currency: partition.currency, label: group.label, metric, value }]
        : [];
    }));
  const maximum = Math.max(1, ...rows.map((row) => Math.abs(row.value)));
  if (rows.length === 0) {
    return <Alert severity="info">No chartable value is available for this metric and filter combination.</Alert>;
  }
  return (
    <Stack spacing={1.25}>
      {rows.slice(0, 100).map((row, index) => (
        <Box key={`${row.currency ?? "none"}-${row.label}-${index}`}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
            <Typography noWrap variant="body2">
              {row.label}{row.currency ? ` · ${row.currency}` : ""}
            </Typography>
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              {formatJournalAnalyticsMetric(row.metric)}
            </Typography>
          </Stack>
          <Box sx={{ bgcolor: "action.hover", borderRadius: 999, height: 8, mt: 0.5, overflow: "hidden" }}>
            <Box sx={{ bgcolor: row.value < 0 ? "error.main" : "success.main", borderRadius: 999, height: "100%", width: `${Math.max(1, Math.abs(row.value) / maximum * 100)}%` }} />
          </Box>
        </Box>
      ))}
      {rows.length > 100 ? (
        <Typography color="text.secondary" variant="caption">
          Showing the first 100 of {rows.length.toLocaleString("en-US")} groups.
        </Typography>
      ) : null}
    </Stack>
  );
}

function ExactInput({
  label,
  value,
  onChange,
}: Readonly<{
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}>) {
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

export default function AnalyticsLabPlatformClient({
  model,
}: {
  model: AnalyticsLabPlatformPageModel;
}) {
  const [query, setQuery] = useState(model.initialQuery);
  const [preview, setPreview] = useState(model.initialPreview);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState(model.savedViews);
  const [selectedSavedViewId, setSelectedSavedViewId] = useState<string | null>(null);
  const [savedViewName, setSavedViewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const selectedCapability = useMemo(() => model.metrics.find((metric) =>
    metric.metricId === query.metricId) ?? null, [model.metrics, query.metricId]);
  const patch = <K extends keyof AnalyticsLabPlatformQuery>(
    key: K,
    value: AnalyticsLabPlatformQuery[K],
  ) => setQuery((current) => Object.freeze({ ...current, [key]: value }));

  function run(next = query): void {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await runAnalyticsLabQuery(next);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setPreview(result.preview);
    });
  }

  const selectedSavedView = useMemo(() => savedViews.find((view) =>
    view.savedViewId === selectedSavedViewId) ?? null,
  [savedViews, selectedSavedViewId]);

  function chooseSavedView(savedViewId: string): void {
    const saved = savedViews.find((view) => view.savedViewId === savedViewId);
    if (!saved) {
      setSelectedSavedViewId(null);
      setSavedViewName("");
      return;
    }
    setSelectedSavedViewId(saved.savedViewId);
    setSavedViewName(saved.name);
    setQuery(saved.query);
    run(saved.query);
  }

  function saveNewView(): void {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await createAnalyticsLabSavedView({
        name: savedViewName,
        query,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSavedViews(result.savedViews);
      setSelectedSavedViewId(result.selectedSavedViewId);
      setNotice("Saved analytics view created.");
    });
  }

  function updateCurrentView(): void {
    if (!selectedSavedView) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await updateAnalyticsLabSavedView({
        savedViewId: selectedSavedView.savedViewId,
        expectedRevision: selectedSavedView.revision,
        name: savedViewName,
        query,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSavedViews(result.savedViews);
      setSelectedSavedViewId(result.selectedSavedViewId);
      setNotice("Saved analytics view updated.");
    });
  }

  function retireCurrentView(): void {
    if (!selectedSavedView) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await retireAnalyticsLabSavedView({
        expectedAccountSelectionRef: query.expectedAccountSelectionRef,
        savedViewId: selectedSavedView.savedViewId,
        expectedRevision: selectedSavedView.revision,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSavedViews(result.savedViews);
      setSelectedSavedViewId(null);
      setSavedViewName("");
      setNotice("Saved analytics view retired.");
    });
  }

  const timeBuckets = useMemo(() => {
    const values: string[] = [];
    for (let minute = 0; minute < 24 * 60; minute += query.entryTimeBucketMinutes) {
      values.push(`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
    }
    return values;
  }, [query.entryTimeBucketMinutes]);

  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Analytics</Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Analytics Lab</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 900, mt: 1 }} variant="body2">
          Explore every accepted Journal Analytics capability for the selected Journal account. Missing facts stay visible as unavailable coverage; no V3 or sample results are substituted.
        </Typography>
      </Box>

      <DashboardPanel title="Build an analytics view">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { lg: "repeat(5, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))", xs: "1fr" } }}>
          <QuerySelect label="Metric" onChange={(value) => patch("metricId", value)} value={query.metricId}>
            {model.metrics.map((metric) => (
              <MenuItem key={metric.metricId} value={metric.metricId}>
                {metric.title}{metric.capabilityState === "unavailable" ? " · unavailable" : ""}
              </MenuItem>
            ))}
          </QuerySelect>
          <QuerySelect label="Group by" onChange={(value) => patch("grouping", value as AnalyticsLabPlatformQuery["grouping"])} value={query.grouping}>
            {model.groupings.map((grouping) => <MenuItem key={grouping.value} value={grouping.value}>{grouping.label}</MenuItem>)}
          </QuerySelect>
          <QuerySelect label="P/L basis" onChange={(value) => patch("moneyBasis", value as "gross" | "net")} value={query.moneyBasis}>
            <MenuItem value="net">Net when fees are covered</MenuItem>
            <MenuItem value="gross">Gross</MenuItem>
          </QuerySelect>
          <QuerySelect label="Currency" onChange={(value) => patch("currency", value === "all" ? null : value)} value={query.currency ?? "all"}>
            <MenuItem value="all">All currencies</MenuItem>
            {model.currencies.map((currency) => <MenuItem key={currency} value={currency}>{currency}</MenuItem>)}
          </QuerySelect>
          <QuerySelect label="Ticker" onChange={(value) => patch("symbol", value === "all" ? null : value)} value={query.symbol ?? "all"}>
            <MenuItem value="all">All tickers</MenuItem>
            {model.symbols.map((symbol) => <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>)}
          </QuerySelect>
        </Box>

        {selectedCapability ? (
          <Alert severity={selectedCapability.capabilityState === "unavailable" ? "info" : "success"} sx={{ mt: 2 }}>
            {selectedCapability.description}
            {selectedCapability.unavailableReasonCode
              ? ` Missing fact: ${humanize(selectedCapability.unavailableReasonCode)}.`
              : ` Coverage: ${humanize(selectedCapability.capabilityState)}.`}
          </Alert>
        ) : null}

        <Box sx={{ alignItems: "start", display: "grid", gap: 1.5, gridTemplateColumns: { lg: "repeat(4, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))", xs: "1fr" }, mt: 2 }}>
          <TextField fullWidth label="Closing date from" onChange={(event) => patch("startDate", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: model.minimumDate, max: model.maximumDate } }} type="date" value={query.startDate} />
          <TextField fullWidth label="Closing date through" onChange={(event) => patch("endDate", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: model.minimumDate, max: model.maximumDate } }} type="date" value={query.endDate} />
          <QuerySelect label="Direction" onChange={(value) => patch("direction", value === "all" ? null : value as "long" | "short")} value={query.direction ?? "all"}>
            <MenuItem value="all">All directions</MenuItem><MenuItem value="long">Long</MenuItem><MenuItem value="short">Short</MenuItem>
          </QuerySelect>
          <QuerySelect label="Result" onChange={(value) => patch("outcome", value === "all" ? null : value as "win" | "loss" | "flat")} value={query.outcome ?? "all"}>
            <MenuItem value="all">All results</MenuItem><MenuItem value="win">Win</MenuItem><MenuItem value="loss">Loss</MenuItem><MenuItem value="flat">Flat</MenuItem>
          </QuerySelect>
          <QuerySelect label="Trade type" onChange={(value) => patch("tradeClassification", value === "all" ? null : value as AnalyticsLabPlatformQuery["tradeClassification"])} value={query.tradeClassification ?? "all"}>
            <MenuItem value="all">All completed trades</MenuItem><MenuItem value="day_trade">Day trades</MenuItem><MenuItem value="multi_day_trade">Multi-day trades</MenuItem>
          </QuerySelect>
          <QuerySelect label="Execution source" onChange={(value) => patch("provenance", value === "all" ? null : value as AnalyticsLabPlatformQuery["provenance"])} value={query.provenance ?? "all"}>
            <MenuItem value="all">All sources</MenuItem><MenuItem value="broker_only">Broker only</MenuItem><MenuItem value="manual_only">Manual only</MenuItem><MenuItem value="correction_only">Correction only</MenuItem><MenuItem value="mixed">Mixed</MenuItem><MenuItem value="unknown">Unknown</MenuItem>
          </QuerySelect>
          <QuerySelect label="Entry weekday" onChange={(value) => patch("entryWeekday", value === "all" ? null : value as AnalyticsLabPlatformQuery["entryWeekday"])} value={query.entryWeekday ?? "all"}>
            <MenuItem value="all">All weekdays</MenuItem>{["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => <MenuItem key={day} value={day}>{humanize(day)}</MenuItem>)}
          </QuerySelect>
          <QuerySelect label="Entry time interval" onChange={(value) => { const minutes = Number(value) as 5 | 15 | 30 | 60; setQuery((current) => Object.freeze({ ...current, entryTimeBucket: null, entryTimeBucketMinutes: minutes })); }} value={String(query.entryTimeBucketMinutes)}>
            {[5, 15, 30, 60].map((minutes) => <MenuItem key={minutes} value={String(minutes)}>{minutes} minutes</MenuItem>)}
          </QuerySelect>
          <QuerySelect label="Entry time" onChange={(value) => patch("entryTimeBucket", value === "all" ? null : value)} value={query.entryTimeBucket ?? "all"}>
            <MenuItem value="all">All entry times</MenuItem>{timeBuckets.map((time) => <MenuItem key={time} value={time}>{time}</MenuItem>)}
          </QuerySelect>
        </Box>

        <Box component="details" sx={{ mt: 2 }}>
          <Typography component="summary" sx={{ alignItems: "center", cursor: "pointer", display: "flex", fontWeight: 700, gap: 1 }} variant="body2">
            <TuneRoundedIcon fontSize="small" /> Exact range filters
          </Typography>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { lg: "repeat(4, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))", xs: "1fr" }, mt: 2 }}>
            <ExactInput label="Minimum hold (seconds)" onChange={(value) => patch("minimumHoldingSeconds", value)} value={query.minimumHoldingSeconds} />
            <ExactInput label="Maximum hold (seconds)" onChange={(value) => patch("maximumHoldingSeconds", value)} value={query.maximumHoldingSeconds} />
            <ExactInput label="Minimum entered quantity" onChange={(value) => patch("minimumEnteredQuantity", value)} value={query.minimumEnteredQuantity} />
            <ExactInput label="Maximum entered quantity" onChange={(value) => patch("maximumEnteredQuantity", value)} value={query.maximumEnteredQuantity} />
            <ExactInput label="Minimum position quantity" onChange={(value) => patch("minimumPositionQuantity", value)} value={query.minimumPositionQuantity} />
            <ExactInput label="Maximum position quantity" onChange={(value) => patch("maximumPositionQuantity", value)} value={query.maximumPositionQuantity} />
            <ExactInput label="Minimum entry notional" onChange={(value) => patch("minimumEntryNotional", value)} value={query.minimumEntryNotional} />
            <ExactInput label="Maximum entry notional" onChange={(value) => patch("maximumEntryNotional", value)} value={query.maximumEntryNotional} />
          </Box>
        </Box>

        <Stack direction={{ sm: "row", xs: "column" }} spacing={1.25} sx={{ mt: 2.5 }}>
          <DashboardPrimaryAction disabled={isPending} onClick={() => run()} startIcon={<RefreshRoundedIcon />}>
            {isPending ? "Calculating" : "Run analytics"}
          </DashboardPrimaryAction>
          <DashboardSecondaryAction disabled={isPending} onClick={() => { setQuery(model.initialQuery); run(model.initialQuery); }}>
            Reset filters
          </DashboardSecondaryAction>
        </Stack>
      </DashboardPanel>

      <DashboardPanel title="Saved analytics views">
        <Box sx={{ alignItems: "start", display: "grid", gap: 1.5, gridTemplateColumns: { md: "minmax(220px, 1fr) minmax(220px, 1fr)", xs: "1fr" } }}>
          <QuerySelect label="Saved view" onChange={chooseSavedView} value={selectedSavedViewId ?? ""}>
            <MenuItem value="">New unsaved view</MenuItem>
            {savedViews.map((view) => (
              <MenuItem key={view.savedViewId} value={view.savedViewId}>{view.name}</MenuItem>
            ))}
          </QuerySelect>
          <TextField
            fullWidth
            label="View name"
            onChange={(event) => setSavedViewName(event.target.value)}
            size="small"
            value={savedViewName}
          />
        </Box>
        <Stack direction={{ sm: "row", xs: "column" }} spacing={1.25} sx={{ mt: 2 }}>
          <DashboardSecondaryAction disabled={isPending || savedViewName.trim().length === 0} onClick={saveNewView} startIcon={<SaveRoundedIcon />}>
            Save as new view
          </DashboardSecondaryAction>
          <DashboardSecondaryAction disabled={isPending || !selectedSavedView || savedViewName.trim().length === 0} onClick={updateCurrentView}>
            Update saved view
          </DashboardSecondaryAction>
          <DashboardSecondaryAction disabled={isPending || !selectedSavedView} onClick={retireCurrentView} startIcon={<DeleteOutlineRoundedIcon />}>
            Retire saved view
          </DashboardSecondaryAction>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="caption">
          Saved views belong only to the selected Journal account. Retiring a view preserves its version history.
        </Typography>
      </DashboardPanel>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {notice ? <Alert severity="success">{notice}</Alert> : null}
      <SummaryCards preview={preview} />

      <DashboardPanel title={preview.selectedMetric?.title ?? "Selected metric"}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 2 }}>
          <Chip label={`${preview.response.crossPartitionCounts.includedCount.toLocaleString("en-US")} included`} size="small" />
          <Chip label={`${preview.response.crossPartitionCounts.feeIncompleteCount.toLocaleString("en-US")} fee-incomplete`} size="small" variant="outlined" />
          {preview.selectedMetric ? <Chip label={humanize(preview.selectedMetric.state)} size="small" variant="outlined" /> : null}
        </Stack>
        <GroupChart preview={preview} />
      </DashboardPanel>

      {preview.response.limitations.length > 0 ? (
        <DashboardPanel title="Coverage limits">
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {preview.response.limitations.map((limitation) => <Chip key={limitation} label={humanize(limitation)} size="small" variant="outlined" />)}
          </Stack>
        </DashboardPanel>
      ) : null}

      <DashboardPanel title="Matching trades">
        {preview.evidence ? (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Closed</TableCell><TableCell>Ticker</TableCell><TableCell>Direction</TableCell><TableCell align="right">P/L</TableCell><TableCell align="right">Quantity</TableCell><TableCell align="right">Hold</TableCell><TableCell>Coverage</TableCell></TableRow></TableHead>
              <TableBody>
                {preview.evidence.rows.map((row) => (
                  <TableRow key={row.roundTripId}>
                    <TableCell>{row.closeLocalDate}</TableCell>
                    <TableCell>{row.displayedSymbol}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{row.direction}</TableCell>
                    <TableCell align="right">{row.selectedPnlDecimal === null ? "N/A" : (formatJournalAnalyticsDecimal(row.selectedPnlDecimal, 2, true).startsWith("-") ? `-$${formatJournalAnalyticsDecimal(row.selectedPnlDecimal, 2, true).slice(1)}` : `$${formatJournalAnalyticsDecimal(row.selectedPnlDecimal, 2, true)}`)}</TableCell>
                    <TableCell align="right">{formatJournalAnalyticsDecimal(row.enteredQuantityDecimal)}</TableCell>
                    <TableCell align="right">{formatJournalAnalyticsDecimal(String(row.holdingDurationMilliseconds / 60_000))} min</TableCell>
                    <TableCell>{row.chargeCoverage === "complete" ? "Fee covered" : "Fees unavailable"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : <Alert severity="info">{preview.evidenceUnavailableReason}</Alert>}
      </DashboardPanel>
    </DashboardPage>
  );
}
