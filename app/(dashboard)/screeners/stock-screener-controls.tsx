"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useId, useState, type ReactNode } from "react";
import { CAP_SHORTCUTS, METRICS, METRIC_KEYS, MAX_RULES, OPERATORS, parseThreshold, signalChoices, type Definition, type Metric, type Rule } from "@/src/modules/stock-screeners/contracts";
import { COLUMN_SETS } from "@/src/modules/stock-screeners/presets";
import { displayValue } from "./stock-screener-results";

export function Picker({ label, value, onChange, children, width, disabled }: {
  label: string; value: string; onChange: (value: string) => void; children: ReactNode; width?: number; disabled?: boolean;
}) {
  const id = useId();
  return <FormControl size="small" disabled={disabled} sx={{ width, maxWidth: "100%" }}>
    <InputLabel id={id}>{label}</InputLabel>
    <Select labelId={id} label={label} value={value} onChange={event => onChange(event.target.value)}>{children}</Select>
  </FormControl>;
}

export type DraftRule = { key: string; metric: Metric; operator: Rule["operator"]; value: string; upper: string };

export function MarketCapControl({ rules, onRules }: { rules: DraftRule[]; onRules: (rules: DraftRule[]) => void }) {
  const [open, setOpen] = useState(false);
  const [lower, setLower] = useState("");
  const [upper, setUpper] = useState("");
  const capRules = rules.filter(rule => rule.metric === "cap");
  const first = capRules[0];
  const shortcut = capRules.length === 1 && first.operator === "lt"
    ? CAP_SHORTCUTS.find(value => value === parseThreshold(first.value, "cap")) : undefined;
  const firstValue = first ? parseThreshold(first.value, "cap") : NaN;
  const firstUpper = first ? parseThreshold(first.upper, "cap") : NaN;
  const formatCap = (value: number) => displayValue("cap", value);
  let current = "Any";
  if (shortcut) current = "Under " + formatCap(shortcut);
  else if (first) {
    current = "Custom";
    if (capRules.length === 1 && Number.isFinite(firstValue)) {
      if (first.operator === "between" && Number.isFinite(firstUpper)) current = formatCap(firstValue) + "–" + formatCap(firstUpper);
      else if (first.operator !== "between") current = OPERATORS[first.operator] + " " + formatCap(firstValue);
    }
  }
  const from = lower.trim() ? parseThreshold(lower, "cap") : undefined;
  const to = upper.trim() ? parseThreshold(upper, "cap") : undefined;
  const invalid = (from !== undefined && (!Number.isFinite(from) || from < 0))
    || (to !== undefined && (!Number.isFinite(to) || to < 0))
    || (from !== undefined && to !== undefined && from > to);
  const otherRules = rules.filter(rule => rule.metric !== "cap");
  const full = otherRules.length >= MAX_RULES;
  const min = capRules.find(rule => ["between", "gte", "gt", "eq"].includes(rule.operator));
  const max = capRules.find(rule => ["between", "lte", "lt", "eq"].includes(rule.operator));
  const initialLower = min?.value ?? "";
  const initialUpper = (max?.operator === "between" ? max.upper : max?.value) ?? "";
  const unchanged = (from ?? null) === (initialLower ? parseThreshold(initialLower, "cap") : null)
    && (to ?? null) === (initialUpper ? parseThreshold(initialUpper, "cap") : null);

  function begin() {
    setLower(initialLower);
    setUpper(initialUpper);
    setOpen(true);
  }

  function apply(operator?: Rule["operator"], value?: number, ceiling?: number) {
    onRules(operator && value !== undefined ? [...otherRules, {
      key: crypto.randomUUID(), metric: "cap", operator, value: String(value), upper: ceiling === undefined ? "" : String(ceiling),
    }] : otherRules);
    setOpen(false);
  }

  return <>
    <Button size="small" variant="outlined" endIcon={<ExpandMoreRounded />} aria-haspopup="dialog" onClick={begin}>
      {"Market cap · " + current}
    </Button>
    {open && <Dialog open onClose={() => setOpen(false)} fullWidth maxWidth="xs" aria-labelledby="stock-screen-market-cap">
      <DialogTitle id="stock-screen-market-cap">Market cap</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
          <Button size="small" variant="outlined" onClick={() => apply()}>Any cap</Button>
          {CAP_SHORTCUTS.map(limit => <Button key={limit} size="small" variant={shortcut === limit ? "contained" : "outlined"}
            disabled={full} onClick={() => apply("lt", limit)}>
            Under {displayValue("cap", limit)}
          </Button>)}
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          <TextField label="Minimum market cap" placeholder="e.g. 125M" value={lower} onChange={event => setLower(event.target.value)} size="small"
            sx={{ width: 155 }} />
          <TextField label="Maximum market cap" placeholder="e.g. 2.5B" value={upper} onChange={event => setUpper(event.target.value)} size="small"
            sx={{ width: 155 }} />
        </Box>
        <Typography variant="caption" color={invalid ? "error.main" : "text.secondary"} component="p" sx={{ mt: 0.8 }}>
          {invalid ? "Enter dollar amounts at or above zero, with the minimum first. Either bound can be blank."
            : "Use dollars or shorthand such as 25M and 2.5B. Either bound is optional."}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="contained" disabled={invalid || (full && (from !== undefined || to !== undefined))}
          onClick={() => {
            if (unchanged) setOpen(false);
            else if (from !== undefined && to !== undefined) apply("between", from, to);
            else if (from !== undefined) apply("gte", from);
            else if (to !== undefined) apply("lte", to);
            else apply();
          }}>Apply range</Button>
      </DialogActions>
    </Dialog>}
  </>;
}

