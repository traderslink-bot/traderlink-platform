import {studentTradeReplacementPeriod} from '../contracts/coaching-student-trade-replacement';
import {independentTradeHasSavedWork} from './coaching-student-replacement-locks';
import {chooseStudentReviewSchedules,withTradeReviewStartDate,validateTradeReviewOffer} from '../contracts/coaching-review-schedule-choice';
import {requireSubmissionAllowance,submissionPeriodForOffer,submissionDate} from '../contracts/coaching-request-submission-limits';
import {studentReviewPreferences,type StudentReviewPreferences} from '../contracts/coaching-student-review-preferences';
import {parsePerformanceTemplate,revisePerformanceTemplate,validatePerformanceEvaluation,performanceEvaluationReady,performancePeriodBasis,createPerformanceSnapshot} from '../contracts/coaching-performance-evaluation';
import {readPerformanceSnapshots} from './independent-coaching-performance-history';
import {validateDaySessionDraft,daySessionReady} from '../contracts/coaching-trading-day-evaluation';
import {independentActiveSelectionSql,independentSelectionLifecycleReady} from './independent-coaching-selection-lifecycle-storage';
import {newTradeReviewOlderPolicy} from '../contracts/coaching-trade-review-older-policy';
import {parseTradeEvaluationTemplate,reviseTradeEvaluationTemplate,validateTradeEvaluation,usesTradeReviewDesign} from '../contracts/coaching-trade-evaluation';
import {captureDeliveredTradeEvaluations,captureImprovementEvents} from './independent-coaching-evaluation-delivery';
import {requireCoachCommercialAccess} from './coaching-commercial-access';
import {independentCoachingUnavailableTrades} from './independent-coaching-trade-eligibility';
import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { CoachingAgreement, CoachingAgreementTerms } from "../contracts/coaching-agreements";
import { allowsEarlyCoachingReview, coachingDate, coachingPeriod, coachingReviewCoverage } from "../contracts/coaching-agreements";
import { parseCoachingPlanConfiguration } from "../contracts/coaching-plan-configuration";
import { coachingRequiredAccess, type CoachingRequiredScope } from "../contracts/coaching-required-access";
import { coachingServiceFocus,reviewKindForPlanItem } from "../contracts/coaching-review-workspace";
import { selectedTradingDayAvailableAt, periodAvailableAt, submissionDeadline } from "../contracts/coaching-review-timing";
import type { IndependentCoachProfile, IndependentCoachingPlan, IndependentCoachingReview, IndependentCoachingReviewDraft,IndependentCoachingEditorBaselines,IndependentCoachingFeedbackCommit,IndependentCoachingInsertedTrade } from "../contracts/independent-coaching";
import {parseIndependentReviewDraft,parseIndependentTradeFeedback,parseIndependentBulkFeedback,requireIndependentFeedbackFingerprint,independentTradeFeedbackCompleted,INDEPENDENT_REVIEW_STALE,INDEPENDENT_TRADE_STALE} from '../contracts/independent-coaching-review-input';
import {validateIndependentFeedbackBeforeWrite,canonicalIndependentFeedback,independentReviewEnvelope,independentTradeEnvelope,independentSelectionEnvelope} from '../contracts/independent-coaching-review-baseline';
import {requireStandaloneStudentCoachingAccess} from './coaching-student-platform-access';
import {readCoachingCommercialPolicy} from './coaching-commercial-policy';
import {newTradeReviewSelectionPolicy,requiresTradeReviewQuantity,requiredTradeReviewQuantity} from '../contracts/coaching-trade-review-selection-policy';
import {parseIndependentCoachProfile} from '../contracts/independent-coaching-profile';

