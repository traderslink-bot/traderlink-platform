import { strict as assert } from "node:assert";
import Database from "better-sqlite3";
import { platformIdentityMigration } from "../modules/platform/server/database/migrations/0001_platform_identity";
import { journalAccountBoundaryMigration } from "../modules/journal/server/database/migrations/0002_journal_account_boundary";
import { platformAuthenticationIdentitiesMigration } from "../modules/platform/server/database/migrations/0012_platform_authentication_identities";
import { platformDiscordMembershipsMigration } from "../modules/platform/server/database/migrations/0017_platform_discord_memberships";
import { communityWatchlistsMigration } from "../modules/community/server/database/migrations/0076_community_watchlists";
import { traderLinkCommunitiesIdentityPermissionsMigration } from "../modules/communities/server/database/migrations/0121_traderlink_communities_identity_permissions";
import { traderLinkCommunitiesPartnerPlatformMigration } from "../modules/communities/server/database/migrations/0122_traderlink_communities_partner_platform";
import { approvedCommunityGuildIds, isFreshCommunityEvidence } from "../modules/communities/server/community-launch-policy";
import { onboardApprovedCommunity, verifyCommunityOwner } from "../modules/communities/server/community-onboarding-service";
import { pruneCommunityNamedActivity } from "../modules/communities/server/community-activity-retention";
import { isCommunityContentActivityPath } from "../modules/communities/server/community-activity-scope";