const groups = [...new Set(Object.values(METRICS).map(metric => metric.group))];
const filterOptions = groups.flatMap(group => METRIC_KEYS.filter(metric => METRICS[metric].group === group));
const filterByName = createFilterOptions<Metric>({ stringify: metric => {
  const label = METRICS[metric].label;
  if (metric === "relativeVolume") return label + " RVOL";
  if (metric === "pressReleaseAge") return label + " recent press releases PR";
  if (METRICS[metric].group === "Opening range") return label + " ORB";
  if (metric === "vwapCross") return label + " reclaim rejection crossover";
  return label;
} });
const valuePlaceholders: Partial<Record<(typeof METRICS)[Metric]["unit"], string>> = {
  percent: "e.g. 5%", count: "e.g. 250k", bps: "e.g. 50 bps", ratio: "e.g. 2x", hours: "e.g. 24h",
};

export function FilterCatalog({ onAdd, disabled }: { onAdd: (metric: Metric) => void; disabled: boolean }) {
  const [term, setTerm] = useState("");
  return <Autocomplete
    size="small"
    value={null}
    inputValue={term}
    options={filterOptions}
    filterOptions={filterByName}
    groupBy={metric => METRICS[metric].group}
    getOptionLabel={metric => METRICS[metric].label}
    onInputChange={(_, value, reason) => {
      if (reason === "input") setTerm(value);
      else if (reason === "clear" || reason === "blur") setTerm("");
    }}
    onChange={(_, metric) => {
      if (metric) onAdd(metric);
      setTerm("");
    }}
    disabled={disabled}
    autoHighlight
    openOnFocus
    noOptionsText="No filters found"
    renderInput={params => <TextField {...params} label="Add filter" />}
    sx={{ width: 184, maxWidth: "100%" }}
  />;
}

