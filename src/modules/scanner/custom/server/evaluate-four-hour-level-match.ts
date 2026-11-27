import "server-only";

import { createHash } from "node:crypto";
import type { AcceptedFullCandle, AcceptedInput } from "@/src/modules/market-data/accepted-series/publisher";
import { requestAlpacaGateway } from "@/src/modules/scanner/alpaca/client";
import type { ChartSessionCalendar } from "@/src/modules/scanner/alpaca/chart-calendar";
import { easternDayStart } from "@/src/modules/scanner/alpaca/candles";
import { ALPACA_REGULAR_FOUR_HOUR_DATASET } from "@/src/modules/scanner/alpaca/rest-data";
import { qualifiedStockLevelsChartProvenance } from "@/src/modules/stock-levels/stock-levels-contract";
import type { ChartEvidenceCandle, ChartEvidenceLayer, ChartEvidenceZone } from "@/src/modules/market-data/chart-evidence/contracts";
import { projectAttestedChartLevels, projectSavedChartLevels, type LevelsChartProvenance } from "@/src/modules/market-data/chart-evidence/levels";
import { readOwnedChartLevelMap, type ChartLevelMapReference } from "@/src/modules/market-data/server/chart-evidence-levels-read";
import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { matchCompletedLevelBreak, registerScannerChartEvidence } from "./scanner-chart-evidence";

type Evaluation = {
  identity: TraderLinkPlatformRequestIdentity;
  trigger: ChartEvidenceCandle;
  previous: ChartEvidenceCandle;
  direction: "up" | "down" | "either";
  cutoff: number;
  generations: { scannerGeneration: string; chartGeneration: string };
  readCurrentCandle: Parameters<typeof registerScannerChartEvidence>[3];
};

const unavailable = { state: "unavailable" } as const;
type QualifiedMap = Readonly<{ reference: ChartLevelMapReference; provenance: LevelsChartProvenance }>;

/** Keep owner-private map evaluation and result references outside the shared ticker scan cache. */
export function evaluateScannerFourHourLevelMatch({
  identity, trigger, previous, map, direction, cutoff, generations, readCurrentCandle,
}: Evaluation & { map: QualifiedMap }) {
  if (!hasScannerDashboardAccess(identity) || !Number.isFinite(cutoff)) return unavailable;
  const owned = readOwnedChartLevelMap(identity, trigger.basis.symbol, map.reference);
  if (!owned || map.provenance.mapRevision !== owned.reference.revision ||
    map.provenance.firstAvailableAt !== owned.publishedAt || map.provenance.expiresAt !== owned.expiresAt) return unavailable;
  const projected = projectSavedChartLevels(owned.saved, map.provenance, trigger.basis, trigger.interval.start);
  return registerProjectedMatches({ identity, trigger, previous, direction, cutoff, generations, readCurrentCandle }, projected);
}

/** An independently fetched receipt that agrees with the saved clock, not a self-attestation from the map. */
async function acceptedLevelInputs(
  owned: NonNullable<ReturnType<typeof readOwnedChartLevelMap>>,
  triggerDatasetId: string,
) {
  const provenance = qualifiedStockLevelsChartProvenance(owned.saved.map);
  if (!provenance) return new Map<string, AcceptedInput>();
  const current = new Map<string, AcceptedInput>();
  const signal = AbortSignal.timeout(3_000);
  for (const expected of provenance.inputs) {
    if (signal.aborted) break;
    if (expected.frame === "4h" && expected.datasetId !== triggerDatasetId) continue;
    let raw: unknown;
    try {
      raw = await requestAlpacaGateway("accepted-input", new URLSearchParams({ id: expected.id }), process.env, signal);
    } catch {
      continue;
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const source = raw as AcceptedInput;
    if (source.id === expected.id && source.digest === expected.digest &&
      source.availableAtMs === expected.availableAtMs && source.acceptedAtMs === expected.acceptedAtMs) current.set(source.id, source);
  }
  return current;
}

type CurrentTrigger = Readonly<{ candle: ChartEvidenceCandle; datasetId: string }>;
const fullWidth = 14_400;

type ProspectiveWindow = Readonly<{
  /** Latest clock proved by the original calculation and committed map readback. */
  savedAfterMs: number;
  triggerStartMs?: number;
  verifiedEmptyStarts?: readonly number[];
  /** Exact receipts used to rule out earlier prospective breaks, including their predecessors. */
  earlierReceipts?: readonly Readonly<{ id: string; revision: string }>[];
  /** The exact next predecessor from this operation, when already observed with no break. */
  previousObservation?: {
    state: "no_break";
    map: ChartLevelMapReference;
    triggerId: string;
    startMs: number;
  };
}>;

function acceptedCandle(value: unknown, id: string, chartGeneration: string): CurrentTrigger | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { input, row } = value as AcceptedFullCandle;
  if (!input || input.id !== id || !Array.isArray(row) || row.length !== 7 ||
    input.datasetId !== ALPACA_REGULAR_FOUR_HOUR_DATASET || input.frame !== "4h" || input.sessionMode !== "regular" ||
    ![input.instrumentId, input.symbol, input.venue, input.priceBasisId, input.calendarRevision]
      .every(field => typeof field === "string" && field.length > 0) ||
    !/^[a-f0-9]{64}$/u.test(input.digest)) return null;
  const [startMs, endMs, open, high, low, close, volume] = row;
  if (!Number.isSafeInteger(startMs) || !Number.isSafeInteger(endMs) || startMs <= 0 ||
    startMs % 1_000 || endMs - startMs !== fullWidth * 1_000 ||
    ![input.completedThroughMs, input.acceptedCutoffMs, input.availableAtMs, input.acceptedAtMs].every(Number.isSafeInteger) ||
    endMs > input.completedThroughMs || input.completedThroughMs > Math.min(input.acceptedCutoffMs, input.availableAtMs) ||
    Math.max(input.availableAtMs, input.acceptedCutoffMs) > input.acceptedAtMs ||
    ![open, high, low, close].every(price => Number.isFinite(price) && price > 0) ||
    low > Math.min(open, close) || high < Math.max(open, close) || !Number.isFinite(volume) || volume < 0) return null;
  const start = startMs / 1_000;
  const seriesId = createHash("sha256").update(JSON.stringify([
    input.instrumentId, input.symbol, input.venue, input.datasetId, input.priceBasisId, input.calendarRevision, chartGeneration,
  ])).digest("hex");
  return { datasetId: input.datasetId, candle: {
    basis: { instrumentId: input.instrumentId, symbol: input.symbol, venue: input.venue, seriesId,
      priceBasisId: input.priceBasisId, calendarRevision: input.calendarRevision, sessionMode: input.sessionMode,
      aggregationVersion: input.datasetId },
    interval: { start, end: endMs / 1_000 }, plotTime: start, frame: "4h", shortened: false,
    bar: { time: start, open, high, low, close, volume }, revision: input.id + ":" + input.digest,
    acceptedAt: input.acceptedAtMs / 1_000,
  } };
}

