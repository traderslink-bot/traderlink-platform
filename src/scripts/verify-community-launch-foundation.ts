import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
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
import { TraderLinkCommunityAdminRepository } from "../modules/communities/server/traderlink-community-admin-repository";
import { platformCoachingCommissionTermsMigration } from "../modules/platform/server/database/migrations/0159_platform_coaching_commission_terms";
import { parseCommissionHundredths } from "../modules/communities/contracts/coaching-commission-settings";

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
    for (const statement of platformCoachingCommissionTermsMigration.statements) db.exec(statement);
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
    const admin = new TraderLinkCommunityAdminRepository(db);
    assert.throws(()=>admin.setCommunityStatus({actorUserId:other,communityId:community,status:"paused",atUtc:input.atUtc}));
    db.prepare(`INSERT INTO traderlink_community_operator_grants(grant_id,user_id,status,granted_at_utc) VALUES(? ,?,'active',?)`).run("10000000-0000-4000-8000-000000000006",owner,now);
    admin.setCommunityStatus({actorUserId:owner,communityId:community,status:"paused",atUtc:input.atUtc});
    assert.equal((db.prepare("SELECT status FROM traderlink_communities WHERE community_id=?").get(community) as {status:string}).status,"paused");
    assert.equal((db.prepare("SELECT count(*) n FROM traderlink_community_authorization_audit_events WHERE event_type='community.status.changed'").get() as {n:number}).n,1);
    admin.setCommunityStatus({actorUserId:owner,communityId:community,status:"active",atUtc:input.atUtc});
    const adminSource=readFileSync("app/admin/journal/communities/page.tsx","utf8");
    for(const name of ["staff","audit"]) {
      const query=adminSource.match(new RegExp("const "+name+"=database\\.prepare\\(`([\\s\\S]*?)`\\)"))?.[1];
      assert.ok(query,`Missing ${name} query`);
      db.prepare(query).all();
    }
    assert.equal(parseCommissionHundredths("12.34",10000),1234);
    assert.throws(()=>parseCommissionHundredths("12.345",10000));
    assert.throws(()=>parseCommissionHundredths("100.01",10000));
    const feeInput={actorUserId:owner,communityId:community,coachUserId:null,feeBasisPoints:1234,status:"disabled" as const,notes:"Internal",atUtc:input.atUtc,minimumCommissionMinor:250,currency:"CAD",durationCount:7,durationUnit:"months"};
    const feeId=admin.configureCoachFee(feeInput);
    assert.deepEqual(db.prepare(`SELECT fee_basis_points,minimum_commission_minor,currency,duration_count,duration_unit,status FROM traderlink_community_coach_fee_rules WHERE fee_rule_id=?`).get(feeId),{fee_basis_points:1234,minimum_commission_minor:250,currency:"CAD",duration_count:7,duration_unit:"months",status:"disabled"});
    assert.throws(()=>admin.configureCoachFee({...feeInput,status:"active"}),/not enabled/);
    assert.throws(()=>admin.configureCoachFee({...feeInput,actorUserId:other}));
    assert.throws(()=>admin.configureCoachFee({...feeInput,durationUnit:null}),/duration/);
    assert.throws(()=>admin.configureCoachFee({...feeInput,minimumCommissionMinor:-1}),/minimum/);
    assert.throws(()=>admin.configureCoachFee({...feeInput,coachUserId:other}),/Choose a coach/);
    assert.throws(()=>db.prepare(`UPDATE traderlink_community_coach_fee_rules SET duration_unit=NULL WHERE fee_rule_id=?`).run(feeId));
    assert.throws(()=>admin.configurePartner({actorUserId:owner,communityId:community,status:"active",commissionBasisPoints:1000,attributionDays:90,currency:"USD",atUtc:input.atUtc}),/not enabled/);
    assert.equal(admin.attributeMember({communityId:community,userId:owner,atUtc:input.atUtc}),null);
    assert.deepEqual(admin.applyTier2BillingEvent({providerEventRef:"fixture-event",userId:owner,eventType:"tier2.started",periodKey:"fixture",grossMinor:1000,currency:"USD",occurredAtUtc:input.atUtc,processedAtUtc:input.atUtc}),{applied:false,commissionMinor:0});
    assert.equal((db.prepare("SELECT count(*) n FROM traderlink_community_partner_billing_events").get() as {n:number}).n,0);
    const old = new Date(Date.parse(now)-91*86400000).toISOString();
    const recent = new Date(Date.parse(now)-86400000).toISOString();
    for(const [id,at] of [["10000000-0000-4000-8000-000000000003",old],["10000000-0000-4000-8000-000000000004",recent]]) {
      db.prepare(`INSERT INTO traderlink_community_activity_events(event_id,community_id,user_id,event_type,object_type,path,occurred_at_utc) VALUES(?,?,?,'page.view','community','/communities/independent-room',?)`).run(id,community,owner,at);
      db.prepare(`INSERT INTO traderlink_community_activity_daily_members(community_id,activity_day,path,user_id,views,first_viewed_at_utc,last_viewed_at_utc) VALUES(?,?,'/communities/independent-room',?,1,?,?)`).run(community,at.slice(0,10),owner,at,at);
    }
    assert.deepEqual(pruneCommunityNamedActivity(db,now,1),{events:1,dailyMembers:1,privateEvents:0,privateDailyMembers:0});
    assert.deepEqual(pruneCommunityNamedActivity(db,now,1),{events:0,dailyMembers:0,privateEvents:0,privateDailyMembers:0});
    assert.equal((db.prepare("SELECT count(*) n FROM traderlink_community_activity_daily_members").get() as {n:number}).n,1);
    assert.throws(()=>pruneCommunityNamedActivity(db,now,0));
    const paths=["/communities/independent-room/alerts","/communities/independent-room/alerts/test-id","/communities/independent-room/watchlists","/communities/independent-room/server-watchlists/abc","/communities/independent-room/coaches/abc","/communities/independent-room/workspace/students/private","/communities/independent-room/coaching","/communities/independent-room/manage","/communities/independent-room/alerts?private=note","/communities/other-room/alerts","/communities/independent-room/alerts/a/b","/communities/independent-room/alerts/"];
    for(const [index,path] of paths.entries()){
      db.prepare(`INSERT INTO traderlink_community_activity_events(event_id,community_id,user_id,event_type,object_type,path,occurred_at_utc) VALUES(?,?,?,'page.view','community',?,?)`).run(`10000000-0000-4000-8000-${String(index+100).padStart(12,"0")}`,community,owner,path,recent);
      db.prepare(`INSERT INTO traderlink_community_activity_daily_members(community_id,activity_day,path,user_id,views,first_viewed_at_utc,last_viewed_at_utc) VALUES(?,?,?,?,1,?,?)`).run(community,recent.slice(0,10),path,owner,recent,recent);
    }
    const expectedRemoved=paths.filter(path=>!isCommunityContentActivityPath("independent-room",path)).length;
    const cleaned=pruneCommunityNamedActivity(db,now);
    assert.equal(cleaned.privateEvents,expectedRemoved);
    assert.equal(cleaned.privateDailyMembers,expectedRemoved);
    assert.equal((db.prepare("SELECT count(*) n FROM traderlink_community_activity_events").get() as {n:number}).n,1+paths.length-expectedRemoved);
    assert.deepEqual(db.pragma("foreign_key_check"),[]);
    console.log("PASS: approved guild onboarding, fresh ownership, reconnect preservation, no operator/test grants, rollback, retention of both named tables.");
  } finally {
    db.close();
    if(originalAllowlist===undefined)delete process.env.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS;
    else process.env.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS=originalAllowlist;
  }
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
