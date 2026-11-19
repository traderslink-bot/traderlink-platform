// @vitest-environment node
// Glue contract only: native disposable metadata, local provider fixtures and
// stubbed Shared verification/capability boundaries. Not hosted authorization proof.
import Database from "better-sqlite3";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
const boundary=vi.hoisted(()=>({verify:vi.fn(),access:vi.fn()}));
vi.mock("../community-request-access",()=>({requireCommunityRequestAccess:boundary.verify}));
vi.mock("../traderlink-community-repository",()=>({TraderLinkCommunityRepository:class{requireCapability=boundary.access;}}));
vi.mock("./community-stats-repository",()=>({communityStatsStorageReady:()=>true}));
import {authorizeCommunityStats} from "./community-stats-access";
import {COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID as MAIN,COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS as CHANNELS} from "../community-review-discord-guild";
const USER="10000000-0000-4000-8000-000000000001",COMMUNITY="10000000-0000-4000-8000-000000000002",DISCORD="100000000000000001";
const databases:Database.Database[]=[];
function fixture(guild=MAIN){
 const db=new Database(":memory:");databases.push(db);db.exec(`
 CREATE TABLE traderlink_communities(community_id TEXT,slug TEXT,status TEXT,discord_guild_id TEXT,display_name TEXT,owner_user_id TEXT);
 CREATE TABLE platform_users(user_id TEXT,status TEXT);
 CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,status TEXT,auth_subject TEXT);
 CREATE TABLE traderlink_community_memberships(community_id TEXT,user_id TEXT,status TEXT);
 CREATE TABLE traderlink_community_lifecycle(community_id TEXT,removed_at_utc TEXT);
 CREATE TABLE platform_discord_memberships(user_id TEXT,guild_id TEXT,role_ids_json TEXT);
 CREATE TABLE community_stats_settings(community_id TEXT,own_content_user_ids_json TEXT,export_user_ids_json TEXT);`);
 db.prepare("INSERT INTO traderlink_communities VALUES(?,'qa-main','active',?,'Synthetic Main',?)").run(COMMUNITY,guild,USER);
 db.prepare("INSERT INTO platform_users VALUES(?,'active')").run(USER);
 db.prepare("INSERT INTO platform_auth_identities VALUES(?,'discord','active',?)").run(USER,DISCORD);
 db.prepare("INSERT INTO traderlink_community_memberships VALUES(?,?,'active')").run(COMMUNITY,USER);
 db.prepare("INSERT INTO platform_discord_memberships VALUES(?,?,'[]')").run(USER,guild);
 db.prepare("INSERT INTO community_stats_settings VALUES(?,'[]','[]')").run(COMMUNITY);
 return db;
}
beforeEach(()=>{vi.clearAllMocks();boundary.verify.mockResolvedValue(undefined);boundary.access.mockReturnValue({isOwner:true,capabilities:["community.view","community.analytics.view","community.member_activity.view"]});});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();for(const db of databases.splice(0))db.close();});
describe("Stats Main authorizer integration boundaries",()=>{
 it("selects the fixed internal Stats verification intent and keeps native owner grants",async()=>{
  const db=fixture(),scope=await authorizeCommunityStats(db,"qa-main",USER,"settings");
  expect(boundary.verify).toHaveBeenCalledExactlyOnceWith({slug:"qa-main",userId:USER,reviewIntent:"stats"});
  expect(scope).toMatchObject({guildId:MAIN,isOwner:true,canExport:true,canReadNamed:true});
 });
 it("does not opt an unrelated guild into Shared verification",async()=>{
  const db=fixture("199999999999999999");await expect(authorizeCommunityStats(db,"qa-main",USER)).rejects.toThrow("TRADERLINK_WORKSPACE_ACCESS_DENIED");expect(boundary.verify).not.toHaveBeenCalled();
 });
 it("does not bypass a failed native request verification",async()=>{
  const db=fixture();boundary.verify.mockRejectedValueOnce(new Error("Synthetic verification refused"));await expect(authorizeCommunityStats(db,"qa-main",USER)).rejects.toThrow("Synthetic verification refused");expect(boundary.access).not.toHaveBeenCalled();
 });
 it("rejects a community relink during verification before returning a scope",async()=>{
  const db=fixture();boundary.verify.mockImplementationOnce(async()=>{db.prepare("UPDATE traderlink_communities SET discord_guild_id='199999999999999999'").run();});await expect(authorizeCommunityStats(db,"qa-main",USER)).rejects.toThrow("TRADERLINK_WORKSPACE_ACCESS_DENIED");
 });
 it("never grants owner Settings to an ordinary analytics member",async()=>{
  const db=fixture();boundary.access.mockReturnValue({isOwner:false,capabilities:["community.view","community.analytics.view"]});await expect(authorizeCommunityStats(db,"qa-main",USER,"settings")).rejects.toThrow("TRADERLINK_WORKSPACE_ACCESS_DENIED");
 });
 it("rechecks capability after real scoped channel-reader I/O",async()=>{
  const db=fixture();vi.stubEnv("TRADERLINK_DISCORD_BOT_TOKEN","SYNTHETIC");let revoked=false;
  boundary.access.mockImplementation(()=>{if(revoked)throw new Error("Synthetic capability revoked");return {isOwner:false,capabilities:["community.view","community.analytics.view"]};});
  vi.stubGlobal("fetch",vi.fn(async(resource:string)=>{revoked=true;const path=new URL(resource).pathname;
   if(path.endsWith('/roles'))return Response.json([{id:MAIN,permissions:"1024"}]);
   if(path.endsWith('/channels'))return Response.json(CHANNELS.map(id=>({id,type:0,permission_overwrites:[]})));
   if(path.endsWith('/members/'+DISCORD))return Response.json({user:{id:DISCORD},roles:[]});
   return Response.json({id:MAIN,owner_id:"100000000000000002"});
  }));
  await expect(authorizeCommunityStats(db,"qa-main",USER)).rejects.toThrow("Synthetic capability revoked");expect(boundary.access).toHaveBeenCalledTimes(2);
 });
});
