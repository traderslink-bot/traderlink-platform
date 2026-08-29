"use client";

import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useId, useMemo, useState, useTransition } from "react";

import type {
  JournalAnalyticsExactValue,
  JournalAnalyticsMetricResult,
  JournalAnalyticsRoundTripTableRow,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
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
} from "@/src/modules/journal-analytics/presentation/trade-explorer-ordering";
import { OfflineSavedViewStatus } from "@/app/pwa/offline-saved-view-status";
import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../../../dashboard-template";
import { HorizontalScrollRegion } from "../../../horizontal-scroll-region";
import type { AnalyticsLabPlatformQuery } from "../../lab/analytics-lab-platform-types";

import {
  compareTradeExplorerGroups,
  createTradeExplorerComparisonStudy,
  retireTradeExplorerComparisonStudy,
  updateTradeExplorerComparisonStudy,
} from "../actions";
import {
  TRADE_EXPLORER_COMPARISON_VERSION,
  type TradeExplorerComparisonResult,
  type TradeExplorerComparisonStudy,
} from "../trade-explorer-comparison-model";
import type { TradeExplorerPageModel } from "../trade-explorer-service";

type GroupDraft = Readonly<{
  name: string;
  query: AnalyticsLabPlatformQuery;
}>;

const SCORECARD_METRICS = Object.freeze([
  Object.freeze({ metricId: "total_trades", label: "Completed trades" }),
  Object.freeze({ metricId: "selected_pnl", label: "P/L" }),
  Object.freeze({ metricId: "win_rate", label: "Win rate" }),
  Object.freeze({ metricId: "average_pnl", label: "Average P/L" }),
  Object.freeze({ metricId: "profit_factor", label: "Profit factor" }),
  Object.freeze({ metricId: "expectancy", label: "Expectancy" }),
  Object.freeze({ metricId: "return_on_entry_notional", label: "Return on entry value" }),
  Object.freeze({ metricId: "average_holding_time", label: "Average holding time" }),
]);

const WEEKDAYS = Object.freeze([
  ["monday", "Monday"], ["tuesday", "Tuesday"], ["wednesday", "Wednesday"],
  ["thursday", "Thursday"], ["friday", "Friday"], ["saturday", "Saturday"],
  ["sunday", "Sunday"],
] as const);

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function midpoint(startDate: string, endDate: string): string {
  const distance = Math.max(0, Math.floor((Date.parse(`${endDate}T00:00:00.000Z`) -
    Date.parse(`${startDate}T00:00:00.000Z`)) / 86_400_000));
  return addDays(startDate, Math.floor(distance / 2));
}

function initialGroups(model: TradeExplorerPageModel): readonly GroupDraft[] {
  const split = midpoint(model.minimumDate, model.maximumDate);
  return Object.freeze([
    Object.freeze({
      name: "Earlier period",
      query: Object.freeze({
        ...model.initialQuery,
        grouping: "total" as const,
        metricId: "total_trades",
        startDate: model.minimumDate,
        endDate: split,
        evidenceRows: 50 as const,
      }),
    }),
    Object.freeze({
      name: "Later period",
      query: Object.freeze({
        ...model.initialQuery,
        grouping: "total" as const,
        metricId: "total_trades",
        startDate: split === model.maximumDate ? model.minimumDate : addDays(split, 1),
        endDate: model.maximumDate,
        evidenceRows: 50 as const,
      }),
    }),
  ]);
}

function canonicalQuery(query: AnalyticsLabPlatformQuery): AnalyticsLabPlatformQuery {
  return Object.freeze({
    ...query,
    entryTimeBucket: canonicalTradeExplorerTimeInput(query.entryTimeBucket),
    minimumHoldingSeconds: canonicalTradeExplorerDecimalInput(query.minimumHoldingSeconds),
    maximumHoldingSeconds: canonicalTradeExplorerDecimalInput(query.maximumHoldingSeconds),
    minimumEnteredQuantity: canonicalTradeExplorerDecimalInput(query.minimumEnteredQuantity),
    maximumEnteredQuantity: canonicalTradeExplorerDecimalInput(query.maximumEnteredQuantity),
    minimumPositionQuantity: canonicalTradeExplorerDecimalInput(query.minimumPositionQuantity),
    maximumPositionQuantity: canonicalTradeExplorerDecimalInput(query.maximumPositionQuantity),
    minimumEntryNotional: canonicalTradeExplorerDecimalInput(query.minimumEntryNotional),
    maximumEntryNotional: canonicalTradeExplorerDecimalInput(query.maximumEntryNotional),
  });
}

