// Real scheduling SQL, synthetic minimal query tables; provider adapter always fails.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript'),Database=require('better-sqlite3');
async function main(){
 const database=new Database(':memory:');
 try{
 database.exec(`CREATE TABLE traderlink_community_coaching_relationships(community_id TEXT,student_user_id TEXT,coach_user_id TEXT,status TEXT,archived_at_utc TEXT);
 CREATE TABLE traderlink_communities(community_id TEXT,slug TEXT,discord_guild_id TEXT,status TEXT);
 CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,status TEXT);
 CREATE TABLE platform_discord_memberships(user_id TEXT,guild_id TEXT,last_verified_at_utc TEXT);
 INSERT INTO traderlink_communities VALUES('a','first','1','active'),('b','second','10','active');
 INSERT INTO traderlink_community_coaching_relationships VALUES('a','student','coach','active',NULL),('b','student','coach','active',NULL);
 INSERT INTO platform_auth_identities VALUES('student','discord','active'),('coach','discord','active');`);
 const attempts=[],output={};
 const source=fs.readFileSync(path.resolve(__dirname,'../modules/communities/server/coaching-discord-refresh-service.ts'),'utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:output,Date,require(id){
  if(id.endsWith('/platform-migration-contract'))return {assertCanonicalUtcTimestamp:()=>{}};
  if(id.endsWith('/community-request-verification'))return {verifyCommunityRequestMember:async(_db,input)=>{attempts.push(input.slug+':'+input.userId);return false;}};
  throw new Error(id);
 }});
 const cursor={after:null};
 for(let tick=0;tick<8;tick++)await new output.CoachingDiscordRefreshService(database,'synthetic',()=>{throw Error('No network');},cursor).runAvailable(1,'2026-10-15T14:00:00.000Z');
 assert.equal(new Set(attempts.slice(0,4)).size,4,'All guild/user pairs must be attempted before wrap, including prefix guild IDs');
 for(const item of new Set(attempts))assert.equal(attempts.filter(value=>value===item).length,2);
 console.log('PASS: all four guild/user targets, prefix guild IDs, persistent failures, recreated service and two full wraps; real SQL with isolated provider adapter.');
 }finally{database.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
