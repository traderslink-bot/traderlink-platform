"use server";
import {requireCoachingTradePeriod} from "@/src/modules/communities/server/coaching-trade-review-period";
import {coachingReviewDayChoices,coachingStudentUnavailableTrades} from "@/src/modules/communities/server/coaching-review-day-choices";
import {coachingReviewRequestedDays,coachingReviewService} from "@/src/modules/communities/server/coaching-review-service-binding";
import {coachingDistinctReviewTrades,coachingUnavailableReviewTrades} from "@/src/modules/communities/server/coaching-review-trade-eligibility";
import {coachingReviewSelectionPolicy} from "@/src/modules/communities/server/coaching-review-selection-policy";
import {coachingRequiredAccess} from "@/src/modules/communities/contracts/coaching-required-access";
import {readDistribution} from "@/src/modules/communities/server/community-publishing-access";

import type {CommunityPublicationFeedback} from "@/src/modules/communities/contracts/community-publication-feedback";
import {CommunityDeliveryRetryService} from "@/src/modules/communities/server/community-delivery-retry-service";

export async function retryCommunityDeliveryAction(formData:FormData):Promise<void>{
 const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData);
 withPlatformDatabase({mode:"runtime"},database=>{
  const community=database.prepare("SELECT community_id FROM traderlink_communities WHERE slug=?").get(communitySlug) as {community_id:string};
  new CommunityDeliveryRetryService(database).request({communityId:community.community_id,actorUserId:identity.scope.userId,deliveryId:required(formData,"deliveryId"),expectedAttemptKey:required(formData,"attemptKey"),confirmUncertain:formData.get("confirmUncertain")==="on",atUtc:createCanonicalUtcTimestamp()});
 });
 revalidateCommunityPath(communitySlug,"channels");redirect(`/communities/${communitySlug}/manage/channels`);
}

export async function disconnectCommunityAction(formData:FormData):Promise<void>{
 const communitySlug=required(formData,'communitySlug');const {identity}=await context(communitySlug,formData);
 withPlatformDatabase({mode:'runtime'},database=>{
  const community=database.prepare('SELECT community_id,owner_user_id FROM traderlink_communities WHERE slug=?').get(communitySlug) as {community_id:string;owner_user_id:string};
  if(community.owner_user_id!==identity.scope.userId)throw new Error('Only the verified server owner can disconnect this community.');
  new TraderLinkCommunityRepository(database).setStatus({communityId:community.community_id,actorUserId:identity.scope.userId,status:'paused',timestamp:createCanonicalUtcTimestamp()});
 });
 revalidatePath(`/communities/${communitySlug}`,'layout');redirect(`/communities/${communitySlug}/manage/settings`);
}

import {requireCommunityRequestAccess} from "@/src/modules/communities/server/community-request-access";
import {COACHING_REVIEW_FOCUS,isCoachingReviewKind,parseCoachingFocus,type CoachingFocusFeedback} from "@/src/modules/communities/contracts/coaching-review-workspace";

import { refresh, revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp, TraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { TraderLinkCommunityPlatformRepository } from "@/src/modules/communities/server/traderlink-community-platform-repository";
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { TRADERLINK_COMMUNITY_FIXED_RESPONSIBILITIES, type TraderLinkCommunityFixedResponsibility } from "@/src/modules/communities/contracts/traderlink-community-contracts";
import { resolveTraderLinkCommunityViewer } from "@/src/modules/communities/server/traderlink-community-viewer";
import { TraderLinkCommunityCoachingProgramService } from "@/src/modules/communities/server/traderlink-community-coaching-program-service";
import {CoachingAgreementService} from "@/src/modules/communities/server/coaching-agreement-service";
import { readCommunityDiscordResources } from "@/src/modules/communities/server/community-discord-resources";

export async function sendCoachMessageWithFeedbackAction(_previous:{message:string},formData:FormData):Promise<{message:string}>{
 try {
  await sendCommunityCoachingMessageAction(formData);
  return {message:""};
 } catch(error) {
  if(error instanceof TraderLinkPlatformError && error.code==="TRADERLINK_WORKSPACE_ACCESS_DENIED" && error.safeContext.operation==="coaching_access_paused") {
   refresh();
   return {message:"Coaching access is paused."};
  }
  throw error;
 }
}

export async function coachingAgreementAction(formData:FormData):Promise<void>{
 const communitySlug=required(formData,"communitySlug"),relationshipId=required(formData,"relationshipId"),intent=required(formData,"intent");
 const {identity}=await context(communitySlug,formData,true,true);
 withPlatformDatabase({mode:"runtime"},database=>{
  const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
  const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};
  const input={communityId:community.community_id,relationshipId,actor,atUtc:createCanonicalUtcTimestamp()};
  const service=new CoachingAgreementService(database);
  if(intent==="propose")service.propose({...input,startDate:String(formData.get("startDate")??"")||undefined,dueTimeUtc:required(formData,"dueTimeUtc"),customIntervalDays:formData.get("customIntervalDays")?Number(formData.get("customIntervalDays")):undefined,priceAmountMinor:formData.get("price")?Math.round(Number(formData.get("price"))*100):undefined,coverageDays:Object.fromEntries([...formData.entries()].filter(([key])=>key.startsWith("coverageDays:")).map(([key,value])=>[key.slice(13),Number(value)])),quantities:Object.fromEntries([...formData.entries()].filter(([key])=>key.startsWith("quantity:")).map(([key,value])=>[key.slice(9),Number(value)]))});
  else if(intent==="accept"){
   const agreementId=required(formData,'agreementId');
   const row=database.prepare(`SELECT a.terms_json,r.status FROM traderlink_community_coaching_agreements a JOIN traderlink_community_coaching_relationships r ON r.relationship_id=a.relationship_id AND r.community_id=a.community_id WHERE a.agreement_id=? AND a.relationship_id=? AND a.community_id=? AND r.student_user_id=? AND a.status IN ('proposed','accepted')`).get(agreementId,relationshipId,community.community_id,actor.userId) as {terms_json:string;status:string}|undefined;
   if(!row)throw new Error('This agreement is unavailable.');const acceptedTerms=JSON.parse(row.terms_json) as import('@/src/modules/communities/contracts/coaching-agreements').CoachingAgreementTerms;const scopes=coachingRequiredAccess(acceptedTerms.items,acceptedTerms.builderConfig);
   database.transaction(()=>{
    service.accept({...input,agreementId});
    if(scopes.length&&row.status==='active'){
     if(formData.get('shareRequiredAccess')!=='yes')throw new Error('Confirm the required Journal sharing before accepting.');
     const accountId=identity.scope.activeAccountId;if(!accountId||formData.get('journalAccountId')!==accountId)throw new Error('Your Journal account changed. Refresh and review the sharing requirements.');
     const repository=new TraderLinkCommunityPlatformRepository(database);
     const previous=database.prepare(`SELECT shared_fields_json FROM traderlink_community_journal_grants WHERE relationship_id=? AND journal_account_id=? AND student_user_id=? AND data_scope='trades' AND status='active'`).get(relationshipId,accountId,actor.userId) as {shared_fields_json:string}|undefined;
     const fields=[...new Set([...(previous?JSON.parse(previous.shared_fields_json) as string[]:[]),...scopes.filter(scope=>!['trades','analytics'].includes(scope))])];
     repository.grantJournal({...input,journalAccountId:accountId,dataScope:'trades',sharedFields:fields});repository.grantJournal({...input,journalAccountId:accountId,dataScope:'summary'});if(scopes.includes('analytics'))repository.grantJournal({...input,journalAccountId:accountId,dataScope:'analytics'});
    }
   })();
  }
  else if(intent==="generate")service.generate({...input,throughDate:required(formData,"throughDate")});
  else throw new Error("Choose a coaching agreement action.");
 });
 revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);revalidatePath("/communities/coaching");
}

