// Creates exact-parent local commits without switching/staging either checkout.
// Run the focused verifier immediately before this packaging step.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd();
const runtime='C:/Users/jerac/.codex/worktrees/watchlist-source-selector/levels-system-post-mtf-handoff-stability';
const platformParent='d5ec13293400a5849636a6049a4761e272eb7928';
const runtimeParent='0822d14c76fbbd28d7d3d108df3b94389c02e125';
function git(cwd,index,args,input){return cp.execFileSync('git',['-c',`safe.directory=${cwd.replaceAll('\\','/')}`,...args],{cwd,env:{...process.env,GIT_INDEX_FILE:index},encoding:'utf8',input}).trim();}
const index=path.join(root,'data/free-chat-release.index');
git(root,index,['read-tree',platformParent]);
git(root,index,['apply','--cached','--recount','--unidiff-zero','docs/migration/watchlist-free-chat-platform.patch']);
const allowlist=[
 'src/modules/platform/server/database/migrations/0149_watchlist_free_chat.ts',
 ...['delivery','store','runtime','admin'].map(x=>`src/modules/watchlist/server/notifications/watchlist-free-chat-${x}.ts`),
 'docs/migration/watchlist-free-chat-plan.md','docs/migration/watchlist-free-chat-progress.md',
 'docs/migration/watchlist-free-chat-platform.patch','docs/migration/watchlist-free-chat-runtime-export.patch','docs/migration/watchlist-free-chat-runtime-ui.patch',
 'src/scripts/verify-watchlist-free-chat.cjs','src/scripts/package-watchlist-free-chat.cjs',
];
for(const file of allowlist) {
 const blob=git(root,index,['hash-object','-w','--stdin'],fs.readFileSync(path.join(root,file)));
 git(root,index,['update-index','--add','--cacheinfo',`100644,${blob},${file}`]);
}
const tree=git(root,index,['write-tree']);
const platformCommit=git(root,index,['commit-tree',tree,'-p',platformParent,'-m','Add owner-selected Free Chat analysis sharing']);
git(root,index,['update-ref','refs/codex/watchlist-free-chat-platform',platformCommit]);
const runtimeIndex=path.join(root,'data/free-chat-runtime-release.index');
git(runtime,runtimeIndex,['read-tree',runtimeParent]);
for(const file of ['watchlist-free-chat-runtime-export.patch','watchlist-free-chat-runtime-ui.patch'])git(runtime,runtimeIndex,['apply','--cached','--recount','--unidiff-zero',path.join(root,'docs/migration',file)]);
const runtimeTree=git(runtime,runtimeIndex,['write-tree']);
const runtimeCommit=git(runtime,runtimeIndex,['commit-tree',runtimeTree,'-p',runtimeParent,'-m','Expose approved Free Chat images and owner sharing controls']);
git(runtime,runtimeIndex,['update-ref','refs/codex/watchlist-free-chat-runtime',runtimeCommit]);
console.log(JSON.stringify({platform:{parent:platformParent,commit:platformCommit,files:git(root,index,['diff-tree','--no-commit-id','--name-only','-r',platformCommit]).split('\n')},runtime:{parent:runtimeParent,commit:runtimeCommit,files:git(runtime,runtimeIndex,['diff-tree','--no-commit-id','--name-only','-r',runtimeCommit]).split('\n')}},null,2));
