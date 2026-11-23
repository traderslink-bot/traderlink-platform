import "server-only";

import { randomUUID } from "node:crypto";

import {
  CHART_EVIDENCE_VERSION,
  type ChartEvidenceCandle,
  type ChartEvidenceContext,
  type ChartEvidenceEvent,
  type ChartEvidenceZone,
  type ResolvedChartEvidence,
} from "@/src/modules/market-data/chart-evidence/contracts";
import { browserDataSession } from "@/src/modules/market-data/server/browser-data-session";
import type { AcceptedInput, AcceptedScannerDailyContext, ClosedScannerReturn } from "@/src/modules/market-data/accepted-series/publisher";
import { readOwnedChartLevelMap, type OwnedChartLevelMap } from "@/src/modules/market-data/server/chart-evidence-levels-read";
import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requestAlpacaGateway } from "@/src/modules/scanner/alpaca/client";
import { ALPACA_NATIVE_DAILY_DATASET } from "@/src/modules/scanner/alpaca/rest-data";
import { qualifiedStockLevelsChartProvenance } from "@/src/modules/stock-levels/stock-levels-contract";
import type { ReadScanLevelBreak, ScanLevelBreakFact, ScannerLevelRoom, ScanResult } from "../definition";
import { scannerSetupCandleContext, type ScannerSetupCandleContext } from "../setup-details";

const RULE_VERSION = "regular-4h-zone-close-v1";
const MAX_MATCHES = 2_048;
const MAX_AGE_MS = 15 * 60_000;

type CompletedLevelBreak = Readonly<{
  trigger: ChartEvidenceCandle;
  previous: ChartEvidenceCandle;
  zone: ChartEvidenceZone;
  event: ChartEvidenceEvent;
}>;

/** Called during the scan evaluation with the actual eligible prior close and exact projected zone. */
export function matchCompletedLevelBreak(
  trigger: ChartEvidenceCandle,
  previous: ChartEvidenceCandle,
  zone: ChartEvidenceZone,
  cutoff: number,
): CompletedLevelBreak | null {
  const { basis, interval, frame, revision, plotTime, acceptedAt } = trigger;
  if (frame !== "4h" || basis.sessionMode !== "regular" || trigger.shortened ||
    interval.end - interval.start !== 14_400 || plotTime !== interval.start || acceptedAt < interval.end ||
    ![cutoff, acceptedAt, previous.acceptedAt, zone.firstAvailableAt, zone.inputThrough, zone.calculatedAt, zone.expiresAt]
      .every(Number.isFinite) ||
    cutoff < acceptedAt || previous.frame !== frame || previous.shortened ||
    previous.interval.end > interval.start || previous.acceptedAt > interval.start ||
    previous.acceptedAt < previous.interval.end ||
    previous.basis.instrumentId !== basis.instrumentId || previous.basis.symbol !== basis.symbol ||
    previous.basis.venue !== basis.venue || previous.basis.seriesId !== basis.seriesId ||
    previous.basis.priceBasisId !== basis.priceBasisId ||
    previous.basis.sessionMode !== basis.sessionMode ||
    previous.basis.calendarRevision !== basis.calendarRevision ||
    previous.basis.aggregationVersion !== basis.aggregationVersion ||
    zone.instrumentId !== basis.instrumentId || zone.priceBasisId !== basis.priceBasisId ||
    !zone.zoneId || !zone.mapId || !zone.mapRevision || zone.freshness === "stale" ||
    zone.inputThrough > zone.calculatedAt || zone.calculatedAt > zone.firstAvailableAt ||
    zone.firstAvailableAt >= interval.start || zone.expiresAt <= acceptedAt ||
    ![zone.lower, zone.upper, previous.bar.close, trigger.bar.close].every(value => Number.isFinite(value) && value > 0) ||
    zone.lower > zone.upper) return null;

  const direction = zone.side === "resistance" && previous.bar.close <= zone.upper && trigger.bar.close > zone.upper
    ? "up"
    : zone.side === "support" && previous.bar.close >= zone.lower && trigger.bar.close < zone.lower ? "down" : null;
  if (!direction) return null;

  return { trigger, previous, zone, event: {
    id: JSON.stringify([basis.seriesId, revision, previous.revision, zone.mapId, zone.mapRevision, zone.zoneId, direction]),
    revision,
    ruleVersion: RULE_VERSION,
    kind: "level-break",
    direction,
    trigger: { basis, frame, interval, revision, plotTime },
    knownAt: acceptedAt,
    reference: { kind: "zone", zoneId: zone.zoneId, mapId: zone.mapId, mapRevision: zone.mapRevision },
  } };
}

