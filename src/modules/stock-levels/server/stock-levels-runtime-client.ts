import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isStockLevelsMap,
  qualifiedStockLevelsChartProvenance,
  type StockLevelsChartEvidenceInput,
  type StockLevelsMap,
} from "../stock-levels-contract";

const RUNTIME_URL_ENV = "TRADERLINK_STOCK_LEVELS_RUNTIME_URL";
const RUNTIME_TOKEN_ENV = "TRADERLINK_STOCK_LEVELS_RUNTIME_ACCESS_TOKEN";

export const SCANNER_EVIDENCE_PROFILE = "scanner-regular-4h-v1";
const NATIVE_DAILY_DATASET = "alpaca-sip:native-et-day:v1";
const REGULAR_FOUR_HOUR_DATASET = "alpaca-sip:regular-et-0930-4h:v1";

export type AcceptedLevelsReceipt = StockLevelsChartEvidenceInput & Readonly<{
  instrumentId: string;
  symbol: string;
  venue: string;
}>;

export type ScannerEvidenceOperation = Readonly<{
  request: Request;
  ownerUserId: string;
  symbol: string;
  readAcceptedInput: (id: string) => AcceptedLevelsReceipt | undefined | Promise<AcceptedLevelsReceipt | undefined>;
}>;

const scannerEvidenceOperation = new AsyncLocalStorage<{
  operation: ScannerEvidenceOperation;
  consumed: boolean;
}>();

/** The isolated server supervisor binds one request to its authenticated owner and receipt reader. */
export function withScannerLevelsEvidenceOperation<T>(operation: ScannerEvidenceOperation, run: () => T): T {
  return scannerEvidenceOperation.run({ operation: Object.freeze({ ...operation }), consumed: false }, run);
}

export function takeScannerLevelsEvidenceOperation(
  request: Request,
  identity: TraderLinkPlatformRequestIdentity,
  symbol: unknown,
): ScannerEvidenceOperation | false | undefined {
  const current = scannerEvidenceOperation.getStore();
  if (!current) return;
  if (current.consumed || current.operation.request !== request ||
      identity.mode !== "platform_session" || identity.scope.userId !== current.operation.ownerUserId ||
      typeof symbol !== "string" || symbol.trim().toUpperCase() !== current.operation.symbol ||
      request.signal.aborted) return false;
  current.consumed = true;
  return current.operation;
}

function sameInput(
  input: StockLevelsChartEvidenceInput,
  receipt: AcceptedLevelsReceipt | undefined,
  instrument: NonNullable<StockLevelsMap["chartEvidenceProvenance"]>["instrument"],
): boolean {
  return receipt?.instrumentId === instrument.id && receipt.symbol === instrument.symbol &&
    receipt.venue === instrument.venue && receipt.id === input.id && receipt.frame === input.frame &&
    receipt.datasetId === input.datasetId && receipt.sessionMode === input.sessionMode &&
    receipt.priceBasisId === input.priceBasisId && receipt.calendarRevision === input.calendarRevision &&
    receipt.digest === input.digest && receipt.completedThroughMs === input.completedThroughMs &&
    receipt.acceptedCutoffMs === input.acceptedCutoffMs && receipt.availableAtMs === input.availableAtMs &&
    receipt.acceptedAtMs === input.acceptedAtMs;
}

async function matchesEvidenceOperation(map: StockLevelsMap, operation: ScannerEvidenceOperation): Promise<boolean> {
  const proof = map.chartEvidenceProvenance;
  if (map.symbol !== operation.symbol || map.cacheStatus !== "fresh" || !proof || proof.inputs.length !== 2 ||
      proof.calculatedAtMs > Date.now() || map.levelMap?.dataQuality?.status === "unavailable") return false;
  const daily = proof.inputs.find(input => input.frame === "daily");
  const fourHour = proof.inputs.find(input => input.frame === "4h");
  return daily !== undefined && fourHour !== undefined &&
    daily.datasetId === NATIVE_DAILY_DATASET && daily.sessionMode === "extended" &&
    fourHour.datasetId === REGULAR_FOUR_HOUR_DATASET && fourHour.sessionMode === "regular" &&
    daily.priceBasisId === fourHour.priceBasisId &&
    daily.calendarRevision === fourHour.calendarRevision &&
    proof.zones.some(zone => zone.inputIds.length === 1 && zone.inputIds[0] === fourHour.id) &&
    (await Promise.all(proof.inputs.map(async input =>
      sameInput(input, await operation.readAcceptedInput(input.id), proof.instrument),
    ))).every(Boolean);
}

type RuntimeUnavailableCode =
  | "invalid_symbol"
  | "unsupported_equity"
  | "reference_price_unavailable"
  | "market_data_unavailable";

export type StockLevelsRuntimeReply =
  | Readonly<{ map: StockLevelsMap }>
  | Readonly<{
      code: RuntimeUnavailableCode;
      message: string;
    }>;

function isRuntimeUnavailableCode(value: unknown): value is RuntimeUnavailableCode {
  return value === "invalid_symbol" ||
    value === "unsupported_equity" ||
    value === "reference_price_unavailable" ||
    value === "market_data_unavailable";
}

export async function requestStockLevels(
  symbol: string,
  operation?: ScannerEvidenceOperation,
): Promise<StockLevelsRuntimeReply | null> {
  const baseUrl = process.env[RUNTIME_URL_ENV]?.trim();
  const token = process.env[RUNTIME_TOKEN_ENV]?.trim();
  if (!baseUrl || !token) return null;
  let response: Response;
  try {
    response = await fetch(new URL("/api/runtime/stock-levels", baseUrl), {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(operation ? { symbol, profile: SCANNER_EVIDENCE_PROFILE } : { symbol }),
      cache: "no-store",
      ...(operation ? { signal: operation.request.signal } : {}),
    });
  } catch { return null; }
  try {
    const body = await response.json() as { map?: unknown; code?: unknown; message?: unknown };
    if (response.ok && isStockLevelsMap(body.map)) {
      const { chartEvidenceProvenance, ...legacyMap } = body.map;
      const provenance = chartEvidenceProvenance && body.map.symbol === symbol
        ? qualifiedStockLevelsChartProvenance(body.map) : undefined;
      const map = provenance ? { ...legacyMap, chartEvidenceProvenance: provenance } : legacyMap;
      if (operation && !await matchesEvidenceOperation(map, operation)) {
        return { code: "market_data_unavailable", message: "Qualifying chart evidence is unavailable." };
      }
      return { map };
    }
    if (isRuntimeUnavailableCode(body.code) && typeof body.message === "string") {
      return { code: body.code, message: body.message };
    }
    return null;
  } catch { return null; }
}
