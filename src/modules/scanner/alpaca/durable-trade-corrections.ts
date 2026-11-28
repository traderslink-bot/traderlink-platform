import { chartSymbol, easternDayStart, type Candle } from "./candles";
import { parseChartCorrection, parseStoredChartCorrection, type StoredChartCorrection } from "./chart-correction";


export type TradeCorrectionRange = { symbol: string; start: number; end: number; daily?: true; replayDaily?: true };
export type NativeDailyTradeWitness = { day: number; before: Candle; bar: Candle | null };
export type DurableTradeCorrections = {
  symbol: string; feed: "sip"; adjustment: "raw"; generation: number; rows: StoredChartCorrection[]; nativeDays?: NativeDailyTradeWitness[];
};
export const MAX_DURABLE_CORRECTION_ROWS = 4_096;

export function parseTradeCorrectionRange(query: URLSearchParams, now: number): TradeCorrectionRange {
  const daily=query.get("daily")==="1", replayDaily=daily&&query.get("dailyReplay")==="1";
  if (query.size !== 3+Number(daily)+Number(replayDaily) || ["symbol","start","end"].some(key => query.getAll(key).length !== 1))
    throw Error("invalid_trade_correction_range");
  const symbol = chartSymbol(query.get("symbol")!);
  const start = Number(query.get("start")), end = Number(query.get("end"));
  if (![start,end].every(Number.isSafeInteger) || start <= 0 || end <= start ||
      end - start > 3_660 * 86_400_000 || end > now + 60_000) throw Error("invalid_trade_correction_range");
  return { symbol, start, end, ...(daily?{daily:true as const}:{}), ...(replayDaily?{replayDaily:true as const}:{}) };
}

export function parseDurableTradeCorrections(value: unknown, range: TradeCorrectionRange): DurableTradeCorrections {
  const input = value as DurableTradeCorrections | null;
  if (!input || input.symbol !== range.symbol || input.feed !== "sip" || input.adjustment !== "raw" ||
      !Number.isSafeInteger(input.generation) || input.generation < 0 ||
      !Array.isArray(input.rows) || input.rows.length > MAX_DURABLE_CORRECTION_ROWS) throw Error("invalid_trade_correction_evidence");
  let previousMinute = 0, previousRevision = 0;
  const rows = input.rows.map(source => {
    const row = parseStoredChartCorrection(source), revision = row.correctionRevision;
    if (row.symbol !== range.symbol || row.minute * 1000 < range.start || row.minute * 1000 >= range.end ||
        revision === undefined || revision > input.generation || row.minute < previousMinute ||
        row.minute === previousMinute && revision <= previousRevision) throw Error("invalid_trade_correction_evidence");
    previousMinute = row.minute; previousRevision = revision;
    return row;
  });
  if (input.nativeDays!==undefined && (!range.daily || !Array.isArray(input.nativeDays) || input.nativeDays.length>64))
    throw Error("invalid_trade_correction_evidence");
  const days=input.nativeDays?.map(({day,before,bar})=>{
    if (before?.time!==day || day!==easternDayStart(day) ||
      !rows.some(row=>day===easternDayStart(row.minute))) throw Error("invalid_trade_correction_evidence");
    const normalize=(bar:Candle|null)=>parseChartCorrection({symbol:range.symbol,minute:day,bar}).bar;
    return {day,before:normalize(before)!,bar:normalize(bar)};
  });
  return { symbol: input.symbol, feed: "sip", adjustment: "raw", generation: input.generation, rows,
    ...(days?{nativeDays:days}:{}) };
}

function sameRawBar(first: Candle, second: Candle | null | undefined) {
  return second && first.time === second.time && first.open === second.open && first.high === second.high &&
    first.low === second.low && first.close === second.close && first.volume === second.volume;
}

/** Require a matching emitted raw native minute. A symbol alone never admits replacement. */
export function projectComparableRawMinutes(bars: readonly Candle[], evidence: DurableTradeCorrections): Candle[] {
  if (!evidence.rows.length) return [...bars];
  const byMinute = new Map<number, StoredChartCorrection[]>();
  for (const row of evidence.rows) {
    const revisions = byMinute.get(row.minute) ?? [];
    revisions.push(row);
    byMinute.set(row.minute,revisions);
  }
  return bars.flatMap(bar => {
    const revisions = byMinute.get(bar.time);
    if (!revisions?.some(row => sameRawBar(bar,row.bar) || sameRawBar(bar,row.before))) return [bar];
    const replacement = revisions.at(-1)!.bar;
    return replacement ? [replacement] : [];
  });
}

/** Build a provider-native aggregate only from its own verified minute coverage. */
export async function projectComparableRawInterval(bar: Candle, interval: number, evidence: DurableTradeCorrections,
  readMinutes: (start: number, end: number) => Promise<readonly Candle[] | null>, now = Date.now()): Promise<Candle | null | undefined> {
  const start = bar.time * 1000, end = start + interval * 1000;
  if (!evidence.rows.some(row=>row.minute * 1000 >= start && row.minute * 1000 < end)) return bar;
  if (end > now) return undefined;
  const minutes = await readMinutes(start,end);
  if (!minutes || minutes.some(minute=>minute.time * 1000 < start || minute.time * 1000 >= end)) return undefined;
  const sum = (rows: readonly Candle[]): Candle | null => {
    const first = rows[0];
    if (!first) return null;
    return rows.reduce((total, row)=>({...total, high:Math.max(total.high,row.high),
      low:Math.min(total.low,row.low),close:row.close,volume:total.volume+row.volume}),
      {...first,time:bar.time,volume:0});
  };
  const source = sum(minutes), next = sum(projectComparableRawMinutes(minutes,evidence));
  if (sameRawBar(bar,next)) return bar;
  return sameRawBar(bar,source) ? next : undefined;
}


export function projectComparableRawDaily(bars: readonly Candle[], evidence: DurableTradeCorrections): Candle[] {
  const days = new Map(evidence.nativeDays?.map(proof=>[proof.day,proof]));
  return bars.flatMap(bar=>{
    const proof=days.get(bar.time);
    if (!proof || !sameRawBar(bar,proof.before) && !sameRawBar(bar,proof.bar)) return [bar];
    return proof.bar?[proof.bar]:[];
  });
}
