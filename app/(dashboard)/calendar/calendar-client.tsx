"use client";

import { useEffect, useState } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  ButtonBase,
  CardActionArea,
  Chip,
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
import { alpha, type Theme } from "@mui/material/styles";
import { useRouter } from "next/navigation";

import { OfflineSavedViewStatus } from "@/app/pwa/offline-saved-view-status";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMoney,
  journalAnalyticsCurrencySymbol,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { financialOutcomeColor, financialThresholdColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import { FeatureHelpLink } from "../feature-help-link";
import { HorizontalScrollHint } from "../horizontal-scroll-region";

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
  CalendarTradeCountFilter,
  CalendarView,
  CalendarTickerResult,
  CalendarWeekOption,
} from "./calendar-types";

type SavedView = {
  filters: CalendarFilterInput;
  name: string;
};

type TickerTradeDetail = Readonly<{
  executions: readonly Readonly<{
    executed_at_utc: string;
    price_decimal: string | null;
    quantity_decimal: string;
    side: "buy" | "sell";
  }>[];
  notes: readonly string[];
  roundTripId: string;
  tags: readonly string[];
}>;

type TickerDetailState = Readonly<{
  requestKey: string | null;
  status: "idle" | "loading" | "ready" | "error";
  trades: readonly TickerTradeDetail[];
}>;

const weekdayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function money(value: string | null, currency: string | null): string {
  if (value === null || currency === null) return "Unavailable";
  return formatJournalAnalyticsMoney(value, currency, { showPositiveSign: true });
}

function price(value: string | null, currency: string | null): string {
  if (value === null || currency === null) return "Unavailable";
  return formatJournalAnalyticsMoney(value, currency);
}

function executionTimestamp(value: string, timezone: string | null): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: timezone ?? "America/New_York",
  }).format(new Date(value));
}

function percent(value: string | null): string {
  return value === null ? "—" : `${formatJournalAnalyticsDecimal(value)}%`;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
}

function weekStart(date: string): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return value.toISOString().slice(0, 10);
}

