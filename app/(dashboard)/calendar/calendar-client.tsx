"use client";

import { useState } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
  Box,
  Button,
  CardActionArea,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
} from "../../dashboard-template";
import type {
  CalendarData,
  CalendarDay,
  CalendarDirectionFilter,
  CalendarFilterInput,
  CalendarPerformanceFilter,
  CalendarPnlFilter,
  CalendarSessionFilter,
  CalendarTradeCountFilter,
  CalendarView,
} from "./calendar-types";

type SavedView = {
  filters: CalendarFilterInput;
  name: string;
};

const weekdayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function money(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : "−"}$${Math.abs(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  });
}

function shiftMonth(monthKey: string, amount: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function emptyDay(date: string): CalendarDay {
  return { date, peakGiveback: null, pnl: null, tickers: [], trades: 0, winRate: null };
}

function buildMonthGrid(monthKey: string, days: CalendarDay[]): Array<CalendarDay | null> {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const cells: Array<CalendarDay | null> = [];
  for (let index = 0; index < Math.min(mondayOffset, 5); index += 1) cells.push(null);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCDay() === 0 || date.getUTCDay() === 6) continue;
    const key = `${monthKey}-${String(day).padStart(2, "0")}`;
    cells.push(days.find((item) => item.date === key) ?? emptyDay(key));
  }
  while (cells.length % 5 !== 0) cells.push(null);
  return cells;
}

function buildWeek(selectedDate: string, days: CalendarDay[]): CalendarDay[] {
  const selected = new Date(`${selectedDate}T12:00:00.000Z`);
  const offset = (selected.getUTCDay() + 6) % 7;
  selected.setUTCDate(selected.getUTCDate() - offset);
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(selected);
    date.setUTCDate(selected.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return days.find((item) => item.date === key) ?? emptyDay(key);
  });
}

function daySurface(day: CalendarDay, selected: boolean) {
  if (selected) return { backgroundColor: "rgba(1, 30, 86, 0.055)", boxShadow: "inset 0 0 0 2px #073b78" };
  if ((day.pnl ?? 0) > 0) return { backgroundColor: "rgba(67, 184, 131, 0.075)" };
  if ((day.pnl ?? 0) < 0) return { backgroundColor: "rgba(216, 91, 106, 0.07)" };
  return { backgroundColor: "background.paper" };
}

function DayCell({
  day,
  mode,
  onSelect,
  selected,
}: {
  day: CalendarDay;
  mode: CalendarView;
  onSelect: () => void;
  selected: boolean;
}) {
  const dayDate = new Date(`${day.date}T12:00:00.000Z`);
  const isEmpty = day.trades === 0;
  return (
    <CardActionArea
      aria-label={`Open ${dayDate.toLocaleDateString("en-US", { day: "numeric", month: "long" })}`}
      disabled={isEmpty}
      onClick={onSelect}
      sx={{ alignItems: "stretch", borderBottom: 1, borderColor: "divider", borderRight: 1, display: "flex", minHeight: mode === "week" ? 390 : 230 }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, p: mode === "week" ? 2 : 1.5, width: "100%", ...daySurface(day, selected) }}>
        <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <Typography fontWeight={850} variant={mode === "week" ? "h5" : "subtitle1"}>
            {dayDate.getUTCDate()}
          </Typography>
          {isEmpty ? null : (
            <Typography color={(day.pnl ?? 0) >= 0 ? "success.main" : "error.main"} fontFamily="var(--font-geist-mono)" fontWeight={850} variant={mode === "week" ? "h6" : "body2"}>
              {money(day.pnl)}
            </Typography>
          )}
        </Stack>
        {isEmpty ? <Box sx={{ flexGrow: 1 }} /> : (
          <>
            <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="caption">
              {day.trades} trades · {Math.round((day.winRate ?? 0) * 100)}% win rate
            </Typography>
            <Stack spacing={0.65} sx={{ flexGrow: 1, mt: mode === "week" ? 3 : 1.5 }}>
              {day.tickers.slice(0, 4).map((ticker) => (
                <Stack direction="row" key={ticker.symbol} sx={{ justifyContent: "space-between" }}>
                  <Typography fontWeight={750} noWrap variant={mode === "week" ? "body2" : "caption"}>{ticker.symbol}</Typography>
                  <Typography color={ticker.pnl >= 0 ? "success.main" : "error.main"} fontFamily="var(--font-geist-mono)" fontWeight={750} noWrap variant="caption">{money(ticker.pnl)}</Typography>
                </Stack>
              ))}
            </Stack>
            {day.peakGiveback === null ? null : (
              <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
                Peak giveback {money(day.peakGiveback)}
              </Typography>
            )}
          </>
        )}
      </Box>
    </CardActionArea>
  );
}

