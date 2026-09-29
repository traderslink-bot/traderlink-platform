const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const ts = require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const root = process.cwd();
const runtime = 'C:/Users/jerac/.codex/worktrees/watchlist-source-selector/levels-system-post-mtf-handoff-stability';
const platformIndex = path.join(root,'data/free-chat-review.index');
const runtimeIndex = path.join(root,'data/free-chat-runtime-review.index');
function git(cwd,index,args) { return cp.execFileSync('git',['-c',`safe.directory=${cwd.replaceAll('\\','/')}`,...args],{cwd,env:{...process.env,GIT_INDEX_FILE:index},encoding:'utf8'}); }
git(root,platformIndex,['read-tree','d5ec13293400a5849636a6049a4761e272eb7928']);
git(root,platformIndex,['apply','--cached','--recount','--unidiff-zero','docs/migration/watchlist-free-chat-platform.patch']);
git(runtime,runtimeIndex,['read-tree','0822d14c76fbbd28d7d3d108df3b94389c02e125']);
for(const file of ['watchlist-free-chat-runtime-export.patch','watchlist-free-chat-runtime-ui.patch']) git(runtime,runtimeIndex,['apply','--cached','--recount','--unidiff-zero',path.join(root,'docs/migration',file)]);
let count=0;
function syntax(source,file) {
 const result=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
 assert.equal(result.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length,0,file);
 count++; return result.outputText;
}
for(const file of ['app/api/admin/watchlist/runtime/[...path]/route.ts','src/modules/platform/server/database/platform-migration-manifest.ts','src/modules/watchlist/server/notifications/watchlist-notification-runtime.ts']) syntax(git(root,platformIndex,['show',`:${file}`]),file);
for(const file of ['src/lib/monitoring/manual-watchlist-runtime-manager.ts','src/runtime/manual-watchlist-analysis-review-api.ts','src/runtime/manual-watchlist-row-review.ts']) {
 const source=git(runtime,runtimeIndex,['show',`:${file}`]); syntax(source,file);
 if(file.endsWith('row-review.ts')) new vm.Script(source.split('<script>')[1].split('</script>')[0]);
}
const files=['delivery','store','runtime','admin'].map(name=>`src/modules/watchlist/server/notifications/watchlist-free-chat-${name}.ts`);
for(const file of files) syntax(fs.readFileSync(file,'utf8'),file);
function load(file,imports={}) {
 const module={exports:{}};
 vm.runInNewContext(syntax(fs.readFileSync(file,'utf8'),file),{module,exports:module.exports,require:name=>name==='server-only'?{}:imports[name]??require(name),Buffer,URL,process,FormData,Blob,AbortSignal,Date,fetch});
 return module.exports;
}
const delivery=load(files[0]);
const Database = require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/better-sqlite3');
const db = new Database(':memory:');
db.exec('CREATE TABLE platform_users(user_id TEXT PRIMARY KEY); INSERT INTO platform_users VALUES(\'owner\');');
const migration=load('src/modules/platform/server/database/migrations/0149_watchlist_free_chat.ts').watchlistFreeChatMigration;
for(const statement of migration.statements) db.exec(statement);
const store=load(files[1]);
const input={cycleId:'cycle',ticker:'SOAR',ownerUserId:'owner',approvalRevision:2,origin:'automatic',publishedAt:200};
assert.equal(store.queueFreeChatPublication(db,input,200),false);
store.setFreeChatAutomatic(db,{...input,enabled:true},100);
assert.equal(store.queueFreeChatPublication(db,{...input,publishedAt:99},200),false);
assert.equal(store.queueFreeChatPublication(db,input,200),true);
assert.equal(store.queueFreeChatPublication(db,input,200),false);
store.setFreeChatAutomatic(db,{...input,enabled:false},201);
assert.equal(store.claimFreeChatPost(db,'cycle:approval:2',202),false);
assert.equal(store.queueFreeChatPublication(db,{...input,approvalRevision:3,origin:'manual'},203),true);
assert.equal(store.claimFreeChatPost(db,'cycle:approval:3',204),true);
assert.equal(store.claimFreeChatPost(db,'cycle:approval:3',204),false);
store.finishFreeChatPost(db,'cycle:approval:3',{state:'sent',message:'Posted',messageId:'123'},205);
assert.equal(store.claimFreeChatPost(db,'cycle:approval:3',206),false);
db.close();
const runtimeContract=load(files[2],{
 '@/src/modules/platform/server/database/open-platform-database':{},
 '../runtime/watchlist-runtime-admin-client':{},
 './watchlist-automatic-notifications':{},
 './watchlist-free-chat-store':store,
 './watchlist-free-chat-delivery':delivery,
});
const approved={revision:3,at:100,actor:'platform-owner:owner',body:{kind:'approve',publication:{website:{cards:{tradersLinkAiRead:{body:'approved'}}}}}};
const receipt={revision:4,at:101,actor:'runtime',body:{kind:'delivery',channel:'website',status:'acknowledged',approvalRevision:3}};
assert.equal(runtimeContract.publishedFreeChatApprovals({events:[approved]}).length,0);
assert.equal(runtimeContract.publishedFreeChatApprovals({events:[approved,receipt]}).length,1);
assert.equal(runtimeContract.publishedFreeChatApprovals({events:[{...approved,body:{kind:'approve'}},receipt]}).length,0);
assert.equal(delivery.freeChatWebhook({WATCHLIST_FREE_CHAT_DISCORD_WEBHOOK_URL:'https://example.com/api/webhooks/1/token'}),null);
const publication={symbol:'SOAR',cycleId:'example',approvalRevision:3,updated:true,images:[]};
assert.match(delivery.freeChatPayload(publication).content,/Free \$SOAR TradersLink Analysis — Updated/);
assert.match(delivery.freeChatPayload(publication).content,/@everyone/);
const env={WATCHLIST_FREE_CHAT_DISCORD_WEBHOOK_URL:'https://discord.com/api/webhooks/123/test'};
(async()=>{
 let posts=0;
 const transport=async (_url,options)=> {
  if(options.method!=='POST') return new Response(JSON.stringify({channel_id:'1433570741068234795'}));
  posts++; const body=JSON.parse(options.body.get('payload_json')); assert.deepEqual(Array.from(body.allowed_mentions.parse),['everyone']);
  return new Response(JSON.stringify({id:'123456789012345678'}));
 };
 assert.equal((await delivery.deliverFreeChatPublication(publication,transport,env)).state,'sent'); assert.equal(posts,1);
 const rejected=async (_url,options)=> options.method==='POST'?new Response(JSON.stringify({retry_after:12}),{status:429}):new Response(JSON.stringify({channel_id:'1433570741068234795'}));
 assert.equal((await delivery.deliverFreeChatPublication(publication,rejected,env)).state,'retry');
 const unknown=async (_url,options)=> {if(options.method==='POST')throw Error('private transport failure');return new Response(JSON.stringify({channel_id:'1433570741068234795'}));};
 assert.equal((await delivery.deliverFreeChatPublication(publication,unknown,env)).state,'uncertain');
 console.log(`Free Chat focused checks passed; ${count} TypeScript syntax checks, row-script syntax, copy, destination, success, cooldown and unknown-delivery fixtures. No network requests.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
