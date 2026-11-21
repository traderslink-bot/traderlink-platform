import "server-only";
import { requestAlpacaGateway } from "../../scanner/alpaca/client";
import type { AlpacaTradingStatus } from "../../scanner/alpaca/trading-status";
import { fetchOfficialMarketHalts, type MarketHalt, type MarketHaltSourceStatus, type OfficialMarketHalts } from "./market-halt-feed";
import { marketHaltEventAllowed, haltEasternClock, marketHaltWindowOpen } from "./market-halt-session-gate";
import type { MarketHaltDetectionSettings } from "./market-halt-detection-settings";

export const ALPACA_HALT_SOURCE_URL = "https://docs.alpaca.markets/docs/real-time-stock-pricing-data#trading-statuses";
const nasdaqReasons: Record<string, string> = { T1: "News pending", T2: "News released", T5: "Single-stock trading pause", T6: "Extraordinary market activity", T12: "Nasdaq requested additional information", LUDP: "Volatility trading pause", LUDS: "Volatility trading pause — straddle condition", M: "Volatility trading pause" };
const nyseReasons: Record<string, string> = { P: "News pending", D: "News released", A: "Additional information requested", M: "Volatility trading pause" };
const haltTime = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3, hourCycle: "h23" });
const seconds = (value: string) => value.slice(0, 8);
export type SelectedMarketHalts = OfficialMarketHalts & { detectedBy: "official" | "alpaca"; resumed: readonly { ticker: string; haltDateEt: string; haltTimeEt: string; resumedAtUtc: string }[] };