type RegisteredMatch = Readonly<{
  userId: string;
  workspaceId: string;
  expiryMs: number;
  scannerGeneration: string;
  chartGeneration: string;
  match: CompletedLevelBreak;
  dailyContext: readonly ChartEvidenceZone[];
  readCurrentCandle: () => ChartEvidenceCandle | null | Promise<ChartEvidenceCandle | null>;
  readQualifiedZones?: () => Promise<readonly ChartEvidenceZone[]>;
}>;

const runtime = globalThis as typeof globalThis & { traderlinkScannerEvidenceMatches?: Map<string, RegisteredMatch> };
const matches = runtime.traderlinkScannerEvidenceMatches ??= new Map<string, RegisteredMatch>();
const unavailable = { state: "unavailable" } as const;

function marketGenerations() {
  const scanners = marketDataSelection("scanners");
  const charts = marketDataSelection("charts");
  if (scanners.provider !== "alpaca" || charts.provider !== "alpaca") return null;
  return {
    scannerGeneration: browserDataSession("scanners", scanners).generation,
    chartGeneration: browserDataSession("charts", charts).generation,
  };
}

/** Register only server-evaluated matches after their candle and saved map provenance is qualified. */
export function registerScannerChartEvidence(
  identity: TraderLinkPlatformRequestIdentity,
  match: CompletedLevelBreak,
  generations: { scannerGeneration: string; chartGeneration: string },
  readCurrentCandle: RegisteredMatch["readCurrentCandle"],
  dailyContext: readonly ChartEvidenceZone[] = [],
  readQualifiedZones?: RegisteredMatch["readQualifiedZones"],
): string | null {
  if (!hasScannerDashboardAccess(identity)) return null;
  const active = marketGenerations();
  if (!active || active.scannerGeneration !== generations.scannerGeneration || active.chartGeneration !== generations.chartGeneration) return null;
  const now = Date.now();
  const expiryMs = Math.min(now + MAX_AGE_MS, match.zone.expiresAt * 1_000);
  if (expiryMs <= now) return null;
  const reference = randomUUID();
  matches.set(reference, {
    userId: identity.scope.userId, workspaceId: identity.scope.workspaceId,
    expiryMs, ...active, match: structuredClone(match), readCurrentCandle,
    dailyContext: structuredClone(dailyContext.slice(0, 20)), readQualifiedZones,
  });
  if (matches.size > MAX_MATCHES) {
    const oldest = matches.keys().next().value;
    if (oldest) matches.delete(oldest);
  }
  return reference;
}

export function invalidateScannerChartEvidence(reference: string): void {
  matches.delete(reference);
}

export function hasActiveScannerChartEvidence(identity: TraderLinkPlatformRequestIdentity, references: readonly string[]): boolean {
  const now = Date.now();
  return references.length > 0 && references.every(reference => {
    const entry = matches.get(reference);
    return entry?.userId === identity.scope.userId && entry.workspaceId === identity.scope.workspaceId && entry.expiryMs > now;
  });
}

/** Recheck recent owner matches once per publication window, outside the shared quote cache. */
const pendingLevels = new Map<string, Promise<ReadScanLevelBreak>>();
export function readScannerLevelBreaks(identity: TraderLinkPlatformRequestIdentity): Promise<ReadScanLevelBreak> {
  if (!hasScannerDashboardAccess(identity)) return Promise.resolve(() => undefined);
  const key = JSON.stringify([identity.scope.userId, identity.scope.workspaceId]);
  const pending = pendingLevels.get(key);
  if (pending) return pending;
  const read = validateLevelBreaks(identity).finally(() => pendingLevels.delete(key));
  pendingLevels.set(key, read);
  return read;
}

