import type Database from "better-sqlite3";
import {assertCanonicalUtcTimestamp,assertCanonicalUuidV4,createCanonicalUuidV4,platformFailure} from "../../platform/server/database/platform-migration-contract";
import {TraderLinkCommunityRepository} from "./traderlink-community-repository";
import {TraderLinkCommunityCoachingProgramService} from "./traderlink-community-coaching-program-service";
import {coachingDate,coachingPeriod,coachingReviewCoverage,type CoachingAgreement,type CoachingAgreementTerms} from "../contracts/coaching-agreements";
import {parseCoachingPlanConfiguration} from "../contracts/coaching-plan-configuration";
import type {TraderLinkCommunityCoachingPlanItem} from "../contracts/traderlink-community-platform-contracts";
import {reviewKindForPlanItem} from "../contracts/coaching-review-workspace";
import {coachingEntitlement} from "./coaching-access-lifecycle";

type Actor={userId:string;displayName:string;discordRoleIds:readonly string[]};
type Relation={relationship_id:string;community_id:string;coach_user_id:string;student_user_id:string;plan_id:string;status:string};
type PlanRow={plan_id:string;revision:number;name:string;description:string;price_amount_minor:number|null;currency:string;billing_cadence:string;payment_instructions:string;required_discord_role_id:string|null;auto_archive_after_days:number|null;builder_config_json:string};
type ItemRow={plan_item_id:string;item_type:TraderLinkCommunityCoachingPlanItem["itemType"];frequency:TraderLinkCommunityCoachingPlanItem["frequency"];coverage_period:TraderLinkCommunityCoachingPlanItem["coveragePeriod"];quantity:number;due_offset_days:number;selection_mode:TraderLinkCommunityCoachingPlanItem["selectionMode"];follow_up_days:number;measurement_kind:TraderLinkCommunityCoachingPlanItem["measurementKind"];planned_minutes:number|null;timeline_enabled:number;review_depth:TraderLinkCommunityCoachingPlanItem["reviewDepth"];ordinal:number;focus_areas_json:string};
const labels:Record<TraderLinkCommunityCoachingPlanItem["itemType"],string>={trade_review:"Trade review",trading_day_review:"Trading-day review",performance_review:"Performance review",journal_review:"Journal review",rules_review:"Rules review",strategy_review:"Strategy review",risk_review:"Risk review",goal_review:"Goals review",student_check_in:"Check-in",review_follow_up:"Review follow-up",private_session:"One-to-one session",group_lesson:"Lesson",questions:"Student questions",custom_task:"Custom coaching"};

