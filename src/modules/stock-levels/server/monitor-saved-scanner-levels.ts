import "server-only";

import { isDeepStrictEqual } from "node:util";
import { readOwnedChartLevelMap } from "@/src/modules/market-data/server/chart-evidence-levels-read";
import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requestAlpacaGateway } from "@/src/modules/scanner/alpaca/client";
import { ALPACA_NATIVE_DAILY_DATASET, ALPACA_REGULAR_FOUR_HOUR_DATASET } from "@/src/modules/scanner/alpaca/rest-data";
import { qualifiedStockLevelsChartProvenance, type StockLevelsResult } from "../stock-levels-contract";
import { SCANNER_EVIDENCE_PROFILE, type AcceptedLevelsReceipt, type ScannerEvidenceOperation } from "./stock-levels-runtime-client";

export function selectVerifiedScannerLevelsOperation(
  request: Request, identity: TraderLinkPlatformRequestIdentity, symbolInput: unknown, profile: unknown, replacement: unknown,
): ScannerEvidenceOperation | false | undefined {
  if (profile === undefined) return;
  if (profile !== SCANNER_EVIDENCE_PROFILE || process.env.TRADERLINK_SCANNER_VERIFIED_LEVELS !== "1") return false;
  if (identity.mode !== "platform_session" || !hasScannerDashboardAccess(identity) ||
    marketDataSelection("scanners").provider !== "alpaca" || marketDataSelection("charts").provider !== "alpaca" ||
    replacement !== undefined || typeof symbolInput !== "string") return false;
  const symbol = symbolInput.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/u.test(symbol)) return false;
  try { requirePlatformMutationRequest(request); } catch { return false; }
  return {
    request, ownerUserId: identity.scope.userId, symbol,
    async readAcceptedInput(id) {
      try {
        const reply = await requestAlpacaGateway("accepted-input", new URLSearchParams({ id }), process.env,
          AbortSignal.any([request.signal, AbortSignal.timeout(2_000)]));
        if (reply && typeof reply === "object") return reply as AcceptedLevelsReceipt;
      } catch { /* The Levels result requires an exact current receipt. */ }
    },
  };
}

/** Observe the committed row before enrolling the next not-yet-started regular interval. */
export async function monitorCommittedScannerLevels(
  identity: TraderLinkPlatformRequestIdentity, result: Extract<StockLevelsResult, { state: "ready" }>,
): Promise<void> {
  try {
    if (!hasScannerDashboardAccess(identity)) return;
    const { savedMapId, map } = result.savedMap;
    const committed = readOwnedChartLevelMap(identity, map.symbol, undefined);
    const observedCommitMs = Date.now();
    if (!committed || committed.saved.savedMapId !== savedMapId || !isDeepStrictEqual(committed.saved.map, map)) return;
    const proof = qualifiedStockLevelsChartProvenance(committed.saved.map);
    if (!proof || proof.inputs.length !== 2) return;
    const daily = proof.inputs.find(input => input.datasetId === ALPACA_NATIVE_DAILY_DATASET);
    const regular = proof.inputs.find(input => input.datasetId === ALPACA_REGULAR_FOUR_HOUR_DATASET);
    if (!daily || !regular) return;
    const savedAfterMs = Math.max(observedCommitMs, committed.publishedAt * 1_000, proof.calculatedAtMs,
      ...proof.inputs.flatMap(input => [input.acceptedAtMs, input.availableAtMs, input.acceptedCutoffMs, input.completedThroughMs]));
    await requestAlpacaGateway("accepted-map-monitor", new URLSearchParams(), process.env, AbortSignal.timeout(2_000), {
      userId: identity.scope.userId, workspaceId: identity.scope.workspaceId, mapId: savedMapId, revision: committed.reference.revision,
      dailyId: daily.id, regularId: regular.id, savedAfterMs, expiresAtMs: committed.expiresAt * 1_000,
    });
  } catch {
    // The committed Levels map remains usable. A missed enrollment cannot qualify any retrospective break.
  }
}
