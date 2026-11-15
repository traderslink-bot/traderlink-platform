import {studentReviewPreferences} from '../contracts/coaching-student-review-preferences';
import {IndependentCoachingReviewFollowUp} from './independent-coaching-review-follow-up';
import {createHash} from 'node:crypto';
import {acceptCoachCommercialTerms,requireCoachCommercialAccess} from './coaching-commercial-access';
import type Database from 'better-sqlite3';
import {IndependentCoachingRepository,type VerifiedIndependentCoachingTrade} from './independent-coaching-repository';
import {parseIndependentCoachingPlanTerms} from '../contracts/independent-coaching-plan-input';
import type {IndependentCoachingActionResult,IndependentCoachingFeedbackCommit,IndependentCoachingFeedbackAcknowledgement,IndependentCoachingPlan} from '../contracts/independent-coaching';
import type {CoachingRequiredScope} from '../contracts/coaching-required-access';
import {INDEPENDENT_FEEDBACK_PROTOCOL,isIndependentFeedbackIntent,isIndependentFeedbackRequestId} from '../contracts/independent-coaching-review-baseline';
import {coachingDecimalMinor} from '../contracts/coaching-commission-reconciliation';
import {isMailboxIntent,requireMailboxEnvelope} from '../contracts/independent-coaching-messages';
import {openIndependentCoachingMailboxMessage,sendIndependentCoachingMailboxMessage} from './independent-coaching-mailbox';
import {updateIndependentAssignedLesson} from './independent-coaching-lesson-management';
import {parseIndependentCoachSocialLinks} from '../contracts/independent-coaching-profile';

function field(raw:Record<string,unknown>,key:string,optional=false):string{
 const value=raw[key];if(optional&&(value===undefined||value===''))return '';
 if(typeof value!=='string'||!value.trim()||value.length>20000)throw new Error(`Check ${key}.`);return value;
}
function json(raw:Record<string,unknown>,key:string):unknown{const value=raw[key];return typeof value==='string'?JSON.parse(value):value;}
function strings(value:unknown):string[]{if(!Array.isArray(value)||value.length>500||value.some(v=>typeof v!=='string'||v.length>200))throw new Error('Check the selected items.');return value;}

