const NEW_YORK = "America/New_York";
const FIRST_RESULT_FOLLOW_UP_SECONDS = 30 * 60;

function dateParts(date: string): readonly [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(date);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
    ? [year, month, day]
    : null;
}

function offsetMinutesAt(year: number, month: number, day: number, hour: number): number | null {
  const approximate = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  const part = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    timeZone: NEW_YORK,
    timeZoneName: "shortOffset",
  }).formatToParts(approximate).find((item) => item.type === "timeZoneName")?.value;
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/u.exec(part ?? "");
  if (!match) return null;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? "0");
  return match[1] === "+" ? minutes : -minutes;
}

function newYorkWallTimeToEpochSeconds(
  year: number,
  month: number,
  day: number,
  hour: number,
): number | null {
  const offsetMinutes = offsetMinutesAt(year, month, day, hour);
  return offsetMinutes === null
    ? null
    : Math.floor((Date.UTC(year, month - 1, day, hour) - offsetMinutes * 60_000) / 1000);
}

export type NewYorkExtendedSession = Readonly<{
  endTime: number;
  startTime: number;
}>;

/** The approved 4:00 AM through 8:00 PM New York extended-hours session. */
export function newYorkExtendedSession(date: string): NewYorkExtendedSession | null {
  const parts = dateParts(date);
  if (!parts) return null;
  const [year, month, day] = parts;
  const startTime = newYorkWallTimeToEpochSeconds(year, month, day, 4);
  const endTime = newYorkWallTimeToEpochSeconds(year, month, day, 20);
  return startTime !== null && endTime !== null && endTime > startTime
    ? Object.freeze({ startTime, endTime })
    : null;
}

export function availableSessionEnd(
  session: NewYorkExtendedSession,
  now: Date,
): number | null {
  const currentMinute = Math.floor(now.getTime() / 60_000) * 60;
  if (currentMinute < session.startTime) return null;
  return Math.min(currentMinute, session.endTime);
}

/**
 * The Analyzer consumes one-minute candles, so its first-result clock starts
 * at the beginning of the final execution's containing minute. Seconds never
 * move the readiness boundary into the following candle.
 */
export function dailyTradeFirstResultAt(finalExitAtUtc: string): Date | null {
  const finalExitMilliseconds = Date.parse(finalExitAtUtc);
  if (!Number.isFinite(finalExitMilliseconds)) return null;
  const finalExitMinuteSeconds = Math.floor(finalExitMilliseconds / 60_000) * 60;
  return new Date((finalExitMinuteSeconds + FIRST_RESULT_FOLLOW_UP_SECONDS) * 1000);
}

export function dailyTradeFirstResultCoverageEnd(
  session: NewYorkExtendedSession,
  finalExitAtUtc: string,
): number | null {
  const readyAt = dailyTradeFirstResultAt(finalExitAtUtc);
  return readyAt === null
    ? null
    : Math.min(session.endTime, Math.floor(readyAt.getTime() / 1000));
}

/**
 * Moomoo can revise same-day one-minute bars after extended trading closes.
 * Reconcile once at 04:15 New York time the following morning, well after the
 * 20:00 session end, without polling during the night.
 */
export function postSessionReconciliationAt(
  session: NewYorkExtendedSession,
): Date {
  return new Date((session.endTime + (8 * 60 + 15) * 60) * 1000);
}