function metric(
  comparison: TradeExplorerComparisonResult,
  groupIndex: number,
  metricId: string,
): JournalAnalyticsMetricResult | null {
  const group = comparison.groups[groupIndex];
  const partition = group.preview.response.partitions.length === 1
    ? group.preview.response.partitions[0]
    : null;
  const resolvedMetricId = metricId === "selected_pnl"
    ? group.query.moneyBasis === "net" ? "net_pnl" : "gross_pnl"
    : metricId;
  return partition?.metrics.find((candidate) => candidate.metricId === resolvedMetricId) ?? null;
}

function metricText(value: JournalAnalyticsMetricResult | null): string {
  return value?.value === null || !value ? "N/A" : formatJournalAnalyticsMetric(value);
}

function exactValueIsPositive(value: JournalAnalyticsExactValue): boolean {
  if (value.kind === "integer") return value.value > 0;
  if (value.kind === "duration") return value.milliseconds > 0;
  if (value.kind === "decimal") return !value.valueDecimal.startsWith("-") && value.valueDecimal !== "0";
  if (value.kind === "rational") return !value.numeratorDecimal.startsWith("-") && value.numeratorDecimal !== "0";
  return false;
}

function differenceText(
  comparison: TradeExplorerComparisonResult,
  metricId: string,
  comparedGroupIndex: number,
): string {
  const resolvedMetricId = metricId === "selected_pnl"
    ? comparison.groups[0].query.moneyBasis === "net" ? "net_pnl" : "gross_pnl"
    : metricId;
  const difference = comparison.differences.find((candidate) =>
    candidate.metricId === resolvedMetricId &&
    candidate.comparedGroupName === comparison.groups[comparedGroupIndex]?.name);
  const comparedMetric = metric(comparison, comparedGroupIndex, metricId);
  if (!difference?.value || !comparedMetric) return "N/A";
  const formatted = formatJournalAnalyticsMetric(Object.freeze({
    ...comparedMetric,
    state: "complete" as const,
    value: difference.value,
  }));
  return exactValueIsPositive(difference.value) ? `+${formatted}` : formatted;
}

function differenceValue(
  comparison: TradeExplorerComparisonResult,
  metricId: string,
  comparedGroupIndex: number,
): JournalAnalyticsExactValue | null {
  const resolvedMetricId = metricId === "selected_pnl"
    ? comparison.groups[0].query.moneyBasis === "net" ? "net_pnl" : "gross_pnl"
    : metricId;
  return comparison.differences.find((candidate) =>
    candidate.metricId === resolvedMetricId &&
    candidate.comparedGroupName === comparison.groups[comparedGroupIndex]?.name)
    ?.value ?? null;
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
  const id = useId();
  return (
    <FormControl fullWidth size="small">
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select label={label} labelId={`${id}-label`} onChange={(event) => onChange(event.target.value)} value={value}>
        {children}
      </Select>
    </FormControl>
  );
}

