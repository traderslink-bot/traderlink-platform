export const CHART_CALCULATION_TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D"] as const;
const CALENDAR_TIMEFRAMES = ["1W", "1M", "1Y"] as const;
export const CHART_TIMEFRAMES = [...CHART_CALCULATION_TIMEFRAMES, ...CALENDAR_TIMEFRAMES] as const;
export type ChartCalculationTimeframe = typeof CHART_CALCULATION_TIMEFRAMES[number];
export type CalendarChartTimeframe = typeof CALENDAR_TIMEFRAMES[number];
export type ChartTimeframe = typeof CHART_TIMEFRAMES[number];
export function isCalendarChartTimeframe(timeframe: ChartTimeframe): timeframe is CalendarChartTimeframe {
  return timeframe === "1W" || timeframe === "1M" || timeframe === "1Y";
}

export function usesDailyCandles(timeframe: ChartTimeframe): timeframe is "1D" | CalendarChartTimeframe {
  return timeframe === "1D" || isCalendarChartTimeframe(timeframe);
}

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

export function chartSymbol(value: string): string {
  const symbol = value.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)) throw Error("invalid_symbol");
  return symbol;
}

export function chartTimeframe(value: string): ChartTimeframe {
  if (!CHART_TIMEFRAMES.includes(value as ChartTimeframe)) throw Error("invalid_timeframe");
  return value as ChartTimeframe;
}

export function alpacaCandle(value: unknown): Candle | null {
  if (!value || typeof value !== "object") return null;
  const bar = value as Record<string, unknown>;
  const time = typeof bar.t === "string" ? Date.parse(bar.t) / 1000 : NaN;
  const values = [bar.o, bar.h, bar.l, bar.c, bar.v];
  if (!Number.isFinite(time) || !values.every(value => typeof value === "number" && Number.isFinite(value) && value >= 0)) return null;
  const [open, high, low, close, volume] = values as number[];
  if (low > Math.min(open, close) || high < Math.max(open, close) || low > high) return null;
  return { time: Math.floor(time), open, high, low, close, volume };
}

const easternParts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

const easternDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
});
const calendarStarts = new Map<number, number>();

export function chartCalendarPeriodStart(time: number, timeframe: CalendarChartTimeframe, offset = 0): number {
  const [year, month, day] = easternDate.format(time * 1000).split("-").map(Number);
  let noon = Date.UTC(year, month - 1, day, 12);
  if (timeframe === "1W") {
    const weekday = new Date(noon).getUTCDay();
    noon += (offset * 7 - (weekday + 6) % 7) * 86_400_000;
  } else if (timeframe === "1M") {
    noon = Date.UTC(year, month - 1 + offset, 1, 12);
  } else {
    noon = Date.UTC(year + offset, 0, 1, 12);
  }
  const existing = calendarStarts.get(noon);
  if (existing !== undefined) return existing;
  const start = easternDayStart(noon / 1000);
  calendarStarts.set(noon, start);
  if (calendarStarts.size > 2048) calendarStarts.delete(calendarStarts.keys().next().value!);
  return start;
}

export function nextChartCalendarPeriod(time: number, timeframe: CalendarChartTimeframe): number {
  return chartCalendarPeriodStart(time, timeframe, 1);
}

/** Calendar slots are equally spaced on the chart even when their UTC durations differ. */
export function chartCalendarPosition(from: number, time: number, timeframe: CalendarChartTimeframe): number {
  const start = chartCalendarPeriodStart(time, timeframe);
  const end = nextChartCalendarPeriod(start, timeframe);
  const [firstYear, firstMonth] = easternDate.format(from * 1000).split("-").map(Number);
  const [year, month] = easternDate.format(start * 1000).split("-").map(Number);
  const index = timeframe === "1Y" ? year - firstYear : timeframe === "1M"
    ? (year - firstYear) * 12 + month - firstMonth : Math.round((start - from) / (7 * 86400));
  return index + (time - start) / (end - start);
}

export function chartCalendarTime(from: number, position: number, timeframe: CalendarChartTimeframe): number {
  const index = Math.floor(position);
  const start = chartCalendarPeriodStart(from, timeframe, index);
  return start + (nextChartCalendarPeriod(start, timeframe) - start) * (position - index);
}

