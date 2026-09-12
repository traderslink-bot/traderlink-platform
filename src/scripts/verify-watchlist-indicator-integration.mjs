// Rehearse only the committed Indicators slice in a disposable index. No checkout,
// branch, commit, publish, deployment or canonical-index modification.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const base = '907971dc6ce49bc41054ef8cee0354ea7c3f8ea6';
const feature = '6397ce01aab7c0ddc4065612c7b403b65c2c57ba';
const parent = '2a40e87b964574f1b525f3f3f1cb8fce7f24468a';
if (!process.argv.includes('--temporary-index')) throw Error('Explicit temporary-index opt-in required');
const env = { ...process.env, GIT_INDEX_FILE: join(mkdtempSync(join(tmpdir(), 'indicator-integration-')), 'index') };
const git = (...args) => execFileSync('git', args, { env, encoding: 'utf8', maxBuffer: 5_000_000 });
const show = (ref, path) => git('show', `${ref}:${path}`);
const wrapper = 'app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client.tsx';
const detail = 'app/watchlist/live-watchlist-client.tsx';
const allowed = git('diff', '--name-only', base, feature).trim().split('\n');
assert.ok(!allowed.includes('app/(dashboard)/admin/watchlist/page.tsx'));
git('read-tree', parent);
const patch = git('diff', '--binary', base, feature);
const applied = spawnSync('git', ['apply', '--cached', '--3way', '-'], { env, input: patch, encoding: 'utf8' });
const conflicts = [...new Set(git('ls-files', '-u').trim().split('\n').filter(Boolean).map(row => row.split('\t')[1]))];
assert.deepEqual(conflicts.sort(), [wrapper, detail].sort(), 'Unexpected integration conflict set; do not guess a resolution');
assert.ok(applied.status === 0 || applied.status === 1);
const stage = (path, content) => {
  const hash = execFileSync('git', ['hash-object', '-w', '--stdin'], { env, input: content, encoding: 'utf8' }).trim();
  git('update-index', '--add', '--cacheinfo', `100644,${hash},${path}`);
};
const replaceOnce = (source, before, after) => {
  assert.equal(source.split(before).length, 2, 'Integration anchor must match exactly once');
  return source.replace(before, after);
};
// The wrapper at the feature tip contains the existing recap/editor/preview contract.
const wrapperSource = show(feature, wrapper);
for (const marker of ['dailyRecapsPanel', '<WatchlistAnalysisEditor', '<AnalysisPreviewCard', '<IndicatorAuditPanel', 'readAnalysisReviewPreview']) assert.ok(wrapperSource.includes(marker));
stage(wrapper, wrapperSource);
let detailSource = show(parent, detail);
detailSource = replaceOnce(detailSource,
  'import { WatchlistPotentialPathCardArticle } from "./potential-path-levels-card";',
  'import { WatchlistPotentialPathCardArticle } from "./potential-path-levels-card";\nimport { WatchlistIndicatorsCard } from "./watchlist-indicators-card";');
detailSource = replaceOnce(detailSource,
  '          card={tradersLinkAiReadCard}\n          symbol={symbol}\n          livePrice={symbol.latestPrice}\n          liveVolumeContext={symbol.liveVolumeContext}',
  '          card={tradersLinkAiReadCard}\n          symbol={symbol}\n          livePrice={symbol.latestPrice}');
detailSource = replaceOnce(detailSource,
  '      {recentNewsFilingsCard && showRecentNewsFilingsCard ? (',
  '      <WatchlistIndicatorsCard key={`${symbol.symbol}:${symbol.firstPostedAt}`} symbol={symbol.symbol} firstPostedAt={symbol.firstPostedAt} livePrice={symbol.latestPrice} />\n      {recentNewsFilingsCard && showRecentNewsFilingsCard ? (');
stage(detail, detailSource);
assert.equal(git('ls-files', '-u').trim(), '');
const changed = git('diff', '--cached', '--name-only', parent).trim().split('\n');
assert.ok(changed.every(path => allowed.includes(path)));
for (const path of [
  'app/(dashboard)/admin/watchlist/page.tsx',
  'app/(dashboard)/admin/watchlist/watchlist-daily-recaps-admin-panel.tsx',
  'src/modules/watchlist/server/daily-recaps/daily-recap-owner-service.ts',
  'app/(dashboard)/admin/watchlist/watchlist-analysis-editor.tsx',
  'app/watchlist/potential-path-levels-card.tsx',
]) assert.equal(show(':0', path), show(parent, path));
git('diff', '--cached', '--check', parent);
const tree = git('write-tree').trim();
console.log(JSON.stringify({ parent, feature, tree, changedFiles: changed.length, unresolvedConflicts: 0,
  preserved: 'Current-main Recaps page/panel/backend, Analysis editor and Potential Path card; ticker detail has only three explicit integration edits',
  boundary: 'Temporary Git tree only. Not a commit, build, hosted runtime or UI acceptance.' }));
