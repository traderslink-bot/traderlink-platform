import { INITIAL_WATCHLIST_SETUP_KINDS } from "./setup-contracts";
import type { InitialWatchlistSetupKind, WatchlistSetupMemberInstance, WatchlistSetupSession } from "./setup-contracts";
import type { WatchlistSetupEvaluation } from "./setup-engine";
import type { WatchlistSetupInput, SetupTransition } from "./setup-input";
import type { IndicatorCandle } from "../indicators/indicator-engine";
import { indicatorMarketDate, indicatorTradingDay } from "../indicators/indicator-sessions";

export const SETUP_OUTCOME_VERSION = "setup-follow-through-v2";
export const SETUP_RESULT_WINDOWS = [5, 15, 30, 60] as const;
export type SetupOutcomeState = "not-confirmed" | "follow-through" | "low-lost-first" | "neither" | "developing" | "unclear" | "missing-data" | "session-ended";
export type SetupResultFilter = { symbol?: string; kind?: InitialWatchlistSetupKind; session?: WatchlistSetupSession; rules?: string;
  from?: string; to?: string; minutes: number; page: number };
type RecordInput = { configurationRevision: number; input: WatchlistSetupInput; evaluation: WatchlistSetupEvaluation };
type Bar = { candle: IndicatorCandle; receivedAt: number; revision: string };
type Episode = { key: string; symbol: string; publicationIdentity: string; rulesVersion: string; instance: WatchlistSetupMemberInstance;
  firstReceived: number; latestReceived: number; confirmedReceived: number | null; confirmationInstance: WatchlistSetupMemberInstance | null;
  latestRank: string; confirmationRank: string | null;
  series: string; calendar: WatchlistSetupInput["calendar"]; stages: Map<string, SetupTransition>; revisions: Map<string, number>; configurations: Set<number>; diagnostics: Set<string> };
export type SetupOutcome = { state: SetupOutcomeState; confirmationPrice: number | null; testedLow: number | null; objective: number | null;
  through: number | null; endsAt: number | null; highest: number | null; lowest: number | null; risePct: number | null; declinePct: number | null;
  coveredMinutes: number; expectedMinutes: number; decidedAt: number | null; reason: string; candles: IndicatorCandle[] };
export type SetupResultEpisode = { key: string; symbol: string; kind: InitialWatchlistSetupKind; session: WatchlistSetupSession;
  marketDate: string; publicationIdentity: string; rulesVersion: string; firstRecognizedAt: number; confirmedAt: number | null;
  firstReceived: number; latestReceived: number; historicalDiscovery: boolean; stages: SetupTransition[]; references: WatchlistSetupMemberInstance["references"];
  inputRevisions: string[]; configurationRevisions: number[]; diagnostics: string[]; outcome: SetupOutcome };
export type SetupResultSummary = { kind: InitialWatchlistSetupKind; occurrences: number; forming: number; reclaimed: number;
  confirmed: number; failed: number; expired: number; outcomes: Record<SetupOutcomeState, number>; decided: number; followThroughPct: number | null };
export type SetupResults = { version: typeof SETUP_OUTCOME_VERSION; minutes: number; total: number; page: number; pageSize: number;
  rows: SetupResultEpisode[]; summary: SetupResultSummary[]; coverage: { records: number; unreadableRecords: number; limited: boolean;
    retainedOnly: true; oldestReceived: number | null; newestReceived: number | null } };

const minute = 60_000;
// Price observations arrive as decimal numbers. This comparison removes only
// floating-point arithmetic noise, never a tick, cent or percentage-sized move.
const priceCompare = (a: number, b: number) => {
  const delta = a - b, noise = Number.EPSILON * Math.max(Math.abs(a), Math.abs(b)) * 4;
  return Math.abs(delta) <= noise ? 0 : delta < 0 ? -1 : 1;
};
const timestamp = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0 && Number(value) <= 8_640_000_000_000_000;
const text = (value: unknown, max = 256): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
/** Validate an owned snapshot before touching any aggregate state. JSON records
 * cannot partially contribute when a nested field later proves malformed. */
