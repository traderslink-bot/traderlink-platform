import { alpacaCandle, easternDayStart, type Candle } from "../scanner/alpaca/candles";
import type { ChartMarketSession } from "../scanner/alpaca/chart-calendar";
import { easternClock } from "../scanner/live/sessions";
import { isObject, type MarketSession, type Values } from "./contracts";
import { barNotional, completedSessionBars, intradayStructureMetrics, SCREENER_BAR_MS } from "./intraday-structure";

export type ProviderBar = Candle & { vwap?: number; trades?: number };
export type Window = { session: MarketSession; date: string; from: number; until: number; asOf: number; closed: boolean };

const DAY = 86_400_000;
const MINUTE = 60_000;
const FRAME = SCREENER_BAR_MS;
const dateStarts = new Map<string, number>();
const barDates = new Map<number, string>();
function timeAt(date: string, minutes: number) {
  let start = dateStarts.get(date);
  if (start === undefined) {
    start = easternDayStart(Date.parse(date + "T12:00:00Z") / 1000) * 1000;
    if (dateStarts.size >= 1_000) dateStarts.clear();
    dateStarts.set(date, start);
  }
  return start + minutes * MINUTE;
}
const closeMinute = (day: ChartMarketSession) => day.close === "13:00" ? 780 : 960;

export function sessionBounds(day: ChartMarketSession, session: MarketSession) {
  const close = closeMinute(day);
  const from = session === "premarket" ? 240 : session === "after_hours" ? close : 570;
  const until = session === "premarket" ? 570 : session === "after_hours" ? (close === 780 ? 1020 : 1200) : close;
  return { from: timeAt(day.date, from), until: timeAt(day.date, until) };
}

export function decodeBar(value: unknown): ProviderBar | null {
  const bar = alpacaCandle(value);
  if (!bar || bar.low <= 0 || !isObject(value)) return null;
  return { ...bar, ...(positive(value.vw) ? { vwap: value.vw } : {}),
    ...(typeof value.n === "number" && Number.isSafeInteger(value.n) && value.n >= 0 ? { trades: value.n } : {}) };
}

export function marketWindows(calendar: readonly ChartMarketSession[], now: number) {
  const today = easternClock(now).date;
  const days = calendar.filter(day => day.date <= today);
  const started = (minute: (day: ChartMarketSession) => number) => days.findLast(day => timeAt(day.date, minute(day)) <= now);
  const last = days.findLast(day => timeAt(day.date, closeMinute(day)) <= now - 2 * MINUTE);
  const before = started(() => 240), regular = started(() => 570), after = started(closeMinute);
  if (!last || !before || !regular || !after) throw Error("calendar_unavailable");
  function make(session: MarketSession, day: ChartMarketSession): Window {
    const { from: open, until: close } = sessionBounds(day, session);
    // Give the provider time to revise the last bucket before using it.
    const watermark = Math.floor((now - MINUTE) / FRAME) * FRAME;
    return { session, date: day.date, from: open, until: close, asOf: Math.min(close, Math.max(open, watermark)), closed: now >= close };
  }
  const windows = {
    premarket: make("premarket", before),
    regular: make("regular", regular),
    after_hours: make("after_hours", after),
    last_regular: make("last_regular", last),
  };
  const latest: MarketSession = (["premarket", "regular", "after_hours"] as const).find(session => {
    const window = windows[session];
    return now >= window.from && now < window.until;
  }) ?? "last_regular";
  return { latest, windows };
}

