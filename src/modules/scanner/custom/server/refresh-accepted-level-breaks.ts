import "server-only";

import type { AcceptedRegularOpportunity } from "@/src/modules/market-data/accepted-series/publisher";
import { browserDataSession } from "@/src/modules/market-data/server/browser-data-session";
import { listRecentOwnedChartLevelMaps, type OwnedChartLevelMap } from "@/src/modules/market-data/server/chart-evidence-levels-read";
import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { ChartSessionCalendar } from "@/src/modules/scanner/alpaca/chart-calendar";
import { requestAlpacaGateway } from "@/src/modules/scanner/alpaca/client";
import { ALPACA_NATIVE_DAILY_DATASET, ALPACA_REGULAR_FOUR_HOUR_DATASET } from "@/src/modules/scanner/alpaca/rest-data";
import { qualifiedStockLevelsChartProvenance } from "@/src/modules/stock-levels/stock-levels-contract";

import { evaluateAcceptedRegularFourHourMatch } from "./evaluate-four-hour-level-match";
import { hasActiveScannerChartEvidence, invalidateScannerChartEvidence, readScannerLevelBreaks } from "./scanner-chart-evidence";

type Observation = Extract<Awaited<ReturnType<typeof evaluateAcceptedRegularFourHourMatch>>, { state: "ready" }>["observation"];
type MapProgress = {
  savedAfterMs: number;
  noBreak?: Observation;
  earlierReceipts: Map<string, string>;
  matched?: { observation: Observation; references: readonly string[] };
};
type OwnerRefresh = {
  startedAt: number;
  pending?: Promise<void>;
  maps: Map<string, MapProgress>;
};

const owners = new Map<string, OwnerRefresh>();
const minimumIntervalMs = 15_000;
const receiptId = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/u;
let activeOwners = 0;

async function refreshMap(identity: TraderLinkPlatformRequestIdentity, owned: OwnedChartLevelMap,
  refresh: OwnerRefresh, generations: { scannerGeneration: string; chartGeneration: string }) {
  const provenance = qualifiedStockLevelsChartProvenance(owned.saved.map);
  const daily = provenance?.inputs.filter(input => input.frame === "daily" && input.datasetId === ALPACA_NATIVE_DAILY_DATASET);
  const regular = provenance?.inputs.filter(input => input.frame === "4h" && input.datasetId === ALPACA_REGULAR_FOUR_HOUR_DATASET);
  if (!provenance || daily?.length !== 1 || regular?.length !== 1 ||
    ![daily[0].id, regular[0].id].every(id => receiptId.test(id))) return;

  const minimumSaveMs = Math.max(owned.publishedAt * 1_000, provenance.calculatedAtMs,
    ...provenance.inputs.map(input => Math.max(input.acceptedAtMs, input.availableAtMs, input.acceptedCutoffMs, input.completedThroughMs)));
  const { reference } = owned;
  const key = reference.revision;
  let progress = refresh.maps.get(key);

  const query = new URLSearchParams({ dailyId: daily[0].id, regularId: regular[0].id,
    mapId: reference.mapId, mapRevision: reference.revision });
  const raw = await requestAlpacaGateway("accepted-regular-opportunities", query, process.env, AbortSignal.timeout(2_000));
  if (!Array.isArray(raw) || raw.length > 8) return;
  const now = Date.now();
  const candidates = (raw as AcceptedRegularOpportunity[]).filter(candidate => candidate &&
    candidate.dailyId === daily[0].id && candidate.regularId === regular[0].id &&
    candidate.mapId === reference.mapId && candidate.mapRevision === reference.revision &&
    receiptId.test(candidate.previousId) && receiptId.test(candidate.triggerId) &&
    Number.isSafeInteger(candidate.savedAfterMs) && candidate.savedAfterMs >= minimumSaveMs &&
    Number.isSafeInteger(candidate.startMs) && candidate.startMs > candidate.savedAfterMs && candidate.startMs < now &&
    (candidate.verifiedEmptyStarts === undefined || (Array.isArray(candidate.verifiedEmptyStarts) &&
      candidate.verifiedEmptyStarts.length <= 8 && candidate.verifiedEmptyStarts.every(Number.isSafeInteger))) &&
    Array.isArray(candidate.calendars) && candidate.calendars.length > 0 && candidate.calendars.length <= 4,
  ).sort((left, right) => left.startMs - right.startMs);
  const retains = (observation: Observation) => candidates.some(candidate => candidate.startMs === observation.startMs &&
    candidate.triggerId === observation.triggerId && candidate.previousId === observation.previousId);
  if ((progress?.noBreak && !retains(progress.noBreak)) ||
    (progress?.matched && !retains(progress.matched.observation))) {
    for (const reference of progress.matched?.references ?? []) invalidateScannerChartEvidence(reference);
    refresh.maps.delete(key);
    progress = undefined;
  }
  if (progress?.matched && hasActiveScannerChartEvidence(identity, progress.matched.references)) return;
  for (const candidate of candidates) {
    const previous = progress?.noBreak;
    if (progress && candidate.savedAfterMs !== progress.savedAfterMs) continue;
    if (previous && candidate.startMs <= previous.startMs) continue;
    const firstMatch = progress?.matched?.observation;
    if (firstMatch && (candidate.startMs !== firstMatch.startMs || candidate.triggerId !== firstMatch.triggerId)) return;
    if (previous && candidate.previousId !== previous.triggerId) return;
    const calendar = new ChartSessionCalendar();
    for (const part of candidate.calendars) calendar.merge(part);
    const result = await evaluateAcceptedRegularFourHourMatch({
      identity, map: reference, direction: "either", triggerId: candidate.triggerId, previousId: candidate.previousId,
      calendar, generations, prospective: {
        savedAfterMs: candidate.savedAfterMs, triggerStartMs: candidate.startMs,
        verifiedEmptyStarts: candidate.verifiedEmptyStarts,
        earlierReceipts: progress && Array.from(progress.earlierReceipts, ([id, revision]) => ({ id, revision })),
        previousObservation: previous?.state === "no_break" ? {
          state: "no_break", map: previous.map, triggerId: previous.triggerId, startMs: previous.startMs,
        } : undefined,
      },
    });
    if (result.state !== "ready") return;
    if (firstMatch && result.observation.state !== "matched") return;
    progress ??= { savedAfterMs: candidate.savedAfterMs, earlierReceipts: new Map() };
    if (result.observation.state === "matched") {
      progress.matched = { observation: result.observation, references: result.matches.map(match => match.reference) };
    } else {
      progress.noBreak = result.observation;
      progress.earlierReceipts.set(result.observation.previousId, result.observation.previousRevision);
      progress.earlierReceipts.set(result.observation.triggerId, result.observation.triggerRevision);
    }
    refresh.maps.set(key, progress);
    if (result.matches.length) return;
  }
}