/** Identity and time come from the request boundary; posted actor/coach IDs are ignored. */
function performAction(database:Database.Database,input:{actorUserId:string;atUtc:string;data:Record<string,unknown>;checkAdmission:(enrollmentId:string)=>void;tradeReviewEligibleCount?:(enrollmentId:string,reviewId:string,selected:readonly VerifiedIndependentCoachingTrade[],period:{start:string|null;end:string|null},restoreRoundTripIds?:readonly string[])=>number;verifySelection:(enrollmentId:string,reviewId:string,ids:readonly string[],days:readonly string[],period:{start:string|null;end:string|null},restoreRoundTripIds?:readonly string[])=>readonly VerifiedIndependentCoachingTrade[]}):IndependentCoachingActionResult{
 const repo=new IndependentCoachingRepository(database),raw=input.data,actor=input.actorUserId,at=input.atUtc;
 const intent=field(raw,'intent');
 if(isIndependentFeedbackIntent(intent)&&!isIndependentFeedbackRequestId(raw.requestId))throw new Error('Reload this form before submitting.');
 const acknowledge=(commit:IndependentCoachingFeedbackCommit):IndependentCoachingFeedbackAcknowledgement=>({...commit,protocol:INDEPENDENT_FEEDBACK_PROTOCOL,requestId:raw.requestId as string});
 const registration=['save_profile','accept_coach_terms','share_journal','save_student_goals','close_request'];
 if(!registration.includes(intent)&&database.prepare('SELECT 1 FROM traderlink_coaching_contexts WHERE coach_user_id=?').get(actor))requireCoachCommercialAccess(database,{coachUserId:actor,scope:'platform',atUtc:at});
 switch(intent){
  case 'accept_coach_terms':{if(raw.consent!=='yes')throw new Error('Confirm the coach signup terms.');const scope=raw.scope==='community'?'community':'platform';acceptCoachCommercialTerms(database,{coachUserId:actor,scope,communityId:scope==='community'?field(raw,'communityId'):undefined,policyVersion:field(raw,'policyVersion'),atUtc:at});return {};}
  case 'save_profile':repo.saveProfile(actor,{displayName:field(raw,'displayName'),headline:field(raw,'headline',true),biography:field(raw,'biography',true),deliverySummary:field(raw,'deliverySummary',true),socialLinks:parseIndependentCoachSocialLinks({stocktwits:field(raw,'stocktwitsUrl',true),x:field(raw,'xUrl',true),youtube:field(raw,'youtubeUrl',true)})},at);return {href:'/coaching/profile'};
  case 'save_plan':{
   const context=repo.contextForCoach(actor);if(!context)throw new Error('Save your coach profile first.');
   const planId=field(raw,'planId',true),revision=Number(raw.expectedRevision??0);
   if(!Number.isSafeInteger(revision)||revision<0)throw new Error('Reload this plan before saving.');
   const terms=parseIndependentCoachingPlanTerms(json(raw,'terms'));
   const legacy=new Set(['strategy_review','rules_review','risk_review','goal_review','journal_review']),prior=planId?repo.readPlans(context.contextId).find(plan=>plan.planId===planId):null;
   if(terms.items.some(item=>legacy.has(item.itemType)&&!prior?.terms.items.some(original=>original.planItemId===item.planItemId&&original.itemType===item.itemType)))throw new Error('New reviews use Trade, Trading day or Performance, with strategy, rules, risk, goals and Journal as focus areas.');
   const price=field(raw,'price',true);
   if(!terms.quoteRequired&&!price)throw new Error('Set the plan price.');
   const priceAmountMinor=terms.quoteRequired?0:coachingDecimalMinor(price,2);
   const id=repo.savePlan({actorUserId:actor,contextId:context.contextId,planId:planId||undefined,expectedRevision:revision,terms:{...terms,priceAmountMinor},status:field(raw,'status') as IndependentCoachingPlan['status'],atUtc:at});
   return {href:`/coaching/plans/${encodeURIComponent(id)}/edit?saved=1`};
  }
  case 'request_enrollment':{const id=repo.requestEnrollment(field(raw,'planId'),actor,at);return {href:`/coaching/enrollments/${encodeURIComponent(id)}`};}
  case 'close_request':repo.closeEnrollmentRequest(field(raw,'enrollmentId'),actor,at);return {};
  case 'propose_agreement':{
   const id=field(raw,'enrollmentId'),quote=field(raw,'quotedPrice',true);
   if(repo.agreements(id,actor).some(agreement=>['proposed','accepted'].includes(agreement.status)))throw new Error('This request already has a current coaching agreement.');
   repo.proposeAgreement(id,actor,at,quote?coachingDecimalMinor(quote,2):undefined);return {};
  }
  case 'accept_agreement':{
   const id=field(raw,'enrollmentId');repo.acceptAgreement(id,field(raw,'agreementId'),actor,at,()=>input.checkAdmission(id),studentReviewPreferences(raw.olderTrades,raw.earliestTradeDate),Object.fromEntries(Object.entries(raw).filter(([key])=>key.startsWith('reviewSchedule:')).map(([key,value])=>[key.slice(15),value])));return {};
  }
  case 'share_journal':repo.shareJournal({enrollmentId:field(raw,'enrollmentId'),actorUserId:actor,accountId:field(raw,'accountId'),scopes:strings(json(raw,'scopes')) as CoachingRequiredScope[],atUtc:at});return {};
  case 'save_student_notes':case 'save_student_goals':repo.saveStudentContext({enrollmentId:field(raw,'enrollmentId'),actorUserId:actor,kind:raw.intent==='save_student_notes'?'notes':'goals',body:field(raw,'body',true),expectedRevision:Number(raw.expectedRevision),atUtc:at});return {};
  case 'mark_review_read':new IndependentCoachingReviewFollowUp(database).markRead(field(raw,'reviewId'),actor,at);return {};
  case 'reply_review':new IndependentCoachingReviewFollowUp(database).reply(field(raw,'reviewId'),actor,field(raw,'body'),at);return {};
  case 'schedule_review_follow_up':{const due=field(raw,'dueAtUtc');new IndependentCoachingReviewFollowUp(database).schedule(field(raw,'reviewId'),actor,due.length===16?`${due}:00.000Z`:due,at);return {};}
  case 'complete_review_follow_up':new IndependentCoachingReviewFollowUp(database).complete(field(raw,'reviewId'),actor,at);return {};
  case 'send_mailbox_message':return sendIndependentCoachingMailboxMessage(database,input);
  case 'open_mailbox_message':return openIndependentCoachingMailboxMessage(database,input);
  case 'send_message':repo.sendMessage(field(raw,'enrollmentId'),actor,field(raw,'body'),at);return {};
  case 'ask_question':repo.askQuestion({workId:field(raw,'workId'),actorUserId:actor,submissionKey:field(raw,'submissionKey'),body:field(raw,'body'),atUtc:at});return {};
  case 'answer_question':repo.answerQuestion({questionId:field(raw,'questionId'),actorUserId:actor,body:field(raw,'body'),atUtc:at});return {};
  case 'confirm_offsite_work':{
   const id=field(raw,'enrollmentId'),enrollment=repo.enrollment(id,actor);
   if(enrollment.coach_user_id!==actor)throw new Error('Only the coach confirms work arranged outside TraderLink.');
   const agreement=repo.agreements(id,actor).find(a=>a.agreementId===field(raw,'agreementId')&&a.status==='accepted');
   if(!agreement||agreement.terms.priceAmountMinor>0&&(agreement.terms.builderConfig?.payment?.method==='whop'||agreement.terms.commercialPolicy?.commissionEnabled))throw new Error('Confirm this work using its agreed payment method.');
   const occurrences=Object.fromEntries(agreement.terms.items.map(item=>[item.planItemId,agreement.terms.builderConfig?.payment?.serviceOccurrences[item.itemType]??1]));
   repo.createAgreedWork({enrollmentId:id,agreementId:agreement.agreementId,actorUserId:actor,occurrences,fulfillmentKey:`${agreement.terms.priceAmountMinor===0?'free':'offsite'}:${agreement.agreementId}`,atUtc:at});return {};
  }
  case 'submit_review':{
   const id=field(raw,'reviewId'),review=repo.review(id,actor);
   repo.submitReview({reviewId:id,actorUserId:actor,roundTripIds:strings(json(raw,'roundTripIds')),selectedDays:strings(json(raw,'selectedDays')),periodStart:field(raw,'periodStart',true)||undefined,periodEnd:field(raw,'periodEnd',true)||undefined,atUtc:at,tradeReviewEligibleCount:input.tradeReviewEligibleCount?(selected,period)=>input.tradeReviewEligibleCount!(review.enrollmentId,id,selected,period):undefined,verifySelection:(ids,days,period)=>ids.length||review.kind==='trading_day'?input.verifySelection(review.enrollmentId,id,ids,days,period):[]});return {};
  }
  case 'replace_student_trade':{
   const id=field(raw,'reviewId'),review=repo.review(id,actor);
   repo.replaceStudentTrade({reviewId:id,actorUserId:actor,removeRoundTripId:field(raw,'removeRoundTripId'),replacementRoundTripId:field(raw,'replacementRoundTripId'),atUtc:at,verifySelection:(ids,days,period)=>input.verifySelection(review.enrollmentId,id,ids,days,period)});return {};
  }
  case 'add_review_trades':{
   const id=field(raw,'reviewId'),review=repo.review(id,actor);
   return acknowledge(repo.addReviewTrades({reviewId:id,actorUserId:actor,roundTripIds:strings(json(raw,'roundTripIds')),atUtc:at,tradeReviewEligibleCount:input.tradeReviewEligibleCount?(selected,period)=>input.tradeReviewEligibleCount!(review.enrollmentId,id,selected,period):undefined,verifySelection:(ids,days,period)=>input.verifySelection(review.enrollmentId,id,ids,days,period)}));
  }
  case 'change_review_selection':{
   const id=field(raw,'reviewId'),review=repo.review(id,actor);
   if(!input.tradeReviewEligibleCount)throw new Error('The available trade count could not be verified.');
   return acknowledge(repo.changeReviewSelection({reviewId:id,actorUserId:actor,removeRoundTripId:field(raw,'removeRoundTripId',true),replacementIds:strings(json(raw,'replacementIds')),expectedSelectionFingerprint:field(raw,'expectedSelectionFingerprint'),expectedFingerprint:field(raw,'expectedFingerprint',true)||undefined,atUtc:at,verifySelection:(ids,days,period,restoreRoundTripIds)=>input.verifySelection(review.enrollmentId,id,ids,days,period,restoreRoundTripIds),tradeReviewEligibleCount:(selected,period,restoreRoundTripIds)=>input.tradeReviewEligibleCount!(review.enrollmentId,id,selected,period,restoreRoundTripIds)}));
  }
  case 'save_review_trade':{
   return acknowledge(repo.saveReviewTrade({reviewId:field(raw,'reviewId'),actorUserId:actor,roundTripId:field(raw,'roundTripId'),feedback:json(raw,'feedback') as Record<string,unknown>,expectedFingerprint:raw.expectedFingerprint as string,atUtc:at}));
  }
  case 'save_review':{
   const trades=json(raw,'tradeFeedback')??[];if(!Array.isArray(trades)||trades.length>500)throw new Error('Check the trade feedback.');
   return acknowledge(repo.saveReview({reviewId:field(raw,'reviewId'),actorUserId:actor,draft:json(raw,'draft') as Parameters<typeof repo.saveReview>[0]['draft'],expectedFingerprint:raw.expectedFingerprint as string,tradeFeedback:trades,atUtc:at}));
  }
  case 'deliver_review':repo.deliverReview(field(raw,'reviewId'),actor,at);return {};
  case 'update_plan_lesson':return updateIndependentAssignedLesson(database,{actorUserId:actor,atUtc:at,planId:field(raw,'planId'),enrollmentId:field(raw,'enrollmentId'),workId:field(raw,'workId'),data:json(raw,'workData'),status:field(raw,'status'),dueAtUtc:field(raw,'dueAtUtc',true)||null});
  case 'update_work':{
   const data=json(raw,'workData');if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Check the work details.');
   const allowed=new Set(['title','description','url','assignedTo']);
   if(Object.entries(data).some(([key,value])=>!allowed.has(key)||typeof value!=='string'||value.length>20000))throw new Error('Check the work details.');
   repo.updateWork({workId:field(raw,'workId'),actorUserId:actor,data:data as Record<string,unknown>,status:field(raw,'status') as Parameters<typeof repo.updateWork>[0]['status'],dueAtUtc:field(raw,'dueAtUtc',true)||null,atUtc:at});return {};
  }
  default:throw new Error('Choose an available coaching action.');
 }
}

