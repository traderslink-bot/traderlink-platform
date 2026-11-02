import type { NormalizedSnapshot, RollingActivity } from "./contracts";

const EMPTY: RollingActivity = { oneMinuteGain: null, fiveMinuteGain: null,
  oneMinuteVolume: null, oneMinuteDollarVolume: null, fiveMinuteVolume: null,
  fiveMinuteVolumeSpike: null, volumeAcceleration: null };
const GAP_LIMIT = 15_000;
function anchor(rows: readonly NormalizedSnapshot[], at: number): NormalizedSnapshot | null {
  // Use an observed value at/before the boundary, never fabricate an interpolated candle.
  for (let index = rows.length-1; index >= 0; index--) {
    if (rows[index].providerAt <= at) return at-rows[index].providerAt <= 10_000 ? rows[index] : null;
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
      || snapshot.providerAt <= 0 || !Number.isSafeInteger(snapshot.receivedAt)) throw Error("scanner_activity_snapshot_invalid");
    if (!this.rows.has(snapshot.symbol) && this.rows.size >= 4000) throw Error("scanner_activity_population_limit");
    let history = this.rows.get(snapshot.symbol) ?? [];
    const last = history.at(-1);
    if (last && (last.tradingDate !== snapshot.tradingDate || last.session !== snapshot.session)) history = [];
    else if (last) {
      if (snapshot.providerAt < last.providerAt) return false;
      if (snapshot.providerAt === last.providerAt) {
        // Re-fetching identical data is not a new observation. Conflicting values
        // without a new provider time cannot supply reliable rolling evidence.
        if (snapshot.price !== last.price || snapshot.volume !== last.volume || snapshot.dollarVolume !== last.dollarVolume) {
          this.rows.delete(snapshot.symbol); return false;
        }
        return true;
      }
      if (snapshot.providerAt-last.providerAt > GAP_LIMIT
        || snapshot.volume !== null && last.volume !== null && snapshot.volume < last.volume
        || snapshot.dollarVolume !== null && last.dollarVolume !== null && snapshot.dollarVolume < last.dollarVolume) history = [];
    }
    history.push(snapshot);
    this.rows.set(snapshot.symbol, history.filter(row => row.providerAt >= snapshot.providerAt-670_000).slice(-240));
    return true;
  }
  metrics(symbol: string, now: number): RollingActivity {
    const history = this.rows.get(symbol), current = history?.at(-1);
    if (!history || !current || now-current.providerAt > GAP_LIMIT || now < current.providerAt) return { ...EMPTY };
    const one = anchor(history,current.providerAt-60_000), five = anchor(history,current.providerAt-300_000),
      six = anchor(history,current.providerAt-360_000), ten = anchor(history,current.providerAt-600_000);
    // Provider milliseconds are not synchronized to our polling loop. The
    // bounded anchor supplies an observed 60–70s / 300–310s span; do not require
    // a millisecond-perfect hit, interpolate, or manufacture an OHLC candle.
    const minuteVolume = observedDelta(current.volume,one,"volume");
    const minuteDollars = observedDelta(current.dollarVolume,one,"dollarVolume");
    const currentRate = one ? rate(current.volume,one.volume,current.providerAt-one.providerAt) : null;
    const precedingRate = one && six ? rate(one.volume,six.volume,one.providerAt-six.providerAt) : null;
    const fiveMinuteVolume = observedDelta(current.volume,five,"volume");
    const precedingFiveMinuteVolume = five ? observedDelta(five.volume,ten,"volume") : null;
    const fiveRate = five ? rate(current.volume,five.volume,current.providerAt-five.providerAt) : null;
    const precedingFiveRate = five && ten ? rate(five.volume,ten.volume,five.providerAt-ten.providerAt) : null;
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
