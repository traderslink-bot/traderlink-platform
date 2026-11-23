/** Current Platform-injected access controls; isolated DOM, synthetic saved values, no real requests. */
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const moduleSource = fs.readFileSync('src/modules/watchlist/server/runtime/watchlist-premium-control.ts', 'utf8');
const compiled = ts.transpileModule(moduleSource, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true });
assert.equal(compiled.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
const exportsObject = {};
vm.runInNewContext(compiled.outputText, { exports: exportsObject, module: { exports: exportsObject } });
const script = exportsObject.WATCHLIST_PREMIUM_CONTROL.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const keys = ['ticker', 'analysis', 'levels', 'indicators', 'row', 'added'];
const labels = ['Show ticker to free members', 'Show analysis to free members', 'Show support & resistance to free members', 'Show Indicator card to free members', 'Hide row from members without paid access', 'Show Added date for hidden ticker'];
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
async function settle(test) { for (let n = 0; n < 30; n++) { await tick(); if (test()) return; } throw Error('Synthetic control did not settle'); }

async function fixture(saved) {
  const dom = new JSDOM('<div class="watchlist-access-controls"></div>', { runScripts: 'outside-only', url: 'https://example.test' });
  const w = dom.window, writes = [], reads = [];
  const failures = { loseAck: false, failReadback: false };
  w.AbortSignal = AbortSignal;
  w.fetch = async (url, options) => {
    if (options.method === 'POST') {
      const body = JSON.parse(options.body); writes.push(body); saved[body.control] = body.premiumOnly;
      if (failures.loseAck) { failures.loseAck = false; return { ok: false, json: async () => ({ error: 'Lost acknowledgement' }) }; }
      return { ok: true, json: async () => ({ premiumOnly: saved[body.control] }) };
    }
    const control = new URL(url, 'https://example.test').searchParams.get('control'); reads.push(control);
    if (failures.failReadback) return { ok: false, json: async () => ({ error: 'Read unavailable' }) };
    return { ok: true, json: async () => control === 'all' ? { settings: { ...saved } } : { premiumOnly: saved[control] } };
  };
  w.eval(script);
  const container = w.document.querySelector('div');
  const mount = () => w.watchlistPremiumControl('TEST', container);
  mount();
  const inputs = () => [...container.querySelectorAll('input')];
  await settle(() => inputs().every(input => !input.disabled));
  return { dom, w, container, saved, writes, reads, failures, inputs, mount };
}

async function browserChecks() {
  const { execFileSync } = require('node:child_process');
  const { createHash } = require('node:crypto');
  const { chromium } = require('@playwright/test');
  const path = require('node:path'), os = require('node:os');
  const runtime = path.resolve('../watchlist-alpaca-runtime-qa');
  const revision = 'ca04dcf7b6d9b254d54720887a500e63bc828d2d';
  const row = execFileSync('git', ['show', revision + ':src/runtime/manual-watchlist-row-review.ts'], { cwd: runtime, encoding: 'utf8' });
  const pageSource = execFileSync('git', ['show', revision + ':src/runtime/manual-watchlist-page.ts'], { cwd: runtime, encoding: 'utf8' });
  assert.equal(createHash('sha256').update(row).digest('hex'), 'b1e1949cd52b9ca1710de7c0797a7549cbc0092ad7f7b8455b9c1d8e3f9ebe93');
  assert(row.includes('function attach(entry, actions, more = actions, options = actions, header = actions, listing = actions) {'));
  const css = pageSource.match(/<style>([\s\S]*?)<\/style>/)[1] + row.match(/<style>([\s\S]*?)<\/style>/)[1];
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'watchlist-reveal-controls-'));
  const browser = await chromium.launch({ headless: true });
  let cases = 0, actualRequests = 0;
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => { actualRequests++; return route.abort(); });
    for (const [name, width, height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390]]) {
      await page.setViewportSize({ width, height });
      await page.setContent('<style>' + css + '</style><main><ul><li class="watchlist-control-row"><div class="entry-actions watchlist-grouped-actions"><div class="watchlist-action-group watchlist-access-controls"></div></div></li></ul></main>');
      await page.evaluate(() => { const saved = { ticker:true,analysis:true,levels:true,indicators:true,row:false,added:false }; window.controlWrites=[]; window.fetch=async(url,o)=>{ if(o.method==='POST'){const b=JSON.parse(o.body);window.controlWrites.push(b);saved[b.control]=b.premiumOnly;return{ok:true,json:async()=>({premiumOnly:b.premiumOnly})};}return{ok:true,json:async()=>({settings:{...saved}})};}; });
      await page.addScriptTag({ content: script });
      await page.evaluate(() => window.watchlistPremiumControl('TEST', document.querySelector('.watchlist-access-controls')));
      await page.getByText('Premium only', { exact: true }).click();
      const first = page.getByRole('checkbox', { name: 'TEST Show ticker to free members', exact:true });
      await first.waitFor();
      assert.equal(await first.isChecked(), false);
      await first.check();
      await page.waitForFunction(() => window.controlWrites.length === 1 && !document.querySelector('input').disabled);
      assert.equal(await first.isChecked(), true);
      assert.equal(await page.evaluate(() => window.controlWrites[0].premiumOnly), false);
      await first.uncheck();
      await page.waitForFunction(() => window.controlWrites.length === 2 && !document.querySelector('input').disabled);
      assert.equal(await page.evaluate(() => window.controlWrites[1].premiumOnly), true);
      for (const label of labels) {
        const input = page.getByRole('checkbox', { name:'TEST '+label,exact:true });
        await input.scrollIntoViewIfNeeded(); const box = await input.locator('..').boundingBox();
        assert(box && box.x >= 0 && box.x + box.width <= width + 1, name+' clipped label');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+1), false);
      await page.screenshot({ path: path.join(output,name+'.png'), fullPage:true }); cases++;
    }
    assert.equal(actualRequests,0);
    console.log(JSON.stringify({ browserControlCases:cases, runtimeStyleSource:revision, output, actualRequests }));
  } finally { await browser.close(); }
}

