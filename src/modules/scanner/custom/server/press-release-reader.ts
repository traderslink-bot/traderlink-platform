import "server-only";

import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { memberScannerPressReleaseRecords } from "@/src/modules/stock-screeners/press-releases";
import { RELEASE_LOOKBACK_HOURS, type ReadScanPressReleases, type ScanPressReleaseSnapshot } from "../signal-filters";

/** Hold only this request's News-authorized view, including its publication delay. */
export function scannerPressReleaseReader(identity: TraderLinkPlatformRequestIdentity): ReadScanPressReleases {
  let census: ReadonlyMap<string, unknown> | undefined;
  let symbols: string[] = [];
  let checkedAt = 0;
  let readThrough = 0;
  let snapshot: ScanPressReleaseSnapshot | undefined;

  return (market, asOf) => {
    const now = Date.now();
    const through = Math.min(asOf, now);
    const sameSymbols = market === census || (market.size === symbols.length && symbols.every(symbol => market.has(symbol)));
    if (sameSymbols && through >= readThrough && now >= checkedAt && now - checkedAt < 5_000) {
      census = market;
      return snapshot;
    }
    census = market;
    symbols = [...market.keys()];
    checkedAt = now;
    readThrough = through;
    const releases = memberScannerPressReleaseRecords(identity, symbols, through, RELEASE_LOOKBACK_HOURS, now);
    snapshot = releases ? { releases: new Map([...releases].map(([symbol, article]) => [
      symbol, { id: article.id, title: article.headline, at: article.publishedAt, url: article.url },
    ])) } : undefined;
    return snapshot;
  };
}
