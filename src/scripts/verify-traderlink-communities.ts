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
import { traderLinkCommunitiesDiscordFeatureAccessMigration } from "../modules/communities/server/database/migrations/0123_traderlink_communities_discord_feature_access";
import { traderLinkCommunitiesServerWatchlistsMigration } from "../modules/communities/server/database/migrations/0124_traderlink_communities_server_watchlists";
import { traderLinkCommunitiesPrivatePilotBootstrapMigration } from "../modules/communities/server/database/migrations/0125_traderlink_communities_private_pilot_bootstrap";
import { traderLinkCommunitiesWorkspaceToolsMigration } from "../modules/communities/server/database/migrations/0126_traderlink_communities_workspace_tools";
import { traderLinkCommunitiesCoachingWorkspaceMigration } from "../modules/communities/server/database/migrations/0127_traderlink_communities_coaching_workspace";
import { traderLinkCommunitiesCoachingProgramsMigration } from "../modules/communities/server/database/migrations/0128_traderlink_communities_coaching_programs";
import { TRADERLINK_COMMUNITY_CAPABILITIES } from "../modules/communities/contracts/traderlink-community-contracts";
import { TraderLinkCommunityRepository } from "../modules/communities/server/traderlink-community-repository";
import { TraderLinkCommunityPlatformRepository } from "../modules/communities/server/traderlink-community-platform-repository";
import { TraderLinkCommunityAdminRepository } from "../modules/communities/server/traderlink-community-admin-repository";
import { TraderLinkCommunityCoachJournalReadService } from "../modules/communities/server/traderlink-community-coach-journal-read-service";
import { TraderLinkCommunityCoachingProgramService } from "../modules/communities/server/traderlink-community-coaching-program-service";
import { findActiveOnboardedCommunityGuild } from "../modules/platform/server/authentication/platform-community-dashboard-access";

const NOW="2026-09-05T12:00:00.000Z";
const OWNER="10000000-0000-4000-8000-000000000001";
const MEMBER="10000000-0000-4000-8000-000000000002";
const OUTSIDER="10000000-0000-4000-8000-000000000003";
const WORKSPACE="10000000-0000-4000-8000-000000000004";
const ACCOUNT="10000000-0000-4000-8000-000000000005";
const OUTSIDER_WORKSPACE="10000000-0000-4000-8000-000000000007";
const OUTSIDER_ACCOUNT="10000000-0000-4000-8000-000000000008";
const PILOT_GUILD="1433570740430573642";

function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
function expectDenied(operation:()=>unknown,message:string):void{let denied=false;try{operation();}catch{denied=true;}assert(denied,message);}