export async function saveCoachingSessionAction(formData:FormData):Promise<void>{
 const communitySlug=required(formData,"communitySlug"),relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug,formData,true,true);
 withPlatformDatabase({mode:"runtime"},database=>{
  const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};
  new TraderLinkCommunityCoachingProgramService(database).updateSession({communityId:community.community_id,actor,relationshipId,sessionId:required(formData,"sessionId"),title:required(formData,"title"),agenda:String(formData.get("agenda")??""),notes:String(formData.get("notes")??""),privateNotes:String(formData.get("privateNotes")??""),meetingUrl:String(formData.get("meetingUrl")??""),durationMinutes:formData.get("durationMinutes")?Number(formData.get("durationMinutes")):null,scheduledAtUtc:optionalUtcDate(formData,"scheduledAt"),attendance:required(formData,"attendance") as "not_recorded"|"attended"|"missed"|"excused",status:required(formData,"status") as "scheduled"|"completed"|"cancelled",atUtc:createCanonicalUtcTimestamp()});
 });revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);
}

export async function archiveCoachingStudentAction(formData:FormData):Promise<void>{
 const communitySlug=required(formData,"communitySlug"),relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug,formData,false,true);
 withPlatformDatabase({mode:"runtime"},database=>{
  const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};
  new TraderLinkCommunityRepository(database).requireCapability(community.community_id,actor.userId,"community.coaching.students");
  const changed=database.prepare(`UPDATE traderlink_community_coaching_relationships SET archived_at_utc=? WHERE relationship_id=? AND community_id=? AND coach_user_id=?`).run(formData.get("intent")==="restore"?null:createCanonicalUtcTimestamp(),relationshipId,community.community_id,actor.userId);
  if(changed.changes!==1)throw new Error("Student workspace unavailable.");
 });revalidateCommunityPath(communitySlug,"workspace/students");
}

export async function saveCoachingTeachingDetailsAction(formData:FormData):Promise<void>{
 const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData,true,true);
 withPlatformDatabase({mode:"runtime"},database=>{
  const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};
  const service=new TraderLinkCommunityCoachingProgramService(database),atUtc=createCanonicalUtcTimestamp();
  const details={communityId:community.community_id,actor,teachingId:required(formData,"teachingId"),title:required(formData,"title"),body:String(formData.get("body")??""),deliveryUrl:String(formData.get("deliveryUrl")??""),recordingUrl:String(formData.get("recordingUrl")??""),deliveryKind:required(formData,"deliveryKind") as "live"|"recorded"|"resource",scheduledAtUtc:optionalUtcDate(formData,"scheduledAt"),availableAtUtc:optionalUtcDate(formData,"availableAt"),dueAtUtc:optionalUtcDate(formData,"dueAt"),status:required(formData,"status") as "draft"|"published"|"completed"|"cancelled",atUtc};
  service.updateTeachingDetails(details);
 });revalidateCommunityPath(communitySlug,"workspace/teaching");
}

export async function saveCoachingTeachingWithFeedbackAction(formData:FormData):Promise<CommunityPublicationFeedback>{
 try {
  await saveCoachingTeachingDetailsAction(formData);
  return {status:"success",message:"Lesson saved."};
 } catch(error) {
  unstable_rethrow(error);
  if(error instanceof Error&&error.message==="Choose students before publishing this lesson.")return {status:"error",message:"Choose active students before publishing this lesson. Restore an archived student or create a lesson for the correct students or plan."};
  return {status:"error",message:"We couldn't save this lesson. Your entries are still here. Check your settings and access, then try again."};
 }
}

