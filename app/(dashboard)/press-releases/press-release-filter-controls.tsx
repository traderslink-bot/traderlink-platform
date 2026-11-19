"use client";

import { useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { DEFAULT_NEWS_FILTERS, parseNewsFilters, type NewsFilters } from "@/src/modules/news/contracts/press-release-filters";

const sorts = { newest: "Newest first", oldest: "Oldest first", cap_asc: "Market cap: low to high", cap_desc: "Market cap: high to low", ticker: "Ticker: A–Z" };
const names: Record<keyof NewsFilters, string> = { search: "Search", tickers: "Tickers", minCap: "Min cap ($M)", maxCap: "Cap below ($M)", capStatus: "Market cap", from: "From (ET)", to: "To (ET)", type: "News type", read: "Read status", summary: "AI summary", sort: "Sort" };
export function PressReleaseFilterControls({ value, onApply, disabled }: { value: NewsFilters; onApply: (value: NewsFilters) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(value), [search, setSearch] = useState({ applied: value.search, text: value.search }), [error, setError] = useState("");
  if (search.applied !== value.search) setSearch({ applied: value.search, text: value.search });
  const change = (key: keyof NewsFilters, next: string) => setDraft(current => ({ ...current, [key]: next, ...(key === "capStatus" && next === "unknown" ? { minCap: "", maxCap: "" } : {}) }));
  function apply() { try { onApply(parseNewsFilters(draft)); setOpen(false); setError(""); } catch (issue) { setError(issue instanceof Error ? issue.message : "Check your filters."); } }
  function datePreset(days: number) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const from = new Date(Date.parse(today + "T12:00:00Z") - (days - 1) * 86400000).toISOString().slice(0, 10);
    setDraft(current => ({ ...current, from, to: today }));
  }
  const choice = (key: keyof NewsFilters, values: Record<string, string>) => <TextField select fullWidth label={names[key]} value={draft[key]} onChange={event => change(key, event.target.value)}>{Object.entries(values).map(([id, label]) => <MenuItem key={id} value={id}>{label}</MenuItem>)}</TextField>;
  return <Stack spacing={1.25}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <Box component="form" onSubmit={event => { event.preventDefault(); onApply({ ...value, search: search.text.trim() }); }} sx={{ display: "flex", gap: 1, flex: 1 }}>
        <TextField fullWidth label="Search ticker or headline" size="small" value={search.text} onChange={event => setSearch({ applied: value.search, text: event.target.value })} slotProps={{ htmlInput: { maxLength: 200 } }} />
        <Button type="submit" variant="outlined" disabled={disabled}>Search</Button>
      </Box>
      <Button variant="outlined" disabled={disabled} onClick={() => { setDraft(value); setError(""); setOpen(true); }}>Filters</Button>
      <TextField select label="Sort" size="small" value={value.sort} disabled={disabled} onChange={event => onApply({ ...value, sort: event.target.value as NewsFilters["sort"] })} sx={{ minWidth: 205 }}>{Object.entries(sorts).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>
    </Stack>
    <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
      {(Object.keys(value) as (keyof NewsFilters)[]).filter(key => value[key] !== DEFAULT_NEWS_FILTERS[key]).map(key => <Chip key={key} label={`${names[key]}: ${key === "sort" ? sorts[value.sort] : value[key]}`} size="small" onDelete={disabled ? undefined : () => onApply({ ...value, [key]: DEFAULT_NEWS_FILTERS[key] })} />)}
      {JSON.stringify(value) !== JSON.stringify(DEFAULT_NEWS_FILTERS) ? <Button size="small" disabled={disabled} onClick={() => onApply({ ...DEFAULT_NEWS_FILTERS })}>Clear all</Button> : null}
    </Stack>
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 430 }, maxWidth: "100%" } } }}>
      <Box component="form" onSubmit={event => { event.preventDefault(); apply(); }} sx={{ p: 2.5, overflowY: "auto" }}>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography component="h2" variant="h2">Filter press releases</Typography><IconButton aria-label="Close filters" onClick={() => setOpen(false)} sx={{ minWidth: 44, minHeight: 44 }}><CloseRoundedIcon /></IconButton></Stack>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="Tickers, separated by commas" value={draft.tickers} onChange={event => change("tickers", event.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} />
          <Typography variant="subtitle2">Market cap (USD millions)</Typography>
          <Stack direction="row" spacing={1}><TextField label="Minimum" value={draft.minCap} onChange={event => change("minCap", event.target.value)} slotProps={{ htmlInput: { inputMode: "decimal" } }} /><TextField label="Below" value={draft.maxCap} onChange={event => change("maxCap", event.target.value)} slotProps={{ htmlInput: { inputMode: "decimal" } }} /></Stack>
          <Typography color="text.secondary" variant="caption">Minimum includes the amount. Below excludes it.</Typography>
          <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>{[["Under $30M", "", "30"], ["$30M–$50M", "30", "50"], ["$50M–$100M", "50", "100"], ["$100M–$300M", "100", "300"], ["$300M–$500M", "300", "500"], ["$500M+", "500", ""]].map(([label, minCap, maxCap]) => <Chip key={label} label={label} onClick={() => setDraft(current => ({ ...current, minCap, maxCap, capStatus: "known" }))} variant="outlined" />)}</Stack>
          {choice("capStatus", { any: "Any market cap", known: "Known market cap only", unknown: "Unknown market cap only" })}
          <Typography variant="subtitle2">Published date (Eastern time)</Typography>
          <Stack direction="row" spacing={0.5}>{[["Today", 1], ["Last 7 days", 7], ["Last 30 days", 30]].map(([label, days]) => <Button key={label} size="small" onClick={() => datePreset(Number(days))}>{label}</Button>)}</Stack>
          <TextField sx={{ colorScheme: theme => theme.palette.mode }} type="date" label="From (ET)" value={draft.from} onChange={event => change("from", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField sx={{ colorScheme: theme => theme.palette.mode }} type="date" label="To (ET)" value={draft.to} onChange={event => change("to", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          {choice("type", { all: "All news types", press_release: "Press releases", earnings: "Earnings", financing: "Financing", sec: "SEC filings" })}
          {choice("read", { all: "All articles", unread: "Unread", read: "Read" })}
          {choice("summary", { all: "Any summary status", available: "Summary available", unavailable: "Summary unavailable" })}
          <Stack direction="row" spacing={1}><Button type="submit" variant="contained" disabled={disabled}>Apply filters</Button><Button onClick={() => { setDraft({ ...DEFAULT_NEWS_FILTERS }); setError(""); }}>Reset</Button><Button onClick={() => setOpen(false)}>Cancel</Button></Stack>
        </Stack>
      </Box>
    </Drawer>
  </Stack>;
}