async function main() {
  const db = new Database(":memory:");
  const originalAllowlist = process.env.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS;
  const now = new Date().toISOString();
  const owner = "10000000-0000-4000-8000-000000000001";
  const other = "10000000-0000-4000-8000-000000000002";
  try {
    db.pragma("foreign_keys=ON");
    for (const migration of [platformIdentityMigration, journalAccountBoundaryMigration, platformAuthenticationIdentitiesMigration, platformDiscordMembershipsMigration, communityWatchlistsMigration, traderLinkCommunitiesIdentityPermissionsMigration, traderLinkCommunitiesPartnerPlatformMigration]) {
      for (const statement of migration.statements) db.exec(statement);
    }
    for (const [id, subject] of [[owner,"123456789"],[other,"987654321"]]) {
      db.prepare(`INSERT INTO platform_users(user_id,auth_provider,auth_subject,display_name,status,created_at_utc,updated_at_utc) VALUES(?,'discord',?,'Test owner','active',?,?)`).run(id,subject,now,now);
      db.prepare(`INSERT INTO platform_auth_identities(user_id,auth_provider,auth_subject,status,linked_by_user_id,created_at_utc,updated_at_utc,last_authenticated_at_utc) VALUES(?,'discord',?,'active',?,?,?,?)`).run(id,subject,id,now,now,now);
    }
    assert.deepEqual(approvedCommunityGuildIds("123, 456\n123 invalid"), ["123","456"]);
    for(const path of ["/communities/room", "/communities/room/alerts", "/communities/room/alerts/test", "/communities/room/server-watchlists/abc"]) assert.equal(isCommunityContentActivityPath("room",path),true);
    for(const path of ["/communities/room/workspace/students/private-id", "/communities/room/coaching", "/communities/room/manage/activity", "/communities/room/alerts?private=note", "/communities/another-room/alerts"]) assert.equal(isCommunityContentActivityPath("room",path),false);
    assert.equal(isFreshCommunityEvidence(new Date(Date.parse(now)-300000).toISOString(), now), true);
    assert.equal(isFreshCommunityEvidence(new Date(Date.parse(now)-300001).toISOString(), now), false);
    assert.equal(isFreshCommunityEvidence(new Date(Date.parse(now)+1).toISOString(), now), false);
    assert.equal(isFreshCommunityEvidence("invalid", now), false);
    const request = (async (url: string | URL | Request) => new Response(JSON.stringify(String(url).includes("/members/")
      ? { user: { id:"123456789", username:"owner" }, roles:[], joined_at:null }
      : { id:"900001", owner_id:"123456789" }), {status:200})) as typeof fetch;
    const evidence = await verifyCommunityOwner("900001", "123456789", "fixture-only", request);
    const input = { userId:owner, slug:"independent-room", displayName:"Independent room", evidence, atUtc:evidence.verifiedAtUtc };
    process.env.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS = "";
    assert.throws(() => onboardApprovedCommunity(db,input), /not been approved/);
    process.env.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS = "900001,900002";
    const created = onboardApprovedCommunity(db,input);
    assert.equal(created.slug, "independent-room");
    assert.equal((db.prepare("SELECT count(*) n FROM traderlink_community_operator_grants").get() as {n:number}).n,0);
    assert.equal((db.prepare("SELECT count(*) n FROM traderlink_community_discord_role_mappings").get() as {n:number}).n,0);
    assert.equal((db.prepare("SELECT count(*) n FROM traderlink_community_discord_destinations").get() as {n:number}).n,0);
    assert.equal((db.prepare("SELECT status FROM traderlink_community_partner_programs").get() as {status:string}).status,"disabled");
    assert.equal(onboardApprovedCommunity(db,{...input,slug:"do-not-reset",displayName:"Do not reset"}).slug,created.slug);
    assert.equal((db.prepare("SELECT display_name FROM traderlink_communities").get() as {display_name:string}).display_name,"Independent room");
    assert.throws(() => onboardApprovedCommunity(db,{...input,userId:other}), /connection required/);
    assert.throws(() => onboardApprovedCommunity(db,{...input,userId:other,evidence:{...evidence,discordUserId:"987654321"}}), /transfer requires/);
    assert.throws(() => onboardApprovedCommunity(db,{...input,atUtc:new Date(Date.parse(evidence.verifiedAtUtc)+300001).toISOString()}), /Refresh Discord/);
    assert.throws(() => onboardApprovedCommunity(db,{...input,evidence:{...evidence,guildId:"900002"}}));
    assert.equal((db.prepare("SELECT count(*) n FROM traderlink_communities").get() as {n:number}).n,1,"Failed creation rolls back all changes");
    await assert.rejects(verifyCommunityOwner("900001","987654321","fixture-only",request),/Only the Discord server owner/);
    await assert.rejects(verifyCommunityOwner("900001","123456789","fixture-only",(async()=>new Response("{}",{status:403})) as typeof fetch),/unavailable/);
    const community = (db.prepare("SELECT community_id FROM traderlink_communities").get() as {community_id:string}).community_id;
    const old = new Date(Date.parse(now)-91*86400000).toISOString();
    const recent = new Date(Date.parse(now)-86400000).toISOString();
    for(const [id,at] of [["10000000-0000-4000-8000-000000000003",old],["10000000-0000-4000-8000-000000000004",recent]]) {
      db.prepare(`INSERT INTO traderlink_community_activity_events(event_id,community_id,user_id,event_type,object_type,path,occurred_at_utc) VALUES(?,?,?,'page.view','community','/community',?)`).run(id,community,owner,at);
      db.prepare(`INSERT INTO traderlink_community_activity_daily_members(community_id,activity_day,path,user_id,views,first_viewed_at_utc,last_viewed_at_utc) VALUES(?,?,'/community',?,1,?,?)`).run(community,at.slice(0,10),owner,at,at);
    }
    assert.deepEqual(pruneCommunityNamedActivity(db,now,1),{events:1,dailyMembers:1});
    assert.deepEqual(pruneCommunityNamedActivity(db,now,1),{events:0,dailyMembers:0});
    assert.equal((db.prepare("SELECT count(*) n FROM traderlink_community_activity_daily_members").get() as {n:number}).n,1);
    assert.throws(()=>pruneCommunityNamedActivity(db,now,0));
    assert.deepEqual(db.pragma("foreign_key_check"),[]);
    console.log("PASS: approved guild onboarding, fresh ownership, reconnect preservation, no operator/test grants, rollback, retention of both named tables.");
  } finally {
    db.close();
    if(originalAllowlist===undefined)delete process.env.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS;
    else process.env.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS=originalAllowlist;
  }
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