function acceptedRecord(source: RecordInput): RecordInput {
  const record = structuredClone(source);
  const invalid = (): never => { throw Error("setup_results_invalid_record"); };
  const { input, evaluation } = record ?? {};
  if (!input || !evaluation || !text(input.symbol, 16) || !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(input.symbol)
    || !text(input.publicationIdentity, 36) || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iu.test(input.publicationIdentity)
    || !text(input.revision) || !text(evaluation.rulesVersion, 80) || !timestamp(input.receivedAt)
    || !Number.isSafeInteger(record.configurationRevision) || record.configurationRevision < 0
    || !Array.isArray(evaluation.instances) || evaluation.instances.length > 5000 || !Array.isArray(evaluation.transitions) || evaluation.transitions.length > 25000
    || !Array.isArray(evaluation.diagnostics) || evaluation.diagnostics.some(issue => !text(issue, 1000))) invalid();
  const calendar = input.calendar;
  const date = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  const wall = (value: unknown) => typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(value);
  if (!calendar || !text(calendar.calendarId) || calendar.timezone !== "America/New_York" || !calendar.coverage
    || !date(calendar.coverage.startDate) || !date(calendar.coverage.endDate) || !text(calendar.coverage.verificationStatus)
    || !Array.isArray(calendar.closedDates) || !calendar.closedDates.every(date) || !Array.isArray(calendar.earlyCloseSessions)
    || calendar.earlyCloseSessions.some(day => !day || !date(day.date) || !wall(day.postMarketEndEastern))
    || !wall(calendar.normalWeekdaySession?.postMarketEndEastern)) invalid();
  const frame = input.oneMinute;
  if (frame !== null && frame !== undefined) {
    if (!["moomoo", "yahoo"].includes(frame.provider) || !text(frame.seriesKey, 2000) || !text(frame.adjustment)
      || !Array.isArray(frame.candles) || frame.candles.length > 12000) invalid();
    const seen = new Set<number>();
    for (const candle of frame.candles) {
      if (!candle || !timestamp(candle.start) || !timestamp(candle.end) || candle.end - candle.start !== minute || candle.end > input.receivedAt
        || ![candle.open, candle.high, candle.low, candle.close].every(positive) || candle.low > Math.min(candle.open, candle.close)
        || candle.high < Math.max(candle.open, candle.close) || candle.low > candle.high || !text(candle.sessionKey)
        || candle.volume !== null && (typeof candle.volume !== "number" || !Number.isFinite(candle.volume) || candle.volume < 0)
        || seen.has(candle.start)) invalid();
      seen.add(candle.start);
      // Also exercise the supplied session/calendar shape before aggregation.
      indicatorTradingDay(calendar, indicatorMarketDate(candle.start));
    }
  }
  const ids = new Set<string>();
  for (const instance of evaluation.instances) {
    if (!instance || !text(instance.id, 2000) || ids.has(instance.id) || !INITIAL_WATCHLIST_SETUP_KINDS.includes(instance.kind)
      || !timestamp(instance.firstRecognizedAt) || !timestamp(instance.evaluatedThrough)
      || instance.confirmedAt !== null && !timestamp(instance.confirmedAt)
      || !Array.isArray(instance.references) || instance.references.length > 100) invalid();
    ids.add(instance.id);
    for (const ref of instance.references) {
      if (!ref || !["ema9", "ema20", "test-average", "vwap", "test-low", "rebound-high", "trigger"].includes(ref.role)
        || !["1m", "5m"].includes(ref.frame) || !ref.observation || !positive(ref.observation.value)
        || !timestamp(ref.observation.observedAt) || !timestamp(ref.observation.knownAt)) invalid();
    }
  }
  for (const event of evaluation.transitions) {
    if (!event || !ids.has(event.instanceId) || !["forming", "reclaimed", "confirmed", "failed", "expired"].includes(event.state)
      || !timestamp(event.candleCompletedAt) || !timestamp(event.knownAt) || !text(event.reason, 1000)) invalid();
  }
  return record;
}
const marketDate = (at: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
function session(at: number): WatchlistSetupSession {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const value = Number(parts.find(p => p.type === "hour")!.value) * 60 + Number(parts.find(p => p.type === "minute")!.value);
  return value < 570 ? "premarket" : value < 960 ? "regular" : "postmarket";
}
const blank = (): SetupOutcome => ({ state: "not-confirmed", confirmationPrice: null, testedLow: null, objective: null,
  through: null, endsAt: null, highest: null, lowest: null, risePct: null, declinePct: null,
  coveredMinutes: 0, expectedMinutes: 0, decidedAt: null, reason: "No confirmation recorded.", candles: [] });

/** Reads retained evidence only. No feed, storage mutation, provider or notification dependency. */
export class SetupResultsAccumulator {
  private episodes = new Map<string, Episode>();
  private series = new Map<string, Map<number, Bar>>();
  private records = 0;
  private barCount = 0;
  private limited = false;
  private oldest: number | null = null;
  private newest: number | null = null;
  add(source: RecordInput): void {
    const record = acceptedRecord(source);
    const { input, evaluation } = record;
    this.records++;
    this.oldest = Math.min(this.oldest ?? input.receivedAt, input.receivedAt);
    this.newest = Math.max(this.newest ?? input.receivedAt, input.receivedAt);
    const frame = input.oneMinute;
    const seriesKey = JSON.stringify([input.publicationIdentity, frame?.seriesKey, frame?.adjustment]);
    const recordRank = JSON.stringify([input.revision, seriesKey, record.configurationRevision]);
    let bars = this.series.get(seriesKey);
    if (!bars) { if (this.series.size >= 512) { this.limited = true; return; } this.series.set(seriesKey, bars = new Map()); }
    if (frame?.provider === "moomoo") for (const candle of frame.candles) {
      if (candle.end - candle.start !== minute || candle.end > input.receivedAt || ![candle.open, candle.high, candle.low, candle.close].every(n => Number.isFinite(n) && n > 0)
        || candle.low > Math.min(candle.open, candle.close) || candle.high < Math.max(candle.open, candle.close) || candle.low > candle.high) continue;
      const old = bars.get(candle.start);
      if (!old && (bars.size >= 12000 || this.barCount >= 100000)) { this.limited = true; continue; }
      if (!old || input.receivedAt > old.receivedAt || input.receivedAt === old.receivedAt && input.revision > old.revision)
        bars.set(candle.start, { candle, receivedAt: input.receivedAt, revision: input.revision });
      if (!old) this.barCount++;
    }
    for (const instance of evaluation.instances) {
      if (!INITIAL_WATCHLIST_SETUP_KINDS.includes(instance.kind)) continue;
      const key = JSON.stringify([input.publicationIdentity, evaluation.rulesVersion, instance.id]);
      let episode = this.episodes.get(key);
      if (!episode) {
        if (this.episodes.size >= 5000) { this.limited = true; continue; }
        episode = { key, symbol: input.symbol, publicationIdentity: input.publicationIdentity, rulesVersion: evaluation.rulesVersion,
          instance, firstReceived: input.receivedAt, latestReceived: input.receivedAt, confirmedReceived: null, confirmationInstance: null,
          latestRank: recordRank, confirmationRank: null,
          series: seriesKey, calendar: input.calendar, stages: new Map(), revisions: new Map(), configurations: new Set(), diagnostics: new Set() };
        this.episodes.set(key, episode);
      }
      if (episode.series !== seriesKey) episode.diagnostics.add("Candle series changed; outcome uses only the confirming series, while recorded stages are preserved.");
      episode.firstReceived = Math.min(episode.firstReceived, input.receivedAt);
      if (input.receivedAt > episode.latestReceived || input.receivedAt === episode.latestReceived && recordRank > episode.latestRank) {
        episode.instance = instance; episode.latestReceived = input.receivedAt; episode.latestRank = recordRank;
      }
      if (instance.confirmedAt !== null && (episode.confirmedReceived === null || input.receivedAt < episode.confirmedReceived
        || input.receivedAt === episode.confirmedReceived && recordRank < episode.confirmationRank!)) {
        episode.confirmationInstance = instance; episode.confirmedReceived = input.receivedAt;
        episode.confirmationRank = recordRank;
        episode.series = seriesKey; episode.calendar = input.calendar;
      }
      episode.revisions.set(input.revision, Math.min(episode.revisions.get(input.revision) ?? input.receivedAt, input.receivedAt)); episode.configurations.add(record.configurationRevision);
      for (const issue of evaluation.diagnostics) episode.diagnostics.add(issue);
      for (const event of evaluation.transitions) if (event.instanceId === instance.id) {
        const eventKey = `${event.state}:${event.candleCompletedAt}:${event.reason}`;
        const previous = episode.stages.get(eventKey);
        if (!previous || event.knownAt < previous.knownAt) episode.stages.set(eventKey, event);
      }
    }
  }
  private outcome(episode: Episode, minutes: number, now: number): SetupOutcome {
    const instance = episode.confirmationInstance, result = blank();
    if (!instance || instance.confirmedAt === null) return result;
    result.state = "missing-data";
    const bars = this.series.get(episode.series)!;
    const confirmation = bars.get(instance.confirmedAt - minute)?.candle;
    const low = instance.references.find(ref => ref.role === "test-low")?.observation.value;
    if (!confirmation || !low || priceCompare(low, confirmation.close) >= 0) { result.reason = "Confirmation candle or usable tested low is unavailable."; return result; }
    result.confirmationPrice = confirmation.close; result.testedLow = low; result.objective = confirmation.close * 2 - low;
    const calendar = confirmation.sessionKey;
    const day = indicatorTradingDay(episode.calendar, indicatorMarketDate(confirmation.start));
    const sessionEnd = day ? confirmation.start < day.regularOpen ? day.regularOpen : confirmation.start < day.regularClose ? day.regularClose : day.postClose : null;
    if (sessionEnd === null) { result.reason = "Trading calendar unavailable for the confirmation date."; return result; }
    const end = instance.confirmedAt + minutes * minute;
    result.endsAt = end; result.expectedMinutes = minutes;
    let firstDecision: SetupOutcomeState | null = null, missing = false;
    for (let at = instance.confirmedAt; at < end; at += minute) {
      const candle = bars.get(at)?.candle;
      if (at >= sessionEnd || !candle || candle.sessionKey !== calendar || candle.end > now) { missing = true; break; }
      result.candles.push(candle); result.coveredMinutes++; result.through = candle.end;
      result.highest = Math.max(result.highest ?? candle.high, candle.high); result.lowest = Math.min(result.lowest ?? candle.low, candle.low);
      const reached = priceCompare(candle.high, result.objective) >= 0, lost = priceCompare(candle.low, low) < 0;
      if (!firstDecision && (reached || lost)) {
        firstDecision = reached && lost ? "unclear" : reached ? "follow-through" : "low-lost-first";
        result.decidedAt = candle.end;
      }
    }
    result.risePct = result.highest === null ? null : (result.highest / confirmation.close - 1) * 100;
    result.declinePct = result.lowest === null ? null : (result.lowest / confirmation.close - 1) * 100;
    // An outcome already observed on a continuous prefix remains known even if
    // later follow-up data are absent; full-window excursions remain qualified.
    if (firstDecision) { result.state = firstDecision; result.reason = firstDecision === "unclear" ? "Both boundaries occurred in one candle; order is unknown." : "First boundary observed on a continuous post-confirmation sequence."; }
    else if (!missing) { result.state = "neither"; result.reason = "Neither boundary reached within the complete observation period."; }
    else {
      const next = instance.confirmedAt + result.coveredMinutes * minute;
      const laterSameSession = [...bars.values()].some(item => item.candle.start > next && item.candle.sessionKey === calendar);
      result.state = next >= sessionEnd ? "session-ended" : now < next + minute ? "developing" : "missing-data";
      if (laterSameSession) result.state = "missing-data";
      result.reason = result.state === "session-ended" ? "Session ended before the full period." : result.state === "developing" ? "Observation period is still developing." : "Continuous completed minute history is unavailable; no failure inferred.";
    }
    return result;
  }
  results(filter: SetupResultFilter, now = Date.now(), unreadableRecords = 0): SetupResults {
    const rows: SetupResultEpisode[] = [];
    for (const ep of this.episodes.values()) {
      const stages = [...ep.stages.values()].sort((a, b) => a.candleCompletedAt - b.candleCompletedAt || a.state.localeCompare(b.state));
      const observedAt = stages[0]?.candleCompletedAt ?? ep.instance.evaluatedThrough;
      const at = Math.max(1, observedAt - 1), date = marketDate(at);
      const day = indicatorTradingDay(ep.calendar, indicatorMarketDate(at));
      const namedSession = day ? at < day.regularOpen ? "premarket" : at < day.regularClose ? "regular" : "postmarket" : session(at);
      if (filter.symbol && filter.symbol !== ep.symbol || filter.kind && filter.kind !== ep.instance.kind || filter.session && filter.session !== namedSession
        || filter.rules && filter.rules !== ep.rulesVersion || filter.from && date < filter.from || filter.to && date > filter.to) continue;
      rows.push({ key: ep.key, symbol: ep.symbol, kind: ep.instance.kind, session: namedSession, marketDate: date,
        publicationIdentity: ep.publicationIdentity, rulesVersion: ep.rulesVersion, firstRecognizedAt: ep.instance.firstRecognizedAt,
        confirmedAt: ep.confirmationInstance?.confirmedAt ?? null, firstReceived: ep.firstReceived, latestReceived: ep.latestReceived,
        historicalDiscovery: ep.instance.firstRecognizedAt - observedAt > 120000, stages,
        references: ep.confirmationInstance?.references ?? ep.instance.references, inputRevisions: [...ep.revisions].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).map(([revision]) => revision),
        configurationRevisions: [...ep.configurations].sort((a, b) => a - b), diagnostics: [...ep.diagnostics], outcome: this.outcome(ep, filter.minutes, now) });
    }
    rows.sort((a, b) => b.firstRecognizedAt - a.firstRecognizedAt || a.key.localeCompare(b.key));
    const summary = INITIAL_WATCHLIST_SETUP_KINDS.map(kind => {
      const matching = rows.filter(row => row.kind === kind);
      const stages = (name: string) => matching.filter(row => row.stages.some(stage => stage.state === name)).length;
      const outcomes = Object.fromEntries(["not-confirmed", "follow-through", "low-lost-first", "neither", "developing", "unclear", "missing-data", "session-ended"].map(state => [state, matching.filter(row => row.outcome.state === state).length])) as Record<SetupOutcomeState, number>;
      const decided = outcomes["follow-through"] + outcomes["low-lost-first"] + outcomes.neither;
      return { kind, occurrences: matching.length, forming: stages("forming"), reclaimed: stages("reclaimed"), confirmed: stages("confirmed"), failed: stages("failed"), expired: stages("expired"),
        outcomes, decided, followThroughPct: decided ? outcomes["follow-through"] / decided * 100 : null };
    });
    const pageSize = 25, total = rows.length, page = Math.min(Math.max(1, filter.page), Math.max(1, Math.ceil(total / pageSize)));
    return { version: SETUP_OUTCOME_VERSION, minutes: filter.minutes, total, page, pageSize, summary, rows: rows.slice((page - 1) * pageSize, page * pageSize),
      coverage: { records: this.records, unreadableRecords, limited: this.limited, retainedOnly: true, oldestReceived: this.oldest, newestReceived: this.newest } };
  }
}