function required(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required.`);
  return value;
}

function revalidateCommunityPath(communitySlug: string, path: string): void {
  revalidatePath(`/communities/${communitySlug}`);
  revalidatePath(path === "coaching" ? "/communities/coaching" : `/communities/${communitySlug}/${path}`);
  refresh();
}

function updatedCommunityUrl(communitySlug: string, path: string): string {
  const pathname = path === "coaching" ? "/communities/coaching" : `/communities/${communitySlug}/${path}`;
  return `${pathname}?updated=${Date.now().toString(36)}`;
}

function optionalUtcDate(formData:FormData,key:string):string|undefined{
 const value=String(formData.get(key)??"").trim();if(!value)return undefined;
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?Z?$/.test(value))throw new Error("Choose a valid date and time.");
 const date=new Date(value.endsWith("Z")?value:`${value}Z`);if(!Number.isFinite(date.getTime()))throw new Error("Choose a valid date and time.");return date.toISOString();
}

async function context(slug: string, formData?:FormData, verifyParticipants=true, existingCoachingOnly=false) {
  const identity = await requireTraderLinkPlatformPageIdentity();
  await requireCommunityRequestAccess({userId:identity.scope.userId,slug,verifyParticipants,existingCoachingOnly,relationshipId:String(formData?.get("relationshipId")??"")||undefined,taskId:String(formData?.get("taskId")??"")||undefined,reviewId:String(formData?.get("reviewId")??"")||undefined});
  return { identity, slug };
}

async function discordSetupResources(slug:string,identity:Awaited<ReturnType<typeof requireTraderLinkPlatformPageIdentity>>,capability:"community.roles.manage"|"community.discord.manage") {
  const guildId=withPlatformDatabase({mode:"runtime"},database=>{
    const community=database.prepare(`SELECT community_id,discord_guild_id FROM traderlink_communities WHERE slug=?`).get(slug) as {community_id:string;discord_guild_id:string}|undefined;
    if(!community)throw new Error("Community not found.");
    new TraderLinkCommunityRepository(database).requireCapability(community.community_id,identity.scope.userId,capability);
    return community.discord_guild_id;
  });
  return readCommunityDiscordResources(guildId,process.env.TRADERLINK_DISCORD_BOT_TOKEN??"");
}

export async function createCommunityAlertAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug,formData);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; const repository=new TraderLinkCommunityPlatformRepository(database); const atUtc=createCanonicalUtcTimestamp(); const selectedAudience=String(formData.get("audienceId")??"");const audienceId=selectedAudience||repository.ensureDefaultAudience({communityId:community.community_id,actorUserId:actor.userId,atUtc});const templateId=String(formData.get("templateId")??"");let symbol=String(formData.get("symbol")??"");let body=String(formData.get("body")??"");if(templateId){const fields=database.prepare(`SELECT field_key,label,field_type,required FROM traderlink_community_alert_template_fields WHERE template_id=? AND community_id=? AND EXISTS(SELECT 1 FROM traderlink_community_alert_templates t WHERE t.template_id=traderlink_community_alert_template_fields.template_id AND t.status='active' AND (t.scope='community' OR t.owner_user_id=?)) ORDER BY ordinal`).all(templateId,community.community_id,actor.userId) as {field_key:string;label:string;field_type:string;required:number}[];if(!fields.length)throw new Error("Alert template not found.");const values=fields.map(field=>{const value=String(formData.get(`template:${field.field_key}`)??"").trim();if(field.required&&!value)throw new Error(`${field.label} is required.`);if(field.field_type==="ticker"&&value)symbol=value;return value?`${field.label}: ${value}`:"";}).filter(Boolean);body=values.join("\n");}repository.createAlert({selection:readDistribution(formData),communityId:community.community_id,actor,title:required(formData,"title"),symbol,body:body.trim()||required(formData,"body"),audienceId,publish:formData.get("status")!=="draft",publishingMode:String(formData.get("publishingMode")??"tracked_page") as "tracked_page"|"discord_post",atUtc}); });
  revalidateCommunityPath(communitySlug,"alerts"); redirect(updatedCommunityUrl(communitySlug,"alerts"));
}

export async function createCommunityAlertTemplateAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData);
  const count=Math.min(20,Math.max(1,Number(formData.get("fieldCount")??1)));
  const allowedTypes=new Set(["text","number","price","ticker","date","time","choice","notes"]);
  const fields=Array.from({length:count},(_,index)=>{const label=required(formData,`fieldLabel:${index}`);const type=required(formData,`fieldType:${index}`);if(!allowedTypes.has(type))throw new Error("Unsupported alert-template field type.");return {label,type:type as "text"|"number"|"price"|"ticker"|"date"|"time"|"choice"|"notes",required:formData.get(`fieldRequired:${index}`)==="on",placeholder:String(formData.get(`fieldPlaceholder:${index}`)??"")};});
  withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).createAlertTemplate({communityId:community.community_id,actor,title:required(formData,"title"),scope:required(formData,"scope") as "personal"|"community",fields,atUtc:createCanonicalUtcTimestamp()});});
  revalidateCommunityPath(communitySlug,"alerts");redirect(updatedCommunityUrl(communitySlug,"alerts"));
}

export async function archiveCommunityAlertTemplateAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).archiveAlertTemplate({communityId:community.community_id,actor,templateId:required(formData,"templateId"),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"alerts");redirect(updatedCommunityUrl(communitySlug,"alerts"));}

export async function updateCommunityAlertAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData);
  withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateAlert({selection:readDistribution(formData),communityId:community.community_id,actor,alertId:required(formData,"alertId"),title:required(formData,"title"),symbol:String(formData.get("symbol")??""),body:required(formData,"body"),audienceId:String(formData.get("audienceId")??"")||undefined,publishingMode:formData.has("publishingMode")?String(formData.get("publishingMode")) as "tracked_page"|"discord_post":undefined,status:required(formData,"status") as "draft"|"published"|"archived",atUtc:createCanonicalUtcTimestamp()});});
  revalidateCommunityPath(communitySlug,"alerts");redirect(updatedCommunityUrl(communitySlug,"alerts"));
}

export async function createCommunityServerWatchlistAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");
  const {identity}=await context(communitySlug,formData);
  withPlatformDatabase({mode:"runtime"},database=>{
    const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
    const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};
    new TraderLinkCommunityPlatformRepository(database).createServerWatchlist({selection:readDistribution(formData),
      communityId:community.community_id,
      actor,
      title:required(formData,"title"),
      description:String(formData.get("description")??""),
      symbols:String(formData.get("symbols")??"").split(/[\s,]+/u),
      publish:formData.get("intent")!=="draft",
      publishingMode:String(formData.get("publishingMode")??"tracked_page") as "tracked_page"|"discord_post",
      atUtc:createCanonicalUtcTimestamp(),
    });
  });
  revalidateCommunityPath(communitySlug,"watchlists");
  redirect(updatedCommunityUrl(communitySlug,"watchlists"));
}

export async function updateCommunityServerWatchlistAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateServerWatchlist({selection:readDistribution(formData),communityId:community.community_id,actor,watchlistId:required(formData,"watchlistId"),title:required(formData,"title"),description:String(formData.get("description")??""),symbols:String(formData.get("symbols")??"").split(/[\s,]+/u),publishingMode:String(formData.get("publishingMode")??"tracked_page") as "tracked_page"|"discord_post",status:required(formData,"status") as "draft"|"published"|"archived",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"watchlists");redirect(updatedCommunityUrl(communitySlug,"watchlists"));}

export async function saveCommunityCoachAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug,formData);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; new TraderLinkCommunityPlatformRepository(database).upsertCoach({communityId:community.community_id,actor,userId:actor.userId,displayName:required(formData,"displayName"),headline:String(formData.get("headline")??""),biography:String(formData.get("biography")??""),deliverySummary:String(formData.get("deliverySummary")??""),capacity:Number(required(formData,"capacity")),active:true,atUtc:createCanonicalUtcTimestamp()}); });
  revalidateCommunityPath(communitySlug,"workspace/setup"); redirect(updatedCommunityUrl(communitySlug,"workspace/setup"));
}

export async function saveCoachingPlanWithFeedbackAction(_previous:{error:string},formData:FormData):Promise<{error:string}>{
  try {
    await createCommunityCoachingPlanAction(formData);
    return {error:""};
  } catch(error) {
    unstable_rethrow(error);
    if(error instanceof TraderLinkPlatformError&&error.safeContext.field==="planRevision")return {error:"This plan changed in another window. Your entries are still here. Copy any changes you want to keep, then reload the plan before saving again."};
    return {error:"We couldn't save this plan. Your entries are still here. Check your settings and access, then try again. If the connection was interrupted, reload to check whether the plan was saved before creating another."};
  }
}

export async function createCommunityCoachingPlanAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug,formData);
  const itemTypes=["trade_review","trading_day_review","performance_review","strategy_review","student_check_in","review_follow_up","private_session","group_lesson","questions","custom_task"] as const;
  const selected=itemTypes.filter(type=>formData.get(`item:${type}`)==="on");
  const price=String(formData.get("price")??"").trim();
  const quoteRequired=formData.get("quoteRequired")==="on";
  const priceAmountMinor=price?Math.round(Number(price)*100):undefined;
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; const repository=new TraderLinkCommunityPlatformRepository(database); const atUtc=createCanonicalUtcTimestamp(); const audienceId=repository.ensureDefaultAudience({communityId:community.community_id,actorUserId:actor.userId,atUtc}); repository.createPlan({saveExisting:formData.get("intent")==="save",planId:String(formData.get("planId")??"")||undefined,expectedRevision:Number(formData.get("expectedRevision")??1),builderConfig:JSON.parse(String(formData.get("builderConfig")??"{}")),communityId:community.community_id,actor,coachProfileId:required(formData,"coachProfileId"),name:required(formData,"name"),description:String(formData.get("description")??""),cadence:"custom",studentCapacity:Number(formData.get("studentCapacity")??10),messagingIncluded:selected.includes("questions")||selected.includes("review_follow_up"),tradeReviewsIncluded:selected.includes("trade_review")||selected.includes("trading_day_review")||selected.includes("performance_review"),sessionsIncluded:selected.includes("private_session"),teachingIncluded:selected.includes("group_lesson"),priceLabel:quoteRequired?"Quote required":price?`$${price}`:"",priceAmountMinor,currency:String(formData.get("currency")??"USD"),billingCadence:required(formData,"billingCadence") as "weekly"|"monthly"|"one_time"|"custom",quoteRequired,paymentInstructions:String(formData.get("paymentInstructions")??""),audienceId,requiredDiscordRoleId:String(formData.get("requiredDiscordRoleId")??"")||undefined,planStyle:String(formData.get("planStyle")??"structured") as "structured"|"custom",autoArchiveAfterDays:formData.get("autoArchiveAfterDays")?Number(formData.get("autoArchiveAfterDays")):undefined,items:selected.map(type=>({focusAreas:parseCoachingFocus(formData.getAll(`focus:${type}`)),itemType:type,frequency:String(formData.get(`frequency:${type}`)??"weekly") as "weekly"|"every_two_weeks"|"monthly"|"once"|"custom",coveragePeriod:String(formData.get(`coverage:${type}`)??"previous_7_days") as "single_item"|"previous_7_days"|"since_last_review"|"calendar_week"|"previous_month"|"custom",quantity:Math.max(1,Number(formData.get(`quantity:${type}`)??1)),dueOffsetDays:Math.max(0,Number(formData.get(`due:${type}`)??2)),selectionMode:String(formData.get(`selection:${type}`)??"not_applicable") as "not_applicable"|"coach"|"student"|"coach_or_student",followUpDays:Math.max(0,Number(formData.get(`followUp:${type}`)??0)),measurementKind:String(formData.get(`measurement:${type}`)??"reviews") as "trades"|"trading_days"|"reviews"|"check_ins"|"sessions"|"lessons"|"questions"|"custom",plannedMinutes:formData.get(`minutes:${type}`)?Math.max(1,Number(formData.get(`minutes:${type}`))):null,timelineEnabled:formData.get(`timeline:${type}`)==="on",reviewDepth:String(formData.get(`depth:${type}`)??"standard") as "standard"|"trades_only"|"complete_day"})),journalScopes:formData.getAll("journalScope").filter((value):value is string=>typeof value==="string").map(dataScope=>({dataScope:dataScope as "trades"|"trade_notes"|"rules"|"tags"|"analytics"|"open_positions"|"journal_notes",required:true})),publish:formData.get("intent")==="publish",atUtc}); });
  revalidateCommunityPath(communitySlug,"workspace/setup/plans"); revalidateCommunityPath(communitySlug,"workspace/plans"); redirect(updatedCommunityUrl(communitySlug,"workspace/plans"));
}

export async function updateCommunityCoachingPlanStatusAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updatePlanStatus({communityId:community.community_id,actor,planId:required(formData,"planId"),status:required(formData,"status") as "active"|"paused"|"archived",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"workspace");revalidateCommunityPath(communitySlug,"workspace/setup/plans");revalidateCommunityPath(communitySlug,"workspace/plans");redirect(updatedCommunityUrl(communitySlug,"workspace/plans"));}

export async function setCommunityMemberStatusAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).setMemberStatus({communityId:community.community_id,actor,userId:required(formData,"userId"),status:required(formData,"status") as "active"|"suspended",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"manage/members");redirect(updatedCommunityUrl(communitySlug,"manage/members"));}

export async function requestCommunityCoachingAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug,formData);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; new TraderLinkCommunityPlatformRepository(database).requestCoaching({communityId:community.community_id,actor,planId:required(formData,"planId"),atUtc:createCanonicalUtcTimestamp()}); });
  revalidateCommunityPath(communitySlug,"coaching"); redirect(updatedCommunityUrl(communitySlug,"coaching"));
}

export async function saveCommunityDiscordRoleFeaturesAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");
  const {identity}=await context(communitySlug,formData);
  const resources=await discordSetupResources(communitySlug,identity,"community.roles.manage");
  const role=resources.roles.find(item=>item.id===required(formData,"discordRoleId"));
  if(!role)throw new Error("Choose an existing role in this Discord server.");
  const responsibilities=formData.getAll("responsibilities")
    .filter((item):item is string=>typeof item==="string")
    .filter((item):item is TraderLinkCommunityFixedResponsibility=>item in TRADERLINK_COMMUNITY_FIXED_RESPONSIBILITIES);
  withPlatformDatabase({mode:"runtime"},database=>{
    const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
    const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};
    new TraderLinkCommunityRepository(database).saveDiscordFeatureMapping({
      communityId:community.community_id,
      actorUserId:actor.userId,
      discordRoleId:required(formData,"discordRoleId"),
      discordRoleName:role.name,
      responsibilities,
      timestamp:createCanonicalUtcTimestamp(),
    });
  });
  revalidateCommunityPath(communitySlug,"manage/team");
  redirect(updatedCommunityUrl(communitySlug,"manage/team"));
}

export async function pauseCommunityDiscordRoleFeaturesAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");
  const {identity}=await context(communitySlug,formData);
  withPlatformDatabase({mode:"runtime"},database=>{
    const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
    const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}|undefined;
    if(!community)throw new Error("Community not found.");
    new TraderLinkCommunityRepository(database).pauseDiscordFeatureMapping({communityId:community.community_id,actorUserId:actor.userId,discordRoleId:required(formData,"discordRoleId"),timestamp:createCanonicalUtcTimestamp()});
  });
  revalidateCommunityPath(communitySlug,"manage/team");
  redirect(updatedCommunityUrl(communitySlug,"manage/team"));
}

export async function saveCommunityDiscordDestinationAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData);const resources=await discordSetupResources(communitySlug,identity,"community.discord.manage");const channel=resources.channels.find(item=>item.id===required(formData,"discordChannelId"));if(!channel?.canPublish)throw new Error("Choose a channel in this server that the bot can post to.");withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).saveDiscordDestination({communityId:community.community_id,actor,name:channel.name,discordChannelId:channel.id,contentType:required(formData,"contentType") as "alerts"|"watchlists"|"coaching"|"general",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"manage/channels");redirect(updatedCommunityUrl(communitySlug,"manage/channels"));}

export async function saveCommunitySettingsAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateSettings({communityId:community.community_id,actor,displayName:required(formData,"displayName"),description:String(formData.get("description")??""),retentionDays:90,visibilityStatus:"not_configured",visibilityCopy:"",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"manage/settings");redirect(updatedCommunityUrl(communitySlug,"manage/settings"));}

export async function saveCommunityAlertTemplatePolicyAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).setPersonalAlertTemplatesEnabled({communityId:community.community_id,actor,enabled:formData.get("enabled")==="on",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"manage/settings");redirect(updatedCommunityUrl(communitySlug,"manage/settings"));}

export async function sendCommunityCoachingMessageAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).sendCoachingMessage({communityId:community.community_id,actor,relationshipId,body:required(formData,"body"),atUtc:createCanonicalUtcTimestamp()});});revalidatePath("/communities/coaching");revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);}

export async function requestCommunityTradeReviewAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).requestTradeReview({communityId:community.community_id,actor,relationshipId:required(formData,"relationshipId"),title:required(formData,"title"),studentContext:String(formData.get("studentContext")??""),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"coaching");redirect(updatedCommunityUrl(communitySlug,"coaching"));}

export async function updateCommunityTradeReviewAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const reviewId=required(formData,"reviewId");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateTradeReview({communityId:community.community_id,actor,reviewId,coachFeedback:String(formData.get("coachFeedback")??""),wentWell:String(formData.get("wentWell")??""),needsWork:String(formData.get("needsWork")??""),nextFocus:String(formData.get("nextFocus")??""),coachPrivateNotes:String(formData.get("coachPrivateNotes")??""),previousFocusStatus:(String(formData.get("previousFocusStatus")??"")||null) as "not_evaluated"|"improving"|"still_struggling"|"achieved"|"replaced"|null,previousFocusAssessment:String(formData.get("previousFocusAssessment")??""),status:"in_review",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}/reviews/${reviewId}`);if(formData.get("stayInReview")==="yes")return;redirect(updatedCommunityUrl(communitySlug,`workspace/students/${relationshipId}/reviews/${reviewId}`));}

