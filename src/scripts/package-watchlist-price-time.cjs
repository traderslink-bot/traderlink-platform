// Generate a narrow release patch without copying the mixed working-tree client.
const fs = require('node:fs');
const cp = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const base = process.argv[2] || '4770e0e4e29bed12b6b6e9a8d4e0204695236445';
const files = ['app/watchlist/live-watchlist-client.tsx', 'src/lib/live-watchlist/live-watchlist-list.ts', 'app/watchlist/potential-path-levels-card.tsx', 'src/modules/help/watchlist-guides.ts'];
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'watchlist-price-time-'));
let patch = '';
for (const file of files) {
  const original = cp.execFileSync('git', ['show', `${base}:${file}`], {encoding:'utf8'}).replace(/\r\n/g,'\n');
  let next = original;
  const replace = (from, to) => {
    if (!next.includes(from)) throw Error(`Missing exact source in ${file}: ${from.slice(0,100)}`);
    next = next.replace(from,to);
  };
  if (file.endsWith('live-watchlist-client.tsx')) {
    replace('import {\n  formatMarketDataStatusLabel,\n} from "@/src/lib/live-watchlist/live-watchlist-labels";', 'import { WatchlistLiveDataStatus, watchlistPriceNote } from "./watchlist-price-status";');
    replace('function WatchlistTickerTable({\n  ariaLabel,\n  symbols,', 'function WatchlistTickerTable({\n  ariaLabel,\n  symbols,\n  marketDataStatus,');
    replace('  symbols: LiveWatchlistListSymbol[];\n', '  symbols: LiveWatchlistListSymbol[];\n  marketDataStatus: LiveWatchlistMarketDataStatus;\n');
    replace('Price <small className="watchlist-price-delay-note">(delayed 15 sec)</small>', 'Price {marketDataStatus === "live" ? <small className="watchlist-price-delay-note">(delayed 15 sec)</small> : null}');
    replace('<span>Updated</span>', '<span>Price time</span>');
    replace('data-mobile-label="Price (delayed 15 sec)">\n              {formatPrice(symbol.latestPrice)}', 'data-mobile-label={marketDataStatus === "live" ? "Price (delayed 15 sec)" : "Price"}>\n              {formatPrice(symbol.latestPrice)}\n              {marketDataStatus !== "live" ? <small className="watchlist-price-delay-note" style={{ display: "block" }}>{watchlistPriceNote(symbol, marketDataStatus)}</small> : null}');
    replace('data-mobile-label="Updated" style={watchlistTimeCellStyle}>\n              {formatTime(symbol.updatedAt)}', 'data-mobile-label="Price time" style={watchlistTimeCellStyle}>\n              {symbol.latestPriceSource === "ticker" && symbol.latestPriceObservedAt ? formatDateTime(symbol.latestPriceObservedAt) : "Unavailable"}');
    replace('function WatchlistDetailCards({ symbol }: { symbol: LiveWatchlistSymbolState })', 'function WatchlistDetailCards({ symbol, marketDataStatus = "offline" }: { symbol: LiveWatchlistSymbolState; marketDataStatus?: LiveWatchlistMarketDataStatus })');
    replace('fullLadderCard={symbol.cards.fullLadder}\n        symbol={symbol}', 'fullLadderCard={symbol.cards.fullLadder}\n        symbol={symbol}\n        priceNote={watchlistPriceNote(symbol, marketDataStatus)}\n        priceNoteOwnLine={marketDataStatus !== "live"}\n        showMeta={false}\n        showOuterMeta={false}');
    replace('const [marketDataUpdatedAt, setMarketDataUpdatedAt]', 'const [, setMarketDataUpdatedAt]');
    replace('<span\n            data-market-data-status={marketDataStatus}\n            title={marketDataUpdatedAt ? `Updated ${formatDateTime(marketDataUpdatedAt)}` : undefined}\n          >\n            {formatMarketDataStatusLabel(marketDataStatus)}\n          </span>', '<WatchlistLiveDataStatus status={marketDataStatus} />');
    next = next.replace(/<WatchlistTickerTable\b/g, '<WatchlistTickerTable marketDataStatus={marketDataStatus}');
    replace('          <span>Price {formatPrice(symbol.latestPrice)}</span>\n','');
    replace('          <span>Updated {formatTime(symbol.updatedAt)}</span>\n          <span data-market-data-status={marketDataStatus}>\n            {formatMarketDataStatusLabel(marketDataStatus)}\n          </span>', '          <WatchlistLiveDataStatus status={marketDataStatus} />');
    replace('<WatchlistDetailCards symbol={symbol} />', '<WatchlistDetailCards symbol={symbol} marketDataStatus={marketDataStatus} />');
  } else if (file.endsWith('live-watchlist-list.ts')) {
    replace('"latestPriceObservedAt" | "marketDataRevision"', '"latestPriceObservedAt" | "latestPriceSource" | "marketDataRevision"');
    replace('latestPriceObservedAt: state.latestPriceObservedAt,', 'latestPriceObservedAt: state.latestPriceObservedAt,\n    latestPriceSource: state.latestPriceSource,');
  } else if (file.endsWith('potential-path-levels-card.tsx')) {
    // The legacy overnight record has checkedAt only, not provider quote time.
    // Do not mislabel its retrieval time as the time the price traded.
    replace('<strong>Overnight price: ${formatPrice(overnight.price)} · Checked {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(new Date(overnight.checkedAt))} ET</strong>', '<strong>Not live · Price time unavailable</strong>');
  } else {
    replace('Price and market data can continue updating while the published analysis remains unchanged.', 'Price and market data can continue updating while the published analysis remains unchanged. Green Live data: On means the feed is on; red Off means it is not live. When Off, the price note shows the last available price time in Eastern Time, not the post or page update time, and the delayed-price label is hidden. If the price time is unavailable, the card says so.');
  }
  const before=path.join(folder,'before'),after=path.join(folder,'after');
  fs.writeFileSync(before,original);fs.writeFileSync(after,next);
  const result=cp.spawnSync('git',['diff','--no-index','--no-ext-diff','--',before,after],{encoding:'utf8'});
  if(result.status!==1) throw Error(result.stderr || 'Expected diff');
  const lines=result.stdout.split('\n');
  lines[0]=`diff --git a/${file} b/${file}`;
  const a=lines.findIndex(x=>x.startsWith('--- ')), b=lines.findIndex(x=>x.startsWith('+++ '));
  lines[a]=`--- a/${file}`;lines[b]=`+++ b/${file}`;
  patch+=lines.join('\n');
}
fs.writeFileSync('docs/migration/watchlist-price-time.patch',patch);
console.log('Generated narrow patch against '+base+'; original files preserved.');
