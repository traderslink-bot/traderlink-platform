const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const runtime = 'C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const platformParent = '5867b4dc3e9f52a5f790ce34e5723262ff7d30b8';
const runtimeParent = 'e4f46105ed562c2459de9dc14c49f38060fcbbb3';
const git = (cwd, args, input, index) => cp.execFileSync('git', args, { cwd, input, encoding:'utf8', maxBuffer:12e6, env:{...process.env,...(index ? {GIT_INDEX_FILE:index} : {})} }).trimEnd();
const source = (cwd, parent, file) => git(cwd, ['show', `${parent}:${file}`])+'\n';
function prepare() {
  const platform = new Map(), changes = new Map();
  for (const file of ['app/(dashboard)/admin/watchlist/watchlist-analysis-editor.tsx','src/lib/live-watchlist/analysis-level-row-edit.ts','src/scripts/fixtures/watchlist-breakout-checkpoint.ts','src/scripts/package-watchlist-level-editor.cjs','src/scripts/verify-watchlist-level-editor.cjs','docs/migration/watchlist-editor-and-category-move-plan.md','docs/migration/watchlist-editor-and-category-move-progress.md']) platform.set(file, fs.readFileSync(path.join(root,file),'utf8'));
  const helper = 'src/lib/ai/watchlist-breakout-checkpoint.ts';
  changes.set(helper, platform.get('src/scripts/fixtures/watchlist-breakout-checkpoint.ts'));
  const file = 'src/lib/ai/traderslink-ai-read-service.ts';
  let text = source(runtime,runtimeParent,file);
  const anchor = '    read = applyPriorPlanBoundaryContext(read, input.priorPlanBoundary);';
  assert.equal(text.split(anchor).length, 2);
  text = 'import { includeBreakoutCheckpoint } from "./watchlist-breakout-checkpoint.js";\n'+text.replace(anchor,anchor+'\n    read = includeBreakoutCheckpoint(read, referenceQuote.price);');
  changes.set(file,text);
  const help='src/modules/help/watchlist-guides.ts';
  platform.set(help,source(root,platformParent,help).replace('Potential Gain keeps the original Watchlist starting price;', 'Where it could go next rows can be inserted above or below another row, moved up or down, or sorted by price while keeping each explanation with its price. New full-analysis drafts include the breakout level in that ordered path; you can still edit or remove it. Potential Gain keeps the original Watchlist starting price;'));
  assert.notEqual(platform.get(help),source(root,platformParent,help));
  return {platform,changes};
}
module.exports={prepare,root,runtime,platformParent,runtimeParent};
function checkpoint(cwd,parent,files,label) {
  const index=path.join(root,`data/level-editor-${label}.index`);
  git(cwd,['read-tree',parent],undefined,index);
  for(const [file,text] of files) {
    const blob=git(cwd,['hash-object','-w','--stdin'],text,index);
    git(cwd,['update-index','--add','--cacheinfo',`100644,${blob},${file}`],undefined,index);
  }
  git(cwd,['diff','--cached','--check',parent],undefined,index);
  const tree=git(cwd,['write-tree'],undefined,index);
  const sha=git(cwd,['commit-tree',tree,'-p',parent,'-m','Improve upside row editing and include breakout checkpoint'],undefined,index);
  git(cwd,['update-ref',`refs/codex/watchlist-level-editor-${label}`,sha],undefined,index);
  return sha;
}
if(require.main===module) {
  const {platform,changes}=prepare();
  console.log(JSON.stringify({platformParent,runtimeParent,platform:[...platform.keys()],runtime:[...changes.keys()]}));
  if(process.argv.includes('--commit')) console.log(JSON.stringify({platform:checkpoint(root,platformParent,platform,'platform'),runtime:checkpoint(runtime,runtimeParent,changes,'runtime')}));
}