export async function saveStudentJournalSharingAction(_previous:{error:string;saved:boolean},formData:FormData):Promise<{error:string;saved:boolean}>{
 try{
  const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");
  const {identity}=await context(communitySlug,formData,true,true);const accountId=identity.scope.activeAccountId;
  if(!accountId||accountId!==formData.get("journalAccountId"))return {error:"Your selected Journal account changed. Reload sharing before saving.",saved:false};
  const options=formData.getAll("sharingOption");const allowed=["summary","trades","analytics","trade_notes","rules","tags","journal_notes","day_rules"];
  if(options.some(value=>typeof value!=="string"||!allowed.includes(value)))return {error:"Choose supported sharing options.",saved:false};
  const selected=options as string[];const fields=selected.filter(value=>!["summary","trades","analytics"].includes(value));
  if(fields.length&&!selected.includes("trades"))return {error:"Select Trades to share notes, rules or tags.",saved:false};
  withPlatformDatabase({mode:"runtime"},database=>database.transaction(()=>{
   const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
   const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};
   const relationship=database.prepare(`SELECT 1 FROM traderlink_community_coaching_relationships WHERE relationship_id=? AND community_id=? AND student_user_id=? AND status='active'`).get(relationshipId,community.community_id,actor.userId);
   if(!relationship)throw new Error("Sharing unavailable");
   const atUtc=createCanonicalUtcTimestamp();const repository=new TraderLinkCommunityPlatformRepository(database);
   database.prepare(`UPDATE traderlink_community_journal_grants SET status='revoked',revoked_at_utc=? WHERE relationship_id=? AND community_id=? AND student_user_id=? AND journal_account_id=? AND status='active'`).run(atUtc,relationshipId,community.community_id,actor.userId,accountId);
   for(const scope of ["summary","trades","analytics"] as const)if(selected.includes(scope))repository.grantJournal({communityId:community.community_id,actor,relationshipId,journalAccountId:accountId,dataScope:scope,sharedFields:scope==="trades"?fields:[],atUtc});
  })());
  revalidateCommunityPath(communitySlug,"coaching");return {error:"",saved:true};
 }catch(error){unstable_rethrow(error);return {error:"Could not save sharing. Your selections are still here; try again.",saved:false};}
}

