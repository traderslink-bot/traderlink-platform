// Offline actual-component and exact row-CSS check. No app, credentials or providers.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { build } = require('esbuild'), { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
(async () => {
  console.log(`Resistance browser PID ${process.pid}`);
  const bundle = await build({ stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {WatchlistPotentialPathCardArticle} from './app/watchlist/potential-path-levels-card';
    import {historicalResistanceView} from './src/lib/live-watchlist/historical-resistance-view';
    const level=(price,extra={})=>({price,side:'resistance',distancePct:.1,label:String(price),sourceLabel:'intraday',touchCount:2,sourceEvidenceCount:1,...extra});
    const synthetic=price=>level(price,{sourceLabel:'extension',strengthLabel:'weak',touchCount:0,sourceEvidenceCount:0});
    const card={title:'Levels',body:'Resistance:\\n17.29 (intraday)\\n18.50 (premarket high)\\n21.00 (weak, extension)\\n22.00 (weak, extension)\\n23.00 (weak, extension)\\n\\nSupport:\\n15.00 (daily structure)',updatedAt:1000,priceWhenPosted:16.92,source:'level_snapshot'};
    const base={symbol:'SAMPLE',latestPrice:16.92,updatedAt:1000,marketDataStatus:'live',cards:{nearestSupportResistance:card,fullLadder:card},levelMap:{currentPrice:16.92,rangeState:'normal',supportLevels:[level(15,{side:'support'})],resistanceLevels:[level(17.29),level(18.5,{sourceLabel:'premarket high'}),synthetic(21),synthetic(22)],nearestSupport:null,nearestResistance:null,nextStrongSupport:null,nextStrongResistance:null,dataQuality:{status:'limited',availableTimeframes:['daily'],flags:['4h_missing']}}};
    const app=createRoot(document.getElementById('root'));
    window.mount=(mode='light',missing=false)=>{const state=structuredClone(base);if(missing){state.levelMap.resistanceLevels=[];state.levelMap.dataQuality.status='unavailable';state.cards={};}
      const view=historicalResistanceView(state);app.render(<div className="academy-shell" data-academy-theme={mode} style={{padding:16,minHeight:'100vh'}}><div className="watchlist-card-grid"><WatchlistPotentialPathCardArticle symbol={view} card={view.cards.nearestSupportResistance ?? card} fullLadderCard={view.cards.fullLadder}/></div></div>);};window.mount();
  ` }, bundle: true, write: false, outdir: path.join(root, 'artifacts/historical-resistance/bundle'), platform: 'browser', format: 'iife', logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' } });
  const output = path.join(root, 'artifacts/historical-resistance'); fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    const errors = [], unexpected = [];
    page.on('pageerror', error => { errors.push(error.message); console.error('Browser:', error.message); });
    await page.route('**/*', route => {
      if (route.request().url() === 'https://resistance-view.invalid/') return route.fulfill({ contentType: 'text/html', body: '<div id="root"></div>' });
      unexpected.push(route.request().url()); return route.abort();
    });
    await page.goto('https://resistance-view.invalid/');
    await page.addStyleTag({ content: fs.readFileSync(path.join(root, 'node_modules/tailwindcss/preflight.css'), 'utf8') });
    await page.addStyleTag({ content: fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8').replace('@import "tailwindcss";', '') });
    // Next's normal browser bundle supplies its process shim; this isolated
    // harness has no Next server and uses only a synthetic empty environment.
    await page.addScriptTag({ content: 'globalThis.process={env:{NODE_ENV:"production"}};' });
    for (const file of bundle.outputFiles.filter(file => file.path.endsWith('.css'))) await page.addStyleTag({ content: file.text });
    await page.addScriptTag({ content: bundle.outputFiles.find(file => file.path.endsWith('.js')).text });
    await page.getByRole('heading', { name: 'SAMPLE' }).waitFor({ timeout: 10000 });
    await page.getByText('Full ladder', { exact: true }).click();
    const text = await page.locator('body').innerText();
    assert.match(text, /17\.29/); assert.match(text, /18\.50/); assert.match(text, /15\.00/);
    assert.doesNotMatch(text, /21\.00|22\.00|23\.00/); assert.match(text, /No higher historical resistance detected/);
    await page.screenshot({ path: path.join(output, 'levels-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.mount('dark'));
    await page.locator('[data-academy-theme="dark"]').waitFor();
    const overflow = await page.locator('body').evaluate(e => ({ width: e.scrollWidth, viewport: innerWidth, nodes: [...e.querySelectorAll('*')].filter(n => n.getBoundingClientRect().right > innerWidth + 1).map(n => ({ tag: n.tagName, cls: n.className, right: n.getBoundingClientRect().right })).slice(0, 6) }));
    assert.ok(overflow.width <= overflow.viewport + 1, JSON.stringify(overflow));
    await page.screenshot({ path: path.join(output, 'levels-mobile-dark.png'), fullPage: true });
    await page.evaluate(() => window.mount('light', true));
    await page.getByText('Historical resistance data is unavailable.', { exact: true }).waitFor();
    assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);

    // Only the owned Runtime's source stylesheet is read; no Runtime is executed.
    const runtime = path.resolve(root, '../watchlist-gain-runtime/src/runtime');
    const baseCss = fs.readFileSync(path.join(runtime, 'manual-watchlist-page.ts'), 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
    const rowCss = fs.readFileSync(path.join(runtime, 'manual-watchlist-row-review.ts'), 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
    await page.setContent('<style>' + baseCss + '\n' + rowCss + '</style><section><h2>Main Session</h2><ul><li class="watchlist-control-row"><strong>FIRST</strong><span>First ticker controls</span></li><li class="watchlist-control-row"><strong>SECOND</strong><span>Second ticker controls</span></li></ul></section><ul><li id="other">Unrelated list</li></ul>');
    for (const row of await page.locator('li.watchlist-control-row').all()) {
      const style = await row.evaluate(e => { const s = getComputedStyle(e); return { top: s.borderTopWidth, colour: s.borderTopColor, bottom: s.borderBottomWidth, padding: s.paddingTop + '/' + s.paddingBottom }; });
      assert.deepEqual(style, { top: '2px', colour: 'rgb(100, 116, 139)', bottom: '0px', padding: '12px/12px' });
    }
    assert.equal(await page.locator('#other').evaluate(e => getComputedStyle(e).borderTopWidth), '0px');
    await page.screenshot({ path: path.join(output, 'admin-dividers.png') });
    console.log('PASS: actual Potential Path/Full Ladder remove cached projections; observed levels preserved; bounded-history/unavailable copy; desktop/mobile/dark; one 2px slate row top border including first, no padding/bottom/unrelated-list change. No network effects.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
