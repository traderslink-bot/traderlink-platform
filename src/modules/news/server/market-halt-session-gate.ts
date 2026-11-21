import { CoachUsEquitiesReviewCalendarService } from "../../coach/server/market-calendar/coach-us-equities-review-calendar-service";
import type { MarketHaltDetectionSettings } from "./market-halt-detection-settings";

const calendar = new CoachUsEquitiesReviewCalendarService();
const clock = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export function haltEasternClock(at: number): { date: string; minute: number } {
  const parts = Object.fromEntries(clock.formatToParts(at).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minute: Number(parts.hour) * 60 + Number(parts.minute) };
}
/** Both methods use the same verified calendar; unavailable coverage is closed. */
export function marketHaltWindowOpen(settings: MarketHaltDetectionSettings, at: number): boolean {
  if (!settings.enabled || !Number.isFinite(at)) return false;
  try {
    const current = haltEasternClock(at), day = calendar.session(current.date);
    if (day.state !== "open" || !day.postMarketEndEastern) return false;
    const end = Number(day.postMarketEndEastern.slice(0, 2)) * 60 + Number(day.postMarketEndEastern.slice(3));
    return current.minute >= 240 && current.minute < end;
  } catch { return false; }
}
export type HaltGateEvent = Readonly<{ haltDateEt: string; haltTimeEt: string }>;
export function marketHaltEventAllowed(event: HaltGateEvent, settings: MarketHaltDetectionSettings, at: number): boolean {
  if (!marketHaltWindowOpen(settings, at)) return false;
  try {
    const legacy = /^(\d{2})\/(\d{2})\/(\d{4})$/u.exec(event.haltDateEt);
    const date = legacy ? `${legacy[3]}-${legacy[1]}-${legacy[2]}` : event.haltDateEt;
    const time = /^(\d{2}):([0-5]\d):([0-5]\d)(?:\.(\d{1,3}))?$/u.exec(event.haltTimeEt);
    if (!time || Number(time[1]) > 23 || date !== haltEasternClock(at).date) return false;
    const minute = Number(time[1]) * 60 + Number(time[2]);
    const day = calendar.session(date);
    const end = day.postMarketEndEastern;
    if (day.state !== "open" || !end || minute < 240 || minute >= Number(end.slice(0, 2)) * 60 + Number(end.slice(3))) return false;
    const utc = Date.parse(calendar.easternWallClockAtUtc(date, time[1] + ":" + time[2]))
      + Number(time[3]) * 1000 + Number((time[4] ?? "0").padEnd(3, "0"));
    return utc <= at + 30_000;
  } catch { return false; }
}
export function marketHaltDeliveryAllowed(
  event: HaltGateEvent, createdAt: string, settings: MarketHaltDetectionSettings, at: number,
): boolean {
  const created = Date.parse(createdAt);
  return marketHaltEventAllowed(event, settings, at) && Number.isFinite(created)
    && created >= settings.updatedAt && created <= at && at - created < 120_000;
}