export async function grantCoachJournalAccessAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData,true,true);if(!identity.scope.activeAccountId)throw new Error("Select a Journal account before sharing.");const dataScope=required(formData,"dataScope");if(!["summary","trades","analytics"].includes(dataScope))throw new Error("Choose a supported Journal sharing scope.");withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).grantJournal({communityId:community.community_id,actor,relationshipId:required(formData,"relationshipId"),journalAccountId:identity.scope.activeAccountId as string,dataScope:dataScope as "summary"|"trades"|"analytics",sharedFields:formData.getAll("sharedField").filter((value):value is string=>typeof value==="string"),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"coaching");redirect(updatedCommunityUrl(communitySlug,"coaching"));}

export async function revokeCoachJournalAccessAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const identity=await requireTraderLinkPlatformPageIdentity();withPlatformDatabase({mode:"runtime"},database=>new TraderLinkCommunityPlatformRepository(database).revokeJournal({actorUserId:identity.scope.userId,grantId:required(formData,"grantId"),atUtc:createCanonicalUtcTimestamp()}));revalidateCommunityPath(communitySlug,"coaching");redirect(updatedCommunityUrl(communitySlug,"coaching"));}

export async function setCoachingRelationshipStatusAction(formData:FormData):Promise<void>{const identity=await requireTraderLinkPlatformPageIdentity();const relationshipId=required(formData,"relationshipId");await requireCommunityRequestAccess({userId:identity.scope.userId,relationshipId,verifyParticipants:false,existingCoachingOnly:true});const communitySlug=withPlatformDatabase({mode:"runtime"},database=>{const community=database.prepare(`SELECT c.community_id,c.slug FROM traderlink_community_coaching_relationships r JOIN traderlink_communities c ON c.community_id=r.community_id WHERE r.relationship_id=?`).get(relationshipId) as {community_id:string;slug:string}|undefined;if(!community)throw new Error("Coaching relationship not found.");const actor=resolveTraderLinkCommunityViewer(database,identity,community.slug);new TraderLinkCommunityPlatformRepository(database).setRelationshipStatus({communityId:community.community_id,actor,relationshipId,status:required(formData,"status") as "active"|"declined"|"ended",atUtc:createCanonicalUtcTimestamp()});return community.slug;});revalidateCommunityPath(communitySlug,"workspace");redirect(updatedCommunityUrl(communitySlug,"workspace"));}