export function FilterEditor({ rules, onRules }: { rules: DraftRule[]; onRules: (rules: DraftRule[]) => void }) {
  function edit(key: string, patch: Partial<DraftRule>) {
    onRules(rules.map(rule => rule.key === key ? { ...rule, ...patch } : rule));
  }
  return <Box sx={{ border: 1, borderColor: "divider", bgcolor: "action.hover", p: 1.2, display: "grid", gap: 1 }}>
    <Typography variant="body2" sx={{ fontWeight: 650 }}>Match all filters</Typography>
    {rules.map((rule, index) => {
      const choices = signalChoices(rule.metric);
      return <Box key={rule.key} sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", alignItems: "center" }}>
        <Typography variant="body2" sx={{ fontWeight: 650, minWidth: { xs: "100%", sm: 170 } }}>{METRICS[rule.metric].label}</Typography>
        {choices ? <Picker label={"Signal " + (index + 1)} value={rule.value} onChange={value => edit(rule.key, { value })} width={160}>
          {[1, 0, -1].map(value => <MenuItem key={value} value={String(value)}>{choices[value]}</MenuItem>)}
        </Picker> : <>
          <Picker label={"Condition " + (index + 1)} value={rule.operator} onChange={operator => edit(rule.key, { operator: operator as Rule["operator"] })} width={135}>
            {Object.entries(OPERATORS).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
          </Picker>
          <TextField label={"Value " + (index + 1)} size="small" value={rule.value}
            placeholder={valuePlaceholders[METRICS[rule.metric].unit]}
            onChange={event => edit(rule.key, { value: event.target.value })} sx={{ width: 104 }} />
          {rule.operator === "between" && <TextField label={"Maximum " + (index + 1)} size="small" value={rule.upper}
            onChange={event => edit(rule.key, { upper: event.target.value })} sx={{ width: 104 }} />}
        </>}
        <IconButton aria-label={"Remove " + METRICS[rule.metric].label + " filter " + (index + 1)}
          onClick={() => onRules(rules.filter(item => item.key !== rule.key))} sx={{ width: 44, height: 44 }}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </Box>;
    })}
    {rules.length === MAX_RULES && <Typography variant="caption">This screen uses all {MAX_RULES} filters.</Typography>}
  </Box>;
}

export function ColumnsDialog({ definition, onClose, onChange }: {
  definition: Definition; onClose: () => void; onChange: (columns: Metric[]) => void;
}) {
  const [columns, setColumns] = useState(definition.columns);
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="stock-screener-columns">
    <DialogTitle id="stock-screener-columns">Columns</DialogTitle>
    <DialogContent dividers>
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1 }}>
        {COLUMN_SETS.map(set => <Button key={set.name} variant="outlined" size="small" onClick={() => setColumns(set.columns)}>{set.name}</Button>)}
      </Box>
      <Typography variant="body2" color="text.secondary">{columns.length} of 10 selected</Typography>
      {columns.length > 1 && <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 1 }}>
        {columns.map((metric, index) => <Button key={metric} variant="outlined" size="small" disabled={index === 0}
          aria-label={"Move " + METRICS[metric].label + " left"} onClick={() => {
            const reordered = [...columns];
            [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
            setColumns(reordered);
          }}>{METRICS[metric].label}{index > 0 ? " ←" : ""}</Button>)}
      </Box>}
      {groups.map(group => <Box key={group} sx={{ mt: 1.2 }}>
        <Typography component="h3" variant="subtitle2">{group}</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          {METRIC_KEYS.filter(metric => METRICS[metric].group === group).map(metric => <FormControlLabel key={metric}
            label={METRICS[metric].label}
            control={<Checkbox size="small" checked={columns.includes(metric)} disabled={!columns.includes(metric) && columns.length >= 10}
              onChange={(_, checked) => setColumns(checked ? [...columns, metric] : columns.filter(item => item !== metric))} />} />)}
        </Box>
      </Box>)}
    </DialogContent>
    <DialogActions><Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={() => onChange(columns)} disabled={!columns.length} startIcon={<AddRounded />}>Apply columns</Button>
    </DialogActions>
  </Dialog>;
}
