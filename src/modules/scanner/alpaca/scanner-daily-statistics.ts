import { priceChangePercent } from "../price-change";
import { easternDayStart, type Candle } from "./candles";
import type { ChartCalendar } from "./chart-calendar";
import type { ScannerDailyHighs } from "../live/contracts";

const DAY_MS = 86_400_000;
const stamp = (date: string) => Date.parse(date + "T00:00:00Z");
const dateAt = (time: number) => new Date(time).toISOString().slice(0, 10);
const mondayAt = (date: string) => stamp(date) - ((new Date(stamp(date)).getUTCDay() + 6) % 7) * DAY_MS;

export const SCANNER_BENCHMARK = "SPY";
export const SCANNER_DAILY_HISTORY_DAYS = 35;
export type ScannerClosedReturn = Readonly<{ from: string; through: string; percent: number }>;
export type ScannerDailyStatistics = Readonly<{
  dailyClosedAt?: number;
  weeklyClosedAt?: number;
  daily?: ScannerClosedReturn;
  weekly?: ScannerClosedReturn;
  averageVolume20?: number;
  averageDollars20?:number;
  averageDailyRange20?: number;
  dailyCloseVsSma20?: number;
  weeklyCloseVsSma4?: number;
  dailyRelativeToSpy?: number;
  weeklyRelativeToSpy?: number;
  recentHighs?: ScannerDailyHighs;
}>;

function closedReturn(days: readonly string[], bars: ReadonlyMap<string, Candle>): ScannerClosedReturn | undefined {
  if (days.length !== 2) return;
  const [from, through] = days;
  const previous = bars.get(from), current = bars.get(through);
  if (!previous || !current || previous.close <= 0 || current.close <= 0) return;
  const percent = priceChangePercent(current.close, previous.close);
  return Number.isFinite(percent) ? { from, through, percent } : undefined;
}

function closeVsAverage(days: readonly string[], bars: ReadonlyMap<string, Candle>, length: number) {
  if (days.length !== length) return;
  const closes = days.map(day => bars.get(day)?.close ?? 0);
  if (closes.some(close => !Number.isFinite(close) || close <= 0)) return;
  const average = closes.reduce((sum, close) => sum + close, 0) / length;
  return priceChangePercent(closes[length - 1], average);
}

function coveredHigh(days: readonly string[], bars: ReadonlyMap<string, Candle>, quiet: (day: string) => boolean) {
  let high = 0;
  for (const day of days) {
    const bar = bars.get(day);
    if (!bar && quiet(day)) continue;
    if (!bar || !Number.isFinite(bar.high) || bar.high <= 0) return;
    high = Math.max(high, bar.high);
  }
  return high || undefined;
}

