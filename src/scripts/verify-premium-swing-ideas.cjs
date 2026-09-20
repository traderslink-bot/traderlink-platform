/* Focused, network-free checks. Never opens the application database. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const ts=require('typescript');
const root=process.cwd();
function load(file,mocks={}) {
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
  assert.equal((compiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,file);
  const out={exports:{}};
  vm.runInNewContext(compiled.outputText,{module:out,exports:out.exports,require:name=>{
    if(name==='server-only')return {};
    if(Object.hasOwn(mocks,name)) return mocks[name];
    throw Error('Unexpected dependency '+name);
  },console,process:{env:{NODE_ENV:'production',DISCORD_BOT_TOKEN:'test-only'}},Headers,Request,Response,AbortSignal,TextDecoder,URL,Date,Map,setTimeout,fetch:mocks.fetch});
  return out.exports;
}
async function main(){
const catalog=load('src/modules/swings/swing-idea-catalog.ts');
assert.match(catalog.SWING_IDEA.id,/^[a-f0-9]{32}$/);assert.equal(catalog.isSwingIdeaId('CRML'),false);
assert.ok(!JSON.stringify(catalog).includes('CRML'));
const authFile='src/modules/swings/server/swing-idea-access.ts';
const identity={scope:{userId:'11111111-1111-4111-8111-111111111111'},discord:{guildOwner:false,roleIds:['premium']}};
let identityValue=identity,lastVerifiedAtUtc=new Date().toISOString(),fetchCount=0,roles=['premium'];
const access=load(authFile,{
  '@/src/modules/platform/server/authentication/require-platform-request-scope':{requireTraderLinkPlatformDiscordMemberRequestIdentity(){if(!identityValue)throw Error('no session');return identityValue;}},
  '@/src/modules/watchlist/server/access/platform-discord-watchlist-entitlement':{hasPlatformDiscordPremiumAccess:i=>i.guildOwner||i.roleIds.includes('premium')},
  '@/src/modules/platform/server/database/open-readonly-platform-database':{withReadonlyPlatformDatabase:(_,f)=>f({prepare:()=>({get:()=>({auth_subject:'123456789012345678'})})})},
  '@/src/modules/platform/server/authentication/platform-discord-membership-repository':{PlatformDiscordMembershipRepository:class {findCurrent(){return {lastVerifiedAtUtc};}}},
  '@/src/modules/platform/server/authentication/platform-discord-configuration':{resolveTraderLinkDiscordGuildId:()=> '123456789012345678'},
  fetch:async()=>{fetchCount++;return {ok:true,json:async()=>({roles})};},
});
assert.equal((await access.readSwingIdeaAccess(new Headers())).premium,true);
identityValue=null;assert.equal((await access.readSwingIdeaAccess(new Headers())).premium,false);
identityValue={...identity,discord:{guildOwner:false,roleIds:[]}};
assert.equal((await access.readSwingIdeaAccess(new Headers())).premium,false);
lastVerifiedAtUtc='2020-01-01T00:00:00Z';roles=[];
assert.equal((await access.readSwingIdeaAccess(new Headers())).premium,false);assert.equal(fetchCount,1);
assert.equal((await access.readSwingIdeaAccess(new Headers())).premium,false);assert.equal(fetchCount,1);
const returns=load('src/lib/academy/discord-auth-return.ts');
assert.equal(returns.isSwingIdeaAuthReturnTo('/swings/'+catalog.SWING_IDEA.id),true);
assert.equal(returns.isSwingIdeaAuthReturnTo('/swings/private/anything'),false);
assert.equal(returns.normalizeDiscordAuthReturnTo('//evil.example'),'/watchlist');
const migration=load('src/modules/platform/server/database/migrations/0139_platform_premium_swing_idea_visit_events.ts').platformPremiumSwingIdeaVisitEventsMigration;
assert.equal(migration.executionOrder,139);assert.match(migration.statements[0],/ON DELETE SET NULL/);assert.match(migration.statements[0],/IN \('full','locked'\)/);
const checksum=crypto.createHash('sha256').update(migration.statements.join('\n-- traderlink-statement-boundary --\n').replace(/\r\n?/g,'\n').replace(/\n+$/,'')+'\n').digest('hex');
const content=load('src/modules/swings/server/swing-idea-content.ts');assert.equal(content.SWING_SECTIONS.length,4);assert.ok(content.SWING_SECTIONS.join('').includes('From Oct 1st to Oct 14 2026'));
const preview=fs.readFileSync('docs/migration/previews/swing-idea-design.html','utf8').split('<section data-panel="premium" hidden>')[1].split('</section>')[0];
const blocks=[...preview.matchAll(/<div class="panel">([\s\S]*?)<\/div>/g)].map(m=>m[1].replaceAll('class="divider"',''));
assert.equal(JSON.stringify(blocks),JSON.stringify(content.SWING_SECTIONS));
assert.ok(!content.SWING_SECTIONS.join('').match(/<script|onerror=|javascript:/i));
const detail=fs.readFileSync('app/swings/[ideaId]/page.tsx','utf8');assert.match(detail,/access\.premium \? await import/);assert.match(detail,/force-no-store/);assert.match(detail,/data-pwa-offline-exclude/);
const offline=load('src/modules/platform/contracts/platform-offline-projection-contracts.ts');assert.equal(offline.platformOfflineRouteCanStoreProjection('/swings/'+catalog.SWING_IDEA.id),false);
const route=fs.readFileSync('app/api/swings/visits/route.ts','utf8');assert.match(route,/requirePlatformMutationRequest\(request\)/);assert.match(route,/access\.identity\?\.scope\.userId/);assert.match(route,/bytes > 512/);
const admin=fs.readFileSync('app/admin/journal/swings/page.tsx','utf8');assert.match(admin,/withJournalAdminPageDatabase/);
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(':memory:');
// Disposable repository fixture only: no application path or migration runner.
db.exec("PRAGMA foreign_keys=ON; CREATE TABLE platform_users(user_id TEXT PRIMARY KEY,display_name TEXT); CREATE TABLE platform_premium_swing_idea_visit_events(event_id TEXT PRIMARY KEY,idea_id TEXT,user_id TEXT REFERENCES platform_users(user_id) ON DELETE SET NULL,visited_at_ms INTEGER,access_outcome TEXT,content_revision TEXT);");
db.prepare('INSERT INTO platform_users VALUES (?,?)').run(identity.scope.userId,'Test member');
const visits=load('src/modules/swings/server/swing-idea-visits.ts',{'../swing-idea-catalog':catalog});
const now=Date.now();
const visit={eventId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',userId:identity.scope.userId,premium:true,now};
visits.recordSwingVisit(db,visit);visits.recordSwingVisit(db,visit);
visits.recordSwingVisit(db,{...visit,eventId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',premium:false,userId:null});
let result=visits.readSwingVisits(db,{from:now-1,until:now+1,member:'',outcome:'',page:0});
assert.equal(result.totals.visits,2);assert.equal(result.totals.members,1);assert.equal(result.totals.full,1);assert.equal(result.totals.locked,1);
result=visits.readSwingVisits(db,{from:now-1,until:now+1,member:'TEST MEMBER',outcome:'full',page:0});assert.equal(result.visits.length,1);assert.equal(result.members[0].visits,1);
assert.equal(visits.readSwingVisits(db,{from:now-1,until:now+1,member:'',outcome:'',page:1}).visits.length,0);
db.prepare('DELETE FROM platform_users WHERE user_id=?').run(identity.scope.userId);assert.equal(db.prepare('SELECT COUNT(*) n FROM platform_premium_swing_idea_visit_events WHERE user_id IS NOT NULL').get().n,0);db.close();
console.log('PASS: in-memory visit idempotency, anonymous separation, totals, member/outcome filters, pagination, account deletion.');
console.log('PASS: Premium/Free/anonymous checks, stale-role refresh/cache, safe return path, private-content boundary, verbatim source sections, offline exclusion, visit/admin guards.');
console.log('Migration checksum: '+checksum);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
