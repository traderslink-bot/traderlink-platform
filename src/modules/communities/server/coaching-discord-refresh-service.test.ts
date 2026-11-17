// @vitest-environment node
import Database from 'better-sqlite3';
import {afterEach,expect,it,vi} from 'vitest';
import {CoachingDiscordRefreshService} from './coaching-discord-refresh-service';
import {COMMUNITY_REVIEW_DISCORD_GUILD_ID as allowed} from './community-review-discord-guild';
import {verifyCommunityRequestMember} from './community-request-verification';
vi.mock('./community-request-verification',()=>({verifyCommunityRequestMember:vi.fn(async()=>true)}));
const databases:Database.Database[]=[];
afterEach(()=>{for(const db of databases.splice(0))db.close();vi.clearAllMocks();});
function fixture(){
 const db=new Database(':memory:');databases.push(db);
 db.exec(`CREATE TABLE traderlink_community_coaching_relationships(community_id TEXT,student_user_id TEXT,coach_user_id TEXT,status TEXT,archived_at_utc TEXT);
 CREATE TABLE traderlink_communities(community_id TEXT,slug TEXT,discord_guild_id TEXT,status TEXT);
 CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,status TEXT);
 CREATE TABLE platform_discord_memberships(user_id TEXT,guild_id TEXT,last_verified_at_utc TEXT);`);
 for(const [id,guild] of [['approved',allowed],['historical','1433570740430573642']]){
  db.prepare('INSERT INTO traderlink_communities VALUES(?,?,?,?)').run(id,id,guild,'active');
  db.prepare('INSERT INTO traderlink_community_coaching_relationships VALUES(?,?,?,?,NULL)').run(id,id+'-student',id+'-coach','active');
  for(const role of ['student','coach'])db.prepare('INSERT INTO platform_auth_identities VALUES(?,?,?)').run(id+'-'+role,'discord','active');
 }
 return db;
}
it('refreshes approved participants while excluding stale historical wrong-guild work',async()=>{
 const db=fixture();
 expect(await new CoachingDiscordRefreshService(db,'synthetic',vi.fn()).runAvailable(25,'2026-11-17T12:00:00.000Z')).toEqual({refreshed:2,unavailable:0});
 expect(vi.mocked(verifyCommunityRequestMember).mock.calls.map(call=>call[1].slug)).toEqual(['approved','approved']);
});
it('makes no provider call when only historical wrong-guild work remains',async()=>{
 const db=fixture();db.prepare('DELETE FROM traderlink_communities WHERE discord_guild_id=?').run(allowed);
 expect(await new CoachingDiscordRefreshService(db,'synthetic',vi.fn()).runAvailable()).toEqual({refreshed:0,unavailable:0});
 expect(verifyCommunityRequestMember).not.toHaveBeenCalled();
});
it('rejects a changed selected target before provider invocation',async()=>{
 const db=fixture(),original=db.prepare.bind(db);
 vi.spyOn(db,'prepare').mockImplementation(((sql:string)=>{
  if(sql.startsWith('WITH participants'))return {all:()=>[{slug:'approved',discord_guild_id:'1433570740430573642',user_id:'approved-student'}]};
  return original(sql);
 }) as typeof db.prepare);
 await expect(new CoachingDiscordRefreshService(db,'synthetic',vi.fn()).runAvailable()).rejects.toThrow();
 expect(verifyCommunityRequestMember).not.toHaveBeenCalled();
});
