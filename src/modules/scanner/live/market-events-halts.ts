import { easternClockSeconds } from "./active-halts";
import type { ScannerActiveHalt } from "./contracts";
import { easternClock } from "./sessions";

const HOUR_MS = 60 * 60 * 1000;
const EMPTY = { rows: [], nextExpiryAt: null } as const;

function clockMilliseconds(value: string | null): number {
  const match = value?.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d+))?)?$/u);
  if (!match) return Number.NaN;
  const [, hours, minutes, seconds = "0", fraction = ""] = match;
  return (Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)) * 1000
    + Number(fraction.slice(0, 3).padEnd(3, "0"));
}

/** Limit the alert's display window independently of the symbol's actual halt status. */
export function selectMarketEventsHalts(
  candidates: readonly ScannerActiveHalt[],
  tradingDate: string | undefined,
  now: number,
  sessionClosed = false,
): Readonly<{ rows: readonly ScannerActiveHalt[]; nextExpiryAt: number | null }> {
  if (!candidates.length || !tradingDate || sessionClosed) return EMPTY;
  const { date, minute } = easternClock(now);
  if (date !== tradingDate || minute < 4 * 60 || minute >= 20 * 60) return EMPTY;

  // The Eastern offset is constant throughout the scanner's trading window.
  const dayStart = now - (easternClockSeconds(new Date(now)) * 1000 + now % 1000);
  const sessionClose = dayStart + 20 * HOUR_MS;
  const rows: ScannerActiveHalt[] = [];
  let nextExpiryAt = sessionClose;
  for (const halt of candidates) {
    const haltedAt = halt.haltedAtUtc
      ? Date.parse(halt.haltedAtUtc)
      : dayStart + clockMilliseconds(halt.haltTimeEt);
    if (halt.halted === false || !Number.isFinite(haltedAt) || haltedAt < dayStart || haltedAt > now) continue;

    const tradeResume = dayStart + clockMilliseconds(halt.tradeTimeEt);
    let expiry = Math.min(haltedAt + HOUR_MS, sessionClose);
    // A schedule entry may have only second precision. Ignore resume times from an earlier halt.
    if (tradeResume >= Math.floor(haltedAt / 1000) * 1000) expiry = Math.min(expiry, tradeResume);
    if (now >= expiry) continue;
    rows.push(halt);
    nextExpiryAt = Math.min(nextExpiryAt, expiry);
  }
  return rows.length ? { rows, nextExpiryAt } : EMPTY;
}
