const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),runtime='C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const platformParent='81e79a05a2f3439f4863f788b6cf860968817ba5',runtimeParent='e660742117d01e7468f093105335a10e72808f39';
const git=(cwd,args,input,index)=>cp.execFileSync('git',['-c',`safe.directory=${cwd.replaceAll('\\','/')}`,...args],{cwd,input,encoding:'utf8',maxBuffer:12e6,env:{...process.env,...(index?{GIT_INDEX_FILE:index}:{})}}).trimEnd();
const source=(cwd,parent,file)=>git(cwd,['show',`${parent}:${file}`])+'\n';
const edit=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};
function prepare(){
 const platform=new Map(),changes=new Map();
 const worker='src/lib/alerts/watchlist-discord-removal.ts';
 let text=source(runtime,runtimeParent,worker);
 text=edit(text,'export function removalReceipts',`/** Explicit retry of saved deletion jobs only; never creates a publication. */
export function retryFailedDiscordRemovals(){
 const state=read();
 if(!state.enabled)throw Error('Turn on Discord post deletion before retrying failed deletions.');
 for(const job of state.jobs)if(job.state==='failed'){job.state='pending';job.message='';}
 save(state);
 return discordRemovalStatus();
}
export function removalReceipts`);
 changes.set(worker,text);
 const api='src/runtime/manual-watchlist-analysis-review-api.ts';
 text=source(runtime,runtimeParent,api);
 text=edit(text,'discordRemovalStatus, setDiscordRemoval','discordRemovalStatus, setDiscordRemoval, retryFailedDiscordRemovals');
 text=edit(text,'{ deletePostsOnRemoval?: unknown }','{ deletePostsOnRemoval?: unknown; retryFailedDeletions?: unknown }');
 text=edit(text,'if (input.method === "POST" && body && Object.keys(body).length === 1 && "deletePostsOnRemoval" in body) setDiscordRemoval(body.deletePostsOnRemoval);','if (input.method === "POST" && body && Object.keys(body).length === 1 && body.retryFailedDeletions === true) retryFailedDiscordRemovals();\n      else if (input.method === "POST" && body && Object.keys(body).length === 1 && "deletePostsOnRemoval" in body) setDiscordRemoval(body.deletePostsOnRemoval);');
 changes.set(api,text);
 const panel='src/runtime/manual-watchlist-discord-mentions-panel.ts';
 text=source(runtime,runtimeParent,panel);
 text=edit(text,'  <p id="discord-delete-status"','  <button type="button" id="discord-delete-retry" hidden>Retry failed deletions</button>\n  <p id="discord-delete-status"');
 text=edit(text,"const toggle=document.getElementById('discord-delete-removed'),status=document.getElementById('discord-delete-status');","const toggle=document.getElementById('discord-delete-removed'),status=document.getElementById('discord-delete-status'),retry=document.getElementById('discord-delete-retry');\n let deletionBusy=false;");
 text=edit(text,"toggle.checked=d.enabled;toggle.disabled=false;status.textContent=","toggle.checked=d.enabled;toggle.disabled=false;retry.hidden=!d.failures.length;retry.disabled=!d.enabled||deletionBusy;status.textContent=");
 text=edit(text,' load().catch(e=>{status.textContent=e.message;});',` retry.onclick=async()=>{if(deletionBusy)return;deletionBusy=true;retry.disabled=true;try{await load({retryFailedDeletions:true});}catch(e){status.textContent=e.message;}finally{deletionBusy=false;retry.disabled=!toggle.checked;}};
 load().catch(e=>{status.textContent=e.message;});`);
 // Role-settings lock must not unlock deletion controls owned by the separate settings request.
 text=edit(text,"root.querySelectorAll('input,button').forEach(el => { el.disabled = value; });","root.querySelectorAll('#discord-mention-everyone,#discord-mention-roles input,#discord-mention-roles button,#discord-mention-add,#discord-mention-save').forEach(el => { el.disabled = value; });");
 changes.set(panel,text);
 const help='src/modules/help/watchlist-guides.ts';
 text=source(root,platformParent,help);
 const anchor='Posts already approved retain their audience on retries.';
 text=edit(text,anchor,anchor+' Discord post deletion failures can be retried from Discord notifications settings. Retry failed deletions only retries removal of the saved messages; it does not repost or notify members.');
 platform.set(help,text);
 for(const file of ['src/scripts/package-watchlist-cleanup-retry.cjs','src/scripts/verify-watchlist-cleanup-retry.cjs','docs/migration/watchlist-admin-interaction-audit.md','docs/migration/watchlist-editor-and-category-move-plan.md','docs/migration/watchlist-editor-and-category-move-progress.md'])platform.set(file,fs.readFileSync(path.join(root,file),'utf8'));
 return {platform,changes};
}
function checkpoint(cwd,parent,files,label){
 const index=path.join(root,`data/cleanup-retry-${label}.index`);git(cwd,['read-tree',parent],undefined,index);
 for(const[file,text]of files){const blob=git(cwd,['hash-object','-w','--stdin'],text,index);git(cwd,['update-index','--add','--cacheinfo',`100644,${blob},${file}`],undefined,index);}
 git(cwd,['diff','--cached','--check',parent],undefined,index);
 const sha=git(cwd,['commit-tree',git(cwd,['write-tree'],undefined,index),'-p',parent,'-m','Allow independent retry of failed Watchlist Discord deletions'],undefined,index);
 git(cwd,['update-ref',`refs/codex/watchlist-cleanup-retry-${label}`,sha],undefined,index);return sha;
}
module.exports={prepare,root,runtime,platformParent,runtimeParent};
if(require.main===module){const{platform,changes}=prepare();console.log(JSON.stringify({platformParent,runtimeParent,platform:[...platform.keys()],runtime:[...changes.keys()]}));if(process.argv.includes('--commit'))console.log(JSON.stringify({platform:checkpoint(root,platformParent,platform,'platform'),runtime:checkpoint(runtime,runtimeParent,changes,'runtime')}));}