export async function setStudentCoachingServicesAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).setStudentServices({communityId:community.community_id,actor,relationshipId,messagingEnabled:formData.get("messagingEnabled")==="on",tradeReviewsEnabled:formData.get("tradeReviewsEnabled")==="on",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);redirect(updatedCommunityUrl(communitySlug,`workspace/students/${relationshipId}`));}

export async function createCommunityCoachingTaskAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};const rawDue=String(formData.get("dueAt")??"").trim();new TraderLinkCommunityPlatformRepository(database).createCoachingTask({communityId:community.community_id,actor,relationshipId,title:required(formData,"title"),dueAtUtc:rawDue?new Date(rawDue).toISOString():undefined,priority:(formData.get("priority")==="high"?"high":"normal"),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);redirect(updatedCommunityUrl(communitySlug,`workspace/students/${relationshipId}`));}

export async function updateCommunityCoachingTaskAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateCoachingTaskStatus({communityId:community.community_id,actor,taskId:required(formData,"taskId"),status:required(formData,"status") as "open"|"completed"|"cancelled",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);redirect(updatedCommunityUrl(communitySlug,`workspace/students/${relationshipId}`));}

export async function createCommunityCoachingRecordAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};const atUtc=createCanonicalUtcTimestamp();new TraderLinkCommunityPlatformRepository(database).createCoachingRecord({communityId:community.community_id,actor,relationshipId,recordType:formData.get("recordType")==="note"?"note":"session",visibility:formData.get("visibility")==="coach_private"?"coach_private":"shared",title:required(formData,"title"),body:String(formData.get("body")??""),occurredAtUtc:atUtc,atUtc});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);redirect(updatedCommunityUrl(communitySlug,`workspace/students/${relationshipId}`));}

export async function createCommunityExpandedReviewAction(formData:FormData):Promise<void>{if(formData.get("workspaceKind")==="custom")throw new Error("Choose Trade, Trading day or Performance as the review type.");const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityCoachingProgramService(database).createReview({communityId:community.community_id,actor,relationshipId,requestedDays:formData.getAll("requestedDay").filter((value):value is string=>typeof value==="string"),planItemId:String(formData.get("planItemId")??"")||undefined,workspaceKind:isCoachingReviewKind(formData.get("workspaceKind"))?formData.get("workspaceKind") as import("@/src/modules/communities/contracts/coaching-review-workspace").CoachingReviewKind:undefined,focusAreas:parseCoachingFocus(formData.getAll("focusArea")),reviewType:required(formData,"reviewType") as "single_trade"|"multiple_trades"|"weekly"|"monthly"|"general"|"session"|"custom",title:required(formData,"title"),context:String(formData.get("context")??""),periodStart:String(formData.get("periodStart")??"")||undefined,periodEnd:String(formData.get("periodEnd")??"")||undefined,dueAtUtc:optionalUtcDate(formData,"dueAt"),roundTripIds:formData.getAll("roundTripId").filter((value):value is string=>typeof value==="string"),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);redirect(updatedCommunityUrl(communitySlug,formData.get("returnTo")==="student"?"coaching":`workspace/students/${relationshipId}`));}

async function reviewWorkflow(formData:FormData,run:(service:TraderLinkCommunityCoachingProgramService,input:{communityId:string;actor:ReturnType<typeof resolveTraderLinkCommunityViewer>;communitySlug:string;relationshipId:string;reviewId:string;atUtc:string})=>void){const communitySlug=required(formData,"communitySlug"),relationshipId=required(formData,"relationshipId"),reviewId=required(formData,"reviewId");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};run(new TraderLinkCommunityCoachingProgramService(database),{communityId:community.community_id,actor,communitySlug,relationshipId,reviewId,atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}/reviews/${reviewId}`);revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}/reviews/${reviewId}/final`);revalidateCommunityPath(communitySlug,"workspace");revalidateCommunityPath(communitySlug,"coaching");revalidatePath("/communities/coaching");}

export async function proposeCommunityReviewCapAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.proposeReviewTradeCap({...input,basis:required(formData,'capBasis'),quantity:Number(required(formData,'capQuantity'))}));}
export async function acceptCommunityReviewCapAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.acceptReviewTradeCap({...input,proposalId:required(formData,'proposalId'),confirmed:formData.get('confirmCap')==='yes'}));}

