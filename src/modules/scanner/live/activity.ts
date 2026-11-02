import type { NormalizedSnapshot, RollingActivity } from "./contracts";
import { SNAPSHOT_MAX_AGE_MS } from "./snapshots";

const EMPTY: RollingActivity = { oneMinuteGain: null, fiveMinuteGain: null,
  oneMinuteVolume: null, oneMinuteDollarVolume: null, fiveMinuteVolume: null,
  fiveMinuteVolumeSpike: null, volumeAcceleration: null };
const CURRENT_RECEIPT_MAX_AGE_MS = 15_000;
function anchor(rows: readonly NormalizedSnapshot[], at: number): NormalizedSnapshot | null {
  // Use an observed value at/before the boundary, never fabricate an interpolated candle.
  for (let index = rows.length-1; index >= 0; index--) {
    if (rows[index].receivedAt <= at) return at-rows[index].receivedAt <= 10_000 ? rows[index] : null;
  }
  return null;
}
function rate(current: number | null, earlier: number | null, milliseconds: number): number | null {
  return current !== null && earlier !== null && current >= earlier && milliseconds > 0 ? (current-earlier)*60_000/milliseconds : null;
}
function observedDelta(current: number | null, earlier: NormalizedSnapshot | null, field: "volume" | "dollarVolume"): number | null {
  const prior = earlier?.[field] ?? null;
  return current !== null && prior !== null && current >= prior ? current-prior : null;
}

/** Session-local snapshots, not one-minute OHLC candles or time-of-day RVOL. */
export class RollingActivityBook {
  private rows = new Map<string, NormalizedSnapshot[]>();
  observe(snapshot: NormalizedSnapshot): boolean {
    if (!Number.isFinite(snapshot.price) || snapshot.price <= 0 || !Number.isSafeInteger(snapshot.providerAt)
      || snapshot.providerAt <= 0 || !Number.isSafeInteger(snapshot.receivedAt) || snapshot.receivedAt <= 0) throw Error("scanner_activity_snapshot_invalid");
    if (!this.rows.has(snapshot.symbol) && this.rows.size >= 4000) throw Error("scanner_activity_population_limit");
    let history = this.rows.get(snapshot.symbol) ?? [];
    const last = history.at(-1);
    if (last && (last.tradingDate !== snapshot.tradingDate || last.session !== snapshot.session)) history = [];
    else if (last) {
      if (last.priceTimeBasis !== snapshot.priceTimeBasis) history = [];
      else {
        if (snapshot.receivedAt < last.receivedAt) return false;
        if (snapshot.providerAt < last.providerAt) return false;
        if (snapshot.receivedAt === last.receivedAt) {
          if (snapshot.providerAt !== last.providerAt || snapshot.price !== last.price
            || snapshot.volume !== last.volume || snapshot.dollarVolume !== last.dollarVolume) {
            this.rows.delete(snapshot.symbol); return false;
          }
          return true;
        }
        // Moomoo's last-price clock can stand still while cumulative volume grows.
        // Receipt time orders real observations; unchanged counters add zero activity.
        if (snapshot.priceTimeBasis !== "session_observation" && snapshot.providerAt === last.providerAt && snapshot.price !== last.price) {
          this.rows.delete(snapshot.symbol); return false;
        }
        // A missed scan does not invalidate two genuine window endpoints.
        // Keep history; anchor() independently withholds any comparison whose
        // boundary lacks an observation. Never interpolate across the gap.
        if (snapshot.volume !== null && last.volume !== null && snapshot.volume < last.volume
          || snapshot.dollarVolume !== null && last.dollarVolume !== null && snapshot.dollarVolume < last.dollarVolume) history = [];
      }
    }
    history.push(snapshot);
    this.rows.set(snapshot.symbol, history.filter(row => row.receivedAt >= snapshot.receivedAt-670_000).slice(-240));
    return true;
  }
  metrics(symbol: string, now: number): RollingActivity {
    const history = this.rows.get(symbol), current = history?.at(-1);
    if (!history || !current || now-current.receivedAt > CURRENT_RECEIPT_MAX_AGE_MS || now < current.receivedAt
      || current.priceTimeBasis !== "session_observation" && now-current.providerAt > SNAPSHOT_MAX_AGE_MS
      || now < current.providerAt) return { ...EMPTY };
    const one = anchor(history,current.receivedAt-60_000), five = anchor(history,current.receivedAt-300_000),
      six = anchor(history,current.receivedAt-360_000), ten = anchor(history,current.receivedAt-600_000);
    // Receipt milliseconds are not synchronized to exact window boundaries. The
    // bounded anchor supplies an observed 60–70s / 300–310s span; do not require
    // a millisecond-perfect hit, interpolate, or manufacture an OHLC candle.
    const minuteVolume = observedDelta(current.volume,one,"volume");
    const minuteDollars = observedDelta(current.dollarVolume,one,"dollarVolume");
    const currentRate = one ? rate(current.volume,one.volume,current.receivedAt-one.receivedAt) : null;
    const precedingRate = one && six ? rate(one.volume,six.volume,one.receivedAt-six.receivedAt) : null;
    const fiveMinuteVolume = observedDelta(current.volume,five,"volume");
    const precedingFiveMinuteVolume = five ? observedDelta(five.volume,ten,"volume") : null;
    const fiveRate = five ? rate(current.volume,five.volume,current.receivedAt-five.receivedAt) : null;
    const precedingFiveRate = five && ten ? rate(five.volume,ten.volume,five.receivedAt-ten.receivedAt) : null;
    return {
      oneMinuteGain: one ? (current.price/one.price-1)*100 : null,
      fiveMinuteGain: five ? (current.price/five.price-1)*100 : null,
      oneMinuteVolume: minuteVolume, oneMinuteDollarVolume: minuteDollars,
      fiveMinuteVolume,
      fiveMinuteVolumeSpike: fiveMinuteVolume !== null && precedingFiveMinuteVolume !== null && precedingFiveMinuteVolume > 0
        && fiveRate !== null && precedingFiveRate !== null && precedingFiveRate > 0 ? fiveRate/precedingFiveRate : null,
      // A zero historical baseline is unavailable, not infinite relative activity.
      volumeAcceleration: currentRate !== null && precedingRate !== null && precedingRate > 0 ? currentRate/precedingRate : null,
    };
  }
  retain(symbols: readonly string[]): void {
    const retained = new Set(symbols);
    for (const symbol of this.rows.keys()) if (!retained.has(symbol)) this.rows.delete(symbol);
  }
  clear(): void { this.rows.clear(); }
}
