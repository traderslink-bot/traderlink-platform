import Database from "better-sqlite3";
import {describe,expect,it} from "vitest";
import {assertCommunityStagingQaSharedJobAdmission,type CommunityStagingQaJob} from "./community-staging-qa-capability";
import {COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID,COMMUNITY_REVIEW_DISCORD_GUILD_ID,isCommunityStagingQaDiscordChannel} from "./community-review-discord-guild";

const AT="2026-11-19T12:00:00.000Z",SOURCE="11111111-1111-4111-8111-111111111111",RECEIVER="22222222-2222-4222-8222-222222222222",SOURCE_OWNER="33333333-3333-4333-8333-333333333333",RECEIVER_OWNER="44444444-4444-4444-8444-444444444444",AUTHOR="55555555-5555-4555-8555-555555555555",REQUEST="66666666-6666-4666-8666-666666666666",DELIVERY="a".repeat(32),MAIN_CHANNEL="1546033958448529508",TESTS_CHANNEL="1559172786176401410";

function fixture(reverse=false){
 const database=new Database(":memory:"),sourceGuild=reverse?COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID:COMMUNITY_REVIEW_DISCORD_GUILD_ID,receiverGuild=reverse?COMMUNITY_REVIEW_DISCORD_GUILD_ID:COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID,channel=reverse?TESTS_CHANNEL:MAIN_CHANNEL;
 database.exec(`
  CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,discord_guild_id TEXT,owner_user_id TEXT,display_name TEXT,slug TEXT,status TEXT);
  CREATE TABLE platform_users(user_id TEXT PRIMARY KEY,status TEXT);
  CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,auth_subject TEXT,status TEXT);
  CREATE TABLE platform_discord_memberships(user_id TEXT,guild_id TEXT,global_display_name TEXT,username TEXT,last_verified_at_utc TEXT);
  CREATE TABLE traderlink_community_memberships(community_id TEXT,user_id TEXT,status TEXT,discord_verified_at_utc TEXT);
  CREATE TABLE community_shared_alert_owner_checks(community_id TEXT,owner_user_id TEXT,discord_user_id TEXT,result TEXT,checked_at_utc TEXT);
  CREATE TABLE community_alert_publisher_permissions(community_id TEXT,user_id TEXT,enabled INTEGER);
  CREATE TABLE community_shared_alert_requests(request_id TEXT PRIMARY KEY,source_community_id TEXT,receiver_community_id TEXT,source_owner_user_id TEXT,receiver_owner_user_id TEXT,source_owner_discord_id TEXT,receiver_owner_discord_id TEXT,status TEXT,terms_version INTEGER,source_approved_version INTEGER,receiver_approved_version INTEGER,source_paused INTEGER,receiver_paused INTEGER);
  CREATE TABLE community_shared_alert_routes(request_id TEXT,author_user_id TEXT,source_offered INTEGER,receiver_selected INTEGER,receiver_paused INTEGER,revision INTEGER,channel_id TEXT,require_approval INTEGER);
  CREATE TABLE community_shared_alert_deliveries(delivery_id TEXT PRIMARY KEY,request_id TEXT,author_user_id TEXT,channel_id TEXT,status TEXT,requires_approval INTEGER,terms_version INTEGER,content_revision INTEGER,approved_content_revision INTEGER,approved_by_user_id TEXT);
 `);
 const insertCommunity=database.prepare("INSERT INTO traderlink_communities VALUES(?,?,?,?,?,?)"),insertUser=database.prepare("INSERT INTO platform_users VALUES(?,'active')"),insertIdentity=database.prepare("INSERT INTO platform_auth_identities VALUES(?,'discord',?,'active')"),insertMembership=database.prepare("INSERT INTO platform_discord_memberships VALUES(?,?,?,?,?)"),insertCommunityMember=database.prepare("INSERT INTO traderlink_community_memberships VALUES(?,?,'active',?)");
 insertCommunity.run(SOURCE,sourceGuild,SOURCE_OWNER,"Source","source","active");insertCommunity.run(RECEIVER,receiverGuild,RECEIVER_OWNER,"Receiver","receiver","active");
 for(const [user,subject,guild,community]of [[SOURCE_OWNER,"101",sourceGuild,SOURCE],[RECEIVER_OWNER,"102",receiverGuild,RECEIVER],[AUTHOR,"103",sourceGuild,SOURCE]] as const){insertUser.run(user);insertIdentity.run(user,subject);insertMembership.run(user,guild,"Name","name",AT);insertCommunityMember.run(community,user,AT);}
 database.prepare("INSERT INTO community_shared_alert_owner_checks VALUES(?,?,?,'verified',?)").run(SOURCE,SOURCE_OWNER,"101",AT);database.prepare("INSERT INTO community_shared_alert_owner_checks VALUES(?,?,?,'verified',?)").run(RECEIVER,RECEIVER_OWNER,"102",AT);
 database.prepare("INSERT INTO community_alert_publisher_permissions VALUES(?,?,1)").run(SOURCE,AUTHOR);
 database.prepare("INSERT INTO community_shared_alert_requests VALUES(?,?,?,?,?,?,?,'active',1,1,1,0,0)").run(REQUEST,SOURCE,RECEIVER,SOURCE_OWNER,RECEIVER_OWNER,"101","102");
 database.prepare("INSERT INTO community_shared_alert_routes VALUES(?,?,1,1,0,7,?,0)").run(REQUEST,AUTHOR,channel);
 database.prepare("INSERT INTO community_shared_alert_deliveries VALUES(?,?,?,?, 'pending',0,1,1,NULL,NULL)").run(DELIVERY,REQUEST,AUTHOR,channel);
 const job:CommunityStagingQaJob={table:"community_shared_alert_deliveries",id:DELIVERY,createdAtUtc:AT,stateSha256:"f".repeat(64),shared:{sourceCommunityId:SOURCE,sourceGuildId:sourceGuild,sourceOwnerUserId:SOURCE_OWNER,sourceOwnerDiscordId:"101",receiverCommunityId:RECEIVER,receiverGuildId:receiverGuild,receiverOwnerUserId:RECEIVER_OWNER,receiverOwnerDiscordId:"102",requestId:REQUEST,authorUserId:AUTHOR,channelId:channel,routeRevision:7,contentRevision:1,requireApproval:false}};
 return {database,job};
}

