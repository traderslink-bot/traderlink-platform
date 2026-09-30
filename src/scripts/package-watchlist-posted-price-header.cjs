const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const parent = 'e816ac782262fb2ed3e2a57cc9fd347851e10b02';
const git = (args, input, index) => execFileSync('git', args, { cwd: root, input, encoding: 'utf8', maxBuffer: 2_000_000, env: { ...process.env, ...(index ? { GIT_INDEX_FILE: index } : {}) } }).trimEnd();
const file = 'app/watchlist/live-watchlist-client.tsx';
const original = git(['show', `${parent}:${file}`]);
const anchor = '          <span>Posted {formatDateTime(symbol.firstPostedAt)}</span>';
assert.equal(original.split(anchor).length, 2);
const addition = `
          {symbol.potentialGain?.postedAt === symbol.firstPostedAt &&
          Number.isFinite(symbol.potentialGain?.startingPrice) &&
          (symbol.potentialGain?.startingPrice ?? 0) > 0 ? (
            <span>Posted at \u0024{formatPrice(symbol.potentialGain!.startingPrice)}</span>
          ) : null}`;
const source = original.replace(anchor, anchor + addition) + '\n';
assert.equal(source.replace(addition, '').trimEnd(), original);
const ts = require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const diagnostics = ts.transpileModule(source, { fileName: file, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).diagnostics;
assert.equal(diagnostics.length, 0, 'JSX syntax must pass');
const help = 'src/modules/help/watchlist-guides.ts';
const helpSource = git(['show', `${parent}:${help}`]);
const helpAnchor = 'Potential Gain keeps the original Watchlist starting price; it does not restart when the analysis changes.';
assert.equal(helpSource.split(helpAnchor).length, 2);
const plan = 'docs/migration/watchlist-public-preview-and-images-plan.md';
const changes = new Map([
  [file, source],
  [help, helpSource.replace(helpAnchor, helpAnchor + ' The ticker-detail header also shows this saved price as Posted at beside the posted date. It is not the current price or a refreshed analysis price.')+'\n'],
  [plan, git(['show', `${parent}:${plan}`])+'\n\nSeptember 30 follow-up: restore the original posted price beside the ticker-detail posted date and Live data status. [Completed source change](watchlist-posted-price-header-progress.md).\n'],
]);
for (const added of ['docs/migration/watchlist-posted-price-header-progress.md', 'src/scripts/package-watchlist-posted-price-header.cjs']) changes.set(added, fs.readFileSync(path.join(root, added), 'utf8'));
console.log(JSON.stringify({ parent, allowlist: [...changes.keys()], verification: 'JSX syntax and exact single-header-only source delta pass' }, null, 2));
if (process.argv.includes('--commit')) {
  const index = path.join(root, 'data/watchlist-posted-price-header.index');
  git(['read-tree', parent], undefined, index);
  for (const [name, content] of changes) {
    const blob = git(['hash-object', '-w', '--stdin'], content, index);
    git(['update-index', '--add', '--cacheinfo', `100644,${blob},${name}`], undefined, index);
  }
  git(['diff', '--cached', '--check', parent], undefined, index);
  const tree = git(['write-tree'], undefined, index);
  const sha = git(['commit-tree', tree, '-p', parent, '-m', 'Show saved original posted price in Watchlist ticker header'], undefined, index);
  git(['update-ref', 'refs/codex/watchlist-posted-price-header', sha], undefined, index);
  console.log(sha);
}
