import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
const require = createRequire(process.env.TRADERLINK_FOCUSED_DEPENDENCY_PACKAGE || new URL('../../package.json', import.meta.url));
const ts = require('typescript');
const Database = require('better-sqlite3');
const db = new Database(':memory:');
const close = db.close.bind(db);
db.close = () => {};
const root = process.cwd();
const user = '10000000-0000-4000-8000-000000000001';
const device = '20000000-0000-4000-8000-000000000002';
const email = '30000000-0000-4000-8000-000000000003';
const cycle = '40000000-0000-4000-8000-000000000004';
let review;
const cache = new Map();
const mocks = {
  'server-only': {}, 'web-push': { sendNotification: () => { throw new Error('Real push forbidden'); } },
  '@/src/modules/platform/server/database/open-platform-database': { openPlatformDatabase: () => db, withPlatformDatabase: (_, fn) => fn(db) },
  '@/src/modules/platform/server/authentication/platform-discord-membership-repository': { PlatformDiscordMembershipRepository: class { findCurrent(id) { return id === user ? {} : null; } } },
  '@/src/modules/platform/server/authentication/platform-discord-configuration': { resolveTraderLinkDiscordGuildId: () => 'test-guild' },
};
function load(file) {
  file = path.resolve(root,file);
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} }; cache.set(file,module.exports);
  const source = ts.transpileModule(readFileSync(file,'utf8'), { compilerOptions: { target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS } }).outputText;
  const localRequire = id => {
    if (Object.hasOwn(mocks,id)) return mocks[id];
    if (id.includes('watchlist-runtime-admin-client')) return { requestWatchlistRuntimeRaw: async () => ({ ok:true,body:JSON.stringify({review}) }) };
    if (id.startsWith('@/src/modules/platform/server/notifications/')) return {};
    if (id.startsWith('@/')) return load(id.slice(2)+'.ts');
    if (id.startsWith('.')) return load(path.resolve(path.dirname(file),id+'.ts'));
    return require(id);
  };
  vm.runInNewContext(`(function(require,module,exports){${source}\n})`, { Buffer, console, Date, process, URL, AbortSignal })(localRequire,module,module.exports);
  cache.set(file,module.exports); return module.exports;
}
try {
  db.pragma('foreign_keys=ON');
  db.exec(`CREATE TABLE platform_users(user_id TEXT PRIMARY KEY,status TEXT);
    CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,status TEXT);
    CREATE TABLE platform_watchlist_visibility(settings_key TEXT,member_visible INTEGER);
    INSERT INTO platform_watchlist_visibility VALUES('member_visibility',1);
    CREATE TABLE platform_web_push_subscriptions(subscription_id TEXT,user_id TEXT,state TEXT);
    CREATE TABLE platform_notification_email_addresses(email_address_id TEXT,user_id TEXT,state TEXT,updated_at_utc TEXT);
    CREATE TABLE live_watchlist_symbols(symbol TEXT,status TEXT); INSERT INTO live_watchlist_symbols VALUES('YFOR','active');`);
  db.prepare('INSERT INTO platform_users VALUES(?,?)').run(user,'active');
  db.prepare('INSERT INTO platform_auth_identities VALUES(?,?,?)').run(user,'discord','active');
  db.prepare('INSERT INTO platform_web_push_subscriptions VALUES(?,?,?)').run(device,user,'active');
  db.prepare('INSERT INTO platform_notification_email_addresses VALUES(?,?,?,?)').run(email,user,'confirmed',new Date().toISOString());
  const migration=load('src/modules/platform/server/database/migrations/0137_platform_watchlist_publication_notifications.ts').platformWatchlistPublicationNotificationsMigration;
  for(const sql of migration.statements) db.exec(sql);
  for(const sql of load('src/modules/platform/server/database/migrations/0138_platform_watchlist_notification_action_identity.ts').platformWatchlistNotificationActionIdentityMigration.statements) db.exec(sql);
  const Store=load('src/modules/watchlist/server/notifications/watchlist-publication-notification-store.ts').WatchlistPublicationNotificationStore;
  const store=new Store(db);
  store.savePreference(user,'web_push',true,new Date()); store.savePreference(user,'email',true,new Date());
  const runtime=load('src/modules/watchlist/server/notifications/watchlist-notification-runtime.ts');
  const delivery=load('src/modules/watchlist/server/notifications/watchlist-notification-delivery.ts');
  const request={symbol:'YFOR',cycleId:cycle,expectedHead:2,draftRevision:2};
  const actor=`platform-owner:${user}`;
  runtime.recordWatchlistApprovalNotificationIntent(JSON.stringify(request),actor);
  review={cycleId:cycle,symbol:'YFOR',cancelled:false,events:[]};
  await runtime.reconcileWatchlistNotificationApprovals();
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_deliveries').get().n,0);
  const at=Date.now();
  review.events=[{revision:3,actor,at,body:{kind:'approve',draftRevision:2}}];
  const retry=()=>db.exec("UPDATE platform_watchlist_notification_intents SET next_check_at_utc='2000-01-01T00:00:00.000Z'");
  retry(); await runtime.reconcileWatchlistNotificationApprovals();
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_deliveries').get().n,0);
  review.events.push({revision:4,at,body:{kind:'delivery',channel:'website',status:'acknowledged',approvalRevision:3}});
  retry(); await runtime.reconcileWatchlistNotificationApprovals();
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_deliveries').get().n,2);
  // Discord is not acknowledged: both opted-in channels must still be ready.
  runtime.recordWatchlistApprovalNotificationIntent(JSON.stringify(request),actor);
  retry(); await runtime.reconcileWatchlistNotificationApprovals();
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_deliveries').get().n,2);
  store.savePreference(user,'email',false,new Date());
  const sent=[];
  await delivery.deliverWatchlistNotifications(db,10,async (_,row)=>{sent.push(row.channel);return {sent:true,retry:false,code:'sent'};});
  assert.deepEqual(sent,['web_push']);
  assert.equal(db.prepare("SELECT state FROM platform_watchlist_notification_deliveries WHERE channel='email'").get().state,'opted_out');
  await delivery.deliverWatchlistNotifications(db,10,async ()=>{throw new Error('Duplicate send');});
  assert.equal(sent.length,1);
  const next={...request,cycleId:'50000000-0000-4000-8000-000000000005'};
  runtime.recordWatchlistApprovalNotificationIntent(JSON.stringify(next),actor);
  review={...review,cycleId:next.cycleId,cancelled:true};
  await runtime.reconcileWatchlistNotificationApprovals();
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_deliveries').get().n,2);
  const proxy=readFileSync('app/api/admin/watchlist/runtime/[...path]/route.ts','utf8');
  assert.ok(proxy.includes('"/api/watchlist/analysis-review/publish-without-analysis"].includes(pathname) && reviewActor && body'));
  assert.ok(proxy.indexOf('if (!authorized(request))') < proxy.indexOf('recordWatchlistApprovalNotificationIntent(body'));
  assert.deepEqual(db.pragma('foreign_key_check'),[]);
  // Return to the existing public ticker: each new approved analysis has its own choice.
  review={cycleId:cycle,symbol:'YFOR',cancelled:false,events:[]};
  const analysisRequest={...request,expectedHead:5,draftRevision:5,notifyUsers:false};
  runtime.recordWatchlistApprovalNotificationIntent(JSON.stringify(analysisRequest),actor);
  review.events=[{revision:6,actor,at,body:{kind:'approve',draftRevision:5,publication:{notificationKind:'analysis',notifyUsers:false}}},
    {revision:7,at,body:{kind:'delivery',channel:'website',status:'acknowledged',approvalRevision:6}}];
  retry(); await runtime.reconcileWatchlistNotificationApprovals();
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_deliveries').get().n,2);
  assert.equal(db.prepare("SELECT notify_users FROM platform_watchlist_notification_events WHERE notification_kind='analysis'").get().notify_users,0);
  runtime.recordWatchlistApprovalNotificationIntent(JSON.stringify({...analysisRequest,notifyUsers:true}),actor);
  retry(); await runtime.reconcileWatchlistNotificationApprovals();
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_deliveries').get().n,2);
  runtime.recordWatchlistApprovalNotificationIntent(JSON.stringify({...request,expectedHead:8,draftRevision:8,notifyUsers:true}),actor);
  review.events.push({revision:9,actor,at,body:{kind:'approve',draftRevision:8,publication:{notificationKind:'analysis',notifyUsers:true}}},
    {revision:10,at,body:{kind:'delivery',channel:'website',status:'acknowledged',approvalRevision:9}});
  retry(); await runtime.reconcileWatchlistNotificationApprovals();
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_deliveries').get().n,3);
  const listingCycle='60000000-0000-4000-8000-000000000006';
  runtime.recordWatchlistApprovalNotificationIntent(JSON.stringify({symbol:'YFOR',cycleId:listingCycle,expectedHead:1}),actor,true);
  review={cycleId:listingCycle,symbol:'YFOR',cancelled:false,events:[
    {revision:2,actor,at,body:{kind:'approve',draftRevision:0,publication:{notificationKind:'listing',notifyUsers:true}}},
    {revision:3,at,body:{kind:'delivery',channel:'website',status:'acknowledged',approvalRevision:2}}]};
  retry(); await runtime.reconcileWatchlistNotificationApprovals();
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_deliveries').get().n,4);
  console.log('PASS: listing without draft, silent analysis, frozen retry choice, distinct notified analysis revision.');
  console.log('PASS: owner intent → no send before website acknowledgement → independent consent → one send; Discord failure independence, repeat approval, cancellation, authorized-only trigger. In-memory and mocked transports only.');
} finally { close(); }