function positive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function mean(values: readonly number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const percent = (price: number, baseline: number) => (price / baseline - 1) * 100;

function technicals(bars: readonly ProviderBar[], price: number, date: string): Values {
  const values: Values = {};
  for (const [length, sma, distance] of [[20, "sma20", "dist20"], [50, "sma50", "dist50"], [200, "sma200", "dist200"]] as const) {
    if (bars.length < length) continue;
    values[sma] = mean(bars.slice(-length).map(bar => bar.close));
    values[distance] = percent(price, values[sma]!);
  }
  for (const [length, key] of [[9, "ema9"], [20, "ema20"]] as const) {
    if (bars.length < 3 * length) continue;
    const seed = mean(bars.slice(0, length).map(bar => bar.close));
    values[key] = bars.slice(length).reduce((ema, bar) => ema + (bar.close - ema) * (2 / (length + 1)), seed);
  }
  if (bars.length >= 15) {
    const moves = bars.slice(1).map((bar, index) => bar.close - bars[index].close);
    const wilder = (series: readonly number[]) => series.slice(14).reduce((avg, next) => (avg * 13 + next) / 14, mean(series.slice(0, 14)));
    const gain = wilder(moves.map(move => Math.max(0, move)));
    const loss = wilder(moves.map(move => Math.max(0, -move)));
    values.rsi = loss === 0 ? gain === 0 ? 50 : 100 : 100 - 100 / (1 + gain / loss);
    const ranges = bars.slice(1).map((bar, index) => Math.max(bar.high - bar.low, Math.abs(bar.high - bars[index].close), Math.abs(bar.low - bars[index].close)));
    values.atr = wilder(ranges);
    values.atrPercent = 100 * values.atr / bars.at(-1)!.close;
  }
  const threshold = Date.parse(date + "T12:00:00Z") - 364 * DAY;
  const range = bars.filter(bar => bar.time * 1000 >= threshold - 18 * 3_600_000);
  if (bars[0] && bars[0].time * 1000 < threshold && range.length >= 225) {
    values.week52high = Math.max(...range.map(bar => bar.high));
    values.week52low = Math.min(...range.map(bar => bar.low));
    values.below52High = -percent(price, values.week52high);
    values.above52Low = percent(price, values.week52low);
  }
  return values;
}

function asEasternDate(bar: ProviderBar) {
  let date = barDates.get(bar.time);
  if (date === undefined) {
    date = easternClock(bar.time * 1000).date;
    if (barDates.size >= 1_000) barDates.clear();
    barDates.set(bar.time, date);
  }
  return date;
}

function regularSessionSignals(
  window: Window, day: ChartMarketSession, session: readonly ProviderBar[], intraday: readonly ProviderBar[],
  priorClose: number | undefined,
): Values {
  const values: Values = {};
  const traded = session.filter(bar => bar.volume > 0);
  if (!traded.length) return values;
  const first = session[0];
  if (priorClose !== undefined && first.volume > 0 && first.time * 1000 === window.from) {
    const open = first.open;
    if (open === priorClose) values.gapFillStatus = -1;
    else values.gapFillStatus = Number(traded.some(bar => open > priorClose ? bar.low <= priorClose : bar.high >= priorClose));
  }

  const premarketStart = sessionBounds(day, "premarket").from;
  let premarketHigh = 0;
  for (const bar of intraday) {
    const start = bar.time * 1000;
    if (bar.volume > 0 && start >= premarketStart && start + FRAME <= window.from) premarketHigh = Math.max(premarketHigh, bar.high);
  }
  if (premarketHigh > 0) {
    values.premarketHigh = premarketHigh;
    values.premarketHighBreak = Number(traded.some(bar => bar.high > premarketHigh));
  }
  return values;
}

export function sessionMetrics(input: {
  window: Window; daily: readonly ProviderBar[]; intraday: readonly ProviderBar[]; days: readonly ChartMarketSession[];
  quote?: unknown; captureAt: number; intradayComplete: boolean; dailyComplete: boolean; cap?: number;
}): { values: Values; priceAt?: number; quoteAt?: number } {
  const { window, days } = input;
  const values: Values = input.cap === undefined ? {} : { cap: input.cap };
  const session = input.intradayComplete ? completedSessionBars(window, input.intraday) : [];
  const latest = session.at(-1);
  const dayIndex = days.findIndex(day => day.date === window.date);
  const day = days[dayIndex];
  const previous = days[dayIndex - 1];
  const lastCompleted = window.asOf >= timeAt(window.date, closeMinute(day)) ? day : previous;
  const history = input.dailyComplete && lastCompleted
    ? input.daily.filter(bar => asEasternDate(bar) <= lastCompleted.date) : [];
  const byDate = new Map(history.map(bar => [asEasternDate(bar), bar]));
  const currentDaily = byDate.get(window.date);
  const regular = window.session === "regular" || window.session === "last_regular";
  // A completed regular daily bar supplies the official close. Intraday bars supply session activity.
  const price = regular && window.closed && currentDaily ? currentDaily.close : latest?.close;
  if (!positive(price)) return { values };
  values.price = price;
  const priceAt = regular && window.closed && currentDaily ? window.until : latest!.time * 1000 + FRAME;
  const reference = window.session === "after_hours" ? currentDaily : previous && byDate.get(previous.date);
  if (reference) values.change = percent(price, reference.close);

  if (session.length) {
    values.open = session[0].open;
    values.high = Math.max(...session.map(bar => bar.high));
    values.low = Math.min(...session.map(bar => bar.low));
    values.range = percent(values.high, values.low);
    values.fromHigh = -percent(price, values.high);
    values.fromLow = percent(price, values.low);
    let volume = 0, recent5 = 0, recent15 = 0;
    for (const bar of session) {
      volume += bar.volume;
      const age = window.asOf - bar.time * 1000;
      if (age <= FRAME) recent5 += bar.volume;
      if (age <= 3 * FRAME) recent15 += bar.volume;
    }
    values.volume = volume;
    const elapsed = window.asOf - window.from;
    if (volume > 0 && elapsed >= FRAME) values.recentVolume5 = recent5;
    if (volume > 0 && elapsed >= 3 * FRAME) values.recentVolume15 = recent15;
    if (session.every(bar => bar.trades !== undefined)) values.trades = session.reduce((sum, bar) => sum + bar.trades!, 0);
    const traded = barNotional(session);
    if (traded !== undefined) values.dollarVolume = traded;
    Object.assign(values, intradayStructureMetrics(window, session, price, priceAt));
    // An observed first five-minute bar only qualifies as a regular opening bucket at 9:30.
    if (regular && reference && session[0].time * 1000 === window.from) values.openGap = percent(values.open, reference.close);
    if (regular) Object.assign(values, regularSessionSignals(window, day, session, input.intraday, reference?.close));
  }

  const baseline = days.slice(Math.max(0, dayIndex - 50), dayIndex).map(item => byDate.get(item.date));
  for (const [length, key] of [[10, "avg10"], [20, "avg20"], [50, "avg50"]] as const) {
    const selected = baseline.slice(-length);
    if (selected.length === length && selected.every(bar => bar !== undefined)) values[key] = mean(selected.map(bar => bar!.volume));
  }
  const twenty = baseline.slice(-20);
  if (twenty.length === 20 && twenty.every(bar => bar !== undefined)) {
    const traded = barNotional(twenty as ProviderBar[]);
    if (traded !== undefined) values.avgDollar = traded / 20;
  }
  for (const [period, key] of [[5, "week"], [21, "month"], [63, "quarter"], [126, "halfYear"], [252, "year"]] as const) {
    const start = days[dayIndex - period], bar = start && byDate.get(start.date);
    if (bar) values[key] = percent(price, bar.close);
  }
  const yearStart = days.findLast(candidate => candidate.date < window.date.slice(0, 4) + "-01-01");
  const baseYear = yearStart && byDate.get(yearStart.date);
  if (baseYear) values.ytd = percent(price, baseYear.close);

  if (lastCompleted && byDate.has(lastCompleted.date)) {
    // Indicator warmup stops at the first unobserved market day.
    const contiguous: ProviderBar[] = [];
    for (let i = days.findIndex(candidate => candidate.date === lastCompleted.date); i >= 0; i--) {
      const bar = byDate.get(days[i].date);
      if (!bar) break;
      contiguous.push(bar);
    }
    Object.assign(values, technicals(contiguous.reverse(), price, window.date));
  }

  let quoteAt: number | undefined;
  if (!window.closed && isObject(input.quote)) {
    const { bp, ap, t } = input.quote;
    const timestamp = typeof t === "string" ? Date.parse(t) : NaN;
    // Quote and bar have separate clocks. At capture, only use a fresh session quote.
    if (positive(bp) && positive(ap) && ap >= bp && timestamp >= window.from
      && timestamp <= input.captureAt && input.captureAt - timestamp <= 30_000) {
      values.bid = bp;
      values.ask = ap;
      values.spreadDollar = ap - bp;
      values.spread = (ap - bp) / ((ap + bp) / 2) * 10_000;
      quoteAt = timestamp;
    }
  }
  return { values, priceAt, ...(quoteAt === undefined ? {} : { quoteAt }) };
}
