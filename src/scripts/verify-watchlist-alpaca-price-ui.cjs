// Isolated actual-row rendering; no app server, account, provider or delivery.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { chromium } = require('playwright');

function evaluate(source, extra = {}) {
  const evaluatedModule = { exports: {} };
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', ...Object.keys(extra), js)(require, evaluatedModule, evaluatedModule.exports, ...Object.values(extra));
  return evaluatedModule.exports;
}
const source = fs.readFileSync('app/watchlist/live-watchlist-client.tsx', 'utf8');
const ast = ts.createSourceFile('client.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const extract = name => {
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert(node, `Missing actual function ${name}`);
  return node.getText(ast);
};
const { watchlistPriceNote, WatchlistLiveDataStatus } = evaluate(fs.readFileSync('app/watchlist/watchlist-price-status.tsx', 'utf8'));
const compactRows = Object.fromEntries(['row', 'ticker', 'price', 'added', 'details'].map(x => [x, x]));
const { Table } = evaluate(`${extract('formatPrice')}\n${extract('formatListDateTime')}\n${extract('WatchlistTickerTable')}\nexports.Table=WatchlistTickerTable;`, {
  watchlistPriceNote, compactRows, watchlistTimeCellStyle: { fontSize: '.78rem', lineHeight: 1.35 },
  listDateTimeFormatter: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }),
  Link: ({ href, children, ...props }) => React.createElement('a', { ...props, href }, children),
  getWatchlistCountryFlag: () => null, ReversalAttemptBadge: () => null,
  WatchlistLifecycleBadge: () => null, WatchlistReverseSplitBadge: () => null,
});
const now = Date.now(), symbols = [
  { symbol: 'FRESH', latestPrice: 2.34, latestPriceSource: 'ticker', latestPriceObservedAt: now-573, firstPostedAt: now-3600000 },
  { symbol: 'OLDER', latestPrice: .54, latestPriceSource: 'ticker', latestPriceObservedAt: now-3600000, firstPostedAt: now-7200000 },
  { symbol: 'HIDDEN', premiumTickerHidden: true },
];
const markup = renderToStaticMarkup(React.createElement(Table, {
  ariaLabel: 'Watchlist QA', symbols, marketDataStatus: 'live', reverseSplits: {},
}));
assert(!markup.includes('Price time') && !markup.includes('delayed 15 sec'));
assert(!markup.includes('/watchlist/HIDDEN') && !markup.includes('HIDDEN'));
assert(markup.includes('Access Premium'));
const css = fs.readFileSync('app/globals.css','utf8')+'\n'+fs.readFileSync('app/watchlist/watchlist-compact-rows.module.css','utf8');
const status = renderToStaticMarkup(React.createElement(WatchlistLiveDataStatus, { status: 'live' }));
const output = fs.mkdtempSync('/tmp/watchlist-alpaca-price-ui-');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const cases = [];
  try {
    const page = await browser.newPage();
    await page.route('**/*', r => r.abort());
    await page.setContent(`<html data-academy-theme="light"><head><style>${css}</style></head><body><main style="padding:16px">${status}${markup}</main></body></html>`);
    for (const width of [1440,390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      const dims = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
      assert(dims.width <= dims.viewport+1, JSON.stringify(dims));
      const fresh = page.locator('a[href="/watchlist/FRESH"]'), old = page.locator('a[href="/watchlist/OLDER"]');
      assert(!(await fresh.innerText()).includes('Not live'));
      assert(!(await old.innerText()).includes('Not live'));
      assert.equal(await fresh.locator(':scope > span').count(), 4);
      await fresh.focus(); assert(await fresh.evaluate(e => e === document.activeElement));
      if (width === 390) {
        const price = await fresh.locator('[data-mobile-label="Price"]').boundingBox();
        const added = await fresh.locator('[data-mobile-label="Added"]').boundingBox();
        assert(Math.abs(price.y-added.y) < 2);
      }
      await page.screenshot({ path:path.join(output,`${width}.png`), fullPage:true });
      cases.push({ width, ...dims, fields:4, freshWarning:false, unchangedTradeWarning:false, keyboardFocus:true });
    }
    console.log(JSON.stringify({ cases, screenshots:output, scope:'Actual extracted row and price-status code, real CSS, synthetic data. Next Link/decorative badges stubbed; not authenticated end-to-end acceptance.' }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message); process.exitCode=1; });
