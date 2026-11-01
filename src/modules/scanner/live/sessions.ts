import type { ScannerSession } from "./contracts";

export type MarketDay = Readonly<{
  date: string; verified: boolean; open: boolean; regularCloseEastern: "13:00" | "16:00";
  extendedCloseEastern: "17:00" | "20:00";
}>;
const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export function easternClock(now: number): Readonly<{ date: string; minute: number }> {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(now)).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minute: Number(parts.hour)*60+Number(parts.minute) };
}
const minutes = (clock: string) => Number(clock.slice(0,2))*60+Number(clock.slice(3,5));
/** The caller supplies a verified official calendar day; weekends/holidays never default open. */
export function activeSession(day: MarketDay, now: number): ScannerSession | null {
  const current = easternClock(now);
  if (!day.verified || !day.open || current.date !== day.date || !["13:00","16:00"].includes(day.regularCloseEastern)
    || (day.regularCloseEastern === "13:00" ? day.extendedCloseEastern !== "17:00" : day.extendedCloseEastern !== "20:00")) return null;
  if (current.minute < 4*60 || current.minute >= minutes(day.extendedCloseEastern)) return null;
  if (current.minute < 9*60+30) return "premarket";
  return current.minute < minutes(day.regularCloseEastern) ? "regular" : "after_hours";
}
