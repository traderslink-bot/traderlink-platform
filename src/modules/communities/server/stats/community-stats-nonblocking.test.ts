// @vitest-environment node
import Database from "better-sqlite3";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {setTimeout as delay} from "node:timers/promises";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {traderLinkCommunityStatsMigration} from "../database/migrations/0173_traderlink_community_stats";
import {communityStatsHistoryStatements} from "./community-stats-history-schema";
import {communityStatsAttributionStatements} from "./community-stats-attribution-schema";
import {communityStatsForwardStatements} from "./community-stats-forward-schema";
import {CommunityStatsRepository} from "./community-stats-repository";
import {CommunityStatsCollector} from "./community-stats-collector";
import {CommunityStatsDiscordGateway} from "./community-stats-discord-gateway";
import {CommunityStatsHistory} from "./community-stats-history";
import {CommunityStatsInvites} from "./community-stats-invites";
import {communityStatsWrites} from "./community-stats-write-queue";
import {COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID as MAIN,COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS as MAIN_CHANNELS} from "../community-review-discord-guild";

const COMMUNITY="10000000-0000-4000-8000-000000000001",OWNER="10000000-0000-4000-8000-000000000002";
const GUILD="1559172784813514803",CHANNEL="1559172786176401410",BOT="99999",SUBJECT="12345";
type Fixture={db:Database.Database;blocker:Database.Database;root:string;at:string;close:()=>void};
const fixtures:Fixture[]=[];const cleanups:(()=>void)[]=[];
function fixture():Fixture{
  const root=mkdtempSync(join(tmpdir(),"stats-write-contention-")),file=join(root,"synthetic.sqlite");
  const db=new Database(file);db.pragma("journal_mode=WAL");db.pragma("foreign_keys=ON");db.pragma("busy_timeout=5000");
  db.exec(`CREATE TABLE platform_users(user_id TEXT PRIMARY KEY,status TEXT);
    CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,auth_subject TEXT,status TEXT);
    CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,discord_guild_id TEXT,owner_user_id TEXT,status TEXT,slug TEXT);
    CREATE TABLE traderlink_community_lifecycle(community_id TEXT,removed_at_utc TEXT);
    CREATE TABLE traderlink_community_memberships(community_id TEXT,user_id TEXT,status TEXT);
    CREATE TABLE receipts(position INTEGER PRIMARY KEY,payload TEXT,event_at TEXT);
    CREATE TABLE cursor_state(id INTEGER PRIMARY KEY,value TEXT);
    INSERT INTO cursor_state VALUES(1,'original');`);
  for(const sql of [...traderLinkCommunityStatsMigration.statements,...communityStatsHistoryStatements,...communityStatsAttributionStatements,...communityStatsForwardStatements])db.exec(sql);
  const at=new Date().toISOString();db.prepare("INSERT INTO platform_users VALUES(?,'active')").run(OWNER);
  db.prepare("INSERT INTO platform_auth_identities VALUES(?,'discord',?,'active')").run(OWNER,SUBJECT);
  db.prepare("INSERT INTO traderlink_communities VALUES(?,?,?,'active','unit-stats')").run(COMMUNITY,GUILD,OWNER);
  const repo=new CommunityStatsRepository(db);repo.ensureCommunity(COMMUNITY,at);
  db.prepare("UPDATE community_stats_settings SET discord_enabled=1,discord_configuration_version=1,channel_ids_json=?").run(JSON.stringify([CHANNEL]));
  for(const source of ["discord","membership"] as const)repo.source(COMMUNITY,source,"collecting",at);
  db.prepare("INSERT INTO community_stats_channels VALUES(?,?,?,0,1,?)").run(COMMUNITY,CHANNEL,"Unit channel",at);
  const blocker=new Database(file);blocker.pragma("busy_timeout=0");
  const value={db,blocker,root,at,close:()=>{if(blocker.inTransaction)blocker.exec("ROLLBACK");if(blocker.open)blocker.close();if(db.open)db.close();rmSync(root,{recursive:true,force:true});}};
  fixtures.push(value);return value;
}
beforeEach(()=>{vi.stubEnv("TRADERLINK_COMMUNITY_STATS_ENABLED","1");});
afterEach(async()=>{
  for(const cleanup of cleanups.splice(0))cleanup();
  for(const f of fixtures.splice(0)){if(f.blocker.inTransaction)f.blocker.exec("ROLLBACK");await communityStatsWrites(f.db).whenIdle();f.close();}
  vi.unstubAllEnvs();
});