function at(value:string):void { if(!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw new Error("Use a valid UTC time."); }
function text(value:string,label:string,max=4000):string {if(typeof value!=="string"||!value.trim()||value.length>max)throw new Error(`Enter ${label}.`);return value.trim();}
export type IndependentEnrollmentRow={enrollment_id:string;context_id:string;plan_id:string;student_user_id:string;coach_user_id:string;status:string};
export type VerifiedIndependentCoachingTrade={roundTripId:string;logicalTradeId:string;tradingDate?:string};

/** Human coaching only, with real independent context IDs and unchanged community tables. */
export class IndependentCoachingRepository {
  constructor(private readonly database:Database.Database){}

  saveProfile(actorUserId:string,profile:IndependentCoachProfile,atUtc:string):string {
    at(atUtc);text(profile.displayName,"your coach name",120);
    for(const value of [profile.headline,profile.biography,profile.deliverySummary])if(typeof value!=="string"||value.length>4000)throw new Error("Check your profile details.");
    return this.database.transaction(()=>{
      const prior=this.database.prepare("SELECT context_id FROM traderlink_coaching_contexts WHERE coach_user_id=?").get(actorUserId) as {context_id:string}|undefined;
      const id=prior?.context_id??randomUUID();
      this.database.prepare(`INSERT INTO traderlink_coaching_contexts(context_id,coach_user_id,profile_json,created_at_utc,updated_at_utc)
        VALUES(?,?,?,?,?) ON CONFLICT(coach_user_id) DO UPDATE SET profile_json=excluded.profile_json,updated_at_utc=excluded.updated_at_utc`)
        .run(id,actorUserId,JSON.stringify(profile),atUtc,atUtc);return id;
    }).immediate();
  }

  contextForCoach(coachUserId:string):{contextId:string;coachUserId:string;profile:IndependentCoachProfile}|null {
    const row=this.database.prepare("SELECT context_id,coach_user_id,profile_json FROM traderlink_coaching_contexts WHERE coach_user_id=?").get(coachUserId) as {context_id:string;coach_user_id:string;profile_json:string}|undefined;
    return row?{contextId:row.context_id,coachUserId:row.coach_user_id,profile:parseIndependentCoachProfile(JSON.parse(row.profile_json))}:null;
  }

  /** Existing coach identity is the same Platform user; no roster or consent is copied. */
  communityProfilesForCoach(coachUserId:string):readonly {profileId:string;communitySlug:string;communityName:string;profile:IndependentCoachProfile}[]{
    if(!this.database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_community_coach_profiles'").get())return [];
    const rows=this.database.prepare(`SELECT p.coach_profile_id,c.slug,c.display_name community_name,p.display_name,p.headline,p.biography,p.delivery_summary
      FROM traderlink_community_coach_profiles p JOIN traderlink_communities c ON c.community_id=p.community_id
      WHERE p.user_id=? ORDER BY p.updated_at_utc DESC,p.coach_profile_id`).all(coachUserId) as {coach_profile_id:string;slug:string;community_name:string;display_name:string;headline:string;biography:string;delivery_summary:string}[];
    return rows.map(row=>({profileId:row.coach_profile_id,communitySlug:row.slug,communityName:row.community_name,profile:{displayName:row.display_name,headline:row.headline,biography:row.biography,deliverySummary:row.delivery_summary}}));
  }
  studentAvatar(studentUserId:string):string|null{
    if(!this.database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_discord_memberships'").get()||!this.database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_auth_identities'").get())return null;
    const identity=this.database.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active' LIMIT 1").get(studentUserId) as {auth_subject:string}|undefined;
    const avatar=this.database.prepare("SELECT avatar_hash FROM platform_discord_memberships WHERE user_id=? AND avatar_hash IS NOT NULL LIMIT 1").get(studentUserId) as {avatar_hash:string}|undefined;
    return identity&&avatar&&/^[0-9]{1,32}$/.test(identity.auth_subject)&&/^[A-Za-z0-9_]{1,255}$/.test(avatar.avatar_hash)?`https://cdn.discordapp.com/avatars/${identity.auth_subject}/${avatar.avatar_hash}.png?size=128`:null;
  }

  private ownContext(contextId:string,actorUserId:string):void {
    if(!this.database.prepare("SELECT 1 FROM traderlink_coaching_contexts WHERE context_id=? AND coach_user_id=?").get(contextId,actorUserId))throw new Error("This coaching workspace belongs to another coach.");
  }
  enrollment(enrollmentId:string,actorUserId:string):IndependentEnrollmentRow {
    const row=this.database.prepare(`SELECT e.*,c.coach_user_id FROM traderlink_coaching_enrollments e
      JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id WHERE e.enrollment_id=?`).get(enrollmentId) as IndependentEnrollmentRow|undefined;
    if(!row||![row.student_user_id,row.coach_user_id].includes(actorUserId))throw new Error("This coaching enrollment is unavailable.");return row;
  }

  savePlan(input:{actorUserId:string;contextId:string;planId?:string;expectedRevision?:number;terms:CoachingAgreementTerms;status:IndependentCoachingPlan["status"];atUtc:string}):string {
    this.ownContext(input.contextId,input.actorUserId);at(input.atUtc);
    requireCoachCommercialAccess(this.database,{coachUserId:input.actorUserId,scope:'platform',atUtc:input.atUtc});
    if(!["draft","active","paused","archived"].includes(input.status))throw new Error("Choose a valid plan status.");
    text(input.terms.planName,"a plan name",200);
    if(!input.terms.items.length||!Number.isSafeInteger(input.terms.priceAmountMinor)||input.terms.priceAmountMinor<0||!['USD','CAD'].includes(input.terms.currency))throw new Error("Set the plan services, price and currency.");
    if(!['one_time','weekly','monthly','custom'].includes(input.terms.billingCadence))throw new Error("Choose the plan billing interval.");
    validateTradeReviewOffer(input.terms);
    for(const item of input.terms.items){
      if(!item.planItemId||!Number.isSafeInteger(item.quantity)||item.quantity<1)throw new Error("Set the service quantities.");
      if(reviewKindForPlanItem(item.itemType))submissionDeadline(input.atUtc,item.dueOffsetDays);
    }
    const config=input.terms.builderConfig?parseCoachingPlanConfiguration(input.terms.builderConfig):undefined;
    return this.database.transaction(()=>{
      const prior=input.planId?this.database.prepare("SELECT context_id,revision FROM traderlink_coaching_plans WHERE plan_id=?").get(input.planId) as {context_id:string;revision:number}|undefined:undefined;
      if(input.planId&&(!prior||prior.context_id!==input.contextId||prior.revision!==input.expectedRevision))throw new Error("This plan changed. Reload before saving again.");
      const id=input.planId??randomUUID(),revision=(prior?.revision??0)+1;
      const priorTerms=prior?this.readPlans(input.contextId).find(plan=>plan.planId===id)?.terms:undefined;
      const templates=input.terms.tradeEvaluationTemplates?Object.fromEntries(Object.entries(input.terms.tradeEvaluationTemplates).map(([itemId,value])=>{
        if(!input.terms.items.some(item=>item.planItemId===itemId&&(item.itemType==='trade_review'&&!value.daySessionReview||item.itemType==='trading_day_review'&&Boolean(value.daySessionReview&&value.reviewDesign))))throw new Error('Attach the evaluation to a Trade review service.');
        return [itemId,reviseTradeEvaluationTemplate(parseTradeEvaluationTemplate(value),priorTerms?.tradeEvaluationTemplates?.[itemId],revision)];
      })):undefined;
      const performanceTemplates=input.terms.performanceEvaluationTemplates?Object.fromEntries(Object.entries(input.terms.performanceEvaluationTemplates).map(([itemId,value])=>{if(!input.terms.items.some(item=>item.planItemId===itemId&&item.itemType==='performance_review'))throw new Error('Attach period evaluations only to Performance reviews.');return [itemId,revisePerformanceTemplate(parsePerformanceTemplate(value),priorTerms?.performanceEvaluationTemplates?.[itemId],revision)];})):undefined;
      const terms={...structuredClone(input.terms),tradeReviewSelectionPolicy:newTradeReviewSelectionPolicy(input.terms.items),olderTradeSelectionPolicy:newTradeReviewOlderPolicy(input.terms.items),planId:id,planRevision:revision,requiredDiscordRoleId:null,...(config?{builderConfig:config}:{}),...(templates?{tradeEvaluationTemplates:templates}:{}),...(performanceTemplates?{performanceEvaluationTemplates:performanceTemplates}:{})};
      if(prior)this.database.prepare("UPDATE traderlink_coaching_plans SET revision=?,status=?,updated_at_utc=? WHERE plan_id=?").run(revision,input.status,input.atUtc,id);
      else this.database.prepare("INSERT INTO traderlink_coaching_plans VALUES(?,?,?,?,?,?)").run(id,input.contextId,revision,input.status,input.atUtc,input.atUtc);
      this.database.prepare("INSERT INTO traderlink_coaching_plan_versions VALUES(?,?,?,?)").run(id,revision,JSON.stringify(terms),input.atUtc);return id;
    }).immediate();
  }

  readPlans(contextId?:string):IndependentCoachingPlan[]{
    const rows=this.database.prepare(`SELECT p.*,v.terms_json FROM traderlink_coaching_plans p JOIN traderlink_coaching_plan_versions v
      ON v.plan_id=p.plan_id AND v.revision=p.revision WHERE (? IS NULL OR p.context_id=?) ORDER BY p.updated_at_utc DESC`).all(contextId??null,contextId??null) as {plan_id:string;context_id:string;revision:number;status:IndependentCoachingPlan['status'];terms_json:string}[];
    return rows.map(row=>({planId:row.plan_id,contextId:row.context_id,revision:row.revision,status:row.status,terms:JSON.parse(row.terms_json)}));
  }

  requestEnrollment(planId:string,studentUserId:string,atUtc:string):string {
    at(atUtc);return this.database.transaction(()=>{
      const plan=this.database.prepare("SELECT context_id,status FROM traderlink_coaching_plans WHERE plan_id=?").get(planId) as {context_id:string;status:string}|undefined;
      if(!plan||plan.status!=='active')throw new Error("This plan is not currently accepting requests.");
      const owner=this.database.prepare('SELECT coach_user_id FROM traderlink_coaching_contexts WHERE context_id=?').get(plan.context_id) as {coach_user_id:string};
      if(owner.coach_user_id===studentUserId)throw new Error('You cannot enroll in your own coaching plan.');
      const prior=this.database.prepare("SELECT enrollment_id,status FROM traderlink_coaching_enrollments WHERE context_id=? AND plan_id=? AND student_user_id=?").get(plan.context_id,planId,studentUserId) as {enrollment_id:string;status:string}|undefined;
      if(prior&&['pending','active'].includes(prior.status))return prior.enrollment_id;
      requireCoachCommercialAccess(this.database,{coachUserId:owner.coach_user_id,scope:'platform',atUtc});
      requireStandaloneStudentCoachingAccess(this.database,studentUserId,atUtc);
      if(prior){
        if(prior.status!=='declined')throw new Error('This previous enrollment is closed. Arrange new terms with the coach.');
        this.database.prepare("UPDATE traderlink_coaching_enrollments SET status='pending',requested_at_utc=?,updated_at_utc=? WHERE enrollment_id=?").run(atUtc,atUtc,prior.enrollment_id);return prior.enrollment_id;
      }
      const id=randomUUID();this.database.prepare("INSERT INTO traderlink_coaching_enrollments VALUES(?,?,?,?,'pending',?,?)").run(id,plan.context_id,planId,studentUserId,atUtc,atUtc);return id;
    }).immediate();
  }

  closeEnrollmentRequest(enrollmentId:string,actorUserId:string,atUtc:string):void{
    at(atUtc);this.database.transaction(()=>{
      const enrollment=this.enrollment(enrollmentId,actorUserId);
      if(enrollment.status!=='pending'||this.agreements(enrollmentId,actorUserId).some(a=>a.acceptedAtUtc!==null))throw new Error('Only a pending request without accepted work can be closed here.');
      this.database.prepare("UPDATE traderlink_coaching_enrollments SET status='declined',updated_at_utc=? WHERE enrollment_id=?").run(atUtc,enrollmentId);
      this.database.prepare("UPDATE traderlink_coaching_accepted_terms SET status='withdrawn' WHERE enrollment_id=? AND status='proposed'").run(enrollmentId);
      this.database.prepare("UPDATE traderlink_coaching_journal_access SET status='revoked',revoked_at_utc=? WHERE enrollment_id=? AND status='active'").run(atUtc,enrollmentId);
      this.event(enrollmentId,actorUserId,enrollment.coach_user_id===actorUserId?'request_declined':'request_withdrawn',enrollmentId,atUtc);
    }).immediate();
  }

  proposeAgreement(enrollmentId:string,actorUserId:string,atUtc:string,quotedPriceAmountMinor?:number):string {
    at(atUtc);const enrollment=this.enrollment(enrollmentId,actorUserId);if(enrollment.coach_user_id!==actorUserId)throw new Error("Only the coach prepares this agreement.");
    if(!['pending','active'].includes(enrollment.status))throw new Error('This enrollment request is closed.');
    requireCoachCommercialAccess(this.database,{coachUserId:enrollment.coach_user_id,scope:'platform',atUtc});
    const plan=this.readPlans(enrollment.context_id).find(p=>p.planId===enrollment.plan_id);if(!plan)throw new Error("Plan terms unavailable.");
    if(plan.terms.quoteRequired&&quotedPriceAmountMinor===undefined)throw new Error('Set the agreed quote before sending this agreement.');
    if(quotedPriceAmountMinor!==undefined&&(!plan.terms.quoteRequired||!Number.isSafeInteger(quotedPriceAmountMinor)||quotedPriceAmountMinor<0))throw new Error('Set a valid price for this quoted plan.');
    const policy=readCoachingCommercialPolicy(this.database,{scope:'platform',coachUserId:enrollment.coach_user_id});
    if(policy.commissionEnabled&&(quotedPriceAmountMinor??plan.terms.priceAmountMinor)>0&&plan.terms.builderConfig?.payment?.method!=='whop')throw new Error('This arrangement collects commission through Whop. Set this plan to Whop before sending an agreement.');
    const terms=withTradeReviewStartDate({...plan.terms,...(quotedPriceAmountMinor===undefined?{}:{priceAmountMinor:quotedPriceAmountMinor}),commercialPolicy:policy,tradeReviewSelectionPolicy:newTradeReviewSelectionPolicy(plan.terms.items),olderTradeSelectionPolicy:newTradeReviewOlderPolicy(plan.terms.items)},atUtc);
    return this.database.transaction(()=>{
      const row=this.database.prepare("SELECT coalesce(max(revision),0) revision FROM traderlink_coaching_accepted_terms WHERE enrollment_id=?").get(enrollmentId) as {revision:number};
      this.database.prepare("UPDATE traderlink_coaching_accepted_terms SET status='withdrawn' WHERE enrollment_id=? AND status='proposed'").run(enrollmentId);
      const id=randomUUID();this.database.prepare("INSERT INTO traderlink_coaching_accepted_terms VALUES(?,?,?,'proposed',?,?,NULL)").run(id,enrollmentId,row.revision+1,JSON.stringify(terms),atUtc);return id;
    }).immediate();
  }

  acceptAgreement(enrollmentId:string,agreementId:string,actorUserId:string,atUtc:string,checkNewStudent?:()=>void,studentPreferences?:StudentReviewPreferences,reviewSchedules?:Readonly<Record<string,unknown>>):void {
    at(atUtc);this.database.transaction(()=>{
      const enrollment=this.enrollment(enrollmentId,actorUserId);if(enrollment.student_user_id!==actorUserId)throw new Error("Only the student accepts the agreement.");
      if(!['pending','active'].includes(enrollment.status))throw new Error('This enrollment request is closed.');
      const row=this.database.prepare("SELECT status,terms_json FROM traderlink_coaching_accepted_terms WHERE agreement_id=? AND enrollment_id=?").get(agreementId,enrollmentId) as {status:string;terms_json:string}|undefined;
      if(row?.status==='accepted')return;if(row?.status!=='proposed')throw new Error("This agreement is no longer available.");
      requireCoachCommercialAccess(this.database,{coachUserId:enrollment.coach_user_id,scope:'platform',atUtc});
      requireStandaloneStudentCoachingAccess(this.database,enrollment.student_user_id,atUtc);
      checkNewStudent?.();
      this.database.prepare("UPDATE traderlink_coaching_accepted_terms SET status='superseded' WHERE enrollment_id=? AND status='accepted'").run(enrollmentId);
      this.database.prepare("UPDATE traderlink_coaching_accepted_terms SET status='accepted',accepted_at_utc=?,terms_json=? WHERE agreement_id=?").run(atUtc,JSON.stringify({...chooseStudentReviewSchedules(JSON.parse(row.terms_json),reviewSchedules,atUtc),studentReviewPreferences:studentReviewPreferences(studentPreferences?.olderTrades,studentPreferences?.earliestDate)}),agreementId);
      this.database.prepare("UPDATE traderlink_coaching_enrollments SET status='active',updated_at_utc=? WHERE enrollment_id=?").run(atUtc,enrollmentId);
      this.event(enrollmentId,actorUserId,'agreement_accepted',agreementId,atUtc);
      const terms=JSON.parse(row.terms_json) as CoachingAgreementTerms;
      if(terms.priceAmountMinor===0)this.createAgreedWork({enrollmentId,agreementId,actorUserId,atUtc,fulfillmentKey:`free:${agreementId}`,occurrences:Object.fromEntries(terms.items.map(item=>[item.planItemId,terms.builderConfig?.payment?.serviceOccurrences[item.itemType]??1]))});
    }).immediate();
  }

  agreements(enrollmentId:string,actorUserId:string):CoachingAgreement[]{
    this.enrollment(enrollmentId,actorUserId);
    const rows=this.database.prepare("SELECT * FROM traderlink_coaching_accepted_terms WHERE enrollment_id=? ORDER BY revision DESC").all(enrollmentId) as {agreement_id:string;revision:number;status:CoachingAgreement['status'];terms_json:string;proposed_at_utc:string;accepted_at_utc:string|null}[];
    return rows.map(r=>({agreementId:r.agreement_id,relationshipId:enrollmentId,revision:r.revision,status:r.status,terms:JSON.parse(r.terms_json),proposedAtUtc:r.proposed_at_utc,acceptedAtUtc:r.accepted_at_utc}));
  }

  shareJournal(input:{enrollmentId:string;actorUserId:string;accountId:string;scopes:readonly CoachingRequiredScope[];atUtc:string}):void {
    at(input.atUtc);const enrollment=this.enrollment(input.enrollmentId,input.actorUserId);if(enrollment.student_user_id!==input.actorUserId)throw new Error("Only the student controls Journal access.");
    if(input.scopes.length&&enrollment.status!=='active')throw new Error('Journal access can only be granted for active coaching.');
    if(input.scopes.length&&!this.database.prepare("SELECT 1 FROM journal_accounts WHERE account_id=? AND created_by_user_id=? AND status='active'").get(input.accountId,input.actorUserId))throw new Error("Choose your own active Journal account.");
    const allowed=new Set(['trades','analytics','trade_notes','tags','rules','journal_notes','day_rules','open_positions','images']);
    if(input.scopes.some(s=>!allowed.has(s)))throw new Error("Choose valid Journal access.");
    this.database.transaction(()=>{
      this.database.prepare("UPDATE traderlink_coaching_journal_access SET status='revoked',revoked_at_utc=? WHERE enrollment_id=? AND status='active'").run(input.atUtc,input.enrollmentId);
      if(input.scopes.length)this.database.prepare("INSERT INTO traderlink_coaching_journal_access VALUES(?,?,?,?,?,'active',?,NULL)").run(randomUUID(),input.enrollmentId,input.actorUserId,input.accountId,JSON.stringify([...new Set(input.scopes)]),input.atUtc);
      this.event(input.enrollmentId,input.actorUserId,'journal_access_updated',input.accountId,input.atUtc);
    }).immediate();
  }

  journalAccess(enrollmentId:string,actorUserId:string,agreementId?:string,planItemId?:string):{accountId:string|null;accountAvailable:boolean;reviewAccountMismatch:boolean;scopes:CoachingRequiredScope[];missing:CoachingRequiredScope[]} {
    this.enrollment(enrollmentId,actorUserId);
    const agreements=this.agreements(enrollmentId,actorUserId);
    const agreement=agreementId?agreements.find(a=>a.agreementId===agreementId&&a.acceptedAtUtc!==null):agreements.find(a=>a.status==='accepted');
    const required=agreement?coachingRequiredAccess(planItemId?agreement.terms.items.filter(item=>item.planItemId===planItemId):agreement.terms.items,agreement.terms.builderConfig):[];
    const row=this.database.prepare("SELECT g.journal_account_id,g.scopes_json,EXISTS(SELECT 1 FROM journal_accounts a WHERE a.account_id=g.journal_account_id AND a.created_by_user_id=g.student_user_id AND a.status='active') account_available FROM traderlink_coaching_journal_access g WHERE g.enrollment_id=? AND g.status='active' ORDER BY g.granted_at_utc DESC LIMIT 1").get(enrollmentId) as {journal_account_id:string;scopes_json:string;account_available:number}|undefined;
    const scopes:CoachingRequiredScope[]=row?JSON.parse(row.scopes_json):[];
    const reviewAccountMismatch=Boolean(!agreementId&&this.database.prepare("SELECT 1 FROM traderlink_coaching_reviews WHERE enrollment_id=? AND status IN ('ready','draft') AND journal_account_id IS NOT NULL AND journal_account_id<>? LIMIT 1").get(enrollmentId,row?.journal_account_id??''));
    return {accountId:row?.journal_account_id??null,accountAvailable:row?.account_available===1,reviewAccountMismatch,scopes,missing:required.filter(scope=>row?.account_available!==1||!scopes.includes(scope))};
  }

  createAgreedWork(input:{enrollmentId:string;agreementId:string;actorUserId:string;occurrences:Readonly<Record<string,number>>;fulfillmentKey?:string;atUtc:string}):string[] {
    at(input.atUtc);const enrollment=this.enrollment(input.enrollmentId,input.actorUserId);
    const agreement=this.agreements(input.enrollmentId,input.actorUserId).find(a=>a.agreementId===input.agreementId&&a.acceptedAtUtc!==null);
    if(!agreement)throw new Error("Identify the accepted terms for this work.");
    return this.database.transaction(()=>{
      const key=input.fulfillmentKey??`agreement:${input.agreementId}`;
      text(key,'the fulfillment identity',200);
      const occurrences=Object.fromEntries(Object.entries(input.occurrences).sort(([a],[b])=>a.localeCompare(b)));
      const priorBatch=this.database.prepare('SELECT agreement_id,occurrences_json,work_ids_json FROM traderlink_coaching_fulfillment_batches WHERE fulfillment_key=?').get(key) as {agreement_id:string;occurrences_json:string;work_ids_json:string}|undefined;
      if(priorBatch){
        if(priorBatch.agreement_id!==input.agreementId||priorBatch.occurrences_json!==JSON.stringify(occurrences))throw new Error('This fulfillment identity already belongs to different purchased work.');
        return JSON.parse(priorBatch.work_ids_json) as string[];
      }
      if(Object.keys(occurrences).some(id=>!agreement.terms.items.some(item=>item.planItemId===id)))throw new Error('Purchased service is not in the accepted agreement.');
      const ids:string[]=[];
      for(const item of agreement.terms.items){
        const count=input.occurrences[item.planItemId];if(!Number.isSafeInteger(count)||count<1)throw new Error("Identify the funded service occurrences.");
        const kind=reviewKindForPlanItem(item.itemType);
        const last=this.database.prepare(`SELECT max(occurrence_index) last FROM (
          SELECT occurrence_index FROM traderlink_coaching_reviews WHERE agreement_id=? AND plan_item_id=?
          UNION ALL SELECT json_extract(data_json,'$.occurrenceIndex') FROM traderlink_coaching_work WHERE agreement_id=? AND json_extract(data_json,'$.planItemId')=?)`).get(input.agreementId,item.planItemId,input.agreementId,item.planItemId) as {last:number|null};
        const offset=(last.last??-1)+1;
        for(let unit=0;unit<count;unit++){
          const index=offset+unit;
          const prior=this.database.prepare("SELECT review_id FROM traderlink_coaching_reviews WHERE agreement_id=? AND plan_item_id=? AND occurrence_index=?").get(input.agreementId,item.planItemId,index) as {review_id:string}|undefined;
          if(kind){
            if(prior){ids.push(prior.review_id);continue;}
            const id=randomUUID(),period=coachingPeriod(agreement.terms,item,index),coverage=period?coachingReviewCoverage(agreement.terms,item,period):null;
            this.database.prepare(`INSERT INTO traderlink_coaching_reviews(review_id,enrollment_id,agreement_id,plan_item_id,occurrence_index,kind,period_start,period_end,due_at_utc,status,created_at_utc,updated_at_utc)
              VALUES(?,?,?,?,?,?,?,?,?,'awaiting_submission',?,?)`).run(id,input.enrollmentId,input.agreementId,item.planItemId,index,kind,coverage?.start??null,coverage?.end??null,period?.dueAtUtc??null,input.atUtc,input.atUtc);ids.push(id);
          }else{
            const workKind=item.itemType==='private_session'?'session':item.itemType==='group_lesson'?'lesson':item.itemType==='student_check_in'?'check_in':item.itemType==='review_follow_up'?'follow_up':'task';
            // A purchased occurrence can include several separately scheduled sessions
            // or lessons. Questions stay a single allowance, not one task per question.
            const units=item.itemType==='questions'?1:item.quantity;
            for(let serviceUnitIndex=0;serviceUnitIndex<units;serviceUnitIndex++){
              const id=randomUUID();this.database.prepare("INSERT INTO traderlink_coaching_work VALUES(?,?,?,?,?,'open',NULL,?,?)").run(id,input.enrollmentId,input.agreementId,workKind,JSON.stringify({planItemId:item.planItemId,occurrenceIndex:index,serviceUnitIndex,title:agreement.terms.planName,serviceType:item.itemType,quantity:item.itemType==='questions'?item.quantity:1,assignedTo:['lesson','check_in'].includes(workKind)?'student':'coach'}),input.atUtc,input.atUtc);ids.push(id);
            }
          }
        }
      }
      this.database.prepare('INSERT INTO traderlink_coaching_fulfillment_batches VALUES(?,?,?,?,?)').run(key,input.agreementId,JSON.stringify(occurrences),JSON.stringify(ids),input.atUtc);
      this.event(enrollment.enrollment_id,input.actorUserId,'work_created',input.agreementId,input.atUtc);return ids;
    }).immediate();
  }

  review(reviewId:string,actorUserId:string):IndependentCoachingReview {
    const row=this.database.prepare("SELECT * FROM traderlink_coaching_reviews WHERE review_id=?").get(reviewId) as Record<string,unknown>|undefined;
    if(!row)throw new Error("Review unavailable.");const enrollment=this.enrollment(String(row.enrollment_id),actorUserId),coach=enrollment.coach_user_id===actorUserId;
    const agreementRow=this.database.prepare('SELECT terms_json FROM traderlink_coaching_accepted_terms WHERE agreement_id=?').get(row.agreement_id) as {terms_json:string}|undefined;
    const agreementTerms=agreementRow?JSON.parse(agreementRow.terms_json) as CoachingAgreementTerms:undefined,agreedItem=agreementTerms?.items.find(item=>item.planItemId===row.plan_item_id);
    const earlySubmissionAllowed=Boolean(agreementTerms&&agreedItem&&allowsEarlyCoachingReview(agreementTerms,agreedItem));
    return {earlySubmissionAllowed,reviewId,enrollmentId:String(row.enrollment_id),agreementId:String(row.agreement_id),planItemId:String(row.plan_item_id),occurrenceIndex:Number(row.occurrence_index),kind:row.kind as IndependentCoachingReview['kind'],journalAccountId:row.journal_account_id as string|null,periodStart:row.period_start as string|null,periodEnd:row.period_end as string|null,dueAtUtc:row.due_at_utc as string|null,submittedAtUtc:row.submitted_at_utc as string|null,status:row.status as IndependentCoachingReview['status'],selectedDays:JSON.parse(String(row.selected_days_json)),draft:coach?JSON.parse(String(row.draft_json)):{},delivered:row.delivered_json?JSON.parse(String(row.delivered_json)):null,deliveredAtUtc:row.delivered_at_utc as string|null};
  }

  /** Only the review editor requests these coherent, original-coach content baselines. Journal availability is checked again on mutation. */
  reviewEditorModel(reviewId:string,actorUserId:string){
    return this.database.transaction(()=>{
      const review=this.review(reviewId,actorUserId),trades=this.reviewTrades(reviewId,actorUserId),enrollment=this.enrollment(review.enrollmentId,actorUserId);
      const baselines:IndependentCoachingEditorBaselines|undefined=enrollment.coach_user_id===actorUserId&&enrollment.status==='active'&&['ready','draft'].includes(review.status)?{
        reviewId,fingerprint:this.contentFingerprint(independentReviewEnvelope(reviewId,review.draft)),selectionFingerprint:this.selectionFingerprint(reviewId,actorUserId),
        trades:trades.map(row=>({roundTripId:row.roundTripId,fingerprint:this.contentFingerprint(independentTradeEnvelope(reviewId,row.roundTripId,row.feedback,row.completed))}))
      }:undefined;
      return {review,trades,...(baselines?{baselines}:{})};
    })();
  }

  private contentFingerprint(value:unknown):string{return createHash('sha256').update(canonicalIndependentFeedback(value)).digest('hex');}
  private tradeFeedbackState(reviewId:string,roundTripId:string){
    const row=this.database.prepare(`SELECT feedback_json,completed FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=? AND ${independentActiveSelectionSql(this.database)}`).get(reviewId,roundTripId) as {feedback_json:string;completed:number}|undefined;
    if(!row)throw new Error('Save feedback only for a trade selected in this review.');
    const feedback=JSON.parse(row.feedback_json) as Record<string,unknown>,completed=row.completed===1;
    return {feedback,completed,fingerprint:this.contentFingerprint(independentTradeEnvelope(reviewId,roundTripId,feedback,completed))};
  }

  submitReview(input:{reviewId:string;actorUserId:string;roundTripIds:readonly string[];selectedDays:readonly string[];periodStart?:string;periodEnd?:string;atUtc:string;verifySelection:(ids:readonly string[],days:readonly string[],period:{start:string|null;end:string|null})=>readonly VerifiedIndependentCoachingTrade[];tradeReviewEligibleCount?:(selected:readonly VerifiedIndependentCoachingTrade[],period:{start:string|null;end:string|null})=>number}):void {
    at(input.atUtc);this.database.transaction(()=>{
      const review=this.review(input.reviewId,input.actorUserId),enrollment=this.enrollment(review.enrollmentId,input.actorUserId);
      if(enrollment.status!=='active')throw new Error("This enrollment is read-only.");
      if(['delivered','cancelled'].includes(review.status))throw new Error("This review is closed.");
      const agreement=this.agreements(review.enrollmentId,input.actorUserId).find(a=>a.agreementId===review.agreementId)!;
      const item=agreement.terms.items.find(i=>i.planItemId===review.planItemId)!;
      if(enrollment.coach_user_id===input.actorUserId&&item.selectionMode==='student')throw new Error("The student chooses the trades for this review.");
      if(enrollment.student_user_id===input.actorUserId&&item.selectionMode==='coach')throw new Error("The coach chooses the trades for this review.");
      const access=this.journalAccess(review.enrollmentId,input.actorUserId,review.agreementId,review.planItemId);if(access.missing.length)throw new Error("Required Journal access is missing.");
      if(enrollment.coach_user_id===input.actorUserId)requireCoachCommercialAccess(this.database,{coachUserId:input.actorUserId,scope:'platform',atUtc:input.atUtc});
      const ids=[...new Set(input.roundTripIds)],days=[...new Set(input.selectedDays)].sort();
      const start=review.periodStart??input.periodStart??(review.kind==='trading_day'?days[0]:null)??null,end=review.periodEnd??input.periodEnd??(review.kind==='trading_day'?days.at(-1):null)??null;
      if(start)coachingDate(start);if(end)coachingDate(end);for(const day of input.selectedDays)coachingDate(day);
      if(start&&end&&start>end)throw new Error("Choose a valid review period.");
      if(days.some(day=>(start&&day<start)||(end&&day>end)))throw new Error('Choose trading days within the review period.');
      if(['performance','strategy'].includes(review.kind)&&(!start||!end))throw new Error('Choose the agreed review period.');
      if(item.itemType==='trade_review'&&item.coveragePeriod!=='single_item'&&(!start||!end))throw new Error('Choose the date range required by this Trade review.');
      const scheduledPeriod=coachingPeriod(agreement.terms,item,review.occurrenceIndex);
      const available=(allowsEarlyCoachingReview(agreement.terms,item)?[selectedTradingDayAvailableAt(item.itemType==='trading_day_review'?days.at(-1):null)]:[periodAvailableAt(end),periodAvailableAt(scheduledPeriod?.end)]).filter((value):value is string=>Boolean(value)).sort().at(-1);if(available&&input.atUtc<available)throw new Error(allowsEarlyCoachingReview(agreement.terms,item)?"A selected trading day is in the future.":"The final trading date has not ended in Eastern Time.");
      if(item.itemType==='trade_review'&&!ids.length)throw new Error("Choose at least one available trade to submit for review.");
      if(item.itemType==='trading_day_review'&&!days.length)throw new Error("Choose a trading day to submit for review.");
      if(item.itemType==='trade_review'&&ids.length>item.quantity)throw new Error("Selected trades exceed the agreed review size.");
      if(item.itemType==='trading_day_review'&&days.length>item.quantity)throw new Error("Selected days exceed the agreed review size.");
      if(!['trade_review','trading_day_review','strategy_review'].includes(item.itemType)&&ids.length)throw new Error('This assessment uses period evidence rather than additional individual trade reviews.');
      const verified=input.verifySelection(ids,days,{start,end});
      if(verified.length!==ids.length||new Set(verified.map(t=>t.roundTripId)).size!==ids.length||new Set(verified.map(t=>t.logicalTradeId)).size!==ids.length||verified.some(t=>!ids.includes(t.roundTripId)||!t.logicalTradeId))throw new Error("Trade selection must identify distinct verified Journal trades.");
      if(item.itemType==='trading_day_review'){
        const cap=agreement.terms.builderConfig?.offers.trading_day_review?.tradeCap;
        if(!cap)throw new Error('Agree the trading-day trade limit before submitting work.');
        const counts=new Map<string,number>();for(const trade of verified){if(!trade.tradingDate||!days.includes(trade.tradingDate))throw new Error('Verify each trade against its selected trading day.');counts.set(trade.tradingDate,(counts.get(trade.tradingDate)??0)+1);}
        if(cap.basis==='per_review'?verified.length>cap.quantity:[...counts.values()].some(count=>count>cap.quantity))throw new Error('Selected trades exceed the agreed trading-day limit.');
      }
      const unavailable=independentCoachingUnavailableTrades(this.database,{coachUserId:enrollment.coach_user_id,studentUserId:enrollment.student_user_id,reviewId:review.reviewId});
      if(verified.some(trade=>unavailable.has(trade.logicalTradeId)||unavailable.has(trade.roundTripId)))throw new Error("This trade already belongs to another review with this coach.");
      if(review.status==='draft')throw new Error("Keep this review's saved selection while feedback is in progress.");
      if(review.status==='ready'){
        const prior=this.reviewTrades(review.reviewId,input.actorUserId);
        if(prior.length!==verified.length||prior.some(trade=>!verified.some(value=>value.logicalTradeId===trade.logicalTradeId))||JSON.stringify(days)!==JSON.stringify([...review.selectedDays].sort())||start!==review.periodStart||end!==review.periodEnd)throw new Error('Submitted work is already fixed. The coach can add eligible trades only when the accepted plan permits it.');
        return;
      }
      if(requiresTradeReviewQuantity(agreement.terms.tradeReviewSelectionPolicy,item)&&!(!item.timelineEnabled&&agreement.terms.builderConfig?.offers[item.itemType]?.submissionLimits)){
        if(!input.tradeReviewEligibleCount)throw new Error('The available trade count could not be verified.');
        const eligibleCount=input.tradeReviewEligibleCount(verified,{start,end});
        const required=requiredTradeReviewQuantity(item.quantity,eligibleCount);
        if(!required||verified.length!==required)throw new Error(`Select ${required||'at least one'} available ${required===1?'trade':'trades'} for this review.`);
      }
      const requestLimits=!item.timelineEnabled?agreement.terms.builderConfig?.offers[item.itemType]?.submissionLimits:undefined;
      if(requestLimits){const history=this.database.prepare(`SELECT r.submitted_at_utc at,count(t.round_trip_id) quantity,coalesce((SELECT CASE WHEN json_valid(e.object_id) THEN json_extract(e.object_id,'$.quantity') END FROM traderlink_coaching_events e WHERE e.enrollment_id=r.enrollment_id AND e.kind='review_submission_quantity' AND json_valid(e.object_id) AND CASE WHEN json_valid(e.object_id) THEN json_extract(e.object_id,'$.reviewId') END=r.review_id ORDER BY e.created_at_utc LIMIT 1),count(t.round_trip_id)) submittedQuantity FROM traderlink_coaching_reviews r LEFT JOIN traderlink_coaching_review_trades t ON t.review_id=r.review_id WHERE r.agreement_id=? AND r.plan_item_id=? AND r.submitted_at_utc IS NOT NULL GROUP BY r.review_id`).all(review.agreementId,review.planItemId) as {at:string;quantity:number;submittedQuantity:number}[];
       requireSubmissionAllowance(requestLimits,ids.length,input.atUtc,submissionPeriodForOffer(input.atUtc,item.frequency,agreement.terms.startDate??submissionDate(agreement.acceptedAtUtc!),agreement.terms.customIntervalDays,agreement.terms.builderConfig?.offers[item.itemType]?.tradeReviewFormat),history,agreement.terms.builderConfig?.offers[item.itemType]?.tradeReviewFormat);
      }
      this.database.prepare("DELETE FROM traderlink_coaching_review_trades WHERE review_id=?").run(review.reviewId);
      const add=this.database.prepare("INSERT INTO traderlink_coaching_review_trades(review_id,round_trip_id,logical_trade_id,updated_at_utc) VALUES(?,?,?,?)");for(const trade of verified){
        add.run(review.reviewId,trade.roundTripId,trade.logicalTradeId,input.atUtc);
        this.event(review.enrollmentId,input.actorUserId,'review_trade_selected',`${review.reviewId}:${trade.roundTripId}`,input.atUtc);
      }
      const goals=this.studentContext(review.enrollmentId,input.actorUserId).goals;
      this.database.prepare('INSERT INTO traderlink_coaching_review_goals VALUES(?,?,?,?) ON CONFLICT(review_id) DO NOTHING').run(review.reviewId,goals.body,goals.revision,input.atUtc);
      const scheduled=coachingPeriod(agreement.terms,item,review.occurrenceIndex);
      const due=item.timelineEnabled?(review.dueAtUtc??scheduled?.dueAtUtc):(review.submittedAtUtc?review.dueAtUtc:submissionDeadline(input.atUtc,item.dueOffsetDays,agreement.terms.builderConfig?.offers[item.itemType]?.deliveryDayCount));
      if(!due)throw new Error('The scheduled review deadline is missing.');
      this.database.prepare("UPDATE traderlink_coaching_reviews SET journal_account_id=?,period_start=?,period_end=?,selected_days_json=?,submitted_at_utc=coalesce(submitted_at_utc,?),due_at_utc=?,status='ready',updated_at_utc=? WHERE review_id=?")
        .run(access.accountId,start,end,JSON.stringify(days),input.atUtc,due,input.atUtc,review.reviewId);
      if(requestLimits)this.event(review.enrollmentId,input.actorUserId,'review_submission_quantity',JSON.stringify({reviewId:review.reviewId,quantity:ids.length}),input.atUtc);
      if(requestLimits&&!this.database.prepare("SELECT 1 FROM traderlink_coaching_reviews WHERE agreement_id=? AND plan_item_id=? AND status='awaiting_submission'").get(review.agreementId,review.planItemId)){
       const next=(this.database.prepare('SELECT coalesce(max(occurrence_index),-1)+1 next FROM traderlink_coaching_reviews WHERE agreement_id=? AND plan_item_id=?').get(review.agreementId,review.planItemId) as {next:number}).next;
       this.database.prepare("INSERT INTO traderlink_coaching_reviews(review_id,enrollment_id,agreement_id,plan_item_id,occurrence_index,kind,status,created_at_utc,updated_at_utc) VALUES(?,?,?,?,?,?,'awaiting_submission',?,?)").run(randomUUID(),review.enrollmentId,review.agreementId,review.planItemId,next,review.kind,input.atUtc,input.atUtc);
      }
    }).immediate();
  }

  /** Append coach choices without replacing student requests, saved feedback or the submission deadline. */
  addReviewTrades(input:{reviewId:string;actorUserId:string;roundTripIds:readonly string[];atUtc:string;tradeReviewEligibleCount?:(selected:readonly VerifiedIndependentCoachingTrade[],period:{start:string|null;end:string|null})=>number;verifySelection:(ids:readonly string[],days:readonly string[],period:{start:string|null;end:string|null})=>readonly VerifiedIndependentCoachingTrade[]}):Extract<IndependentCoachingFeedbackCommit,{kind:'append'}> {
    at(input.atUtc);return this.database.transaction(()=>{
      const review=this.review(input.reviewId,input.actorUserId),enrollment=this.enrollment(review.enrollmentId,input.actorUserId);
      if(enrollment.status!=='active'||enrollment.coach_user_id!==input.actorUserId||!['ready','draft'].includes(review.status)||!['trade','trading_day','strategy'].includes(review.kind))throw new Error('This review cannot accept additional trade selections.');
      requireCoachCommercialAccess(this.database,{coachUserId:input.actorUserId,scope:'platform',atUtc:input.atUtc});
      const agreement=this.agreements(review.enrollmentId,input.actorUserId).find(a=>a.agreementId===review.agreementId)!,item=agreement.terms.items.find(i=>i.planItemId===review.planItemId)!;
      if(!['coach','coach_or_student'].includes(item.selectionMode))throw new Error('The accepted plan gives trade selection to the student.');
      const access=this.journalAccess(review.enrollmentId,input.actorUserId,review.agreementId,review.planItemId);
      if(access.missing.length||!review.journalAccountId||access.accountId!==review.journalAccountId)throw new Error('Required Journal access was revoked, changed or is missing.');
      const prior=this.reviewTrades(review.reviewId,input.actorUserId),ids=[...new Set([...prior.map(trade=>trade.roundTripId),...input.roundTripIds])];
      if(ids.length>500)throw new Error('Too many trades selected.');
      const verified=input.verifySelection(ids,review.selectedDays,{start:review.periodStart,end:review.periodEnd});
      if(verified.length!==ids.length||new Set(verified.map(t=>t.roundTripId)).size!==ids.length||new Set(verified.map(t=>t.logicalTradeId)).size!==ids.length||verified.some(t=>!ids.includes(t.roundTripId)||!t.logicalTradeId))throw new Error('Choose distinct verified Journal trades.');
      if(item.itemType==='trade_review'&&verified.length>item.quantity)throw new Error('Selected trades exceed the agreed review size.');
      const unavailable=independentCoachingUnavailableTrades(this.database,{coachUserId:enrollment.coach_user_id,studentUserId:enrollment.student_user_id,reviewId:review.reviewId});
      if(verified.some(t=>unavailable.has(t.roundTripId)||unavailable.has(t.logicalTradeId)))throw new Error('This trade already belongs to another review with this coach.');
      if(requiresTradeReviewQuantity(agreement.terms.tradeReviewSelectionPolicy,item)&&!(!item.timelineEnabled&&agreement.terms.builderConfig?.offers[item.itemType]?.submissionLimits)){
        if(!input.tradeReviewEligibleCount)throw new Error('The available trade count could not be verified.');
        const required=requiredTradeReviewQuantity(item.quantity,input.tradeReviewEligibleCount(verified,{start:review.periodStart,end:review.periodEnd}));
        if(!required||verified.length!==required)throw new Error(`Select ${required||'at least one'} available trades for this review.`);
      }
      const existing=new Set(prior.map(trade=>trade.roundTripId));
      const limits=!item.timelineEnabled?agreement.terms.builderConfig?.offers[item.itemType]?.submissionLimits:undefined,newCount=verified.filter(trade=>!existing.has(trade.roundTripId)).length;
      if(limits&&newCount){const history=this.database.prepare("SELECT r.submitted_at_utc at,count(t.round_trip_id) quantity FROM traderlink_coaching_reviews r LEFT JOIN traderlink_coaching_review_trades t ON t.review_id=r.review_id WHERE r.agreement_id=? AND r.plan_item_id=? AND r.submitted_at_utc IS NOT NULL GROUP BY r.review_id").all(review.agreementId,review.planItemId) as {at:string;quantity:number}[];requireSubmissionAllowance({perPeriod:limits.perPeriod},newCount,review.submittedAtUtc!,submissionPeriodForOffer(review.submittedAtUtc!,item.frequency,agreement.terms.startDate??submissionDate(agreement.acceptedAtUtc!),agreement.terms.customIntervalDays,agreement.terms.builderConfig?.offers[item.itemType]?.tradeReviewFormat),history,agreement.terms.builderConfig?.offers[item.itemType]?.tradeReviewFormat);}

      const insert=this.database.prepare('INSERT INTO traderlink_coaching_review_trades(review_id,round_trip_id,logical_trade_id,updated_at_utc) VALUES(?,?,?,?)');
      for(const trade of verified)if(!existing.has(trade.roundTripId)){
        const removed=independentSelectionLifecycleReady(this.database)?this.database.prepare('SELECT selection_state,logical_trade_id,completed FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=?').get(review.reviewId,trade.roundTripId) as {selection_state:string;logical_trade_id:string;completed:number}|undefined:undefined;
        if(removed){
          const origin=this.database.prepare("SELECT actor_user_id FROM traderlink_coaching_events WHERE enrollment_id=? AND kind='review_trade_selected' AND object_id=? ORDER BY created_at_utc DESC,rowid DESC LIMIT 1").get(review.enrollmentId,`${review.reviewId}:${trade.roundTripId}`) as {actor_user_id:string}|undefined;
          if(removed.selection_state!=='removed'||removed.completed||removed.logical_trade_id!==trade.logicalTradeId||origin?.actor_user_id!==input.actorUserId)throw new Error('This removed draft cannot be restored.');
          this.database.prepare("UPDATE traderlink_coaching_review_trades SET selection_state='active',removed_at_utc=NULL,removed_by_user_id=NULL WHERE review_id=? AND round_trip_id=? AND selection_state='removed'").run(review.reviewId,trade.roundTripId);
        }else{
          insert.run(review.reviewId,trade.roundTripId,trade.logicalTradeId,input.atUtc);
          this.event(review.enrollmentId,input.actorUserId,'review_trade_selected',`${review.reviewId}:${trade.roundTripId}`,input.atUtc);
        }
      }
      const rows:IndependentCoachingInsertedTrade[]=this.reviewTrades(review.reviewId,input.actorUserId).filter(row=>!existing.has(row.roundTripId)).map(row=>{
        if(row.selectionSource!=='coach'||!row.logicalTradeId)throw new Error('The added trades could not be confirmed.');
        return {...row,logicalTradeId:row.logicalTradeId,selectionSource:'coach',fingerprint:this.tradeFeedbackState(review.reviewId,row.roundTripId).fingerprint};
      });
      return {kind:'append' as const,reviewId:review.reviewId,requestedRoundTripIds:[...input.roundTripIds],rows};
    }).immediate();
  }


  studentTradeReplacementState(reviewId:string,actorUserId:string){
    const review=this.review(reviewId,actorUserId),enrollment=this.enrollment(review.enrollmentId,actorUserId),agreement=this.agreements(review.enrollmentId,actorUserId).find(value=>value.agreementId===review.agreementId),item=agreement?.terms.items.find(value=>value.planItemId===review.planItemId);
    if(enrollment.student_user_id!==actorUserId||enrollment.status!=='active'||!review.submittedAtUtc||!['ready','draft'].includes(review.status)||!item||!['trade_review','trading_day_review'].includes(item.itemType)||!['student','coach_or_student'].includes(item.selectionMode))throw new Error('Student trade replacement is unavailable for this review.');
    const access=this.journalAccess(review.enrollmentId,actorUserId,review.agreementId,review.planItemId);if(access.missing.length||!review.journalAccountId||access.accountId!==review.journalAccountId)throw new Error('Restore the agreed Journal access before replacing a trade.');
    const rows=this.database.prepare(`SELECT round_trip_id,logical_trade_id,${independentSelectionLifecycleReady(this.database)?'selection_state':"'active'"} selection_state FROM traderlink_coaching_review_trades WHERE review_id=?`).all(reviewId) as {round_trip_id:string;logical_trade_id:string;selection_state:string}[];
    const protectedIds=rows.filter(row=>independentTradeHasSavedWork(this.database,reviewId,row.round_trip_id,enrollment.coach_user_id,review.submittedAtUtc)).map(row=>row.round_trip_id);
    return {review,item,terms:agreement!.terms,protectedIds,selected:rows.filter(row=>row.selection_state==='active').map(row=>{const origin=this.database.prepare("SELECT actor_user_id FROM traderlink_coaching_events WHERE kind='review_trade_selected' AND object_id=? ORDER BY rowid DESC LIMIT 1").get(`${reviewId}:${row.round_trip_id}`) as {actor_user_id:string}|undefined;return {roundTripId:row.round_trip_id,logicalTradeId:row.logical_trade_id,canReplace:origin?.actor_user_id===actorUserId&&!protectedIds.includes(row.round_trip_id)};})};
  }
  replaceStudentTrade(input:{reviewId:string;actorUserId:string;removeRoundTripId:string;replacementRoundTripId:string;atUtc:string;verifySelection:(ids:readonly string[],days:readonly string[],period:{start:string|null;end:string|null})=>readonly VerifiedIndependentCoachingTrade[]}){
    at(input.atUtc);this.database.transaction(()=>{
      const state=this.studentTradeReplacementState(input.reviewId,input.actorUserId),{review,item}=state,old=state.selected.find(trade=>trade.roundTripId===input.removeRoundTripId);
      if(!old?.canReplace)throw new Error('This trade cannot be replaced. Your coach may have saved work on it.');
      if(state.selected.some(trade=>trade.roundTripId===input.replacementRoundTripId)||state.protectedIds.includes(input.replacementRoundTripId))throw new Error('Choose another eligible replacement trade.');
      const finalIds=state.selected.map(trade=>trade.roundTripId===old.roundTripId?input.replacementRoundTripId:trade.roundTripId),period=studentTradeReplacementPeriod(state.terms,item,review,input.atUtc);
      const verified=input.verifySelection(finalIds,review.selectedDays,period),next=verified.find(trade=>trade.roundTripId===input.replacementRoundTripId);
      if(verified.length!==finalIds.length||new Set(verified.map(trade=>trade.roundTripId)).size!==finalIds.length||new Set(verified.map(trade=>trade.logicalTradeId)).size!==finalIds.length||verified.some(trade=>!trade.logicalTradeId||!finalIds.includes(trade.roundTripId))||!next)throw new Error('Choose distinct eligible Journal trades.');
      if(!next.tradingDate||next.tradingDate>submissionDate(input.atUtc))throw new Error('Choose a trade with a verified date that is not in the future.');
      if(state.selected.some(trade=>trade.logicalTradeId===next.logicalTradeId))throw new Error('Choose a different Journal trade that is not already selected.');
      const enrollment=this.enrollment(review.enrollmentId,input.actorUserId),unavailable=independentCoachingUnavailableTrades(this.database,{coachUserId:enrollment.coach_user_id,studentUserId:enrollment.student_user_id,reviewId:review.reviewId});
      if(verified.some(trade=>unavailable.has(trade.roundTripId)||unavailable.has(trade.logicalTradeId)))throw new Error('This trade already belongs to another review with this coach.');
      if(item.itemType==='trading_day_review'){
        const prior=input.verifySelection([old.roundTripId],review.selectedDays,period)[0];if(!prior?.tradingDate||next.tradingDate!==prior.tradingDate||!review.selectedDays.includes(next.tradingDate))throw new Error('Choose a replacement from the same selected trading day.');
      }
      const restored=this.database.prepare('SELECT logical_trade_id FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=?').get(review.reviewId,next.roundTripId) as {logical_trade_id:string}|undefined;
      if(restored&&restored.logical_trade_id!==next.logicalTradeId)throw new Error('The replacement trade identity changed. Reload before replacing it.');
      if(independentSelectionLifecycleReady(this.database))this.database.prepare("UPDATE traderlink_coaching_review_trades SET selection_state='removed',removed_at_utc=?,removed_by_user_id=? WHERE review_id=? AND round_trip_id=?").run(input.atUtc,input.actorUserId,review.reviewId,old.roundTripId);
      else this.database.prepare('DELETE FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=?').run(review.reviewId,old.roundTripId);
      if(independentSelectionLifecycleReady(this.database))this.database.prepare("INSERT INTO traderlink_coaching_review_trades(review_id,round_trip_id,logical_trade_id,updated_at_utc) VALUES(?,?,?,?) ON CONFLICT(review_id,round_trip_id) DO UPDATE SET selection_state='active',removed_at_utc=NULL,removed_by_user_id=NULL,updated_at_utc=excluded.updated_at_utc").run(review.reviewId,next.roundTripId,next.logicalTradeId,input.atUtc);
      else this.database.prepare('INSERT INTO traderlink_coaching_review_trades(review_id,round_trip_id,logical_trade_id,updated_at_utc) VALUES(?,?,?,?)').run(review.reviewId,next.roundTripId,next.logicalTradeId,input.atUtc);
      this.event(review.enrollmentId,input.actorUserId,'review_trade_selected',`${review.reviewId}:${next.roundTripId}`,input.atUtc);
      this.event(review.enrollmentId,input.actorUserId,'student_trade_replaced',JSON.stringify({reviewId:review.reviewId,from:old.roundTripId,fromLogicalTradeId:old.logicalTradeId,to:next.roundTripId}),input.atUtc);
      this.database.prepare('UPDATE traderlink_coaching_reviews SET updated_at_utc=? WHERE review_id=?').run(input.atUtc,review.reviewId);
    }).immediate();
  }

  selectionFingerprint(reviewId:string,actorUserId:string):string{return this.contentFingerprint(independentSelectionEnvelope(reviewId,this.reviewTrades(reviewId,actorUserId)));}

  removedReviewTrades(reviewId:string,actorUserId:string){
    const review=this.review(reviewId,actorUserId),enrollment=this.enrollment(review.enrollmentId,actorUserId);
    if(enrollment.coach_user_id!==actorUserId||enrollment.status!=='active'||!['ready','draft'].includes(review.status))throw new Error('Removed drafts are only available to the coach while editing.');
    requireCoachCommercialAccess(this.database,{coachUserId:actorUserId,scope:'platform',atUtc:new Date().toISOString()});
    const access=this.journalAccess(review.enrollmentId,actorUserId,review.agreementId,review.planItemId);
    if(access.missing.length||access.accountId!==review.journalAccountId)throw new Error('Restore the agreed Journal access before opening removed drafts.');
    if(!independentSelectionLifecycleReady(this.database))return [];
    return this.database.prepare("SELECT round_trip_id roundTripId,removed_at_utc removedAtUtc,updated_at_utc savedAtUtc FROM traderlink_coaching_review_trades WHERE review_id=? AND selection_state='removed' AND removed_by_user_id=? ORDER BY removed_at_utc DESC,round_trip_id").all(reviewId,actorUserId) as {roundTripId:string;removedAtUtc:string;savedAtUtc:string}[];
  }

  /** One final-set transaction: retain removed partial content, replace without a reservation gap. */
  changeReviewSelection(input:{reviewId:string;actorUserId:string;removeRoundTripId:string;replacementIds:readonly string[];expectedSelectionFingerprint:string;expectedFingerprint?:string;atUtc:string;verifySelection:(ids:readonly string[],days:readonly string[],period:{start:string|null;end:string|null},restoreRoundTripIds?:readonly string[])=>readonly VerifiedIndependentCoachingTrade[];tradeReviewEligibleCount:(selected:readonly VerifiedIndependentCoachingTrade[],period:{start:string|null;end:string|null},restoreRoundTripIds?:readonly string[])=>number}):Extract<IndependentCoachingFeedbackCommit,{kind:'selection'}>{
    at(input.atUtc);return this.database.transaction(()=>{
      if(!independentSelectionLifecycleReady(this.database))throw new Error('Selection changes are not enabled yet.');
      const review=this.review(input.reviewId,input.actorUserId),enrollment=this.enrollment(review.enrollmentId,input.actorUserId);
      if(enrollment.status!=='active'||enrollment.coach_user_id!==input.actorUserId||!['ready','draft'].includes(review.status)||review.kind!=='trade')throw new Error('This review selection cannot be changed.');
      requireCoachCommercialAccess(this.database,{coachUserId:input.actorUserId,scope:'platform',atUtc:input.atUtc});
      const agreement=this.agreements(review.enrollmentId,input.actorUserId).find(a=>a.agreementId===review.agreementId)!,item=agreement.terms.items.find(i=>i.planItemId===review.planItemId)!;
      if(!['coach','coach_or_student'].includes(item.selectionMode))throw new Error('The student controls this review selection.');
      const access=this.journalAccess(review.enrollmentId,input.actorUserId,review.agreementId,review.planItemId);
      if(access.missing.length||!review.journalAccountId||access.accountId!==review.journalAccountId)throw new Error('Required Journal access was revoked, changed or is missing.');
      if(requireIndependentFeedbackFingerprint(input.expectedSelectionFingerprint)!==this.selectionFingerprint(review.reviewId,input.actorUserId))throw new Error('The selection changed. Reload it before removing or replacing a trade.');
      const prior=this.reviewTrades(review.reviewId,input.actorUserId),target=prior.find(row=>row.roundTripId===input.removeRoundTripId);
      if(input.removeRoundTripId){
        if(!target||target.selectionSource!=='coach'||target.completed)throw new Error('Only an incomplete coach-added trade can be removed.');
        if(requireIndependentFeedbackFingerprint(input.expectedFingerprint,true)!==this.tradeFeedbackState(review.reviewId,target.roundTripId).fingerprint)throw new Error(INDEPENDENT_TRADE_STALE);
      }else if(!input.replacementIds.length)throw new Error('Choose a removed draft to restore.');
      const ids=[...new Set([...prior.filter(row=>row.roundTripId!==input.removeRoundTripId).map(row=>row.roundTripId),...input.replacementIds])];
      if(!ids.length||ids.length>item.quantity||ids.length>500||input.removeRoundTripId&&ids.includes(input.removeRoundTripId))throw new Error('Choose a different replacement within the agreed review size.');
      const restoreIds=input.replacementIds.filter(id=>this.database.prepare("SELECT 1 FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=? AND selection_state='removed'").get(review.reviewId,id));
      const period={start:review.periodStart,end:review.periodEnd},verified=input.verifySelection(ids,review.selectedDays,period,restoreIds);
      if(verified.length!==ids.length||new Set(verified.map(row=>row.roundTripId)).size!==ids.length||new Set(verified.map(row=>row.logicalTradeId)).size!==ids.length||verified.some(row=>!ids.includes(row.roundTripId)||!row.logicalTradeId))throw new Error('Choose distinct verified Journal trades.');
      const unavailable=independentCoachingUnavailableTrades(this.database,{coachUserId:enrollment.coach_user_id,studentUserId:enrollment.student_user_id,reviewId:review.reviewId});
      if(verified.some(row=>unavailable.has(row.logicalTradeId)||unavailable.has(row.roundTripId)))throw new Error('This trade already belongs to another review with this coach.');
      if(requiresTradeReviewQuantity(agreement.terms.tradeReviewSelectionPolicy,item)&&!(!item.timelineEnabled&&agreement.terms.builderConfig?.offers[item.itemType]?.submissionLimits)){
        const required=requiredTradeReviewQuantity(item.quantity,input.tradeReviewEligibleCount(verified,period,restoreIds));
        if(!required||verified.length!==required)throw new Error(`Keep ${required||'at least one'} available ${required===1?'trade':'trades'} selected. Choose a replacement before removing this trade.`);
      }
      if(target)this.database.prepare("UPDATE traderlink_coaching_review_trades SET selection_state='removed',removed_at_utc=?,removed_by_user_id=? WHERE review_id=? AND round_trip_id=? AND selection_state='active'").run(input.atUtc,input.actorUserId,review.reviewId,target.roundTripId);
      for(const trade of verified)if(!prior.some(row=>row.roundTripId===trade.roundTripId)){
        const removed=this.database.prepare('SELECT selection_state,completed,logical_trade_id FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=?').get(review.reviewId,trade.roundTripId) as {selection_state:string;completed:number;logical_trade_id:string}|undefined;
        if(removed){
          const origin=this.database.prepare("SELECT actor_user_id FROM traderlink_coaching_events WHERE enrollment_id=? AND kind='review_trade_selected' AND object_id=? ORDER BY created_at_utc DESC,rowid DESC LIMIT 1").get(review.enrollmentId,`${review.reviewId}:${trade.roundTripId}`) as {actor_user_id:string}|undefined;
          if(removed.selection_state!=='removed'||removed.completed||origin?.actor_user_id!==input.actorUserId||removed.logical_trade_id!==trade.logicalTradeId)throw new Error('This saved selection cannot be restored.');
          this.database.prepare("UPDATE traderlink_coaching_review_trades SET selection_state='active',removed_at_utc=NULL,removed_by_user_id=NULL WHERE review_id=? AND round_trip_id=? AND selection_state='removed'").run(review.reviewId,trade.roundTripId);
        }else{
          this.database.prepare('INSERT INTO traderlink_coaching_review_trades(review_id,round_trip_id,logical_trade_id,updated_at_utc) VALUES(?,?,?,?)').run(review.reviewId,trade.roundTripId,trade.logicalTradeId,input.atUtc);
          this.event(review.enrollmentId,input.actorUserId,'review_trade_selected',`${review.reviewId}:${trade.roundTripId}`,input.atUtc);
        }
      }
      this.event(review.enrollmentId,input.actorUserId,target?'review_trade_removed':'review_trade_restored',target?`${review.reviewId}:${target.roundTripId}`:review.reviewId,input.atUtc);
      const rows=this.reviewTrades(review.reviewId,input.actorUserId).map(row=>({...row,selectionSource:row.selectionSource as 'coach'|'student'|'unknown',fingerprint:this.tradeFeedbackState(review.reviewId,row.roundTripId).fingerprint}));
      return {kind:'selection' as const,reviewId:review.reviewId,removedRoundTripId:input.removeRoundTripId,selectionFingerprint:this.selectionFingerprint(review.reviewId,input.actorUserId),rows};
    }).immediate();
  }

  /** Saving one trade never saves or discards another trade's text or the overall review. */
  saveReviewTrade(input:{reviewId:string;actorUserId:string;roundTripId:string;feedback:Record<string,unknown>;expectedFingerprint:string;atUtc:string}):Extract<IndependentCoachingFeedbackCommit,{kind:'trade'}> {
    at(input.atUtc);return this.database.transaction(()=>{
      const review=this.review(input.reviewId,input.actorUserId),enrollment=this.enrollment(review.enrollmentId,input.actorUserId);
      if(enrollment.status!=='active'||enrollment.coach_user_id!==input.actorUserId||!['ready','draft'].includes(review.status))throw new Error('This review is not editable by this coach.');
      const access=this.journalAccess(review.enrollmentId,input.actorUserId,review.agreementId,review.planItemId);
      if(access.missing.length||review.journalAccountId&&access.accountId!==review.journalAccountId)throw new Error('Required Journal access was revoked, changed or is missing.');
      requireCoachCommercialAccess(this.database,{coachUserId:input.actorUserId,scope:'platform',atUtc:input.atUtc});
      const expected=requireIndependentFeedbackFingerprint(input.expectedFingerprint,true);
      if(expected!==this.tradeFeedbackState(review.reviewId,input.roundTripId).fingerprint)throw new Error(INDEPENDENT_TRADE_STALE);
      const feedback=validateIndependentFeedbackBeforeWrite(()=>parseIndependentTradeFeedback(input.feedback));
      const agreement=this.agreements(review.enrollmentId,input.actorUserId).find(a=>a.agreementId===review.agreementId)!,item=agreement.terms.items.find(i=>i.planItemId===review.planItemId)!;
      const template=agreement.terms.tradeEvaluationTemplates?.[review.planItemId];
      const completed=validateIndependentFeedbackBeforeWrite(()=>{
       if(template){if(feedback.evaluation!==undefined)validateTradeEvaluation(feedback.evaluation,template);}else if(feedback.evaluation!==undefined)throw new Error('This accepted agreement uses the original feedback format.');
       return independentTradeFeedbackCompleted(feedback,coachingServiceFocus(item),template);
      });
      const changed=this.database.prepare(`UPDATE traderlink_coaching_review_trades SET feedback_json=?,completed=?,updated_at_utc=? WHERE review_id=? AND round_trip_id=? AND ${independentActiveSelectionSql(this.database)}`).run(JSON.stringify(feedback),completed?1:0,input.atUtc,review.reviewId,input.roundTripId).changes;
      if(changed!==1)throw new Error('Save feedback only for a trade selected in this review.');
      this.database.prepare("UPDATE traderlink_coaching_reviews SET status='draft',updated_at_utc=? WHERE review_id=?").run(input.atUtc,review.reviewId);
      this.event(review.enrollmentId,input.actorUserId,'review_trade_feedback_saved',`${review.reviewId}:${input.roundTripId}`,input.atUtc);
      const saved=this.tradeFeedbackState(review.reviewId,input.roundTripId);
      return {kind:'trade' as const,reviewId:review.reviewId,roundTripId:input.roundTripId,fingerprint:saved.fingerprint,completed:saved.completed};
    }).immediate();
  }

  saveReview(input:{reviewId:string;actorUserId:string;draft:IndependentCoachingReviewDraft;expectedFingerprint:string;tradeFeedback?:readonly {roundTripId:string;feedback:Record<string,unknown>;completed:boolean;expectedFingerprint:string}[];atUtc:string}):Extract<IndependentCoachingFeedbackCommit,{kind:'review'}> {
    at(input.atUtc);return this.database.transaction(()=>{
      const review=this.review(input.reviewId,input.actorUserId),enrollment=this.enrollment(review.enrollmentId,input.actorUserId);
      if(enrollment.status!=='active'||enrollment.coach_user_id!==input.actorUserId||!['ready','draft'].includes(review.status))throw new Error("This review is not editable by this coach.");
      const access=this.journalAccess(review.enrollmentId,input.actorUserId,review.agreementId,review.planItemId);
      if(access.missing.length||review.journalAccountId&&access.accountId!==review.journalAccountId)throw new Error("Required Journal access was revoked, changed or is missing.");
      requireCoachCommercialAccess(this.database,{coachUserId:input.actorUserId,scope:'platform',atUtc:input.atUtc});
      const expected=requireIndependentFeedbackFingerprint(input.expectedFingerprint);
      if(expected!==this.contentFingerprint(independentReviewEnvelope(review.reviewId,review.draft)))throw new Error(INDEPENDENT_REVIEW_STALE);
      const {draft,targets}=validateIndependentFeedbackBeforeWrite(()=>({draft:parseIndependentReviewDraft(input.draft),targets:parseIndependentBulkFeedback(input.tradeFeedback??[])}));
      const agreement=this.agreements(review.enrollmentId,input.actorUserId).find(a=>a.agreementId===review.agreementId)!,item=agreement.terms.items.find(i=>i.planItemId===review.planItemId)!,template=agreement.terms.tradeEvaluationTemplates?.[review.planItemId];
      const performanceTemplate=agreement.terms.performanceEvaluationTemplates?.[review.planItemId];
      validateIndependentFeedbackBeforeWrite(()=>{
      if(draft.performanceEvaluation!==undefined){if(!performanceTemplate)throw new Error('This accepted review uses its original Performance format.');validatePerformanceEvaluation(draft.performanceEvaluation,performanceTemplate);}
      validateDaySessionDraft(draft,review.selectedDays,template);
      for(const trade of targets){
        if(template){if(trade.feedback.evaluation!==undefined)validateTradeEvaluation(trade.feedback.evaluation,template);}else if(trade.feedback.evaluation!==undefined)throw new Error('This accepted agreement uses the original feedback format.');
        if(template&&trade.completed!==independentTradeFeedbackCompleted(trade.feedback,coachingServiceFocus(item),template))throw new Error('The trade completion state does not match its saved feedback.');
      }
      });
      // Protect every supplied write target before the first UPDATE. Other selected rows are untouched.
      for(const trade of targets)if(trade.expectedFingerprint!==this.tradeFeedbackState(review.reviewId,trade.roundTripId).fingerprint)throw new Error(INDEPENDENT_TRADE_STALE);
      for(const trade of targets){
        const prior=this.tradeFeedbackState(review.reviewId,trade.roundTripId);
        if(!Object.keys(trade.feedback).length&&!Object.keys(prior.feedback).length&&trade.completed===prior.completed)continue;
        const changed=this.database.prepare(`UPDATE traderlink_coaching_review_trades SET feedback_json=?,completed=?,updated_at_utc=? WHERE review_id=? AND round_trip_id=? AND ${independentActiveSelectionSql(this.database)}`)
          .run(JSON.stringify(trade.feedback),trade.completed?1:0,input.atUtc,review.reviewId,trade.roundTripId).changes;
        if(changed!==1)throw new Error("Save feedback only for a trade selected in this review.");
        this.event(review.enrollmentId,input.actorUserId,'review_trade_feedback_saved',`${review.reviewId}:${trade.roundTripId}`,input.atUtc);
      }
      this.database.prepare("UPDATE traderlink_coaching_reviews SET draft_json=?,status='draft',updated_at_utc=? WHERE review_id=?").run(JSON.stringify(draft),input.atUtc,review.reviewId);
      return {kind:'review' as const,reviewId:review.reviewId,fingerprint:this.contentFingerprint(independentReviewEnvelope(review.reviewId,this.review(review.reviewId,input.actorUserId).draft)),trades:targets.map(trade=>{
        const saved=this.tradeFeedbackState(review.reviewId,trade.roundTripId);return {roundTripId:trade.roundTripId,fingerprint:saved.fingerprint,completed:saved.completed};
      })};
    }).immediate();
  }

  deliverReview(reviewId:string,actorUserId:string,atUtc:string):void {
    at(atUtc);this.database.transaction(()=>{
      const review=this.review(reviewId,actorUserId),enrollment=this.enrollment(review.enrollmentId,actorUserId);
      if(enrollment.status!=='active'||enrollment.coach_user_id!==actorUserId||review.status!=='draft')throw new Error("Save the coach review before delivering it.");
      const access=this.journalAccess(review.enrollmentId,actorUserId,review.agreementId,review.planItemId);
      if(access.missing.length||review.journalAccountId&&access.accountId!==review.journalAccountId)throw new Error("Required Journal access is missing or the shared account changed.");
      requireCoachCommercialAccess(this.database,{coachUserId:actorUserId,scope:'platform',atUtc});
      const trades=this.database.prepare(`SELECT completed,feedback_json FROM traderlink_coaching_review_trades WHERE review_id=? AND ${independentActiveSelectionSql(this.database)}`).all(reviewId) as {completed:number;feedback_json:string}[];

      const agreement=this.agreements(review.enrollmentId,actorUserId).find(a=>a.agreementId===review.agreementId)!;
      const item=agreement.terms.items.find(i=>i.planItemId===review.planItemId)!,template=agreement.terms.tradeEvaluationTemplates?.[review.planItemId];
      if(trades.some(trade=>{const feedback=JSON.parse(trade.feedback_json);return !trade.completed||(template?!independentTradeFeedbackCompleted(feedback,coachingServiceFocus(item),template):![...Object.values(feedback),...Object.values(feedback.focusFeedback??{})].some(value=>typeof value==='string'&&value.trim()));}))throw new Error('Complete feedback for each selected trade before delivery.');
      if(!agreement.terms.performanceEvaluationTemplates?.[review.planItemId]&&!review.draft.overall?.trim()&&!trades.length)throw new Error("Add the agreed review feedback before delivery.");
      const performanceTemplate=agreement.terms.performanceEvaluationTemplates?.[review.planItemId];
      if(performanceTemplate&&!performanceEvaluationReady(review.draft.performanceEvaluation,performanceTemplate))throw new Error('Complete the agreed Performance evaluation before delivery.');
      if(!performanceTemplate&&review.draft.performanceEvaluation!==undefined)throw new Error('This accepted review uses its original Performance format.');
      validateDaySessionDraft(review.draft,review.selectedDays,template);
      if(template?.daySessionReview&&review.selectedDays.some(day=>!daySessionReady(day,review.draft,template.daySessionReview!)))throw new Error('Complete the agreed day/session assessments before delivery.');
      for(const focus of coachingServiceFocus(item)){
        if(['overall','next_steps'].includes(focus))continue;
        if(performanceTemplate&&focus!=='goals')continue;
        if(item.itemType==='trading_day_review'&&template?.daySessionReview&&focus!=='goals')continue;
        if(item.itemType==='trade_review'&&focus!=='goals'){
          if(usesTradeReviewDesign(template))continue;
          if(trades.some(trade=>{const feedback=JSON.parse(trade.feedback_json);return typeof feedback.focusFeedback?.[focus]!=='string'||!feedback.focusFeedback[focus].trim();}))throw new Error("Complete the agreed focus areas for every selected trade.");
        }else if(!review.draft.focusFeedback?.[focus]?.trim())throw new Error("Complete the agreed review focus areas.");
      }
      if(item.itemType==='trading_day_review'&&review.selectedDays.some(day=>!review.draft.dayAssessments?.[day]?.trim()))throw new Error("Complete the selected trading-day assessments.");
      captureDeliveredTradeEvaluations(this.database,{review,agreement,actorUserId,studentUserId:enrollment.student_user_id,atUtc});
      const delivered:NonNullable<IndependentCoachingReview['delivered']>&{privateNotes?:string}={...review.draft};delete delivered.privateNotes;
      if(performanceTemplate){
        if(!review.journalAccountId||!review.periodStart||!review.periodEnd)throw new Error('The Performance review account and period are required.');
        const zone=this.database.prepare(`SELECT a.trading_timezone timeZone FROM journal_accounts a JOIN traderlink_coaching_journal_access g ON g.journal_account_id=a.account_id WHERE a.account_id=? AND a.status='active' AND g.enrollment_id=? AND g.student_user_id=? AND g.status='active' AND a.created_by_user_id=g.student_user_id ORDER BY g.granted_at_utc DESC LIMIT 1`).get(review.journalAccountId,review.enrollmentId,enrollment.student_user_id) as {timeZone:string}|undefined;
        if(!zone)throw new Error('The shared Performance account is unavailable.');
        const previous=readPerformanceSnapshots(this.database,{coachUserId:actorUserId,studentUserId:enrollment.student_user_id,accountId:review.journalAccountId});
        delivered.performanceSnapshot=createPerformanceSnapshot({reviewId,accountId:review.journalAccountId,periodStart:review.periodStart,periodEnd:review.periodEnd,deliveredAtUtc:atUtc,template:parsePerformanceTemplate(performanceTemplate),evaluation:validatePerformanceEvaluation(review.draft.performanceEvaluation,performanceTemplate),basis:performancePeriodBasis(review.periodStart,review.periodEnd,item.coveragePeriod,item.frequency,zone.timeZone),...(performanceTemplate.periodDesign.overallGoals?{overallGoalsFeedback:review.draft.focusFeedback?.goals}:{})},previous);
      }
      this.database.prepare("UPDATE traderlink_coaching_reviews SET delivered_json=?,delivered_at_utc=?,status='delivered',updated_at_utc=? WHERE review_id=?").run(JSON.stringify(delivered),atUtc,atUtc,reviewId);
      if(agreement.terms.tradeEvaluationTemplates?.[review.planItemId])captureImprovementEvents(this.database,{reviewId,coachUserId:actorUserId,studentUserId:enrollment.student_user_id,accountId:review.journalAccountId!,atUtc});
      this.event(review.enrollmentId,actorUserId,'review_delivered',reviewId,atUtc);
    }).immediate();
  }

  sendMessage(enrollmentId:string,actorUserId:string,body:string,atUtc:string):string {
    at(atUtc);const enrollment=this.enrollment(enrollmentId,actorUserId);if(enrollment.status!=='active')throw new Error('Only active coaching allows new messages. Existing history remains available.');if(enrollment.coach_user_id===actorUserId)requireCoachCommercialAccess(this.database,{coachUserId:actorUserId,scope:'platform',atUtc});const id=randomUUID();this.database.prepare("INSERT INTO traderlink_coaching_messages VALUES(?,?,?,?,?)").run(id,enrollmentId,actorUserId,text(body,'a message',20000),atUtc);return id;
  }

  listEnrollments(actorUserId:string){
    return this.database.prepare(`SELECT e.enrollment_id enrollmentId,e.context_id contextId,e.plan_id planId,
      e.student_user_id studentUserId,c.coach_user_id coachUserId,u.display_name studentName,
      e.status,c.profile_json coachProfileJson FROM traderlink_coaching_enrollments e
      JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id JOIN platform_users u ON u.user_id=e.student_user_id
      WHERE e.student_user_id=? OR c.coach_user_id=? ORDER BY e.updated_at_utc DESC`).all(actorUserId,actorUserId) as {enrollmentId:string;contextId:string;planId:string;studentUserId:string;coachUserId:string;studentName:string;status:string;coachProfileJson:string}[];
  }
  listReviews(enrollmentId:string,actorUserId:string):IndependentCoachingReview[]{
    this.enrollment(enrollmentId,actorUserId);
    return (this.database.prepare("SELECT review_id FROM traderlink_coaching_reviews WHERE enrollment_id=? ORDER BY due_at_utc IS NULL,due_at_utc,created_at_utc").all(enrollmentId) as {review_id:string}[]).map(r=>this.review(r.review_id,actorUserId));
  }
  reviewTrades(reviewId:string,actorUserId:string){
    const review=this.review(reviewId,actorUserId),enrollment=this.enrollment(review.enrollmentId,actorUserId);
    const canReadFeedback=enrollment.coach_user_id===actorUserId||review.status==='delivered';
    const rows=this.database.prepare(`SELECT round_trip_id,logical_trade_id,feedback_json,completed FROM traderlink_coaching_review_trades WHERE review_id=? AND ${independentActiveSelectionSql(this.database)} ORDER BY rowid`).all(reviewId) as {round_trip_id:string;logical_trade_id:string;feedback_json:string;completed:number}[];
    return rows.map(row=>{
      const source=this.database.prepare("SELECT actor_user_id FROM traderlink_coaching_events WHERE enrollment_id=? AND kind='review_trade_selected' AND object_id=? ORDER BY created_at_utc DESC,rowid DESC LIMIT 1").get(review.enrollmentId,`${review.reviewId}:${row.round_trip_id}`) as {actor_user_id:string}|undefined;
      const selectionSource=source?.actor_user_id===enrollment.student_user_id?'student':source?.actor_user_id===enrollment.coach_user_id?'coach':'unknown';
      return {roundTripId:row.round_trip_id,logicalTradeId:row.logical_trade_id,selectionSource,feedback:canReadFeedback?JSON.parse(row.feedback_json):{},completed:canReadFeedback&&row.completed===1};
    });
  }
  listMessages(enrollmentId:string,actorUserId:string){
    this.enrollment(enrollmentId,actorUserId);
    return this.database.prepare(`SELECT m.message_id messageId,m.sender_user_id senderUserId,u.display_name senderName,m.body,m.created_at_utc createdAtUtc
      FROM traderlink_coaching_messages m JOIN platform_users u ON u.user_id=m.sender_user_id WHERE m.enrollment_id=? ORDER BY m.created_at_utc,m.message_id`)
      .all(enrollmentId) as {messageId:string;senderUserId:string;senderName:string;body:string;createdAtUtc:string}[];
  }
  listWork(enrollmentId:string,actorUserId:string){
    this.enrollment(enrollmentId,actorUserId);
    const rows=this.database.prepare("SELECT * FROM traderlink_coaching_work WHERE enrollment_id=? ORDER BY due_at_utc IS NULL,due_at_utc,created_at_utc").all(enrollmentId) as {work_id:string;agreement_id:string|null;kind:string;data_json:string;status:string;due_at_utc:string|null}[];
    return rows.map(row=>({questionSubmissionKey:randomUUID(),workId:row.work_id,agreementId:row.agreement_id,kind:row.kind,data:JSON.parse(row.data_json) as Record<string,unknown>,status:row.status,dueAtUtc:row.due_at_utc,
      questions:this.database.prepare(`SELECT q.question_id questionId,q.body,q.created_at_utc createdAtUtc,
        (SELECT body FROM traderlink_coaching_question_answers a WHERE a.question_id=q.question_id ORDER BY revision DESC LIMIT 1) answer
        FROM traderlink_coaching_questions q WHERE q.work_id=? ORDER BY q.created_at_utc,q.question_id`).all(row.work_id) as {questionId:string;body:string;createdAtUtc:string;answer:string|null}[]}));
  }

  askQuestion(input:{workId:string;actorUserId:string;submissionKey:string;body:string;atUtc:string}):string{
    at(input.atUtc);const body=text(input.body,'your question',20000),key=text(input.submissionKey,'the question submission',200);
    return this.database.transaction(()=>{
      const work=this.database.prepare('SELECT enrollment_id,data_json,status FROM traderlink_coaching_work WHERE work_id=?').get(input.workId) as {enrollment_id:string;data_json:string;status:string}|undefined;
      if(!work)throw new Error('Question allowance unavailable.');const enrollment=this.enrollment(work.enrollment_id,input.actorUserId),data=JSON.parse(work.data_json);
      if(enrollment.student_user_id!==input.actorUserId||data.serviceType!=='questions')throw new Error('Only the student uses this agreed question allowance.');
      const prior=this.database.prepare('SELECT question_id,body FROM traderlink_coaching_questions WHERE work_id=? AND submission_key=?').get(input.workId,key) as {question_id:string;body:string}|undefined;
      if(prior){if(prior.body!==body)throw new Error('This question submission was already used.');return prior.question_id;}
      if(enrollment.status!=='active')throw new Error('Only active coaching allows new questions. Existing history remains available.');
      if(!['open','assigned'].includes(work.status))throw new Error('This question allowance is closed.');
      const count=this.database.prepare('SELECT count(*) count FROM traderlink_coaching_questions WHERE work_id=?').get(input.workId) as {count:number};
      if(!Number.isSafeInteger(data.quantity)||count.count>=data.quantity)throw new Error('All questions in this agreed allowance have been used.');
      const id=randomUUID();this.database.prepare('INSERT INTO traderlink_coaching_questions VALUES(?,?,?,?,?)').run(id,input.workId,key,body,input.atUtc);return id;
    }).immediate();
  }
  answerQuestion(input:{questionId:string;actorUserId:string;body:string;atUtc:string}):void{
    at(input.atUtc);const body=text(input.body,'your answer',20000);
    this.database.transaction(()=>{
      const row=this.database.prepare('SELECT w.enrollment_id FROM traderlink_coaching_questions q JOIN traderlink_coaching_work w ON w.work_id=q.work_id WHERE q.question_id=?').get(input.questionId) as {enrollment_id:string}|undefined;
      if(!row)throw new Error('Only this student’s coach answers this question.');
      const enrollment=this.enrollment(row.enrollment_id,input.actorUserId);
      if(enrollment.coach_user_id!==input.actorUserId)throw new Error('Only this student’s coach answers this question.');
      requireCoachCommercialAccess(this.database,{coachUserId:input.actorUserId,scope:'platform',atUtc:input.atUtc});
      const prior=this.database.prepare('SELECT revision,body FROM traderlink_coaching_question_answers WHERE question_id=? ORDER BY revision DESC LIMIT 1').get(input.questionId) as {revision:number;body:string}|undefined;
      if(prior?.body===body)return;
      if(enrollment.status!=='active')throw new Error('Only active coaching allows new answers. Existing history remains available.');
      this.database.prepare('INSERT INTO traderlink_coaching_question_answers VALUES(?,?,?,?)').run(input.questionId,(prior?.revision??0)+1,body,input.atUtc);
    }).immediate();
  }
  updateWork(input:{workId:string;actorUserId:string;data:Record<string,unknown>;status:'open'|'scheduled'|'assigned'|'completed'|'cancelled';dueAtUtc:string|null;atUtc:string}):void {
    at(input.atUtc);if(input.dueAtUtc)at(input.dueAtUtc);
    const row=this.database.prepare("SELECT enrollment_id,kind,data_json,status,due_at_utc FROM traderlink_coaching_work WHERE work_id=?").get(input.workId) as {enrollment_id:string;kind:string;data_json:string;status:string;due_at_utc:string|null}|undefined;
    if(!row)throw new Error("This coaching work is unavailable.");const enrollment=this.enrollment(row.enrollment_id,input.actorUserId),coach=enrollment.coach_user_id===input.actorUserId;
    if(enrollment.status!=='active')throw new Error('Only active coaching work can be changed. Existing history remains available.');
    if(coach)requireCoachCommercialAccess(this.database,{coachUserId:input.actorUserId,scope:'platform',atUtc:input.atUtc});
    if(!['open','scheduled','assigned','completed','cancelled'].includes(input.status))throw new Error("Choose a valid work status.");
    if(!coach&&(input.status!=='completed'||!['lesson','task','check_in'].includes(row.kind)))throw new Error("Only the coach schedules or changes this work.");
    const original=JSON.parse(row.data_json) as Record<string,unknown>;
    if(!coach&&['completed','cancelled'].includes(row.status)&&input.status!==row.status)throw new Error('This work is already closed.');
    if(!coach&&row.kind==='lesson'&&row.status!=='assigned')throw new Error('Wait until the coach assigns this included lesson.');
    if(!coach&&original.assignedTo==='coach')throw new Error("This task is assigned to the coach.");
    const data=coach?{...original,...input.data,planItemId:original.planItemId,occurrenceIndex:original.occurrenceIndex,serviceUnitIndex:original.serviceUnitIndex,serviceType:original.serviceType,quantity:original.quantity}:original;
    if(data.assignedTo!==undefined&&!['coach','student'].includes(String(data.assignedTo)))throw new Error('Assign work to the coach or student.');
    if(row.kind==='lesson'&&input.status==='assigned'&&(typeof data.url!=='string'||!data.url.trim()))throw new Error('Add the included lesson link before assigning it.');
    if(typeof data.url==='string'&&data.url){const url=new URL(data.url);if(url.protocol!=='https:')throw new Error("Use an HTTPS meeting or lesson link.");}
    if(JSON.stringify(data).length>65536)throw new Error("Work details are too large.");
    this.database.prepare("UPDATE traderlink_coaching_work SET data_json=?,status=?,due_at_utc=?,updated_at_utc=? WHERE work_id=?")
      .run(JSON.stringify(data),input.status,coach?input.dueAtUtc:row.due_at_utc,input.atUtc,input.workId);
  }

  studentContext(enrollmentId:string,actorUserId:string):{notes:{body:string;revision:number}|null;goals:{body:string;revision:number};history:readonly {kind:string;atUtc:string}[]}{
    const enrollment=this.enrollment(enrollmentId,actorUserId);
    const latest=(table:string)=>this.database.prepare(`SELECT body,revision FROM ${table} WHERE enrollment_id=? ORDER BY revision DESC LIMIT 1`).get(enrollmentId) as {body:string;revision:number}|undefined;
    return {notes:enrollment.coach_user_id===actorUserId?latest('traderlink_coaching_student_notes')??{body:'',revision:0}:null,
      goals:latest('traderlink_coaching_student_goals')??{body:'',revision:0},
      history:this.database.prepare("SELECT kind,created_at_utc atUtc FROM traderlink_coaching_events WHERE enrollment_id=? ORDER BY created_at_utc DESC,event_id DESC LIMIT 100").all(enrollmentId) as {kind:string;atUtc:string}[]};
  }
  saveStudentContext(input:{enrollmentId:string;actorUserId:string;kind:'notes'|'goals';body:string;expectedRevision:number;atUtc:string}):void{
    at(input.atUtc);if(typeof input.body!=='string'||input.body.length>20000||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0)throw new Error('Check your notes and reload before saving.');
    this.database.transaction(()=>{
      const enrollment=this.enrollment(input.enrollmentId,input.actorUserId);
      if(enrollment.status!=='active'||(input.kind==='notes'?enrollment.coach_user_id:enrollment.student_user_id)!==input.actorUserId)throw new Error('Only the designated author can update this active coaching record.');
      if(input.kind==='notes')requireCoachCommercialAccess(this.database,{coachUserId:input.actorUserId,scope:'platform',atUtc:input.atUtc});
      const table=input.kind==='notes'?'traderlink_coaching_student_notes':'traderlink_coaching_student_goals';
      const latest=this.database.prepare(`SELECT body,revision FROM ${table} WHERE enrollment_id=? ORDER BY revision DESC LIMIT 1`).get(input.enrollmentId) as {body:string;revision:number}|undefined;
      if((latest?.revision??0)!==input.expectedRevision)throw new Error('These notes changed. Reload before saving to preserve the newer version.');
      if(latest?.body===input.body.trim())return;
      this.database.prepare(`INSERT INTO ${table} VALUES(?,?,?,?)`).run(input.enrollmentId,input.expectedRevision+1,input.body.trim(),input.atUtc);
      if(input.kind==='goals')this.event(input.enrollmentId,input.actorUserId,'goals_updated',input.enrollmentId,input.atUtc);
    }).immediate();
  }
  reviewGoals(reviewId:string,actorUserId:string):string{
    this.review(reviewId,actorUserId);
    return (this.database.prepare('SELECT body FROM traderlink_coaching_review_goals WHERE review_id=?').get(reviewId) as {body:string}|undefined)?.body??'';
  }

  private event(enrollmentId:string,actorUserId:string,kind:string,objectId:string,atUtc:string):void {
    this.database.prepare("INSERT INTO traderlink_coaching_events VALUES(?,?,?,?,?,?)").run(randomUUID(),enrollmentId,actorUserId,kind,objectId,atUtc);
  }
}
