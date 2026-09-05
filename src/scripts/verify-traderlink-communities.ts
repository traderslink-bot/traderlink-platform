import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import Database from "better-sqlite3";

import { platformIdentityMigration } from "../modules/platform/server/database/migrations/0001_platform_identity";
import { journalAccountBoundaryMigration } from "../modules/journal/server/database/migrations/0002_journal_account_boundary";
import { platformAuthenticationIdentitiesMigration } from "../modules/platform/server/database/migrations/0012_platform_authentication_identities";
import { platformDiscordMembershipsMigration } from "../modules/platform/server/database/migrations/0017_platform_discord_memberships";
import { communityWatchlistsMigration } from "../modules/community/server/database/migrations/0076_community_watchlists";
import { traderLinkCommunitiesIdentityPermissionsMigration } from "../modules/communities/server/database/migrations/0121_traderlink_communities_identity_permissions";
import { traderLinkCommunitiesPartnerPlatformMigration } from "../modules/communities/server/database/migrations/0122_traderlink_communities_partner_platform";
import { TRADERLINK_COMMUNITY_CAPABILITIES } from "../modules/communities/contracts/traderlink-community-contracts";
import { TraderLinkCommunityRepository } from "../modules/communities/server/traderlink-community-repository";
import { TraderLinkCommunityPlatformRepository } from "../modules/communities/server/traderlink-community-platform-repository";
import { TraderLinkCommunityAdminRepository } from "../modules/communities/server/traderlink-community-admin-repository";

const NOW="2026-09-05T12:00:00.000Z";
const OWNER="10000000-0000-4000-8000-000000000001";
const MEMBER="10000000-0000-4000-8000-000000000002";
const OUTSIDER="10000000-0000-4000-8000-000000000003";
const WORKSPACE="10000000-0000-4000-8000-000000000004";
const ACCOUNT="10000000-0000-4000-8000-000000000005";

function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
function expectDenied(operation:()=>unknown,message:string):void{let denied=false;try{operation();}catch{denied=true;}assert(denied,message);}

