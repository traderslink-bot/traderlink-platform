// Exact-parent, explicit allowlist. Never stage or overwrite concurrent work.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const parent = 'd41134a8d282e3873ac67d96595afc3d00d4e03f';
const root = path.resolve(__dirname, '../..');
const git = (args, input, index) => execFileSync('git', args, { cwd: root, input, encoding: 'utf8', maxBuffer: 4_000_000, env: { ...process.env, ...(index ? { GIT_INDEX_FILE: index } : {}) } }).trimEnd();
const changes = new Map();
for (const file of [
  'app/watchlist/watchlist-public-preview.tsx',
  'app/watchlist/watchlist-public-preview.module.css',
  'app/watchlist/watchlist-captured-page.tsx',
  'app/watchlist/watchlist-homepage-shell.tsx',
  'app/watchlist/watchlist-homepage-shell.generated.json',
  'docs/migration/watchlist-real-page-preview-progress.md',
  'src/scripts/capture-watchlist-public-preview.cjs',
  'src/scripts/package-watchlist-real-preview.cjs',
  'src/scripts/verify-watchlist-real-preview.cjs',
]) changes.set(file, fs.readFileSync(path.join(root, file)));
const page = 'app/watchlist/page.tsx';
changes.set(page, git(['show', `${parent}:${page}`])
  .replace('import { AcademyShell } from "@/app/academy/academy-shell";', 'import { WatchlistHomepageShell } from "./watchlist-homepage-shell";')
  .replace('<AcademyShell forcedTheme="light">', '<WatchlistHomepageShell>')
  .replace('</AcademyShell>', '</WatchlistHomepageShell>')+'\n');
const help = 'src/modules/help/watchlist-guides.ts';
const helpSource = git(['show', `${parent}:${help}`]);
if (!helpSource.includes('a dated BKYI example')) throw Error('Help anchor changed');
changes.set(help, helpSource.replace('a dated BKYI example', 'a dated CNTB detail-page preview')+'\n');
for (const file of ['docs/migration/watchlist-public-preview-and-images-plan.md', 'docs/migration/watchlist-public-preview-and-images-progress.md']) {
  const original = git(['show', `${parent}:${file}`]);
  changes.set(file, original+'\n\n## September 30 — actual CNTB page\n\nThe owner-approved replacement uses the actual rendered CNTB detail page through Indicators, its original responsive layout and normal full-page scrolling, plus the current traderslink.pro homepage header/footer. This supersedes the hand-built BKYI preview. Source implementation complete; hosted visual acceptance remains open. See [current progress](watchlist-real-page-preview-progress.md).\n');
}
for (const name of fs.readdirSync(path.join(root, 'public/watchlist-preview'))) {
  if (!/^(cntb\.(html|css)|font-\d+\.woff2|provenance\.json)$/.test(name)) throw Error('Unexpected preview asset');
  const file = `public/watchlist-preview/${name}`;
  changes.set(file, fs.readFileSync(path.join(root, file)));
}
if (require.main === module) {
  console.log(JSON.stringify({ parent, allowlist: [...changes.keys()] }, null, 2));
  if (process.argv.includes('--commit')) {
    const index = path.join(root, 'data/cntb-real-preview.index');
    git(['read-tree', parent], undefined, index);
    for (const [file, content] of changes) {
      const blob = git(['hash-object', '-w', '--stdin'], content, index);
      git(['update-index', '--add', '--cacheinfo', `100644,${blob},${file}`], undefined, index);
    }
    git(['diff', '--cached', '--check', parent], undefined, index);
    const tree = git(['write-tree'], undefined, index);
    const sha = git(['commit-tree', tree, '-p', parent, '-m', 'Replace Watchlist mock with actual responsive CNTB page preview'], undefined, index);
    git(['update-ref', 'refs/codex/watchlist-real-cntb-preview', sha], undefined, index);
    console.log(`Checkpoint ${sha}`);
  }
}
module.exports = { changes, parent };