async function validateLevelBreaks(identity: TraderLinkPlatformRequestIdentity): Promise<ReadScanLevelBreak> {
  const now = Date.now();
  const owned = [...matches].filter(([, entry]) => entry.userId === identity.scope.userId &&
    entry.workspaceId === identity.scope.workspaceId && entry.expiryMs > now);
  const latest = new Map<string, ScanLevelBreakFact & { knownAt: number }>();
  const checked = await Promise.allSettled(owned.slice(-8).map(async ([reference, entry]) => {
    const resolved = await resolveScannerChartEvidence(identity, reference);
    return resolved.state === "ready" ? { reference, event: entry.match.event, zone: entry.match.zone, targets: resolved.nearbyLevels, symbol: entry.match.trigger.basis.symbol } : null;
  }));
  for (const check of checked) {
    if (check.status !== "fulfilled" || !check.value) continue;
    const { reference, event, zone, targets, symbol } = check.value;
    const key = symbol + ":" + event.direction;
    const fact = { reference, at: event.trigger.interval.end * 1_000, knownAt: event.knownAt * 1_000, setup:{direction:event.direction,lower:zone.lower,upper:zone.upper,targets} };
    if ((latest.get(key)?.knownAt ?? 0) <= fact.knownAt) latest.set(key, fact);
  }
  return (symbol, rule, cutoff) => {
    const active = (direction: "up" | "down") => {
      const fact = latest.get(symbol + ":" + direction);
      const updated = fact && matches.get(fact.reference);
      return fact && fact.knownAt <= cutoff && updated && updated.expiryMs > Date.now() ? fact : undefined;
    };
    if (rule.direction !== "either") return active(rule.direction === "down" ? "down" : "up");
    const up = active("up"), down = active("down");
    return (up?.at ?? 0) >= (down?.at ?? 0) ? up : down;
  };
}

/** Private per-reader decoration. Quotes and the shared scan cache never contain these references. */
export function attachScannerEvidenceReferences(identity: TraderLinkPlatformRequestIdentity, result: ScanResult): ScanResult {
  if (!matches.size || !result.rows.length) return result;
  const now = Date.now();
  const symbols = new Set(result.rows.map(row => row.symbol));
  const eligible = [...matches].filter(([, entry]) =>
    entry.userId === identity.scope.userId && entry.workspaceId === identity.scope.workspaceId &&
    entry.expiryMs > now && symbols.has(entry.match.trigger.basis.symbol));
  if (!eligible.length || !hasScannerDashboardAccess(identity)) return result;
  const active = marketGenerations();
  if (!active) return result;
  const latest = new Map<string, { reference: string; knownAt: number }>();
  for (const [reference, entry] of eligible) {
    if (entry.chartGeneration !== active.chartGeneration || entry.scannerGeneration !== active.scannerGeneration) continue;
    const { knownAt } = entry.match.event;
    const symbol = entry.match.trigger.basis.symbol;
    if ((latest.get(symbol)?.knownAt ?? 0) <= knownAt) latest.set(symbol, { reference, knownAt });
  }
  if (!latest.size) return result;
  return { ...result, rows: result.rows.map(row => {
    const match = latest.get(row.symbol);
    return match ? { ...row, evidenceReference: match.reference } : row;
  }) };
}