describe("Stats writes under a real competing SQLite writer",()=>{
  it("yields between immediate attempts, retains FIFO payloads and commits their cursor atomically",async()=>{
    const {db,blocker}=fixture(),queue=communityStatsWrites(db),eventAt=new Date().toISOString(),effects:string[]=[];
    blocker.exec("BEGIN IMMEDIATE");let ticks=0;const timer=setInterval(()=>ticks++,5);
    cleanups.push(()=>clearInterval(timer));
    const started=performance.now();
    const first=queue.write(()=>{db.prepare("INSERT INTO receipts VALUES(1,?,?)").run("first",eventAt);db.prepare("UPDATE cursor_state SET value='first'").run();queue.afterCommit(()=>effects.push("first"));});
    const second=queue.write(()=>{db.prepare("INSERT INTO receipts VALUES(2,?,?)").run("second",eventAt);db.prepare("UPDATE cursor_state SET value='second'").run();queue.afterCommit(()=>effects.push("second"));});
    expect(performance.now()-started).toBeLessThan(100);
    expect(db.pragma("busy_timeout",{simple:true})).toBe(5000);
    await delay(45);expect(ticks).toBeGreaterThan(1);
    expect(db.prepare("SELECT count(*) FROM receipts").pluck().get()).toBe(0);
    expect(db.prepare("SELECT value FROM cursor_state").pluck().get()).toBe("original");
    expect(effects).toEqual([]);
    blocker.exec("COMMIT");await Promise.all([first,second]);
    expect(db.prepare("SELECT payload,event_at FROM receipts ORDER BY position").all()).toEqual([{payload:"first",event_at:eventAt},{payload:"second",event_at:eventAt}]);
    expect(db.prepare("SELECT value FROM cursor_state").pluck().get()).toBe("second");
    expect(effects).toEqual(["first","second"]);
    expect(db.pragma("busy_timeout",{simple:true})).toBe(5000);
  });
  it("does not replay a callback error and restores SQL/local state without emitting its post-commit action",async()=>{
    const {db}=fixture(),queue=communityStatsWrites(db);let state=0,calls=0,effects=0;
    const failure=Object.assign(new Error("synthetic callback failure"),{code:"SQLITE_BUSY"});
    await expect(queue.write(()=>{calls++;state++;db.prepare("INSERT INTO receipts VALUES(1,'rollback','original')").run();queue.afterCommit(()=>effects++);throw failure;},{captureRollback:()=>{const original=state;return ()=>{state=original;};}})).rejects.toBe(failure);
    expect({state,calls,effects}).toEqual({state:0,calls:1,effects:0});
    expect(db.prepare("SELECT count(*) FROM receipts").pluck().get()).toBe(0);
    expect(db.pragma("busy_timeout",{simple:true})).toBe(5000);
  });
  it("rechecks the original expiry while busy rather than renewing it or invoking the payload",async()=>{
    const {db,blocker}=fixture(),queue=communityStatsWrites(db);blocker.exec("BEGIN IMMEDIATE");
    const expires=Date.now()+10;let calls=0;
    const result=queue.write(()=>{calls++;},{assertCurrent:()=>{if(Date.now()>=expires)throw new Error("original authority expired");}});
    await expect(result).rejects.toThrow("original authority expired");
    expect(calls).toBe(0);expect(db.pragma("busy_timeout",{simple:true})).toBe(5000);blocker.exec("ROLLBACK");
  });
  it("persists the collector's disabled branch without a synchronous busy wait",async()=>{
    const {db,blocker}=fixture();vi.stubEnv("TRADERLINK_COMMUNITY_STATS_ENABLED","0");
    const collector=new CommunityStatsCollector(db);cleanups.push(()=>collector.stop());blocker.exec("BEGIN IMMEDIATE");
    const started=performance.now();collector.tick();expect(performance.now()-started).toBeLessThan(100);
    await delay(30);expect(db.prepare("SELECT status FROM community_stats_source_state WHERE source='discord'").pluck().get()).toBe("collecting");
    blocker.exec("COMMIT");await communityStatsWrites(db).whenIdle();
    expect(db.prepare("SELECT DISTINCT status FROM community_stats_source_state").pluck().all()).toEqual(["disabled"]);
  });
  it("keeps Gateway message order/session sequence and processes heartbeat acknowledgement while SQL waits",async()=>{
    const {db,blocker,at}=fixture();
    const gateway=new CommunityStatsDiscordGateway(()=>db,"SYNTHETIC_NOT_A_TOKEN",[{communityId:COMMUNITY,guildId:GUILD,channelIds:[CHANNEL],configurationVersion:1}]);cleanups.push(()=>gateway.stop());
    const control=gateway as unknown as {packet:(packet:{op:number;s?:number;t?:string;d?:unknown})=>void;acknowledged:boolean;guilds:Map<string,object>};
    Object.assign(control.guilds.get(GUILD)!,{ownerDiscordId:SUBJECT,ownerVerified:true,ready:true,readyAt:at,channels:new Set([CHANNEL])});
    blocker.exec("BEGIN IMMEDIATE");
    const firstAt=new Date(Date.parse(at)-2000).toISOString(),secondAt=new Date(Date.parse(at)-1000).toISOString();
    control.packet({op:0,s:1,t:"MESSAGE_CREATE",d:{guild_id:GUILD,channel_id:CHANNEL,id:"701",timestamp:firstAt,author:{id:"67890",username:"First"},content:"NOT_STORED"}});
    control.packet({op:0,s:2,t:"MESSAGE_CREATE",d:{guild_id:GUILD,channel_id:CHANNEL,id:"702",timestamp:secondAt,author:{id:"67891",username:"Second"},message_reference:{message_id:"701"},content:"NOT_STORED"}});
    control.acknowledged=false;control.packet({op:11});expect(control.acknowledged).toBe(true);
    await delay(30);expect(db.prepare("SELECT count(*) FROM community_stats_events").pluck().get()).toBe(0);
    blocker.exec("COMMIT");await communityStatsWrites(db).whenIdle();
    expect(db.prepare("SELECT event_id,reply_delay_seconds FROM community_stats_events ORDER BY event_id").all()).toEqual([{event_id:"message:701",reply_delay_seconds:null},{event_id:"message:702",reply_delay_seconds:1}]);
    expect(db.serialize().includes(Buffer.from("NOT_STORED"))).toBe(false);
  });
  it("does not commit a delayed Gateway payload after its configuration generation is revoked",async()=>{
    const {db,blocker,at}=fixture();const gateway=new CommunityStatsDiscordGateway(()=>db,"SYNTHETIC_NOT_A_TOKEN",[{communityId:COMMUNITY,guildId:GUILD,channelIds:[CHANNEL],configurationVersion:1}]);cleanups.push(()=>gateway.stop());
    const control=gateway as unknown as {packet:(packet:{op:number;s?:number;t?:string;d?:unknown})=>void;guilds:Map<string,object>};
    Object.assign(control.guilds.get(GUILD)!,{ownerDiscordId:SUBJECT,ownerVerified:true,ready:true,readyAt:at,channels:new Set([CHANNEL])});
    blocker.exec("BEGIN IMMEDIATE");control.packet({op:0,s:1,t:"MESSAGE_CREATE",d:{guild_id:GUILD,channel_id:CHANNEL,id:"703",timestamp:at,author:{id:"67890",username:"Member"}}});
    blocker.prepare("UPDATE community_stats_settings SET discord_configuration_version=2").run();blocker.exec("COMMIT");
    await communityStatsWrites(db).whenIdle();expect(db.prepare("SELECT count(*) FROM community_stats_events").pluck().get()).toBe(0);
  });
  it("retains invite join/create/delete payloads while busy, without allowing an older REST result to overwrite them",async()=>{
    const {db,blocker,at}=fixture();const request:typeof fetch=async input=>String(input).endsWith("/invites")?Response.json([]):new Response(null,{status:404});
    const invites=new CommunityStatsInvites(db,"SYNTHETIC_NOT_A_TOKEN",request);cleanups.push(()=>invites.stop());
    invites.start({communityId:COMMUNITY,guildId:GUILD,valid:()=>true});blocker.exec("BEGIN IMMEDIATE");
    invites.join(COMMUNITY,"67890",at,at);
    const data={code:"synthetic-invite",channel_id:CHANNEL,inviter:{id:"67890",username:"Member"},created_at:at,max_age:3600};
    invites.inviteEvent(COMMUNITY,"INVITE_CREATE",data,at);invites.inviteEvent(COMMUNITY,"INVITE_DELETE",data,at);
    await delay(35);expect(db.prepare("SELECT count(*) FROM community_stats_invite_joins").pluck().get()).toBe(0);
    blocker.exec("COMMIT");await communityStatsWrites(db).whenIdle();
    expect(db.prepare("SELECT count(*) FROM community_stats_invite_joins").pluck().get()).toBe(1);
    expect(db.prepare("SELECT active FROM community_stats_invites").pluck().all()).toEqual([0]);
  });
  it.each(["join","create","delete"])("commits accepted Gateway invite %s before a later queued disconnect",async(kind)=>{
    const {db,blocker,at}=fixture();let requests=0;
    const gateway=new CommunityStatsDiscordGateway(()=>db,"SYNTHETIC_NOT_A_TOKEN",[{communityId:COMMUNITY,guildId:GUILD,channelIds:[CHANNEL],configurationVersion:1}]);cleanups.push(()=>gateway.stop());
    const control=gateway as unknown as {packet:(packet:{op:number;s?:number;t?:string;d?:unknown})=>void;disconnect:(reason:string)=>void;guilds:Map<string,{readyAt:string|null}>;invites:CommunityStatsInvites};
    const guild=control.guilds.get(GUILD)!;Object.assign(guild,{ownerDiscordId:SUBJECT,ownerVerified:true,ready:true,readyAt:at,channels:new Set([CHANNEL])});
    const invites=new CommunityStatsInvites(db,"SYNTHETIC_NOT_A_TOKEN",async()=>{requests++;throw new Error("No REST expected");});control.invites=invites;
    invites.start({communityId:COMMUNITY,guildId:GUILD,valid:()=>!!guild.readyAt});
    const sessions=(invites as unknown as {sessions:Map<string,{timer:ReturnType<typeof setTimeout>|null}>}).sessions;
    for(const session of sessions.values()){if(session.timer)clearTimeout(session.timer);session.timer=null;}
    const data={guild_id:GUILD,code:"gateway-causal-invite",channel_id:CHANNEL,inviter:{id:"67890",username:"Member"},created_at:at,max_age:3600};
    if(kind==="delete"){invites.inviteEvent(COMMUNITY,"INVITE_CREATE",data,at);await communityStatsWrites(db).whenIdle();}
    blocker.exec("BEGIN IMMEDIATE");
    if(kind==="join")control.packet({op:0,s:1,t:"GUILD_MEMBER_ADD",d:{guild_id:GUILD,user:{id:"67890",username:"Member"},roles:[],joined_at:at}});
    else control.packet({op:0,s:1,t:kind==="create"?"INVITE_CREATE":"INVITE_DELETE",d:data});
    control.disconnect("synthetic_disconnect_after_accepted_frame");
    await delay(35);expect(requests).toBe(0);
    expect(db.prepare("SELECT count(*) FROM community_stats_invite_joins").pluck().get()).toBe(0);
    if(kind!=="delete")expect(db.prepare("SELECT count(*) FROM community_stats_invites").pluck().get()).toBe(0);
    blocker.exec("COMMIT");await communityStatsWrites(db).whenIdle();
    if(kind==="join")expect(db.prepare("SELECT discord_user_id,joined_at_utc FROM community_stats_invite_joins").all()).toEqual([{discord_user_id:"67890",joined_at_utc:at}]);
    else expect(db.prepare("SELECT active FROM community_stats_invites").pluck().all()).toEqual([kind==="create"?1:0]);
    expect(guild.readyAt).toBeNull();expect(sessions.size).toBe(0);expect(requests).toBe(0);
  });
  it("rolls invite SQL and memory back with a failed parent Gateway transaction",async()=>{
    const {db,at}=fixture();let requests=0;
    const gateway=new CommunityStatsDiscordGateway(()=>db,"SYNTHETIC_NOT_A_TOKEN",[{communityId:COMMUNITY,guildId:GUILD,channelIds:[CHANNEL],configurationVersion:1}]);cleanups.push(()=>gateway.stop());
    const control=gateway as unknown as {write:(operation:()=>void)=>Promise<void>;invites:CommunityStatsInvites};
    const invites=new CommunityStatsInvites(db,"SYNTHETIC_NOT_A_TOKEN",async()=>{requests++;throw new Error("No REST expected");});control.invites=invites;
    invites.start({communityId:COMMUNITY,guildId:GUILD,valid:()=>true});
    const session=(invites as unknown as {sessions:Map<string,{timer:ReturnType<typeof setTimeout>|null;generation:number;joins:unknown[]}>}).sessions.get(COMMUNITY)!;
    if(session.timer)clearTimeout(session.timer);session.timer=null;const generation=session.generation;
    await expect(control.write(()=>{
      invites.join(COMMUNITY,"67890",at,at);
      invites.inviteEvent(COMMUNITY,"INVITE_CREATE",{code:"rollback",channel_id:CHANNEL,created_at:at},at);
      throw new Error("synthetic parent failure");
    })).rejects.toThrow("synthetic parent failure");
    expect(db.prepare("SELECT count(*) FROM community_stats_invite_joins").pluck().get()).toBe(0);
    expect(db.prepare("SELECT count(*) FROM community_stats_invites").pluck().get()).toBe(0);
    expect(session.generation).toBe(generation);expect(session.joins).toEqual([]);expect(session.timer).toBeNull();expect(requests).toBe(0);
  });
  it("captures only selected approved Main channels while retaining the real guild roster and scoped channel choices",async()=>{
    const {db,at}=fixture();db.prepare("UPDATE traderlink_communities SET discord_guild_id=?").run(MAIN);
    db.prepare("UPDATE community_stats_settings SET channel_ids_json=?").run(JSON.stringify([MAIN_CHANNELS[0],CHANNEL]));
    const gateway=new CommunityStatsDiscordGateway(()=>db,"SYNTHETIC_NOT_A_TOKEN",[{communityId:COMMUNITY,guildId:MAIN,channelIds:[MAIN_CHANNELS[0],CHANNEL],configurationVersion:1}]);cleanups.push(()=>gateway.stop());
    const control=gateway as unknown as {packet:(packet:{op:number;s?:number;t?:string;d?:unknown})=>void;guilds:Map<string,{nonce:string}>;invites:CommunityStatsInvites};
    control.invites=new CommunityStatsInvites(db,"SYNTHETIC_NOT_A_TOKEN",async()=>new Response(null,{status:403}));
    control.packet({op:0,s:1,t:"READY",d:{session_id:"SYNTHETIC",resume_gateway_url:"wss://gateway.discord.gg",user:{id:BOT}}});
    control.packet({op:0,s:2,t:"GUILD_CREATE",d:{id:MAIN,owner_id:SUBJECT,roles:[{id:MAIN,name:"everyone",permissions:"66560"}],channels:[...MAIN_CHANNELS,CHANNEL].map(id=>({id,type:0,name:"Synthetic Main channel",permission_overwrites:[]})),members:[{user:{id:BOT},roles:[]}],threads:[]}});
    await communityStatsWrites(db).whenIdle();
    expect(db.prepare("SELECT channel_id FROM community_stats_channels ORDER BY channel_id").pluck().all()).toEqual([...MAIN_CHANNELS].sort());
    control.packet({op:0,s:3,t:"GUILD_MEMBERS_CHUNK",d:{guild_id:MAIN,nonce:control.guilds.get(MAIN)!.nonce,chunk_count:1,chunk_index:0,members:[{user:{id:BOT,username:"Bot",bot:true},roles:[]},{user:{id:SUBJECT,username:"Owner"},roles:[]},{user:{id:"67890",username:"Member"},roles:[]}]}});
    control.packet({op:0,s:4,t:"MESSAGE_CREATE",d:{guild_id:MAIN,channel_id:MAIN_CHANNELS[0],id:"801",timestamp:at,author:{id:"67890",username:"Member"},content:"MAIN_BODY_NOT_STORED"}});
    control.packet({op:0,s:5,t:"MESSAGE_CREATE",d:{guild_id:MAIN,channel_id:CHANNEL,id:"802",timestamp:at,author:{id:"67890",username:"Member"},content:"OUTSIDE_BODY_NOT_STORED"}});
    await communityStatsWrites(db).whenIdle();
    expect(db.prepare("SELECT channel_id,event_id FROM community_stats_events").all()).toEqual([{channel_id:MAIN_CHANNELS[0],event_id:"message:801"}]);
    expect(db.prepare("SELECT count(*) FROM community_stats_members WHERE is_bot=0 AND active=1").pluck().get()).toBe(2);
    expect(db.serialize().includes(Buffer.from("BODY_NOT_STORED"))).toBe(false);
  });
  it("does not start Main history when stored selections include an unapproved parent",async()=>{
    const {db}=fixture();db.prepare("UPDATE traderlink_communities SET discord_guild_id=?").run(MAIN);
    db.prepare("UPDATE community_stats_settings SET channel_ids_json=?").run(JSON.stringify([MAIN_CHANNELS[0],CHANNEL]));let requests=0;
    const history=new CommunityStatsHistory(db,async()=>{requests++;throw new Error("Outside history must not be requested");});
    await history.tick([COMMUNITY],"SYNTHETIC_NOT_A_TOKEN");expect(requests).toBe(0);expect(db.prepare("SELECT count(*) FROM community_stats_history_jobs").pluck().get()).toBe(0);
  });
  it("recovers approved Main history without requesting or importing ordinary-channel messages",async()=>{
    const {db,at}=fixture();db.prepare("UPDATE traderlink_communities SET discord_guild_id=?").run(MAIN);db.prepare("UPDATE community_stats_settings SET channel_ids_json=?").run(JSON.stringify([MAIN_CHANNELS[0]]));
    db.prepare("DELETE FROM community_stats_channels").run();db.prepare("INSERT INTO community_stats_channels VALUES(?,?,?,0,1,?)").run(COMMUNITY,MAIN_CHANNELS[0],"Main QA",at);
    const messageAt=new Date(Date.parse(at)-60000).toISOString(),messageId=((BigInt(Date.parse(messageAt))-BigInt(1420070400000))<<BigInt(22)).toString();const requests:string[]=[];
    const history=new CommunityStatsHistory(db,async resource=>{
      const path=new URL(String(resource)).pathname.slice("/api/v10".length);requests.push(path);
      if(path==="/users/@me")return Response.json({id:BOT});
      if(path===`/guilds/${MAIN}`)return Response.json({id:MAIN,owner_id:SUBJECT,roles:[{id:MAIN,permissions:"66560"}]});
      if(path===`/guilds/${MAIN}/members/${BOT}`)return Response.json({user:{id:BOT},roles:[]});
      if(path===`/guilds/${MAIN}/channels`)return Response.json([...MAIN_CHANNELS,CHANNEL].map(id=>({id,type:0,name:"Synthetic Main channel",permission_overwrites:[]})));
      if(path===`/guilds/${MAIN}/threads/active`)return Response.json({threads:[{id:"1550000000000000021",parent_id:CHANNEL,guild_id:MAIN,type:11}]});
      if(path===`/channels/${MAIN_CHANNELS[0]}/threads/archived/public`)return Response.json({threads:[],has_more:false});
      if(path===`/channels/${MAIN_CHANNELS[0]}/messages`)return Response.json([{id:messageId,channel_id:MAIN_CHANNELS[0],type:0,timestamp:messageAt,author:{id:"67890",username:"Main historical member"},content:"MAIN_HISTORY_BODY_NOT_STORED"}]);
      throw new Error("No ordinary Main channel request is allowed");
    });
    for(let i=0;i<12;i++)await history.tick([COMMUNITY],"SYNTHETIC_NOT_A_TOKEN");
    expect(db.prepare("SELECT channel_id,event_id FROM community_stats_events").all()).toEqual([{channel_id:MAIN_CHANNELS[0],event_id:`message:${messageId}`}]);
    expect(requests.filter(path=>path.startsWith("/channels/"))).not.toHaveLength(0);
    expect(requests.filter(path=>path.startsWith("/channels/")).every(path=>path.startsWith(`/channels/${MAIN_CHANNELS[0]}/`))).toBe(true);
    expect(db.prepare("SELECT 1 FROM community_stats_history_jobs WHERE channel_id=? OR parent_id=?").get(CHANNEL,CHANNEL)).toBeUndefined();
    expect(db.serialize().includes(Buffer.from("MAIN_HISTORY_BODY_NOT_STORED"))).toBe(false);
  });
  it.each(["commit","disabled","new_generation"])("retains a fetched history page or cancels without mutating newer state: %s",async(mode)=>{
    const {db,blocker,at}=fixture();const lower=new Date(Date.parse(at)-60_000).toISOString();
    for(const [channel,kind] of [[GUILD,"active"],[CHANNEL,"messages"],[CHANNEL,"archived"]])db.prepare(`INSERT INTO community_stats_history_jobs(community_id,configuration_version,channel_id,kind,cursor,status,scanned,recovered,snapshot_at_utc,checked_at_utc,retry_at_utc) VALUES(?,1,?,?,'100','complete',0,0,?,?,?)`).run(COMMUNITY,channel,kind,lower,lower,lower);
    const messageAt=new Date(Date.parse(at)-30_000).toISOString();
    const messageId=((BigInt(Date.parse(messageAt))-BigInt(1420070400000))<<BigInt(22)).toString();
    let messageRequests=0,pageReady!:()=>void;const fetched=new Promise<void>(resolve=>{pageReady=resolve;});
    const request:typeof fetch=async input=>{
      const url=new URL(String(input)),path=url.pathname.slice("/api/v10".length);
      if(path==="/users/@me")return Response.json({id:BOT});
      if(path===`/guilds/${GUILD}`)return Response.json({id:GUILD,owner_id:SUBJECT,roles:[{id:GUILD,permissions:"66560"}]});
      if(path===`/guilds/${GUILD}/members/${BOT}`)return Response.json({user:{id:BOT},roles:[]});
      if(path===`/guilds/${GUILD}/channels`)return Response.json([{id:CHANNEL,name:"Unit",type:0,permission_overwrites:[]}]);
      if(path===`/channels/${CHANNEL}/messages`){
        messageRequests++;blocker.exec("BEGIN IMMEDIATE");pageReady();
        return Response.json([{id:messageId,channel_id:CHANNEL,type:0,timestamp:messageAt,author:{id:"67890",username:"Historical"},reactions:[{count:2}],content:"HISTORY_BODY_NOT_STORED"}]);
      }
      throw new Error("Unexpected synthetic history request");
    };
    const history=new CommunityStatsHistory(db,request);for(let tick=0;tick<4;tick++)await history.tick([COMMUNITY],"SYNTHETIC_NOT_A_TOKEN");
    const pending=history.tick([COMMUNITY],"SYNTHETIC_NOT_A_TOKEN");await fetched;await delay(35);
    expect(db.prepare("SELECT count(*) FROM community_stats_events").pluck().get()).toBe(0);
    expect(db.prepare("SELECT committed_until_utc FROM community_stats_forward_checkpoints").pluck().get()).toBe(lower);
    expect(messageRequests).toBe(1);expect(communityStatsWrites(db).pending).toBeGreaterThan(0);
    if(mode!=="commit"){
      if(mode==="disabled")blocker.prepare("UPDATE community_stats_settings SET discord_enabled=0").run();
      else{
        blocker.prepare("UPDATE community_stats_settings SET discord_configuration_version=2").run();
        blocker.prepare("UPDATE community_stats_forward_checkpoints SET configuration_version=2,retry_at_utc=?,updated_at_utc=?").run(new Date(Date.parse(at)+5000).toISOString(),new Date(Date.parse(at)+1).toISOString());
        blocker.prepare("INSERT INTO community_stats_history_jobs SELECT community_id,2,channel_id,parent_id,kind,cursor,status,scanned,recovered,oldest_at_utc,snapshot_at_utc,checked_at_utc,retry_at_utc,reason FROM community_stats_history_jobs WHERE configuration_version=1").run();
      }
      const snapshot=(handle:Database.Database)=>({events:handle.prepare("SELECT * FROM community_stats_events").all(),checkpoints:handle.prepare("SELECT * FROM community_stats_forward_checkpoints ORDER BY channel_id").all(),jobs:handle.prepare("SELECT * FROM community_stats_history_jobs ORDER BY configuration_version,channel_id,kind").all()});
      const expected=snapshot(blocker);blocker.exec("COMMIT");await pending;await communityStatsWrites(db).whenIdle();
      expect(snapshot(db)).toEqual(expected);expect(messageRequests).toBe(1);return;
    }
    blocker.exec("COMMIT");await pending;
    expect(db.prepare("SELECT event_id,evidence FROM community_stats_events").all()).toEqual([{event_id:`message:${messageId}`,evidence:"imported_message"}]);
    expect(db.prepare("SELECT committed_until_utc FROM community_stats_forward_checkpoints").pluck().get()).not.toBe(lower);
    expect(messageRequests).toBe(1);expect(db.serialize().includes(Buffer.from("HISTORY_BODY_NOT_STORED"))).toBe(false);
  });
});