function weekLabel(weekKey: string): string {
  const start = new Date(`${weekKey}T12:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 4);
  const format = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
  return `${format.format(start)} - ${format.format(end)}`;
}

function currentWeekInTimezone(timezone: string | null): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone ?? "America/New_York",
    year: "numeric",
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return weekStart(`${byType.year}-${byType.month}-${byType.day}`);
}

function emptyDay(date: string): CalendarDay {
  return {
    date,
    hasDailyTracker: false,
    peakGivebackDecimal: null,
    pnlDecimal: null,
    pnlSign: null,
    tickers: [],
    tradeCount: 0,
    reviewStatus: null,
    winRatePercentDecimal: null,
  };
}

function buildMonthGrid(monthKey: string, days: readonly CalendarDay[]): Array<CalendarDay | null> {
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

function buildWeek(selectedDate: string, days: readonly CalendarDay[]): CalendarDay[] {
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
  if (selected) return {
    backgroundColor: (theme: Theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : "rgba(1, 30, 86, 0.055)",
    boxShadow: (theme: Theme) => theme.palette.mode === "dark" ? `inset 0 0 0 2px ${theme.palette.primary.light}` : "inset 0 0 0 2px #073b78",
  };
  if (day.pnlSign === 1) return { backgroundColor: (theme: Theme) => theme.palette.mode === "dark" ? alpha(theme.palette.success.main, 0.14) : "rgba(67, 184, 131, 0.075)" };
  if (day.pnlSign === -1) return { backgroundColor: (theme: Theme) => theme.palette.mode === "dark" ? alpha(theme.palette.error.main, 0.14) : "rgba(216, 91, 106, 0.07)" };
  return { backgroundColor: "background.paper" };
}

function pnlTone(sign: -1 | 0 | 1 | null) {
  if (sign === -1) return { backgroundColor: (theme: Theme) => theme.palette.mode === "dark" ? alpha(theme.palette.error.main, 0.18) : "rgba(211, 47, 47, 0.10)", color: "error.main" };
  if (sign === 1) return { backgroundColor: (theme: Theme) => theme.palette.mode === "dark" ? alpha(theme.palette.success.main, 0.18) : "rgba(46, 125, 50, 0.11)", color: "success.main" };
  return { backgroundColor: (theme: Theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : "rgba(1, 30, 86, 0.05)", color: "text.primary" };
}

function TickerAnnotationChips({
  compact,
  noteCount,
  ruleReviewCount,
  tagCount,
}: {
  compact: boolean;
  noteCount: number;
  ruleReviewCount: number;
  tagCount: number;
}) {
  const labels = [
    noteCount > 0 ? compact ? "N" : "Notes" : null,
    ruleReviewCount > 0 ? compact ? "R" : `Rules ${ruleReviewCount}` : null,
    tagCount > 0 ? `${tagCount} Tags` : null,
  ].filter((label): label is string => label !== null);
  if (labels.length === 0) return null;
  return (
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
      {labels.map((label) => (
        <Chip
          key={label}
          label={label}
          size="small"
          sx={{ height: compact ? 18 : 22, "& .MuiChip-label": { px: 0.75 } }}
          variant="outlined"
        />
      ))}
    </Stack>
  );
}

function DayCell({
  day,
  mode,
  onSelect,
  onTickerClick,
  selected,
  showReviewStatus,
  currency,
}: {
  day: CalendarDay;
  mode: CalendarView;
  onSelect: () => void;
  onTickerClick: (ticker: CalendarTickerResult) => void;
  selected: boolean;
  showReviewStatus: boolean;
  currency: string | null;
}) {
  const dayDate = new Date(`${day.date}T12:00:00.000Z`);
  const hasJournalActivity = day.tickers.some((ticker) =>
    ticker.noteCount > 0 || ticker.ruleReviewCount > 0 || ticker.tagCount > 0);
  const isEmpty = day.tradeCount === 0 && !hasJournalActivity;
  return (
    <Box
      onClick={isEmpty ? undefined : onSelect}
      sx={{ borderBottom: 1, borderColor: "divider", borderRight: 1, cursor: isEmpty ? "default" : "pointer", display: "flex", flexDirection: "column", height: mode === "week" ? 260 : undefined, minHeight: mode === "week" ? 260 : 96, minWidth: 0, overflowY: mode === "week" ? "auto" : undefined, p: mode === "week" ? 1 : 0.75, width: "100%", ...daySurface(day, selected) }}
    >
        <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 850 }} variant={mode === "week" ? "h5" : "subtitle1"}>
            {dayDate.getUTCDate()}
          </Typography>
          {day.tradeCount === 0 || day.pnlDecimal === null ? null : (
            <Typography color={pnlTone(day.pnlSign).color} sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 850 }} variant={mode === "week" ? "h6" : "body2"}>
              {money(day.pnlDecimal, currency)}
            </Typography>
          )}
        </Stack>
        {isEmpty ? <Box sx={{ flexGrow: 1 }} /> : (
          <>
            <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="caption">
              {day.tradeCount > 0
                ? `${day.tradeCount} trades · ${percent(day.winRatePercentDecimal)} win rate`
                : "Swing Trade Tracker activity"}
            </Typography>
            <Stack spacing={0.65} sx={{ display: mode === "week" ? "flex" : "none", flexGrow: 1, mt: mode === "week" ? 3 : 1.5 }}>
              {(mode === "week" ? day.tickers : day.tickers.slice(0, 4)).map((ticker) => (
                <Stack key={ticker.symbol}>
                  <ButtonBase
                    aria-label={`View ${ticker.symbol} trades`}
                    onClick={(event) => { event.stopPropagation(); onTickerClick(ticker); }}
                    sx={{ borderRadius: 1, display: "block", textAlign: "left", width: "100%", "&:focus-visible": { outline: (theme) => `2px solid ${theme.palette.mode === "dark" ? theme.palette.primary.light : "#073b78"}`, outlineOffset: 2 } }}
                  >
                    <Stack direction="row" sx={{ justifyContent: "space-between", width: "100%" }}>
                      <Typography noWrap sx={{ fontWeight: 750 }} variant={mode === "week" ? "body2" : "caption"}>{ticker.symbol}</Typography>
                      <Typography color={pnlTone(ticker.pnlSign).color} noWrap sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 750 }} variant="caption">{money(ticker.pnlDecimal, currency)}</Typography>
                    </Stack>
                  </ButtonBase>
                  {mode === "week" ? (
                    <TickerAnnotationChips
                      compact={false}
                      noteCount={ticker.noteCount}
                      ruleReviewCount={ticker.ruleReviewCount}
                      tagCount={ticker.tagCount}
                    />
                  ) : null}
                  {mode === "week" ? (
                    <Stack spacing={0.25} sx={{ mt: 0.65 }}>
                      {ticker.trades.slice(0, 2).map((trade, index) => (
                        <Stack direction="row" key={trade.roundTripId} spacing={0.75} sx={{ alignItems: "baseline" }}>
                          <Typography color="text.secondary" variant="caption">Trade {index + 1}</Typography>
                          <Typography color={pnlTone(trade.pnlSign).color} sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 750 }} variant="caption">
                            {money(trade.pnlDecimal, currency)}
                          </Typography>
                        </Stack>
                      ))}
                      {ticker.trades.length > 2 ? (
                        <Typography color="text.secondary" variant="caption">
                          {ticker.trades.length - 2} more trade{ticker.trades.length === 3 ? "" : "s"}
                        </Typography>
                      ) : null}
                    </Stack>
                  ) : null}
                </Stack>
              ))}
            </Stack>
            {mode === "month" && day.tickers.length > 4 ? (
              <Typography color="text.secondary" sx={{ mt: "auto", pt: 0.75 }} variant="caption">
                {day.tickers.length - 4} more ticker{day.tickers.length === 5 ? "" : "s"}
              </Typography>
            ) : null}
          </>
        )}
        {showReviewStatus && day.hasDailyTracker && day.tradeCount > 0 && day.reviewStatus ? (
          <Box sx={{ mt: "auto", pt: 1 }}>
            <Chip
              color={day.reviewStatus === "reviewed" ? "success" : "warning"}
              label={day.reviewStatus === "reviewed" ? "Review completed" : "Review not completed"}
              size="small"
              sx={{ fontWeight: 750 }}
            />
          </Box>
        ) : null}
    </Box>
  );
}

function MobileMonthCell({
  currency,
  day,
  onSelect,
  onTickerClick,
  selected,
}: {
  currency: string | null;
  day: CalendarDay;
  onSelect: () => void;
  onTickerClick: (ticker: CalendarTickerResult) => void;
  selected: boolean;
}) {
  const hasActivity = day.tradeCount > 0 || day.tickers.some((ticker) =>
    ticker.noteCount > 0 || ticker.ruleReviewCount > 0 || ticker.tagCount > 0);
  const label = new Date(`${day.date}T12:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        borderRight: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 78,
        minWidth: 0,
        p: 1,
        scrollSnapAlign: "start",
        ...daySurface(day, selected),
      }}
    >
      <ButtonBase
        aria-label={`${label}. ${day.tradeCount} trade${day.tradeCount === 1 ? "" : "s"}. ${money(day.pnlDecimal, currency)}.`}
        disabled={!hasActivity}
        onClick={onSelect}
        sx={{ display: "block", minHeight: 52, textAlign: "left", width: "100%" }}
      >
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "baseline", justifyContent: "space-between", minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 850 }}>{Number(day.date.slice(-2))}</Typography>
          {day.pnlDecimal === null ? null : (
            <Typography
              color={pnlTone(day.pnlSign).color}
              noWrap
              sx={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 850 }}
            >
              {money(day.pnlDecimal, currency)}
            </Typography>
          )}
        </Stack>
        {hasActivity ? (
          <Typography color="text.secondary" sx={{ fontSize: 12, lineHeight: 1.35, mt: 0.25 }}>
            {day.tradeCount > 0
              ? `${day.tradeCount} trade${day.tradeCount === 1 ? "" : "s"} · ${percent(day.winRatePercentDecimal)} win rate`
              : "Swing Trade Tracker activity"}
          </Typography>
        ) : null}
      </ButtonBase>
      {false && day.tickers.length > 0 ? (
        <Stack spacing={0.25} sx={{ borderTop: 1, borderColor: "divider", mt: 0.75, pt: 0.5 }}>
          {day.tickers.slice(0, 4).map((ticker) => (
            <ButtonBase
              aria-label={`View ${ticker.symbol} trades`}
              key={ticker.instrumentId}
              onClick={() => onTickerClick(ticker)}
              sx={{ borderRadius: 1, display: "block", minHeight: 44, px: 0.5, textAlign: "left", width: "100%" }}
            >
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "baseline", justifyContent: "space-between", minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 12, fontWeight: 750, minWidth: 0 }}>{ticker.symbol}</Typography>
                <Typography
                  color={pnlTone(ticker.pnlSign).color}
                  noWrap
                  sx={{ flexShrink: 0, fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 750 }}
                >
                  {money(ticker.pnlDecimal, currency)}
                </Typography>
              </Stack>
            </ButtonBase>
          ))}
          {day.tickers.length > 4 ? (
            <Typography color="text.secondary" sx={{ fontSize: 12, px: 0.5, pt: 0.25 }}>
              {day.tickers.length - 4} more ticker{day.tickers.length === 5 ? "" : "s"}
            </Typography>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}

function MobileWeekCard({
  currency,
  day,
  onSelect,
  onTickerClick,
  selected,
  showReviewStatus,
}: {
  currency: string | null;
  day: CalendarDay;
  onSelect: () => void;
  onTickerClick: (ticker: CalendarTickerResult) => void;
  selected: boolean;
  showReviewStatus: boolean;
}) {
  const hasActivity = day.tradeCount > 0 || day.tickers.some((ticker) =>
    ticker.noteCount > 0 || ticker.ruleReviewCount > 0 || ticker.tagCount > 0);
  const label = new Date(`${day.date}T12:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    weekday: "long",
  });
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden", ...daySurface(day, selected) }}>
      <ButtonBase disabled={!hasActivity} onClick={onSelect} sx={{ display: "block", minHeight: 48, p: 1.25, textAlign: "left", width: "100%" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 850 }}>{label}</Typography>
            <Typography color="text.secondary" variant="caption">
              {day.tradeCount > 0 ? `${day.tradeCount} trade${day.tradeCount === 1 ? "" : "s"} · ${percent(day.winRatePercentDecimal)} win rate` : hasActivity ? "Swing Trade Tracker activity" : "No activity"}
            </Typography>
          </Box>
          {day.pnlDecimal === null ? null : <Typography color={pnlTone(day.pnlSign).color} sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 850 }}>{money(day.pnlDecimal, currency)}</Typography>}
        </Stack>
      </ButtonBase>
      {day.tickers.length > 0 ? (
        <Stack spacing={0.5} sx={{ borderTop: 1, borderColor: "divider", p: 1.25 }}>
          {day.tickers.slice(0, 4).map((ticker) => (
            <ButtonBase key={ticker.instrumentId} onClick={() => onTickerClick(ticker)} sx={{ borderRadius: 1, display: "block", minHeight: 40, px: 0.75, py: 0.5, textAlign: "left", width: "100%" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 750 }} variant="body2">{ticker.symbol}</Typography>
                <Typography color={pnlTone(ticker.pnlSign).color} sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 750 }} variant="body2">{money(ticker.pnlDecimal, currency)}</Typography>
              </Stack>
            </ButtonBase>
          ))}
          {day.tickers.length > 4 ? <Typography color="text.secondary" sx={{ px: 0.75 }} variant="caption">{day.tickers.length - 4} more ticker{day.tickers.length === 5 ? "" : "s"}</Typography> : null}
          {showReviewStatus && day.hasDailyTracker && day.tradeCount > 0 && day.reviewStatus ? <Chip color={day.reviewStatus === "reviewed" ? "success" : "warning"} label={day.reviewStatus === "reviewed" ? "Review completed" : "Review not completed"} size="small" sx={{ alignSelf: "flex-start", mt: 0.5 }} /> : null}
        </Stack>
      ) : null}
    </Box>
  );
}

export function CalendarWeekView({
  activeDate,
  currency,
  days,
  onSelect,
  onTickerClick,
  selectedDate,
  showReviewStatus,
}: {
  activeDate: string;
  currency: string | null;
  days: readonly CalendarDay[];
  onSelect: (day: CalendarDay) => void;
  onTickerClick: (day: CalendarDay, ticker: CalendarTickerResult) => void;
  selectedDate: string;
  showReviewStatus: boolean;
}) {
  const weekDays = buildWeek(activeDate, days);
  return (
    <>
      <Stack spacing={1} sx={{ display: { xs: "flex", md: "none" } }}>
        {weekDays.map((day) => (
          <MobileWeekCard
            currency={currency}
            day={day}
            key={day.date}
            onSelect={() => onSelect(day)}
            onTickerClick={(ticker) => onTickerClick(day, ticker)}
            selected={selectedDate === day.date}
            showReviewStatus={showReviewStatus}
          />
        ))}
      </Stack>
      <Box sx={{ display: { xs: "none", md: "block" }, overflowX: "auto" }}>
        <Box sx={{ minWidth: 1000 }}>
          <Box sx={{ borderColor: "divider", borderLeft: 1, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
            {weekDays.map((day) => (
              <Box key={`${day.date}-label`} sx={{ borderBottom: 1, borderColor: "divider", borderRight: 1, px: 2.25, py: 1.25 }}>
                <Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">
                  {new Date(`${day.date}T12:00:00.000Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", weekday: "long" })}
                </Typography>
              </Box>
            ))}
            {weekDays.map((day) => (
              <DayCell
                currency={currency}
                day={day}
                key={day.date}
                mode="week"
                onSelect={() => onSelect(day)}
                onTickerClick={(ticker) => onTickerClick(day, ticker)}
                selected={selectedDate === day.date}
                showReviewStatus={showReviewStatus}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
}

function CalendarPeriodNavigation({
  availableMonths,
  availableWeeks,
  availableWeekOptions = [],
  month,
  onNavigate,
  view,
  week,
}: {
  availableMonths: readonly string[];
  availableWeeks: readonly string[];
  availableWeekOptions: readonly CalendarWeekOption[];
  month: string;
  onNavigate: (view: CalendarView, period: string) => void;
  view: CalendarView;
  week: string;
}) {
  const resolvedWeekOptions = availableWeekOptions.length > 0
    ? availableWeekOptions
    : availableWeeks.map((week) => ({ months: [week.slice(0, 7)], week }));
  const activePeriods = view === "month" ? availableMonths : availableWeeks;
  const activePeriod = view === "month" ? month : week;
  const activeIndex = activePeriods.indexOf(activePeriod);
  const weekOption = resolvedWeekOptions.find((option) => option.week === week);
  const selectableMonths = availableMonths;
  const displayedMonth = view === "month" ? month : weekOption?.months.at(-1) ?? month;
  const availableYears = [...new Set(selectableMonths.map((value) => value.slice(0, 4)))];
  const selectedYear = displayedMonth.slice(0, 4);
  const monthsInSelectedYear = selectableMonths.filter((value) =>
    value.startsWith(`${selectedYear}-`));
  const weeksInDisplayedMonth = resolvedWeekOptions
    .filter((option) => option.months.includes(displayedMonth))
    .map((option) => option.week);

  const move = (amount: number) => {
    const next = activePeriods[activeIndex + amount];
    if (next) onNavigate(view, next);
  };

  const selectMonth = (nextMonth: string) => {
    if (view === "month") {
      onNavigate("month", nextMonth);
      return;
    }
    const nextWeek = resolvedWeekOptions
      .filter((option) => option.months.includes(nextMonth))
      .map((option) => option.week)
      .at(-1);
    if (nextWeek) onNavigate("week", nextWeek);
  };

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexWrap: "nowrap", mb: 2, minWidth: 0, width: "100%" }}>
      <Button
        aria-label={view === "month" ? "Previous month" : "Previous week"}
        disabled={activeIndex <= 0}
        onClick={() => move(-1)}
        size="small"
        sx={{ flexShrink: 0, height: 44, minWidth: 44, px: 0.5 }}
        variant="outlined"
      >
        <ChevronLeftRoundedIcon />
      </Button>
      <Stack direction="row" spacing={0.5} sx={{ display: view === "week" ? { xs: "none", sm: "flex" } : "flex", flexGrow: { xs: 1, sm: 0 }, flexShrink: 1, minWidth: 0 }}>
        <FormControl size="small" sx={{ flexGrow: { xs: 1, sm: 0 }, flexShrink: 1, minWidth: { xs: 0, sm: 130 }, "& .MuiInputBase-root": { minHeight: 44 }, "& .MuiSelect-select": { paddingLeft: { xs: "10px", sm: "14px" }, paddingRight: { xs: "28px !important", sm: "32px !important" } } }}>
          <Select
            aria-label="Displayed month"
            onChange={(event) => selectMonth(event.target.value)}
            renderValue={(value) => (
              <>
                <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>{monthLabel(value).slice(0, 3)}</Box>
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{monthLabel(value)}</Box>
              </>
            )}
            value={displayedMonth}
          >
            {monthsInSelectedYear.map((value) => <MenuItem key={value} value={value}>{monthLabel(value)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flexShrink: 0, minWidth: { xs: 80, sm: 92 }, width: { xs: 80, sm: "auto" }, "& .MuiInputBase-root": { minHeight: 44 }, "& .MuiSelect-select": { paddingLeft: { xs: "8px", sm: "14px" }, paddingRight: { xs: "28px !important", sm: "32px !important" } } }}>
          <Select aria-label="Displayed year" onChange={(event) => {
            const nextMonth = selectableMonths.find((value) =>
              value.startsWith(`${event.target.value}-`));
            if (nextMonth) selectMonth(nextMonth);
          }} value={selectedYear}>
            {availableYears.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>
      {view === "week" ? (
        <FormControl size="small" sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: { xs: 0, sm: 205 }, "& .MuiInputBase-root": { minHeight: 44 } }}>
          <Select aria-label="Displayed week" onChange={(event) => onNavigate("week", event.target.value)} value={week}>
            {weeksInDisplayedMonth.map((value) => <MenuItem key={value} value={value}>{weekLabel(value)}</MenuItem>)}
          </Select>
        </FormControl>
      ) : null}
      <Button
        aria-label={view === "month" ? "Next month" : "Next week"}
        disabled={activeIndex < 0 || activeIndex >= activePeriods.length - 1}
        onClick={() => move(1)}
        size="small"
        sx={{ flexShrink: 0, height: 44, minWidth: 44, px: 0.5 }}
        variant="outlined"
      >
        <ChevronRightRoundedIcon />
      </Button>
    </Stack>
  );
}