export function scannerDailyStatistics(
  date: string, bars: ReadonlyMap<string, Candle>, calendars: readonly ChartCalendar[],
  quiet: (day: string) => boolean = () => false, dollars?: ReadonlyMap<string,number>,
): ScannerDailyStatistics | undefined {
  const available = calendars.filter(calendar => calendar.available);
  const historyStart = dateAt(stamp(date) - SCANNER_DAILY_HISTORY_DAYS * DAY_MS);
  const priorDay = dateAt(stamp(date) - DAY_MS);
  const covers = (day: string) => available.some(calendar => calendar.start <= day && day <= calendar.end);
  for (let day = stamp(historyStart); day <= stamp(priorDay); day += DAY_MS) {
    if (!covers(dateAt(day))) return;
  }
  const sessions = [...new Set(available.flatMap(calendar => calendar.sessions.map(session => session.date)))]
    .filter(day => day >= historyStart && day < date).sort();
  const daily = closedReturn(sessions.slice(-2), bars);
  const currentMonday = mondayAt(date);
  const earlierMonday = currentMonday - 14 * DAY_MS;
  const laterMonday = currentMonday - 7 * DAY_MS;
  const firstWeek = sessions.filter(day => stamp(day) >= earlierMonday && stamp(day) < laterMonday);
  const lastWeek = sessions.filter(day => stamp(day) >= laterMonday && stamp(day) < currentMonday);
  const firstClose = firstWeek.at(-1), lastClose = lastWeek.at(-1);
  const weekClose = (week: readonly string[]) => {
    if (!week.every(day => {
      const bar = bars.get(day);
      return bar ? Number.isFinite(bar.close) && bar.close > 0 : quiet(day);
    })) return;
    return week.findLast(day => bars.has(day));
  };
  // The current trading date stays outside the reference windows for every session.
  const lastFiveSessions = sessions.length >= 5 ? coveredHigh(sessions.slice(-5), bars, quiet) : undefined;
  const sevenDaysAgo = dateAt(stamp(date) - 7 * DAY_MS);
  const lastSevenDays = coveredHigh(sessions.filter(day => day >= sevenDaysAgo), bars, quiet);
  const previousWeek = coveredHigh(lastWeek, bars, quiet);
  const firstWeeklyPrint = weekClose(firstWeek), lastWeeklyPrint = weekClose(lastWeek);
  const observedReturn = firstWeeklyPrint && lastWeeklyPrint ? closedReturn([firstWeeklyPrint, lastWeeklyPrint], bars) : undefined;
  // Weekly comparisons use the same completed periods even if a thin symbol last traded earlier in the week.
  const weekly = observedReturn && firstClose && lastClose
    ? { from: firstClose, through: lastClose, percent: observedReturn.percent } : undefined;
  const dailyWindow = sessions.slice(-20);
  const averageBars = dailyWindow.map(day => bars.get(day));
  const weeks = Array.from({length: 4}, (_, index) => {
    const start = currentMonday - (4 - index) * 7 * DAY_MS;
    return sessions.filter(day => stamp(day) >= start && stamp(day) < start + 7 * DAY_MS);
  });
  const weeklyCloses = weeks.map(weekClose);
  const dailyCloseVsSma20 = closeVsAverage(dailyWindow, bars, 20);
  const weeklyCloseVsSma4 = weeklyCloses.every((day): day is string => day !== undefined)
    ? closeVsAverage(weeklyCloses, bars, 4) : undefined;
  const complete = averageBars.length === 20 && averageBars.every((bar): bar is Candle =>
    !!bar && Number.isFinite(bar.volume) && bar.volume >= 0 && bar.low > 0 && bar.high >= bar.low);
  const volumes = dailyWindow.map(day => bars.get(day)?.volume ?? (quiet(day) ? 0 : undefined));
  const averageVolume20 = volumes.length === 20 && volumes.every((volume): volume is number =>
    volume !== undefined && Number.isFinite(volume) && volume >= 0)
    ? volumes.reduce((sum, volume) => sum + volume, 0) / 20 : undefined;
  const tradedDollars=dailyWindow.map(day=>dollars?.get(day)??(bars.get(day)?.volume===0 || (!bars.has(day)&&quiet(day)) ? 0 : undefined));
  const averageDollars20=tradedDollars.length===20 && tradedDollars.every((v):v is number=>v!==undefined && Number.isFinite(v) && v>=0)
    ? tradedDollars.reduce((sum,v)=>sum+v,0)/20:undefined;
  const averageDailyRange20 = complete
    ? averageBars.reduce((sum, bar) => sum + priceChangePercent(bar.high, bar.low), 0) / 20 : undefined;
  const closeAt = (day: string | undefined) => {
    if (!day) return;
    const session = available.flatMap(calendar => calendar.sessions).find(session => session.date === day);
    if (!session || !/^(13|16):00$/u.test(session.close)) return;
    return easternDayStart((stamp(day) + 12 * 3_600_000) / 1_000) * 1_000 + Number(session.close.slice(0, 2)) * 3_600_000;
  };
  const dailyClosedAt = daily || dailyCloseVsSma20 !== undefined || averageVolume20 !== undefined || complete
    ? closeAt(sessions.at(-1)) : undefined;
  const weeklyClosedAt = weekly || weeklyCloseVsSma4 !== undefined ? closeAt(lastClose) : undefined;
  return { daily, weekly, ...(averageDollars20!==undefined && {averageDollars20}), averageVolume20, averageDailyRange20,
    ...(dailyClosedAt === undefined ? {} : { dailyClosedAt }),
    ...(weeklyClosedAt === undefined ? {} : { weeklyClosedAt }),
    ...(dailyCloseVsSma20 === undefined ? {} : { dailyCloseVsSma20 }),
    ...(weeklyCloseVsSma4 === undefined ? {} : { weeklyCloseVsSma4 }),
    ...(lastFiveSessions !== undefined || lastSevenDays !== undefined || previousWeek !== undefined
      ? { recentHighs: { lastFiveSessions, lastSevenDays, previousWeek } } : {}),
  };
}

export function relativeToScannerBenchmark(value?: ScannerClosedReturn, benchmark?: ScannerClosedReturn) {
  return value && benchmark && value.from === benchmark.from && value.through === benchmark.through
    ? value.percent - benchmark.percent : undefined;
}
