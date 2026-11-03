import type { ScannerSession } from "./contracts";
import { activeSession, type MarketDay } from "./sessions";
import type { SnapshotQualification } from "./snapshots";

export type SnapshotQualificationContext = Readonly<{ payload: unknown; requestedSymbols: readonly string[];
  receivedAt: number; tradingDate: string; day: MarketDay }>;
const minutes = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));

/**
 * A successful snapshot response is a current observation made at receivedAt.
 * Moomoo's update_time is the last trade clock and may remain unchanged for a
 * thin stock; it is provenance, not a freshness gate for the response.
 */
export class SnapshotSessionQualifier {
  observe(session: ScannerSession, input: SnapshotQualificationContext): SnapshotQualification {
    const startMinute = session === "premarket" ? 4 * 60 : session === "regular" ? 9 * 60 + 30 : minutes(input.day.regularCloseEastern);
    const endMinute = session === "premarket" ? 9 * 60 + 30 : session === "regular"
      ? minutes(input.day.regularCloseEastern) : minutes(input.day.extendedCloseEastern);
    const active = input.day.date === input.tradingDate && activeSession(input.day,input.receivedAt) === session;
    return { sessionTimestampVerified: active, sessionCountersVerified: active,
      afterHoursRegularCloseVerified: false, priceTimeBasis: "session_observation",
      sessionWindow: { startMinute,endMinute } };
  }
}