export class CoachingAgreementService{
 constructor(private readonly db:Database.Database){}
 private relation(communityId:string,relationshipId:string,actor:Actor){
  assertCanonicalUuidV4(relationshipId,"relationshipId");
  const row=this.db.prepare(`SELECT relationship_id,community_id,coach_user_id,student_user_id,plan_id,status FROM traderlink_community_coaching_relationships WHERE community_id=? AND relationship_id=?`).get(communityId,relationshipId) as Relation|undefined;
  if(!row||!["active","pending"].includes(row.status)||![row.coach_user_id,row.student_user_id].includes(actor.userId))platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED",{operation:"coaching_agreement"});
  if(row.coach_user_id===actor.userId)new TraderLinkCommunityRepository(this.db).requireCapability(communityId,actor.userId,"community.coaching.students");
  return row;
 }
 private notice(relation:Relation,userId:string,kind:"agreement_proposed"|"agreement_accepted",body:string,atUtc:string){
  this.db.prepare(`INSERT INTO traderlink_community_coaching_notices(notice_id,community_id,relationship_id,user_id,kind,body,created_at_utc) VALUES(?,?,?,?,?,?,?)`).run(createCanonicalUuidV4(),relation.community_id,relation.relationship_id,userId,kind,body,atUtc);
 }
 propose(input:{communityId:string;relationshipId:string;actor:Actor;startDate?:string;dueTimeUtc:string;customIntervalDays?:number;priceAmountMinor?:number;quantities?:Readonly<Record<string,number>>;coverageDays?:Readonly<Record<string,number>>;atUtc:string}){
  const relation=this.relation(input.communityId,input.relationshipId,input.actor);
  if(relation.coach_user_id!==input.actor.userId)platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED",{operation:"propose_coaching_agreement"});
  assertCanonicalUtcTimestamp(input.atUtc,"atUtc");
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.dueTimeUtc))throw new Error("Choose a valid deadline time.");
  if(input.startDate)coachingDate(input.startDate);
  const plan=this.db.prepare(`SELECT * FROM traderlink_community_coaching_plans WHERE community_id=? AND plan_id=?`).get(input.communityId,relation.plan_id) as PlanRow;
  const rows=this.db.prepare(`SELECT * FROM traderlink_community_coaching_plan_items WHERE plan_id=? ORDER BY ordinal`).all(relation.plan_id) as ItemRow[];
  const items:TraderLinkCommunityCoachingPlanItem[]=rows.map(row=>({planItemId:row.plan_item_id,itemType:row.item_type,frequency:row.frequency,coveragePeriod:row.coverage_period,quantity:input.quantities?.[row.plan_item_id]??row.quantity,dueOffsetDays:row.due_offset_days,selectionMode:row.selection_mode,followUpDays:row.follow_up_days,measurementKind:row.measurement_kind,plannedMinutes:row.planned_minutes,timelineEnabled:row.timeline_enabled===1,reviewDepth:row.review_depth,ordinal:row.ordinal,focusAreas:JSON.parse(row.focus_areas_json)}));
  if(items.some(item=>!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>500))throw new Error("Choose a quantity between 1 and 500.");
  if(items.some(item=>item.timelineEnabled)&&!input.startDate)throw new Error("Choose the coaching start date.");
  const price=input.priceAmountMinor??plan.price_amount_minor;
  if(price===null||!Number.isSafeInteger(price)||price<0)throw new Error("Set the agreed price before sending the agreement.");
  const terms:CoachingAgreementTerms={planId:plan.plan_id,planRevision:plan.revision,planName:plan.name,description:plan.description,priceAmountMinor:price,currency:plan.currency,billingCadence:plan.billing_cadence,paymentInstructions:plan.payment_instructions,requiredDiscordRoleId:plan.required_discord_role_id,autoArchiveAfterDays:plan.auto_archive_after_days,items,builderConfig:parseCoachingPlanConfiguration(JSON.parse(plan.builder_config_json)),startDate:input.startDate??null,customIntervalDays:input.customIntervalDays??null,dueTimeUtc:input.dueTimeUtc,coverageDays:input.coverageDays};
  items.forEach(item=>{const period=coachingPeriod(terms,item,0);if(period&&item.itemType.endsWith("_review"))coachingReviewCoverage(terms,item,period);});
  const id=createCanonicalUuidV4();
  this.db.transaction(()=>{
   const previous=this.db.prepare(`SELECT coalesce(max(revision),0) revision FROM traderlink_community_coaching_agreements WHERE relationship_id=?`).get(relation.relationship_id) as {revision:number};
   this.db.prepare(`UPDATE traderlink_community_coaching_agreements SET status='withdrawn' WHERE relationship_id=? AND status='proposed'`).run(relation.relationship_id);
   this.db.prepare(`INSERT INTO traderlink_community_coaching_agreements(agreement_id,community_id,relationship_id,revision,status,terms_json,proposed_by_user_id,proposed_at_utc) VALUES(?,?,?,?,'proposed',?,?,?)`).run(id,input.communityId,relation.relationship_id,previous.revision+1,JSON.stringify(terms),input.actor.userId,input.atUtc);
   this.notice(relation,relation.student_user_id,"agreement_proposed","Coaching agreement ready to review",input.atUtc);
  })();return id;
 }
 accept(input:{communityId:string;relationshipId:string;agreementId:string;actor:Actor;atUtc:string}){
  const relation=this.relation(input.communityId,input.relationshipId,input.actor);assertCanonicalUtcTimestamp(input.atUtc,"atUtc");assertCanonicalUuidV4(input.agreementId,"agreementId");
  if(relation.student_user_id!==input.actor.userId)platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED",{operation:"accept_coaching_agreement"});
  this.db.transaction(()=>{
   const row=this.db.prepare(`SELECT status FROM traderlink_community_coaching_agreements WHERE agreement_id=? AND community_id=? AND relationship_id=?`).get(input.agreementId,input.communityId,input.relationshipId) as {status:string}|undefined;
   if(row?.status==="accepted")return;
   if(row?.status!=="proposed")throw new Error("This agreement is no longer available. Refresh the page.");
   this.db.prepare(`UPDATE traderlink_community_coaching_agreements SET status='superseded' WHERE relationship_id=? AND status='accepted'`).run(input.relationshipId);
   this.db.prepare(`UPDATE traderlink_community_coaching_agreements SET status='accepted',accepted_at_utc=? WHERE agreement_id=?`).run(input.atUtc,input.agreementId);
   this.notice(relation,relation.coach_user_id,"agreement_accepted","Student accepted the coaching agreement",input.atUtc);
  })();
 }
 generate(input:{communityId:string;relationshipId:string;actor:Actor;atUtc:string;throughDate:string}){
  const relation=this.relation(input.communityId,input.relationshipId,input.actor);assertCanonicalUtcTimestamp(input.atUtc,"atUtc");coachingDate(input.throughDate);
  if(relation.coach_user_id!==input.actor.userId||relation.status!=="active")platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED",{operation:"schedule_coaching"});
  if(!coachingEntitlement(this.db,input.relationshipId)?.present)platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED",{operation:"coaching_access_paused"});
  if(this.db.prepare(`SELECT 1 FROM traderlink_community_coaching_relationships WHERE relationship_id=? AND archived_at_utc IS NOT NULL`).get(input.relationshipId))return 0;
  if(Date.parse(input.throughDate)-Date.parse(input.atUtc)>93*86400000)throw new Error("Schedule up to three months ahead.");
  const row=this.db.prepare(`SELECT agreement_id,terms_json FROM traderlink_community_coaching_agreements WHERE relationship_id=? AND status='accepted'`).get(input.relationshipId) as {agreement_id:string;terms_json:string}|undefined;
  if(!row)return 0;
  const terms=JSON.parse(row.terms_json) as CoachingAgreementTerms;
  const service=new TraderLinkCommunityCoachingProgramService(this.db);let created=0;
  this.db.transaction(()=>{
   scheduling: for(const item of terms.items){
    if(["questions","review_follow_up"].includes(item.itemType))continue;
    for(let index=0;index<10000;index++){
     const period=coachingPeriod(terms,item,index);if(!period||period.start>input.throughDate)break;

     // A revised agreement must not clone an existing period's work, even if the plan item ID changed.
     const prior=this.db.prepare(`SELECT 1 FROM traderlink_community_coaching_occurrences occurrence JOIN traderlink_community_coaching_agreements agreement ON agreement.agreement_id=occurrence.agreement_id,json_each(agreement.terms_json,'$.items') item WHERE agreement.relationship_id=? AND agreement.agreement_id<>? AND occurrence.period_start=? AND occurrence.item_key=json_extract(item.value,'$.planItemId') AND json_extract(item.value,'$.itemType')=?`).get(input.relationshipId,row.agreement_id,period.start,item.itemType);
     if(prior)continue;
     if(created>=120)break scheduling;
     const title=terms.planName+" — "+labels[item.itemType];
     const session=item.itemType==="private_session";
     const task=["group_lesson","student_check_in","custom_task"].includes(item.itemType);
     const workspaceKind=reviewKindForPlanItem(item.itemType)??"custom";
     const count=session||task?item.quantity:1;
     const priorReview=this.db.prepare(`SELECT max(period_end) period_end FROM traderlink_community_coaching_trade_reviews WHERE relationship_id=? AND delivery_state<>'draft' AND period_end<?`).get(input.relationshipId,period.end) as {period_end:string|null};
     const coverage=task||session?period:coachingReviewCoverage(terms,item,period,priorReview.period_end);
     for(let slot=0;slot<count;slot++){
      const itemKey=slot===0?item.planItemId:`${item.planItemId}:${slot}`;
      if(this.db.prepare(`SELECT 1 FROM traderlink_community_coaching_occurrences WHERE agreement_id=? AND item_key=? AND period_start=?`).get(row.agreement_id,itemKey,period.start))continue;
      if(created>=120)break scheduling;
      const itemTitle=(title+(count>1?` ${slot+1} of ${count}`:"")).slice(0,140);
      const workId=task?createCanonicalUuidV4():session?service.createSession({...input,title:itemTitle,agenda:terms.builderConfig?.offers[item.itemType]?.details??"",scheduledAtUtc:period.dueAtUtc}):service.createReview({...input,title:itemTitle,context:terms.builderConfig?.offers[item.itemType]?.details??"",reviewType:"custom",workspaceKind,focusAreas:item.focusAreas,periodStart:coverage.start,periodEnd:coverage.end,dueAtUtc:period.dueAtUtc,roundTripIds:[]});
      if(task)this.db.prepare(`INSERT INTO traderlink_community_coaching_tasks(task_id,relationship_id,community_id,created_by_user_id,title,due_at_utc,priority,status,created_at_utc,updated_at_utc) VALUES(?,?,?,?,?,?,'normal','open',?,?)`).run(workId,input.relationshipId,input.communityId,input.actor.userId,itemTitle,period.dueAtUtc,input.atUtc,input.atUtc);
      if(session)this.db.prepare(`UPDATE traderlink_community_coaching_sessions SET duration_minutes=? WHERE session_id=?`).run(item.plannedMinutes,workId);
      this.db.prepare(`INSERT INTO traderlink_community_coaching_occurrences(occurrence_id,community_id,agreement_id,item_key,period_start,period_end,due_at_utc,work_type,work_id,created_at_utc) VALUES(?,?,?,?,?,?,?,?,?,?)`).run(createCanonicalUuidV4(),input.communityId,row.agreement_id,itemKey,period.start,period.end,period.dueAtUtc,task?"task":session?"session":"review",workId,input.atUtc);created++;
     }
    }
   }
  })();return created;
 }
}

export function readCoachingAgreements(db:Database.Database,communityId:string,userId:string):CoachingAgreement[]{
 const rows=db.prepare(`SELECT agreement.* FROM traderlink_community_coaching_agreements agreement JOIN traderlink_community_coaching_relationships relationship ON relationship.relationship_id=agreement.relationship_id WHERE agreement.community_id=? AND (relationship.coach_user_id=? OR relationship.student_user_id=?) ORDER BY agreement.revision DESC`).all(communityId,userId,userId) as {agreement_id:string;relationship_id:string;revision:number;status:CoachingAgreement["status"];terms_json:string;proposed_at_utc:string;accepted_at_utc:string|null}[];
 return rows.map(row=>({agreementId:row.agreement_id,relationshipId:row.relationship_id,revision:row.revision,status:row.status,terms:JSON.parse(row.terms_json),proposedAtUtc:row.proposed_at_utc,acceptedAtUtc:row.accepted_at_utc}));
}