describe("Community staging QA two-guild Shared admission",()=>{
 it.each([false,true])("admits the exact current source-owner and receiver-destination tuple (reverse=%s)",reverse=>{const {database,job}=fixture(reverse);try{expect(()=>assertCommunityStagingQaSharedJobAdmission(database,job,AT)).not.toThrow();}finally{database.close();}});
 it("admits the actual same-owner two-guild cohort with a separate publisher and receiver-side self-approval",()=>{const {database,job}=fixture();try{
  database.prepare("UPDATE traderlink_communities SET owner_user_id=? WHERE community_id=?").run(SOURCE_OWNER,RECEIVER);
  database.prepare("UPDATE community_shared_alert_requests SET receiver_owner_user_id=?,receiver_owner_discord_id='101' WHERE request_id=?").run(SOURCE_OWNER,REQUEST);
  database.prepare("UPDATE community_shared_alert_owner_checks SET owner_user_id=?,discord_user_id='101' WHERE community_id=?").run(SOURCE_OWNER,RECEIVER);
  database.prepare("INSERT INTO platform_discord_memberships VALUES(?,?,?,?,?)").run(SOURCE_OWNER,COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID,"Owner","owner",AT);
  database.prepare("INSERT INTO traderlink_community_memberships VALUES(?,?,'active',?)").run(RECEIVER,SOURCE_OWNER,AT);
  database.prepare("UPDATE community_shared_alert_routes SET require_approval=1").run();database.prepare("UPDATE community_shared_alert_deliveries SET requires_approval=1,approved_content_revision=1,approved_by_user_id=?").run(SOURCE_OWNER);
  const shared={...job.shared!,receiverOwnerUserId:SOURCE_OWNER,receiverOwnerDiscordId:"101",requireApproval:true};
  expect(AUTHOR).not.toBe(SOURCE_OWNER);expect(()=>assertCommunityStagingQaSharedJobAdmission(database,{...job,shared},AT)).not.toThrow();
  database.prepare("UPDATE community_shared_alert_deliveries SET approved_by_user_id=?").run(AUTHOR);
  expect(()=>assertCommunityStagingQaSharedJobAdmission(database,{...job,shared},AT)).toThrow("Community staging QA capability refused.");
 }finally{database.close();}});
 it.each([
  ["route",(database:Database.Database)=>database.exec("UPDATE community_shared_alert_routes SET revision=8")],
  ["source owner",(database:Database.Database)=>database.exec("UPDATE traderlink_communities SET owner_user_id='44444444-4444-4444-8444-444444444444' WHERE community_id='11111111-1111-4111-8111-111111111111'")],
  ["receiver owner evidence",(database:Database.Database)=>database.exec("UPDATE community_shared_alert_owner_checks SET result='changed' WHERE community_id='22222222-2222-4222-8222-222222222222'")],
 ])("refuses a mismatched %s",(_label,mutate)=>{const {database,job}=fixture();try{mutate(database);expect(()=>assertCommunityStagingQaSharedJobAdmission(database,job,AT)).toThrow("Community staging QA capability refused.");}finally{database.close();}});
 it("restricts Main to the three designated test channels while retaining Tests sealed discovery",()=>{expect(isCommunityStagingQaDiscordChannel(COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID,MAIN_CHANNEL)).toBe(true);expect(isCommunityStagingQaDiscordChannel(COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID,"1546033958448529999")).toBe(false);expect(isCommunityStagingQaDiscordChannel(COMMUNITY_REVIEW_DISCORD_GUILD_ID,"1559172786176401499")).toBe(true);});
});
