const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript'),Database=require('better-sqlite3');
const guild='1559172784813514803',foreign='999000000000000001';
const root='src/modules/communities/server/',stats=root+'stats/';
let admitted=true,memberAllowed=true,channelCalls=0,webSockets=0,mode='enabled';
const capabilities=['community.alerts.create'];
const contract={platformFailure(code){const e=new Error(code);e.code=code;throw e;},isTraderLinkPlatformError:e=>!!e?.code};
class Socket{static OPEN=1;constructor(){webSockets++;}close(){}send(){}}
function loader(extra={}){
 const modules=new Map();
 function load(name){
  if(modules.has(name))return modules.get(name);
  const exports={};modules.set(name,exports);
  const code=ts.transpileModule(fs.readFileSync(name,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(code,{exports,process,console,Response,Request,Headers,URL,TextDecoder,Uint8Array,AbortSignal,Date,BigInt,WebSocket:Socket,setTimeout,clearTimeout,setInterval,clearInterval,fetch:()=>{throw new Error('Network forbidden');},require(specifier){
   if(Object.hasOwn(extra,specifier))return extra[specifier];
   if(specifier==='server-only')return {};
   if(specifier.startsWith('node:'))return require(specifier);
   if(specifier.endsWith('platform-migration-contract'))return contract;
   if(specifier.endsWith('platform-background-worker-mode'))return {resolvePlatformBackgroundWorkerMode:()=>mode};
   if(specifier.endsWith('watchlist-dashboard-navigation-access'))return {hasWatchlistDashboardNavigationAccess:()=>admitted};
   if(specifier.endsWith('require-platform-request-scope'))return {requireTraderLinkPlatformRequestIdentity:()=>({scope:{userId:'actor'}})};
   if(specifier.endsWith('community-request-access'))return {requireCommunityRequestAccess:async()=>{if(!memberAllowed)contract.platformFailure('TRADERLINK_WORKSPACE_ACCESS_DENIED');}};
   if(specifier.endsWith('traderlink-community-repository'))return {TraderLinkCommunityRepository:class{requireCapability(){return {isOwner:false,capabilities};}}};
   if(specifier.endsWith('community-channel-readership'))return {readCommunityViewerChannels:async()=>{channelCalls++;return ['123'];}};
   if(specifier.endsWith('community-launch-policy'))return {approvedCommunityGuildIds:()=>[guild,foreign]};
   const target=specifier.startsWith('@/')?specifier.slice(2):path.resolve(path.dirname(name),specifier);
   return load(target+'.ts');
  }});return exports;
 }return load;
}
const load=loader();
function fixture(){
 const db=new Database(':memory:');
 db.exec(`CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,slug TEXT,discord_guild_id TEXT,status TEXT,owner_user_id TEXT,display_name TEXT);
 CREATE TABLE platform_users(user_id TEXT PRIMARY KEY,status TEXT);
 CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,auth_subject TEXT,status TEXT);
 CREATE TABLE traderlink_community_lifecycle(community_id TEXT,removed_at_utc TEXT);
 CREATE TABLE platform_discord_memberships(user_id TEXT,guild_id TEXT,role_ids_json TEXT);`);
 for(const [file,key] of [['0173_traderlink_community_stats','traderLinkCommunityStatsMigration'],['0174_traderlink_community_stats_history','traderLinkCommunityStatsHistoryMigration'],['0215_traderlink_community_stats_attribution','traderLinkCommunityStatsAttributionMigration']])for(const sql of load(root+'database/migrations/'+file+'.ts')[key].statements)db.exec(sql);
 const at=new Date().toISOString();
 db.prepare("INSERT INTO traderlink_communities VALUES('c','harbor',?,'active','owner','Harbor')").run(guild);
 db.exec("INSERT INTO platform_users VALUES('owner','active'); INSERT INTO platform_auth_identities VALUES('owner','discord','77','active');");
 db.prepare("INSERT INTO platform_discord_memberships VALUES('actor',?,'[]')").run(guild);
 const repo=new (load(stats+'community-stats-repository.ts').CommunityStatsRepository)(db);repo.ensureCommunity('c',at);
 db.exec(`UPDATE community_stats_settings SET discord_enabled=1,channel_ids_json='["123"]',own_content_user_ids_json='["actor"]';`);
 for(const source of ['discord','membership'])repo.source('c',source,'collecting',at);
 return db;
}
let count=0;async function test(name,fn){await fn();count++;console.log('PASS '+name);}
(async()=>{
 process.env.TRADERLINK_COMMUNITY_STATS_ENABLED='1';
 await test('real own-content authorization requires explicit grant and publisher capability',async()=>{
  const db=fixture(),access=load(stats+'community-stats-access.ts');
  const scope=await access.authorizeCommunityStats(db,'harbor','actor');assert.equal(scope.ownContentOnly,true);assert.equal(scope.canExport,false);assert.equal(channelCalls,1);
  db.exec("UPDATE community_stats_settings SET own_content_user_ids_json='[]'");await assert.rejects(access.authorizeCommunityStats(db,'harbor','actor'),/ACCESS_DENIED/);
  await assert.rejects(access.authorizeCommunityStats(db,'harbor','actor','settings'),/ACCESS_DENIED/);db.close();
 });
 await test('foreign guild denies reports before channel I/O',async()=>{const db=fixture();db.prepare('UPDATE traderlink_communities SET discord_guild_id=?').run(foreign);const before=channelCalls;await assert.rejects(load(stats+'community-stats-access.ts').authorizeCommunityStats(db,'harbor','actor'),/ACCESS_DENIED/);assert.equal(channelCalls,before);db.close();});
 await test('membership denial cannot be replaced by Stats grant',async()=>{const db=fixture();memberAllowed=false;await assert.rejects(load(stats+'community-stats-access.ts').authorizeCommunityStats(db,'harbor','actor'),/ACCESS_DENIED/);memberAllowed=true;db.close();});
 await test('canonical identity gate rejects before report/export/settings/visit storage access',async()=>{
  const gate=load(root+'community-owner-review-request-identity.ts');admitted=false;
  const access={...load(stats+'community-stats-access.ts')};
  const denyDB={openReadonlyPlatformDatabase(){throw new Error('Storage opened before gate');},openPlatformDatabase(){throw new Error('Storage opened before gate');}};
  const routeLoad=loader({'@/src/modules/communities/server/community-owner-review-request-identity':gate,'@/src/modules/platform/server/database/open-readonly-platform-database':denyDB,'@/src/modules/platform/server/database/open-platform-database':denyDB,'@/src/modules/communities/server/stats/community-stats-access':access,'@/src/modules/communities/server/stats/community-stats-read':{},'@/src/modules/communities/server/stats/community-stats-catalog':{},'@/src/modules/communities/server/stats/community-stats-workbook':{},'@/src/modules/communities/server/stats/community-stats-visits':{}});
  const route=routeLoad('app/api/communities/[communitySlug]/stats/route.ts'),visits=routeLoad('app/api/communities/[communitySlug]/stats/visits/route.ts');
  const context={params:Promise.resolve({communitySlug:'harbor'})};
  for(const q of ['', '?format=csv','?format=xlsx','?personal=1','?settings=1'])assert.equal((await route.GET(new Request('https://example.test/api/stats'+q),context)).status,404);
  assert.equal((await route.POST(new Request('https://example.test/api/stats',{method:'POST',headers:{origin:'https://example.test'}}),context)).status,404);
  process.env.TRADERLINK_COMMUNITY_STATS_ENABLED='0';assert.equal((await visits.POST(new Request('https://example.test/api/stats/visits',{method:'POST',headers:{origin:'https://example.test'}}),context)).status,404);
  process.env.TRADERLINK_COMMUNITY_STATS_ENABLED='1';admitted=true;
 });
 await test('queued foreign community history performs no REST reads',async()=>{const db=fixture();db.prepare('UPDATE traderlink_communities SET discord_guild_id=?').run(foreign);let calls=0;const history=new (load(stats+'community-stats-history.ts').CommunityStatsHistory)(db,async()=>{calls++;throw new Error('Forbidden');});await history.tick(['c'],'synthetic');assert.equal(calls,0);db.close();});
 await test('disabled history performs no reads despite queued eligible community',async()=>{const db=fixture();let calls=0;process.env.TRADERLINK_COMMUNITY_STATS_ENABLED='0';await new (load(stats+'community-stats-history.ts').CommunityStatsHistory)(db,async()=>{calls++;}).tick(['c'],'synthetic');assert.equal(calls,0);process.env.TRADERLINK_COMMUNITY_STATS_ENABLED='1';db.close();});
 await test('history rechecks stored guild before REST even for retained eligible snapshot',async()=>{const db=fixture();let calls=0;const h=new (load(stats+'community-stats-history.ts').CommunityStatsHistory)(db,async()=>{calls++;});const snapshot=h.eligible('c');db.prepare('UPDATE traderlink_communities SET discord_guild_id=?').run(foreign);await assert.rejects(h.get('/guilds/'+guild,'synthetic',snapshot));assert.equal(calls,0);db.close();});
 for(const verified of [false,true])await test('queued thread requires fresh approved-guild inventory; verified='+verified,async()=>{
  const db=fixture();let calls=0;const at=new Date().toISOString();
  const jobs=load(stats+'community-stats-history-storage.ts');jobs.ensureStatsHistoryJob(db,'c',0,guild,'active',at);db.exec("UPDATE community_stats_history_jobs SET status='complete'");jobs.ensureStatsHistoryJob(db,'c',0,'456','messages',new Date(Date.now()-2000).toISOString(),'123');
  const h=new (load(stats+'community-stats-history.ts').CommunityStatsHistory)(db,async url=>{calls++;assert.equal(url,'https://discord.com/api/v10/channels/456/messages?limit=100');return Response.json([]);});
  h.botId='55';h.botToken='synthetic';h.topology.set('c:0',{roles:[],channels:new Map([['123',{name:'Test',type:0}]]),threads:new Set(verified?['456']:[]),at:Date.now(),topologyAt:'',phase:'ready'});
  await h.tick(['c'],'synthetic');assert.equal(calls,verified?1:0);assert.equal(db.prepare("SELECT status FROM community_stats_history_jobs WHERE channel_id='456'").get().status,verified?'complete':'blocked');db.close();
 });
 await test('runtime disabled-worker admission happens before opening storage',()=>{
  let opened=0;const runtime=loader({'../../../platform/server/database/open-platform-database':{openPlatformDatabase(){opened++;throw new Error('Unexpected storage');}}})(stats+'community-stats-runtime.ts');mode='disabled_private_acceptance';runtime.startHostedCommunityStats();assert.equal(opened,0);mode='enabled';process.env.TRADERLINK_COMMUNITY_STATS_ENABLED='0';runtime.startHostedCommunityStats();assert.equal(opened,0);process.env.TRADERLINK_COMMUNITY_STATS_ENABLED='1';
 });
 await test('Gateway drops foreign guild registration and cannot open websocket',()=>{const db=fixture(),before=webSockets;const g=new (load(stats+'community-stats-discord-gateway.ts').CommunityStatsDiscordGateway)(()=>db,'synthetic',[{communityId:'c',guildId:foreign,channelIds:['123']}]);g.start();assert.equal(g.guilds.size,0);assert.equal(webSockets,before);db.close();});
 await test('Gateway rejects stale guild/configuration and disabled-worker startup',()=>{const db=fixture(),before=webSockets;const G=load(stats+'community-stats-discord-gateway.ts').CommunityStatsDiscordGateway;const g=new G(()=>db,'synthetic',[{communityId:'c',guildId:guild,channelIds:['123']}]);const registered=g.guilds.get(guild);assert.equal(g.currentGuild(registered),true);db.exec('UPDATE community_stats_settings SET discord_configuration_version=1');assert.equal(g.currentGuild(registered),false);g.start();assert.equal(webSockets,before);db.exec('UPDATE community_stats_settings SET discord_configuration_version=0');mode='disabled_private_acceptance';g.start();assert.equal(webSockets,before);mode='enabled';db.close();});
 await test('invite REST queue rejects foreign and retargeted stored guilds',async()=>{const db=fixture();let calls=0;const I=load(stats+'community-stats-invites.ts').CommunityStatsInvites,i=new I(db,'synthetic',async()=>{calls++;});i.start({communityId:'c',guildId:foreign,valid:()=>true});assert.equal(i.sessions.size,0);i.start({communityId:'c',guildId:guild,valid:()=>true});const s=i.sessions.get('c');clearTimeout(s.timer);db.prepare('UPDATE traderlink_communities SET discord_guild_id=?').run(foreign);await assert.rejects(i.get('/guilds/'+guild+'/invites',s));assert.equal(calls,0);i.stop();db.close();});
 await test('bot channel inventory excludes explicit foreign-guild response rows',()=>{const select=load(stats+'community-stats-channel-selection.ts');const channels=select.statsBotChannels(guild,[{id:guild,permissions:'8'}],[{id:'123',guild_id:guild,type:0,name:'Allowed',permission_overwrites:[]},{id:'456',guild_id:foreign,type:0,name:'Denied',permission_overwrites:[]}],{user:{id:'55'},roles:[]});assert.deepEqual([...channels.keys()],['123']);});
 await test('Stats erasure clears current identity, grants and historic linked rows in transaction',()=>{const db=fixture(),at=new Date().toISOString();db.exec("INSERT INTO platform_auth_identities VALUES('actor','discord','88','active')");db.prepare("INSERT INTO community_stats_identity_links(community_id,platform_user_id,discord_user_id,from_utc) VALUES('c','actor','88',?)").run(at);db.prepare("INSERT INTO community_stats_settings_audit VALUES('audit','c','actor',?,'{}')").run(at);const retention=load(stats+'community-stats-retention.ts');retention.eraseCommunityStatsIdentity(db,'actor');assert.equal(db.prepare('SELECT count(*) n FROM community_stats_identity_links').get().n,0);assert.equal(db.prepare('SELECT count(*) n FROM community_stats_settings_audit').get().n,0);assert.equal(db.prepare('SELECT own_content_user_ids_json v FROM community_stats_settings').get().v,'[]');assert.equal(db.prepare('SELECT count(*) n FROM community_stats_history_exclusions').get().n,1);assert.equal(retention.pruneCommunityStats(db,at).removed,0);db.close();});
 console.log('Passed '+count+' focused current-source Stats scenarios; synthetic identity/permission/provider adapters; native SQLite '+new Database(':memory:').prepare('select sqlite_version() v').get().v+'. No network.');
})().catch(error=>{console.error(error);process.exitCode=1;});
