import {headers} from "next/headers";
import {readCommunityHistoryEntry} from "@/src/modules/communities/contracts/community-history-entry";
import {requireTraderLinkPlatformAuthenticatedPageIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {requireCommunityRequestAccess} from "@/src/modules/communities/server/community-request-access";
import {requireTraderLinkPlatformServerComponentPageIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {withPlatformDatabase} from "@/src/modules/platform/server/database/open-platform-database";
import {createCanonicalUtcTimestamp,isTraderLinkPlatformError} from "@/src/modules/platform/server/database/platform-migration-contract";
import {TraderLinkCommunityPlatformRepository,type TraderLinkCommunityCoachingSnapshot} from "@/src/modules/communities/server/traderlink-community-platform-repository";
import {resolveTraderLinkCommunityViewer} from "@/src/modules/communities/server/traderlink-community-viewer";
import {isCommunityContentActivityPath} from "@/src/modules/communities/server/community-activity-scope";
import {notFound} from "next/navigation";

/** Selected Coaching and owner management route loader; stock projections remain separate. */
export async function loadCommunityDashboard(communitySlug:string,path?:string):Promise<Readonly<{snapshot:TraderLinkCommunityCoachingSnapshot;isReview:boolean}>>{
 try{return await loadAuthorizedCoachingDashboard(communitySlug,path);}catch(error){
  if(isTraderLinkPlatformError(error)&&(error.code==="TRADERLINK_WORKSPACE_ACCESS_DENIED"||error.code==="TRADERLINK_WORKSPACE_NOT_FOUND"))notFound();throw error;
 }
}
async function loadAuthorizedCoachingDashboard(communitySlug:string,path?:string):Promise<Readonly<{snapshot:TraderLinkCommunityCoachingSnapshot;isReview:boolean}>>{
 const identity=await requireTraderLinkPlatformServerComponentPageIdentity(),requested=path??`/communities/${communitySlug}`,suffix=requested.slice(`/communities/${communitySlug}`.length);
 const historyPath=suffix==="/coaching"||suffix==="/workspace"||suffix==="/workspace/students"||/^\/workspace\/students\/[^/?#]+(?:\/reviews\/[^/?#]+(?:\/final)?)?$/.test(suffix);
 const existingCoachingPage=historyPath||/^\/workspace\/(coachingwork|reviews|sessions|teaching)$/.test(suffix);let historyOnly=false;
 try{await requireCommunityRequestAccess({userId:identity.scope.userId,slug:communitySlug,existingCoachingOnly:existingCoachingPage,relationshipId:suffix.match(/^\/workspace\/students\/([^/?#]+)/)?.[1]});}catch(error){if(!historyPath)throw error;historyOnly=true;}
 const snapshot=withPlatformDatabase({mode:"runtime"},database=>{
  let activeJournalAccountName:string|null=null;
  if(identity.scope.activeAccountId&&identity.scope.allowedAccountIds.includes(identity.scope.activeAccountId))activeJournalAccountName=(database.prepare("SELECT display_name FROM journal_accounts WHERE account_id=? AND workspace_id=? AND status='active'").get(identity.scope.activeAccountId,identity.scope.workspaceId) as {display_name:string}|undefined)?.display_name??null;
  const viewer=historyOnly?{userId:identity.scope.userId,displayName:identity.displayName??"Member",discordRoleIds:[]}:resolveTraderLinkCommunityViewer(database,identity,communitySlug),repository=new TraderLinkCommunityPlatformRepository(database);
  let current=repository.readCoachingSnapshot(communitySlug,viewer,{historyOnly});const capabilities=new Set(current.viewer.capabilities);
  const managementPermission=suffix==="/manage"||suffix==="/manage/settings"?"community.manage":suffix==="/manage/roles"?"community.roles.manage":null;
  const permitted=managementPermission?(current.community.isOwner||capabilities.has(managementPermission)):suffix.includes("/coaches")||suffix.includes("/coaching")?capabilities.has("community.coaching.view")||capabilities.has("community.coaching.offer")||capabilities.has("community.coaching.manage_all"):suffix.includes("/workspace")?capabilities.has("community.coaching.offer")||capabilities.has("community.coaching.students"):suffix==="";
  const ownCoachingHistory=requested===`/communities/${communitySlug}/coaching`&&current.relationships.some(row=>row.studentUserId===viewer.userId);
  if(!permitted&&!ownCoachingHistory){if(!historyPath)notFound();current=repository.readCoachingSnapshot(communitySlug,viewer,{historyOnly:true});historyOnly=true;}
  if(!historyOnly&&isCommunityContentActivityPath(communitySlug,requested))repository.recordView({communityId:current.community.communityId,userId:viewer.userId,path:requested,objectType:suffix.includes("coach")?"coaching":"community",atUtc:createCanonicalUtcTimestamp()});
  const planCounts=database.prepare("SELECT plan_id,count(*) count FROM traderlink_community_coaching_relationships WHERE community_id=? AND status='active' GROUP BY plan_id").all(current.community.communityId) as {plan_id:string;count:number}[],counts=new Map(planCounts.map(row=>[row.plan_id,row.count]));
  const deletedOwner=database.prepare("SELECT 1 FROM traderlink_communities c JOIN platform_users u ON u.user_id=c.owner_user_id WHERE c.community_id=? AND u.auth_provider='deleted' AND u.status='disabled'").get(current.community.communityId);
  if(deletedOwner&&!historyOnly){
   const ownRelationships=current.relationships.filter(row=>row.coachUserId===identity.scope.userId||row.studentUserId===identity.scope.userId);
   if(!existingCoachingPage||!ownRelationships.some(row=>row.status==='active'&&!row.archivedAtUtc))notFound();
   current={...current,publishing:undefined,relationships:ownRelationships,plans:[],coaches:[],audiences:[],coachingRoleOptions:[],community:{...current.community,isOwner:false,memberCount:0},viewer:{...current.viewer,capabilities:current.viewer.capabilities.filter(key=>key.startsWith('community.coaching.')&&key!=='community.coaching.manage_all')}};
  }
  return {...current,lifecycle:database.prepare("SELECT bot_state botState,bot_checked_at_utc checkedAtUtc FROM traderlink_community_lifecycle WHERE community_id=?").get(current.community.communityId) as {botState:string;checkedAtUtc:string|null}|undefined,plans:current.plans.map(plan=>({...plan,activeStudents:counts.get(plan.planId)??0})),viewer:{...current.viewer,activeJournalAccountId:identity.scope.activeAccountId??null,activeJournalAccountName}};
 });
 return Object.freeze({snapshot,isReview:false});
}

/** Explicit history branch runs before any live dashboard loader or provider verification. */
export async function loadCommunityRetainedHistory() {
 const entry=readCommunityHistoryEntry(await headers());
 if(entry==="invalid")notFound();
 if(!entry)return null;
 const identity=await requireTraderLinkPlatformAuthenticatedPageIdentity();
 try{return withReadonlyPlatformDatabase({},db=>new TraderLinkCommunityPlatformRepository(db).readRetainedHistory(entry,identity.scope.userId));}
 catch(error){if(isTraderLinkPlatformError(error)&&(error.code==="TRADERLINK_WORKSPACE_ACCESS_DENIED"||error.code==="TRADERLINK_WORKSPACE_NOT_FOUND"))notFound();throw error;}
}
