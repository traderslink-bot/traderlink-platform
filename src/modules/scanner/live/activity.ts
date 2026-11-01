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
function exactDelta(current: number | null, earlier: NormalizedSnapshot | null, field: "volume" | "dollarVolume", boundary: number): number | null {
  const prior = earlier?.[field] ?? null;
  return current !== null && prior !== null && earlier?.providerAt === boundary && current >= prior ? current-prior : null;
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
    const minuteVolume = exactDelta(current.volume,one,"volume",current.providerAt-60_000);
    const minuteDollars = exactDelta(current.dollarVolume,one,"dollarVolume",current.providerAt-60_000);
    const precedingRate = one && six ? rate(one.volume,six.volume,one.providerAt-six.providerAt) : null;
    const fiveMinuteVolume = five?.providerAt === current.providerAt-300_000
      && current.volume !== null && five.volume !== null && current.volume >= five.volume
      ? current.volume-five.volume : null;
    const precedingFiveMinuteVolume = five?.providerAt === current.providerAt-300_000
      && ten?.providerAt === current.providerAt-600_000
      && five.volume !== null && ten.volume !== null && five.volume >= ten.volume
      ? five.volume-ten.volume : null;
    return {
      oneMinuteGain: one ? (current.price/one.price-1)*100 : null,
      fiveMinuteGain: five ? (current.price/five.price-1)*100 : null,
      oneMinuteVolume: minuteVolume, oneMinuteDollarVolume: minuteDollars,
      fiveMinuteVolume,
      fiveMinuteVolumeSpike: fiveMinuteVolume !== null && precedingFiveMinuteVolume !== null && precedingFiveMinuteVolume > 0
        ? fiveMinuteVolume/precedingFiveMinuteVolume : null,
      // A zero historical baseline is unavailable, not infinite relative activity.
      volumeAcceleration: minuteVolume !== null && precedingRate !== null && precedingRate > 0 ? minuteVolume/precedingRate : null,
    };
  }
  retain(symbols: readonly string[]): void {
    const retained = new Set(symbols);
    for (const symbol of this.rows.keys()) if (!retained.has(symbol)) this.rows.delete(symbol);
  }
  clear(): void { this.rows.clear(); }
}