function consecutiveTradedFullCandles(previous: ChartEvidenceCandle, trigger: ChartEvidenceCandle,
  calendar: ChartSessionCalendar, verifiedEmptyStarts: readonly number[]) {
  const earlier = calendar.sessionAt(previous.interval.start);
  const later = calendar.sessionAt(trigger.interval.start);
  if (!earlier || !later || previous.interval.start !== earlier.start + 570 * 60 ||
    trigger.interval.start !== later.start + 570 * 60 || earlier.closeMinute < 810 || later.closeMinute < 810 ||
    earlier.start >= later.start) return false;
  const first = Date.parse(earlier.session.date + "T12:00:00Z");
  const last = Date.parse(later.session.date + "T12:00:00Z");
  for (let noon = first; noon <= last; noon += 86_400_000) {
    if (!calendar.covers(noon / 1_000)) return false;
  }
  const scheduled = calendar.knownSessions().filter(({ date, close }) =>
    date > earlier.session.date && date < later.session.date && close >= "13:30");
  return scheduled.length === verifiedEmptyStarts.length && scheduled.every(({ date }, index) =>
    (easternDayStart(Date.parse(date + "T12:00:00Z") / 1_000) + 570 * 60) * 1_000 === verifiedEmptyStarts[index]);
}

/** Register a later break from independently looked-up exact prior and trigger receipts. */
export async function evaluateAcceptedRegularFourHourMatch({
  identity, map, direction, triggerId, previousId, calendar, generations, prospective,
}: Pick<Evaluation, "identity" | "direction" | "generations"> & {
  map: ChartLevelMapReference;
  calendar: ChartSessionCalendar;
  triggerId: string;
  previousId: string;
  prospective?: ProspectiveWindow;
}) {
  if (!hasScannerDashboardAccess(identity) || triggerId === previousId) return unavailable;
  const read = async (id: string, signal: AbortSignal) => {
    try {
      const value = await requestAlpacaGateway("accepted-input-candle", new URLSearchParams({ id }), process.env, signal);
      return acceptedCandle(value, id, generations.chartGeneration);
    } catch { return null; }
  };
  const signal = AbortSignal.timeout(3_000);
  const [trigger, previous] = await Promise.all([read(triggerId, signal), read(previousId, signal)]);
  if (!trigger || !previous || !consecutiveTradedFullCandles(previous.candle, trigger.candle, calendar,
    prospective?.verifiedEmptyStarts ?? [])) return unavailable;
  const startMs = trigger.candle.interval.start * 1_000;
  const previousStartMs = previous.candle.interval.start * 1_000;
  const observedAtMs = Date.now();
  const earlier = prospective?.previousObservation;
  if (previous.candle.basis.seriesId !== trigger.candle.basis.seriesId ||
    previous.candle.acceptedAt >= trigger.candle.interval.start ||
    trigger.candle.acceptedAt * 1_000 > observedAtMs ||
    (prospective && (direction !== "either" || !Number.isSafeInteger(prospective.savedAfterMs) || prospective.savedAfterMs <= 0 ||
      startMs <= prospective.savedAfterMs ||
      (prospective.triggerStartMs !== undefined && startMs !== prospective.triggerStartMs) ||
      (earlier ? earlier.state !== "no_break" || earlier.startMs !== previousStartMs ||
        earlier.startMs <= prospective.savedAfterMs || earlier.triggerId !== previousId ||
        earlier.map.mapId !== map.mapId || earlier.map.revision !== map.revision
        : previousStartMs > prospective.savedAfterMs)))) return unavailable;
  const earlierReceipts = [...(prospective?.earlierReceipts ?? [])];
  if (earlierReceipts.length > 9 || new Set(earlierReceipts.map(({ id }) => id)).size !== earlierReceipts.length ||
    earlierReceipts.some(({ id }) => id === triggerId) ||
    (earlierReceipts.length && (!earlier || !earlierReceipts.some(({ id, revision }) =>
      id === previousId && revision === previous.candle.revision)))) return unavailable;
  const earlierStillCurrent = async (signal: AbortSignal) => (await Promise.all(earlierReceipts
    .filter(({ id }) => id !== previousId)
    .map(async ({ id, revision }) => {
      const retained = await read(id, signal);
      return retained?.candle.revision === revision && retained.candle.basis.seriesId === trigger.candle.basis.seriesId &&
        retained.candle.interval.start < previous.candle.interval.start;
    }))).every(Boolean);
  if (!await earlierStillCurrent(signal)) return unavailable;
  const result = await evaluateLiveFourHourLevelMatch({
    identity, map, direction, generations, cutoff: observedAtMs / 1_000,
    trigger: trigger.candle, previous: previous.candle, triggerDatasetId: trigger.datasetId,
    readCurrentTrigger: async () => {
      const signal = AbortSignal.timeout(3_000);
      const [current, prior, intact] = await Promise.all([
        read(triggerId, signal), read(previousId, signal), earlierStillCurrent(signal),
      ]);
      return intact && prior?.candle.revision === previous.candle.revision ? current : null;
    },
  });
  if (result.state !== "ready") return result;
  return {
    ...result,
    observation: {
      state: result.matches.length ? "matched" as const : "no_break" as const,
      triggerId, previousId, map, startMs, observedAtMs,
      triggerRevision: trigger.candle.revision, previousRevision: previous.candle.revision,
    },
  };
}