const directory=mkdtempSync(join(tmpdir(),"traderlink-communities-qa-"));
const database=new Database(join(directory,"qa.sqlite"));
try{
  database.pragma("foreign_keys = ON");
  for(const migration of [platformIdentityMigration,journalAccountBoundaryMigration,platformAuthenticationIdentitiesMigration,platformDiscordMembershipsMigration,communityWatchlistsMigration,traderLinkCommunitiesIdentityPermissionsMigration,traderLinkCommunitiesPartnerPlatformMigration,traderLinkCommunitiesDiscordFeatureAccessMigration,traderLinkCommunitiesServerWatchlistsMigration,traderLinkCommunitiesWorkspaceToolsMigration,traderLinkCommunitiesCoachingWorkspaceMigration,traderLinkCommunitiesCoachingProgramsMigration]){
    for(const statement of migration.statements)database.exec(statement);
  }
  const expected=["traderlink_communities","traderlink_community_memberships","traderlink_community_alerts","traderlink_community_watchlist_placements","traderlink_community_server_watchlists","traderlink_community_server_watchlist_symbols","traderlink_community_network_settings","traderlink_community_coach_profiles","traderlink_community_coaching_plans","traderlink_community_coaching_relationships","traderlink_community_journal_grants","traderlink_community_activity_events","traderlink_community_activity_daily_members","traderlink_community_partner_programs","traderlink_community_partner_earnings","traderlink_community_partner_billing_events","traderlink_community_coach_fee_rules","traderlink_community_alert_templates","traderlink_community_alert_template_fields","traderlink_community_alert_field_values","traderlink_community_coaching_messages","traderlink_community_coaching_trade_reviews","traderlink_community_coaching_review_trades","traderlink_community_coaching_sessions","traderlink_community_coaching_teaching_items","traderlink_community_coaching_teaching_students","traderlink_community_coaching_attachments","traderlink_community_coaching_review_replies"];
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
  insertDiscord.run(OWNER,PILOT_GUILD,"owner","Owner","[]",1,NOW,NOW,NOW);
  insertDiscord.run(MEMBER,PILOT_GUILD,"member","Member",JSON.stringify(["200001"]),0,NOW,NOW,NOW);
  insertDiscord.run(OUTSIDER,"900002","outsider","Outsider","[]",1,NOW,NOW,NOW);
  database.prepare(`INSERT INTO platform_workspaces(workspace_id,display_name,default_trading_timezone,status,created_at_utc,updated_at_utc) VALUES(?,?,'America/Toronto','active',?,?)`).run(WORKSPACE,"Member workspace",NOW,NOW);
  database.prepare(`INSERT INTO platform_workspaces(workspace_id,display_name,default_trading_timezone,status,created_at_utc,updated_at_utc) VALUES(?,?,'America/Toronto','active',?,?)`).run(OUTSIDER_WORKSPACE,"Outsider workspace",NOW,NOW);
  database.prepare(`INSERT INTO platform_workspace_memberships(workspace_id,user_id,role,status,created_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,'owner','active',?,?,?)`).run(WORKSPACE,OWNER,OWNER,NOW,NOW);
  database.prepare(`INSERT INTO platform_workspace_memberships(workspace_id,user_id,role,status,created_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,'owner','active',?,?,?)`).run(OUTSIDER_WORKSPACE,OUTSIDER,OUTSIDER,NOW,NOW);
  database.prepare(`INSERT INTO journal_accounts(account_id,workspace_id,display_name,base_currency,trading_timezone,status,created_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,?,'USD','America/Toronto','active',?,?,?)`).run(ACCOUNT,WORKSPACE,"Trading account",OWNER,NOW,NOW);
  database.prepare(`INSERT INTO journal_accounts(account_id,workspace_id,display_name,base_currency,trading_timezone,status,created_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,?,'USD','America/Toronto','active',?,?,?)`).run(OUTSIDER_ACCOUNT,OUTSIDER_WORKSPACE,"Outsider account",OUTSIDER,NOW,NOW);

  const permissions=new TraderLinkCommunityRepository(database);
  const platform=new TraderLinkCommunityPlatformRepository(database);
  const first=permissions.createFromVerifiedDiscordOwner({ownerUserId:OWNER,discordGuildId:PILOT_GUILD,slug:"first-room",displayName:"First Room",timestamp:NOW});
  for(const statement of traderLinkCommunitiesPrivatePilotBootstrapMigration.statements)database.exec(statement);
  assert((database.prepare(`SELECT count(*) count FROM traderlink_community_discord_role_mappings WHERE community_id=? AND status='active'`).get(first.communityId) as {count:number}).count===3,"Pilot bootstrap must install only the three server-feature Discord role mappings; test-community is superseded by the automatic all-member baseline.");
  assert((database.prepare(`SELECT count(*) count FROM traderlink_community_discord_destinations WHERE community_id=? AND status='active'`).get(first.communityId) as {count:number}).count===3,"Pilot bootstrap must install the three supplied Discord channel destinations.");
  const second=permissions.createFromVerifiedDiscordOwner({ownerUserId:OUTSIDER,discordGuildId:"900002",slug:"second-room",displayName:"Second Room",timestamp:NOW});
  permissions.setStatus({communityId:first.communityId,actorUserId:OWNER,status:"active",timestamp:NOW});
  permissions.setStatus({communityId:second.communityId,actorUserId:OUTSIDER,status:"active",timestamp:NOW});
  permissions.syncActiveMemberFromDiscord({communityId:first.communityId,userId:MEMBER,timestamp:NOW});
  assert(findActiveOnboardedCommunityGuild(database,MEMBER)===PILOT_GUILD,"An active onboarded-server membership must admit the member to the regular TraderLink dashboard without a role mapping.");
  const baseline=permissions.resolveAccess(first.communityId,MEMBER);
  assert(baseline.capabilities.includes("community.view")&&baseline.capabilities.includes("community.watchlists.share_own"),"Every verified guild member must receive the non-configurable TraderLink community baseline.");
  assert(!baseline.capabilities.includes("community.alerts.view")&&!baseline.capabilities.includes("community.watchlists.view")&&!baseline.capabilities.includes("community.coaching.view"),"The automatic member baseline must not expose server-owned Alerts, Server Watchlists, or Coaching.");
  assert(permissions.resolveAccess(second.communityId,MEMBER).capabilities.length===0,"Membership must not cross communities.");
  permissions.saveDiscordFeatureMapping({communityId:first.communityId,actorUserId:OWNER,discordRoleId:"200001",discordRoleName:"Banana Fanana",responsibilities:["alerts-access","alerts-publish","server-watchlists-access","server-watchlists-publish","coach"],timestamp:NOW});
  assert(permissions.resolveAccess(first.communityId,MEMBER).capabilities.includes("community.alerts.create"),"Mapped Discord role must grant the owner's configured capability.");
  permissions.pauseDiscordFeatureMapping({communityId:first.communityId,actorUserId:OWNER,discordRoleId:"200001",timestamp:NOW});
  assert(!permissions.resolveAccess(first.communityId,MEMBER).capabilities.includes("community.alerts.create"),"Pausing a Discord role mapping must remove its server-feature access without removing the member baseline.");
  permissions.saveDiscordFeatureMapping({communityId:first.communityId,actorUserId:OWNER,discordRoleId:"200001",discordRoleName:"Banana Fanana",responsibilities:["alerts-access","alerts-publish","server-watchlists-access","server-watchlists-publish","coach"],timestamp:NOW});
  database.prepare(`UPDATE platform_discord_memberships SET role_ids_json='[]' WHERE user_id=? AND guild_id=?`).run(MEMBER,PILOT_GUILD);
  const afterRoleRemoval=permissions.resolveAccess(first.communityId,MEMBER);
  assert(afterRoleRemoval.capabilities.includes("community.view")&&afterRoleRemoval.capabilities.includes("community.watchlists.share_own"),"Removing a Discord role must not remove the server-wide TraderLink member baseline.");
  assert(!afterRoleRemoval.capabilities.includes("community.alerts.view")&&!afterRoleRemoval.capabilities.includes("community.watchlists.view")&&!afterRoleRemoval.capabilities.includes("community.coaching.view"),"Removing a Discord role must immediately revoke only its server-owned features.");
  database.prepare(`UPDATE platform_discord_memberships SET role_ids_json=? WHERE user_id=? AND guild_id=?`).run(JSON.stringify(["200001"]),MEMBER,PILOT_GUILD);

  const everyone=platform.ensureDefaultAudience({communityId:first.communityId,actorUserId:OWNER,atUtc:NOW});
  const restricted=platform.createAudience({communityId:first.communityId,actor:{userId:OWNER,displayName:"Owner",discordRoleIds:[]},name:"Paid members",discordRoleIds:["200001"],atUtc:NOW});
  const alertId=platform.createAlert({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},title:"Opening plan",symbol:"ABC",body:"Community-authored alert.",audienceId:restricted,publish:true,atUtc:NOW});
  const serverWatchlistId=platform.createServerWatchlist({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},title:"Opening watch",description:"Private server list",symbols:["ABC","XYZ"],publish:true,atUtc:NOW});
  assert(platform.readSnapshot("first-room",{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]}).alerts.length===1,"Eligible member must see role-mapped content.");
  const serverWatchlist=platform.readSnapshot("first-room",{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]}).watchlists[0];
  assert(serverWatchlist?.sourceKind==="server"&&serverWatchlist.networkVisibility==="private","Server watchlists must remain distinct and private by default.");
  assert((database.prepare(`SELECT count(*) count FROM traderlink_community_content_deliveries WHERE object_id IN (?,?)`).get(alertId,serverWatchlistId) as {count:number}).count===2,"Published alert and server watchlist must each queue exactly one configured destination.");
  expectDenied(()=>database.prepare(`INSERT INTO traderlink_community_content_deliveries(delivery_id,community_id,object_type,object_id,destination_id,status,attempt_count,last_error,requested_at_utc,delivered_at_utc,updated_at_utc) SELECT '10000000-0000-4000-8000-000000000140',community_id,object_type,object_id,destination_id,'pending',0,NULL,requested_at_utc,NULL,updated_at_utc FROM traderlink_community_content_deliveries WHERE object_id=? LIMIT 1`).run(alertId),"Delivery queue must reject duplicate object and destination rows.");
  database.prepare(`UPDATE platform_discord_memberships SET role_ids_json=? WHERE user_id=? AND guild_id=?`).run(JSON.stringify(["1546028813106941952"]),MEMBER,PILOT_GUILD);
  const communityOnly=platform.readSnapshot("first-room",{userId:MEMBER,displayName:"Member",discordRoleIds:["1546028813106941952"]});
  assert(communityOnly.alerts.length===0&&communityOnly.watchlists.length===0&&communityOnly.coaches.length===0,"Community participation alone must not expose Alerts, Server Watchlists, or Coaching.");
  database.prepare(`UPDATE platform_discord_memberships SET role_ids_json=? WHERE user_id=? AND guild_id=?`).run(JSON.stringify(["200001"]),MEMBER,PILOT_GUILD);
  platform.updateAlert({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},alertId,title:"Opening plan updated",symbol:"ABC",body:"Updated alert.",status:"published",atUtc:NOW});
  assert(platform.readSnapshot("first-room",{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]}).alerts[0]?.title==="Opening plan updated","Alert author must be able to edit a published alert.");
  expectDenied(()=>platform.readSnapshot("first-room",{userId:OUTSIDER,displayName:"Outsider",discordRoleIds:[]}),"Non-member must not read another community.");

  const coach=platform.upsertCoach({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},userId:MEMBER,displayName:"Member Coach",headline:"",biography:"",deliverySummary:"",capacity:1,active:true,atUtc:NOW});
  const plan=platform.createPlan({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},coachProfileId:coach,name:"One review",description:"",cadence:"trade_reviews",tradeReviewLimit:1,studentCapacity:1,messagingIncluded:true,tradeReviewsIncluded:true,sessionsIncluded:true,teachingIncluded:true,priceLabel:"Handled in Discord",paymentInstructions:"Contact the server owner.",audienceId:everyone,publish:true,atUtc:NOW});
  const relationship=platform.requestCoaching({communityId:first.communityId,actor:{userId:OWNER,displayName:"Owner",discordRoleIds:[]},planId:plan,atUtc:NOW});
  assert(platform.requestCoaching({communityId:first.communityId,actor:{userId:OWNER,displayName:"Owner",discordRoleIds:[]},planId:plan,atUtc:NOW})===relationship,"Repeated coaching requests must remain idempotent while pending.");
  platform.setRelationshipStatus({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},relationshipId:relationship,status:"active",atUtc:NOW});
  const programs=new TraderLinkCommunityCoachingProgramService(database);
  const expandedReview=programs.createReview({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},relationshipId:relationship,reviewType:"weekly",title:"Weekly review",context:"Compare the week.",periodStart:"2026-09-01",periodEnd:"2026-09-05",roundTripIds:[],atUtc:NOW});
  programs.replyToReview({communityId:first.communityId,actor:{userId:OWNER,displayName:"Owner",discordRoleIds:[]},relationshipId:relationship,reviewId:expandedReview,body:"Received.",atUtc:NOW});
  const session=programs.createSession({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},relationshipId:relationship,title:"Weekly call",agenda:"Review the week.",atUtc:NOW});
  programs.completeSession({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},relationshipId:relationship,sessionId:session,notes:"Completed.",atUtc:NOW});
  programs.createTeaching({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},title:"Risk lesson",teachingType:"lesson",body:"Position sizing.",deliveryUrl:"",audienceMode:"all_students",relationshipIds:[],publish:true,atUtc:NOW});
  platform.setStudentServices({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},relationshipId:relationship,messagingEnabled:true,tradeReviewsEnabled:true,atUtc:NOW});
  const coachingTask=platform.createCoachingTask({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},relationshipId:relationship,title:"Review ABC entry",priority:"high",atUtc:NOW});
  platform.updateCoachingTaskStatus({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},taskId:coachingTask,status:"completed",atUtc:NOW});
  const coachingRecord=platform.createCoachingRecord({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},relationshipId:relationship,recordType:"session",visibility:"shared",title:"ABC review",body:"Reviewed the entry.",occurredAtUtc:NOW,atUtc:NOW});
  assert(Boolean(coachingRecord),"A coach must be able to save durable coaching history.");
  const template=platform.createAlertTemplate({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},title:"Stock alert",scope:"personal",fields:[{label:"Ticker",type:"ticker",required:true,placeholder:"ABC"},{label:"Target",type:"price",required:false,placeholder:"12.50"}],atUtc:NOW});
  assert(Boolean(template)&&platform.readSnapshot("first-room",{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]}).alertTemplates.length===1,"Alert publishers must be able to save and reuse personal templates.");
  const message=platform.sendCoachingMessage({communityId:first.communityId,actor:{userId:OWNER,displayName:"Owner",discordRoleIds:[]},relationshipId:relationship,body:"Please review my entry.",atUtc:NOW});
  assert(Boolean(message),"An active student must be able to message the selected coach.");
  const review=platform.requestTradeReview({communityId:first.communityId,actor:{userId:OWNER,displayName:"Owner",discordRoleIds:[]},relationshipId:relationship,title:"ABC entry",studentContext:"Review the first entry.",atUtc:NOW});
  platform.updateTradeReview({communityId:first.communityId,actor:{userId:MEMBER,displayName:"Member",discordRoleIds:["200001"]},reviewId:review,coachFeedback:"Wait for confirmation.",status:"completed",atUtc:NOW});
  const coachingSnapshot=platform.readSnapshot("first-room",{userId:OWNER,displayName:"Owner",discordRoleIds:[]});
  assert(coachingSnapshot.coachingMessages.length===1&&coachingSnapshot.tradeReviews.some(item=>item.status==="completed")&&coachingSnapshot.coachingTasks[0]?.status==="completed"&&coachingSnapshot.coachingRecords.length===1&&coachingSnapshot.coachingSessions[0]?.status==="completed"&&coachingSnapshot.teachingItems.length===1&&coachingSnapshot.reviewReplies.length===1,"Coach and student work must stay inside their active relationship.");
  expectDenied(()=>platform.requestCoaching({communityId:first.communityId,actor:{userId:OUTSIDER,displayName:"Outsider",discordRoleIds:[]},planId:plan,atUtc:NOW}),"Coach capacity and membership must be enforced.");
  expectDenied(()=>platform.grantJournal({communityId:first.communityId,actor:{userId:OWNER,displayName:"Owner",discordRoleIds:[]},relationshipId:relationship,journalAccountId:OUTSIDER_ACCOUNT,dataScope:"trades",atUtc:NOW}),"A student must never grant a coach another user's Journal account.");
  const grant=platform.grantJournal({communityId:first.communityId,actor:{userId:OWNER,displayName:"Owner",discordRoleIds:[]},relationshipId:relationship,journalAccountId:ACCOUNT,dataScope:"trades",atUtc:NOW});
  assert(Boolean(grant),"Student-owned Journal account grant must be created.");
  database.prepare(`UPDATE platform_discord_memberships SET role_ids_json='[]' WHERE user_id=? AND guild_id=?`).run(MEMBER,PILOT_GUILD);
  expectDenied(()=>new TraderLinkCommunityCoachJournalReadService(database).read({coachUserId:MEMBER,relationshipId:relationship}),"Removing the coach Discord role must block Journal reads even while the student's grant exists.");
  database.prepare(`UPDATE platform_discord_memberships SET role_ids_json=? WHERE user_id=? AND guild_id=?`).run(JSON.stringify(["200001"]),MEMBER,PILOT_GUILD);
  expectDenied(()=>platform.revokeJournal({actorUserId:MEMBER,grantId:grant,atUtc:NOW}),"Coach must not revoke the student's Journal grant.");
  platform.revokeJournal({actorUserId:OWNER,grantId:grant,atUtc:NOW});

  assert(Boolean(database.prepare(`SELECT 1 FROM traderlink_community_operator_grants WHERE user_id=? AND status='active'`).get(OWNER)),"Pilot bootstrap must give the verified pilot owner Communities administration access.");
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
