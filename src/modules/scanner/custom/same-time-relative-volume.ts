import { indicatorTradingDay, indicatorMarketDate, type IndicatorCalendar,
  type IndicatorTradingDay } from "../../market-data/indicators/indicator-sessions";
import sessionCalendar from "../../coach/server/market-calendar/us-equities-review-calendar.v1.json";
import type { ScannerSession } from "../live/contracts";

const INTERVAL = 15 * 60_000;
const DAY = 86_400_000;
const LOOKBACK_SESSIONS = 3;
const calendar = sessionCalendar as IndicatorCalendar;

function sessionBounds(day: IndicatorTradingDay, session: ScannerSession): [number, number] {
  if (session === "premarket") return [day.preOpen, day.regularOpen];
  if (session === "after_hours") return [day.regularClose, day.postClose];
  return [day.regularOpen, day.regularClose];
}

export function sameTimeSessionVolumeRatio(packed: Float64Array, stride: number, through: number,
  coveredFrom?: number, session: ScannerSession = "regular"): number | null {
  const date = indicatorMarketDate(through - 1);
  const today = indicatorTradingDay(calendar, date);
  if (!today) return null;
  const [open, close] = sessionBounds(today, session);
  const elapsed = through - open;
  if (elapsed <= 0 || through > close || elapsed % INTERVAL) return null;
  const volumes = new Map<number, number>();
  for (let i = 0; i < packed.length; i += stride) volumes.set(packed[i] * 1000, packed[i + 5]);
  const total = (open: number) => {
    let sum = 0;
    for (let time = open; time < open + elapsed; time += INTERVAL) {
      const volume = volumes.get(time) ?? (coveredFrom !== undefined && time >= coveredFrom ? 0 : undefined);
      if (volume === undefined || !Number.isFinite(volume) || volume < 0) return null;
      sum += volume;
    }
    return sum;
  };
  const current = total(open);
  if (current === null) return null;

  let sum = 0, covered = 0;
  const midnight = Date.parse(date + "T00:00:00Z");
  for (let offset = 1; offset <= 7 && covered < LOOKBACK_SESSIONS; offset++) {
    const priorDate = new Date(midnight - offset * DAY).toISOString().slice(0, 10);
    const prior = indicatorTradingDay(calendar, priorDate);
    if (prior === undefined) return null;
    if (!prior) continue;
    const [priorOpen, priorClose] = sessionBounds(prior, session);
    if (priorClose - priorOpen < elapsed) continue;
    const priorTotal = total(priorOpen);
    if (priorTotal === null) return null;
    sum += priorTotal;
    covered++;
  }
  return covered === LOOKBACK_SESSIONS && sum > 0 ? current * LOOKBACK_SESSIONS / sum : null;
}