export async function startCommunityReviewAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.startReview(input));}
export async function acceptCommunityReviewRequestAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.acceptReviewRequest({...input,scope:required(formData,"scope"),schedule:required(formData,"schedule") as "scheduled"|"unscheduled",dueAtUtc:optionalUtcDate(formData,"dueAt")}));}
export async function setCommunityReviewDueDateAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.setReviewDueDate({...input,dueAtUtc:optionalUtcDate(formData,"dueAt")}));}
export async function loadStudentReviewTradesAction(formData:FormData){
 const communitySlug=required(formData,"communitySlug"),relationshipId=required(formData,"relationshipId"),reviewId=String(formData.get('reviewId')??'');const {identity}=await context(communitySlug,formData,true,true);
 const {TraderLinkCommunityCoachJournalReadService}=await import("@/src/modules/communities/server/traderlink-community-coach-journal-read-service");
 return withPlatformDatabase({mode:"runtime"},database=>{
  const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
  const relationship=database.prepare(`SELECT r.community_id,r.coach_user_id,r.student_trade_reviews_enabled FROM traderlink_community_coaching_relationships r JOIN traderlink_communities c ON c.community_id=r.community_id WHERE r.relationship_id=? AND c.slug=? AND r.student_user_id=? AND r.status='active'`).get(relationshipId,communitySlug,actor.userId) as {community_id:string;coach_user_id:string;student_trade_reviews_enabled:number}|undefined;
  if(!relationship)throw new Error("Coaching access is unavailable.");
  const reader=new TraderLinkCommunityCoachJournalReadService(database);
  if(!reviewId){if(relationship.student_trade_reviews_enabled!==1)throw new Error('Student requests are unavailable.');
   const agreement=database.prepare(`SELECT agreement_id,terms_json FROM traderlink_community_coaching_agreements WHERE relationship_id=? AND status='accepted' ORDER BY revision DESC LIMIT 1`).get(relationshipId) as {agreement_id:string;terms_json:string}|undefined;
   const terms=agreement?JSON.parse(agreement.terms_json) as import('@/src/modules/communities/contracts/coaching-agreements').CoachingAgreementTerms:null;
   const item=terms?.items.find(item=>item.planItemId===required(formData,'planItemId'));
   if(!agreement||!terms||item?.itemType!=='trade_review'||!['student','coach_or_student'].includes(item.selectionMode))throw new Error('Choose an accepted student-selectable Trade service.');
   const periodStart=String(formData.get('periodStart')??'')||undefined,periodEnd=String(formData.get('periodEnd')??'')||undefined;
   requireCoachingTradePeriod(database,{relationshipId,agreementId:agreement.agreement_id,terms,item,start:periodStart,end:periodEnd});
   const unavailable=coachingStudentUnavailableTrades(database,{communityId:relationship.community_id,coachUserId:relationship.coach_user_id,studentUserId:actor.userId});
   return coachingDistinctReviewTrades(database,reader.read({coachUserId:relationship.coach_user_id,relationshipId,periodStart,periodEnd}).trades.filter(trade=>!unavailable.has(trade.roundTripId)));
  }
  const review=database.prepare(`SELECT period_start,period_end,workspace_kind FROM traderlink_community_coaching_trade_reviews WHERE review_id=? AND relationship_id=? AND delivery_state='draft'`).get(reviewId,relationshipId) as {period_start:string|null;period_end:string|null;workspace_kind:string}|undefined;
  if(!review||!coachingReviewSelectionPolicy(database,reviewId).studentCanSelect)throw new Error('Student trade selection is unavailable.');
  const bound=coachingReviewService(database,reviewId);if(bound?.item.itemType==='trade_review'&&bound.item.coveragePeriod!=='single_item'&&(!review.period_start||!review.period_end))throw new Error('The coach must confirm this earlier draft period first.');
  if(review.workspace_kind==='trading_day'&&(!review.period_start||!review.period_end))throw new Error('Choose the review date range first.');
  const selected=(database.prepare(`SELECT round_trip_id FROM traderlink_community_coaching_review_trades WHERE review_id=? AND workflow_state!='removed'`).all(reviewId) as {round_trip_id:string}[]).map(row=>row.round_trip_id);
  const unavailable=coachingUnavailableReviewTrades(database,reviewId);
  const shared=reader.read({coachUserId:relationship.coach_user_id,relationshipId,periodStart:review.period_start??undefined,periodEnd:review.period_end??undefined});
  const days=coachingReviewRequestedDays(database,reviewId);
  return coachingDistinctReviewTrades(database,shared.trades.filter(trade=>!unavailable.has(trade.roundTripId)&&(!days.length||(trade.tradingDate&&days.includes(trade.tradingDate)))),selected);
 });
}

export async function loadStudentReviewDaysAction(formData:FormData){
 const communitySlug=required(formData,'communitySlug'),relationshipId=required(formData,'relationshipId'),reviewId=String(formData.get('reviewId')??'');
 const {identity}=await context(communitySlug,formData,true,true);
 return withPlatformDatabase({mode:'runtime'},database=>{
  const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
  const relationship=database.prepare(`SELECT r.community_id,r.coach_user_id,r.student_trade_reviews_enabled FROM traderlink_community_coaching_relationships r JOIN traderlink_communities c ON c.community_id=r.community_id WHERE r.relationship_id=? AND c.slug=? AND r.student_user_id=? AND r.status='active'`).get(relationshipId,communitySlug,actor.userId) as {community_id:string;coach_user_id:string;student_trade_reviews_enabled:number}|undefined;
  if(!relationship)throw new Error('Student requests are unavailable.');
  let periodStart:string,periodEnd:string;
  if(reviewId){
   const review=database.prepare(`SELECT period_start,period_end,workspace_kind FROM traderlink_community_coaching_trade_reviews WHERE review_id=? AND relationship_id=? AND delivery_state='draft'`).get(reviewId,relationshipId) as {period_start:string;period_end:string;workspace_kind:string}|undefined;
   if(!review||review.workspace_kind!=='trading_day'||!coachingReviewSelectionPolicy(database,reviewId).studentCanSelect)throw new Error('Student day selection is unavailable.');
   periodStart=review.period_start;periodEnd=review.period_end;
  }else{
   if(relationship.student_trade_reviews_enabled!==1)throw new Error('Student requests are unavailable.');
   periodStart=required(formData,'periodStart');periodEnd=required(formData,'periodEnd');
  }
  const choices=coachingReviewDayChoices(database,{coachUserId:relationship.coach_user_id,relationshipId,periodStart,periodEnd});
  const unavailable=reviewId?coachingUnavailableReviewTrades(database,reviewId):coachingStudentUnavailableTrades(database,{communityId:relationship.community_id,coachUserId:relationship.coach_user_id,studentUserId:actor.userId});
  return {days:choices.days,trades:coachingDistinctReviewTrades(database,choices.trades.filter(trade=>!unavailable.has(trade.roundTripId)))};
 });
}
export async function shareCommunityReviewGoalsAction(formData:FormData):Promise<void>{
 const goals=JSON.parse(required(formData,'goals')) as import('@/src/modules/communities/contracts/coaching-shared-goals').CoachingSharedGoal[];
 await reviewWorkflow(formData,(service,input)=>service.shareReviewGoals({...input,confirmed:formData.get('confirmGoals')==='yes',goals}));
}

export async function setCommunityTradeReviewPeriodAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.setTradeReviewPeriod({...input,periodStart:required(formData,'periodStart'),periodEnd:required(formData,'periodEnd')}));}

export async function setCommunitySelectedDayPeriodAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.setSelectedDayPeriod({...input,periodStart:required(formData,'periodStart'),periodEnd:required(formData,'periodEnd')}));}

export async function addCommunityStudentReviewDaysAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.addStudentReviewDays({...input,days:formData.getAll('requestedDay').filter((value):value is string=>typeof value==='string')}));}

export async function selectCommunityReviewTradesAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.selectTrades({...input,roundTripIds:formData.getAll("roundTripId").filter((value):value is string=>typeof value==="string")}));}
export async function removeCommunityReviewTradesAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.removeTrades({...input,roundTripIds:formData.getAll("roundTripId").filter((value):value is string=>typeof value==="string")}));}
export async function saveCommunityReviewTradeAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.saveTradeReview({...input,roundTripId:required(formData,"roundTripId"),feedback:required(formData,"feedback")}));}
export async function addCommunityReviewActionItemAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>{service.addReviewAction({...input,title:required(formData,"title"),details:String(formData.get("details")??""),dueAtUtc:optionalUtcDate(formData,"dueAt")});});}
export async function deliverCommunityReviewAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.deliverReview(input));}
export async function markCommunityReviewViewedAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.markReviewViewed(input));}
export async function updateCommunityReviewActionItemAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.updateReviewAction({...input,actionId:required(formData,"actionId"),state:required(formData,"state") as "open"|"completed"|"removed"}));}
export async function setCommunityReviewLifecycleAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>{service.setReviewLifecycle({...input,state:required(formData,"state") as "follow_up"|"completed"|"cancelled",followUpDueAtUtc:optionalUtcDate(formData,"followUpDueAt")});});}