export function CalendarClient({
  availableMonths,
  availableWeeks,
  availableWeekOptions = [],
  initialData,
  initialFilters,
  initialView,
  offlineSavedAtUtc,
  selectedMonth,
  selectedWeek,
}: {
  availableMonths: readonly string[];
  availableWeeks: readonly string[];
  availableWeekOptions: readonly CalendarWeekOption[];
  initialData: CalendarData;
  initialFilters: CalendarFilterInput;
  initialView: CalendarView;
  offlineSavedAtUtc?: string;
  selectedMonth: string;
  selectedWeek: string;
}) {
  const router = useRouter();
  const view = initialView;
  const activeMonth = selectedMonth;
  const [selectedDate, setSelectedDate] = useState(initialData.activeDate);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedTickerId, setExpandedTickerId] = useState<string | null>(null);
  const [tickerDetailState, setTickerDetailState] = useState<TickerDetailState>({
    requestKey: null,
    status: "idle",
    trades: [],
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedViewsOpen, setSavedViewsOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [filters, setFilters] = useState<CalendarFilterInput>(initialFilters);
  const resolvedWeekOptions = availableWeekOptions.length > 0
    ? availableWeekOptions
    : availableWeeks.map((week) => ({ months: [week.slice(0, 7)], week }));
  const selected = initialData.days.find((day) => day.date === selectedDate) ?? emptyDay(selectedDate);
  const expandedTicker = expandedTickerId === null
    ? null
    : selected.tickers.find((ticker) => ticker.instrumentId === expandedTickerId) ?? null;
  const expandedTickerRoundTripIds = expandedTicker?.trades
    .map((trade) => trade.roundTripId)
    .join(",") ?? "";
  const expandedTickerRequestKey = expandedTicker
    ? `${selectedDate}:${expandedTicker.instrumentId}:${expandedTickerRoundTripIds}`
    : null;

  useEffect(() => {
    if (offlineSavedAtUtc || !detailsOpen || !expandedTickerRequestKey) return;
    const controller = new AbortController();
    void fetch(`/api/platform/journal/calendar/ticker-details?roundTripIds=${encodeURIComponent(expandedTickerRoundTripIds)}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("ticker_details_unavailable");
      return response.json() as Promise<Readonly<{ trades: readonly TickerTradeDetail[] }>>;
    }).then((result) => {
      setTickerDetailState({ requestKey: expandedTickerRequestKey, status: "ready", trades: result.trades });
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setTickerDetailState({ requestKey: expandedTickerRequestKey, status: "error", trades: [] });
    });
    return () => controller.abort();
  }, [detailsOpen, expandedTickerRequestKey, expandedTickerRoundTripIds, offlineSavedAtUtc]);

  const visibleTickerDetailState = tickerDetailState.requestKey === expandedTickerRequestKey
    ? tickerDetailState
    : { requestKey: expandedTickerRequestKey, status: expandedTickerRequestKey ? "loading" as const : "idle" as const, trades: [] };
  const tickerDetailsByRoundTripId = new Map(visibleTickerDetailState.trades.map((trade) => [
    trade.roundTripId,
    trade,
  ]));
  const monthGrid = buildMonthGrid(activeMonth, initialData.days);
  const weekDays = buildWeek(selectedWeek, initialData.days);
  const showingCurrentWeek = selectedWeek === currentWeekInTimezone(initialData.timezone);
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
      if (key === "currency") return;
      if (value !== "all") query.set(key, value);
    });
    router.push(`/calendar${query.size ? `?${query.toString()}` : ""}`);
    setFiltersOpen(false);
  };

  const resetFilters = () => setFilters({
    currency: initialData.currency ?? "all",
    direction: "all",
    endDate: initialData.maximumDate,
    performance: "all",
    pnlRange: "all",
    session: "all",
    startDate: initialData.minimumDate,
    symbol: "all",
    tradeCount: "all",
  });

  const navigatePeriod = (nextView: CalendarView, period: string) => {
    if (offlineSavedAtUtc) return;
    const query = new URLSearchParams({ view: nextView });
    query.set(nextView === "month" ? "month" : "week", period);
    router.push(`/calendar?${query.toString()}`);
  };
  const showLegacyCalendarControls = false;

  return (
    <DashboardPage>
      <Typography
        component="h1"
        sx={{
          color: "text.primary",
          display: "block",
          fontWeight: 760,
          lineHeight: 1.2,
        }}
        variant="h1"
      >
        Trading Calendar
      </Typography>
      {offlineSavedAtUtc ? <OfflineSavedViewStatus savedAtUtc={offlineSavedAtUtc} /> : null}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={1} sx={{ alignItems: { lg: "center" }, justifyContent: "space-between" }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <ToggleButtonGroup exclusive onChange={(_, value: CalendarView | null) => {
            if (!value) return;
            if (value === "month") {
              navigatePeriod("month", selectedWeek.slice(0, 7));
              return;
            }
            const weekInDisplayedMonth = availableWeeks.filter((week) =>
              week.startsWith(`${activeMonth}-`)).at(-1);
            navigatePeriod("week", weekInDisplayedMonth ?? selectedWeek);
          }} size="small" sx={{ "& .MuiToggleButton-root": { minHeight: 44 } }} value={view}>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
          </ToggleButtonGroup>
          <FeatureHelpLink href="/help/calendar/month-and-week#navigate-periods" label="month and week views" />
        </Stack>
        <FeatureHelpLink href="/help/calendar" label="Calendar" size="medium" />
        {showLegacyCalendarControls ? <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button onClick={() => setFiltersOpen(true)} startIcon={<DateRangeRoundedIcon />} variant="outlined">Date range</Button>
          <Button onClick={() => setFiltersOpen(true)} startIcon={<FilterAltRoundedIcon />} variant="outlined">P/L and session filters{activeFilterCount ? ` (${activeFilterCount})` : ""}</Button>
          <Button onClick={() => setSavedViewsOpen(true)} startIcon={<SaveRoundedIcon />} variant="outlined">Saved views</Button>
        </Stack> : null}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {initialData.state !== "unavailable" ? <DashboardDataScopeChip /> : null}
        <FeatureHelpLink href="/help/calendar/coverage-and-limits#included-trades" label="Calendar coverage" />
        <Typography color="text.secondary" sx={{ alignSelf: "center", display: initialData.state === "ready" ? "none" : undefined }} variant="caption">
          {initialData.state === "ready"
            ? `Accepted completed trades · ${initialData.timezone}`
            : initialData.state === "empty"
              ? "No completed trades match this calendar view"
              : "This calendar filter cannot be calculated from the available facts"}
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" } }}>
        <DashboardMetricCard caption="Selected period" label="P/L" value={initialData.state === "ready" ? money(initialData.summary.netPnlDecimal, initialData.currency) : "—"} valueColor={initialData.state === "ready" ? financialOutcomeColor(initialData.summary.netPnlDecimal) : "text.primary"} />
        <DashboardMetricCard caption="Selected period" label="Trades" value={initialData.state === "ready" ? String(initialData.summary.tradeCount) : "—"} />
        <DashboardMetricCard caption="Selected period" label="Win rate" value={initialData.state === "ready" ? percent(initialData.summary.winRatePercentDecimal) : "—"} valueColor={initialData.state === "ready" ? financialThresholdColor(initialData.summary.winRatePercentDecimal, 50) : "text.primary"} />
      </Box>

      <DashboardPanel hideHeader>
        <CalendarPeriodNavigation
          availableMonths={availableMonths}
          availableWeeks={availableWeeks}
          availableWeekOptions={resolvedWeekOptions}
          month={activeMonth}
          onNavigate={navigatePeriod}
          view={view}
          week={selectedWeek}
        />
        {view === "month" ? (
          <>
            <Box sx={{ display: { xs: "block", md: "none" }, mx: { xs: -1, sm: 0 } }}>
              <HorizontalScrollHint label="Swipe sideways to see more days" />
              <Box sx={{ pb: 1, px: { xs: 0, sm: 0 } }}>
                <Box
                  sx={{
                    borderColor: "divider",
                    borderLeft: 1,
                    borderTop: 1,
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(7, minmax(0, 1fr))",
                      sm: "repeat(7, minmax(0, 1fr))",
                    },
                    minWidth: 0,
                  }}
                >
                  {weekdayLabels.map((label) => <Box key={label} sx={{ borderBottom: 1, borderColor: "divider", borderRight: 1, py: 0.75, textAlign: "center" }}><Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 850 }}>{label}</Typography></Box>)}
                  {monthGrid.map((day, index) => day === null
                    ? <Box key={`mobile-blank-${index}`} sx={{ bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.background.default : "rgba(246, 248, 252, 0.7)", borderBottom: 1, borderColor: "divider", borderRight: 1, minHeight: 78 }} />
                    : <MobileMonthCell currency={initialData.currency} day={day} key={day.date} onSelect={() => { setSelectedDate(day.date); setExpandedTickerId(null); setDetailsOpen(true); }} onTickerClick={(ticker) => { setSelectedDate(day.date); setExpandedTickerId(ticker.instrumentId); setDetailsOpen(true); }} selected={selectedDate === day.date} />)}
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: { xs: "none", md: "block" }, overflowX: "hidden" }}>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ borderColor: "divider", borderLeft: 1, display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
                  {weekdayLabels.map((label) => <Box key={label} sx={{ borderBottom: 1, borderColor: "divider", borderRight: 1, px: 1.5, py: 1 }}><Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">{label}</Typography></Box>)}
                  {monthGrid.map((day, index) => day === null ? <Box key={`blank-${index}`} sx={{ bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.background.default : "rgba(246, 248, 252, 0.7)", borderBottom: 1, borderColor: "divider", borderRight: 1, minHeight: 96 }} /> : <DayCell currency={initialData.currency} day={day} key={day.date} mode="month" onSelect={() => { setSelectedDate(day.date); setExpandedTickerId(null); setDetailsOpen(true); }} onTickerClick={(ticker) => { setSelectedDate(day.date); setExpandedTickerId(ticker.instrumentId); setDetailsOpen(true); }} selected={selectedDate === day.date} showReviewStatus={false} />)}
                </Box>
              </Box>
            </Box>
          </>
        ) : (
          <CalendarWeekView
            activeDate={selectedWeek}
            currency={initialData.currency}
            days={weekDays}
            onSelect={(day) => { setSelectedDate(day.date); setExpandedTickerId(null); setDetailsOpen(true); }}
            onTickerClick={(day, ticker) => { setSelectedDate(day.date); setExpandedTickerId(ticker.instrumentId); setDetailsOpen(true); }}
            selectedDate={selectedDate}
            showReviewStatus={showingCurrentWeek}
          />
        )}
      </DashboardPanel>

      <Drawer anchor="right" onClose={() => setFiltersOpen(false)} open={filtersOpen} slotProps={{ paper: { sx: { p: 3, width: { xs: "100%", sm: 400 } } } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography component="h2" variant="h2">Calendar filters</Typography>
          <Button aria-label="Close calendar filters" onClick={() => setFiltersOpen(false)} size="small" startIcon={<CloseRoundedIcon />} sx={{ minHeight: 44 }}>Close</Button>
        </Stack>
        <Stack spacing={2.25} sx={{ mt: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField fullWidth label="From" onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} type="date" value={filters.startDate} />
            <TextField fullWidth label="To" onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} type="date" value={filters.endDate} />
          </Stack>
          <FilterSelect label="P/L outcome" value={filters.performance} onChange={(value) => setFilters((current) => ({ ...current, performance: value as CalendarPerformanceFilter }))} items={[["all", "All results"], ["profitable", "Profitable days"], ["losing", "Losing days"]]} />
          <FilterSelect label="Daily P/L band" value={filters.pnlRange} onChange={(value) => setFilters((current) => ({ ...current, pnlRange: value as CalendarPnlFilter }))} items={[["all", "Any daily P/L"], ["loss200", `Below −${journalAnalyticsCurrencySymbol(initialData.currency ?? "") ?? ""}200`], ["flat", `Within ±${journalAnalyticsCurrencySymbol(initialData.currency ?? "") ?? ""}200`], ["profit200", `Above +${journalAnalyticsCurrencySymbol(initialData.currency ?? "") ?? ""}200`]]} />
          <FilterSelect label="Ticker" value={filters.symbol} onChange={(value) => setFilters((current) => ({ ...current, symbol: value }))} items={[["all", "All tickers"], ...initialData.symbols.map((symbol) => [symbol, symbol])]} />
          <FilterSelect label="Direction" value={filters.direction} onChange={(value) => setFilters((current) => ({ ...current, direction: value as CalendarDirectionFilter }))} items={[["all", "Long and short"], ["long", "Long only"], ["short", "Short only"]]} />
          <TextField disabled helperText="Session classification is not available in Trade Tracker yet." label="Session" value="Not available yet" />
          <FilterSelect label="Trade count" value={filters.tradeCount} onChange={(value) => setFilters((current) => ({ ...current, tradeCount: value as CalendarTradeCountFilter }))} items={[["all", "Any trade count"], ["1-3", "1–3 trades"], ["4-6", "4–6 trades"], ["7+", "7+ trades"]]} />
          <Button onClick={resetFilters}>Reset filters</Button>
          <Button onClick={() => applyFilters()} variant="contained">Apply filters</Button>
        </Stack>
      </Drawer>

      <Drawer anchor="right" onClose={() => setSavedViewsOpen(false)} open={savedViewsOpen} slotProps={{ paper: { sx: { p: 3, width: { xs: "100%", sm: 400 } } } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography component="h2" variant="h2">Saved views</Typography>
          <Button aria-label="Close saved calendar views" onClick={() => setSavedViewsOpen(false)} size="small" startIcon={<CloseRoundedIcon />} sx={{ minHeight: 44 }}>Close</Button>
        </Stack>
        <Button onClick={() => setSavedViews((current) => [...current, { filters, name: `Calendar view ${current.length + 1}` }])} startIcon={<SaveRoundedIcon />} sx={{ mt: 3 }} variant="contained">Save current view</Button>
        <Stack divider={<Divider flexItem />} sx={{ mt: 2 }}>
          {savedViews.length === 0 ? <Typography color="text.secondary" sx={{ py: 2 }} variant="body2">No saved views yet.</Typography> : savedViews.map((saved) => <CardActionArea key={saved.name} onClick={() => { setFilters(saved.filters); setSavedViewsOpen(false); applyFilters(saved.filters); }} sx={{ py: 1.5 }}><Typography sx={{ fontWeight: 750 }}>{saved.name}</Typography></CardActionArea>)}
        </Stack>
      </Drawer>

      <Drawer anchor="right" onClose={() => { setDetailsOpen(false); setExpandedTickerId(null); }} open={detailsOpen} slotProps={{ paper: { sx: { p: 3, width: { xs: "100%", sm: 520 } } } }}>
        {detailsOpen ? (
          <>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography component="h2" variant="h5">{new Date(`${selected.date}T12:00:00.000Z`).toLocaleDateString("en-US", { day: "numeric", month: "long", weekday: "long" })}</Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <FeatureHelpLink href="/help/calendar/inspect-a-day#open-details" label="selected-day details" />
                <Button aria-label="Close day details" onClick={() => { setDetailsOpen(false); setExpandedTickerId(null); }} size="small" startIcon={<CloseRoundedIcon />} sx={{ minHeight: 44 }}>Close</Button>
              </Stack>
            </Stack>
            <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", mt: 0.75 }}>
              <Typography color="text.secondary" variant="body2">
                {selected.tradeCount > 0 ? `${selected.tradeCount} trades · ${percent(selected.winRatePercentDecimal)} win rate` : "Swing Trade Tracker activity"}
              </Typography>
              <Typography color={pnlTone(selected.pnlSign).color} sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 850 }}>
                {money(selected.pnlDecimal, initialData.currency)}
              </Typography>
            </Stack>
            {selected.tradeCount > 0 ? (
              <Button href={`/trade-tracker/${selected.date}`} sx={{ mt: 2 }} variant="outlined">Trade tracker</Button>
            ) : null}
            <Stack spacing={1} sx={{ mt: 2 }}>
              {selected.tickers.map((ticker) => (
                <Accordion
                  disableGutters
                  elevation={0}
                  expanded={expandedTickerId === ticker.instrumentId}
                  key={ticker.instrumentId}
                  onChange={(_, isExpanded) => setExpandedTickerId(isExpanded ? ticker.instrumentId : null)}
                  sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, "&:before": { display: "none" }, overflow: "hidden" }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ bgcolor: pnlTone(ticker.pnlSign).backgroundColor, px: 1.5 }}>
                    <Box sx={{ minWidth: 0, width: "100%" }}>
                      <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", pr: 1 }}>
                        <Typography sx={{ fontWeight: 850 }}>{ticker.symbol}</Typography>
                        <Typography color={pnlTone(ticker.pnlSign).color} sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 800 }}>{money(ticker.pnlDecimal, initialData.currency)}</Typography>
                      </Stack>
                      <Typography color="text.secondary" variant="caption">{ticker.trades.length} trade{ticker.trades.length === 1 ? "" : "s"}</Typography>
                      <TickerAnnotationChips compact={false} noteCount={ticker.noteCount} ruleReviewCount={ticker.ruleReviewCount} tagCount={ticker.tagCount} />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    {expandedTicker?.instrumentId === ticker.instrumentId && visibleTickerDetailState.status === "loading" ? <Typography color="text.secondary" variant="body2">Loading trade details...</Typography> : null}
                    {expandedTicker?.instrumentId === ticker.instrumentId && visibleTickerDetailState.status === "error" ? <Typography color="error.main" variant="body2">Trade details could not be loaded.</Typography> : null}
                    {expandedTicker?.instrumentId === ticker.instrumentId && visibleTickerDetailState.status === "ready" ? (
                      <Stack divider={<Divider flexItem />}>
                        {ticker.trades.map((trade, index) => {
                          const tone = pnlTone(trade.pnlSign);
                          const detail = tickerDetailsByRoundTripId.get(trade.roundTripId);
                          return <Box key={trade.roundTripId} sx={{ backgroundColor: tone.backgroundColor, borderRadius: 1, my: 0.75, px: 1.25, py: 1.5 }}>
                            <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
                              <Typography sx={{ fontWeight: 800 }}>Trade {index + 1}</Typography>
                              <Typography color={tone.color} sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 800 }}>{money(trade.pnlDecimal, initialData.currency)}</Typography>
                            </Stack>
                            {detail?.tags.length ? <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 1 }}>{detail.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}</Stack> : null}
                            {detail?.notes.map((note) => <Typography key={note} sx={{ mt: 1.25, whiteSpace: "pre-wrap" }} variant="body2">{note}</Typography>)}
                            <Accordion disableGutters elevation={0} sx={{ "&:before": { display: "none" }, mt: 1 }}>
                              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>Show executions ({detail?.executions.length ?? 0})</AccordionSummary>
                              <AccordionDetails sx={{ pb: 1, pl: 2.5, pr: 1 }}>
                                <Stack divider={<Divider flexItem />} spacing={0.75}>
                                  {detail?.executions.map((execution, index) => <Stack key={`${execution.executed_at_utc}-${execution.side}-${execution.quantity_decimal}-${execution.price_decimal ?? "none"}-${index}`} spacing={0.25} sx={{ py: 0.75 }}><Typography color="text.secondary" variant="caption">{executionTimestamp(execution.executed_at_utc, initialData.timezone)}</Typography><Typography variant="body2">{execution.side === "buy" ? "Buy" : "Sell"} {formatJournalAnalyticsDecimal(execution.quantity_decimal)} shares @ {price(execution.price_decimal, initialData.currency)}</Typography></Stack>)}
                                </Stack>
                              </AccordionDetails>
                            </Accordion>
                          </Box>;
                        })}
                      </Stack>
                    ) : null}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </>
        ) : null}
      </Drawer>

      <Drawer anchor="right" onClose={() => setDetailsOpen(false)} open={false} slotProps={{ paper: { sx: { p: 3, width: { xs: "100%", sm: 420 } } } }}>
        <Typography color="text.secondary" sx={{ fontWeight: 750 }} variant="caption">CALENDAR DAY</Typography>
        <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", mt: 0.75 }}>
          <Typography component="h2" variant="h5">{new Date(`${selected.date}T12:00:00.000Z`).toLocaleDateString("en-US", { day: "numeric", month: "long", weekday: "long" })}</Typography>
          {selected.tradeCount > 0 ? <Typography color={pnlTone(selected.pnlSign).color} sx={{ fontWeight: 850 }} variant="h6">{money(selected.pnlDecimal, initialData.currency)}</Typography> : null}
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">{selected.tradeCount > 0 ? `${selected.tradeCount} trades · ${percent(selected.winRatePercentDecimal)} win rate · Peak giveback ${money(selected.peakGivebackDecimal, initialData.currency)}` : "Swing Trade Tracker activity"}</Typography>
        <Divider sx={{ my: 2.5 }} />
        <Typography sx={{ fontWeight: 800 }} variant="body2">Ticker results</Typography>
        <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>{selected.tickers.map((ticker) => <Stack key={ticker.instrumentId} sx={{ py: 1.4 }}><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography sx={{ fontWeight: 800 }}>{ticker.symbol}</Typography><Typography color={pnlTone(ticker.pnlSign).color} sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 800 }}>{money(ticker.pnlDecimal, initialData.currency)}</Typography></Stack><TickerAnnotationChips compact={false} noteCount={ticker.noteCount} ruleReviewCount={ticker.ruleReviewCount} tagCount={ticker.tagCount} /></Stack>)}</Stack>
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
