import {createHash,randomUUID} from 'node:crypto';
import type Database from 'better-sqlite3';
import type {CoachingAgreement,CoachingAgreementTerms} from '../contracts/coaching-agreements';
import {PACK_REPURCHASE_PROTOCOL,canonicalPackJson,isPackFingerprint,type PackAcknowledgement,type PackAcceptanceExpectation,type PackDailyPolicy,type PackProposalExpectation,type PackQuote,type PackStatus,type PackWithdrawalExpectation} from '../contracts/coaching-pack-repurchase';
import {CoachingSubmissionLimitError,requestSubmissionLimits,submissionDate} from '../contracts/coaching-request-submission-limits';
import {coachingDecimalMinor} from '../contracts/coaching-commission-reconciliation';
import {requireCoachCommercialAccess} from './coaching-commercial-access';
import {readCoachingCommercialPolicy} from './coaching-commercial-policy';

type Enrollment={enrollment_id:string;plan_id:string;student_user_id:string;coach_user_id:string;status:string;context_id:string};
type AgreementRow={agreement_id:string;revision:number;status:CoachingAgreement['status'];terms_json:string;accepted_at_utc:string|null;proposed_at_utc:string};
type Saved=Readonly<{id:string;revision:number;status:CoachingAgreement['status'];terms:CoachingAgreementTerms;acceptedAtUtc:string|null}>;
const conflict=()=>new Error('This pack confirmation changed. Reload it before continuing.');
const fingerprint=(value:unknown)=>createHash('sha256').update(canonicalPackJson(value)).digest('hex');
function saved(row:AgreementRow):Saved{return {id:row.agreement_id,revision:row.revision,status:row.status,terms:JSON.parse(row.terms_json),acceptedAtUtc:row.accepted_at_utc};}
function state(db:Database.Database,enrollmentId:string,actorUserId:string){
 const enrollment=db.prepare('SELECT e.*,c.coach_user_id FROM traderlink_coaching_enrollments e JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id WHERE e.enrollment_id=?').get(enrollmentId) as Enrollment|undefined;
 if(!enrollment||![enrollment.coach_user_id,enrollment.student_user_id].includes(actorUserId))throw new Error('This coaching enrollment is unavailable.');
 const rows=db.prepare('SELECT * FROM traderlink_coaching_accepted_terms WHERE enrollment_id=? ORDER BY revision').all(enrollmentId) as AgreementRow[];
 return {enrollment,agreements:rows.map(saved)};
}
function active(enrollment:Enrollment){if(enrollment.status!=='active')throw new Error('Open an active coaching plan to arrange another pack.');}
function pack(terms:CoachingAgreementTerms){
 const items=terms.items.filter(item=>item.itemType!=='review_follow_up'),item=items[0],offer=terms.builderConfig?.offers.trade_review;
 if(items.length!==1||!item||item.itemType!=='trade_review'||item.timelineEnabled||item.frequency!=='once'||terms.billingCadence!=='one_time'||offer?.tradeReviewFormat!=='pack'||!offer.submissionLimits)throw new Error('Another pack is available only for a one-time Trade Review Pack.');
 const limits=requestSubmissionLimits(offer.submissionLimits);
 if(item.quantity!==limits.perPeriod)throw new Error('The pack quantity and trade allowance must match.');
 return {item,limits,dailyPolicy:{timezone:'America/New_York',...(limits.perDay===undefined?{}:{perDay:limits.perDay})} as PackDailyPolicy};
}
function sameDaily(a:PackDailyPolicy,b:PackDailyPolicy){return a.timezone==='America/New_York'&&b.timezone==='America/New_York'&&a.perDay===b.perDay;}
/** Finite scoped ancestry, including immutable legacy roots. No cross-enrollment joins. */
function ancestry(agreements:readonly Saved[],target:Saved){
 const byId=new Map(agreements.map(a=>[a.id,a])),seen=new Set<string>();let current=target;
 const targetPack=pack(target.terms);
 while(current.terms.packRepurchase){
  if(seen.has(current.id)||seen.size>=agreements.length)throw new Error('This pack history could not be verified.');seen.add(current.id);
  const link=current.terms.packRepurchase,parent=byId.get(link.parentAgreementId),currentPack=pack(current.terms);
  if(link.version!==1||!parent||!parent.acceptedAtUtc||parent.revision!==link.parentRevision||parent.revision>=current.revision||parent.terms.planId!==current.terms.planId||link.currentServiceId!==currentPack.item.planItemId||!isPackFingerprint(link.quoteFingerprint)||!sameDaily(link.dailyPolicy,currentPack.dailyPolicy))throw new Error('This pack history could not be verified.');
  const parentPack=pack(parent.terms);
  if(!sameDaily(parentPack.dailyPolicy,targetPack.dailyPolicy))throw new Error('Changing the daily submission limit between packs is not supported here.');
  current=parent;
 }
 const root=current,rootPack=pack(root.terms);
 if(!root.acceptedAtUtc||!sameDaily(rootPack.dailyPolicy,targetPack.dailyPolicy))throw new Error('This pack history could not be verified.');
 for(const id of seen){const link=byId.get(id)!.terms.packRepurchase!;if(link.rootAgreementId!==root.id||link.rootServiceId!==rootPack.item.planItemId||!sameDaily(link.dailyPolicy,rootPack.dailyPolicy))throw new Error('This pack history could not be verified.');}
 return {root,rootServiceId:rootPack.item.planItemId,dailyPolicy:rootPack.dailyPolicy};
}
function plan(db:Database.Database,enrollment:Enrollment){
 const row=db.prepare('SELECT p.revision,p.status,v.terms_json FROM traderlink_coaching_plans p JOIN traderlink_coaching_plan_versions v ON v.plan_id=p.plan_id AND v.revision=p.revision WHERE p.plan_id=? AND p.context_id=?').get(enrollment.plan_id,enrollment.context_id) as {revision:number;status:string;terms_json:string}|undefined;
 if(!row)throw new Error('This coaching offer is unavailable.');
 const terms=JSON.parse(row.terms_json) as CoachingAgreementTerms;
 if(terms.planId!==enrollment.plan_id||terms.planRevision!==row.revision)throw conflict();
 return {...row,terms};
}
export function packProposalFingerprint(agreement:Pick<Saved,'id'|'revision'|'terms'>){return fingerprint({agreementId:agreement.id,revision:agreement.revision,terms:agreement.terms});}
function quoteFor(db:Database.Database,s:ReturnType<typeof state>,quotedPrice?:string):PackQuote{
 const {enrollment,agreements}=s;active(enrollment);
 const predecessor=agreements.find(a=>a.status==='accepted');if(!predecessor||!predecessor.acceptedAtUtc)throw new Error('Accept the original pack agreement before arranging another pack.');
 const original=ancestry(agreements,predecessor),current=plan(db,enrollment);if(current.status!=='active')throw new Error('The coach must offer an active Trade Review Pack.');
 const currentPack=pack(current.terms);
 if(!sameDaily(original.dailyPolicy,currentPack.dailyPolicy))throw new Error('Changing the daily submission limit between packs is not supported here.');
 let price=current.terms.priceAmountMinor;
 if(current.terms.quoteRequired){if(!quotedPrice)throw new Error('Enter the quoted price, then review the new pack terms.');price=coachingDecimalMinor(quotedPrice,2);}
 else if(quotedPrice)throw new Error('Use the current offered price for this pack.');
 const policy=readCoachingCommercialPolicy(db,{scope:'platform',coachUserId:enrollment.coach_user_id});
 if(policy.commissionEnabled&&price>0&&current.terms.builderConfig?.payment?.method!=='whop')throw new Error('This arrangement collects commission through Whop. Set this plan to Whop before sending an agreement.');
 const {packRepurchase:_oldLineage,...currentTerms}=current.terms;
 void _oldLineage;
 const terms:CoachingAgreementTerms={...currentTerms,priceAmountMinor:price,commercialPolicy:policy};
 const base={enrollmentId:enrollment.enrollment_id,expectedPredecessorAgreementId:predecessor.id,expectedPredecessorRevision:predecessor.revision,expectedPlanId:enrollment.plan_id,expectedPlanRevision:current.revision,serviceId:currentPack.item.planItemId,...(current.terms.quoteRequired?{quotedPrice:(price/100).toFixed(2)}:{})};
 const quoteFingerprint=fingerprint({binding:base,terms,coach:enrollment.coach_user_id,student:enrollment.student_user_id,rootAgreementId:original.root.id,rootServiceId:original.rootServiceId,dailyPolicy:original.dailyPolicy});
 return {expectation:{...base,expectedQuoteFingerprint:quoteFingerprint},terms,rootAgreementId:original.root.id,rootServiceId:original.rootServiceId,dailyPolicy:original.dailyPolicy};
}
function sameQuote(actual:PackQuote,expected:PackProposalExpectation){
 const a=actual.expectation;
 if(a.enrollmentId!==expected.enrollmentId||a.expectedPredecessorAgreementId!==expected.expectedPredecessorAgreementId||a.expectedPredecessorRevision!==expected.expectedPredecessorRevision||a.expectedPlanId!==expected.expectedPlanId||a.expectedPlanRevision!==expected.expectedPlanRevision||a.serviceId!==expected.serviceId||a.expectedQuoteFingerprint!==expected.expectedQuoteFingerprint)throw conflict();
}
export function readPackRepurchaseStatus(db:Database.Database,input:{enrollmentId:string;actorUserId:string;quotedPrice?:string}):PackStatus{
 const s=state(db,input.enrollmentId,input.actorUserId);active(s.enrollment);
 const original=s.agreements.find(a=>a.acceptedAtUtc);if(!original)throw new Error('Accept the original pack agreement first.');pack(original.terms);
 let quote:PackQuote|null=null,quoteError:string|null=null;try{quote=quoteFor(db,s,input.quotedPrice);}catch(error){quoteError=error instanceof Error?error.message:'The new pack terms are unavailable.';}
 const pending=s.agreements.find(a=>a.status==='proposed');let pendingView:PackStatus['pending']=null;
 if(pending?.terms.packRepurchase){
  const lineage=pending.terms.packRepurchase;ancestry(s.agreements,pending);
  pendingView={agreementId:pending.id,revision:pending.revision,fingerprint:packProposalFingerprint(pending),terms:pending.terms,expectation:{enrollmentId:input.enrollmentId,agreementId:pending.id,expectedProposalRevision:pending.revision,expectedProposalFingerprint:packProposalFingerprint(pending),expectedPredecessorAgreementId:lineage.parentAgreementId,expectedPredecessorRevision:lineage.parentRevision,expectedPlanId:pending.terms.planId,expectedPlanRevision:pending.terms.planRevision,expectedQuoteFingerprint:lineage.quoteFingerprint,serviceId:lineage.currentServiceId,...(pending.terms.quoteRequired?{quotedPrice:(pending.terms.priceAmountMinor/100).toFixed(2)}:{})}};
 }
 return {protocol:PACK_REPURCHASE_PROTOCOL,enrollmentId:input.enrollmentId,isCoach:input.actorUserId===s.enrollment.coach_user_id,isStudent:input.actorUserId===s.enrollment.student_user_id,quote,quoteError,quoteRequired:plan(db,s.enrollment).terms.quoteRequired===true,pending:pendingView};
}
export function proposePackRepurchase(db:Database.Database,input:PackProposalExpectation&{actorUserId:string;atUtc:string}):string{
 return db.transaction(()=>{
  const s=state(db,input.enrollmentId,input.actorUserId);if(input.actorUserId!==s.enrollment.coach_user_id)throw new Error('Only the original coach prepares another pack.');
  requireCoachCommercialAccess(db,{coachUserId:s.enrollment.coach_user_id,scope:'platform',atUtc:input.atUtc});
  if(s.agreements.some(a=>a.status==='proposed'))throw new Error('Review or explicitly withdraw the current proposal before preparing another pack.');
  const quote=quoteFor(db,s,input.quotedPrice);sameQuote(quote,input);
  const id=randomUUID(),revision=Math.max(0,...s.agreements.map(a=>a.revision))+1;
  const terms:CoachingAgreementTerms={...quote.terms,packRepurchase:{version:1,rootAgreementId:quote.rootAgreementId,rootServiceId:quote.rootServiceId,parentAgreementId:input.expectedPredecessorAgreementId,parentRevision:input.expectedPredecessorRevision,currentServiceId:input.serviceId,dailyPolicy:quote.dailyPolicy,quoteFingerprint:input.expectedQuoteFingerprint}};
  db.prepare("INSERT INTO traderlink_coaching_accepted_terms VALUES(?,?,?,'proposed',?,?,NULL)").run(id,input.enrollmentId,revision,JSON.stringify(terms),input.atUtc);
  event(db,input.enrollmentId,input.actorUserId,'pack_repurchase_proposed',id,input.atUtc);return id;
 }).immediate();
}
/** Called inside the ordinary acceptance transaction before ANY supersession or work. */
export function validatePackAcceptance(db:Database.Database,input:PackAcceptanceExpectation&{actorUserId:string}){
 const s=state(db,input.enrollmentId,input.actorUserId);active(s.enrollment);
 if(input.actorUserId!==s.enrollment.student_user_id)throw new Error('Only the original student accepts this pack.');
 const proposed=s.agreements.find(a=>a.id===input.agreementId),current=s.agreements.find(a=>a.status==='proposed');
 if(!proposed||proposed!==current||proposed.status!=='proposed'||proposed.acceptedAtUtc||proposed.revision!==input.expectedProposalRevision||packProposalFingerprint(proposed)!==input.expectedProposalFingerprint||!proposed.terms.packRepurchase)throw conflict();
 const lineage=proposed.terms.packRepurchase;ancestry(s.agreements,proposed);
 if(lineage.parentAgreementId!==input.expectedPredecessorAgreementId||lineage.parentRevision!==input.expectedPredecessorRevision||lineage.currentServiceId!==input.serviceId||lineage.quoteFingerprint!==input.expectedQuoteFingerprint)throw conflict();
 const quote=quoteFor(db,s,input.quotedPrice);sameQuote(quote,input);
 const {packRepurchase:_lineage,...proposedTerms}=proposed.terms;void _lineage;
 if(canonicalPackJson(proposedTerms)!==canonicalPackJson(quote.terms))throw conflict();
}
export function withdrawPackRepurchaseProposal(db:Database.Database,input:PackWithdrawalExpectation&{actorUserId:string;atUtc:string}){
 return db.transaction(()=>{
  const s=state(db,input.enrollmentId,input.actorUserId);active(s.enrollment);
  if(input.actorUserId!==s.enrollment.coach_user_id)throw new Error('Only the original coach withdraws this proposal.');
  requireCoachCommercialAccess(db,{coachUserId:s.enrollment.coach_user_id,scope:'platform',atUtc:input.atUtc});
  const current=s.agreements.find(a=>a.status==='proposed');
  if(!current||current.id!==input.agreementId||current.revision!==input.expectedProposalRevision||current.acceptedAtUtc||!current.terms.packRepurchase||packProposalFingerprint(current)!==input.expectedProposalFingerprint)throw conflict();
  // Exact saved stale proposal remains withdrawable even after the offer/predecessor changes.
  ancestry(s.agreements,current);
  const result=db.prepare("UPDATE traderlink_coaching_accepted_terms SET status='withdrawn' WHERE agreement_id=? AND enrollment_id=? AND revision=? AND status='proposed' AND accepted_at_utc IS NULL").run(current.id,input.enrollmentId,current.revision);
  if(result.changes!==1)throw conflict();event(db,input.enrollmentId,input.actorUserId,'pack_repurchase_withdrawn',current.id,input.atUtc);
 }).immediate();
}
function event(db:Database.Database,enrollmentId:string,actor:string,kind:string,id:string,at:string){db.prepare('INSERT INTO traderlink_coaching_events VALUES(?,?,?,?,?,?)').run(randomUUID(),enrollmentId,actor,kind,id,at);}
export function packAcknowledgement(db:Database.Database,input:{enrollmentId:string;agreementId:string;actorUserId:string;requestId:string;kind:PackAcknowledgement['kind'];proposalFingerprint?:string}):PackAcknowledgement{
 const s=state(db,input.enrollmentId,input.actorUserId),a=s.agreements.find(row=>row.id===input.agreementId),link=a?.terms.packRepurchase;
 if(!a||!link)throw conflict();
 return {protocol:PACK_REPURCHASE_PROTOCOL,requestId:input.requestId,kind:input.kind,enrollmentId:input.enrollmentId,agreementId:a.id,revision:a.revision,proposalFingerprint:input.proposalFingerprint??packProposalFingerprint(a),predecessorAgreementId:link.parentAgreementId,predecessorRevision:link.parentRevision,planId:a.terms.planId,planRevision:a.terms.planRevision,quoteFingerprint:link.quoteFingerprint,rootAgreementId:link.rootAgreementId,rootServiceId:link.rootServiceId,serviceId:link.currentServiceId,href:`/coaching/enrollments/${encodeURIComponent(input.enrollmentId)}`};
}
/** Paid checkout shares the existing canonical key; this gate never calls a provider. */
export function requireAcceptedRepurchase(db:Database.Database,input:{enrollmentId:string;agreementId:string;actorUserId:string}){
 const s=state(db,input.enrollmentId,input.actorUserId);active(s.enrollment);
 const a=s.agreements.find(row=>row.id===input.agreementId);
 if(input.actorUserId!==s.enrollment.student_user_id||!a?.terms.packRepurchase||a.status!=='accepted'||!a.acceptedAtUtc)throw new Error('Choose your accepted new pack before paying.');
 ancestry(s.agreements,a);
}
/** A repurchase gives a fresh local total, never a fresh daily submission history. */
export function requirePackSubmissionAllowance(db:Database.Database,input:{enrollmentId:string;agreementId:string;serviceId:string;actorUserId:string;quantity:number;atUtc:string}):boolean{
 if(!db.prepare("SELECT 1 FROM traderlink_coaching_accepted_terms WHERE enrollment_id=? AND accepted_at_utc IS NOT NULL AND json_type(terms_json,'$.packRepurchase')='object' AND (agreement_id=? OR json_extract(terms_json,'$.packRepurchase.rootAgreementId')=?)").get(input.enrollmentId,input.agreementId,input.agreementId))return false;
 const s=state(db,input.enrollmentId,input.actorUserId),target=s.agreements.find(a=>a.id===input.agreementId);
 if(!target||!target.acceptedAtUtc)return false;
 const offer=target.terms.builderConfig?.offers.trade_review;if(offer?.tradeReviewFormat!=='pack')return false;
 const descendants=s.agreements.filter(a=>a.acceptedAtUtc&&a.terms.packRepurchase);
 if(!target.terms.packRepurchase&&!descendants.some(a=>a.terms.packRepurchase?.rootAgreementId===target.id))return false;
 const root=ancestry(s.agreements,target),targetPack=pack(target.terms);
 if(targetPack.item.planItemId!==input.serviceId||!Number.isInteger(input.quantity)||input.quantity<1)throw new Error('Choose at least one trade in this pack.');
 const members=new Map<string,string>();
 for(const candidate of s.agreements.filter(a=>a.acceptedAtUtc)){
  if(candidate.id!==root.root.id&&candidate.terms.packRepurchase?.rootAgreementId!==root.root.id)continue;
  const verified=ancestry(s.agreements,candidate);if(verified.root.id!==root.root.id)throw conflict();members.set(candidate.id,pack(candidate.terms).item.planItemId);
 }
 const history=db.prepare(`SELECT r.review_id,r.agreement_id,r.plan_item_id,r.submitted_at_utc at,count(t.round_trip_id) quantity,
  coalesce((SELECT CASE WHEN json_valid(e.object_id) THEN json_extract(e.object_id,'$.quantity') END FROM traderlink_coaching_events e WHERE e.enrollment_id=r.enrollment_id AND e.kind='review_submission_quantity' AND json_valid(e.object_id) AND CASE WHEN json_valid(e.object_id) THEN json_extract(e.object_id,'$.reviewId') END=r.review_id ORDER BY e.created_at_utc LIMIT 1),count(t.round_trip_id)) submittedQuantity
  FROM traderlink_coaching_reviews r LEFT JOIN traderlink_coaching_review_trades t ON t.review_id=r.review_id WHERE r.enrollment_id=? AND r.submitted_at_utc IS NOT NULL GROUP BY r.review_id`).all(input.enrollmentId) as {review_id:string;agreement_id:string;plan_item_id:string;at:string;quantity:number;submittedQuantity:number}[];
 let used=0,daily=0;const today=submissionDate(input.atUtc);
 for(const row of history){
  if(!Number.isSafeInteger(row.quantity)||row.quantity<0||!Number.isSafeInteger(row.submittedQuantity)||row.submittedQuantity<0)throw new Error('The submitted trade allowance could not be verified.');
  if(row.agreement_id===target.id&&row.plan_item_id===input.serviceId)used+=row.quantity;
  if(members.get(row.agreement_id)===row.plan_item_id&&submissionDate(row.at)===today)daily+=row.submittedQuantity;
 }
 if(used+input.quantity>targetPack.limits.perPeriod){const left=Math.max(0,targetPack.limits.perPeriod-used);throw new CoachingSubmissionLimitError('pack',left?`This pack has ${left} ${left===1?'trade review':'trade reviews'} remaining.`:'All trade reviews in this pack have been used.');}
 if(root.dailyPolicy.perDay!==undefined&&daily+input.quantity>root.dailyPolicy.perDay){const left=Math.max(0,root.dailyPolicy.perDay-daily);throw new CoachingSubmissionLimitError('daily',left?`This submission exceeds the daily limit. You can submit ${left} more ${left===1?'trade':'trades'} today.`:'You’ve reached the daily limit. You can submit more trades tomorrow if you still have reviews available.');}
 return true;
}