/** Stable client retry key, scoped to the authenticated actor. Receipt and action
 * commit together; neither private form bodies nor credentials are persisted. */
export function performIndependentCoachingAction(database:Database.Database,input:Parameters<typeof performAction>[1]):IndependentCoachingActionResult{
 if(isMailboxIntent(input.data.intent))requireMailboxEnvelope(input.data);
 const requestId=input.data.requestId;if(requestId===undefined){if(isIndependentFeedbackIntent(input.data.intent))throw new Error('Reload this form before submitting.');return performAction(database,input);}
 if(typeof requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))throw new Error('Reload this form before submitting.');
 const hash=createHash('sha256').update(JSON.stringify(input.data)).digest('hex');
 return database.transaction(()=>{
  const prior=database.prepare('SELECT payload_sha256,result_json FROM traderlink_coaching_action_receipts WHERE actor_user_id=? AND request_id=?').get(input.actorUserId,requestId) as {payload_sha256:string;result_json:string}|undefined;
  if(prior){if(prior.payload_sha256!==hash)throw new Error('This submission changed. Edit the form and submit again.');return JSON.parse(prior.result_json) as IndependentCoachingActionResult;}
  const result=performAction(database,input);database.prepare('INSERT INTO traderlink_coaching_action_receipts VALUES(?,?,?,?,?)').run(input.actorUserId,requestId,hash,JSON.stringify(result),input.atUtc);return result;
 }).immediate();
}
