import type { ScannerSession } from "./contracts";
import { activeSession, easternClock, type MarketDay } from "./sessions";
import { qualifiedMoomooSnapshotSession, type SnapshotQualification } from "./snapshots";

export type SnapshotQualificationContext = Readonly<{ payload: unknown; requestedSymbols: readonly string[];
  receivedAt: number; tradingDate: string; day: MarketDay }>;
type Evidence = NonNullable<SnapshotQualification["sessionEvidence"]>;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const minutes = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));

/** Qualifies extended-session fields from existing live responses, without extra requests. */
export class SnapshotSessionQualifier {
  private context: string | null = null;
  private previous = new Map<string, Evidence>();
  private witness: Evidence | undefined;

  observe(session: ScannerSession, input: SnapshotQualificationContext): SnapshotQualification {
    // Premarket remains unqualified until its own live evidence is captured.
    if (session !== "after_hours") return qualifiedMoomooSnapshotSession(session);
    const context = `${input.tradingDate}:${session}`;
    if (this.context !== context) { this.context = context; this.previous.clear(); this.witness = undefined; }
    const window = { startMinute: minutes(input.day.regularCloseEastern), endMinute: minutes(input.day.extendedCloseEastern) };
    const result = (): SnapshotQualification => ({ sessionTimestampVerified: !!this.witness?.qualified,
      sessionCountersVerified: !!this.witness?.qualified, afterHoursRegularCloseVerified: false,
      priceTimeBasis: "session_observation",
      sessionWindow: window, ...(this.witness ? { sessionEvidence: this.witness } : {}) });
    if (activeSession(input.day, input.receivedAt) !== session || input.day.date !== input.tradingDate) {
      return { ...result(), sessionTimestampVerified: false, sessionCountersVerified: false };
    }
    const payload = input.payload;
    if (!object(payload) || payload.ret_code !== 0 || !object(payload.data) || !Array.isArray(payload.data.snapshot_list)) return result();
    const prefix = "after", requested = new Set(input.requestedSymbols);
    const list = payload.data.snapshot_list;
    if (requested.size === 0 || requested.size !== input.requestedSymbols.length || requested.size > 400 || list.length > 400) return result();
    const occurrences = new Map<string, number>();
    for (const value of list) if (object(value) && typeof value.code === "string") occurrences.set(value.code, (occurrences.get(value.code) ?? 0) + 1);
    for (const value of list) {
      if (!object(value) || typeof value.code !== "string" || !value.code.startsWith("US.") || occurrences.get(value.code) !== 1) continue;
      const symbol = value.code.slice(3), providerAt = value.update_time, price = value[`${prefix}_price`],
        volume = value[`${prefix}_volume`], dollarVolume = value[`${prefix}_turnover`];
      if (!requested.has(symbol) || !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol) || value.data_date !== input.tradingDate
        || !Number.isSafeInteger(providerAt) || !positive(providerAt) || providerAt > input.receivedAt
        || !positive(price) || !Number.isSafeInteger(volume)
        || !positive(volume) || !positive(dollarVolume)) continue;
      const clock = easternClock(providerAt);
      // A real regular-close clock is retained as provenance, not passed off as
      // the after-hours price time. Advancing session counters supply live evidence.
      if (clock.date !== input.tradingDate || clock.minute >= window.endMinute) continue;
      const previous = this.previous.get(symbol);
      const qualified = !!previous && input.receivedAt > previous.receivedAt
        && input.receivedAt - previous.receivedAt <= 30000 && providerAt >= previous.providerAt
        && volume > previous.volume && dollarVolume > previous.dollarVolume;
      const evidence = { symbol, providerAt, receivedAt: input.receivedAt, price, volume, dollarVolume, qualified };
      if (this.previous.size < 4000 || this.previous.has(symbol)) this.previous.set(symbol, evidence);
      if (!this.witness?.qualified || qualified) this.witness = evidence;
    }
    return result();
  }
}