(async () => {
  let cases = 0;
  for (const restricted of [true, false]) {
    const f = await fixture({ ticker: restricted, analysis: restricted, levels: restricted, indicators: restricted, row: true, added: true });
    try {
      assert.equal(f.inputs().length, 6);
      assert.deepEqual(f.inputs().map(input => input.getAttribute('aria-label')), labels.map(label => 'TEST ' + label));
      assert.deepEqual(f.inputs().map(input => input.checked), [!restricted, !restricted, !restricted, !restricted, true, true]);
      assert.equal(f.writes.length, 0, 'Opening/reloading controls must never rewrite saved choices');
      assert.deepEqual(f.reads, ['all']);
      for (let index = 0; index < 6; index++) {
        const input = f.inputs()[index]; input.click();
        await settle(() => !input.disabled);
        assert.equal(f.writes.at(-1).control, keys[index]);
        assert.equal(f.writes.at(-1).premiumOnly, index < 4 ? !restricted : false);
        assert.equal(input.checked, index < 4 ? restricted : false);
        cases++;
      }
      const details = f.container.querySelector('details'); details.open = true; details.dispatchEvent(new f.w.Event('toggle'));
      f.container.replaceChildren(); f.mount(); f.mount();
      assert.equal(f.container.querySelectorAll('details').length, 1);
      assert.equal(f.container.querySelector('details').open, true);
      assert.deepEqual(f.inputs().map(input => input.checked), [restricted, restricted, restricted, restricted, false, false]);
      assert.equal(f.writes.length, 6);
      cases++;
    } finally { f.dom.window.close(); }
  }
  for (const control of keys.slice(0, 4)) for (const unavailable of [false, true]) {
    const f = await fixture({ ticker: true, analysis: true, levels: true, indicators: true, row: false, added: false });
    try {
      const input = f.inputs()[keys.indexOf(control)];
      f.failures.loseAck = true; f.failures.failReadback = unavailable;
      input.click(); await settle(() => !input.disabled);
      assert.equal(f.saved[control], false); assert.equal(f.writes.length, 1);
      assert.equal(input.indeterminate, unavailable);
      if (!unavailable) assert.equal(input.checked, true);
      else {
        assert.equal(input.checked, false); assert(f.container.textContent.includes('saved setting is unknown'));
        f.failures.failReadback = false;
        f.container.replaceChildren(); f.mount();
        await settle(() => f.inputs().every(input => !input.disabled));
        assert.equal(f.inputs()[keys.indexOf(control)].checked, true);
        assert.equal(f.inputs()[keys.indexOf(control)].indeterminate, false);
        assert.equal(f.writes.length, 1, 'Recovery is read-only; do not repeat the mutation');
      }
      cases++;
    } finally { f.dom.window.close(); }
  }
  console.log(JSON.stringify({ isolatedControlCases: cases, realRequests: 0, savedMeaning: 'premiumOnly unchanged', rowAndAdded: 'not inverted' }));
  if(process.argv.includes('--browser')) await browserChecks();
})().catch(error => { console.error(error); process.exitCode = 1; });
