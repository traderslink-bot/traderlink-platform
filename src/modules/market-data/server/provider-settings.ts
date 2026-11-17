import "server-only";

import { dirname, join } from "node:path";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { readScannerConnection, saveScannerConnection, type ScannerConnection } from "@/src/modules/scanner/live/server/provider-store";

import { MARKET_DATA_FEATURES, type MarketDataFeature, type MarketDataProvider } from "../provider-contract";
export { MARKET_DATA_FEATURES, type MarketDataFeature, type MarketDataProvider } from "../provider-contract";

function directory(feature: MarketDataFeature, environment: NodeJS.ProcessEnv) {
  const root = dirname(resolvePlatformDatabaseConfig({ environment }).databasePath);
  return feature === "scanners"
    ? join(root, "scanner-live-v1")
    : join(root, "market-data-providers-v1", feature);
}

export function marketDataSelection(feature: MarketDataFeature, environment: NodeJS.ProcessEnv = process.env): ScannerConnection {
  return readScannerConnection(directory(feature, environment), { ...environment, TRADERLINK_MARKET_DATA_PROVIDER: "alpaca" });
}

export function marketDataProvider(feature: MarketDataFeature, environment: NodeJS.ProcessEnv = process.env): MarketDataProvider {
  return marketDataSelection(feature, environment).provider;
}

export function marketDataEnvironment(feature: MarketDataFeature, environment: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return { ...environment, TRADERLINK_MARKET_DATA_PROVIDER: marketDataProvider(feature, environment) };
}

// Route and worker bundles share the lock. Revision checks prevent a stale admin
// page from replacing a more recent selection.
const shared = globalThis as typeof globalThis & { traderlinkMarketDataChanges?: Set<string> };
const changes = shared.traderlinkMarketDataChanges ??= new Set();

export async function changeMarketDataProvider(feature: MarketDataFeature, revision: number, provider: MarketDataProvider,
  environment: NodeJS.ProcessEnv = process.env): Promise<ScannerConnection> {
  if (!MARKET_DATA_FEATURES.includes(feature) || !["alpaca", "moomoo"].includes(provider)
    || !Number.isSafeInteger(revision) || revision < 0) throw Error("invalid_provider_selection");
  if (feature === "scanners") {
    const { changeScannerConnection } = await import("@/src/modules/scanner/live/server/runtime");
    return changeScannerConnection(provider, revision, environment);
  }
  const folder = directory(feature, environment);
  if (changes.has(folder)) throw Error("provider_selection_busy");
  changes.add(folder);
  try {
    const current = marketDataSelection(feature, environment);
    if (current.revision !== revision) throw Error("provider_selection_conflict");
    if (current.provider === provider) return current;
    return await saveScannerConnection(folder, current, provider);
  } finally {
    changes.delete(folder);
  }
}
