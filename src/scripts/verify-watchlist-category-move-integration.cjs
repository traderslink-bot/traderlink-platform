const assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path'),cp=require('node:child_process');
const deps='C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules';
const ts=require(deps+'/typescript'),Database=require(deps+'/better-sqlite3');
const {prepare,root,runtime,platformParent,runtimeParent}=require('./package-watchlist-category-move.cjs');
const {platform,changes}=prepare();
let deletes=0,sends=0,places=0,lateDeletes=0,failDelete=false,failSend=false;
const files=new Map();
const fakeFs={existsSync:p=>files.has(p),mkdirSync:()=>{},readFileSync:p=>files.get(p),writeFileSync:(p,text)=>files.set(p,text),renameSync:(from,to)=>{files.set(to,files.get(from));files.delete(from);}};
function loader(cwd,parent,map,overrides={}){const cache=new Map();return function load(file){
 if(cache.has(file))return cache.get(file);
 const source=map.get(file)??cp.execFileSync('git',['-c',`safe.directory=${cwd.replaceAll('\\','/')}`,'show',`${parent}:${file}`],{cwd,encoding:'utf8'});
 const out=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});assert.equal(out.diagnostics.length,0,file);
 const m={exports:{}};cache.set(file,m.exports);
 vm.runInNewContext(out.outputText,{module:m,exports:m.exports,process:{env:{DISCORD_BOT_TOKEN:'test-only'}},console,URL,URLSearchParams,Date,Buffer,structuredClone,AbortSignal,fetch:async()=>{deletes++;return{ok:!failDelete,status:failDelete?403:204};},require:id=>{
  if(Object.hasOwn(overrides,id))return overrides[id];
  if(id==='server-only')return{};
  if(id==='node:fs')return fakeFs;
  if(id.endsWith('manual-watchlist-durable-storage.js'))return{resolveManualWatchlistDurableDirectory:()=>'/mock'};
  if(id.endsWith('watchlist-discord-removal.js'))return{queueCategoryMoveRemovals:(_symbol,r)=>{lateDeletes+=r.length;}};
  if(id.endsWith('watchlist-discord-mentions.js'))return{currentDiscordAudience:()=>({everyone:true,roles:[]}),appendDiscordMentions:content=>content+'\n@everyone'};
  if(id.endsWith('watchlist-discord-link-message.js'))return{buildWatchlistDiscordLinkMessage:symbol=>symbol+' added\n\nView /watchlist/'+symbol};
  if(id.startsWith('.'))return load(path.posix.join(path.posix.dirname(file),id.replace(/\.js$/,'')+'.ts'));
  return require(id);
 }});return m.exports;
};}
async function main(){
 const r=loader(runtime,runtimeParent,changes),Service=r('src/lib/alerts/watchlist-category-move-service.ts').CategoryMoveService;
 const cycle='30000000-0000-4000-8000-000000000003',owner='platform-owner:10000000-0000-4000-8000-000000000001';
 let entry={active:true,watchlistGroup:'postmarket',publicationReview:{cycleId:cycle}};
 const review={cycleId:cycle,events:[{revision:1,at:1,body:{kind:'approve',publication:{discordWatchlistGroup:'postmarket'}}},{revision:2,body:{kind:'delivery',channel:'website',status:'acknowledged',approvalRevision:1}},{revision:3,body:{kind:'discord_chunk',status:'acknowledged',approvalRevision:1,receipt:{channelId:'10000000000000001',messageId:'10000000000000002'}}}]};
 const service=new Service({entry:()=>entry,review:()=>review,place:async(_s,to)=>{places++;entry.watchlistGroup=to;},send:async()=>{sends++;if(failSend)throw Error('timeout');return{channelId:'10000000000000001',messageId:'10000000000000003'};},verify:async(_input,id)=>({channelId:'10000000000000001',messageId:id})});
 const input={symbol:'TGE',id:'40000000-0000-4000-8000-000000000004',to:'top_watches:2026-10-01',notify:true,actor:owner};
 failDelete=true;let result=await service.execute(input);assert.equal(entry.watchlistGroup,input.to);assert.equal(result.destination,'confirmed');assert.equal(result.cleanup[0].state,'failed');
 failDelete=false;result=await service.execute(input);assert.equal(result.cleanup[0].state,'deleted');assert.equal(sends,1);assert.equal(places,1);assert.equal(deletes,2);
 await service.recordLateReceipt('TGE',cycle,'postmarket',{channelId:'10000000000000001',messageId:'10000000000000009'});assert.equal(deletes,3);assert.equal(sends,1);
 assert.equal(service.status('TGE')[0].current,true);assert.match(service.analysisNote('TGE',cycle,0),/Overnight Watches/);
 await service.execute({...input,id:'50000000-0000-4000-8000-000000000005',to:'general',notify:false});assert.equal(sends,1);assert.equal(service.status('TGE')[0].current,false);
 await service.execute(input);assert.equal(entry.watchlistGroup,'general');assert.equal(sends,1);
 failSend=true;const uncertain={...input,id:'60000000-0000-4000-8000-000000000006',to:'swings'};result=await service.execute(uncertain);assert.equal(result.destination,'uncertain');await service.execute(uncertain);assert.equal(sends,2);
 failSend=false;await service.execute({...uncertain,messageId:'10000000000000004'});assert.equal(sends,2);
 entry.active=false;await assert.rejects(service.execute(uncertain));assert.equal(lateDeletes,0);
 await service.recordLateReceipt('TGE',cycle,'swings',{channelId:'10000000000000001',messageId:'10000000000000008'});assert.equal(lateDeletes,1);
 // Real additive SQLite migration; fake transport and membership boundary.
 const db=new Database(':memory:');db.exec(`CREATE TABLE platform_users(user_id TEXT PRIMARY KEY);CREATE TABLE platform_watchlist_notification_preferences(user_id TEXT,web_push_enabled INTEGER,email_enabled INTEGER);CREATE TABLE platform_web_push_subscriptions(subscription_id TEXT,user_id TEXT,state TEXT);CREATE TABLE platform_notification_email_addresses(email_address_id TEXT,user_id TEXT,state TEXT,updated_at_utc TEXT);CREATE TABLE live_watchlist_symbols(symbol TEXT,status TEXT);`);
 const migrationFile='src/modules/platform/server/database/migrations/0153_platform_watchlist_category_move_notifications.ts';
 const m=loader(root,platformParent,platform)(migrationFile).platformWatchlistCategoryMoveNotificationsMigration;for(const sql of m.statements)db.exec(sql);
 const user='10000000-0000-4000-8000-000000000001',target='20000000-0000-4000-8000-000000000002';
 db.prepare('INSERT INTO platform_users VALUES(?)').run(user);db.prepare('INSERT INTO platform_watchlist_notification_preferences VALUES(?,1,1)').run(user);db.prepare("INSERT INTO platform_web_push_subscriptions VALUES(?,?,'active')").run(target,user);db.prepare("INSERT INTO platform_notification_email_addresses VALUES(?,?,'confirmed','2026-09-30')").run(target,user);db.exec("INSERT INTO live_watchlist_symbols VALUES('TGE','live')");
 let delivered=0,current=true;
 const p=loader(root,platformParent,platform,{
  '@/src/modules/platform/server/database/open-platform-database':{withPlatformDatabase:(_o,fn)=>fn(db),openPlatformDatabase:()=>Object.assign(Object.create(db),{close:()=>{}})},
  '../runtime/watchlist-runtime-admin-client':{requestWatchlistRuntimeRaw:async()=>({ok:true,body:JSON.stringify({moves:[{id:input.id,symbol:'TGE',to:input.to,notify:true,published:true,placement:'complete',destination:'confirmed',notification:'confirmed',current}]})})},
  './watchlist-notification-runtime':{watchlistNotificationAccess:()=>true},
  './watchlist-publication-notification-store':{WatchlistPublicationNotificationStore:class{readPreferences(){return{webPushEnabled:true,emailEnabled:true};}}},
  './watchlist-notification-delivery':{sendWatchlistNotification:async(_db,_row,copy)=>{assert.match(copy.pushTitle,/Overnight Watches/);delivered++;return{sent:true,retry:false,code:'sent'};}},
 });
 const notifications=p('src/modules/watchlist/server/notifications/watchlist-category-move-notifications.ts');notifications.recordCategoryMoveIntent(JSON.stringify(input),owner);notifications.recordCategoryMoveIntent(JSON.stringify(input),owner);
 await notifications.runCategoryMoveNotifications();assert.equal(delivered,2);await notifications.runCategoryMoveNotifications();assert.equal(delivered,2);
 assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_category_move_intents').get().n,1);
 assert.equal(db.prepare("SELECT count(*) n FROM platform_watchlist_category_move_deliveries WHERE state='delivered'").get().n,2);
 db.prepare("UPDATE platform_watchlist_category_move_deliveries SET state='pending',available_at_utc=?").run(new Date(0).toISOString());current=false;
 await notifications.runCategoryMoveNotifications();assert.equal(delivered,2);assert.equal(db.prepare("SELECT count(*) n FROM platform_watchlist_category_move_deliveries WHERE state='inaccessible'").get().n,2);db.close();
 const apiSource=changes.get('src/runtime/manual-watchlist-analysis-review-api.ts');
 const apiModule={exports:{}};vm.runInNewContext(ts.transpileModule(apiSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{module:apiModule,exports:apiModule.exports,require:()=>({}),URLSearchParams,console});
 const dispatch=apiModule.exports.dispatchAnalysisReviewRequest,apiManager={getCategoryMoves:()=>[],moveCategory:async value=>value};
 const request={method:'POST',pathname:'/api/watchlist/analysis-review/category-move',searchParams:new URLSearchParams(),body:input,actor:owner};
 assert.equal((await dispatch({...request,actor:undefined},apiManager)).status,403);
 assert.equal((await dispatch({...request,body:{symbol:'TGE'}},apiManager)).status,400);
 assert.equal((await dispatch(request,apiManager)).status,200);
 assert.equal((await dispatch({...request,method:'GET'},apiManager)).status,200);
 const copy=p('src/modules/watchlist/server/notifications/watchlist-publication-notification-contract.ts').watchlistPublicationNotificationCopy('TNON','analysis',true,{automatic:false,firstAnalysisPrice:2.94,updatedAnalysisPrice:4.12,categoryMoveNote:'Now on Overnight Watches.'});
 assert.match(copy.emailBody,/2\.94/);assert.match(copy.emailBody,/4\.12/);assert.match(copy.emailBody,/40\.1%/);assert.match(copy.emailBody,/Overnight Watches/);
 const pageModule={exports:{}};vm.runInNewContext(ts.transpileModule(changes.get('src/runtime/manual-watchlist-page.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:pageModule,exports:pageModule.exports,require:()=>({})});
 for(const match of pageModule.exports.MANUAL_WATCHLIST_PAGE.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 for(const[file,text]of [...platform,...changes])if(file.endsWith('.ts'))assert.equal(ts.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022}}).diagnostics.length,0,file);
 console.log('PASS: durable runtime move, category-scoped cleanup and retry, no duplicate send, silent move, stale retry suppression, uncertain-send verification, inactive ticker, additive in-memory migration, recipient snapshot, push/email delivery and deduplication. All providers mocked.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