function ExactField({
  label,
  onChange,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string | null) => void;
  value: string | null;
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

function GroupEditor({
  group,
  index,
  model,
  onChange,
}: Readonly<{
  group: GroupDraft;
  index: number;
  model: TradeExplorerPageModel;
  onChange: (group: GroupDraft) => void;
}>) {
  const patch = <K extends keyof AnalyticsLabPlatformQuery>(key: K, value: AnalyticsLabPlatformQuery[K]) =>
    onChange(Object.freeze({ ...group, query: Object.freeze({ ...group.query, [key]: value }) }));
  const fieldGrid = {
    display: "grid",
    gap: 1.5,
    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
  } as const;
  return (
    <DashboardPanel eyebrow={`GROUP ${index + 1}`} title={group.name || `Group ${index + 1}`}>
      <Stack spacing={2}>
        <TextField
          fullWidth
          label="Group name"
          onChange={(event) => onChange(Object.freeze({ ...group, name: event.target.value }))}
          size="small"
          value={group.name}
        />
        <Box sx={fieldGrid}>
          <TextField
            label="From"
            onChange={(event) => patch("startDate", event.target.value)}
            size="small"
            slotProps={{
              htmlInput: { max: model.maximumDate, min: model.minimumDate },
              inputLabel: { shrink: true },
            }}
            type="date"
            value={group.query.startDate}
          />
          <TextField
            label="To"
            onChange={(event) => patch("endDate", event.target.value)}
            size="small"
            slotProps={{
              htmlInput: { max: model.maximumDate, min: model.minimumDate },
              inputLabel: { shrink: true },
            }}
            type="date"
            value={group.query.endDate}
          />
          <Autocomplete
            freeSolo
            onChange={(_event, value) => patch("symbol", typeof value === "string" && value !== "" ? value : null)}
            onInputChange={(_event, value) => patch("symbol", value === "" ? null : value.toUpperCase())}
            options={model.symbols}
            renderInput={(params) => <TextField {...params} label="Ticker" size="small" />}
            value={group.query.symbol ?? ""}
          />
          <SelectField label="Direction" onChange={(value) => patch("direction", value === "all" ? null : value as "long" | "short")} value={group.query.direction ?? "all"}>
            <MenuItem value="all">All directions</MenuItem>
            <MenuItem value="long">Long</MenuItem>
            <MenuItem value="short">Short</MenuItem>
          </SelectField>
          <SelectField label="Result" onChange={(value) => patch("outcome", value === "all" ? null : value as "win" | "loss" | "flat")} value={group.query.outcome ?? "all"}>
            <MenuItem value="all">All results</MenuItem>
            <MenuItem value="win">Winning trades</MenuItem>
            <MenuItem value="loss">Losing trades</MenuItem>
            <MenuItem value="flat">Flat trades</MenuItem>
          </SelectField>
          <SelectField label="Trade type" onChange={(value) => patch("tradeClassification", value === "all" ? null : value as "day_trade" | "multi_day_trade")} value={group.query.tradeClassification ?? "all"}>
            <MenuItem value="all">All completed trades</MenuItem>
            <MenuItem value="day_trade">Day trades</MenuItem>
            <MenuItem value="multi_day_trade">Multi-day trades</MenuItem>
          </SelectField>
        </Box>
        <Accordion disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography sx={{ fontWeight: 750 }}>More filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={fieldGrid}>
              <SelectField label="Entry weekday" onChange={(value) => patch("entryWeekday", value === "all" ? null : value as AnalyticsLabPlatformQuery["entryWeekday"])} value={group.query.entryWeekday ?? "all"}>
                <MenuItem value="all">All weekdays</MenuItem>
                {WEEKDAYS.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
              </SelectField>
              <SelectField label="Entry time interval" onChange={(value) => patch("entryTimeBucketMinutes", Number(value) as 5 | 15 | 30 | 60)} value={String(group.query.entryTimeBucketMinutes)}>
                {[5, 15, 30, 60].map((minutes) => <MenuItem key={minutes} value={String(minutes)}>{minutes} minutes</MenuItem>)}
              </SelectField>
              <TextField label="Entry time (HH:MM)" onChange={(event) => patch("entryTimeBucket", event.target.value === "" ? null : event.target.value)} size="small" value={group.query.entryTimeBucket ?? ""} />
              <ExactField label="Minimum hold (seconds)" onChange={(value) => patch("minimumHoldingSeconds", value)} value={group.query.minimumHoldingSeconds} />
              <ExactField label="Maximum hold (seconds)" onChange={(value) => patch("maximumHoldingSeconds", value)} value={group.query.maximumHoldingSeconds} />
              <ExactField label="Minimum entered shares" onChange={(value) => patch("minimumEnteredQuantity", value)} value={group.query.minimumEnteredQuantity} />
              <ExactField label="Maximum entered shares" onChange={(value) => patch("maximumEnteredQuantity", value)} value={group.query.maximumEnteredQuantity} />
              <ExactField label="Minimum position shares" onChange={(value) => patch("minimumPositionQuantity", value)} value={group.query.minimumPositionQuantity} />
              <ExactField label="Maximum position shares" onChange={(value) => patch("maximumPositionQuantity", value)} value={group.query.maximumPositionQuantity} />
              <ExactField label="Minimum entry value" onChange={(value) => patch("minimumEntryNotional", value)} value={group.query.minimumEntryNotional} />
              <ExactField label="Maximum entry value" onChange={(value) => patch("maximumEntryNotional", value)} value={group.query.maximumEntryNotional} />
            </Box>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </DashboardPanel>
  );
}

function EvidenceTable({
  currency,
  rows,
  timeZone,
}: Readonly<{
  currency: string | null;
  rows: readonly JournalAnalyticsRoundTripTableRow[];
  timeZone: string;
}>) {
  return (
    <HorizontalScrollRegion label="Comparison supporting trades" minTableWidth={760}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Closed</TableCell>
            <TableCell>Ticker</TableCell>
            <TableCell>Direction</TableCell>
            <TableCell align="right">P/L</TableCell>
            <TableCell align="right">Hold</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.roundTripId}>
              <TableCell>{new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone }).format(new Date(row.closedAtUtc))}</TableCell>
              <TableCell sx={{ fontWeight: 750 }}>{row.displayedSymbol}</TableCell>
              <TableCell>{row.direction === "long" ? "Long" : "Short"}</TableCell>
              <TableCell align="right" sx={{ color: financialOutcomeColor(row.selectedPnlDecimal) }}>{formatJournalAnalyticsMoney(row.selectedPnlDecimal, currency)}</TableCell>
              <TableCell align="right">{formatJournalAnalyticsDuration(row.holdingDurationMilliseconds)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </HorizontalScrollRegion>
  );
}