/** Keep real UTC timestamps while anchoring four-hour boundaries to Eastern wall time. */
export function candleBucket(time: number, timeframe: ChartTimeframe, regularOnly=false): number {
  if (timeframe === "1D") return time;
  if (isCalendarChartTimeframe(timeframe)) return chartCalendarPeriodStart(time, timeframe);
  if (timeframe === "4h") {
    const parts = Object.fromEntries(easternParts.formatToParts(new Date(time * 1000)).map(part => [part.type, part.value]));
    const wall = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) / 1000;
    const anchor = Date.UTC(+parts.year, +parts.month - 1, +parts.day, regularOnly?9:0, regularOnly?30:0) / 1000;
    const boundary = anchor + Math.floor((wall-anchor)/14400)*14400;
    return boundary - (wall - time);
  }
  const seconds = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600 }[timeframe];
  const offset=regularOnly&&timeframe==="1h"?1800:0;
  return Math.floor((time-offset) / seconds) * seconds+offset;
}

export function aggregateCandles(input: Iterable<Candle>, timeframe: ChartTimeframe, regularOnly=false): Candle[] {
  const unique = new Map<number, Candle>();
  for (const bar of input) unique.set(bar.time, bar);
  const buckets = new Map<number, Candle>();
  for (const bar of [...unique.values()].sort((a, b) => a.time - b.time)) {
    const time = candleBucket(bar.time, timeframe,regularOnly);
    const previous = buckets.get(time);
    buckets.set(time, previous ? { ...previous, high: Math.max(previous.high, bar.high), low: Math.min(previous.low, bar.low), close: bar.close, volume: previous.volume + bar.volume } : { ...bar, time });
  }
  return [...buckets.values()];
}

export type DisplayCandle = Candle & { carried: boolean };

/** Chart-only placeholders. Never pass these points to analytics or provider storage. */
export function displayCandles(input: readonly Candle[], timeframe: ChartTimeframe, through?: number): DisplayCandle[] {
  if (usesDailyCandles(timeframe)) return input.map(bar => ({ ...bar, carried: false }));
  const result: DisplayCandle[] = [];
  const step = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400 }[timeframe];
  const session = (time: number) => {
    const parts = Object.fromEntries(easternParts.formatToParts(new Date(time * 1000)).map(part => [part.type, part.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: +parts.hour };
  };
  for (const bar of input) {
    const previous = result.at(-1);
    // A contiguous pair has no slots to fill, so it needs no timezone conversion.
    if (previous && step && bar.time - previous.time > step) {
      const currentSession = session(bar.time);
      // Preserve gaps within an observed trading day; do not invent overnight/weekend sessions.
      if (session(previous.time).date === currentSession.date) {
        for (let time = previous.time + step; time < bar.time; time += step) {
          const slot = session(time);
          if (slot.hour < 4 || slot.hour >= 20) continue;
          result.push({ time, open: previous.close, high: previous.close, low: previous.close, close: previous.close, volume: 0, carried: true });
        }
      }
    }
    result.push({ ...bar, carried: false });
  }
  const last = result.at(-1);
  if (last && step && through && session(last.time).date === session(through).date) {
    for (let time = last.time + step; time <= through; time += step) {
      const slot = session(time);
      if (slot.hour < 4 || slot.hour >= 20) continue;
      result.push({time,open:last.close,high:last.close,low:last.close,close:last.close,volume:0,carried:true});
    }
  }
  return result;
}


/** New York midnight, preserving UTC timestamps across both DST transitions. */
export function easternDayStart(time:number):number {
  const target=Object.fromEntries(easternParts.formatToParts(new Date(time*1000)).map(part=>[part.type,part.value]));
  const midnight=Date.UTC(+target.year,+target.month-1,+target.day)/1000;
  let guess=midnight;
  for(let pass=0;pass<3;pass++){
    const parts=Object.fromEntries(easternParts.formatToParts(new Date(guess*1000)).map(part=>[part.type,part.value]));
    const wall=Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute,+parts.second)/1000;
    guess+=midnight-wall;
  }
  return guess;
}
