// Capture the actual selected Demo account. No login, selection or data mutations.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const sharp = require('sharp');
const pages = {
  day: '', trades: '/trades', 'trend-momentum': '/trend-momentum',
  'entry-exit': '/entry-exit', 'mfe-mae': '/mfe-mae',
  'green-to-red': '/green-to-red', 'scaling-out': '/scaling-out', 'candle-patterns': '/candle-patterns',
};
async function main() {
  const origin = new URL(process.env.DEMO_CAPTURE_ORIGIN || '');
  if (origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password ||
      !(origin.protocol === 'https:' || origin.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(origin.hostname))) throw Error('A plain HTTPS app origin or loopback origin is required.');
  const appearance = process.env.DEMO_CAPTURE_APPEARANCE;
  if (!['light', 'dark'].includes(appearance)) throw Error('Choose the actual selected appearance: light or dark.');
  const stateFile = process.env.DEMO_CAPTURE_STORAGE_STATE;
  if (stateFile && !path.isAbsolute(stateFile)) throw Error('Use an absolute private browser state path.');
  const output = path.resolve('public/demo-previews/trade-analyzer-analysis');
  fs.mkdirSync(output, { recursive: true });
  const manifestPath = path.join(output, 'manifest.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { version: 1, pages: {} };
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [view, suffix] of Object.entries(pages)) {
      const pair = {};
      for (const [size, width] of [['desktop', 1440], ['mobile', 390]]) {
        const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1,
          ...(stateFile ? { storageState: stateFile } : {}) });
        // Never send credentials off-origin or submit data/account/provider actions.
        await context.route('**/*', async route => {
          const request = route.request();
          const target = new URL(request.url());
          if (target.origin !== origin.origin || !['GET', 'HEAD'].includes(request.method())) return route.abort();
          const headers = { ...request.headers() };
          if (origin.hostname.endsWith('.app.github.dev') && process.env.GITHUB_TOKEN) headers['X-Github-Token'] = process.env.GITHUB_TOKEN;
          return route.continue({ headers });
        });
        const page = await context.newPage();
        const routePath = '/analytics/trade-analyzer/day' + suffix;
        const response = await page.goto(new URL(routePath, origin).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
        if (response?.status() !== 200 || new URL(page.url()).pathname !== routePath) throw Error('Capture source is not an authenticated Analysis page.');
        await page.getByText('Viewing demo data', { exact: true }).waitFor({ timeout: 30000 });
        const target = page.locator('[data-traderlink-platform-dashboard-page]');
        await target.waitFor({ timeout: 30000 });
        if (await target.getByText('Unlock Trade Analyzer Analysis', { exact: true }).count()) throw Error('Refusing to capture a restricted preview instead of the actual Demo UI.');
        const mode = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
        if (mode !== appearance) throw Error('Source appearance does not match the requested theme. Change it in the actual Demo session before capture.');
        await page.evaluate(() => document.fonts.ready);
        const box = await target.boundingBox();
        if (!box || box.height < 200 || box.height > 16000) throw Error('Demo content has invalid capture dimensions.');
        const png = await target.screenshot({ animations: 'disabled', timeout: 30000 });
        const webp = await sharp(png).webp({ quality: 82, effort: 5 }).toBuffer();
        if (webp.length > 1024 * 1024) throw Error('Capture exceeds the one-megabyte image budget.');
        const metadata = await sharp(webp).metadata();
        const filename = `${view}-${appearance}-${size}.webp`;
        fs.writeFileSync(path.join(output, filename), webp);
        pair[size] = { src: '/demo-previews/trade-analyzer-analysis/' + filename,
          width: metadata.width, height: metadata.height, sha256: crypto.createHash('sha256').update(webp).digest('hex') };
        console.log(`CAPTURED ${view} ${appearance} ${size}`);
        await context.close();
      }
      manifest.pages[view] = { ...manifest.pages[view], [appearance]: pair };
    }
    // Publish the manifest only after every capture in this theme succeeds.
    manifest.version = 1;
    manifest.capturedAt = new Date().toISOString();
    manifest.demoAccountVerified = true;
    fs.writeFileSync(manifestPath + '.tmp', JSON.stringify(manifest, null, 2) + '\n');
    fs.renameSync(manifestPath + '.tmp', manifestPath);
  } finally { await browser.close(); }
}
main().catch(error => { console.error('CAPTURE_FAILED: ' + error.message.split('\n')[0]); process.exitCode = 1; });
