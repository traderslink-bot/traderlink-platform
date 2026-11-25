import type { BrokerWorkspaceQuoteStatus, BrokerWorkspaceSavedResults, BrokerWorkspaceScannerModel } from "@/src/modules/market-data/workspace-broker-rows";
import type { SavedScanResults, ScanResultRow } from "@/src/modules/scanner/custom/definition";
import type { BreakoutRow, DeclineResults, DeclineRow, LiveScannerRow, LiveScreenResults, PremarketPullbackResults, PremarketPullbackRow, ScannerReadModel } from "@/src/modules/scanner/live/contracts";
import { gainerViewResults, type GainerView } from "@/src/modules/scanner/live/gainer-view";
import { scannerPrice } from "../scanner-price";

export const brokerScannerPath = "/api/trading-workspace/broker/scanner";
export const brokerSavedScansPath = "/api/trading-workspace/broker/saved-scans";

export type BrokerScannerFrame = BrokerWorkspaceScannerModel;

export type WorkspaceScannerModel = ScannerReadModel | BrokerScannerFrame;
export type WorkspaceStock = LiveScannerRow | BrokerScannerFrame["gainers"]["rows"][number];
export type WorkspaceScreenResults = LiveScreenResults | BrokerScannerFrame["gainers"];
export type WorkspaceBreakout = BreakoutRow | NonNullable<BrokerScannerFrame["breakouts"]>[number];
export type WorkspaceDeclineResults = DeclineResults | NonNullable<BrokerScannerFrame["declines"]>;
export type WorkspaceDecline = DeclineRow | NonNullable<BrokerScannerFrame["declines"]>["losers"][number];
export type WorkspacePullbackResults = PremarketPullbackResults | NonNullable<BrokerScannerFrame["premarketPullbacks"]>;
export type WorkspacePullback = PremarketPullbackRow | NonNullable<BrokerScannerFrame["premarketPullbacks"]>["rows"][number];
export type WorkspaceSavedEntry = SavedScanResults["results"][string] | BrokerWorkspaceSavedResults["results"][string];
export type WorkspaceSavedRow = ScanResultRow | Extract<WorkspaceSavedEntry, { state: "ready" }>["result"]["rows"][number];

export function isBrokerQuoteStatus(value: unknown): value is BrokerWorkspaceQuoteStatus {
  return value === "connecting" || value === "ready" || value === "unavailable" || value === "connection_required";
}

export function workspacePrice(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : scannerPrice(value);
}

export function workspaceGainerResults(model: WorkspaceScannerModel | null, view: GainerView): WorkspaceScreenResults | undefined {
  if (!model) return undefined;
  if ("brokerQuoteStatus" in model) {
    if (view === "day") return model.dayGainers ?? (model.session !== "after_hours" ? model.gainers : undefined);
    return model.session === "after_hours" ? model.gainers : undefined;
  }
  return gainerViewResults(model, view);
}
