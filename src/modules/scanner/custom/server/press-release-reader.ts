import "server-only";

import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { memberScannerArticleHistory, memberScannerPressReleaseRecords } from "@/src/modules/stock-screeners/press-releases";
import { RELEASE_LOOKBACK_HOURS, type ReadScanPressReleases, type ScanPressRelease, type ScanPressReleaseSnapshot } from "../signal-filters";

/** Hold only this request's News-authorized view, including its publication delay. */
export function scannerPressReleaseReader(identity: TraderLinkPlatformRequestIdentity): ReadScanPressReleases {
  let census: ReadonlyMap<string, unknown> | undefined;
  let symbols: string[] = [];
  let checkedAt = 0;
  let readThrough = 0;
  let snapshot: ScanPressReleaseSnapshot | undefined;

  let fetchedHours = 0;
  return (market, asOf, historyHours) => {
    const now = Date.now();
    const through = Math.min(asOf, now);
    const sameSymbols = market === census || (market.size === symbols.length && symbols.every(symbol => market.has(symbol)));
    const lookback=historyHours??RELEASE_LOOKBACK_HOURS;
    if (fetchedHours>=lookback && (!historyHours || snapshot?.history) && sameSymbols && through >= readThrough && now >= checkedAt && now - checkedAt < 5_000) {
      census = market;
      return snapshot;
    }
    census = market;
    symbols = [...market.keys()];
    checkedAt = now;
    readThrough = through;
    fetchedHours = lookback;
    if (historyHours) {
      const articles = memberScannerArticleHistory(identity, symbols, through, lookback, now);
      if (!articles) return snapshot = undefined;
      const bySymbol = new Map<string,ScanPressRelease[]>();
      const releases = new Map<string,ScanPressRelease>();
      for (const article of articles) {
        const value = {id:article.id, title:article.headline, at:article.publishedAt, url:article.url};
        const list = bySymbol.get(article.symbol);
        if (list) list.push(value);
        else { bySymbol.set(article.symbol,[value]); releases.set(article.symbol,value); }
      }
      return snapshot = {releases,history:bySymbol};
    }
    const releases = memberScannerPressReleaseRecords(identity, symbols, through, RELEASE_LOOKBACK_HOURS, now);
    snapshot = releases ? { releases: new Map([...releases].map(([symbol, article]) => [
      symbol, { id: article.id, title: article.headline, at: article.publishedAt, url: article.url },
    ])) } : undefined;
    return snapshot;
  };
}