export default function TradeExplorerComparisonClient({
  initialStudies,
  model,
  offlineSavedAtUtc,
}: Readonly<{
  initialStudies: readonly TradeExplorerComparisonStudy[];
  model: TradeExplorerPageModel;
  offlineSavedAtUtc?: string;
}>) {
  const [groups, setGroups] = useState<readonly GroupDraft[]>(() => initialGroups(model));
  const [comparison, setComparison] = useState<TradeExplorerComparisonResult | null>(null);
  const [studies, setStudies] = useState(initialStudies);
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
  const [studyName, setStudyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedStudy = studies.find((study) => study.studyId === selectedStudyId) ?? null;
  const uniqueNames = new Set(groups.map((group) =>
    group.name.trim().toLocaleLowerCase("en-US")));
  const canCompare = groups.every((group) => group.name.trim().length > 0 &&
    group.query.startDate <= group.query.endDate) &&
    groups.length >= 2 && groups.length <= 4 && uniqueNames.size === groups.length;

  function updateGroup(index: number, group: GroupDraft): void {
    setGroups((current) => Object.freeze(current.map((candidate, candidateIndex) =>
      candidateIndex === index ? group : candidate)));
    setComparison(null);
  }

  function comparisonInput(): Readonly<{
    comparisonVersion: typeof TRADE_EXPLORER_COMPARISON_VERSION;
    groups: readonly GroupDraft[];
  }> {
    return Object.freeze({
      comparisonVersion: TRADE_EXPLORER_COMPARISON_VERSION,
      groups: Object.freeze(groups.map((group) => Object.freeze({
        name: group.name.trim(),
        query: canonicalQuery(group.query),
      }))),
    });
  }

  function addGroup(): void {
    if (groups.length >= 4) return;
    const source = groups.at(-1) ?? initialGroups(model)[1];
    setGroups((current) => Object.freeze([...current, Object.freeze({
      name: `Group ${current.length + 1}`,
      query: Object.freeze({ ...source.query }),
    })]));
    setComparison(null);
  }

  function removeGroup(index: number): void {
    if (groups.length <= 2) return;
    setGroups((current) => Object.freeze(current.filter((_group, candidateIndex) =>
      candidateIndex !== index)));
    setComparison(null);
  }

  function chooseStudy(studyId: string): void {
    const study = studies.find((candidate) => candidate.studyId === studyId);
    if (!study) {
      setSelectedStudyId(null);
      setStudyName("");
      return;
    }
    setSelectedStudyId(study.studyId);
    setStudyName(study.name);
    setGroups(Object.freeze(study.groups.map((group) => Object.freeze({
      name: group.name,
      query: group.query,
    }))));
    setComparison(null);
    setError(null);
  }

  function saveNewStudy(): void {
    if (offlineSavedAtUtc || !canCompare || studyName.trim().length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await createTradeExplorerComparisonStudy({
        name: studyName,
        comparison: comparisonInput(),
      });
      if (!result.ok) return setError(result.message);
      setStudies(result.studies);
      setSelectedStudyId(result.selectedStudyId);
    });
  }

  function updateStudy(): void {
    if (offlineSavedAtUtc || !selectedStudy || !canCompare || studyName.trim().length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTradeExplorerComparisonStudy({
        studyId: selectedStudy.studyId,
        expectedRevision: selectedStudy.revision,
        name: studyName,
        comparison: comparisonInput(),
      });
      if (!result.ok) return setError(result.message);
      setStudies(result.studies);
      setSelectedStudyId(result.selectedStudyId);
    });
  }

  function removeStudy(): void {
    if (offlineSavedAtUtc || !selectedStudy || !window.confirm(`Remove saved comparison “${selectedStudy.name}”?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await retireTradeExplorerComparisonStudy({
        expectedAccountSelectionRef: model.expectedAccountSelectionRef,
        studyId: selectedStudy.studyId,
        expectedRevision: selectedStudy.revision,
      });
      if (!result.ok) return setError(result.message);
      setStudies(result.studies);
      setSelectedStudyId(null);
      setStudyName("");
    });
  }

  function runComparison(): void {
    if (offlineSavedAtUtc || !canCompare) return;
    setError(null);
    startTransition(async () => {
      const result = await compareTradeExplorerGroups(comparisonInput());
      if (!result.ok) {
        setError(result.message);
        if (result.refreshRequired) window.location.reload();
        return;
      }
      setComparison(result.comparison);
    });
  }

  const scorecardRows = useMemo(() => comparison ? SCORECARD_METRICS.map((item) => ({
    ...item,
    left: metric(comparison, 0, item.metricId),
    right: metric(comparison, 1, item.metricId),
  })) : [], [comparison]);

  return (
    <DashboardPage>
      <Box>
        <Typography component="h1" variant="h1">Compare trades</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Compare results across two to four groups of your completed trades.
        </Typography>
      </Box>
      {offlineSavedAtUtc ? <OfflineSavedViewStatus savedAtUtc={offlineSavedAtUtc} /> : null}

      <DashboardPanel title="Saved comparisons">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 0.8fr) minmax(240px, 1.2fr)" } }}>
          <SelectField label="Saved comparison" onChange={chooseStudy} value={selectedStudyId ?? ""}>
            <MenuItem value=""><em>New comparison</em></MenuItem>
            {studies.map((study) => <MenuItem key={study.studyId} value={study.studyId}>{study.name}</MenuItem>)}
          </SelectField>
          <TextField fullWidth label="Comparison name" onChange={(event) => setStudyName(event.target.value)} size="small" value={studyName} />
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 1.5 }}>
          <DashboardSecondaryAction disabled={Boolean(offlineSavedAtUtc) || !canCompare || isPending || studyName.trim().length === 0} onClick={saveNewStudy} startIcon={<SaveRoundedIcon />}>
            Save as new
          </DashboardSecondaryAction>
          <DashboardSecondaryAction disabled={Boolean(offlineSavedAtUtc) || !selectedStudy || !canCompare || isPending || studyName.trim().length === 0} onClick={updateStudy}>
            Update saved comparison
          </DashboardSecondaryAction>
          <DashboardSecondaryAction disabled={Boolean(offlineSavedAtUtc) || !selectedStudy || isPending} onClick={removeStudy} startIcon={<DeleteOutlineRoundedIcon />}>
            Remove saved comparison
          </DashboardSecondaryAction>
        </Stack>
      </DashboardPanel>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" } }}>
        {groups.map((group, index) => (
          <Box key={index}>
            <GroupEditor group={group} index={index} model={model} onChange={(next) => updateGroup(index, next)} />
            {index >= 2 ? (
              <DashboardSecondaryAction disabled={isPending} onClick={() => removeGroup(index)} sx={{ mt: 1 }} startIcon={<DeleteOutlineRoundedIcon />}>
                Remove {group.name || `group ${index + 1}`}
              </DashboardSecondaryAction>
            ) : null}
          </Box>
        ))}
      </Box>

      {groups.length < 4 ? (
        <Box>
          <DashboardSecondaryAction disabled={isPending} onClick={addGroup} startIcon={<AddRoundedIcon />}>
            Add another group
          </DashboardSecondaryAction>
        </Box>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
        <DashboardPrimaryAction disabled={Boolean(offlineSavedAtUtc) || !canCompare || isPending} onClick={runComparison} startIcon={<CompareArrowsRoundedIcon />}>
          {isPending ? "Comparing…" : "Compare groups"}
        </DashboardPrimaryAction>
      </Stack>

      {comparison ? (
        <>
          <DashboardPanel title="Comparison">
            <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
              Each Difference column is that group minus {comparison.groups[0].name}. It describes these completed trades only.
            </Typography>
            <HorizontalScrollRegion label="Trade comparison scorecard" minTableWidth={760} stickyFirstColumn>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Result</TableCell>
                    <TableCell align="right">{comparison.groups[0].name}</TableCell>
                    {comparison.groups.slice(1).flatMap((group) => [
                      <TableCell align="right" key={`${group.name}-value`}>{group.name}</TableCell>,
                      <TableCell align="right" key={`${group.name}-difference`}>Difference</TableCell>,
                    ])}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scorecardRows.map((row) => (
                    <TableRow key={row.metricId}>
                      <TableCell sx={{ fontWeight: 750 }}>{row.label}</TableCell>
                      <TableCell align="right" sx={{ color: financialOutcomeMetricColor(row.metricId, row.left?.value) }}>{metricText(row.left)}</TableCell>
                      {comparison.groups.slice(1).flatMap((_group, comparedIndex) => [
                        <TableCell align="right" key={`${row.metricId}-${comparedIndex}-value`} sx={{ color: financialOutcomeMetricColor(row.metricId, metric(comparison, comparedIndex + 1, row.metricId)?.value) }}>
                          {metricText(metric(comparison, comparedIndex + 1, row.metricId))}
                        </TableCell>,
                        <TableCell align="right" key={`${row.metricId}-${comparedIndex}-difference`} sx={{ color: financialOutcomeMetricColor(row.metricId, differenceValue(comparison, row.metricId, comparedIndex + 1)) }}>
                          {differenceText(comparison, row.metricId, comparedIndex + 1)}
                        </TableCell>,
                      ])}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </HorizontalScrollRegion>
          </DashboardPanel>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" } }}>
            {comparison.groups.map((group) => {
              const evidence = group.preview.evidence;
              return (
                <DashboardPanel key={group.name} title={`${group.name} trades`}>
                  <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
                    {evidence ? `${evidence.totalRowCount} completed trades. Showing ${evidence.rows.length}.` : group.preview.evidenceUnavailableReason}
                  </Typography>
                  {evidence && evidence.rows.length > 0
                    ? <EvidenceTable currency={evidence.currency} rows={evidence.rows} timeZone={evidence.timezone} />
                    : <Typography color="text.secondary">No completed trades match this group.</Typography>}
                </DashboardPanel>
              );
            })}
          </Box>
        </>
      ) : (
        <DashboardPanel title="Comparison">
          <Typography color="text.secondary">
            Choose the two groups you want to compare, then select Compare groups.
          </Typography>
        </DashboardPanel>
      )}
    </DashboardPage>
  );
}
