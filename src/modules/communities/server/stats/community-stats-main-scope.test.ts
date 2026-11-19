// @vitest-environment node
// Disposable native fixture + local provider metadata only. No production auth,
// Discord effects or installed-image qualification is supplied by this test.
import Database from "better-sqlite3";
import {afterEach,describe,expect,it} from "vitest";
import {COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID as MAIN,COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS as CHANNELS,isCommunityReviewDiscordGuild} from "../community-review-discord-guild";
import {isStatsReviewGuild,isStatsReviewChannel} from "./community-stats-review-policy";
import {readCommunityStatsViewerChannels} from "./community-stats-viewer-channels";
import {statsSelectedChannels} from "./community-stats-channel-selection";

const TESTS="1559172784813514803",MEMBER="67890",ROLE="1550000000000000001",OTHER="1550000000000000002";
const USER="10000000-0000-4000-8000-000000000001",COMMUNITY="10000000-0000-4000-8000-000000000002";
const databases:Database.Database[]=[];
type Data=Record<string,unknown>;
function fixture(guildId=MAIN){
  const db=new Database(":memory:");databases.push(db);
  db.exec(`CREATE TABLE platform_users(user_id TEXT,status TEXT);
    CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,status TEXT,auth_subject TEXT);
    CREATE TABLE traderlink_communities(community_id TEXT,slug TEXT,status TEXT,discord_guild_id TEXT,owner_user_id TEXT);
    CREATE TABLE traderlink_community_memberships(community_id TEXT,user_id TEXT,status TEXT);
    CREATE TABLE traderlink_community_lifecycle(community_id TEXT,removed_at_utc TEXT);
    CREATE TABLE community_stats_settings(community_id TEXT,channel_ids_json TEXT);
    CREATE TABLE community_stats_history_jobs(community_id TEXT,channel_id TEXT,parent_id TEXT);`);
  db.prepare("INSERT INTO platform_users VALUES(?,'active')").run(USER);
  db.prepare("INSERT INTO platform_auth_identities VALUES(?,'discord','active',?)").run(USER,MEMBER);
  db.prepare("INSERT INTO traderlink_communities VALUES(?,'unit-main','active',?,?)").run(COMMUNITY,guildId,USER);
  db.prepare("INSERT INTO traderlink_community_memberships VALUES(?,?,'active')").run(COMMUNITY,USER);
  const channels:Data[]=[...CHANNELS,OTHER].map(channel=>({id:channel,guild_id:guildId,type:0,name:"Synthetic channel",permission_overwrites:[]}));
  const requests:string[]=[];let ownerId="12345",onRead:(()=>void)|undefined;
  const request:typeof fetch=async resource=>{
    const path=new URL(String(resource)).pathname.slice("/api/v10/".length);requests.push(path);onRead?.();
    if(path===`guilds/${guildId}`)return Response.json({id:guildId,owner_id:ownerId});
    if(path===`guilds/${guildId}/members/${MEMBER}`)return Response.json({user:{id:MEMBER},roles:[ROLE]});
    if(path===`guilds/${guildId}/roles`)return Response.json([{id:guildId,permissions:"0"},{id:ROLE,permissions:"1024"}]);
    if(path===`guilds/${guildId}/channels`)return Response.json(channels);
    throw new Error("Unexpected synthetic provider path");
  };
  return {db,channels,requests,request,setOwner:(id:string)=>{ownerId=id;},onRead:(action:()=>void)=>{onRead=action;}};
}
afterEach(()=>{for(const db of databases.splice(0))db.close();});
describe("Stats-only Main review scope",()=>{
  it("preserves the global Tests-only guard while allowing exactly the approved Main parents",()=>{
    expect(isCommunityReviewDiscordGuild(MAIN)).toBe(false);
    expect(isStatsReviewGuild(TESTS)).toBe(true);expect(isStatsReviewGuild(MAIN)).toBe(true);expect(isStatsReviewGuild(OTHER)).toBe(false);
    for(const channel of CHANNELS)expect(isStatsReviewChannel(MAIN,channel)).toBe(true);
    expect(isStatsReviewChannel(MAIN,OTHER)).toBe(false);expect(isStatsReviewChannel(OTHER,CHANNELS[0])).toBe(false);
  });
  it("intersects the three Main parents with actual member channel permissions",async()=>{
    const f=fixture();f.channels[1].permission_overwrites=[{id:MEMBER,type:1,deny:"1024",allow:"0"}];
    expect(await readCommunityStatsViewerChannels(f.db,"unit-main",USER,"SYNTHETIC",f.request)).toEqual([CHANNELS[0],CHANNELS[2]]);
    expect(f.requests).toHaveLength(4);
  });
  it("uses the actual Discord owner bypass but never includes an ordinary Main channel",async()=>{
    const f=fixture();f.setOwner(MEMBER);for(const channel of f.channels)channel.permission_overwrites=[{id:MEMBER,type:1,deny:"1024",allow:"0"}];
    expect(await readCommunityStatsViewerChannels(f.db,"unit-main",USER,"SYNTHETIC",f.request)).toEqual([...CHANNELS]);
  });
  it("does not turn malformed overwrite types into an implicit viewing grant",async()=>{
    const f=fixture();f.channels[0].permission_overwrites=[{id:MEMBER,type:"1",deny:"1024",allow:"0"}];
    expect(await readCommunityStatsViewerChannels(f.db,"unit-main",USER,"SYNTHETIC",f.request)).toEqual([CHANNELS[1],CHANNELS[2]]);
  });
  it.each(["membership","identity","user","community"])("fails closed when native %s changes during Discord I/O",async change=>{
    const f=fixture();let changed=false;
    f.onRead(()=>{if(changed)return;changed=true;
      if(change==="membership")f.db.prepare("UPDATE traderlink_community_memberships SET status='suspended'").run();
      if(change==="identity")f.db.prepare("UPDATE platform_auth_identities SET auth_subject='67891'").run();
      if(change==="user")f.db.prepare("UPDATE platform_users SET status='disabled'").run();
      if(change==="community")f.db.prepare("UPDATE traderlink_communities SET discord_guild_id=?").run(OTHER);
    });
    expect(await readCommunityStatsViewerChannels(f.db,"unit-main",USER,"SYNTHETIC",f.request)).toEqual([]);
  });
  it("refuses missing native membership before making provider requests",async()=>{
    const f=fixture();f.db.prepare("DELETE FROM traderlink_community_memberships").run();
    expect(await readCommunityStatsViewerChannels(f.db,"unit-main",USER,"SYNTHETIC",f.request)).toEqual([]);expect(f.requests).toEqual([]);
  });
  it("keeps normal Tests permission resolution unchanged",async()=>{
    const f=fixture(TESTS);
    expect(await readCommunityStatsViewerChannels(f.db,"unit-main",USER,"SYNTHETIC",f.request)).toEqual([...CHANNELS,OTHER]);
  });
  it("filters stored ordinary Main selections and expands only children of an allowed selected parent",()=>{
    const f=fixture();f.db.prepare("INSERT INTO community_stats_settings VALUES(?,?)").run(COMMUNITY,JSON.stringify([CHANNELS[0],OTHER]));
    f.db.prepare("INSERT INTO community_stats_history_jobs VALUES(?,?,?)").run(COMMUNITY,"1550000000000000010",CHANNELS[0]);
    f.db.prepare("INSERT INTO community_stats_history_jobs VALUES(?,?,?)").run(COMMUNITY,"1550000000000000011",OTHER);
    expect(statsSelectedChannels(f.db,{communityId:COMMUNITY,isOwner:true,readableChannelIds:[]})).toEqual([CHANNELS[0],"1550000000000000010"]);
    expect(statsSelectedChannels(f.db,{communityId:COMMUNITY,isOwner:false,readableChannelIds:[]})).toEqual([]);
  });
});
