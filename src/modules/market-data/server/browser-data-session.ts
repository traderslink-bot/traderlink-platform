import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import type { ScannerConnection } from "@/src/modules/scanner/live/server/provider-store";
import type { MarketDataFeature } from "../provider-contract";

// Shared by the route bundles in the existing single-process application. A
// restart intentionally expires browser data caches without changing settings.
const application = globalThis as typeof globalThis & {
  traderlinkBrowserDataSessionKey?: Buffer;
};

export function browserDataSession(feature: MarketDataFeature, selection: ScannerConnection): { generation: string } {
  const key = application.traderlinkBrowserDataSessionKey ??= randomBytes(32);
  return {
    generation: createHmac("sha256", key)
      .update(JSON.stringify([feature, selection.provider, selection.revision]))
      .digest("hex"),
  };
}

/** The generation identifies a dataset; authentication and access remain separate. */
export function matchesBrowserDataSession(query: URLSearchParams, feature: MarketDataFeature, selection: ScannerConnection): boolean {
  if (query.has("generation") && query.get("generation") !== browserDataSession(feature, selection).generation) return false;
  // Preserve existing server consumers and already-open older clients. New
  // browser code sends only generation, never the selected supplier's name.
  return (!query.has("provider") || query.get("provider") === selection.provider)
    && (!query.has("providerRevision") || query.get("providerRevision") === String(selection.revision));
}
