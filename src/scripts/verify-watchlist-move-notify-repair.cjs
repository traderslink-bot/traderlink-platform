const assert=require('node:assert/strict'),vm=require('node:vm');
const deps='C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules';
const ts=require(deps+'/typescript'),Database=require(deps+'/better-sqlite3');
const{prepare,source}=require('./package-watchlist-move-notify-repair.cjs');const files=prepare();
let allowed=true,member=true;const user='10000000-0000-4000-8000-000000000001';
const db=new Database(':memory:');db.exec(`CREATE TABLE platform_users(user_id TEXT,status TEXT);CREATE TABLE platform_auth_identities(user_id TEXT,status TEXT,auth_provider TEXT);CREATE TABLE platform_watchlist_notification_preferences(user_id TEXT,web_push_enabled INTEGER,email_enabled INTEGER);CREATE TABLE platform_web_push_subscriptions(subscription_id TEXT,user_id TEXT,state TEXT);CREATE TABLE platform_notification_email_addresses(email_address_id TEXT,user_id TEXT,state TEXT,updated_at_utc TEXT);`);
function load(text,overrides={}){const m={exports:{}};const output=ts.transpileModule(text,{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});assert.equal(output.diagnostics.length,0);vm.runInNewContext(output.outputText,{module:m,exports:m.exports,process:{env:{}},console,URL,require:id=>overrides[id]??{}});return m.exports;}
const accessFile='src/modules/watchlist/server/notifications/watchlist-notification-runtime.ts';
const imports={
 '@/src/modules/platform/server/membership/platform-membership-access':{evaluateMembershipFeature:(_db,_user,feature)=>{assert.equal(feature,'watchlist.access');return{allowed};}},
 '@/src/modules/platform/server/authentication/platform-discord-configuration':{resolveTraderLinkDiscordGuildId:()=> '12345678901234567'},
 '@/src/modules/platform/server/authentication/platform-discord-membership-repository':{PlatformDiscordMembershipRepository:class{findCurrent(){return member?{}:null;}}},
};
assert.throws(()=>load(source(accessFile),imports).watchlistNotificationAccess(db,user),/no such table: platform_watchlist_visibility/);
const access=load(files.get(accessFile),imports).watchlistNotificationAccess;
db.prepare('INSERT INTO platform_users VALUES(?,?)').run(user,'active');db.prepare('INSERT INTO platform_auth_identities VALUES(?,?,?)').run(user,'active','discord');
assert.equal(access(db,user),true);allowed=false;assert.equal(access(db,user),false);allowed=true;member=false;assert.equal(access(db,user),false);member=true;
db.exec("UPDATE platform_users SET status='disabled'");assert.equal(access(db,user),false);db.exec("UPDATE platform_users SET status='active'");
const migration=load(source('src/modules/platform/server/database/migrations/0153_platform_watchlist_category_move_notifications.ts')).platformWatchlistCategoryMoveNotificationsMigration;for(const sql of migration.statements)db.exec(sql);
db.prepare('INSERT INTO platform_watchlist_notification_preferences VALUES(?,1,1)').run(user);db.prepare("INSERT INTO platform_web_push_subscriptions VALUES('push',?,'active')").run(user);db.prepare("INSERT INTO platform_notification_email_addresses VALUES('email',?,'confirmed','2026-10-01')").run(user);
const notify=load(source('src/modules/watchlist/server/notifications/watchlist-category-move-notifications.ts'),{
 'node:crypto':require('node:crypto'),
 '@/src/modules/platform/server/database/open-platform-database':{withPlatformDatabase:(_options,fn)=>fn(db)},
 './watchlist-notification-runtime':{watchlistNotificationAccess:access},
});
const input={id:'20000000-0000-4000-8000-000000000002',symbol:'SDEV',to:'main',notify:true};notify.recordCategoryMoveIntent(JSON.stringify(input),'owner');notify.recordCategoryMoveIntent(JSON.stringify(input),'owner');
assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_category_move_intents').get().n,1);assert.equal(JSON.parse(db.prepare('SELECT recipients_json r FROM platform_watchlist_category_move_intents').get().r).length,2);
db.exec('UPDATE platform_watchlist_notification_preferences SET web_push_enabled=0,email_enabled=0');notify.recordCategoryMoveIntent(JSON.stringify({...input,id:'30000000-0000-4000-8000-000000000003'}),'owner');assert.equal(JSON.parse(db.prepare('SELECT recipients_json r FROM platform_watchlist_category_move_intents WHERE operation_id=?').get('30000000-0000-4000-8000-000000000003').r).length,0);
const rewrite=load(files.get('src/modules/watchlist/server/runtime/watchlist-runtime-admin-document.ts')).rewriteWatchlistRuntimeDocument;
const html=`fetch('/api/watchlist/analysis-review/category-move');fetch("/api/watchlist/move-to-list");fetch('/api/admin/watchlist/runtime/existing')`;
const result=rewrite(html);assert.match(result,/fetch\('\/api\/admin\/watchlist\/runtime\/watchlist\/analysis-review\/category-move'/);assert.match(result,/fetch\("\/api\/admin\/watchlist\/runtime\/watchlist\/move-to-list"/);assert.ok(!result.includes('runtime/admin/watchlist'));assert.equal(rewrite(result).split('<style')[0],result.split('<style')[0]);
for(const[file,text]of files)if(file.endsWith('.ts'))assert.equal(ts.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022}}).diagnostics.length,0,file);
db.close();console.log('PASS: reproduced obsolete-table failure; repaired access, real SQLite notified move intent, opt-ins, deduplication, both API quote styles, idempotent rewrite and TS syntax. No external sends.');
