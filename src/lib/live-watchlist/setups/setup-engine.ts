import { advanceIndicator } from "../indicators/indicator-engine";
import type { IndicatorCandle, IndicatorResult } from "../indicators/indicator-engine";
import { indicatorMarketDate, indicatorTradingDay } from "../indicators/indicator-sessions";
import type { IndicatorTradingDay } from "../indicators/indicator-sessions";
import type { InitialWatchlistSetupKind, WatchlistSetupMemberInstance, WatchlistSetupMemberSnapshot, WatchlistSetupReference, WatchlistSetupSettings } from "./setup-contracts";
import type { SetupFrameInput, SetupTransition, WatchlistSetupInput } from "./setup-input";
import { setupVolumeEvidence } from "./setup-volume";

export const WATCHLIST_SETUP_RULES_VERSION = "watchlist-setups-a-v2" as const;
const MINUTE = 60_000;
type Point = Readonly<{ bar: IndicatorCandle; result: IndicatorResult; priorAtr: number | null }>;
type Pivot = Readonly<{ side: "high" | "low"; price: number; at: number; recognized: number; atr: number }>;
type Impulse = { id: string; base: number; peak: number; peakAt: number; lost: number; at: number };
type Candidate = {
  kind: InitialWatchlistSetupKind; id: string; parent: string; cycle: number; start: number;
  state: "forming" | "confirmed" | "failed" | "expired"; low: number; originalLow: number;
  a1: number; a5: number; epsilon: number; deadline: number; sessionEnd: number;
  reference: number; referenceAt: number; responseHigh: number | null; responseAt: number | null;
  confirmedAt: number | null; trigger: number | null; lossCount: number; lastLossEnd: number | null;
  falling: number; slopeAt: number | null; reclaimAt: number | null; anchor: "day" | "regular-session" | null;
  coverageLost: boolean; lowAt: number; pullbackBaseline: readonly IndicatorCandle[] | null;
  initialReference: number; groupTrigger: number; recentEndedAt: number | null; terminalAt: number | null;
  testAverage: { value: number; at: number } | null;
  vwapLossCount: number;
  view: WatchlistSetupMemberInstance;
};
export type WatchlistSetupEvaluation = Readonly<{
  rulesVersion: typeof WATCHLIST_SETUP_RULES_VERSION;
  inputRevision: string;
  snapshot: WatchlistSetupMemberSnapshot;
  instances: readonly WatchlistSetupMemberInstance[];
  transitions: readonly SetupTransition[];
  diagnostics: readonly string[];
}>;

function points(frame: SetupFrameInput | null, duration: number, through: number): Point[] {
  if (!frame) return [];
  if (frame.provider !== "moomoo" || !frame.adjustment || !frame.seriesKey || frame.candles.length > 2048
    || frame.seed.seriesKey !== frame.seriesKey || frame.seed.timeframe !== (duration === MINUTE ? "1m" : "5m")) {
    throw Error("setup_incompatible_shared_series");
  }
  let checkpoint = structuredClone(frame.seed);
  return frame.candles.map(bar => {
    if (bar.end - bar.start !== duration || bar.start < (checkpoint.last?.end ?? 0)) throw Error("setup_invalid_candle_order");
    const priorAtr = checkpoint.wilder.changes >= 14 ? checkpoint.wilder.trueRange : null;
    const next = advanceIndicator(checkpoint, bar, through);
    checkpoint = next.checkpoint;
    return { bar, result: next.result, priorAtr };
  });
}

function observation(value: number, observedAt: number, knownAt: number) {
  return { value, observedAt, knownAt };
}
function ref(role: WatchlistSetupReference["role"], value: number, at: number, knownAt: number,
  frame: "1m" | "5m", anchor?: "day" | "regular-session"): WatchlistSetupReference {
  return { role, observation: observation(value, at, knownAt), frame, ...(anchor ? { vwapAnchor: anchor } : {}) };
}