/** Exchange venue remains in the legacy event column; detectedBy/sourceUrl identify the actual detector. */
export function normalizeAlpacaHaltStatuses(
  value: unknown, settings: MarketHaltDetectionSettings, now: number, environment: NodeJS.ProcessEnv = process.env,
): Pick<SelectedMarketHalts, "halts" | "resumed"> {
  const data = value as { feed?: unknown; connected?: unknown; statusesSubscribed?: unknown; statuses?: unknown; events?: unknown } | null;
  if (!data || data.feed !== "sip" || data.connected !== true || data.statusesSubscribed !== true || !Array.isArray(data.statuses) || data.statuses.length > 40_000) throw Error("halt_status_unavailable");
  const halts: MarketHalt[] = [], resumed: SelectedMarketHalts["resumed"][number][] = [];
  const seen = new Set<string>();
  for (const raw of data.statuses) {
    const status = raw as AlpacaTradingStatus | null;
    if (!status || typeof status.symbol !== "string" || !/^[A-Z0-9.-]{1,4}$/u.test(status.symbol)
      || typeof status.halted !== "boolean" || typeof status.haltedAt !== "string" || typeof status.observedAt !== "string") continue;
    const started = Date.parse(status.haltedAt), observed = Date.parse(status.observedAt);
    if (!Number.isFinite(started) || !Number.isFinite(observed) || observed < started || observed > now + 2000 || started > now) continue;
    const venue = status.tape === "C" || status.tape === "O" ? "nasdaq" : status.tape === "A" || status.tape === "B" ? "nyse" : null;
    if (!venue) continue;
    if (status.halted && (venue === "nasdaq" ? !["H", "P", "Q"].includes(status.statusCode) : status.statusCode !== "2")) continue;
    const key = `${status.symbol}:${status.haltedAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const event = { ticker: status.symbol, haltDateEt: haltEasternClock(started).date, haltTimeEt: haltTime.format(started) };
    if (!marketHaltEventAllowed(event, settings, now)) continue;
    if (!status.halted) {
      const resumedAt = Date.parse(status.tradeResumedAt ?? "");
      if (Number.isFinite(resumedAt) && resumedAt >= started && resumedAt <= now) resumed.push({ ...event, resumedAtUtc: new Date(resumedAt).toISOString() });
      continue;
    }
    if (typeof status.reasonCode !== "string" || !Object.hasOwn(venue === "nasdaq" ? nasdaqReasons : nyseReasons, status.reasonCode)) continue;
    const reason = venue === "nasdaq" ? nasdaqReasons[status.reasonCode] : nyseReasons[status.reasonCode];
    if (!reason || venue === "nasdaq" && status.reasonCode === "T1" && seconds(event.haltTimeEt) === "07:50:00" && environment.TRADERLINK_INCLUDE_NASDAQ_0750_T1_HALTS !== "true") continue;
    halts.push({ ...event, issueName: status.symbol, market: venue === "nasdaq" ? "NASDAQ" : "NYSE", source: venue,
      reasonCode: status.reasonCode, reasonDescription: reason,
      resumptionQuoteTimeEt: null, resumptionTradeTimeEt: null, detectedBy: "alpaca" });
  }
  return { halts, resumed };
}
/** Schedules annotate a matching pause; exchange-only rows never create an Alpaca halt. */
export function enrichHaltSchedules(halts: readonly MarketHalt[], schedules: readonly MarketHalt[]): readonly MarketHalt[] {
  return halts.map(halt => {
    const matches = schedules.filter(row => row.ticker === halt.ticker && row.source === halt.source
      && row.haltDateEt === halt.haltDateEt && seconds(row.haltTimeEt) === seconds(halt.haltTimeEt));
    if (matches.length !== 1) return halt;
    const valid = (time: string | null) => time && /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?$/u.test(time) && seconds(time) >= seconds(halt.haltTimeEt) ? time : null;
    return { ...halt, resumptionQuoteTimeEt: valid(matches[0].resumptionQuoteTimeEt), resumptionTradeTimeEt: valid(matches[0].resumptionTradeTimeEt) };
  });
}
type ScheduleSnapshot = { started: number; retrieved: number; value?: OfficialMarketHalts; pending?: Promise<void> };
const scheduleSnapshots = new WeakMap<() => Promise<OfficialMarketHalts>, ScheduleSnapshot>();
/** A slow exchange schedule never holds up the primary detector for its full HTTP deadline. */
async function resumeSchedules(loader: () => Promise<OfficialMarketHalts>, waitMs: number): Promise<readonly MarketHalt[]> {
  let state = scheduleSnapshots.get(loader);
  if (!state) { state = { started: Number.NEGATIVE_INFINITY, retrieved: 0 }; scheduleSnapshots.set(loader, state); }
  const current = state;
  if (!current.pending && Date.now() - current.started >= 60_000) {
    current.started = Date.now();
    current.pending = Promise.resolve().then(loader).then(value => {
      if (value.sources.some(source => source.available)) { current.value = value; current.retrieved = Date.now(); }
    }).catch(() => {}).finally(() => { current.pending = undefined; });
  }
  if ((!current.value || Date.now() - current.retrieved >= 120_000) && current.pending) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { await Promise.race([current.pending, new Promise<void>(resolve => { timer = setTimeout(resolve, waitMs); })]); }
    finally { clearTimeout(timer); }
  }
  return current.value && Date.now() - current.retrieved < 120_000 ? current.value.halts : [];
}
export async function fetchSelectedMarketHalts(
  settings: MarketHaltDetectionSettings, now = Date.now(),
  dependencies: { official: () => Promise<OfficialMarketHalts>; gateway: () => Promise<unknown>; scheduleWaitMs?: number } = { official: fetchOfficialMarketHalts, gateway: () => requestAlpacaGateway("halts", new URLSearchParams(), process.env, AbortSignal.timeout(2500)) },
): Promise<SelectedMarketHalts> {
  if (!marketHaltWindowOpen(settings, now)) return { halts: [], resumed: [], detectedBy: settings.source, sources: [] };
  if (settings.source === "official") {
    const data = await dependencies.official();
    return { ...data, halts: data.halts.filter(row => marketHaltEventAllowed(row, settings, now)), detectedBy: "official", resumed: [] };
  }
  let normalized: ReturnType<typeof normalizeAlpacaHaltStatuses>;
  try { normalized = normalizeAlpacaHaltStatuses(await dependencies.gateway(), settings, now); }
  catch { return { halts: [], resumed: [], detectedBy: "alpaca", sources: [{ source: "alpaca", available: false, httpStatus: null }] }; }
  const schedules = await resumeSchedules(dependencies.official, Math.max(0, Math.min(1000, dependencies.scheduleWaitMs ?? 1000)));
  return { ...normalized, halts: enrichHaltSchedules(normalized.halts, schedules), detectedBy: "alpaca",
    sources: [{ source: "alpaca", available: true, httpStatus: null } satisfies MarketHaltSourceStatus] };
}
