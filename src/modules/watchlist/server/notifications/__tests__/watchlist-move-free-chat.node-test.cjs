const assert=require('node:assert/strict'),{test}=require('node:test'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),Database=require('better-sqlite3');
const root=path.resolve(__dirname,'../../../../../..');
function load(file,ports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,require:name=>name==='server-only'?{}:ports[name]??require(name),Date,Number,JSON,Error,Set,Map});return exports;}
const operation='12345678-1234-4123-8123-123456789abc';
function setup(t){
 const db=new Database(':memory:');t.after(()=>db.close());db.exec('CREATE TABLE platform_users(user_id TEXT PRIMARY KEY);');db.prepare('INSERT INTO platform_users VALUES(?)').run('owner');
 for(const sql of load('src/modules/platform/server/database/migrations/0149_watchlist_free_chat.ts').watchlistFreeChatMigration.statements)db.exec(sql);
 const store=load('src/modules/watchlist/server/notifications/watchlist-free-chat-store.ts');let sent=0,destination='confirmed',current=true,reviewCycle='cycle',choice=true,result={state:'sent',message:'Posted',messageId:'111111111111111111'};
 const review=()=>({symbol:'TEST',cycleId:reviewCycle,cancelled:false,events:[{revision:3,at:1,actor:'platform-owner:owner',body:{kind:'approve',draftRevision:2,publication:{website:{cards:{tradersLinkAiRead:{body:'saved'}}}}}},{body:{kind:'delivery',channel:'website',status:'acknowledged',approvalRevision:3}}]});
 const requests=[];
 const worker=load('src/modules/watchlist/server/notifications/watchlist-free-chat-runtime.ts',{
  '@/src/modules/platform/server/database/open-platform-database':{withPlatformDatabase:(_options,callback)=>callback(db)},
  '../runtime/watchlist-runtime-admin-client':{requestWatchlistRuntimeRaw:async input=>{requests.push(input);return {ok:true,body:JSON.stringify(input.path.includes('/category-move?')?{moves:[{id:operation,cycleId:'cycle',current,destination,freeChat:choice,approvalRevision:3}]}:input.path.includes('/free-chat-publication?')?{publication:{symbol:'TEST',cycleId:'cycle',approvalRevision:3,updated:false,images:[]}}:{review:review()})};}},
  './watchlist-automatic-notifications':{readAutomaticAnalysisEvents:async()=>[]},
  './watchlist-free-chat-store':store,
  './watchlist-free-chat-delivery':{deliverFreeChatPublication:async()=>{sent++;return result;}}
 });
 const input={symbol:'TEST',cycleId:'cycle',id:operation,to:'postmarket',notify:true,freeChat:true};
 return {db,store,worker,input,requests,sent:()=>sent,set:value=>{if('destination'in value)destination=value.destination;if('current'in value)current=value.current;if('reviewCycle'in value)reviewCycle=value.reviewCycle;if('choice'in value)choice=value.choice;if('result'in value)result=value.result;},queue:()=>worker.recordFreeChatMoveIntent(JSON.stringify(input),'platform-owner:owner'),state:()=>db.prepare('SELECT * FROM platform_watchlist_free_chat_posts WHERE post_key=?').get('cycle:move:'+operation)};
}
test('move event is distinct from an earlier Free Chat analysis share and is idempotent',async t=>{
 const h=setup(t);h.store.queueFreeChatPublication(h.db,{cycleId:'cycle',ticker:'TEST',ownerUserId:'owner',approvalRevision:3,origin:'manual',publishedAt:1});h.db.prepare("UPDATE platform_watchlist_free_chat_posts SET state='sent'").run();
 h.queue();h.queue();await h.worker.reconcileFreeChatPublications();await h.worker.reconcileFreeChatPublications();
 assert.equal(h.sent(),1);assert.equal(h.state().state,'sent');assert.equal(h.state().approval_revision,null);assert.equal(h.db.prepare('SELECT count(*) n FROM platform_watchlist_free_chat_posts').get().n,2);
});
test('unchecked Free Chat or silent move does not queue a post',t=>{
 const h=setup(t);for(const input of [{...h.input,freeChat:false},{...h.input,notify:false},{...h.input,to:'private'}])h.worker.recordFreeChatMoveIntent(JSON.stringify(input),'platform-owner:owner');
 assert.equal(h.db.prepare('SELECT count(*) n FROM platform_watchlist_free_chat_posts').get().n,0);
});
test('waits for confirmed paid destination without sending or changing the move',async t=>{
 const h=setup(t);h.queue();h.set({destination:'uncertain'});await h.worker.reconcileFreeChatPublications();assert.equal(h.sent(),0);assert.equal(h.state().state,'pending');assert.ok(h.state().next_attempt_at_ms>Date.now());assert.ok(h.requests.every(request=>request.method==='GET'));
 h.set({destination:'confirmed'});h.db.prepare('UPDATE platform_watchlist_free_chat_posts SET next_attempt_at_ms=0').run();await h.worker.reconcileFreeChatPublications();assert.equal(h.sent(),1);
});
test('removed/re-added or moved-again ticker cannot send a stale Free Chat move',async t=>{
 const h=setup(t);h.queue();h.set({current:false});await h.worker.reconcileFreeChatPublications();assert.equal(h.sent(),0);assert.equal(h.state().state,'cancelled');
});
test('a changed activation cancels the old move share',async t=>{
 const h=setup(t);h.queue();h.set({reviewCycle:'new-cycle'});await h.worker.reconcileFreeChatPublications();assert.equal(h.sent(),0);assert.equal(h.state().state,'cancelled');
});
test('an unavailable published analysis is reported instead of sending',async t=>{
 const h=setup(t);h.queue();h.set({destination:'skipped'});await h.worker.reconcileFreeChatPublications();assert.equal(h.sent(),0);assert.equal(h.state().state,'failed');assert.match(h.state().status_message,/No published analysis/);
});
test('uncertain Free Chat delivery is never automatically repeated',async t=>{
 const h=setup(t);h.queue();h.set({result:{state:'uncertain',message:'Check Free Chat'}});await h.worker.reconcileFreeChatPublications();await h.worker.reconcileFreeChatPublications();h.queue();await h.worker.reconcileFreeChatPublications();assert.equal(h.sent(),1);assert.equal(h.state().state,'uncertain');
});
test('explicit move retry retries only a confirmed failure, not a sent post',async t=>{
 const h=setup(t);h.queue();h.set({result:{state:'failed',message:'Not accepted'}});await h.worker.reconcileFreeChatPublications();assert.equal(h.state().state,'failed');
 h.queue();h.set({result:{state:'sent',message:'Posted',messageId:'111111111111111111'}});await h.worker.reconcileFreeChatPublications();assert.equal(h.state().state,'sent');assert.equal(h.sent(),2);
 h.queue();await h.worker.reconcileFreeChatPublications();assert.equal(h.sent(),2);
});
test('old queued moves expire without a post',async t=>{
 const h=setup(t);h.queue();h.db.prepare('UPDATE platform_watchlist_free_chat_posts SET requested_at_ms=?').run(Date.now()-90000000);await h.worker.reconcileFreeChatPublications();assert.equal(h.sent(),0);assert.equal(h.state().state,'cancelled');
});
test('moving out of Private records Free Chat choice without adding unsupported approval fields',async()=>{
 const source=fs.readFileSync(path.join(root,'app/api/admin/watchlist/runtime/[...path]/route.ts'),'utf8');
 const start=source.indexOf('  if(pathname === "/api/watchlist/analysis-review/category-move" && method === "POST"');
 const end=source.indexOf('  if (pathname === "/api/watchlist/analysis-review/x-post"',start);
 const requests=[],intents=[];
 const input={symbol:'TEST',id:operation,to:'main',notify:true,freeChat:true,deleteSource:false,cycleId:'private'};
 const invoke=new Function('pathname','method','reviewActor','body','isPrivateWatchlistTicker','requestWatchlistRuntimeRaw','recordWatchlistApprovalNotificationIntent','recordFreeChatApprovalIntent','Response','console','return (async()=>{'+source.slice(start,end)+'})();');
 const result=await invoke('/api/watchlist/analysis-review/category-move','POST','platform-owner:owner',JSON.stringify(input),()=>true,async request=>{requests.push(request);return {ok:true,body:JSON.stringify(request.method==='GET'?{review:{cycleId:'private',head:2,cancelled:false,draft:{revision:2,body:{kind:'original'}}}}:{ok:true})};},()=>{},body=>intents.push(JSON.parse(body)),Response,{error:()=>{}});
 assert.equal(result.status,200);assert.equal(intents[0].freeChat,true);
 const approval=JSON.parse(requests.at(-1).body);assert.equal(approval.freeChat,undefined);assert.equal(approval.notifyUsers,true);assert.equal(approval.draftRevision,2);
});