async function readMapDailyContext(owned: OwnedChartLevelMap): Promise<AcceptedScannerDailyContext | undefined> {
  const provenance = qualifiedStockLevelsChartProvenance(owned.saved.map);
  const expected = provenance?.inputs.find(input => input.frame === "daily" && input.datasetId === ALPACA_NATIVE_DAILY_DATASET);
  if (!provenance || !expected) return;
  try {
    const raw = await requestAlpacaGateway("accepted-daily-context", new URLSearchParams({id:expected.id}), process.env, AbortSignal.timeout(2_000));
    if (!raw || typeof raw !== "object") return;
    const { input, context } = raw as { input?: AcceptedInput; context?: AcceptedScannerDailyContext };
    const { instrument } = provenance;
    if (!input || !context || input.instrumentId !== instrument.id || input.symbol !== instrument.symbol ||
      input.venue !== instrument.venue || input.id !== expected.id || input.digest !== expected.digest ||
      input.frame !== expected.frame || input.datasetId !== expected.datasetId || input.sessionMode !== expected.sessionMode ||
      input.calendarRevision !== expected.calendarRevision || input.priceBasisId !== expected.priceBasisId ||
      input.acceptedAtMs !== expected.acceptedAtMs || input.availableAtMs !== expected.availableAtMs ||
      input.completedThroughMs !== expected.completedThroughMs || input.acceptedCutoffMs !== expected.acceptedCutoffMs) return;
    const validated = (value: ClosedScannerReturn | undefined) => {
      if (!value || !Number.isSafeInteger(value.closedAtMs) || value.closedAtMs <= 0 ||
        value.closedAtMs > expected.completedThroughMs ||
        ![value.close, value.previousClose].every(price => Number.isFinite(price) && price > 0) ||
        !Number.isFinite(value.changePercent) || value.changePercent !== (value.close / value.previousClose - 1) * 100) return;
      return { previousClose:value.previousClose, close:value.close, changePercent:value.changePercent, closedAtMs:value.closedAtMs };
    };
    const daily = validated(context.daily), weekly = validated(context.weekly);
    if (daily || weekly) return { daily, weekly };
  } catch { /* Longer-term context is optional and shares the saved map's coverage. */ }
}

