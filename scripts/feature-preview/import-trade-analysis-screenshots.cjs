// Import owner-confirmed captures only; no screenshot generation or substitute data.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
(async () => {
  const input = process.argv[2];
  if (!input || !path.isAbsolute(input) || !process.argv.includes('--demo-account-confirmed')) throw Error('Supply an absolute captures folder and --demo-account-confirmed after verifying the source account.');
  const output = path.resolve('public/demo-previews/trade-analyzer-analysis');
  const manifest = { version: 2, demoAccountVerified: true, capturedAt: new Date().toISOString(), pages: {} };
  const staged = [];
  for (const view of ['day', 'trades', 'trend-momentum', 'entry-exit', 'mfe-mae', 'green-to-red', 'scaling-out', 'candle-patterns']) {
    manifest.pages[view] = {};
    for (const theme of ['light', 'dark']) {
      manifest.pages[view][theme] = {};
      const captures = {};
      for (const size of ['desktop', 'mobile']) {
        const name = `${view}-${theme}-${size}`;
        const source = ['png', 'webp'].map(extension => path.join(input, name + '.' + extension)).find(file => fs.existsSync(file));
        if (!source || fs.lstatSync(source).isSymbolicLink()) throw Error('Missing regular capture: ' + name);
        const metadata = await sharp(source).metadata();
        if (!metadata.width || !metadata.height || metadata.height > 40000 || metadata.width < 300 ||
            (size === 'mobile' ? metadata.width > 600 : metadata.width < 800)) throw Error('Unexpected capture dimensions: ' + name);
        captures[size] = { source, width: metadata.width, height: metadata.height };
      }
      // Pair responsive slices by count; each source pixel belongs to exactly one slice.
      const count = Math.max(...Object.values(captures).map(item => Math.ceil(item.height / 2000)));
      for (const [size, capture] of Object.entries(captures)) {
        const name = `${view}-${theme}-${size}`;
        const sections = [];
        for (let index = 0; index < count; index++) {
          const top = Math.floor(index * capture.height / count);
          const height = Math.floor((index + 1) * capture.height / count) - top;
          const bytes = await sharp(capture.source).extract({ left: 0, top, width: capture.width, height }).webp({ quality: 82, effort: 5 }).toBuffer();
          if (bytes.length > 1024 * 1024) throw Error('Section exceeds one-megabyte budget: ' + name);
          const filename = `${name}-section-${String(index + 1).padStart(2, '0')}.webp`;
          staged.push({ filename, bytes });
          sections.push({ src: '/demo-previews/trade-analyzer-analysis/' + filename, top,
            width: capture.width, height, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
        }
        manifest.pages[view][theme][size] = { width: capture.width, height: capture.height, sections };
      }
    }
  }
  fs.mkdirSync(output, { recursive: true });
  for (const { filename, bytes } of staged) fs.writeFileSync(path.join(output, filename), bytes);
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const current = new Set(staged.map(item => item.filename));
  // Remove only superseded, generated capture files in this owned output directory.
  for (const filename of fs.readdirSync(output)) {
    if (/^(day|trades|trend-momentum|entry-exit|mfe-mae|green-to-red|scaling-out|candle-patterns)-(light|dark)-(desktop|mobile)(-section-\d{2})?\.(png|webp)$/.test(filename) && !current.has(filename)) fs.unlinkSync(path.join(output, filename));
  }
  console.log('IMPORTED ' + staged.length + ' WebP sections from 32 owner-confirmed Demo screenshots');
})().catch(error => { console.error(error.message.split('\n')[0]); process.exitCode = 1; });
