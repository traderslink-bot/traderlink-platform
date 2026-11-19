const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),Database=require('better-sqlite3');
const source=fs.readFileSync('src/modules/watchlist/server/runtime/watchlist-runtime-delivery-summary.ts','utf8');
const exports_={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exports_,Date,Set});
const read=exports_.readWatchlistRuntimeDeliverySummary;
const tables=['platform_watchlist_free_chat_posts','platform_watchlist_notification_deliveries','platform_watchlist_category_move_deliveries','platform_watchlist_notes_deliveries','platform_watchlist_owner_review_deliveries','platform_watchlist_notes_notifications','platform_watchlist_potential_gain_posts','platform_watchlist_recap_post_attempts','platform_watchlist_x_posts'];
function setup(t){const db=new Database(':memory:');t.after(()=>db.close());for(const table of tables)db.exec(`CREATE TABLE ${table}(state TEXT,discord_state TEXT,attempt_state TEXT,channel TEXT);`);return db;}
test('read-only counts combine listing, update, move and notes recipients without counting completed/expired receipts',t=>{
 const db=setup(t);for(const table of tables)db.prepare(`INSERT INTO ${table}(state,discord_state,attempt_state,channel) VALUES('failed','failed','failed','email')`).run();
 for(const table of tables.slice(1,4))for(const state of ['pending','sending','delivered','expired','opted_out','inaccessible'])db.prepare(`INSERT INTO ${table}(state,channel) VALUES(?,'web_push')`).run(state);
 db.prepare("INSERT INTO platform_watchlist_free_chat_posts(state) VALUES('retry'),('uncertain'),('sent')").run();
 db.prepare("INSERT INTO platform_watchlist_x_posts(state) VALUES('waiting'),('preparing'),('ready'),('accepted'),('sent'),('cancelled')").run();
 db.exec("UPDATE platform_watchlist_notes_notifications SET state='accepted';INSERT INTO platform_watchlist_notes_notifications(state,discord_state) VALUES('expired','pending'),('cancelled','failed');");
 const before=db.serialize();db.pragma('query_only=ON');const result=read(db,1234);assert.equal(result.refreshedAt,1234);
 const row=label=>result.deliveries.find(r=>r.label===label);
 assert.equal(row('Member email').failed,3);assert.equal(row('Member push').pending,3);assert.equal(row('Member push').sending,3);assert.equal(row('Member push').failed,0);
 assert.equal(row('Free Chat').pending,1);assert.equal(row('Free Chat').uncertain,1);assert.equal(row('Free Chat').failed,1);
 assert.equal(row('Notes Discord').pending,0);assert.equal(row('Notes Discord').failed,1);assert.equal(row('X / Buffer').pending,3);assert.equal(row('X / Buffer').failed,1);assert.ok(result.deliveries.every(row=>row.available));
 assert.ok(before.equals(db.serialize()));assert.equal(db.inTransaction,false);assert.deepEqual(Object.keys(result).sort(),['deliveries','refreshedAt']);
 assert.ok(!JSON.stringify(result).includes('target_ref'));assert.ok(!JSON.stringify(result).includes('user_id'));
});
test('missing tables and unknown states are unavailable instead of reassuring zeros, independent queues survive',t=>{
 const db=setup(t);db.exec('DROP TABLE platform_watchlist_notes_deliveries');db.prepare("INSERT INTO platform_watchlist_free_chat_posts(state) VALUES('future_unknown')").run();
 const result=read(db);assert.equal(result.deliveries.find(r=>r.label==='Member email').available,false);assert.equal(result.deliveries.find(r=>r.label==='Member push').available,false);assert.equal(result.deliveries.find(r=>r.label==='Free Chat').available,false);assert.equal(result.deliveries.find(r=>r.label==='X / Buffer').available,true);
});
test('no schema means unavailable, not initialized stores or migrations',t=>{
 const db=new Database(':memory:');t.after(()=>db.close());const result=read(db);assert.ok(result.deliveries.every(row=>!row.available));assert.equal(db.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table'").get().n,0);
});
function loadRoute({allowed=true,broken=false,result={ok:true,status:200,contentType:'application/json',body:JSON.stringify({analysisOperations:{lastSuccessfulAnalysis:{symbol:'TEST',at:100}}})}}={}){
 let reads=0,requests=0;
 const ports={
  '@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access':{hasWatchlistDashboardNavigationAccess:()=>allowed},
  '@/src/modules/platform/server/authentication/require-platform-request-scope':{requireTraderLinkPlatformRequestIdentity:()=>({})},
  '@/src/modules/watchlist/server/runtime/watchlist-runtime-admin-client':{requestWatchlistRuntimeRaw:async()=>{requests++;return result;}},
  '@/src/modules/platform/server/database/open-readonly-platform-database':{withReadonlyPlatformDatabase:(_options,fn)=>{reads++;if(broken)throw Error('fixture');return fn({});}},
  '@/src/modules/watchlist/server/runtime/watchlist-runtime-delivery-summary':{readWatchlistRuntimeDeliverySummary:()=>({refreshedAt:123,deliveries:[{label:'Free Chat',pending:2}]})},
  '@/src/modules/platform/server/database/open-platform-database':{withPlatformDatabase:()=>assert.fail('status must not open a writable database')},
 };
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/admin/watchlist/runtime/[...path]/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:id=>ports[id]??{},URL,Request,Response,Headers,console});
 return {get:query=>exports.GET(new Request('https://fixture.invalid/api/admin/watchlist/runtime/runtime/status'+query),{params:Promise.resolve({path:['runtime','status']})}),reads:()=>reads,requests:()=>requests};
}
test('existing owner status read enriches detailed JSON once; compact reads do not query queues',async()=>{
 const route=loadRoute();const response=await route.get('');const value=await response.json();assert.equal(value.analysisOperations.lastSuccessfulAnalysis.symbol,'TEST');assert.equal(value.platformDeliveries.deliveries[0].pending,2);assert.equal(route.reads(),1);assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0');
 const compact=await (await route.get('?compact=1')).json();assert.equal(compact.platformDeliveries,undefined);assert.equal(route.reads(),1);
});
test('unauthorized users get no Runtime or queue access; unavailable queues never erase analysis status',async()=>{
 const denied=loadRoute({allowed:false});assert.equal((await denied.get('')).status,404);assert.equal(denied.reads(),0);assert.equal(denied.requests(),0);
 const broken=loadRoute({broken:true});const value=await(await broken.get('')).json();assert.equal(value.platformDeliveries.available,false);assert.equal(value.analysisOperations.lastSuccessfulAnalysis.symbol,'TEST');
 const error=loadRoute({result:{ok:false,status:429,contentType:'text/plain',body:'rate limited'}});const response=await error.get('');assert.equal(response.status,429);assert.equal(await response.text(),'rate limited');assert.equal(error.reads(),0);
});