const directory=mkdtempSync(join(tmpdir(),"traderlink-communities-qa-"));
const database=new Database(join(directory,"qa.sqlite"));
try{
  database.pragma("foreign_keys = ON");
  for(const migration of [platformIdentityMigration,journalAccountBoundaryMigration,platformAuthenticationIdentitiesMigration,platformDiscordMembershipsMigration,communityWatchlistsMigration,traderLinkCommunitiesIdentityPermissionsMigration,traderLinkCommunitiesPartnerPlatformMigration]){
    for(const statement of migration.statements)database.exec(statement);
  }
  const expected=["traderlink_communities","traderlink_community_memberships","traderlink_community_alerts","traderlink_community_watchlist_placements","traderlink_community_coach_profiles","traderlink_community_coaching_plans","traderlink_community_coaching_relationships","traderlink_community_journal_grants","traderlink_community_activity_events","traderlink_community_activity_daily_members","traderlink_community_partner_programs","traderlink_community_partner_earnings","traderlink_community_partner_billing_events","traderlink_community_coach_fee_rules"];
  const present=new Set((database.prepare(`SELECT name FROM sqlite_schema WHERE type='table'`).all() as {name:string}[]).map(row=>row.name));
  for(const table of expected)if(!present.has(table))throw new Error(`Missing Communities table: ${table}`);
  const capabilityCount=(database.prepare(`SELECT count(*) count FROM traderlink_community_capability_catalog`).get() as {count:number}).count;
  if(capabilityCount!==TRADERLINK_COMMUNITY_CAPABILITIES.length)throw new Error("Communities capability catalog mismatch.");
  const foreignKeys=database.pragma("foreign_key_check") as unknown[];
  if(foreignKeys.length)throw new Error("Communities schema has foreign-key violations.");
  const schema=String((database.prepare(`SELECT group_concat(sql,'\n') schema FROM sqlite_schema WHERE name LIKE 'traderlink_community_%'`).get() as {schema:string}).schema);
  for(const forbidden of ["access_token","refresh_token","card_number","payment_secret","journal_payload_json"])if(schema.includes(forbidden))throw new Error(`Forbidden sensitive field in Communities schema: ${forbidden}`);

  const insertUser=database.prepare(`INSERT INTO platform_users(user_id,auth_provider,auth_subject,display_name,status,created_at_utc,updated_at_utc) VALUES(?, 'discord', ?, ?, 'active', ?, ?)`);
  const insertIdentity=database.prepare(`INSERT INTO platform_auth_identities(user_id,auth_provider,auth_subject,status,linked_by_user_id,created_at_utc,updated_at_utc,last_authenticated_at_utc) VALUES(?,'discord',?,'active',?,?,?,?)`);
  const insertDiscord=database.prepare(`INSERT INTO platform_discord_memberships(user_id,guild_id,username,global_display_name,avatar_hash,role_ids_json,guild_owner,joined_at_utc,first_verified_at_utc,last_verified_at_utc) VALUES(?,?,?,?,NULL,?,?,?,?,?)`);
  for(const [id,subject,name] of [[OWNER,"owner-subject","Owner"],[MEMBER,"member-subject","Member"],[OUTSIDER,"outsider-subject","Outsider"]] as const){insertUser.run(id,subject,name,NOW,NOW);insertIdentity.run(id,subject,id,NOW,NOW,NOW);}
  insertDiscord.run(OWNER,"900001","owner","Owner","[]",1,NOW,NOW,NOW);
  insertDiscord.run(MEMBER,"900001","member","Member",JSON.stringify(["200001"]),0,NOW,NOW,NOW);
  insertDiscord.run(OUTSIDER,"900002","outsider","Outsider","[]",1,NOW,NOW,NOW);
  database.prepare(`INSERT INTO platform_workspaces(workspace_id,display_name,default_trading_timezone,status,created_at_utc,updated_at_utc) VALUES(?,?,'America/Toronto','active',?,?)`).run(WORKSPACE,"Member workspace",NOW,NOW);
  database.prepare(`INSERT INTO platform_workspace_memberships(workspace_id,user_id,role,status,created_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,'owner','active',?,?,?)`).run(WORKSPACE,OWNER,OWNER,NOW,NOW);
  database.prepare(`INSERT INTO journal_accounts(account_id,workspace_id,display_name,base_currency,trading_timezone,status,created_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,?,'USD','America/Toronto','active',?,?,?)`).run(ACCOUNT,WORKSPACE,"Trading account",OWNER,NOW,NOW);

  const permissions=new TraderLinkCommunityRepository(database);
  const platform=new TraderLinkCommunityPlatformRepository(database);
  const first=permissions.createFromVerifiedDiscordOwner({ownerUserId:OWNER,discordGuildId:"900001",slug:"first-room",displayName:"First Room",timestamp:NOW});
  const second=permissions.createFromVerifiedDiscordOwner({ownerUserId:OUTSIDER,discordGuildId:"900002",slug:"second-room",displayName:"Second Room",timestamp:NOW});
  permissions.setStatus({communityId:first.communityId,actorUserId:OWNER,status:"active",timestamp:NOW});
  permissions.setStatus({communityId:second.communityId,actorUserId:OUTSIDER,status:"active",timestamp:NOW});
  permissions.syncActiveMemberFromDiscord({communityId:first.communityId,userId:MEMBER,timestamp:NOW});
  const baseline=permissions.resolveAccess(first.communityId,MEMBER);
  assert(baseline.capabilities.includes("community.view")&&baseline.capabilities.includes("community.watchlists.share_own"),"Active members must receive baseline access.");
  assert(permissions.resolveAccess(second.communityId,MEMBER).capabilities.length===0,"Membership must not cross communities.");
  const analyst=permissions.createRole({communityId:first.communityId,actorUserId:OWNER,name:"Banana Fanana",capabilities:["community.alerts.create","community.analytics.view"],timestamp:NOW});
  permissions.mapDiscordRole({communityId:first.communityId,actorUserId:OWNER,discordRoleId:"200001",roleId:analyst.roleId,timestamp:NOW});
  assert(permissions.resolveAccess(first.communityId,MEMBER).capabilities.includes("community.alerts.create"),"Mapped Discord role must grant the owner's configured capability.");

  const everyone=platform.ensureDefaultAudience({communityId:first.communityId,actorUserId:OWNER,atUtc:NOW});
  const restricted=platform.createAudience({communityId:first.communityId,actor:{userId:OWNER,displayName:"Owner",discordRoleIds:[]},name:"Paid members",discordRoleIds:["200001"],atUtc:NOW});
  platform.createAlert({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},title:"Opening plan",symbol:"ABC",body:"Community-authored alert.",audienceId:restricted,publish:true,atUtc:NOW});
  assert(platform.readSnapshot("first-room",{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]}).alerts.length===1,"Eligible member must see role-mapped content.");
  expectDenied(()=>platform.readSnapshot("first-room",{userId:OUTSIDER,displayName:"Outsider",discordRoleIds:[]}),"Non-member must not read another community.");

  const coachRole=permissions.createRole({communityId:first.communityId,actorUserId:OWNER,name:"Coach",capabilities:["community.coaching.offer","community.coaching.students"],timestamp:NOW});
  permissions.assignRole({communityId:first.communityId,actorUserId:OWNER,userId:MEMBER,roleId:coachRole.roleId,timestamp:NOW});
  const coach=platform.upsertCoach({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},userId:MEMBER,displayName:"Member Coach",headline:"",biography:"",deliverySummary:"",capacity:1,active:true,atUtc:NOW});
  const plan=platform.createPlan({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},coachProfileId:coach,name:"One review",description:"",cadence:"trade_reviews",tradeReviewLimit:1,priceLabel:"Handled in Discord",paymentInstructions:"Contact the server owner.",audienceId:everyone,publish:true,atUtc:NOW});
  const relationship=platform.requestCoaching({communityId:first.communityId,actor:{userId:OWNER,displayName:"Owner",discordRoleIds:[]},planId:plan,atUtc:NOW});
  platform.setRelationshipStatus({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},relationshipId:relationship,status:"active",atUtc:NOW});
  expectDenied(()=>platform.requestCoaching({communityId:first.communityId,actor:{userId:OUTSIDER,displayName:"Outsider",discordRoleIds:[]},planId:plan,atUtc:NOW}),"Coach capacity and membership must be enforced.");
  const grant=platform.grantJournal({communityId:first.communityId,actor:{userId:OWNER,displayName:"Owner",discordRoleIds:[]},relationshipId:relationship,journalAccountId:ACCOUNT,dataScope:"trades",atUtc:NOW});
  assert(Boolean(grant),"Student-owned Journal account grant must be created.");
  expectDenied(()=>platform.revokeJournal({actorUserId:MEMBER,grantId:grant,atUtc:NOW}),"Coach must not revoke the student's Journal grant.");
  platform.revokeJournal({actorUserId:OWNER,grantId:grant,atUtc:NOW});

  database.prepare(`INSERT INTO traderlink_community_operator_grants(grant_id,user_id,status,granted_at_utc,revoked_at_utc) VALUES(?,?,'active',?,NULL)`).run("10000000-0000-4000-8000-000000000006",OWNER,NOW);
  const admin=new TraderLinkCommunityAdminRepository(database);
  admin.configurePartner({actorUserId:OWNER,communityId:first.communityId,status:"active",commissionBasisPoints:2000,attributionDays:90,currency:"USD",atUtc:NOW});
  admin.configurePartner({actorUserId:OWNER,communityId:second.communityId,status:"active",commissionBasisPoints:1000,attributionDays:90,currency:"USD",atUtc:NOW});
  const attribution=admin.attributeMember({communityId:first.communityId,userId:OWNER,atUtc:NOW});
  assert(attribution===admin.attributeMember({communityId:first.communityId,userId:OWNER,atUtc:NOW}),"First community attribution must remain deterministic.");
  assert(admin.attributeMember({communityId:second.communityId,userId:OWNER,atUtc:NOW})===null,"A member cannot be attributed to a community they have not joined.");
  const billing=admin.applyTier2BillingEvent({providerEventRef:"qa-start",userId:OWNER,eventType:"tier2.started",periodKey:"2026-09",grossMinor:1000,currency:"USD",occurredAtUtc:NOW,processedAtUtc:NOW});
  assert(billing.applied&&billing.commissionMinor===200,"Tier 2 commission must use configured basis points.");
  assert(!admin.applyTier2BillingEvent({providerEventRef:"qa-start",userId:OWNER,eventType:"tier2.started",periodKey:"2026-09",grossMinor:1000,currency:"USD",occurredAtUtc:NOW,processedAtUtc:NOW}).applied,"Billing event must be idempotent.");
  const expired=admin.applyTier2BillingEvent({providerEventRef:"qa-expired",userId:OWNER,eventType:"tier2.renewed",periodKey:"2027-01",grossMinor:1000,currency:"USD",occurredAtUtc:"2027-01-05T12:00:00.000Z",processedAtUtc:"2027-01-05T12:00:00.000Z"});
  assert(expired.applied&&expired.commissionMinor===0,"Expired attribution must not earn a Tier 2 commission.");

  platform.recordView({communityId:first.communityId,userId:OWNER,path:"/communities/first-room/alerts",objectType:"alerts",atUtc:NOW});
  assert((database.prepare(`SELECT views FROM traderlink_community_activity_daily_members WHERE community_id=? AND user_id=?`).get(first.communityId,OWNER) as {views:number}).views===1,"Named activity projection must remain community scoped.");
  assert(!(database.prepare(`SELECT 1 FROM traderlink_community_activity_daily_members WHERE community_id=?`).get(second.communityId)),"Activity must not cross communities.");

  const finalForeignKeys=database.pragma("foreign_key_check") as unknown[];
  assert(finalForeignKeys.length===0,"Seeded Communities flow has foreign-key violations.");
  console.log(JSON.stringify({capabilities:capabilityCount,communityIsolation:true,discordRoleMapping:true,foreignKeyViolations:0,journalGrantRevoked:true,namedActivity:true,ok:true,tables:expected.length,tier2Idempotent:true}));
}finally{database.close();rmSync(directory,{recursive:true,force:true});}
