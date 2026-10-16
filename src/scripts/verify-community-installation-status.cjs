// Actual read-only action, SQL and provider service; request identity/Discord adapter isolated.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript'),Database=require('better-sqlite3');
const root=path.resolve(__dirname,'../..');
function load(file,requireModule,env={}){
 const output={};const result=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 assert(!result.diagnostics.some(d=>d.category===ts.DiagnosticCategory.Error));
 vm.runInNewContext(result.outputText,{exports:output,require:requireModule,process:{env},Error,Date,AbortSignal,FormData,fetch:(...args)=>provider(...args)});return output;
}
let mode='ready',calls=[],denyIdentity=false,inventoryPage=0,actingUser='owner';
async function provider(url,options){
 calls.push(url);assert.equal(options.cache,'no-store');assert(options.signal instanceof AbortSignal);assert.equal(options.headers.Authorization,'Bot fixture-only');
 const u=new URL(url);
 if(mode==='throw')throw new Error('PRIVATE-SENTINEL');
 if(['403','429','500'].includes(mode))return new Response('{}',{status:Number(mode)});
 if(mode==='badjson')return new Response('invalid-json');
 if(u.pathname.endsWith('/users/@me/guilds')){
  assert.equal(u.searchParams.get('limit'),'200');
  if(mode==='missing')return Response.json([]);
  if(mode==='malformed')return Response.json([{id:123}]);
  if(mode==='bounded'||mode==='pagination'){
   inventoryPage++;const offset=1000+(inventoryPage-1)*200;
   if(mode==='pagination'&&inventoryPage===2)return Response.json([{id:'9000'}]);
   return Response.json(Array.from({length:200},(_,i)=>({id:String(offset+i)})));
  }
  if(mode==='repeat')return Response.json(Array.from({length:200},(_,i)=>({id:String(1000+i)})));
  return Response.json([{id:'9000'}]);
 }
 if(u.pathname.endsWith('/members/111'))return Response.json({user:{id:'111',username:'fixture-owner'},roles:[],joined_at:null});
 if(mode==='owner-403'&&u.pathname.endsWith('/guilds/9000'))return new Response('{}',{status:403});
 if(u.pathname.endsWith('/guilds/9000'))return Response.json({id:'9000',name:'QA owned room',owner_id:mode==='changed-owner'?'222':'111'});
 throw new Error('Unexpected test provider path');
}
const contracts=load('src/modules/communities/contracts/community-installation-status.ts',()=>{throw new Error('Unexpected import');});
const onboarding=load('src/modules/communities/server/community-onboarding-service.ts',id=>{
 if(id.endsWith('/platform-migration-contract'))return {createCanonicalUtcTimestamp:()=>new Date().toISOString()};return {};
});
const service=load('src/modules/communities/server/community-installation-status.ts',id=>{
 if(id==='server-only')return {};
 if(id.endsWith('/community-onboarding-service'))return onboarding;
 if(id.endsWith('/contracts/community-installation-status'))return contracts;
 throw new Error(id);
});
async function main(){
 const db=new Database(':memory:');try{
 db.exec(`CREATE TABLE traderlink_community_discord_guild_candidates(user_id TEXT,discord_guild_id TEXT,guild_owner INTEGER);
 CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,auth_subject TEXT,status TEXT);
 CREATE TABLE traderlink_communities(discord_guild_id TEXT,slug TEXT,owner_user_id TEXT);
 INSERT INTO platform_auth_identities VALUES('owner','discord','111','active'),('other','discord','222','active'),('revoked','discord','333','revoked');
 INSERT INTO traderlink_community_discord_guild_candidates VALUES('owner','9000',1),('owner','100',1),('owner','200',0),('other','300',1),('owner','400',1),('owner','500',1),('revoked','9000',1),('unlinked','9000',1);
 INSERT INTO traderlink_communities VALUES('100','existing-room','owner'),('400','other-private-room','other');`);
 const env={TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS:'100,200,300,400,9000',TRADERLINK_DISCORD_BOT_TOKEN:'fixture-only'};
 const policy=load('src/modules/communities/server/community-launch-policy.ts',()=>{throw new Error('Unexpected import');},env);
 const action=load('app/(dashboard)/communities/community-installation-actions.ts',id=>{
  if(id.endsWith('/require-platform-request-scope'))return {requireTraderLinkPlatformPageIdentity:async()=>{if(denyIdentity)throw new Error('SIGN_IN_REQUIRED');return {scope:{userId:actingUser}};}};
  if(id.endsWith('/open-readonly-platform-database'))return {withReadonlyPlatformDatabase:(_options,run)=>run(db)};
  if(id.endsWith('/community-launch-policy'))return policy;
  if(id.endsWith('/server/community-installation-status'))return service;
  if(id.endsWith('/contracts/community-installation-status'))return contracts;
  throw new Error(id);
 },env).checkCommunityInstallation;
 const run=async(id='9000')=>{calls=[];inventoryPage=0;const f=new FormData();f.set('discordGuildId',id);return action(f);};
 const changes=db.prepare('SELECT total_changes() n').get().n;
 assert.equal((await run()).state,'ready');assert.equal(calls.length,3);
 assert.equal((await run('100')).state,'connected');assert.equal(calls.length,0);
 assert.equal((await run('100')).href,'/communities/existing-room/manage');
 for(const id of ['200','300','400','500','invalid']){assert.equal((await run(id)).state,'owner_required');assert.equal(calls.length,0);}
 for(actingUser of ['revoked','unlinked']){assert.equal((await run()).state,'owner_required');assert.equal(calls.length,0);}actingUser='owner';
 mode='missing';assert.equal((await run()).state,'not_installed');assert.equal(calls.length,1);
 mode='changed-owner';assert.equal((await run()).state,'owner_required');
 for(mode of ['403','429','500','throw','badjson','malformed']){
  const result=await run();assert.equal(result.state,'unavailable');assert(!JSON.stringify(result).includes('PRIVATE-SENTINEL'));assert.equal(calls.length,1,'No immediate provider retry');
 }
 mode='owner-403';assert.equal((await run()).state,'unavailable');assert.equal(calls.length,3,'Listed installation with inaccessible owner evidence is not ready or absent');
 mode='pagination';assert.equal((await run()).state,'ready');assert.equal(calls.length,4);assert(calls[1].includes('after=1199'));
 mode='bounded';assert.equal((await run()).state,'unavailable');assert.equal(calls.length,3,'Incomplete bounded inventory cannot mean absent');
 mode='repeat';assert.equal((await run()).state,'unavailable');assert.equal(calls.length,2,'Nonadvancing cursor stops');
 env.TRADERLINK_DISCORD_BOT_TOKEN='';mode='ready';assert.equal((await run()).state,'unavailable');assert.equal(calls.length,0);
 env.TRADERLINK_DISCORD_BOT_TOKEN='fixture-only';denyIdentity=true;await assert.rejects(run(),/SIGN_IN_REQUIRED/);assert.equal(calls.length,0);
 assert.equal(db.prepare('SELECT total_changes() n').get().n,changes,'Status action never writes candidates, communities, memberships or grants');
 console.log('PASS: actual installation action/SQL/provider service: present/absent/changed owner, admission/identity/owner isolation, connected preservation, safe failures/429/no retries, pagination/bounds and zero writes. Isolated proof only.');
 }finally{db.close();}
}
module.exports={load};
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