export function CalendarClient({ initialData, initialFilters, initialView }: {
  initialData: CalendarData;
  initialFilters: CalendarFilterInput;
  initialView: CalendarView;
}) {
  const router = useRouter();
  const [view, setView] = useState<CalendarView>(initialView);
  const [activeMonth, setActiveMonth] = useState(initialData.activeDate.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(initialData.activeDate);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedViewsOpen, setSavedViewsOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [filters, setFilters] = useState<CalendarFilterInput>(initialFilters);

  const selected = initialData.days.find((day) => day.date === selectedDate) ?? emptyDay(selectedDate);
  const monthGrid = buildMonthGrid(activeMonth, initialData.days);
  const weekDays = buildWeek(selectedDate, initialData.days);
  const activeFilterCount = [
    filters.direction,
    filters.performance,
    filters.pnlRange,
    filters.session,
    filters.symbol,
    filters.tradeCount,
  ].filter((value) => value !== "all").length +
    Number(filters.startDate !== initialData.minimumDate || filters.endDate !== initialData.maximumDate);

  const applyFilters = (next = filters) => {
    const query = new URLSearchParams();
    if (view === "week") query.set("view", "week");
    Object.entries(next).forEach(([key, value]) => {
      if (value !== "all") query.set(key, value);
    });
    router.push(`/calendar${query.size ? `?${query.toString()}` : ""}`);
    setFiltersOpen(false);
  };

  const resetFilters = () => setFilters({
    direction: "all",
    endDate: initialData.maximumDate,
    performance: "all",
    pnlRange: "all",
    session: "all",
    startDate: initialData.minimumDate,
    symbol: "all",
    tradeCount: "all",
  });

  return (
    <DashboardPage>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={1} sx={{ alignItems: { lg: "center" }, justifyContent: "space-between" }}>
        <ToggleButtonGroup exclusive onChange={(_, value: CalendarView | null) => value && setView(value)} size="small" value={view}>
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
        </ToggleButtonGroup>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button onClick={() => setFiltersOpen(true)} startIcon={<DateRangeRoundedIcon />} variant="outlined">Date range</Button>
          <Button onClick={() => setFiltersOpen(true)} startIcon={<FilterAltRoundedIcon />} variant="outlined">P/L and session filters{activeFilterCount ? ` (${activeFilterCount})` : ""}</Button>
          <Button onClick={() => setSavedViewsOpen(true)} startIcon={<SaveRoundedIcon />} variant="outlined">Saved views</Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {initialData.status === "ready" ? <DashboardDataScopeChip /> : null}
        <Typography color="text.secondary" sx={{ alignSelf: "center" }} variant="caption">
          {initialData.status === "ready" ? `${initialData.currency} · verified completed trades` : "No verified trading data available"}
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } }}>
        <DashboardMetricCard caption="Selected period" label="Net P/L" value={initialData.status === "ready" ? money(initialData.summary.netPnl) : "—"} />
        <DashboardMetricCard caption="Selected period" label="Trading days" value={initialData.status === "ready" ? String(initialData.summary.tradingDays) : "—"} />
        <DashboardMetricCard caption="Selected period" label="Trades" value={initialData.status === "ready" ? String(initialData.summary.trades) : "—"} />
        <DashboardMetricCard caption="Selected period" label="Win rate" value={initialData.status === "ready" && initialData.summary.winRate !== null ? `${Math.round(initialData.summary.winRate * 100)}%` : "—"} />
      </Box>

      <DashboardPanel
        action={<Stack direction="row" spacing={0.75}>
          <Button aria-label="Previous period" onClick={() => view === "month" ? setActiveMonth((month) => shiftMonth(month, -1)) : setSelectedDate((date) => new Date(new Date(`${date}T12:00:00.000Z`).getTime() - 604800000).toISOString().slice(0, 10))} size="small" variant="outlined"><ChevronLeftRoundedIcon /></Button>
          <Button onClick={() => { setActiveMonth(initialData.activeDate.slice(0, 7)); setSelectedDate(initialData.activeDate); }} size="small" variant="outlined">Today</Button>
          <Button aria-label="Next period" onClick={() => view === "month" ? setActiveMonth((month) => shiftMonth(month, 1)) : setSelectedDate((date) => new Date(new Date(`${date}T12:00:00.000Z`).getTime() + 604800000).toISOString().slice(0, 10))} size="small" variant="outlined"><ChevronRightRoundedIcon /></Button>
        </Stack>}
        title={view === "week" ? "Trading week" : monthLabel(activeMonth)}
      >
        {view === "month" ? (
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 900 }}>
              <Box sx={{ borderColor: "divider", borderLeft: 1, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
                {weekdayLabels.map((label) => <Box key={label} sx={{ borderBottom: 1, borderColor: "divider", borderRight: 1, px: 1.5, py: 1 }}><Typography color="text.secondary" fontWeight={800} variant="caption">{label}</Typography></Box>)}
                {monthGrid.map((day, index) => day === null ? <Box key={`blank-${index}`} sx={{ bgcolor: "rgba(246, 248, 252, 0.7)", borderBottom: 1, borderColor: "divider", borderRight: 1, minHeight: 230 }} /> : <DayCell day={day} key={day.date} mode="month" onSelect={() => { setSelectedDate(day.date); setDetailsOpen(true); }} selected={selectedDate === day.date} />)}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 1000 }}>
              <Box sx={{ borderColor: "divider", borderLeft: 1, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
                {weekDays.map((day) => <Box key={`${day.date}-label`} sx={{ borderBottom: 1, borderColor: "divider", borderRight: 1, px: 2.25, py: 1.25 }}><Typography color="text.secondary" fontWeight={800} variant="caption">{new Date(`${day.date}T12:00:00.000Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", weekday: "long" })}</Typography></Box>)}
                {weekDays.map((day) => <DayCell day={day} key={day.date} mode="week" onSelect={() => { setSelectedDate(day.date); setDetailsOpen(true); }} selected={selectedDate === day.date} />)}
              </Box>
            </Box>
          </Box>
        )}
      </DashboardPanel>

      <Drawer anchor="right" onClose={() => setFiltersOpen(false)} open={filtersOpen} slotProps={{ paper: { sx: { p: 3, width: { xs: "100%", sm: 400 } } } }}>
        <Typography component="h2" variant="h2">Calendar filters</Typography>
        <Stack spacing={2.25} sx={{ mt: 3 }}>
          <Stack direction="row" spacing={1}>
            <TextField fullWidth label="From" onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} type="date" value={filters.startDate} />
            <TextField fullWidth label="To" onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} type="date" value={filters.endDate} />
          </Stack>
          <FilterSelect label="P/L outcome" value={filters.performance} onChange={(value) => setFilters((current) => ({ ...current, performance: value as CalendarPerformanceFilter }))} items={[["all", "All results"], ["profitable", "Profitable days"], ["losing", "Losing days"]]} />
          <FilterSelect label="Daily P/L band" value={filters.pnlRange} onChange={(value) => setFilters((current) => ({ ...current, pnlRange: value as CalendarPnlFilter }))} items={[["all", "Any daily P/L"], ["loss200", "Below −$200"], ["flat", "Within ±$200"], ["profit200", "Above +$200"]]} />
          <FilterSelect label="Ticker" value={filters.symbol} onChange={(value) => setFilters((current) => ({ ...current, symbol: value }))} items={[["all", "All tickers"], ...initialData.symbols.map((symbol) => [symbol, symbol])]} />
          <FilterSelect label="Direction" value={filters.direction} onChange={(value) => setFilters((current) => ({ ...current, direction: value as CalendarDirectionFilter }))} items={[["all", "Long and short"], ["long", "Long only"], ["short", "Short only"]]} />
          <FilterSelect label="Session" value={filters.session} onChange={(value) => setFilters((current) => ({ ...current, session: value as CalendarSessionFilter }))} items={[["all", "All sessions"], ["premarket", "Pre-market"], ["regular", "Regular session"], ["after_hours", "After-hours"]]} />
          <FilterSelect label="Trade count" value={filters.tradeCount} onChange={(value) => setFilters((current) => ({ ...current, tradeCount: value as CalendarTradeCountFilter }))} items={[["all", "Any trade count"], ["1-3", "1–3 trades"], ["4-6", "4–6 trades"], ["7+", "7+ trades"]]} />
          <Button onClick={resetFilters}>Reset filters</Button>
          <Button onClick={() => applyFilters()} variant="contained">Apply filters</Button>
        </Stack>
      </Drawer>

      <Drawer anchor="right" onClose={() => setSavedViewsOpen(false)} open={savedViewsOpen} slotProps={{ paper: { sx: { p: 3, width: { xs: "100%", sm: 400 } } } }}>
        <Typography component="h2" variant="h2">Saved views</Typography>
        <Button onClick={() => setSavedViews((current) => [...current, { filters, name: `Calendar view ${current.length + 1}` }])} startIcon={<SaveRoundedIcon />} sx={{ mt: 3 }} variant="contained">Save current view</Button>
        <Stack divider={<Divider flexItem />} sx={{ mt: 2 }}>
          {savedViews.length === 0 ? <Typography color="text.secondary" sx={{ py: 2 }} variant="body2">No saved views yet.</Typography> : savedViews.map((saved) => <CardActionArea key={saved.name} onClick={() => { setFilters(saved.filters); setSavedViewsOpen(false); applyFilters(saved.filters); }} sx={{ py: 1.5 }}><Typography fontWeight={750}>{saved.name}</Typography></CardActionArea>)}
        </Stack>
      </Drawer>

      <Drawer anchor="right" onClose={() => setDetailsOpen(false)} open={detailsOpen} slotProps={{ paper: { sx: { p: 3, width: { xs: "100%", sm: 420 } } } }}>
        <Typography color="text.secondary" fontWeight={750} variant="caption">CALENDAR DAY</Typography>
        <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", mt: 0.75 }}>
          <Typography component="h2" variant="h5">{new Date(`${selected.date}T12:00:00.000Z`).toLocaleDateString("en-US", { day: "numeric", month: "long", weekday: "long" })}</Typography>
          <Typography color={(selected.pnl ?? 0) >= 0 ? "success.main" : "error.main"} fontWeight={850} variant="h6">{money(selected.pnl)}</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">{selected.trades} trades · {Math.round((selected.winRate ?? 0) * 100)}% win rate · Peak giveback {money(selected.peakGiveback)}</Typography>
        <Divider sx={{ my: 2.5 }} />
        <Typography fontWeight={800} variant="body2">Ticker results</Typography>
        <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>{selected.tickers.map((ticker) => <Stack direction="row" key={ticker.symbol} sx={{ justifyContent: "space-between", py: 1.4 }}><Typography fontWeight={800}>{ticker.symbol}</Typography><Typography color={ticker.pnl >= 0 ? "success.main" : "error.main"} fontFamily="var(--font-geist-mono)" fontWeight={800}>{money(ticker.pnl)}</Typography></Stack>)}</Stack>
      </Drawer>
    </DashboardPage>
  );
}

function FilterSelect({ items, label, onChange, value }: { items: string[][]; label: string; onChange: (value: string) => void; value: string }) {
  const labelId = `calendar-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-label`;
  return (
    <FormControl fullWidth>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select label={label} labelId={labelId} onChange={(event) => onChange(event.target.value)} value={value}>
        {items.map(([itemValue, itemLabel]) => <MenuItem key={itemValue} value={itemValue}>{itemLabel}</MenuItem>)}
      </Select>
    </FormControl>
  );
}