export async function resolveScannerChartEvidence(
  identity: TraderLinkPlatformRequestIdentity,
  reference: string,
  includeSetupContext = false,
): Promise<typeof unavailable | { state: "ready"; timeframe: "4h"; evidence: ResolvedChartEvidence; nearbyLevels: ScannerLevelRoom[];
  longerTerm?: AcceptedScannerDailyContext; priorCandle?: ScannerSetupCandleContext }> {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/u.test(reference) || !hasScannerDashboardAccess(identity)) return unavailable;
  const entry = matches.get(reference);
  if (!entry || entry.userId !== identity.scope.userId || entry.workspaceId !== identity.scope.workspaceId) return unavailable;
  const now = Date.now();
  if (entry.expiryMs <= now) {
    matches.delete(reference);
    return unavailable;
  }
  const active = marketGenerations();
  if (!active || active.scannerGeneration !== entry.scannerGeneration || active.chartGeneration !== entry.chartGeneration) return unavailable;

  const { trigger, previous, zone, event } = entry.match;
  const current = await entry.readCurrentCandle();
  const qualifiedZones = await entry.readQualifiedZones?.();
  const stillQualified = (candidate: ChartEvidenceZone) => !qualifiedZones || qualifiedZones.some(qualified =>
    qualified.zoneId === candidate.zoneId && qualified.mapId === candidate.mapId &&
    qualified.mapRevision === candidate.mapRevision && qualified.sourceFrame === candidate.sourceFrame &&
    qualified.lower === candidate.lower && qualified.upper === candidate.upper,
  );
  if (!stillQualified(zone)) return unavailable;
  const latest = marketGenerations();
  if (!current || current.revision !== trigger.revision ||
    current.interval.start !== trigger.interval.start || current.interval.end !== trigger.interval.end ||
    current.basis.seriesId !== trigger.basis.seriesId || current.basis.priceBasisId !== trigger.basis.priceBasisId ||
    !latest || latest.chartGeneration !== entry.chartGeneration || latest.scannerGeneration !== entry.scannerGeneration ||
    Date.now() >= entry.expiryMs || matches.get(reference) !== entry ||
    !hasScannerDashboardAccess(identity)) return unavailable;
  const resolvedAt = Date.now();
  const ownerStillHas = (candidate: ChartEvidenceZone) => {
    const owned = readOwnedChartLevelMap(identity, trigger.basis.symbol, {
      mapId: candidate.mapId, revision: candidate.mapRevision,
    }, resolvedAt);
    return owned?.publishedAt === candidate.firstAvailableAt && owned.expiresAt === candidate.expiresAt;
  };
  const sourceMap = readOwnedChartLevelMap(identity, trigger.basis.symbol, {
    mapId: zone.mapId, revision: zone.mapRevision,
  }, resolvedAt);
  if (!sourceMap || sourceMap.publishedAt !== zone.firstAvailableAt || sourceMap.expiresAt !== zone.expiresAt) return unavailable;
  const longerTerm = includeSetupContext ? await readMapDailyContext(sourceMap) : undefined;
  if (includeSetupContext) {
    const afterContext = marketGenerations();
    if (matches.get(reference) !== entry || Date.now() >= entry.expiryMs ||
      afterContext?.chartGeneration !== active.chartGeneration || afterContext.scannerGeneration !== active.scannerGeneration ||
      !hasScannerDashboardAccess(identity) || !ownerStillHas(zone)) return unavailable;
  }
  const dailyZones = entry.dailyContext.filter(candidate =>
    candidate.sourceFrame === "1D" && candidate.instrumentId === trigger.basis.instrumentId &&
    candidate.priceBasisId === trigger.basis.priceBasisId &&
    candidate.firstAvailableAt <= trigger.acceptedAt && candidate.expiresAt > resolvedAt / 1_000 &&
    Number.isFinite(candidate.lower) && Number.isFinite(candidate.upper) &&
    candidate.lower > 0 && candidate.upper >= candidate.lower &&
    (candidate.mapId !== zone.mapId || candidate.mapRevision !== zone.mapRevision || candidate.zoneId !== zone.zoneId) &&
    stillQualified(candidate) && ownerStillHas(candidate),
  );
  const close = trigger.bar.close;
  const rising = event.direction === "up";
  const ordered = (qualifiedZones ?? dailyZones).flatMap<ScannerLevelRoom>(candidate => {
    if (candidate.zoneId === zone.zoneId || candidate.mapId !== zone.mapId || candidate.mapRevision !== zone.mapRevision ||
      candidate.instrumentId !== zone.instrumentId || candidate.priceBasisId !== zone.priceBasisId ||
      candidate.firstAvailableAt !== zone.firstAvailableAt || candidate.expiresAt !== zone.expiresAt ||
      candidate.freshness === "stale" || candidate.side !== zone.side ||
      (candidate.sourceFrame !== "4h" && candidate.sourceFrame !== "1D") ||
      ![candidate.lower, candidate.upper].every(price => Number.isFinite(price) && price > 0) ||
      candidate.lower > candidate.upper || (rising ? candidate.upper < close : candidate.lower > close)) return [];
    return [{ zoneId: candidate.zoneId, frame: candidate.sourceFrame, side: candidate.side,
      lower: candidate.lower, upper: candidate.upper,
      distance: Math.max(0, rising ? candidate.lower - close : close - candidate.upper) }];
  }).sort((a, b) => a.distance - b.distance || (rising ? a.upper - b.upper : b.lower - a.lower));
  const first = ordered[0];
  const next = first && ordered.find(candidate => rising ? candidate.lower > first.upper : candidate.upper < first.lower);
  const nearbyLevels = first ? next ? [first, next] : [first] : [];
  const evidence: ChartEvidenceContext = {
    candles: { state: "ready", facts: [trigger] },
    zones: { state: "ready", facts: [zone, ...dailyZones] },
    events: { state: "ready", facts: [event] },
  };
  const priorCandle = includeSetupContext && previous.interval.end - previous.interval.start === 14_400
    ? scannerSetupCandleContext(previous.bar, previous.interval.end) : undefined;
  return { state: "ready", timeframe: "4h", nearbyLevels,
    ...(longerTerm ? { longerTerm } : {}), ...(priorCandle ? { priorCandle } : {}), evidence: {
    version: CHART_EVIDENCE_VERSION, chartGeneration: active.chartGeneration,
    basis: trigger.basis, current: { ...evidence, candles: { state: "ready", facts: [current] } }, match: evidence,
  } };
}
