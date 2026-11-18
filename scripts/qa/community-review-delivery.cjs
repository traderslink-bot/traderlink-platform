const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const Database = require('better-sqlite3');
const guild = '1559172784813514803', foreign = '999000000000000001';
const now = '2026-11-17T16:00:00.000Z';
const modules = new Map();
let permission = true;
const contract = {
  createCanonicalUtcTimestamp: () => now, createCanonicalUuidV4: () => crypto.randomUUID(),
  assertCanonicalUuidV4() {}, assertCanonicalUtcTimestamp() {},
  platformFailure(code) { throw new Error(code); },
};
function load(name) {
  if (modules.has(name)) return modules.get(name);
  const exported = {}; modules.set(name, exported);
  const filename = path.resolve(name);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports: exported, Response, Request, Headers, URL, AbortSignal, Date, BigInt, Map, Set, console,
    require(specifier) {
      if (specifier === 'server-only') return {};
      if (specifier === 'node:crypto') return crypto;
      if (specifier.endsWith('platform-migration-contract')) return contract;
      if (specifier.endsWith('community-publishing-access')) return {
        PublishingAccessError: class extends Error {},
        CommunityPublishingAccess: class {
          constructor(db) { this.db = db; }
          intent(community, kind, id) { const r = this.db.prepare('SELECT distribution,destination_ids_json FROM traderlink_community_publication_distribution WHERE community_id=? AND object_type=? AND object_id=?').get(community, kind, id); return r ? { distribution: r.distribution, destinationIds: JSON.parse(r.destination_ids_json) } : undefined; }
          assertDelivery() { if (!permission) throw new Error('Publisher permission revoked'); }
        },
      };
      if (specifier.endsWith('community-request-verification') && !name.endsWith('community-request-verification.ts')) return { verifyCommunityRequestMember: async () => permission };
      if (specifier.endsWith('community-lifecycle')) return { expireCommunityRecoverySettings() {}, refreshCommunityBotInstallations: async () => {} };
      if (specifier.endsWith('coaching-access-lifecycle')) return { reconcileCoachingAccess() {} };
      if (specifier.endsWith('community-launch-policy')) return { isFreshCommunityEvidence: at => at === now, isApprovedCommunityGuild: () => true };
      if (specifier.endsWith('platform-discord-membership-repository')) return { PlatformDiscordMembershipRepository: class {} };
      if (specifier.endsWith('traderlink-community-repository')) return { TraderLinkCommunityRepository: class {} };
      if (specifier.endsWith('community-admission-service')) return {};
      if (specifier.endsWith('community-branded-destination-url')) return { communityPublicationDestinationUrl: () => 'https://example.test/community/item' };
      let target = specifier.startsWith('@/') ? specifier.slice(2) : path.resolve(path.dirname(filename), specifier);
      return load(target + '.ts');
    },
  });
  return exported;
}
const root = 'src/modules/communities/server/';
function fixture() {
  permission = true;
  const db = new Database(':memory:');
  db.exec(`
CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,discord_guild_id TEXT,slug TEXT,display_name TEXT,status TEXT,owner_user_id TEXT,updated_at_utc TEXT);
CREATE TABLE traderlink_community_discord_destinations(destination_id TEXT PRIMARY KEY,community_id TEXT,discord_channel_id TEXT,status TEXT,content_type TEXT);
CREATE TABLE traderlink_community_content_deliveries(delivery_id TEXT PRIMARY KEY,community_id TEXT,object_type TEXT,object_id TEXT,destination_id TEXT,publisher_user_id TEXT,current_attempt_key TEXT,status TEXT,delivery_outcome TEXT,attempt_count INTEGER,requested_at_utc TEXT,updated_at_utc TEXT,next_attempt_at_utc TEXT,last_error TEXT,discord_message_id TEXT,delivered_at_utc TEXT);
CREATE TABLE traderlink_community_delivery_attempt_history(event_id TEXT,attempt_key TEXT,delivery_id TEXT,community_id TEXT,actor_user_id TEXT,outcome TEXT,discord_message_id TEXT,error_message TEXT,occurred_at_utc TEXT);
CREATE TABLE traderlink_community_lifecycle(community_id TEXT PRIMARY KEY,bot_state TEXT,bot_checked_at_utc TEXT,bot_missing_since_utc TEXT,removed_at_utc TEXT);
CREATE TABLE traderlink_community_coaching_plans(plan_id TEXT,community_id TEXT,name TEXT,description TEXT,price_label TEXT,coach_profile_id TEXT,status TEXT);
CREATE TABLE traderlink_community_coach_profiles(coach_profile_id TEXT,coach_slug TEXT,display_name TEXT,status TEXT);
CREATE TABLE platform_users(user_id TEXT,display_name TEXT,auth_provider TEXT,status TEXT);
CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,auth_subject TEXT,status TEXT);
CREATE TABLE platform_discord_memberships(user_id TEXT,guild_id TEXT,last_verified_at_utc TEXT);
CREATE TABLE traderlink_community_memberships(community_id TEXT,user_id TEXT,status TEXT);
CREATE TABLE traderlink_community_publication_distribution(community_id TEXT,object_type TEXT,object_id TEXT,distribution TEXT,destination_ids_json TEXT);
CREATE TABLE traderlink_community_alerts(alert_id TEXT,community_id TEXT,slug TEXT,title TEXT,symbol TEXT,body TEXT,publishing_mode TEXT,status TEXT,author_user_id TEXT,published_at_utc TEXT);
CREATE TABLE traderlink_community_server_watchlists(watchlist_id TEXT,community_id TEXT,title TEXT,description TEXT,publishing_mode TEXT,status TEXT,author_user_id TEXT,published_at_utc TEXT,ticker_research_json TEXT);
CREATE TABLE traderlink_community_server_watchlist_symbols(watchlist_id TEXT,community_id TEXT,symbol TEXT,note TEXT,ordinal INTEGER);
CREATE TABLE traderlink_community_publication_revisions(revision_id TEXT,community_id TEXT,object_type TEXT,object_id TEXT,evidence_kind TEXT,content_json TEXT,recorded_at_utc TEXT,content_hash TEXT,actor_user_id TEXT);
CREATE TABLE traderlink_community_publication_actions(action_id TEXT,community_id TEXT,object_type TEXT,object_id TEXT,destination_id TEXT,publisher_user_id TEXT,initiating_publisher_user_id TEXT,action_kind TEXT,target_message_id TEXT,payload_json TEXT,revision_id TEXT,status TEXT,attempt_count INTEGER,next_attempt_at_utc TEXT,last_error TEXT,requested_at_utc TEXT,updated_at_utc TEXT,discord_message_id TEXT);
CREATE TABLE traderlink_community_publication_action_attempts(attempt_id TEXT,action_id TEXT,attempt_number INTEGER,outcome TEXT,discord_message_id TEXT,error_message TEXT,occurred_at_utc TEXT);
INSERT INTO traderlink_communities VALUES('test','${guild}','test','TradersLink Tests','active','owner','${now}'),('foreign','${foreign}','foreign','Other','active','owner','${now}');
INSERT INTO traderlink_community_discord_destinations VALUES('target','test','555','active','coaching'),('outside','foreign','666','active','coaching');
INSERT INTO traderlink_community_coach_profiles VALUES('coach','coach','Coach','active');
INSERT INTO traderlink_community_coaching_plans VALUES('plan','test','Plan','Description','Free','coach','active');
INSERT INTO platform_users VALUES('owner','Owner','discord','active'),('publisher','Avery','discord','active');
INSERT INTO platform_auth_identities VALUES('owner','discord','777','active'),('publisher','discord','888','active');
INSERT INTO platform_discord_memberships VALUES('publisher','${guild}','${now}'),('publisher','${foreign}','${now}');
INSERT INTO traderlink_community_memberships VALUES('test','publisher','active'),('foreign','publisher','active');
`);
  const seed = (id, community = 'test', kind = 'plan', requested = now) => db.prepare('INSERT INTO traderlink_community_content_deliveries VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id, community, kind, kind, community === 'test' ? 'target' : 'outside', 'publisher', id, 'pending', 'pending', 0, requested, now, null, null, null, null);
  const requests = [], posts = []; let hook;
  const transport = async (url, options = {}) => {
    const method = options.method ?? 'GET'; requests.push({ url, method });
    if (hook) { const answer = await hook(url, options); if (answer) return answer; }
    assert(!url.includes('/guilds/' + foreign), 'Foreign guild must never reach Discord');
    const pathname = new URL(url).pathname;
    if (method !== 'GET') { assert(url.includes('/channels/555/messages')); posts.push({ method, body: options.body ? JSON.parse(options.body) : null }); return method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json({ id: method === 'PATCH' ? pathname.split('/').pop() : String(1000 + posts.length), channel_id: '555' }); }
    if (pathname.endsWith('/users/@me')) return Response.json({ id: '999', bot: true });
    if (pathname.endsWith('/channels')) return Response.json([{ id: '555', guild_id: guild, type: 0, name: 'tests', permission_overwrites: [] }]);
    if (pathname.endsWith('/roles')) return Response.json([{ id: guild, name: '@everyone', permissions: '68608' }]);
    if (pathname.includes('/members/')) { const id = pathname.split('/').pop(); return Response.json({ user: { id, username: 'synthetic' }, roles: [] }); }
    if (pathname.includes('/messages/')) return Response.json({ id: pathname.split('/').pop(), channel_id: '555', author: { id: '999' } });
    if (pathname.endsWith('/guilds/' + guild)) return Response.json({ id: guild, owner_id: '777', name: 'TradersLink Tests' });
    throw new Error('Unapproved URL ' + url);
  };
  const service = (cutoff) => new (load(root + 'traderlink-community-discord-delivery-service.ts').TraderLinkCommunityDiscordDeliveryService)(db, { botToken: 'synthetic', publicOrigin: 'https://example.test', now: () => now, notBeforeUtc: cutoff }, transport);
  const alert = (body) => {
    db.prepare("UPDATE traderlink_community_discord_destinations SET content_type='alerts' WHERE destination_id='target'").run();
    db.prepare('INSERT INTO traderlink_community_alerts VALUES(?,?,?,?,?,?,?,?,?,?)').run('alert','test','alert','Alert','TEST',body,'discord_post','published','publisher',now);
    db.prepare('INSERT INTO traderlink_community_publication_distribution VALUES(?,?,?,?,?)').run('test','alert','alert','discord','["target"]');
    db.prepare('INSERT INTO traderlink_community_publication_revisions VALUES(?,?,?,?,?,?,?,?,?)').run('original','test','alert','alert','original',JSON.stringify({ title:'Alert',symbol:'TEST',body,publishingMode:'discord_post',authorName:'Avery' }),now,'hash','publisher');
    seed('delivery','test','alert');
  };
  return { db, seed, transport, requests, posts, service, alert, setHook(value) { hook = value; } };
}
let passed = 0;
async function check(name, run) { const f = fixture(); try { await run(f); console.log('PASS ' + name); passed++; } finally { f.db.close(); } }
async function main() {
  await check('foreign queue does not consume LIMIT and Coaching receipt/nonce remains intact', async f => {
    f.seed('outside','foreign','plan','2026-11-16T00:00:00.000Z'); f.seed('allowed');
    assert.equal((await f.service().runAvailable(1)).delivered,1);
    assert.equal(f.posts.length,1); assert.equal(f.posts[0].body.nonce,crypto.createHash('sha256').update('allowed').digest('hex').slice(0,24));
    assert.equal(f.db.prepare("SELECT status FROM traderlink_community_content_deliveries WHERE delivery_id='outside'").get().status,'pending');
    assert.equal(f.db.prepare("SELECT count(*) n FROM traderlink_community_delivery_attempt_history WHERE outcome='confirmed'").get().n,1);
    assert.equal((await f.service().runAvailable()).delivered,0);
  });
  await check('historical cutoff holds older deliveries', async f => { f.seed('old','test','plan','2026-11-16T00:00:00.000Z'); assert.equal((await f.service(now).runAvailable()).delivered,0); assert.equal(f.posts.length,0); });
  await check('concurrent passes claim once', async f => { f.seed('allowed'); await Promise.all([f.service().runAvailable(),f.service().runAvailable()]); assert.equal(f.posts.length,1); });
  await check('destination retarget during channel verification blocks every write', async f => { f.seed('allowed'); f.setHook(async url => { if(url.endsWith('/channels'))f.db.prepare("UPDATE traderlink_communities SET discord_guild_id=? WHERE community_id='test'").run(foreign); }); await f.service().runAvailable(); assert.equal(f.posts.length,0); });
  await check('delivery cancelled during final channel lookup cannot post', async f => { f.seed('allowed'); let lookups=0; f.setHook(async url=>{if(url.endsWith('/channels')&&++lookups===2)f.db.prepare("UPDATE traderlink_community_content_deliveries SET status='cancelled' WHERE delivery_id='allowed'").run();}); await f.service().runAvailable(); assert.equal(f.posts.length,0); assert.equal(f.db.prepare("SELECT status FROM traderlink_community_content_deliveries WHERE delivery_id='allowed'").get().status,"cancelled"); });
  await check('full alert original text and allowed mentions', async f => { f.alert('Exact alert body'); assert.equal((await f.service().runAvailable()).delivered,1); assert(f.posts[0].body.content.includes('Exact alert body')); assert.deepEqual(f.posts[0].body.allowed_mentions.parse,[]); });
  await check('multipart originals retry only missing confirmed parts', async f => {
    f.alert('A full body sentence.\n'.repeat(180)); let attempts=0;
    f.setHook(async (_url, options) => { if(options.method==='POST' && ++attempts===2)return Response.json({retry_after:1},{status:429}); });
    await f.service().runAvailable(); assert.equal(f.posts.length,1);
    f.db.prepare("UPDATE traderlink_community_content_deliveries SET next_attempt_at_utc=NULL WHERE delivery_id='delivery'").run(); f.setHook(undefined);
    await f.service().runAvailable(); const nonces=f.posts.map(p=>p.body.nonce); assert.equal(new Set(nonces).size,nonces.length); assert(f.posts.length>1);
  });
  await check('publisher revocation after first multipart post blocks remaining writes', async f => { f.alert('Body sentence.\n'.repeat(240)); f.setHook(async (_url, options) => { if(options.method==='POST')permission=false; }); await f.service().runAvailable(); assert.equal(f.posts.length,1); });
  await check('approved channel inventory rejects foreign returned channel', async f => { f.seed('allowed'); f.setHook(async url => url.endsWith('/channels') ? Response.json([{id:'555',guild_id:foreign,type:0}]) : undefined); await f.service().runAvailable(); assert.equal(f.posts.length,0); });
  await check('publisher revoked during final channel lookup cannot post', async f => { f.alert('Body'); let lookups=0; f.setHook(async url=>{if(url.endsWith('/channels')&&++lookups===2)permission=false;}); await f.service().runAvailable(); assert.equal(f.posts.length,0); });
  await check('watchlist original and correction retain publisher/channel evidence', async f => {
    f.db.prepare("UPDATE traderlink_community_discord_destinations SET content_type='watchlists' WHERE destination_id='target'").run();
    f.db.prepare('INSERT INTO traderlink_community_server_watchlists VALUES(?,?,?,?,?,?,?,?,?)').run('watchlist','test','Watchlist','Research','discord_post','published','publisher',now,'{}');
    f.db.prepare('INSERT INTO traderlink_community_server_watchlist_symbols VALUES(?,?,?,?,?)').run('watchlist','test','TEST','Note',0);
    f.db.prepare('INSERT INTO traderlink_community_publication_distribution VALUES(?,?,?,?,?)').run('test','watchlist','watchlist','discord','["target"]');
    f.seed('watch','test','watchlist');
    assert.equal((await f.service().runAvailable()).delivered,1); assert(f.posts[0].body.content.includes('TEST'));
    f.db.prepare('INSERT INTO traderlink_community_publication_revisions VALUES(?,?,?,?,?,?,?,?,?)').run('revision','test','watchlist','watchlist','revision',JSON.stringify({title:'Corrected watchlist',description:'Research',symbols:['TEST'],publishingMode:'discord_post'}),now,'hash','publisher');
    const insert=f.db.prepare('INSERT INTO traderlink_community_publication_actions VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    insert.run('foreign-action','foreign','watchlist','watchlist','outside','publisher','publisher','edit','1001','{}','revision','pending',0,null,null,'2026-11-16T00:00:00.000Z',now,null);
    insert.run('action','test','watchlist','watchlist','target','publisher','publisher','edit','1001','{}','revision','pending',0,null,null,now,now,null);
    const actions=new (load(root+'community-publication-action-delivery.ts').CommunityPublicationActionDelivery)(f.db,{botToken:'synthetic',publicOrigin:'https://example.test',now:()=>now},f.transport);
    assert.equal((await actions.runAvailable(1)).confirmed,1); assert.equal(f.posts[1].method,'PATCH');
    assert.equal(f.db.prepare("SELECT status FROM traderlink_community_publication_actions WHERE action_id='foreign-action'").get().status,'pending');
    assert.equal((await actions.runAvailable()).confirmed,0);
  });
  await check('historical revision cutoff holds old action', async f => {
    f.alert('Body');
    f.db.prepare('INSERT INTO traderlink_community_publication_actions VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('old-action','test','alert','alert','target','publisher','publisher','edit','1001','{}','original','pending',0,null,null,'2026-11-16T00:00:00.000Z',now,null);
    const actions=new (load(root+'community-publication-action-delivery.ts').CommunityPublicationActionDelivery)(f.db,{botToken:'synthetic',publicOrigin:'https://example.test',now:()=>now,notBeforeUtc:now},f.transport);
    assert.equal((await actions.runAvailable()).confirmed,0); assert.equal(f.requests.length,0);
  });
  await check('multipart alert correction patches, extends and deletes only bot-owned parts', async f => {
    f.alert('Body');
    const parts=[{operation:'PATCH',messageId:'1001',content:'Corrected first',status:'pending'},{operation:'POST',content:'Added second',status:'pending'},{operation:'DELETE',messageId:'1005',content:'',status:'pending'}];
    f.db.prepare('INSERT INTO traderlink_community_publication_actions VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('multipart-action','test','alert','alert','target','publisher','publisher','edit','1001',JSON.stringify({summary:'Fix',parts}),'original','pending',0,null,null,now,now,null);
    const actions=new (load(root+'community-publication-action-delivery.ts').CommunityPublicationActionDelivery)(f.db,{botToken:'synthetic',publicOrigin:'https://example.test',now:()=>now},f.transport);
    assert.equal((await actions.runAvailable()).confirmed,1);
    assert.deepEqual(f.posts.map(p=>p.method),['PATCH','POST','DELETE']);
    assert.equal((await actions.runAvailable()).confirmed,0); assert.equal(f.posts.length,3);
  });
  await check('revision retarget during final provider lookup cannot write', async f => {
    f.alert('Body');
    f.db.prepare('INSERT INTO traderlink_community_publication_actions VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('action','test','alert','alert','target','publisher','publisher','edit','1001','{}','original','pending',0,null,null,now,now,null);
    let lookups=0; f.setHook(async url=>{if(url.endsWith('/channels')&&++lookups===2)f.db.prepare("UPDATE traderlink_community_discord_destinations SET discord_channel_id='666' WHERE destination_id='target'").run();});
    const actions=new (load(root+'community-publication-action-delivery.ts').CommunityPublicationActionDelivery)(f.db,{botToken:'synthetic',publicOrigin:'https://example.test',now:()=>now},f.transport);
    await actions.runAvailable(); assert.equal(f.posts.length,0);
  });
  await check('uncertain original receipt never automatically resends', async f => {
    f.seed('allowed'); f.setHook(async (_url,options)=>options.method==='POST'?Response.json({},{status:500}):undefined);
    await f.service().runAvailable(); const attempts=f.requests.filter(r=>r.method==='POST').length;
    assert.equal(attempts,1); assert.equal(f.db.prepare("SELECT delivery_outcome FROM traderlink_community_content_deliveries WHERE delivery_id='allowed'").get().delivery_outcome,'uncertain');
    await f.service().runAvailable(); assert.equal(f.requests.filter(r=>r.method==='POST').length,1);
  });
  await check('429 inventory response preserves rate-limit retry boundary', async f => {
    f.seed('allowed'); f.setHook(async url=>url.endsWith('/channels')?Response.json({retry_after:60},{status:429}):undefined);
    await f.service().runAvailable(); const row=f.db.prepare("SELECT delivery_outcome,last_error,next_attempt_at_utc FROM traderlink_community_content_deliveries WHERE delivery_id='allowed'").get();
    assert.equal(row.delivery_outcome,'pending'); assert.equal(row.last_error,'Discord rate limit; retry scheduled.'); assert.equal(row.next_attempt_at_utc,'2026-11-17T16:01:00.000Z'); assert.equal(f.posts.length,0);
  });
  await check('wrong guild rejects owner/resource reads before provider I/O', async f => {
    await assert.rejects(load(root+'community-onboarding-service.ts').verifyCommunityOwner(foreign,'777','synthetic',f.transport));
    await assert.rejects(load(root+'community-discord-resources.ts').readCommunityDiscordResources(foreign,'synthetic',f.transport));
    assert.equal(f.requests.length,0);
  });
  await check('fresh foreign membership and channel readership cannot bypass guild restriction', async f => {
    assert.equal(await load(root+'community-request-verification.ts').verifyCommunityRequestMember(f.db,{slug:'foreign',userId:'publisher',botToken:'synthetic',atUtc:now},f.transport),false);
    assert.equal((await load(root+'community-channel-readership.ts').readCommunityViewerChannels(f.db,'foreign','publisher','synthetic',f.transport)).length,0); assert.equal(f.requests.length,0);
  });
  await check('approved owner/resources/viewer channel reads use only guild inventory', async f => {
    assert.equal((await load(root+'community-onboarding-service.ts').verifyCommunityOwner(guild,'777','synthetic',f.transport)).guildId,guild);
    assert.equal((await load(root+'community-discord-resources.ts').readCommunityDiscordResources(guild,'synthetic',f.transport)).channels[0].id,'555');
    assert.equal((await load(root+'community-channel-readership.ts').readCommunityViewerChannels(f.db,'test','publisher','synthetic',f.transport))[0],'555');
  });
  await check('installation refresh reads approved guild only and ignores old foreign row', async f => {
    await load(root+'community-lifecycle.ts').refreshCommunityBotInstallations(f.db,'synthetic',now,f.transport);
    assert.equal(f.requests.length,1); assert(f.requests[0].url.endsWith('/guilds/'+guild));
    assert.equal(f.db.prepare("SELECT bot_state FROM traderlink_community_lifecycle WHERE community_id='test'").get().bot_state,'connected');
    assert.equal(f.db.prepare("SELECT bot_state FROM traderlink_community_lifecycle WHERE community_id='foreign'").get(),undefined);
  });
  await check('failed installation lookup never marks bot removed', async f => {
    f.setHook(async()=>Response.json({},{status:429}));
    await load(root+'community-lifecycle.ts').refreshCommunityBotInstallations(f.db,'synthetic',now,f.transport);
    assert.equal(f.db.prepare("SELECT bot_state FROM traderlink_community_lifecycle WHERE community_id='test'").get().bot_state,'unavailable');
    assert.equal(f.db.prepare("SELECT status FROM traderlink_communities WHERE community_id='test'").get().status,'active');
  });
  console.log(JSON.stringify({passed, scope:'Actual worker/read helpers and native in-memory SQLite; synthetic Discord and publisher/maintenance adapters, no network.'}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
