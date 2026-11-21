/* Isolated captured-data checks. No Vitest, production databases, credentials or network. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../../../..');
const dependencies = process.env.HALT_QA_DEPENDENCY_ROOT || root;
const external = createRequire(path.join(dependencies, 'package.json'));
const ts = external('typescript'), Database = external('better-sqlite3');
const at = value => Date.parse(value), MONDAY = '2026-11-23T15:00:30.000Z';
function harness(t, extra = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'halt-isolated-'));
  t.after(() => fs.rmSync(directory, { recursive:true, force:true }));
  const ports = { clock:at(MONDAY), owner:true, mutation:true, requests:0, sends:0, ...extra };
  const environment = { NODE_ENV:'test', CRON_SECRET:'synthetic-halt-test-secret', TRADERLINK_MARKET_HALT_SOURCE:'official' };
  const cache = new Map(), overrides = new Map();
  class ClockDate extends Date { constructor(...args) { super(...(args.length ? args : [ports.clock])); } static now(){return ports.clock;} }
  const config = 'src/modules/platform/server/database/platform-database-config.ts';
  overrides.set(config, { resolvePlatformDatabaseConfig:()=>({ databasePath:path.join(directory,'platform.sqlite') }) });
  overrides.set('src/modules/platform/server/authentication/require-platform-request-scope.ts', { requireTraderLinkPlatformRequestIdentity:()=>({}),requireTraderLinkPlatformPageIdentity:async()=>({}) });
  overrides.set('src/modules/watchlist/server/access/watchlist-dashboard-navigation-access.ts', {hasWatchlistDashboardNavigationAccess:()=>ports.owner});
  overrides.set('src/modules/platform/server/authentication/platform-mutation-request-security.ts', { requirePlatformMutationRequest:()=>{if(!ports.mutation)throw Error('fixture denied');} });
  overrides.set('src/modules/platform/server/membership/membership-notification-access.ts', {canReceiveMembershipNotification:()=>true, assertMembershipNotification:()=>{}});
  function resolve(id, from) {
    const base = id.startsWith('@/') ? path.join(root,id.slice(2)) : path.resolve(path.dirname(from),id);
    return [base,base+'.ts',base+'.tsx',base+'.json'].find(p=>fs.existsSync(p)) || base;
  }
  function load(relative) {
    const filename = path.isAbsolute(relative) ? relative : path.join(root,relative), key=path.relative(root,filename);
    if(overrides.has(key))return overrides.get(key);
    if(cache.has(filename))return cache.get(filename).exports;
    if(filename.endsWith('.json'))return JSON.parse(fs.readFileSync(filename,'utf8'));
    const compiledModule={exports:{}};cache.set(filename,compiledModule);
    const require_ = id => id==='server-only' ? {} : ['node:http','node:https'].includes(id) ? {request(){ports.requests++;throw Error('NETWORK DISABLED');}} : id==='web-push' ? {setVapidDetails(){},async sendNotification(){ports.sends++;}} : id.startsWith('@/') || id.startsWith('.') ? load(resolve(id,filename)) : external(id);
    const transformed=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,resolveJsonModule:true}});
    vm.runInNewContext(transformed.outputText,{module:compiledModule,exports:compiledModule.exports,require:require_,process:{env:environment},Buffer,Date:ClockDate,Error,TypeError,RangeError,URL,URLSearchParams,Request,Response,Headers,AbortSignal,AbortController,DOMException,TextDecoder,setTimeout,clearTimeout,console,fetch:async()=>{ports.requests++;throw Error('NETWORK DISABLED');}},{filename});
    return compiledModule.exports;
  }
  const settings=load('src/modules/news/server/market-halt-detection-settings.ts');
  const gate=load('src/modules/news/server/market-halt-session-gate.ts');
  const selected=load('src/modules/news/server/market-halt-selected-feed.ts');
  return {directory,ports,environment,overrides,load,settings,gate,selected};
}
const defaultSettings={enabled:true,source:'official',revision:0,updatedAt:0};
const event=(overrides={})=>({haltDateEt:'2026-11-23',haltTimeEt:'10:00:00',ticker:'TEST',issueName:'Fixture company',market:'NASDAQ',reasonCode:'LUDP',reasonDescription:'Volatility trading pause',source:'nasdaq',resumptionQuoteTimeEt:null,resumptionTradeTimeEt:null,...overrides});
const status=(overrides={})=>({symbol:'TEST',halted:true,haltedAt:'2026-11-23T15:00:00.000000001Z',observedAt:'2026-11-23T15:00:00.000000001Z',statusCode:'H',reasonCode:'LUDP',reason:'Volatility trading pause',tape:'C',...overrides});
const envelope=rows=>({feed:'sip',connected:true,statusesSubscribed:true,statuses:rows});
const official=rows=>({halts:rows,sources:[{source:'nasdaq',available:true,httpStatus:200},{source:'nyse',available:true,httpStatus:200}]});
function native(t,h){
 const db=new Database(':memory:');t.after(()=>db.close());
 db.exec(`CREATE TABLE news_market_halt_events(halt_id TEXT PRIMARY KEY, source TEXT,halt_date_et TEXT,halt_time_et TEXT,ticker TEXT,issue_name TEXT,market TEXT,reason_code TEXT,reason_description TEXT,resumption_quote_time_et TEXT,resumption_trade_time_et TEXT,source_url TEXT,first_seen_at_utc TEXT,updated_at_utc TEXT);
 CREATE TABLE news_market_halt_ticker_day_alert_sequences(ticker TEXT,halt_date_et TEXT,first_halt_id TEXT,initial_notified_at_utc TEXT,last_notified_quote_time_et TEXT,last_notified_trade_time_et TEXT,quote_time_revision INTEGER,trade_time_revision INTEGER,ended_at_utc TEXT,PRIMARY KEY(ticker,halt_date_et));
 CREATE TABLE news_market_halt_discord_deliveries(delivery_id TEXT PRIMARY KEY,halt_id TEXT,channel_id TEXT,notification_stage TEXT,notification_revision INTEGER,notification_title TEXT,notification_body TEXT,state TEXT,attempt_count INTEGER DEFAULT 0,available_at_utc TEXT,expires_at_utc TEXT,created_at_utc TEXT,updated_at_utc TEXT,last_attempt_at_utc TEXT,blocked_until_utc TEXT,discord_message_id TEXT,delivered_at_utc TEXT,failure_code TEXT,UNIQUE(halt_id,channel_id,notification_stage,notification_revision));
 CREATE TABLE news_market_halt_push_deliveries(delivery_id TEXT PRIMARY KEY,halt_id TEXT,subscription_id TEXT,notification_stage TEXT,notification_revision INTEGER,notification_title TEXT,notification_body TEXT,state TEXT,attempt_count INTEGER DEFAULT 0,available_at_utc TEXT,last_attempt_at_utc TEXT,delivered_at_utc TEXT,failure_code TEXT,created_at_utc TEXT,updated_at_utc TEXT);
 CREATE TABLE platform_web_push_subscriptions(subscription_id TEXT,user_id TEXT,state TEXT);
 CREATE TABLE news_market_halt_preferences(user_id TEXT,enabled INTEGER);
 CREATE TABLE news_market_halt_muted_tickers(user_id TEXT,ticker TEXT,expires_at_utc TEXT);
 CREATE TABLE news_market_halt_scheduler_runs(market_halt_scheduler_run_id TEXT,state TEXT,started_at_utc TEXT,finalized_at_utc TEXT,source_statuses_json TEXT,failure_code TEXT);`);
 const {MarketHaltAlertRepository}=h.load('src/modules/news/server/market-halt-alert-repository.ts');
 const {MarketHaltDiscordRepository}=h.load('src/modules/news/server/market-halt-discord-repository.ts');
 return {db,alerts:new MarketHaltAlertRepository(db,'fixture-channel'),discord:new MarketHaltDiscordRepository(db)};
}
function queue(h,n,row=event()) {const receipt=n.alerts.upsert({halt:row,observedAtUtc:new Date(h.ports.clock).toISOString(),sourceUrl:'https://fixture.invalid/source'});n.alerts.reconcileDeliveryLifecycle({haltId:receipt.haltId,observedAtUtc:new Date(h.ports.clock).toISOString()});return receipt;}
test('settings retain old method by default; saved Off/source/revision survive reload; no-op and conflicts are safe',async t=>{
 const h=harness(t);h.environment.TRADERLINK_MARKET_HALT_SOURCE='alpaca';assert.equal(h.settings.readMarketHaltDetectionSettings().source,'official');assert.equal(fs.existsSync(path.join(h.directory,'market-halt-detection-v1')),false);
 const off=await h.settings.saveMarketHaltDetectionSettings({enabled:false,source:'alpaca',revision:0});assert.equal(off.revision,1);assert.equal(h.settings.readMarketHaltDetectionSettings().enabled,false);
 assert.equal((await h.settings.saveMarketHaltDetectionSettings({enabled:false,source:'alpaca',revision:1})).revision,1);
 await assert.rejects(h.settings.saveMarketHaltDetectionSettings({enabled:true,source:'official',revision:0}),/conflict/);
 const restored=await h.settings.saveMarketHaltDetectionSettings({enabled:true,source:'official',revision:1});assert.equal(restored.source,'official');assert.equal(restored.revision,2);assert.equal(h.ports.requests,0);
});
test('malformed and symlink settings fail closed without reverting to an enabled default',async t=>{
 const h=harness(t),folder=path.join(h.directory,'market-halt-detection-v1');fs.mkdirSync(folder);fs.writeFileSync(path.join(folder,'detection.json'),'bad json');assert.throws(()=>h.settings.readMarketHaltDetectionSettings());
 fs.unlinkSync(path.join(folder,'detection.json'));fs.symlinkSync(path.join(h.directory,'missing.json'),path.join(folder,'detection.json'));assert.throws(()=>h.settings.readMarketHaltDetectionSettings());
});
for(const source of ['alpaca','official'])for(const [time,expected,label] of [
 ['2026-11-21T12:21:00Z',false,'Saturday'],['2026-11-22T15:00:00Z',false,'Sunday'],['2026-11-26T15:00:00Z',false,'Thanksgiving'],['2026-11-23T08:59:59Z',false,'before premarket'],['2026-11-23T09:00:00Z',true,'premarket'],['2026-11-23T14:30:00Z',true,'regular'],['2026-11-23T23:59:59Z',true,'postmarket'],['2026-11-24T01:00:00Z',false,'after close'],['2026-11-27T21:59:59Z',true,'early-close postmarket'],['2026-11-27T22:00:00Z',false,'early extended close'],['2040-11-23T15:00:00Z',false,'calendar coverage unavailable']]){
 test(source+' calendar gate: '+label,t=>{const h=harness(t);assert.equal(h.gate.marketHaltWindowOpen({...defaultSettings,source},at(time)),expected);assert.equal(h.gate.marketHaltWindowOpen({...defaultSettings,source,enabled:false},at(time)),false);});
}
test('event guard rejects stale days, invalid/future clocks and keeps legacy saved date support',t=>{
 const h=harness(t);for(const change of [{haltDateEt:'2026-11-21'},{haltTimeEt:'24:00:00'},{haltTimeEt:'10:05:00'},{haltTimeEt:'03:59:00'}])assert.equal(h.gate.marketHaltEventAllowed(event(change),defaultSettings,h.ports.clock),false);
 assert.equal(h.gate.marketHaltEventAllowed(event({haltDateEt:'11/23/2026'}),defaultSettings,h.ports.clock),true);
 assert.equal(h.gate.marketHaltDeliveryAllowed(event(),MONDAY,{...defaultSettings,updatedAt:h.ports.clock+1},h.ports.clock),false);
});
test('captured Saturday TOVX/AIM rows and late Monday discovery cannot start intake; MITT not invented',async t=>{
 const h=harness(t);const captured=h.load('src/modules/news/server/market-halt-feed.ts').parseNyseTradeHalts('Halt Date,Halt Time,Symbol,Name,Exchange,Reason,Resume Date,NYSE Resume Time\n2026-11-21,09:49:21,TOVX,"Theriva Biologics, Inc.",NYSE American,LULD Pause,2026-11-21,09:54:21\n2026-11-21,09:39:15,AIM,AIM ImmunoTech Inc.,NYSE American,LULD Pause,2026-11-21,09:44:15');assert.equal(captured.length,2);
 let calls=0;const deps={official:async()=>{calls++;return official(captured);},gateway:async()=>{calls++;return envelope([]);}};
 for(const source of ['official','alpaca']){const result=await h.selected.fetchSelectedMarketHalts({...defaultSettings,source},at('2026-11-21T15:00:00Z'),deps);assert.equal(result.halts.length,0);}assert.equal(calls,0);
 assert.equal((await h.selected.fetchSelectedMarketHalts(defaultSettings,h.ports.clock,deps)).halts.length,0);
 assert.equal(captured.some(row=>row.ticker==='MITT'),false);
});
test('both real source formats qualify; Alpaca uses gateway and schedules only enrich matching pauses',async t=>{
 const h=harness(t);const parsed=h.load('src/modules/news/server/market-halt-feed.ts').parseNasdaqTradeHalts('<rss><item><ndaq:IssueSymbol>TEST</ndaq:IssueSymbol><ndaq:HaltDate>11/23/2026</ndaq:HaltDate><ndaq:HaltTime>10:00:00</ndaq:HaltTime><ndaq:ReasonCode>LUDP</ndaq:ReasonCode><ndaq:IssueName>Fixture</ndaq:IssueName></item></rss>');
 assert.equal(parsed.length,1);let gateways=0;
 const dependencies={official:async()=>official([...parsed.map(row=>({...row,resumptionQuoteTimeEt:'10:04:00',resumptionTradeTimeEt:'10:05:00'})),event({ticker:'ONLY'})]),gateway:async()=>{gateways++;return envelope([status()]);}};
 const legacy=await h.selected.fetchSelectedMarketHalts(defaultSettings,h.ports.clock,dependencies);assert.equal(legacy.halts.length,2);assert.equal(gateways,0);
 const fresh=await h.selected.fetchSelectedMarketHalts({...defaultSettings,source:'alpaca'},h.ports.clock,dependencies);assert.equal(fresh.halts.length,1);assert.equal(fresh.halts[0].ticker,'TEST');assert.equal(fresh.halts[0].resumptionTradeTimeEt,'10:05:00');assert.equal(fresh.detectedBy,'alpaca');assert.equal(fresh.sources[0].source,'alpaca');
 const noEnrichment=await h.selected.fetchSelectedMarketHalts({...defaultSettings,source:'alpaca'},h.ports.clock,{...dependencies,official:async()=>{throw Error('schedule unavailable');}});assert.equal(noEnrichment.halts.length,1);assert.equal(noEnrichment.halts[0].resumptionTradeTimeEt,null);
});
test('provider failure is not replaced by exchange discovery; partial/duplicate/future/unsupported statuses are handled',async t=>{
 const h=harness(t);let exchangeCalls=0;
 const unavailable=await h.selected.fetchSelectedMarketHalts({...defaultSettings,source:'alpaca'},h.ports.clock,{gateway:async()=>({connected:false}),official:async()=>{exchangeCalls++;return official([event()]);}});assert.equal(unavailable.halts.length,0);assert.equal(unavailable.sources[0].available,false);assert.equal(exchangeCalls,0);
 const normalized=h.selected.normalizeAlpacaHaltStatuses(envelope([null,status(),status(),status({symbol:'OTHER',reasonCode:'T1'}),status({symbol:'FAIL',reasonCode:'IPO'}),status({symbol:'FUTR',haltedAt:'2026-11-23T15:03:00Z'}),status({symbol:'QUOT',haltedAt:null,statusCode:'Q'})]),{...defaultSettings,source:'alpaca'},h.ports.clock);
 assert.equal(normalized.halts.length,1);
 const cta=h.selected.normalizeAlpacaHaltStatuses(envelope([status({symbol:'AIM',tape:'B',reasonCode:'A',statusCode:'2'})]),defaultSettings,h.ports.clock);assert.equal(cta.halts[0].source,'nyse');assert.equal(cta.halts[0].reasonCode,'A');assert.equal(cta.halts[0].reasonDescription,'Additional information requested');
 assert.equal(h.selected.normalizeAlpacaHaltStatuses(envelope([status({reasonCode:'toString'}),status({symbol:'BAD',statusCode:'X'})]),defaultSettings,h.ports.clock).halts.length,0);
});
test('resume schedules require exact date/symbol/halt, unique match and valid future time',t=>{
 const h=harness(t);for(const schedules of [[event({haltDateEt:'2026-11-20',resumptionTradeTimeEt:'10:05:00'})],[event({haltTimeEt:'09:50:00',resumptionTradeTimeEt:'10:05:00'})],[event({resumptionTradeTimeEt:'09:59:00'})],[event(),event()]])assert.equal(h.selected.enrichHaltSchedules([event()],schedules)[0].resumptionTradeTimeEt,null);
 const resumed=h.selected.normalizeAlpacaHaltStatuses(envelope([status({halted:false,tradeResumedAt:'2026-11-23T15:00:20Z',observedAt:'2026-11-23T15:00:20Z',statusCode:'T'})]),defaultSettings,h.ports.clock);assert.equal(resumed.halts.length,0);assert.equal(resumed.resumed.length,1);
});
test('real native queue retains first-alert dedupe across repeated polls/later same-day halts, while storing both events',t=>{
 const h=harness(t),n=native(t,h);queue(h,n);queue(h,n);h.ports.clock+=5*60_000;queue(h,n,event({haltTimeEt:'10:05:00'}));
 assert.equal(n.db.prepare('SELECT count(*) n FROM news_market_halt_discord_deliveries').get().n,1);assert.equal(n.db.prepare('SELECT count(*) n FROM news_market_halt_events').get().n,2);
});
test('Saturday direct enqueue reconciliation creates no delivery or first-alert sequence',t=>{
 const h=harness(t),n=native(t,h);h.ports.clock=at('2026-11-21T14:49:30Z');queue(h,n,event({ticker:'TOVX',source:'nyse',haltDateEt:'2026-11-21',haltTimeEt:'09:49:21'}));
 assert.equal(n.db.prepare('SELECT count(*) n FROM news_market_halt_discord_deliveries').get().n,0);assert.equal(n.db.prepare('SELECT count(*) n FROM news_market_halt_ticker_day_alert_sequences').get().n,0);
});
test('Off and selection changes during channel validation suppress actual Discord POST',async t=>{
 const h=harness(t),n=native(t,h);queue(h,n);let posts=0;
 const {MarketHaltDiscordDeliveryService}=h.load('src/modules/news/server/market-halt-discord-delivery.ts');
 const transport=async(_url,options)=>{if(options.method==='POST'){posts++;return Response.json({id:'123'});}await h.settings.saveMarketHaltDetectionSettings({enabled:false,source:'official',revision:0});return Response.json({id:'fixture-channel',guild_id:'fixture-guild',type:0});};
 const result=await new MarketHaltDiscordDeliveryService(n.discord,{channelId:'fixture-channel',guildId:'fixture-guild',botToken:'synthetic-not-secret'},transport,()=>new Date(h.ports.clock)).runAvailable();
 assert.equal(result.delivered,0);assert.equal(posts,0);assert.equal(n.db.prepare('SELECT state FROM news_market_halt_discord_deliveries').get().state,'expired');
});
test('calendar is rechecked after async channel lookup and before POST',async t=>{
 const h=harness(t),n=native(t,h);h.ports.clock=at('2026-11-24T00:59:59Z');queue(h,n,event({haltTimeEt:'19:59:30'}));let posts=0;
 const {MarketHaltDiscordDeliveryService}=h.load('src/modules/news/server/market-halt-discord-delivery.ts');
 const transport=async(_url,options)=>{if(options.method==='POST')posts++;h.ports.clock=at('2026-11-24T01:00:00Z');return Response.json({id:'fixture-channel',guild_id:'fixture-guild',type:0});};
 await new MarketHaltDiscordDeliveryService(n.discord,{channelId:'fixture-channel',guildId:'fixture-guild',botToken:'synthetic'},transport,()=>new Date(h.ports.clock)).runAvailable();assert.equal(posts,0);
});
test('a stale Saturday alert cannot flush Monday even with a forged future expiry',async t=>{
 const h=harness(t),n=native(t,h);const row=n.alerts.upsert({halt:event({haltDateEt:'2026-11-21'}),observedAtUtc:MONDAY,sourceUrl:'https://fixture.invalid'});
 n.discord.enqueue({channelId:'fixture-channel',haltId:row.haltId,stage:'initial',revision:0,title:'Fixture halt',body:'Fixture only',occurredAtUtc:MONDAY});let calls=0;
 const {MarketHaltDiscordDeliveryService}=h.load('src/modules/news/server/market-halt-discord-delivery.ts');
 await new MarketHaltDiscordDeliveryService(n.discord,{channelId:'fixture-channel',guildId:'fixture-guild',botToken:'synthetic'},async()=>{calls++;throw Error('must not send');},()=>new Date(h.ports.clock)).runAvailable();assert.equal(calls,0);assert.equal(n.db.prepare('SELECT state FROM news_market_halt_discord_deliveries').get().state,'expired');
});
test('confirmed resumption expires pending only; in-flight original and dedupe sequence are preserved',t=>{
 const h=harness(t),n=native(t,h);const receipt=queue(h,n);n.db.prepare("UPDATE news_market_halt_discord_deliveries SET state='sending'").run();
 n.alerts.observeConfirmedResumption({ticker:'TEST',haltDateEt:'2026-11-23',haltTimeEt:'10:00:00.000',resumedAtUtc:'2026-11-23T15:00:20.000Z'},MONDAY);
 assert.equal(n.db.prepare('SELECT state FROM news_market_halt_discord_deliveries').get().state,'sending');assert.ok(n.db.prepare('SELECT ended_at_utc FROM news_market_halt_ticker_day_alert_sequences').get().ended_at_utc);
 assert.equal(n.discord.canSend({delivery_id:n.db.prepare('SELECT delivery_id FROM news_market_halt_discord_deliveries').get().delivery_id,expires_at_utc:'2026-11-23T15:02:00Z'},MONDAY),false);assert.ok(receipt.haltId);
});
test('halt push final-send suppression expires only delivery and preserves active device',t=>{
 const h=harness(t),n=native(t,h),receipt=queue(h,n);n.db.prepare("INSERT INTO platform_web_push_subscriptions VALUES('device','owner','active')").run();
 n.db.prepare("INSERT INTO news_market_halt_push_deliveries(delivery_id,halt_id,subscription_id,state,created_at_utc) VALUES('push',?,'device','sending',?)").run(receipt.haltId,MONDAY);
 const {MarketHaltWebPushRepository}=h.load('src/modules/news/server/market-halt-web-push-repository.ts');const repo=new MarketHaltWebPushRepository(n.db,{});h.ports.clock=at('2026-11-24T15:00:00Z');assert.equal(repo.beforeSend({deliveryRef:'push',timestamp:new Date(h.ports.clock).toISOString()}),false);
 assert.equal(n.db.prepare("SELECT state FROM news_market_halt_push_deliveries WHERE delivery_id='push'").get().state,'expired');assert.equal(n.db.prepare('SELECT state FROM platform_web_push_subscriptions').get().state,'active');
});
test('optional push send hook suppresses halts; unrelated repositories without the hook still send',async t=>{
 const h=harness(t);const {PlatformWebPushDeliveryService}=h.load('src/modules/platform/server/notifications/platform-web-push-delivery-service.ts');let completed=0;
 const delivery={deliveryRef:'fixture',subscriptionRef:'device',attemptCount:1,subscription:{expirationTime:null,endpoint:'https://fcm.googleapis.com/fcm/send/fixture',keys:{auth:'fixture',p256dh:'fixture'}}};
 const configuration={vapid:{subject:'mailto:fixture@example.invalid',publicKey:'fixture',privateKey:'fixture'}};
 const repository={claimNext:()=>delivery,delivered:()=>completed++,unavailable:()=>assert.fail('must not fail')};
 await new PlatformWebPushDeliveryService({...repository,beforeSend:()=>false},configuration).runOne();assert.equal(h.ports.sends,0);
 await new PlatformWebPushDeliveryService(repository,configuration).runOne();assert.equal(h.ports.sends,1);assert.equal(completed,1);
});
test('health records preserve actual single Alpaca provenance and legacy partial exchange semantics',async t=>{
 const h=harness(t),n=native(t,h);const {MarketHaltSchedulerHealthRepository}=h.load('src/modules/news/server/market-halt-scheduler-health-repository.ts');const health=new MarketHaltSchedulerHealthRepository(n.db);
 for(const [sources,expected] of [[[{source:'alpaca',available:true,httpStatus:200}],'ready'],[[{source:'alpaca',available:false,httpStatus:null}],'unavailable'],[[{source:'nasdaq',available:true,httpStatus:200},{source:'nyse',available:false,httpStatus:null}],'limited']]){
  const settings=h.settings.readMarketHaltDetectionSettings();await h.settings.saveMarketHaltDetectionSettings({enabled:true,source:sources[0].source==='alpaca'?'alpaca':'official',revision:settings.revision});
  h.ports.clock+=1000;const now=new Date(h.ports.clock),id=health.begin(now);health.complete({runId:id,sources,now});assert.equal(health.readState(now),expected);
 }
 const settings=h.settings.readMarketHaltDetectionSettings();await h.settings.saveMarketHaltDetectionSettings({enabled:false,source:'official',revision:settings.revision});assert.equal(health.readState(new Date(h.ports.clock)),'unavailable');
});
test('owner settings API: access/mutation/size/typing/conflict and readback; no provider requests',async t=>{
 const h=harness(t),api=h.load('app/api/admin/market-halts/settings/route.ts'),request=body=>new Request('https://fixture.invalid/api/admin/market-halts/settings',{method:'POST',body:typeof body==='string'?body:JSON.stringify(body)});
 h.ports.owner=false;assert.equal((await api.GET(new Request('https://fixture.invalid'))).status,404);h.ports.owner=true;h.ports.mutation=false;assert.equal((await api.POST(request({}))).status,403);h.ports.mutation=true;
 assert.equal((await api.POST(request({enabled:'false',source:'alpaca',revision:0}))).status,400);assert.equal((await api.POST(request('x'.repeat(2050)))).status,413);
 assert.equal((await api.POST(request({enabled:false,source:'alpaca',revision:0}))).status,200);const saved=await(await api.GET(new Request('https://fixture.invalid'))).json();assert.equal(saved.settings.enabled,false);assert.equal(saved.settings.source,'alpaca');assert.equal((await api.POST(request({enabled:true,source:'official',revision:0}))).status,409);assert.equal(h.ports.requests,0);
});
test('Market Events keeps multiple genuine events; notification gate does not cap card results',t=>{
 const h=harness(t);const {selectMarketEventsHalts}=h.load('src/modules/scanner/live/market-events-halts.ts');const rows=[{id:'one',ticker:'TEST',halted:true,haltedAtUtc:'2026-11-23T14:55:00Z',haltTimeEt:'09:55:00',tradeTimeEt:null},{id:'two',ticker:'TEST',halted:true,haltedAtUtc:'2026-11-23T15:00:00Z',haltTimeEt:'10:00:00',tradeTimeEt:null}];
 assert.equal(selectMarketEventsHalts(rows,'2026-11-23',h.ports.clock).rows.length,2);
});
test('cron exits before database/source intake on Saturday or when Off',async t=>{
 const h=harness(t);let opens=0;
 h.overrides.set('src/modules/platform/server/database/open-platform-database.ts',{openPlatformDatabase:()=>{opens++;throw Error('Database must not be opened');}});
 h.overrides.set('src/modules/news/server/market-halt-direction.ts',{marketHaltDirection:async()=>{throw Error('Direction must not run');}});
 h.overrides.set('src/modules/news/server/eodhd-halt-resumption-monitor.ts',{eodhdHaltResumptionMonitor:()=>{throw Error('Monitor must not run');}});
 const route=h.load('app/api/cron/market-halts/route.ts');const request=()=>new Request('https://fixture.invalid/api/cron/market-halts',{headers:{authorization:'Bearer synthetic-halt-test-secret'}});
 h.ports.clock=at('2026-11-21T12:21:00Z');assert.equal((await route.GET(request())).status,200);assert.equal(opens,0);assert.equal(h.ports.requests,0);
 h.ports.clock=at(MONDAY);await h.settings.saveMarketHaltDetectionSettings({enabled:false,source:'official',revision:0});assert.equal((await route.GET(request())).status,200);assert.equal(opens,0);assert.equal(h.ports.requests,0);
});
test('both selected feeds preserve existing universe/cap eligibility and reject BOATS data',t=>{
 const h=harness(t);const {filterMarketHaltsToUniverse}=h.load('src/modules/news/server/market-halt-universe-filter.ts');
 const members=new Map([['2026-11-23',{stocks:[{symbol:'TEST',marketCapAtCollection:1_000_000},{symbol:'LARG',marketCapAtCollection:201_000_000}]}]]);
 const allowed=filterMarketHaltsToUniverse([event(),event({ticker:'LARG'}),event({ticker:'MISS'})],members);assert.equal(allowed.length,1);assert.equal(allowed[0].ticker,'TEST');
 assert.throws(()=>h.selected.normalizeAlpacaHaltStatuses({...envelope([status()]),feed:'boats'},defaultSettings,h.ports.clock));
});
for(const source of ['official','alpaca'])test(source+' selected feed reaches one successful isolated Discord delivery',async t=>{
 const h=harness(t),n=native(t,h);await h.settings.saveMarketHaltDetectionSettings({enabled:true,source,revision:0});const settings=h.settings.readMarketHaltDetectionSettings();
 const data=await h.selected.fetchSelectedMarketHalts(settings,h.ports.clock,{official:async()=>official([event()]),gateway:async()=>envelope([status()])});assert.equal(data.halts.length,1);queue(h,n,data.halts[0]);
 let posts=0;const {MarketHaltDiscordDeliveryService}=h.load('src/modules/news/server/market-halt-discord-delivery.ts');
 const transport=async(_url,options)=>options.method==='POST'?(posts++,Response.json({id:'123456789'})):Response.json({id:'fixture-channel',guild_id:'fixture-guild',type:0});
 const service=new MarketHaltDiscordDeliveryService(n.discord,{channelId:'fixture-channel',guildId:'fixture-guild',botToken:'synthetic'},transport,()=>new Date(h.ports.clock));
 assert.equal((await service.runAvailable()).delivered,1);queue(h,n,data.halts[0]);assert.equal((await service.runAvailable()).delivered,0);assert.equal(posts,1);assert.equal(h.ports.requests,0);
});
test('unknown transport result keeps existing enforced nonce and retry identity',async t=>{
 const h=harness(t),n=native(t,h);queue(h,n);const payloads=[];const {MarketHaltDiscordDeliveryService}=h.load('src/modules/news/server/market-halt-discord-delivery.ts');
 const transport=async(_url,options)=>{if(options.method!=='POST')return Response.json({id:'fixture-channel',guild_id:'fixture-guild',type:0});payloads.push(JSON.parse(options.body));if(payloads.length===1)throw Error('synthetic lost acknowledgement');return Response.json({id:'123456789'});};
 const service=new MarketHaltDiscordDeliveryService(n.discord,{channelId:'fixture-channel',guildId:'fixture-guild',botToken:'synthetic'},transport,()=>new Date(h.ports.clock));
 assert.equal((await service.runAvailable()).delivered,0);h.ports.clock+=16_000;assert.equal((await service.runAvailable()).delivered,1);assert.equal(payloads.length,2);assert.equal(payloads[0].nonce,payloads[1].nonce);assert.equal(payloads[0].enforce_nonce,true);assert.equal(n.db.prepare('SELECT count(*) n FROM news_market_halt_discord_deliveries').get().n,1);
});
test('slow exchange enrichment does not block Alpaca detection; pending reads coalesce and late results enrich',async t=>{
 const h=harness(t);let calls=0,finish;
 const dependencies={gateway:async()=>envelope([status()]),official:()=>{calls++;return new Promise(resolve=>{finish=resolve;});},scheduleWaitMs:1};
 const settings={...defaultSettings,source:'alpaca'};
 const first=await h.selected.fetchSelectedMarketHalts(settings,h.ports.clock,dependencies);assert.equal(first.halts.length,1);assert.equal(first.halts[0].resumptionTradeTimeEt,null);
 await h.selected.fetchSelectedMarketHalts(settings,h.ports.clock,dependencies);assert.equal(calls,1);
 finish(official([event({resumptionTradeTimeEt:'10:05:00'})]));await new Promise(resolve=>setImmediate(resolve));
 assert.equal((await h.selected.fetchSelectedMarketHalts(settings,h.ports.clock,dependencies)).halts[0].resumptionTradeTimeEt,'10:05:00');assert.equal(calls,1);
 h.ports.clock+=121_000;assert.equal((await h.selected.fetchSelectedMarketHalts(settings,h.ports.clock,dependencies)).halts[0].resumptionTradeTimeEt,null);assert.equal(calls,2);
});