/** Recognize only pivots whose later response is already observed. */
function recognizePivots(series: readonly Point[], index: number, seen: Set<string>): Pivot[] {
  const found: Pivot[] = [], current = series[index];
  for (let j = Math.max(1, index - 60); j < index; j++) {
    const pivot = series[j], atr = pivot.priorAtr;
    if (!atr || atr <= 0 || pivot.bar.sessionKey !== current.bar.sessionKey) continue;
    for (const side of ["high", "low"] as const) {
      const price = pivot.bar[side], key = `${side}:${pivot.bar.start}`;
      if (seen.has(key) || series[j - 1].bar[side] === price) continue;
      let end = j;
      while (end + 1 <= index && series[end + 1].bar[side] === price) end++;
      if (end - j >= 3 || end >= index) continue;
      const before = series[j - 1].bar, after = series[end + 1].bar;
      if (before.end !== pivot.bar.start || series[end].bar.end !== after.start) continue;
      const isExtreme = side === "high" ? before.high < price && after.high < price : before.low > price && after.low > price;
      if (!isExtreme) continue;
      const following = series.slice(end + 1, index + 1);
      if (following.some((point, offset) => point.bar.sessionKey !== pivot.bar.sessionKey
        || point.bar.start !== (offset ? following[offset - 1].bar.end : series[end].bar.end))) continue;
      const preserved = following.every(point => side === "high" ? point.bar.high < price : point.bar.low > price);
      const response = side === "high" ? current.bar.close <= price - 0.5 * atr : current.bar.close >= price + 0.5 * atr;
      if (preserved && response) {
        seen.add(key); found.push({ side, price, at: pivot.bar.start, recognized: current.bar.end, atr });
      }
    }
  }
  return found.sort((a, b) => a.at - b.at);
}

/** At most twelve bars per span, using only their preceding volatility/range. */
function latestImpulse(series: readonly Point[], index: number, notBefore: number): Impulse | null {
  const end = series[index];
  for (let span = 1; span <= 12; span++) {
    const start = index - span + 1;
    if (start < 5) continue;
    const first = series[start], atr = first.priorAtr;
    if (!atr || atr <= 0 || first.bar.start < notBefore) continue;
    const window = series.slice(start, index + 1), earlier = series.slice(start - 5, start);
    if (window.some((point, offset) => offset > 0 && point.bar.start !== window[offset - 1].bar.end)) continue;
    if (end.bar.close - first.bar.open < 3 * atr
      || end.bar.close <= Math.max(...earlier.map(point => point.bar.high)) + 0.1 * atr) continue;
    const peak = Math.max(...window.map(point => point.bar.high));
    return { id: `impulse:${end.bar.end}`, at: end.bar.end, base: Math.min(...earlier.map(point => point.bar.low)),
      peak, peakAt: window.filter(point => point.bar.high === peak).at(-1)!.bar.start, lost: 0 };
  }
  return null;
}

function ema(point: Point | undefined, period: 9 | 20): number | null {
  return point ? period === 9 ? point.result.ema9 : point.result.ema20 : null;
}
function emaSlope(five: readonly Point[], index: number, period: 9 | 20): number | null {
  const current = ema(five[index], period), earlier = ema(five[index - 3], period), atr = five[index]?.result.atr14;
  return current !== null && earlier !== null && atr && atr > 0 ? (current - earlier) / atr : null;
}

function observedAverageDecline(one: readonly Point[], five: readonly Point[], index: number, cycle: number, period: 9 | 20): boolean {
  const leg = one.slice(0, index + 1).filter(point => point.bar.start >= cycle);
  if (leg.length < 2 || leg[0].bar.start !== cycle || leg.some((point, offset) => offset > 0
    && (point.bar.start !== leg[offset - 1].bar.end || point.bar.sessionKey !== leg[offset - 1].bar.sessionKey))) return false;
  return leg.slice(0, -1).some(point => {
    let known: Point | undefined;
    for (const item of five) { if (item.bar.end > point.bar.end) break; known = item; }
    const average = ema(known, period);
    return average !== null && point.bar.close > average;
  });
}

function sessionOf(day: IndicatorTradingDay, at: number) {
  return at < day.regularOpen ? { name: "premarket" as const, end: day.regularOpen }
    : at < day.regularClose ? { name: "regular" as const, end: day.regularClose }
      : { name: "postmarket" as const, end: day.postClose };
}

function vwapValues(series: readonly Point[], day: IndicatorTradingDay, index: number, anchor: "day" | "regular-session"): number | null {
  const start = anchor === "day" ? day.preOpen : day.regularOpen;
  if (series[index].bar.start < start) return null;
  const bars = series.slice(0, index + 1).map(point => point.bar).filter(bar => bar.start >= start);
  let last = start, shares = 0, turnover = 0;
  for (const bar of bars) {
    if (bar.start !== last || bar.volume === null) return null;
    shares += bar.volume; turnover += (bar.high + bar.low + bar.close) / 3 * bar.volume; last = bar.end;
  }
  return shares > 0 ? turnover / shares : null;
}