export async function evaluateLiveFourHourLevelMatch(input: Omit<Evaluation, "readCurrentCandle"> & {
  map: ChartLevelMapReference;
  /** Exact dataset identity from the accepted trigger's interval producer. */
  triggerDatasetId: string;
  readCurrentTrigger: () => CurrentTrigger | null | Promise<CurrentTrigger | null>;
}) {
  const { identity, trigger, cutoff, map, triggerDatasetId } = input;
  if (!hasScannerDashboardAccess(identity) || !Number.isFinite(cutoff) || !triggerDatasetId.trim()) return unavailable;
  const owned = readOwnedChartLevelMap(identity, trigger.basis.symbol, map);
  if (!owned || owned.publishedAt >= trigger.interval.start) return unavailable;
  const project = async () => {
    const accepted = await acceptedLevelInputs(owned, triggerDatasetId);
    return projectAttestedChartLevels({
      owned, basis: trigger.basis, asOf: trigger.interval.start, triggerDatasetId,
      acceptedInput: id => accepted.get(id),
    });
  };
  const projected = await project();
  const readCurrentCandle = async () => {
    const current = await input.readCurrentTrigger();
    return current?.datasetId === triggerDatasetId ? current.candle : null;
  };
  return registerProjectedMatches({ ...input, readCurrentCandle }, projected, async () => {
    const latest = await project();
    return latest.state === "ready" ? latest.facts : [];
  });
}

function registerProjectedMatches({
  identity, trigger, previous, direction, cutoff, generations, readCurrentCandle,
}: Evaluation, projected: ChartEvidenceLayer<ChartEvidenceZone>,
  readQualifiedZones?: () => Promise<readonly ChartEvidenceZone[]>,
) {
  if (projected.state !== "ready") return unavailable;

  const zones = projected.facts.filter(zone => zone.sourceFrame === "4h");
  if (!zones.length) return unavailable;
  const candidates = zones.flatMap(zone => {
    const match = matchCompletedLevelBreak(trigger, previous, zone, cutoff);
    return match && (direction === "either" || match.event.direction === direction) ? [match] : [];
  });
  if (!candidates.length) return { state: "ready", matches: [] } as const;
  const dailyContext = projected.facts.filter(zone => zone.sourceFrame === "1D");
  const matches = [];
  for (const match of candidates) {
    const reference = registerScannerChartEvidence(identity, match, generations, readCurrentCandle, dailyContext,
      readQualifiedZones);
    if (!reference) return unavailable;
    matches.push({ symbol: trigger.basis.symbol, eventId: match.event.id, reference, evidenceHref: `/scanner?evidence=${reference}` });
  }
  return { state: "ready", matches } as const;
}
