export const CHART_TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D"] as const;
export type ChartTimeframe = typeof CHART_TIMEFRAMES[number];
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

export function chartSymbol(value: string): string {
  const symbol = value.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)) throw Error("invalid_symbol");
  return symbol;
}

export function chartTimeframe(value: string): ChartTimeframe {
  if (!CHART_TIMEFRAMES.includes(value as ChartTimeframe)) throw Error("invalid_timeframe");
  return value as ChartTimeframe;
}

export function alpacaCandle(value: unknown): Candle | null {
  if (!value || typeof value !== "object") return null;
  const bar = value as Record<string, unknown>;
  const time = typeof bar.t === "string" ? Date.parse(bar.t) / 1000 : NaN;
  const values = [bar.o, bar.h, bar.l, bar.c, bar.v];
  if (!Number.isFinite(time) || !values.every(value => typeof value === "number" && Number.isFinite(value) && value >= 0)) return null;
  const [open, high, low, close, volume] = values as number[];
  if (low > Math.min(open, close) || high < Math.max(open, close) || low > high) return null;
  return { time: Math.floor(time), open, high, low, close, volume };
}

const easternParts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

/** Keep real UTC timestamps while anchoring four-hour boundaries to Eastern wall time. */
export function candleBucket(time: number, timeframe: ChartTimeframe): number {
  if (timeframe === "1D") return time;
  if (timeframe === "4h") {
    const parts = Object.fromEntries(easternParts.formatToParts(new Date(time * 1000)).map(part => [part.type, part.value]));
    const wall = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) / 1000;
    const boundary = Date.UTC(+parts.year, +parts.month - 1, +parts.day, Math.floor(+parts.hour / 4) * 4) / 1000;
    return boundary - (wall - time);
  }
  const seconds = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600 }[timeframe];
  return Math.floor(time / seconds) * seconds;
}

export function aggregateCandles(input: Iterable<Candle>, timeframe: ChartTimeframe): Candle[] {
  const unique = new Map<number, Candle>();
  for (const bar of input) unique.set(bar.time, bar);
  const buckets = new Map<number, Candle>();
  for (const bar of [...unique.values()].sort((a, b) => a.time - b.time)) {
    const time = candleBucket(bar.time, timeframe);
    const previous = buckets.get(time);
    buckets.set(time, previous ? { ...previous, high: Math.max(previous.high, bar.high), low: Math.min(previous.low, bar.low), close: bar.close, volume: previous.volume + bar.volume } : { ...bar, time });
  }
  return [...buckets.values()];
}

export type DisplayCandle = Candle & { carried: boolean };

/** Chart-only placeholders. Never pass these points to analytics or provider storage. */
export function displayCandles(input: readonly Candle[], timeframe: ChartTimeframe, through?: number): DisplayCandle[] {
  const result: DisplayCandle[] = [];
  const step = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1D": 0 }[timeframe];
  const session = (time: number) => {
    const parts = Object.fromEntries(easternParts.formatToParts(new Date(time * 1000)).map(part => [part.type, part.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: +parts.hour };
  };
  for (const bar of input) {
    const previous = result.at(-1);
    if (previous && step) {
      const currentSession = session(bar.time);
      // Preserve gaps within an observed trading day; do not invent overnight/weekend sessions.
      if (session(previous.time).date === currentSession.date) {
        for (let time = previous.time + step; time < bar.time; time += step) {
          const slot = session(time);
          if (slot.hour < 4 || slot.hour >= 20) continue;
          result.push({ time, open: previous.close, high: previous.close, low: previous.close, close: previous.close, volume: 0, carried: true });
        }
      }
    }
    result.push({ ...bar, carried: false });
  }
  const last = result.at(-1);
  if (last && step && through && session(last.time).date === session(through).date) {
    for (let time = last.time + step; time <= through; time += step) {
      const slot = session(time);
      if (slot.hour < 4 || slot.hour >= 20) continue;
      result.push({time,open:last.close,high:last.close,low:last.close,close:last.close,volume:0,carried:true});
    }
  }
  return result;
}


/** New York midnight, preserving UTC timestamps across both DST transitions. */
export function easternDayStart(time:number):number {
  const target=Object.fromEntries(easternParts.formatToParts(new Date(time*1000)).map(part=>[part.type,part.value]));
  const midnight=Date.UTC(+target.year,+target.month-1,+target.day)/1000;
  let guess=midnight;
  for(let pass=0;pass<3;pass++){
    const parts=Object.fromEntries(easternParts.formatToParts(new Date(guess*1000)).map(part=>[part.type,part.value]));
    const wall=Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute,+parts.second)/1000;
    guess+=midnight-wall;
  }
  return guess;
}
