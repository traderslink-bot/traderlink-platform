import { easternClock } from "../live/sessions";
import type { ChartPreferences } from "./chart-preferences";

// BOATS is disabled. Keep saved preferences for a future explicit reactivation.
export const CHART_OVERNIGHT_ENABLED = false;

/** The evening session is part of the following Eastern trading date. */
export function chartOvernightTradingDate(at: number): string | null {
  if (!Number.isFinite(at)) return null;
  const { date, minute } = easternClock(at);
  if (minute >= 240 && minute < 1200) return null;
  const tradingDate = new Date(date + "T12:00:00Z");
  if (minute >= 1200) tradingDate.setUTCDate(tradingDate.getUTCDate() + 1);
  const weekday = tradingDate.getUTCDay();
  return weekday >= 1 && weekday <= 5 ? tradingDate.toISOString().slice(0, 10) : null;
}

export function chartShowsOvernight(preferences: Pick<ChartPreferences, "overnight" | "premarket" | "postmarket">): boolean {
  return CHART_OVERNIGHT_ENABLED && (preferences.overnight ?? (preferences.premarket && preferences.postmarket));
}