async function refreshOwner(identity: TraderLinkPlatformRequestIdentity, refresh: OwnerRefresh,
  generations: { scannerGeneration: string; chartGeneration: string }) {
  const maps = listRecentOwnedChartLevelMaps(identity);
  const current = new Set(maps.map(map => map.reference.revision));
  for (const revision of refresh.maps.keys()) {
    if (!current.has(revision)) refresh.maps.delete(revision);
  }
  await Promise.allSettled(maps.map(map => refreshMap(identity, map, refresh, generations)));
}

/** Pull only qualified gateway receipts. No provider reads or writes occur in Platform. */
export async function refreshAcceptedScannerLevelBreaks(identity: TraderLinkPlatformRequestIdentity) {
  const scanner = marketDataSelection("scanners");
  const chart = marketDataSelection("charts");
  if (scanner.provider === "alpaca" && chart.provider === "alpaca" && hasScannerDashboardAccess(identity)) {
    const generations = {
      scannerGeneration: browserDataSession("scanners", scanner).generation,
      chartGeneration: browserDataSession("charts", chart).generation,
    };
    const key = JSON.stringify([identity.scope.userId, identity.scope.workspaceId, generations]);
    const now = Date.now();
    const refresh = owners.get(key) ?? { startedAt: 0, maps: new Map<string, MapProgress>() };
    if (!refresh.pending && activeOwners < 4 && now - refresh.startedAt >= minimumIntervalMs) {
      refresh.startedAt = now;
      activeOwners++;
      refresh.pending = refreshOwner(identity, refresh, generations).catch(() => {}).finally(() => {
        activeOwners--;
        refresh.pending = undefined;
      });
      owners.delete(key);
      owners.set(key, refresh);
      if (owners.size > 64) owners.delete(owners.keys().next().value!);
    }
    await refresh.pending;
  }
  return readScannerLevelBreaks(identity);
}
