const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
(async () => {
  const root = path.resolve('public/demo-previews/trade-analyzer-analysis');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  if (manifest.version !== 2 || manifest.demoAccountVerified !== true) throw Error('Actual Demo captures are not ready.');
  let count = 0, sections = 0;
  for (const view of ['day', 'trades', 'trend-momentum', 'entry-exit', 'mfe-mae', 'green-to-red', 'scaling-out', 'candle-patterns']) {
    for (const theme of ['light', 'dark']) {
      const pair = manifest.pages[view]?.[theme];
      if (!pair?.desktop?.sections?.length || pair.desktop.sections.length !== pair.mobile?.sections?.length) throw Error('Unpaired responsive sections: ' + view);
      for (const size of ['desktop', 'mobile']) {
        const item = pair[size];
        let top = 0;
        for (const [index, section] of item.sections.entries()) {
          const filename = `${view}-${theme}-${size}-section-${String(index + 1).padStart(2, '0')}.webp`;
          if (section.src !== '/demo-previews/trade-analyzer-analysis/' + filename || section.top !== top || section.width !== item.width || section.height < 1 || section.height > 2000) throw Error('Noncontiguous or invalid section: ' + filename);
          const file = path.join(root, filename);
          if (fs.lstatSync(file).isSymbolicLink()) throw Error('Snapshot symlinks are not accepted.');
          const bytes = fs.readFileSync(file), metadata = await sharp(bytes).metadata();
          if (metadata.format !== 'webp' || metadata.width !== section.width || metadata.height !== section.height || bytes.length > 1024 * 1024 || crypto.createHash('sha256').update(bytes).digest('hex') !== section.sha256) throw Error('Snapshot validation failed: ' + filename);
          top += section.height;
          sections++;
        }
        if (top !== item.height) throw Error('Capture is cropped or duplicated: ' + view);
        count++;
      }
    }
  }
  console.log('PASS ' + count + ' complete Demo screenshots in ' + sections + ' contiguous WebP sections');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
