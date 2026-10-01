const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const parent='45b59c3c4f1f5a795a582b5ec9c394c6cc77f934';
const git=(args,input,index)=>cp.execFileSync('git',['-c',`safe.directory=${root.replaceAll('\\','/')}`,...args],{cwd:root,input,encoding:'utf8',maxBuffer:15e6,env:{...process.env,...(index?{GIT_INDEX_FILE:index}:{})}}).trimEnd();
const source=file=>git(['show',parent+':'+file])+'\n';
const replace=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};
function prepare(){
 const files=new Map();
 const access='src/modules/watchlist/server/notifications/watchlist-notification-runtime.ts';let text=source(access);
 text='import { evaluateMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";\n'+text;
 text=replace(text,`  const visibility = database.prepare<[], { member_visible: number }>(
    "SELECT member_visible FROM platform_watchlist_visibility WHERE settings_key='member_visibility'",
  ).get();
  if (visibility?.member_visible !== 1) return false;`, `  // Use the same Watchlist feature policy as the current application. The
  // obsolete platform_watchlist_visibility table was never part of this schema.
  if (!evaluateMembershipFeature(database, userId, "watchlist.access").allowed) return false;`);
 files.set(access,text);
 const document='src/modules/watchlist/server/runtime/watchlist-runtime-admin-document.ts';text=source(document);
 text=replace(text,`.replaceAll('"/api/', '"/api/admin/watchlist/runtime/')`,`.replaceAll(/(["'])\\/api\\/(?!admin\\/watchlist\\/runtime\\/)/g, '$1/api/admin/watchlist/runtime/')`);
 files.set(document,text);
 const route='app/api/admin/watchlist/runtime/[...path]/route.ts';text=source(route);
 text=replace(text,`try{recordCategoryMoveIntent(body,reviewActor);}catch{return Response.json({error:'Member notification request could not be saved. Move with notifications off, or retry.'},{status:503});}`,`try{recordCategoryMoveIntent(body,reviewActor);}catch(error){
      const code=error&&typeof error==='object'&&'code' in error&&typeof error.code==='string'&&/^SQLITE_[A-Z_]+$/.test(error.code)?error.code:'intent_failed';
      console.error('[Watchlist move notification]',{stage:'save_intent',code});
      return Response.json({error:'Move notification could not be prepared. No move or notification was sent. Please retry.'},{status:503,headers:{'cache-control':'private, no-store'}});
    }`);files.set(route,text);
 for(const file of ['src/scripts/package-watchlist-move-notify-repair.cjs','src/scripts/verify-watchlist-move-notify-repair.cjs','docs/migration/watchlist-move-notify-repair-progress.md'])files.set(file,fs.readFileSync(path.join(root,file),'utf8'));
 const progress='docs/migration/watchlist-editor-and-category-move-progress.md';files.set(progress,source(progress)+'\n\n## October 1 notified-move repair\n\nSee [repair evidence and focused verification](watchlist-move-notify-repair-progress.md). SDEV silent moves worked; notified moves exposed an obsolete notification access query. The narrow repair preserves opt-ins and active Discord checks and uses current membership feature policy. Move delivery details now uses the authenticated proxy with either JavaScript quote style.\n');
 return files;
}
module.exports={prepare,source,parent,root};
if(require.main===module){const files=prepare();console.log(JSON.stringify({parent,allowlist:[...files.keys()]}));if(process.argv.includes('--commit')){
 const index=path.join(root,'data/move-notify-repair.index');git(['read-tree',parent],undefined,index);
 for(const[file,text]of files){const blob=git(['hash-object','-w','--stdin'],text,index);git(['update-index','--add','--cacheinfo',`100644,${blob},${file}`],undefined,index);}
 git(['diff','--cached','--check',parent],undefined,index);const sha=git(['commit-tree',git(['write-tree'],undefined,index),'-p',parent,'-m','Fix notified Watchlist move access check and delivery status routing'],undefined,index);
 git(['update-ref','refs/codex/watchlist-move-notify-repair',sha],undefined,index);console.log(JSON.stringify({sha}));
}}