export async function replyCommunityReviewAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.replyToReview({...input,body:required(formData,"body")}));}

export async function createCommunityCoachingSessionAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityCoachingProgramService(database).createSession({communityId:community.community_id,actor,relationshipId,title:required(formData,"title"),agenda:String(formData.get("agenda")??""),scheduledAtUtc:optionalUtcDate(formData,"scheduledAt"),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);redirect(updatedCommunityUrl(communitySlug,`workspace/students/${relationshipId}`));}

export async function completeCommunityCoachingSessionAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityCoachingProgramService(database).completeSession({communityId:community.community_id,actor,relationshipId,sessionId:required(formData,"sessionId"),notes:String(formData.get("notes")??""),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);redirect(updatedCommunityUrl(communitySlug,`workspace/students/${relationshipId}`));}

export async function createCoachingTeachingWithFeedbackAction(_previous:{error:string},formData:FormData):Promise<{error:string}>{
  try {
    await createCommunityTeachingAction(formData);
    return {error:""};
  } catch(error) {
    unstable_rethrow(error);
    return {error:"We couldn't save this lesson. Your entries are still here. Check the audience, dates and links. If the connection was interrupted, check the lesson list before submitting again."};
  }
}

export async function createCommunityTeachingAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityCoachingProgramService(database).createTeaching({sourceTeachingId:String(formData.get("sourceTeachingId")??"")||undefined,communityId:community.community_id,actor,title:required(formData,"title"),teachingType:required(formData,"teachingType") as "lesson"|"class"|"assignment",body:String(formData.get("body")??""),deliveryUrl:String(formData.get("deliveryUrl")??""),scheduledAtUtc:optionalUtcDate(formData,"scheduledAt"),audienceMode:required(formData,"audienceMode") as "all_students"|"plan"|"selected_students",planId:String(formData.get("planId")??"")||undefined,relationshipIds:formData.getAll("relationshipId").filter((value):value is string=>typeof value==="string"),publish:formData.get("publish")==="on",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"workspace/teaching");redirect(updatedCommunityUrl(communitySlug,"workspace/teaching"));}

export async function updateCommunityTeachingStudentAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug,formData,true,true);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityCoachingProgramService(database).updateTeachingStudent({communityId:community.community_id,actor,relationshipId,teachingId:required(formData,"teachingId"),status:required(formData,"status") as "attending"|"completed"|"excused",atUtc:createCanonicalUtcTimestamp()});});const destination=formData.get("returnTo")==="teaching"?"workspace/teaching":"coaching";revalidateCommunityPath(communitySlug,destination);redirect(updatedCommunityUrl(communitySlug,destination));}

export async function uploadCommunityCoachingImageAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const image=formData.get("image");if([...formData.values()].filter(value=>value instanceof File).length!==1)throw new Error("Select one image at a time.");if(!(image instanceof File)||image.size<1)throw new Error("Select an image.");if(image.size>8388608)throw new Error("Images must be 8 MB or smaller.");if(!["image/png","image/jpeg","image/webp"].includes(image.type))throw new Error("Use a PNG, JPEG, or WebP image.");const {identity}=await context(communitySlug,formData,true,true);const content=Buffer.from(await image.arrayBuffer());withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityCoachingProgramService(database).addImage({communityId:community.community_id,actor,relationshipId,targetType:required(formData,"targetType") as "message"|"review"|"session"|"teaching"|"submission",targetId:required(formData,"targetId"),reviewId:String(formData.get("reviewId")??"")||undefined,roundTripId:String(formData.get("roundTripId")??"")||undefined,filename:image.name,mediaType:image.type as "image/png"|"image/jpeg"|"image/webp",content,atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}/reviews/${String(formData.get("reviewId")??"")}`);revalidatePath("/communities/coaching");const reviewId=String(formData.get("reviewId")??"");if(reviewId&&formData.get("stayInReview")==="yes")return;redirect(updatedCommunityUrl(communitySlug,formData.get("returnTo")==="student"?"coaching":reviewId?`workspace/students/${relationshipId}/reviews/${reviewId}`:`workspace/students/${relationshipId}`));}

export async function setCommunityReviewWorkspaceAction(_formData:FormData):Promise<void>{
 throw new Error("Review type and focus are fixed for this review. Review layout editing is unavailable.");
}
export async function saveCommunityReviewFocusAction(formData:FormData):Promise<void>{
 const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const reviewId=required(formData,"reviewId");const {identity}=await context(communitySlug,formData,true,true);
 const feedback:CoachingFocusFeedback={};for(const key of Object.keys(COACHING_REVIEW_FOCUS) as (keyof CoachingFocusFeedback)[])if(formData.has(`focusFeedback:${key}`))feedback[key]=String(formData.get(`focusFeedback:${key}`)??"");
 withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare("SELECT community_id FROM traderlink_communities WHERE slug=?").get(communitySlug) as {community_id:string};new TraderLinkCommunityCoachingProgramService(database).saveFocusFeedback({communityId:community.community_id,actor,relationshipId,reviewId,feedback,atUtc:createCanonicalUtcTimestamp()});});
 revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}/reviews/${reviewId}`);
}

export async function saveCommunityDayAssessmentAction(formData:FormData):Promise<void>{
 const focusFeedback:CoachingFocusFeedback={};for(const key of Object.keys(COACHING_REVIEW_FOCUS) as (keyof CoachingFocusFeedback)[])if(formData.has(`focus:${key}`))focusFeedback[key]=String(formData.get(`focus:${key}`)??'');
 await reviewWorkflow(formData,(service,input)=>service.saveDayAssessment({...input,date:required(formData,'date'),assessment:required(formData,'assessment'),focusFeedback}));
}

export async function bindCommunityReviewServiceAction(formData:FormData):Promise<void>{
 const [agreementId,planItemId]=required(formData,'serviceBinding').split(':');
 await reviewWorkflow(formData,(service,input)=>service.bindReviewService({...input,agreementId,planItemId}));
}

export async function removeCommunityDayAssessmentAction(formData:FormData):Promise<void>{await reviewWorkflow(formData,(service,input)=>service.removeDayAssessment({...input,date:required(formData,'date')}));}
