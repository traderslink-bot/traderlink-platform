// Offline component/capture check. Every HTTP request is intercepted; no app or provider starts.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { build } = require('esbuild');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'artifacts/watchlist-manual-loss');

(async () => {
  console.log(`Offline loss browser check PID ${process.pid}`);
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {ThemeProvider} from '@mui/material/styles'; import CssBaseline from '@mui/material/CssBaseline';
      import {createTraderMaterialTheme} from './app/mui-theme';
      import {WatchlistManualLossPost} from './app/(dashboard)/admin/watchlist/watchlist-manual-loss-post';
      let root; window.mountLoss=(mode='light')=>{root?.unmount();root=createRoot(document.getElementById('root'));
        root.render(<ThemeProvider theme={createTraderMaterialTheme(mode)}><CssBaseline/><WatchlistManualLossPost symbol="TEST" onClose={()=>{root.unmount();document.getElementById('closed').textContent='closed';}}/></ThemeProvider>);}; window.mountLoss();`,
      loader: 'tsx', resolveDir: root,
    }, bundle: true, write: false, platform: 'browser', format: 'iife', logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"', 'process.env.__NEXT_IMAGE_OPTS': JSON.stringify(require('next/dist/shared/lib/image-config').imageConfigDefault) },
  });
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
    const errors = [], requests = [], posts = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', entry => { if (entry.type() === 'error') console.error('Browser:', entry.text()); });
    let state = 'sent';
    await page.route('**/*', async route => {
      const request = route.request(); requests.push(request.url());
      if (request.url() === 'https://loss-preview.invalid/') return route.fulfill({ contentType: 'text/html', body: '<div id="root"></div><div id="closed"></div>' });
      if (request.url() === 'https://loss-preview.invalid/api/admin/watchlist/manual-loss-post' && request.method() === 'POST') {
        const form = await new Response(request.postDataBuffer(), { headers: { 'content-type': request.headers()['content-type'] } }).formData();
        posts.push({ fields: Object.fromEntries(['symbol', 'requestId', 'message', 'buyPrice', 'sellPrice', 'notes'].map(k => [k, form.get(k)])), png: Buffer.from(await form.get('image').arrayBuffer()) });
        return route.fulfill({ contentType: 'application/json', status: state === 'html-error' ? 502 : 200,
          body: state === 'html-error' ? '<html>gateway failed</html>' : JSON.stringify({ state, message: state === 'sent' ? 'Posted to Discord.' : 'Please wait before retrying.', retryAt: state === 'retry' ? Date.now() + 1000 : undefined }) });
      }
      throw Error(`Unexpected network request: ${request.url()}`);
    });
    await page.goto('https://loss-preview.invalid/');
    await page.addStyleTag({ content: fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8').replace('@import "tailwindcss";', '') });
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const buy = () => page.getByRole('textbox', { name: 'Entry price ($)', exact: true });
    const sell = () => page.getByRole('textbox', { name: 'Exit price ($)', exact: true });
    const notes = () => page.getByRole('textbox', { name: 'Notes (optional)', exact: true });
    const image = () => page.getByRole('img', { name: 'TEST trade loss image to post' });
    const prepare = async () => {
      await page.getByRole('button', { name: 'Preview image', exact: true }).click();
      try { await image().waitFor({ timeout: 10000 }); await image().evaluate(img => img.decode()); }
      catch (error) { console.error(await page.locator('body').innerText(), errors); throw error; }
    };
    await buy().waitFor(); assert.equal(await buy().inputValue(), ''); assert.equal(await sell().inputValue(), '');
    assert.equal(requests.length, 1, 'Opening has no market/analysis/Gain request');
    await buy().fill('2.00'); await sell().fill('1.50'); await notes().fill('Stopped out.\nWaited for the next setup.');
    await prepare();
    const originalUrl = await image().getAttribute('src');
    await image().screenshot({ path: path.join(output, 'loss-card-desktop.png') });
    await page.screenshot({ path: path.join(output, 'loss-dialog-desktop.png') });
    await page.getByRole('button', { name: 'Back to edit' }).click(); await sell().fill('1.00'); await prepare();
    assert.notEqual(await image().getAttribute('src'), originalUrl);
    await page.getByRole('textbox', { name: 'Message (optional)' }).fill('My trade recap');
    const previewBytes = Buffer.from(await image().evaluate(async img => Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer()))));
    await page.getByRole('button', { name: 'Send to Discord' }).click();
    await page.getByText('Posted to Discord.', { exact: true }).waitFor();
    assert.equal(posts.length, 1); assert.equal(posts[0].fields.buyPrice, '2'); assert.equal(posts[0].fields.sellPrice, '1');
    assert.equal(posts[0].fields.message, 'My trade recap'); assert.deepEqual(posts[0].png, previewBytes);
    assert.equal(await page.getByRole('button', { name: 'Send to Discord' }).isDisabled(), true);
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.mountLoss('dark')); await buy().waitFor();
    assert.equal(await buy().inputValue(), ''); assert.equal(await notes().inputValue(), '');
    await buy().fill('0'); await sell().fill('0');
    assert.equal(await page.getByRole('button', { name: 'Preview image', exact: true }).isDisabled(), true);
    await page.getByText('Entry price must be greater than zero.', { exact: true }).waitFor();
    await buy().fill('.125'); await sell().fill('.10'); await notes().fill('Manual note — red loss card, no automatic dates.');
    const buyBox = await buy().boundingBox(), sellBox = await sell().boundingBox();
    assert.ok(sellBox.y > buyBox.y + buyBox.height, 'mobile fields stack');
    await prepare();
    const dialog = page.getByRole('dialog');
    assert.equal(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth + 1), true);
    await image().screenshot({ path: path.join(output, 'loss-card-mobile.png') });
    await page.screenshot({ path: path.join(output, 'loss-dialog-mobile-dark.png') });
    state = 'retry'; await page.getByRole('button', { name: 'Send to Discord' }).click();
    await page.getByText(/Please wait before retrying/).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Back to edit' }).isDisabled(), true);
    state = 'sent'; await page.getByRole('button', { name: 'Send to Discord' }).click();
    await page.getByText('Posted to Discord.', { exact: true }).waitFor();
    assert.equal(posts[1].fields.requestId, posts[2].fields.requestId); assert.deepEqual(posts[1].png, posts[2].png);
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await page.evaluate(() => window.mountLoss('light')); await buy().waitFor();
    await buy().fill('1'); await sell().fill('.99'); await prepare(); state = 'html-error';
    await page.getByRole('button', { name: 'Send to Discord' }).click();
    await page.getByText('Delivery could not be confirmed. Check Discord before posting again.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Send to Discord' }).isDisabled(), true);
    assert.equal(posts.length, 4, 'No automatic resend');
    assert.deepEqual(errors, []);
    console.log('PASS: real editor/capture; empty manual fields/no GET; exact preview PNG sent to mock; edit recapture; mobile stacking/dark dialog; 429 identity reuse; HTML gateway uncertainty/no resend. All requests intercepted.');
    console.log(`Synthetic review screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