/**
 * Bounded chronological calculation over already accepted Moomoo evidence.
 * It never fetches, publishes, changes settings or calls AI. Historic discoveries
 * retain receipt time and are not a mechanism for sending catch-up alerts.
 */
export function evaluateWatchlistSetups(input: WatchlistSetupInput, settings: WatchlistSetupSettings): WatchlistSetupEvaluation {
  if (!/^[A-Z][A-Z0-9.-]{0,15}$/u.test(input.symbol) || !input.publicationIdentity
    || !Number.isSafeInteger(input.receivedAt) || input.receivedAt <= 0) throw Error("setup_invalid_input_identity");
  const diagnostics = new Set<string>();
  const accepted = (frame: SetupFrameInput | null, duration: number): Point[] => {
    try { return points(frame, duration, input.receivedAt); }
    catch { diagnostics.add(duration === MINUTE ? "minute_series_invalid" : "five_minute_series_invalid"); return []; }
  };
  const one = accepted(input.oneMinute, MINUTE);
  let five = accepted(input.fiveMinute, 5 * MINUTE);
  if (input.oneMinute && input.fiveMinute && input.oneMinute.adjustment !== input.fiveMinute.adjustment) {
    diagnostics.add("five_minute_adjustment_mismatch"); five = [];
  }
  const transitions: SetupTransition[] = [], candidates: Candidate[] = [], pivots: Pivot[] = [];
  const seen = new Set<string>(), seenCandidates = new Set<string>();
  const enabled = new Set(settings.enabledDetectors);
  let context: Impulse | null = null, contextFloor = 0, fiveIndex = -1;
  let minuteContext: Impulse | null = null, minuteContextFloor = 0;
  let latestVwap: number | null = null;
  let belowCount = 0, belowSession = "", belowLow = Infinity, risingCount = 0;
  const move = (candidate: Candidate, state: SetupTransition["state"], at: number, reason: string) => {
    if (state !== "reclaimed") candidate.state = state;
    if (state === "failed" || state === "expired") candidate.terminalAt = at;
    transitions.push({ instanceId: candidate.id, state, candleCompletedAt: at, knownAt: input.receivedAt, reason });
  };
  for (let index = 0; index < one.length; index++) {
    const point = one[index], bar = point.bar, previous = one[index - 1]?.bar;
    const day = indicatorTradingDay(input.calendar, indicatorMarketDate(bar.start));
    if (!day || bar.start < day.preOpen || bar.end > day.postClose) continue;
    while (fiveIndex + 1 < five.length && five[fiveIndex + 1].bar.end <= bar.end) fiveIndex++;
    let startFive = fiveIndex;
    while (startFive >= 0 && five[startFive].bar.end > bar.start) startFive--;
    // A forming native 5m candle is not missing data. The last completed
    // boundary, however, must be present at both the test and decision time.
    const freshFive = five[startFive]?.bar.end === Math.floor(bar.start / (5 * MINUTE)) * 5 * MINUTE
      && five[fiveIndex]?.bar.end === Math.floor(bar.end / (5 * MINUTE)) * 5 * MINUTE;
    const a1 = point.priorAtr, a5 = five[startFive]?.result.atr14;
    const contiguous = Boolean(previous && previous.end === bar.start && previous.sessionKey === bar.sessionKey);
    const session = sessionOf(day, bar.start);
    const recognized = recognizePivots(one, index, seen);
    pivots.push(...recognized);
    pivots.sort((left, right) => left.at - right.at);
    const recentHigh = pivots.filter(pivot => pivot.side === "high" && pivot.at < bar.start && pivot.at >= bar.start - 60 * MINUTE).at(-1);
    const earlierPeak = context ? { price: context.peak, at: context.peakAt } : null;
    let lostParent: string | null = null;
    let lostMinuteParent: string | null = null;
    if (minuteContext) {
      minuteContext.lost = a1 && bar.close < minuteContext.base - 0.1 * a1 ? contiguous ? minuteContext.lost + 1 : 1 : 0;
      if (minuteContext.lost >= 2) { lostMinuteParent = minuteContext.id; minuteContextFloor = bar.end; minuteContext = null; }
      else if (bar.high > minuteContext.peak) { minuteContext.peak = bar.high; minuteContext.peakAt = bar.start; }
    }
    if (!minuteContext) minuteContext = latestImpulse(one, index, minuteContextFloor);
    if (context) {
      context.lost = a1 && bar.close < context.base - 0.1 * a1 ? contiguous ? context.lost + 1 : 1 : 0;
      if (context.lost >= 2) { lostParent = context.id; contextFloor = bar.end; context = null; }
      else if (bar.high > context.peak) { context.peak = bar.high; context.peakAt = bar.start; }
    }
    if (!context) context = latestImpulse(one, index, contextFloor)
      ?? (fiveIndex >= 0 ? latestImpulse(five, fiveIndex, contextFloor) : null);
    const cycle = recentHigh?.at ?? earlierPeak?.at ?? context?.peakAt ?? bar.start;
    const peak = recentHigh?.price ?? earlierPeak?.price ?? context?.peak ?? bar.high;
    const anchor = session.name === "regular" ? "regular-session" as const : "day" as const;
    const vwap = vwapValues(one, day, index, anchor);
    latestVwap = vwap;
    if (belowSession !== bar.sessionKey || !contiguous) { belowCount = 0; risingCount = 0; belowLow = Infinity; belowSession = bar.sessionKey; }
    const priorBelowCount = belowCount, priorBelowLow = belowLow;
    if (vwap !== null && bar.close < vwap) {
      belowCount = contiguous ? belowCount + 1 : 1;
      belowLow = Math.min(belowLow, bar.low);
      risingCount = contiguous && previous && bar.close > previous.close ? risingCount + 1 : 0;
    } else { belowCount = 0; risingCount = 0; belowLow = Infinity; }

    const make = (kind: InitialWatchlistSetupKind, low: number, reference: number, referenceAt: number, trigger: number | null,
      cycleAt = cycle, lowAt = bar.start, testAverage: Candidate["testAverage"] = null): Candidate | null => {
      const parent = kind === "higher-low-reversal" ? minuteContext : context;
      if (!parent || parent.at > bar.start || !a1 || a1 <= 0 || (kind !== "higher-low-reversal" && (!freshFive || !a5 || a5 <= 0))) return null;
      const previousAttempt = candidates.filter(candidate => candidate.kind === kind && candidate.parent === parent.id
        && candidate.cycle === cycleAt).at(-1);
      // A terminal attempt can rearm only on a newly observed test, not the old low.
      if (previousAttempt && (previousAttempt.terminalAt === null || lowAt < previousAttempt.terminalAt)) return null;
      const id = `${kind}:${bar.sessionKey}:${parent.id}:${cycleAt}:${previousAttempt?.terminalAt ?? 0}`;
      if (seenCandidates.has(id)) return null;
      seenCandidates.add(id);
      const candidate: Candidate = { kind, id, parent: parent.id, cycle: cycleAt, start: bar.end,
        state: "forming", low, originalLow: low, a1, a5: a5 ?? 0, epsilon: 0.1 * a1,
        deadline: Math.min(session.end, bar.end + (kind === "vwap-reclaim-hold" ? 15 : 30) * MINUTE), sessionEnd: session.end,
        reference, referenceAt, responseHigh: trigger, responseAt: trigger === null ? null : bar.end,
        confirmedAt: null, trigger: null, lossCount: 0, lastLossEnd: null, falling: 0, slopeAt: null, reclaimAt: null,
        anchor: kind === "vwap-reclaim-hold" ? anchor : null, coverageLost: false, lowAt,
        initialReference: testAverage?.value ?? reference, groupTrigger: trigger ?? reference, recentEndedAt: null, terminalAt: null, testAverage, vwapLossCount: 0,
        pullbackBaseline: trigger === null ? null : one.slice(0, index).map(item => item.bar)
          .filter(item => item.sessionKey === bar.sessionKey && item.start >= cycleAt).slice(-5),
        view: { id, kind, formationFrame: kind === "higher-low-reversal" ? "1m" : "5m", triggerFrame: "1m",
          priceState: "forming", availability: "ready", evaluatedThrough: bar.end, firstRecognizedAt: input.receivedAt,
          confirmedAt: null, deadlineAt: 0, recentlyConfirmedUntil: null, summary: "", pendingCondition: null,
          references: [], volume: setupVolumeEvidence(bar, one.slice(0, index).map(item => item.bar), input.receivedAt) } };
      candidates.push(candidate); move(candidate, "forming", bar.end, "price_response_observed"); return candidate;
    };

    if (settings.enabled && settings.sessions.includes(session.name) && (context || minuteContext) && a1 && a1 > 0) {
      for (const period of [9, 20] as const) {
        const kind = period === 9 ? "ema9-pullback-bounce" as const : "ema20-pullback-bounce" as const;
        const reference = ema(five[startFive], period), closeReference = ema(five[fiveIndex], period), slope = emaSlope(five, fiveIndex, period);
        if (!enabled.has(kind) || !a5 || reference === null || closeReference === null || slope === null || slope <= 0.05) continue;
        const test = bar.low <= reference + 0.25 * a5 && bar.high >= reference - 0.25 * a5;
        const response = bar.close - bar.low >= 0.5 * a1 && bar.close > closeReference;
        const recent = one.slice(Math.max(0, index - 4), index + 1);
        const coherent = recent.length === 5 && recent.every((item, offset) => item.bar.sessionKey === bar.sessionKey
          && (!offset || item.bar.start === recent[offset - 1].bar.end));
        const declines = recent.slice(1).map((item, offset) => recent[offset].bar.close - item.bar.close);
        const slowing = coherent && declines.every(change => change > 0) && declines[2] + declines[3] < declines[0] + declines[1];
        if (cycle < bar.start && peak - bar.low >= 0.5 * a5 && peak > reference && test && (response || slowing)
          && observedAverageDecline(one, five, index, cycle, period))
          make(kind, bar.low, closeReference, five[fiveIndex].bar.end, response ? bar.high : null, cycle, bar.start,
            { value: reference, at: five[startFive].bar.end });
      }
      const recoveredLow = recognized.find(pivot => pivot.side === "low");
      const earlierLow = recoveredLow && pivots.filter(pivot => pivot.side === "low" && pivot.at < recoveredLow.at).at(-1);
      const higherLow = recoveredLow && earlierLow && recoveredLow.price > earlierLow.price + 0.1 * a1;
      const crossed = vwap !== null && priorBelowCount >= 2 && contiguous && previous && bar.close > vwap + 0.1 * a1 && bar.close > previous.close + 0.1 * a1;
      const recovering = risingCount >= 2 && index >= 2 && bar.close - one[index - 2].bar.close > 0.1 * a1;
      if (enabled.has("vwap-reclaim-hold") && vwap !== null && a5
        && (crossed || belowCount >= 2 && (recovering || higherLow) && vwap - bar.close >= 0 && vwap - bar.close <= 0.25 * a5))
        {
          const low = crossed ? Math.min(priorBelowLow, bar.low) : belowLow;
          const lowBar = one.slice(0, index + 1).filter(item => item.bar.sessionKey === bar.sessionKey && item.bar.low === low).at(-1)?.bar;
          make("vwap-reclaim-hold", low, vwap, bar.end, null, cycle, lowBar?.start ?? bar.start);
        }
      if (enabled.has("higher-low-reversal")) {
        const lows = recognized.filter(pivot => pivot.side === "low");
        for (const l2 of lows) {
          const highs = pivots.filter(pivot => pivot.side === "high" && pivot.at < l2.at && pivot.at >= bar.start - 60 * MINUTE).reverse();
          for (const h1 of highs) {
            const l1 = pivots.filter(pivot => pivot.side === "low" && pivot.at < h1.at && l2.at - pivot.at > 2 * MINUTE && pivot.at >= bar.start - 60 * MINUTE).at(-1);
            const precedingHigh = l1 && pivots.filter(pivot => pivot.side === "high" && pivot.at < l1.at).at(-1);
            if (!l1 || !precedingHigh || precedingHigh.price - l1.price < l1.atr || h1.price - l1.price < l1.atr
              || l2.price <= l1.price + 0.1 * a1 || bar.close < l2.price + 0.5 * a1) continue;
            make("higher-low-reversal", l2.price, h1.price, h1.at, h1.price, h1.at, l2.at); break;
          }
        }
      }
    }

    for (const candidate of candidates) {
      if (candidate.state === "failed" || candidate.state === "expired" || bar.end < candidate.start) continue;
      if (!contiguous && previous && bar.start >= candidate.start && bar.start < candidate.sessionEnd) candidate.coverageLost = true;
      if (bar.start >= candidate.sessionEnd || (candidate.state === "forming" && bar.end > candidate.deadline)
        || (candidate.confirmedAt !== null && bar.end > candidate.confirmedAt + 60 * MINUTE)) {
        // Keep the logical deadline separately. The recorded observation cannot
        // be backdated before the candle that established this terminal state.
        move(candidate, "expired", bar.end, "observation_window_ended");
        candidate.view = { ...candidate.view, priceState: "expired", pendingCondition: null }; continue;
      }
      if (candidate.coverageLost) { candidate.view = { ...candidate.view, availability: "unavailable" }; continue; }
      if (candidate.kind === "vwap-reclaim-hold" && candidate.confirmedAt !== null && candidate.anchor === anchor && vwap !== null)
        candidate.vwapLossCount = bar.close < vwap ? contiguous ? candidate.vwapLossCount + 1 : 1 : 0;
      if (candidate.confirmedAt !== null && candidate.recentEndedAt === null
        && (bar.end >= candidate.confirmedAt + 2 * MINUTE
          || candidate.trigger !== null && bar.close > candidate.trigger + (candidate.a5 || candidate.a1))) candidate.recentEndedAt = bar.end;
      const loss = bar.close < candidate.originalLow - candidate.epsilon;
      candidate.lossCount = loss ? candidate.lastLossEnd === bar.start ? candidate.lossCount + 1 : 1 : 0;
      candidate.lastLossEnd = loss ? bar.end : null;
      const parentLost = candidate.kind === "higher-low-reversal" ? candidate.parent === lostMinuteParent || minuteContext === null
        : candidate.parent === lostParent || context === null;
      if (candidate.lossCount >= 2 || (parentLost && bar.end > candidate.start)) {
        move(candidate, "failed", bar.end, candidate.lossCount >= 2 ? "defended_low_lost" : "momentum_base_lost");
      } else if (candidate.state === "forming" && candidate.lossCount === 0) {
        if (candidate.kind === "vwap-reclaim-hold") {
          if (vwap !== null && candidate.anchor === anchor) {
            candidate.reference = vwap; candidate.referenceAt = bar.end;
            if (candidate.reclaimAt === null && previous && bar.close > vwap + candidate.epsilon && bar.close > previous.close + candidate.epsilon) {
              candidate.pullbackBaseline = one.slice(0, index).map(item => item.bar).filter(item => item.sessionKey === bar.sessionKey
                && item.start >= candidate.cycle && item.end <= candidate.lowAt + MINUTE).slice(-5);
              candidate.reclaimAt = bar.end; candidate.trigger = vwap;
              candidate.deadline = Math.min(candidate.sessionEnd, bar.end + 5 * MINUTE);
              move(candidate, "reclaimed", bar.end, "reclaimed_hold_pending");
            } else if (candidate.reclaimAt !== null && bar.end > candidate.reclaimAt && contiguous && bar.close > vwap) {
              candidate.confirmedAt = bar.end; move(candidate, "confirmed", bar.end, "later_vwap_hold_observed");
            }
          }
        } else if (candidate.kind === "higher-low-reversal") {
          if (bar.close > candidate.reference + candidate.epsilon) {
            candidate.trigger = candidate.reference; candidate.confirmedAt = bar.end;
            move(candidate, "confirmed", bar.end, "intervening_high_cleared");
          }
        } else {
          if (!freshFive) {
            candidate.view = { ...candidate.view, availability: "unavailable", evaluatedThrough: bar.end };
            continue;
          }
          const period = candidate.kind === "ema9-pullback-bounce" ? 9 : 20;
          const value = ema(five[fiveIndex], period), slope = emaSlope(five, fiveIndex, period);
          const fiveAt = five[fiveIndex]?.bar.end ?? null;
          if (fiveAt !== candidate.slopeAt) { candidate.slopeAt = fiveAt; candidate.falling = slope !== null && slope < 0 ? candidate.falling + 1 : 0; }
          if (candidate.falling >= 2) move(candidate, "expired", bar.end, "average_context_changed");
          else if (value !== null) {
            candidate.reference = value; candidate.referenceAt = five[fiveIndex].bar.end;
            if (bar.low < candidate.low) {
              candidate.low = bar.low; candidate.responseHigh = null; candidate.responseAt = null; candidate.pullbackBaseline = null;
            }
            if (candidate.responseHigh === null && bar.close >= candidate.low + 0.5 * candidate.a1
              && bar.close > value && slope !== null && slope > 0.05) {
              candidate.responseHigh = bar.high; candidate.responseAt = bar.end;
              candidate.pullbackBaseline = one.slice(0, index).map(item => item.bar).filter(item => item.sessionKey === bar.sessionKey && item.start >= candidate.cycle).slice(-5);
            }
            if (candidate.responseHigh !== null && candidate.responseAt !== null && bar.end > candidate.responseAt
              && bar.close > candidate.responseHigh + candidate.epsilon && slope !== null && slope > 0.05) {
              candidate.trigger = candidate.responseHigh; candidate.confirmedAt = bar.end;
              move(candidate, "confirmed", bar.end, "response_high_cleared");
            }
          }
        }
      }
      const isVwap = candidate.kind === "vwap-reclaim-hold", isHigherLow = candidate.kind === "higher-low-reversal";
      const role = isVwap ? "vwap" : isHigherLow ? "rebound-high" : candidate.kind === "ema9-pullback-bounce" ? "ema9" : "ema20";
      const currentState = (candidate as Candidate).state;
      const summary = currentState === "failed" ? "The defended pullback low was lost on completed candles."
        : currentState === "expired" ? "This setup's observation window has ended."
        : currentState === "confirmed" ? isVwap ? candidate.vwapLossCount >= 2
          ? "VWAP reclaim later lost; the earlier confirmation remains recorded." : "Price reclaimed VWAP and a later candle held above it."
          : isHigherLow ? "Price cleared the rebound high after a higher-low response." : "Price cleared the response high after testing the rising average."
        : isVwap ? candidate.reclaimAt ? "VWAP reclaimed; a later hold is pending." : "Price is recovering toward VWAP."
          : isHigherLow ? "A higher low has responded; the rebound-high break is pending." : "Price responded near the rising average; the response-high break is pending.";
      const references: WatchlistSetupReference[] = [ref(role, candidate.reference, candidate.referenceAt, input.receivedAt, isHigherLow || isVwap ? "1m" : "5m", candidate.anchor ?? undefined),
        ref("test-low", candidate.originalLow, candidate.lowAt, input.receivedAt, "1m")];
      if (candidate.testAverage) references.push(ref("test-average", candidate.testAverage.value, candidate.testAverage.at, input.receivedAt, "5m"));
      if (candidate.trigger !== null || candidate.responseHigh !== null) references.push(ref("trigger", candidate.trigger ?? candidate.responseHigh!,
        isHigherLow ? candidate.referenceAt : candidate.responseAt ?? candidate.reclaimAt ?? candidate.start, input.receivedAt, "1m"));
      const volumeBarIndex = candidate.confirmedAt === null ? index : one.findIndex(item => item.bar.end === candidate.confirmedAt);
      const volumePoint = one[Math.max(volumeBarIndex, 0)];
      const reclaimIndex = candidate.reclaimAt === null ? -1 : one.findIndex(item => item.bar.end === candidate.reclaimAt);
      candidate.view = { ...candidate.view, availability: "ready", priceState: candidate.state, evaluatedThrough: bar.end,
        confirmedAt: candidate.confirmedAt, deadlineAt: candidate.deadline,
        recentlyConfirmedUntil: candidate.confirmedAt === null ? null : Math.min(candidate.sessionEnd, candidate.recentEndedAt ?? candidate.confirmedAt + 2 * MINUTE),
        summary, pendingCondition: candidate.state !== "forming" ? null : isVwap ? candidate.reclaimAt !== null
          ? "A later completed candle holding above VWAP is pending." : "A completed reclaim above VWAP is pending."
          : isHigherLow ? "A completed 1min close above the rebound high is pending."
            : candidate.responseHigh === null ? "A recovery above the moving average is pending." : "A later completed 1min close above the response high is pending.", references,
        volume: setupVolumeEvidence(volumePoint.bar, one.slice(0, Math.max(volumeBarIndex, 0)).map(item => item.bar), input.receivedAt),
        ...(reclaimIndex >= 0 ? { reclaimVolume: setupVolumeEvidence(one[reclaimIndex].bar, one.slice(0, reclaimIndex).map(item => item.bar), input.receivedAt) } : {}),
        ...(candidate.pullbackBaseline ? { pullbackVolume: { ...setupVolumeEvidence(volumePoint.bar, candidate.pullbackBaseline, input.receivedAt), basis: "pullback-minute-average" as const } } : {}) };
    }
  }
  const latest = one.at(-1)?.bar.end ?? null;
  if (!latest) diagnostics.add("minute_history_unavailable");
  if (!five.length || five.at(-1)?.result.atr14 === null) diagnostics.add("five_minute_warmup_incomplete");
  if (one.at(-1)?.result.atr14 === null) diagnostics.add("minute_warmup_incomplete");
  const instances = candidates.map(candidate => ({ ...candidate.view,
    sequence: transitions.filter(event => event.instanceId === candidate.id).map(event => ({ state: event.state, candleCompletedAt: event.candleCompletedAt })) }));
  for (const candidate of candidates) candidate.view = instances.find(instance => instance.id === candidate.id)!;
  const active = candidates.filter(candidate => !candidate.coverageLost && (candidate.view.priceState === "forming" || (candidate.view.priceState === "confirmed"
    && latest !== null && latest < (candidate.view.recentlyConfirmedUntil ?? 0))));
  // Conservative grouping: never merge different legs merely because prices are close.
  const groups: { id: string; members: Candidate[]; parent: string; cycle: number; start: number; end: number; a5: number }[] = [];
  // Build groups in original formation order, including archived constituents.
  // Hiding an aged sibling cannot rename a still-current opportunity.
  for (const candidate of candidates) {
    const trigger = candidate.groupTrigger;
    const compatible = groups.find(group => group.parent === candidate.parent && group.cycle === candidate.cycle && group.a5 > 0
      && candidate.lowAt <= group.end && candidate.start >= group.start
      && Math.max(trigger, ...group.members.map(member => member.groupTrigger))
        - Math.min(trigger, ...group.members.map(member => member.groupTrigger)) <= 0.5 * group.a5
      && group.members.every(member => {
        if (!member.kind.startsWith("ema") || !candidate.kind.startsWith("ema")) return true;
        return Math.abs(member.initialReference - candidate.initialReference) <= 0.25 * (member.a5 + candidate.a5);
      }));
    if (compatible) compatible.members.push(candidate);
    else groups.push({ id: `group:${candidate.id}`, members: [candidate], parent: candidate.parent, cycle: candidate.cycle,
      start: candidate.lowAt, end: candidate.start, a5: candidate.a5 });
  }
  const stale = latest === null || input.receivedAt - latest > 2 * MINUTE;
  const fiveStale = latest !== null && five.length > 0 && five.at(-1)?.bar.end !== Math.floor(latest / (5 * MINUTE)) * 5 * MINUTE;
  if (fiveStale) diagnostics.add("five_minute_context_unavailable");
  return { rulesVersion: WATCHLIST_SETUP_RULES_VERSION, inputRevision: input.revision, instances, transitions,
    diagnostics: [...diagnostics], snapshot: { version: "watchlist-setups-v1", symbol: input.symbol,
      publicationIdentity: input.publicationIdentity, monitoringEnabled: settings.enabled,
      availability: latest === null ? "unavailable" : diagnostics.has("minute_warmup_incomplete") ? "warming-up" : stale ? "unavailable" : "ready",
      dataThrough: latest, groups: groups.map(group => ({ id: group.id, members: group.members.filter(member => active.includes(member)).map(member => member.view) }))
        .filter(group => group.members.length > 0),
      dependencies: settings.enabledDetectors.map(kind => ({ kind, availability: !latest ? "unavailable"
        : kind === "vwap-reclaim-hold" && latestVwap === null ? "unavailable"
        : kind !== "higher-low-reversal" && fiveStale ? "unavailable"
        : one.at(-1)?.result.atr14 == null || kind !== "higher-low-reversal" && (!five.length || five.at(-1)?.result.atr14 == null)
          || kind === "ema9-pullback-bounce" && emaSlope(five, five.length - 1, 9) === null
          || kind === "ema20-pullback-bounce" && emaSlope(five, five.length - 1, 20) === null
          ? "warming-up" : stale ? "unavailable" : "ready" })),
      history: instances.filter(instance => !active.some(candidate => candidate.id === instance.id)).slice(-20).reverse() } };
}
