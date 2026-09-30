// Build a frozen public artifact from the owner-selected, rendered member page.
// Input is a browser-exported DOM capture, not invented market data. Never read
// auth cookies, React payloads, admin state, or unpublished analysis.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');
const requireApp = createRequire('C:/Users/jerac/Documents/TraderLink/traderlink-platform/package.json');
const postcss = requireApp('postcss');
const root = path.resolve(__dirname, '../..');
const capture = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const homepageRef = process.argv[3];
if (capture.source !== 'https://app.traderslink.pro/watchlist/CNTB' || !homepageRef) throw Error('Expected owner-selected CNTB capture and homepage commit');
if (!capture.html.includes('data-card-label="Indicators"') || /<script|<iframe|\son\w+=/i.test(capture.html)) throw Error('Invalid capture');
const output = path.join(root, 'public/watchlist-preview');
fs.mkdirSync(output, { recursive: true });

async function main() {
  let css = '';
  for (const url of capture.styles) {
    if (!url.startsWith('https://app.traderslink.pro/_next/static/css/')) throw Error('Unexpected stylesheet source');
    const response = await fetch(url);
    if (!response.ok) throw Error(`Stylesheet unavailable: ${response.status}`);
    css += await response.text();
  }
  // Preserve the page's own responsive rules. Freeze fonts alongside the CSS so
  // a later deployment cannot break this dated preview's asset references.
  let fontNumber = 0;
  for (const match of [...css.matchAll(/url\(([^)]+)\)/g)]) {
    const original = match[1].replace(/^['"]|['"]$/g, '');
    if (original.startsWith('data:')) continue;
    const url = new URL(original, capture.styles[0]).href;
    if (!/\.(woff2?|ttf)(?:\?|$)/.test(url)) {
      css = css.replaceAll(match[0], 'none');
      continue;
    }
    const filename = `font-${fontNumber++}.${url.match(/\.(woff2?|ttf)/)[1]}`;
    const response = await fetch(url);
    if (!response.ok) throw Error('Preview font unavailable');
    fs.writeFileSync(path.join(output, filename), Buffer.from(await response.arrayBuffer()));
    css = css.replaceAll(match[0], `url("./${filename}")`);
  }
  fs.writeFileSync(path.join(output, 'cntb.css'), css);
  // The preview must never say that its frozen prices are live.
  let html = capture.html.replace(/<span style="border:1px solid #15803d">Live data: <strong style="color:#15803d">On<\/strong><\/span>/, '<span>Not live data</span>')
    .replaceAll('(delayed 15 sec)', '(preview price)');
  html = html.replace(/<a\b([^>]*)>/g, (_, attributes) => `<span${attributes.replace(/\s(?:href|target|rel)="[^"]*"/g, '')}>`).replaceAll('</a>', '</span>');
  css += '\nbody{font-weight:400;font-size:1rem;line-height:1.5;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}\n';
  fs.writeFileSync(path.join(output, 'cntb.css'), css);
  fs.writeFileSync(path.join(output, 'cntb.html'), `<!doctype html><html lang="en" class="__variable_246ccd __variable_c29908"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'none'; script-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>CNTB dated Watchlist preview</title><link rel="stylesheet" href="./cntb.css"><style>html,body{margin:0;height:auto;min-height:0;background:#f4f7fb}body{font-family:var(--font-geist-sans),Arial,Helvetica,sans-serif}.academy-shell{min-height:0}*,*::before,*::after{box-sizing:border-box}</style></head><body><div class="academy-shell" data-academy-theme="light"><div class="academy-container watchlist-container">${html}</div></div></body></html>`);
  const home = execFileSync('git', ['show', `${homepageRef}:static-landing-site/index.html`], { cwd: root, encoding: 'utf8', maxBuffer: 2_000_000 });
  const resolveLinks = value => value.replace(/(href|src)="([^"]+)"/g, (_, key, url) => `${key}="${new URL(url, 'https://traderslink.pro/').href}"`);
  const header = resolveLinks(home.match(/<header class="tl2-header">[\s\S]*?<\/header>/)[0]);
  const footer = resolveLinks(home.match(/<footer\b[\s\S]*?<\/footer>/)[0]);
  const shellCss = postcss.parse(home.match(/<style>([\s\S]*?)<\/style>/)[1]);
  const shellSelector = /\.tl2-(?:header|logo|nav|features-|menu-|account-link|legal)|\.seo-footer-links/;
  shellCss.walkRules(rule => {
    const selectors = rule.selectors.filter(selector => shellSelector.test(selector) || selector === '#traderslink-homepage-review-v2 *' || /#traderslink-homepage-review-v2 [ab].*:focus-visible/.test(selector));
    if (!selectors.length) rule.remove();
    else rule.selector = selectors.map(selector => selector.startsWith('#traderslink-homepage-review-v2')
      ? selector.replaceAll('#traderslink-homepage-review-v2', '.watchlist-public-shell')
      : `.watchlist-public-shell ${selector}`).join(',');
  });
  shellCss.walkAtRules(rule => { if (!rule.nodes?.length || rule.name.includes('keyframes')) rule.remove(); });
  const generated = path.join(root, 'app/watchlist/watchlist-homepage-shell.generated.json');
  fs.writeFileSync(generated, JSON.stringify({ source: 'https://traderslink.pro/', commit: homepageRef, header, footer, css: shellCss.toString() }, null, 2)+'\n');
  fs.writeFileSync(path.join(output, 'provenance.json'), JSON.stringify({ source: capture.source, capturedAt: capture.capturedAt, boundary: 'Ticker Details through Indicators', homepageRef, liveRequests: false }, null, 2)+'\n');
  console.log('Generated CNTB rendered-page preview and original homepage shell. No application data changed.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
