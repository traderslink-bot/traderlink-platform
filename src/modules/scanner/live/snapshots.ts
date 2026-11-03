import type { NormalizedSnapshot, ScannerSession } from "./contracts";
import { easternClock } from "./sessions";

export const SNAPSHOT_BATCH_SIZE = 400;
export const SNAPSHOT_MAX_AGE_MS = 30_000;
export type SnapshotQualification = Readonly<{
  /** Only set after live tests establish the provider timestamp belongs to this session's fields. */
  sessionTimestampVerified: boolean;
  /** In particular, ordinary volume/turnover session inclusion is not yet qualified. */
  sessionCountersVerified: boolean;
  afterHoursRegularCloseVerified: boolean;
  priceTimeBasis?: "provider" | "session_observation";
  sessionWindow?: Readonly<{ startMinute: number; endMinute: number }>;
  sessionEvidence?: Readonly<{ symbol: string; providerAt: number; receivedAt: number;
    price: number; volume: number; dollarVolume: number; qualified: boolean }>;
}>;

/** The Nov 2 production Web API probe qualified regular-session fields only.
 * Extended-session fields must not inherit that evidence from a regular quote.
 */
export function qualifiedMoomooSnapshotSession(session: ScannerSession): SnapshotQualification {
  return { sessionTimestampVerified: session === "regular", sessionCountersVerified: session === "regular",
    afterHoursRegularCloseVerified: false };
}
type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue => Boolean(value && typeof value === "object" && !Array.isArray(value));
const positive = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
const counter = (value: unknown, integer = false): number | null => typeof value === "number" && Number.isFinite(value) && value >= 0
  && (!integer || Number.isSafeInteger(value)) ? value : null;

export function snapshotBatches(symbols: readonly string[]): readonly (readonly string[])[] {
  if (symbols.length === 0 || symbols.length > 4000 || new Set(symbols).size !== symbols.length
    || symbols.some(symbol => !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol))) throw Error("scanner_snapshot_symbols_invalid");
  const batches: string[][] = [];
  for (let index = 0; index < symbols.length; index += SNAPSHOT_BATCH_SIZE) batches.push(symbols.slice(index,index+SNAPSHOT_BATCH_SIZE));
  return batches;
}

export function normalizeSnapshotBatch(input: Readonly<{
  requestedSymbols: readonly string[]; payload: unknown; session: ScannerSession;
  tradingDate: string; receivedAt: number; qualification: SnapshotQualification;
}>): Readonly<{ snapshots: readonly NormalizedSnapshot[]; missingSymbols: readonly string[]; issues: readonly string[] }> {
  const requested = new Set(input.requestedSymbols);
  if (requested.size === 0 || requested.size > SNAPSHOT_BATCH_SIZE || requested.size !== input.requestedSymbols.length
    || [...requested].some(symbol => !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol))) throw Error("scanner_snapshot_symbols_invalid");
  if (!object(input.payload) || input.payload.ret_code !== 0 || !object(input.payload.data)
    || !Array.isArray(input.payload.data.snapshot_list) || input.payload.data.snapshot_list.length > SNAPSHOT_BATCH_SIZE) {
    throw Error("scanner_snapshot_response_invalid");
  }
  const snapshots: NormalizedSnapshot[] = [];
  const seen = new Set<string>(), duplicates = new Set<string>(), issues = new Set<string>();
  for (const value of input.payload.data.snapshot_list) {
    if (!object(value) || typeof value.code !== "string" || !value.code.startsWith("US.")) { issues.add("invalid_row"); continue; }
    const symbol = value.code.slice(3);
    if (!requested.has(symbol)) { issues.add("unexpected_symbol"); continue; }
    if (seen.has(symbol)) { duplicates.add(symbol); issues.add("duplicate_symbol"); continue; }
    seen.add(symbol);
    const providerAt = value.update_time;
    const observedSession = input.session === "after_hours" && input.qualification.priceTimeBasis === "session_observation"
      && input.qualification.sessionTimestampVerified && input.qualification.sessionCountersVerified;
    if (value.data_date !== input.tradingDate || typeof providerAt !== "number" || !Number.isSafeInteger(providerAt)
      || providerAt <= 0 || providerAt > input.receivedAt + 2000
      || (observedSession ? easternClock(providerAt).date !== input.tradingDate : input.receivedAt-providerAt > SNAPSHOT_MAX_AGE_MS)) {
      issues.add("stale_or_invalid_provider_time"); continue;
    }
    if (!input.qualification.sessionTimestampVerified) { issues.add("session_timestamp_unverified"); continue; }
    if (input.qualification.sessionWindow) {
      const clock = easternClock(observedSession ? input.receivedAt : providerAt), window = input.qualification.sessionWindow;
      if (clock.date !== input.tradingDate || clock.minute < window.startMinute || clock.minute >= window.endMinute) {
        issues.add("provider_time_outside_session"); continue;
      }
    }
    const prefix = input.session === "premarket" ? "pre" : input.session === "after_hours" ? "after" : null;
    const price = positive(value[prefix ? `${prefix}_price` : "last_price"]);
    if (price === null) { issues.add("session_price_unavailable"); continue; }
    // Preserve the all-day baseline. The separate post-market ranking uses
    // today's regular last_price, which remains separate from after_price.
    const baseline = positive(value.prev_close_price);
    if (baseline === null) issues.add("session_baseline_unavailable");
    if (!input.qualification.sessionCountersVerified) issues.add("session_counters_unverified");
    const bid = positive(value.bid_price), ask = positive(value.ask_price);
    const usableBook = bid !== null && ask !== null && ask >= bid;
    const highFields = input.session === "premarket" ? ["pre_high_price"]
      : input.session === "regular" ? ["pre_high_price","high_price"]
      : ["pre_high_price","high_price","after_high_price"];
    const lowFields = input.session === "premarket" ? ["pre_low_price"]
      : input.session === "regular" ? ["pre_low_price","low_price"]
      : ["pre_low_price","low_price","after_low_price"];
    const dayHigh = Math.max(price,...highFields.map(field => positive(value[field]) ?? 0));
    const availableLows = lowFields.map(field => positive(value[field])).filter((item): item is number => item !== null);
    const dayLow = Math.min(price,...availableLows);
    snapshots.push({ symbol, company: typeof value.name === "string" ? value.name.slice(0,200) : symbol,
      session: input.session, tradingDate: input.tradingDate, providerAt, receivedAt: input.receivedAt, price, baseline,
      ...(observedSession ? { priceTimeBasis: "session_observation" as const } : {}),
      ...(input.session === "after_hours" ? { regularClosePrice: positive(value.last_price) } : {}),
      premarketHigh:positive(value.pre_high_price),premarketVolume:counter(value.pre_volume,true),
      volume: input.qualification.sessionCountersVerified ? counter(value[prefix ? `${prefix}_volume` : "volume"],true) : null,
      dollarVolume: input.qualification.sessionCountersVerified ? counter(value[prefix ? `${prefix}_turnover` : "turnover"]) : null,
      bid: usableBook ? bid : null, ask: usableBook ? ask : null,
      marketCap: positive(value.total_market_val), dayHigh, dayLow, providerVolumeRatio: positive(value.volume_ratio) });
  }
  const accepted = snapshots.filter(row => !duplicates.has(row.symbol));
  const covered = new Set(accepted.map(row => row.symbol));
  return { snapshots: accepted, missingSymbols: input.requestedSymbols.filter(symbol => !covered.has(symbol)), issues: [...issues].sort() };
}
