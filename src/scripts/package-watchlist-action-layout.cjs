const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),runtime='C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const platformParent='947636df065f25d9c4ed5386570d9496b01aefd7',runtimeParent='fc06d3d3645e9b0d7519dcfad32305fa16b4321d';
const git=(cwd,args,input,index)=>cp.execFileSync('git',['-c',`safe.directory=${cwd.replaceAll('\\','/')}`,...args],{cwd,input,encoding:'utf8',maxBuffer:12e6,env:{...process.env,...(index?{GIT_INDEX_FILE:index}:{})}}).trimEnd();
const source=(cwd,parent,file)=>git(cwd,['show',`${parent}:${file}`])+'\n';
const edit=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};
function prepare(){
 const platform=new Map(),changes=new Map();
 const row='src/runtime/manual-watchlist-row-review.ts';
 let text=source(runtime,runtimeParent,row);
 text=edit(text,'<script>',`<style>
.entry-actions.watchlist-grouped-actions { display:flex; flex-direction:column; align-items:stretch; gap:12px; width:100%; min-width:0; }
.watchlist-action-group { display:flex; flex-wrap:wrap; align-items:center; gap:8px; min-width:0; }
.watchlist-action-group > label { display:flex; align-items:center; gap:6px; }
.watchlist-action-group > button,.watchlist-action-group > select { min-height:40px; }
.watchlist-action-group > [role="status"] { flex-basis:100%; }
.watchlist-action-more { border-top:1px solid rgba(148,163,184,.3); padding-top:8px; }
.watchlist-action-more > summary { cursor:pointer; font-weight:600; padding:4px 0 8px; }
.watchlist-action-remove { border-top:1px solid rgba(148,163,184,.3); padding-top:10px; }
@media(max-width:600px) { .watchlist-action-group > button { flex:1 1 160px; } .watchlist-action-group > select { flex:1 1 100%; max-width:100%; } .watchlist-action-group > label { flex-basis:100%; } }
</style>
<script>`);
 text=edit(text,'  function attach(entry, actions) {',`  const expandedActions = new Set();
  function groups(symbol, root) {
    root.classList.add('watchlist-grouped-actions');
    const make = label => { const group=document.createElement('div');group.className='watchlist-action-group';group.setAttribute('role','group');group.setAttribute('aria-label',label+' for '+symbol);return group; };
    const review=make('Review and publish'),move=make('Move ticker'),more=make('More actions'),remove=make('Remove ticker');
    remove.classList.add('watchlist-action-remove');
    const details=document.createElement('details');details.className='watchlist-action-more';details.open=expandedActions.has(symbol);
    const summary=document.createElement('summary');summary.textContent='More actions';details.append(summary,more);
    details.addEventListener('toggle',()=>{if(details.isConnected){if(details.open)expandedActions.add(symbol);else expandedActions.delete(symbol);}});
    root.append(review,move,details,remove);return {review,move,more,remove};
  }
  function attach(entry, actions, more = actions) {`);
 text=edit(text,'window.watchlistRowReview = { refresh, attach };','window.watchlistRowReview = { refresh, attach, groups };');
 text=edit(text,'attachX(entry,actions,queue.get(entry.symbol));','attachX(entry,actions,queue.get(entry.symbol),more);');
 text=edit(text,'function attachX(entry, actions, state)', 'function attachX(entry, actions, state, more = actions)');
 text=edit(text,'actions.append(open);','more.append(open);');
 for(const control of ['gainPost','free','recovery'])text=edit(text,`actions.append(${control});`,`more.append(${control});`);
 text=edit(text,"const status = document.createElement('span'); status.textContent", "const status = document.createElement('span'); status.setAttribute('role','status'); status.textContent");
 changes.set(row,text);
 const page='src/runtime/manual-watchlist-page.ts';text=source(runtime,runtimeParent,page);
 text=edit(text,'window.watchlistRowReview.attach(entry, actions);','const actionGroups = window.watchlistRowReview.groups(entry.symbol, actions);\n          window.watchlistRowReview.attach(entry, actionGroups.review, actionGroups.more);');
 for(const control of ['copyButton','repostButton','refreshButton','aiRefreshButton','aiVisibilityButton','indicatorVisibilityButton','dipBuyPlanVisibilityButton','retryButton'])text=edit(text,`actions.appendChild(${control});`,`actionGroups.more.appendChild(${control});`);
 for(const control of ['moveSelect','moveButton'])text=edit(text,`actions.appendChild(${control});`,`actionGroups.move.appendChild(${control});`);
 for(const control of ['removeFromListButton','deactivateButton'])text=edit(text,`actions.appendChild(${control});`,`actionGroups.remove.appendChild(${control});`);
 changes.set(page,text);
 for(const file of ['src/scripts/package-watchlist-action-layout.cjs','src/scripts/verify-watchlist-action-layout.cjs','docs/migration/watchlist-editor-and-category-move-plan.md','docs/migration/watchlist-editor-and-category-move-progress.md'])platform.set(file,fs.readFileSync(path.join(root,file),'utf8'));
 return {platform,changes};
}
module.exports={prepare,root,runtime,platformParent,runtimeParent};
function checkpoint(cwd,parent,files,label){
 const index=path.join(root,`data/action-layout-${label}.index`);git(cwd,['read-tree',parent],undefined,index);
 for(const[file,text]of files){const blob=git(cwd,['hash-object','-w','--stdin'],text,index);git(cwd,['update-index','--add','--cacheinfo',`100644,${blob},${file}`],undefined,index);}
 git(cwd,['diff','--cached','--check',parent],undefined,index);
 const sha=git(cwd,['commit-tree',git(cwd,['write-tree'],undefined,index),'-p',parent,'-m','Group Watchlist ticker controls by action'],undefined,index);
 git(cwd,['update-ref',`refs/codex/watchlist-action-layout-${label}`,sha],undefined,index);return sha;
}
if(require.main===module){const{platform,changes}=prepare();console.log(JSON.stringify({platformParent,runtimeParent,platform:[...platform.keys()],runtime:[...changes.keys()]}));if(process.argv.includes('--commit'))console.log(JSON.stringify({platform:checkpoint(root,platformParent,platform,'platform'),runtime:checkpoint(runtime,runtimeParent,changes,'runtime')}));}
