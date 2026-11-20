// @vitest-environment node
import {randomUUID,createHash} from 'node:crypto';
import Database from 'better-sqlite3';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {TraderLinkPlatformError} from '@/src/modules/platform/server/database/platform-migration-contract';
import {independentCoachingStatements} from './independent-coaching-storage';
import {coachingDirectPaymentStatements} from './coaching-direct-payment-storage';
import {CoachingDirectPaymentRepository} from './coaching-direct-payment-repository';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import {performIndependentCoachingAction} from './independent-coaching-actions';
import {readPackRepurchaseStatus,requirePackSubmissionAllowance,requireAcceptedRepurchase} from './independent-coaching-pack-repurchase';
import {PACK_REPURCHASE_PROTOCOL,validatePackAcknowledgement,PackActionRollbackRejection,validatePackRejection} from '../contracts/coaching-pack-repurchase';
import type {CoachingAgreementTerms} from '../contracts/coaching-agreements';

// Isolated native SQL/transaction controls, NOT native identity/provider acceptance.
vi.mock('./coaching-commercial-access',()=>({requireCoachCommercialAccess:vi.fn()}));
vi.mock('./coaching-student-platform-access',()=>({requireStandaloneStudentCoachingAccess:vi.fn()}));
const boundary=vi.hoisted(()=>({checkout:vi.fn<(input:{purchaseId:string})=>Promise<{purchaseUrl:string}>>(async()=>({purchaseUrl:'https://checkout.invalid/synthetic-only'})),actor:'',db:null as Database.Database|null,closeError:false}));
vi.mock('./coaching-whop-runtime',()=>({loadCoachingWhopRuntime:()=>({environment:'sandbox',client:{},identityKey:'synthetic-test-only',platformAccountId:'synthetic-platform',commissionPolicyVersion:'test',commissionBasisPoints:0})}));
vi.mock('./independent-coaching-checkout',()=>({beginIndependentCoachingCheckout:boundary.checkout}));
// This route-adapter control remains explicitly synthetic. Real invocation /
// session/repository/client controls live in the new authority test file.
vi.mock('./independent-coaching-checkout-authority',()=>({IndependentCheckoutInvocation:{fromRequest:()=>({syntheticAdapterOnly:true})}}));
vi.mock('@/src/modules/platform/server/database/open-platform-database',()=>({withPlatformDatabase:(_options:unknown,fn:(db:Database.Database)=>unknown)=>{const result=fn(boundary.db!);if(boundary.closeError)throw new Error('Synthetic database close failure after operation');return result;}}));
vi.mock('./coaching-payment-readiness',()=>({independentCoachingStorageReady:()=>true}));
vi.mock('./coaching-pilot-request-identity',()=>({requireCoachingPilotRequestIdentity:()=>({scope:{userId:boundary.actor}})}));
vi.mock('@/src/modules/platform/server/authentication/platform-mutation-request-security',()=>({requirePlatformMutationRequest:vi.fn()}));
import {POST} from '@/app/api/coaching/action/route';

const databases:Database.Database[]=[],at='2026-11-19T18:00:00.000Z';
afterEach(()=>{for(const db of databases.splice(0))db.close();boundary.checkout.mockClear();boundary.db=null;boundary.closeError=false;vi.restoreAllMocks();});
function fixture(cap:number|null=2,priceAmountMinor=0){
 const db=new Database(':memory:');databases.push(db);db.pragma('foreign_keys=ON');
 db.exec('CREATE TABLE platform_users(user_id TEXT PRIMARY KEY); CREATE TABLE journal_accounts(account_id TEXT PRIMARY KEY);');
 const coach=randomUUID(),student=randomUUID(),other=randomUUID(),context=randomUUID(),planId=randomUUID(),enrollmentId=randomUUID(),rootId=randomUUID(),serviceId=randomUUID(),rootReview=randomUUID();
 for(const id of [coach,student,other])db.prepare('INSERT INTO platform_users VALUES(?)').run(id);
 for(const sql of independentCoachingStatements)db.exec(sql);
 const terms:CoachingAgreementTerms={planId,planRevision:1,planName:'Isolated pack fixture',description:'',priceAmountMinor,currency:'USD',billingCadence:'one_time',paymentInstructions:'',requiredDiscordRoleId:null,autoArchiveAfterDays:null,startDate:null,customIntervalDays:null,dueTimeUtc:'18:00',builderConfig:{about:'',offers:{trade_review:{details:'',resources:[],tradeReviewFormat:'pack',reviewSchedule:'on_request',submissionLimits:{perPeriod:3,...(cap===null?{}:{perDay:cap})}}}},items:[{planItemId:serviceId,itemType:'trade_review',frequency:'once',coveragePeriod:'single_item',quantity:3,dueOffsetDays:5,selectionMode:'student',followUpDays:0,measurementKind:'trades',plannedMinutes:null,timelineEnabled:false,reviewDepth:'standard',ordinal:0,focusAreas:[]}]};
 db.prepare('INSERT INTO traderlink_coaching_contexts VALUES(?,?,?,?,?)').run(context,coach,JSON.stringify({displayName:'Fixture coach',headline:'',biography:'',deliverySummary:''}),at,at);
 db.prepare("INSERT INTO traderlink_coaching_plans VALUES(?,?,1,'active',?,?)").run(planId,context,at,at);
 db.prepare('INSERT INTO traderlink_coaching_plan_versions VALUES(?,1,?,?)').run(planId,JSON.stringify(terms),at);
 db.prepare("INSERT INTO traderlink_coaching_enrollments VALUES(?,?,?,?,'active',?,?)").run(enrollmentId,context,planId,student,at,at);
 db.prepare("INSERT INTO traderlink_coaching_accepted_terms VALUES(?,?,1,'accepted',?,?,?)").run(rootId,enrollmentId,JSON.stringify(terms),at,at);
 db.prepare("INSERT INTO traderlink_coaching_reviews(review_id,enrollment_id,agreement_id,plan_item_id,occurrence_index,kind,due_at_utc,status,created_at_utc,updated_at_utc) VALUES(?,?,?,?,0,'trade','2026-12-04T18:00:00.000Z','awaiting_submission',?,?)").run(rootReview,enrollmentId,rootId,serviceId,at,at);
 const repo=new IndependentCoachingRepository(db);
 const status=(actor=coach,quotedPrice?:string)=>readPackRepurchaseStatus(db,{enrollmentId,actorUserId:actor,quotedPrice});
 const act=(actor:string,data:Record<string,unknown>)=>performIndependentCoachingAction(db,{actorUserId:actor,atUtc:at,data,checkAdmission:vi.fn(),verifySelection:()=>[]});
 const action=(actor:string,intent:string,fields:Record<string,unknown>,requestId=randomUUID())=>act(actor,{protocol:PACK_REPURCHASE_PROTOCOL,requestId,intent,...fields});
 const propose=()=>{
  const q=status().quote!;const requestId=randomUUID(),raw={protocol:PACK_REPURCHASE_PROTOCOL,requestId,intent:'propose_pack_repurchase',...q.expectation};
  const value=act(coach,raw);if(!validatePackAcknowledgement(value,{requestId,kind:'proposed',enrollmentId,quoteFingerprint:q.expectation.expectedQuoteFingerprint}))throw Error('Invalid fixture proposal acknowledgment');
  return {raw,ack:value};
 };
 const accept=()=>{
  const p=status(student).pending!,requestId=randomUUID();const value=action(student,'accept_pack_repurchase',{...p.expectation,olderTrades:'student_only'},requestId);
  if(!validatePackAcknowledgement(value,{requestId,kind:'accepted',enrollmentId,agreementId:p.agreementId,proposalFingerprint:p.fingerprint}))throw Error('Invalid fixture acceptance acknowledgment');return value;
 };
 function updatePlan(change:(t:CoachingAgreementTerms)=>CoachingAgreementTerms){
  const row=db.prepare('SELECT max(revision) revision FROM traderlink_coaching_plan_versions WHERE plan_id=?').get(planId) as {revision:number};
  const prior=db.prepare('SELECT terms_json FROM traderlink_coaching_plan_versions WHERE plan_id=? AND revision=?').get(planId,row.revision) as {terms_json:string};const next=change(JSON.parse(prior.terms_json));const revision=row.revision+1;
  db.prepare('INSERT INTO traderlink_coaching_plan_versions VALUES(?,?,?,?)').run(planId,revision,JSON.stringify({...next,planRevision:revision}),at);db.prepare('UPDATE traderlink_coaching_plans SET revision=? WHERE plan_id=?').run(revision,planId);
 }
 function history(agreementId:string,quantity:number,time:string,original=quantity){
  const id=randomUUID(),row=db.prepare('SELECT coalesce(max(occurrence_index),-1)+1 n FROM traderlink_coaching_reviews WHERE agreement_id=? AND plan_item_id=?').get(agreementId,serviceId) as {n:number};
  db.prepare("INSERT INTO traderlink_coaching_reviews(review_id,enrollment_id,agreement_id,plan_item_id,occurrence_index,kind,status,submitted_at_utc,created_at_utc,updated_at_utc) VALUES(?,?,?,?,?,'trade','ready',?,?,?)").run(id,enrollmentId,agreementId,serviceId,row.n,time,time,time);
  for(let i=0;i<quantity;i++)db.prepare('INSERT INTO traderlink_coaching_review_trades(review_id,round_trip_id,logical_trade_id,updated_at_utc) VALUES(?,?,?,?)').run(id,randomUUID(),randomUUID(),time);
  db.prepare('INSERT INTO traderlink_coaching_events VALUES(?,?,?,?,?,?)').run(randomUUID(),enrollmentId,student,'review_submission_quantity',JSON.stringify({reviewId:id,quantity:original}),time);return id;
 }
 const allowance=(agreementId:string,quantity:number,time=at)=>requirePackSubmissionAllowance(db,{enrollmentId,agreementId,serviceId,actorUserId:student,quantity,atUtc:time});
 const snapshot=()=>({agreements:db.prepare('SELECT * FROM traderlink_coaching_accepted_terms ORDER BY revision').all(),reviews:db.prepare('SELECT * FROM traderlink_coaching_reviews ORDER BY review_id').all(),grants:db.prepare('SELECT * FROM traderlink_coaching_journal_access').all(),receipts:db.prepare('SELECT * FROM traderlink_coaching_action_receipts ORDER BY request_id').all()});
 return {db,repo,coach,student,other,enrollmentId,rootId,serviceId,rootReview,planId,status,act,action,propose,accept,updatePlan,history,allowance,snapshot};
}

describe('pack repurchase native SQLite controls (isolated synthetic fixtures)',()=>{
 it('reads current quote without writing receipts, work or agreements',()=>{
  const f=fixture(),before=f.snapshot();expect(f.status().quote).not.toBeNull();f.status(f.student);expect(f.snapshot()).toEqual(before);expect(f.db.pragma('foreign_key_check')).toEqual([]);
 });
 it('creates one exact successor under the same enrollment and replays its stable receipt',()=>{
  const f=fixture(),{raw,ack}=f.propose();expect(f.act(f.coach,raw)).toEqual(ack);expect(f.status().pending?.agreementId).toBe(ack.agreementId);
  expect(()=>f.act(f.coach,{...raw,expectedPlanRevision:2})).toThrow('changed');expect(f.repo.agreements(f.enrollmentId,f.coach)).toHaveLength(2);
 });
 it('rejects another pending proposal without silently withdrawing the first',()=>{
  const f=fixture(),first=f.propose(),before=f.snapshot();expect(()=>f.propose()).toThrow(PackActionRollbackRejection);expect(f.snapshot()).toEqual(before);expect(f.status().pending?.agreementId).toBe(first.ack.agreementId);
 });
 it('rejects a stale predecessor or plan fingerprint before any proposal write',()=>{
  const f=fixture(),q=f.status().quote!,before=f.snapshot();
  expect(()=>f.action(f.coach,'propose_pack_repurchase',{...q.expectation,expectedPredecessorAgreementId:randomUUID()})).toThrow();
  expect(()=>f.action(f.coach,'propose_pack_repurchase',{...q.expectation,expectedQuoteFingerprint:'f'.repeat(64)})).toThrow();expect(f.snapshot()).toEqual(before);
 });
 it('requires the original coach/student and blocks the ordinary acceptance bypass',()=>{
  const f=fixture(),q=f.status().quote!;expect(()=>f.action(f.student,'propose_pack_repurchase',q.expectation)).toThrow(PackActionRollbackRejection);expect(()=>f.status(f.other)).toThrow('unavailable');
  f.propose();const p=f.status().pending!,before=f.snapshot();expect(()=>f.action(f.coach,'accept_pack_repurchase',p.expectation)).toThrow(PackActionRollbackRejection);
  expect(()=>f.action(f.student,'accept_agreement',{enrollmentId:f.enrollmentId,agreementId:p.agreementId})).toThrow('exact new-pack');expect(f.snapshot()).toEqual(before);
 });
 it('accepts only the exact displayed proposal and preserves old work after supersession',()=>{
  const f=fixture(),before=f.repo.review(f.rootReview,f.student);f.propose();const p=f.status().pending!;
  expect(()=>f.action(f.student,'accept_pack_repurchase',{...p.expectation,expectedProposalFingerprint:'f'.repeat(64)})).toThrow();
  const ack=f.accept();expect(f.repo.agreements(f.enrollmentId,f.coach).find(a=>a.agreementId===f.rootId)?.status).toBe('superseded');expect(f.repo.review(f.rootReview,f.student)).toEqual(before);
  expect(f.db.prepare('SELECT count(*) n FROM traderlink_coaching_journal_access').get()).toEqual({n:0});expect(f.repo.agreements(f.enrollmentId,f.coach).find(a=>a.agreementId===ack.agreementId)?.status).toBe('accepted');
 });
 it('keeps an exhausted old pack separate from the fresh new lifetime total',()=>{
  const f=fixture();f.history(f.rootId,3,'2026-11-18T18:00:00.000Z');f.propose();const a=f.accept();expect(f.allowance(a.agreementId,2)).toBe(true);expect(()=>f.allowance(f.rootId,1)).toThrow('All trade reviews');
 });
 it.each(['old-first','new-first'])('shares original same-day quantities across old/new packs (%s)',order=>{
  const f=fixture();f.propose();const a=f.accept(),first=order==='old-first'?f.rootId:a.agreementId,next=order==='old-first'?a.agreementId:f.rootId;
  f.history(first,2,at);expect(()=>f.allowance(next,1)).toThrow('daily limit');
 });
 it('uses Eastern midnight, original quantities and unchanged unlimited caps',()=>{
  const f=fixture();f.propose();const a=f.accept();f.history(f.rootId,0,'2026-11-20T04:59:00.000Z',2);
  expect(()=>f.allowance(a.agreementId,1,'2026-11-20T04:59:30.000Z')).toThrow('daily limit');expect(f.allowance(a.agreementId,1,'2026-11-20T05:00:00.000Z')).toBe(true);
  const unlimited=fixture(null);unlimited.propose();const b=unlimited.accept();unlimited.history(unlimited.rootId,3,at);expect(unlimited.allowance(b.agreementId,3)).toBe(true);
 });
 it('includes legacy roots and second-generation successors in either direction',()=>{
  const f=fixture();f.propose();const second=f.accept();f.propose();const third=f.accept();f.history(second.agreementId,1,at);f.history(third.agreementId,1,at);expect(()=>f.allowance(f.rootId,1)).toThrow('daily limit');
 });
 it('refuses changed caps and corrupt lineage without resetting usage',()=>{
  const f=fixture();f.updatePlan(t=>({...t,builderConfig:{...t.builderConfig!,offers:{trade_review:{...t.builderConfig!.offers.trade_review!,submissionLimits:{perPeriod:3,perDay:1}}}}}));expect(f.status().quote).toBeNull();expect(f.status().quoteError).toContain('Changing the daily');
  const other=fixture();other.propose();const a=other.accept(),row=other.repo.agreements(other.enrollmentId,other.coach).find(x=>x.agreementId===a.agreementId)!;
  other.db.prepare('UPDATE traderlink_coaching_accepted_terms SET terms_json=? WHERE agreement_id=?').run(JSON.stringify({...row.terms,packRepurchase:{...row.terms.packRepurchase!,parentAgreementId:a.agreementId}}),a.agreementId);expect(()=>other.allowance(a.agreementId,1)).toThrow('history');
 });
 it('permits exact stale-proposal withdrawal then a separate current-quote proposal',()=>{
  const f=fixture();f.propose();const p=f.status().pending!;f.updatePlan(t=>({...t,description:'New current quote'}));const before=f.snapshot();
  expect(()=>f.action(f.student,'accept_pack_repurchase',p.expectation)).toThrow();expect(f.snapshot()).toEqual(before);
  const raw={protocol:PACK_REPURCHASE_PROTOCOL,requestId:randomUUID(),intent:'withdraw_pack_repurchase_proposal',enrollmentId:f.enrollmentId,agreementId:p.agreementId,expectedProposalRevision:p.revision,expectedProposalFingerprint:p.fingerprint};
  const result=f.act(f.coach,raw);expect(f.act(f.coach,raw)).toEqual(result);const next=f.propose();expect(next.ack.agreementId).not.toBe(p.agreementId);
  expect(f.act(f.coach,raw)).toEqual(result);expect(f.status().pending?.agreementId).toBe(next.ack.agreementId);expect(()=>f.act(f.coach,{...raw,agreementId:next.ack.agreementId})).toThrow('changed');
 });
 it('refuses wrong-actor, wrong-fingerprint and accepted-proposal withdrawal',()=>{
  const f=fixture();f.propose();const p=f.status().pending!,fields={enrollmentId:f.enrollmentId,agreementId:p.agreementId,expectedProposalRevision:p.revision,expectedProposalFingerprint:p.fingerprint};
  expect(()=>f.action(f.student,'withdraw_pack_repurchase_proposal',fields)).toThrow(PackActionRollbackRejection);expect(()=>f.action(f.coach,'withdraw_pack_repurchase_proposal',{...fields,expectedProposalFingerprint:'f'.repeat(64)})).toThrow();f.accept();expect(()=>f.action(f.coach,'withdraw_pack_repurchase_proposal',fields)).toThrow();
 });
 it('allows only one acceptance/withdrawal transition in either serialized race order',()=>{
  for(const order of ['accept','withdraw']){const f=fixture();f.propose();const p=f.status().pending!,withdraw=()=>f.action(f.coach,'withdraw_pack_repurchase_proposal',{enrollmentId:f.enrollmentId,agreementId:p.agreementId,expectedProposalRevision:p.revision,expectedProposalFingerprint:p.fingerprint});
   if(order==='accept'){f.accept();expect(withdraw).toThrow();}else{withdraw();expect(()=>f.action(f.student,'accept_pack_repurchase',p.expectation)).toThrow();}
   expect(f.repo.agreements(f.enrollmentId,f.coach).filter(a=>a.status==='accepted')).toHaveLength(1);
  }
 });
 it('does not fulfill a paid successor merely because its agreement was accepted',()=>{
  const f=fixture();f.updatePlan(t=>({...t,priceAmountMinor:2500}));f.propose();const a=f.accept();expect(f.db.prepare('SELECT count(*) n FROM traderlink_coaching_reviews WHERE agreement_id=?').get(a.agreementId)).toEqual({n:0});expect(f.db.prepare('SELECT count(*) n FROM traderlink_coaching_work WHERE agreement_id=?').get(a.agreementId)).toEqual({n:0});
 });
 it('normalizes an explicit decimal quote and refuses a changed student quote',()=>{
  const f=fixture();f.updatePlan(t=>({...t,quoteRequired:true}));const q=f.status(f.coach,'25').quote!;
  expect(q.expectation.quotedPrice).toBe('25.00');f.action(f.coach,'propose_pack_repurchase',q.expectation);const p=f.status(f.student).pending!;
  expect(()=>f.action(f.student,'accept_pack_repurchase',{...p.expectation,quotedPrice:'10.00'})).toThrow();
  const accepted=f.accept();expect(f.repo.agreements(f.enrollmentId,f.student).find(a=>a.agreementId===accepted.agreementId)?.terms.priceAmountMinor).toBe(2500);
 });
 it('preserves an old unknown checkout purchase after supersession (synthetic isolated storage, no provider)',()=>{
  const f=fixture(2,2500);f.db.prepare('DELETE FROM traderlink_coaching_reviews WHERE review_id=?').run(f.rootReview);
  for(const sql of coachingDirectPaymentStatements)f.db.exec(sql);
  const payments=new CoachingDirectPaymentRepository(f.db),agreement=f.repo.agreements(f.enrollmentId,f.student)[0];
  const purchaseId=createHash('sha256').update(JSON.stringify(['sandbox',f.student,f.enrollmentId,f.rootId,'initial-purchase-v1'])).digest('hex');
  payments.recordPurchase({version:1,purchaseId,environment:'sandbox',coachUserId:f.coach,studentUserId:f.student,merchantAccountId:'synthetic-merchant',providerOffer:{productId:'synthetic-product',variantId:'synthetic-variant'},agreement,price:{amountMinor:2500,currency:'USD'},commission:{policyVersion:'synthetic-policy',basisPoints:0,rounding:'half_up'},allocations:[{planItemId:f.serviceId,occurrences:1}],createdAtUtc:at});
  payments.recordCheckout(purchaseId,{checkoutId:'synthetic-unknown-checkout',purchaseUrl:'https://sandbox.whop.com/synthetic-fixture-no-send'},at);
  const before={purchase:payments.readPurchase(purchaseId),checkout:payments.readCheckout(purchaseId)};f.propose();const next=f.accept();
  expect({purchase:payments.readPurchase(purchaseId),checkout:payments.readCheckout(purchaseId)}).toEqual(before);
  expect(payments.readPurchase(purchaseId)?.agreement.agreementId).toBe(f.rootId);expect(next.agreementId).not.toBe(f.rootId);
  expect(f.db.prepare('SELECT count(*) n FROM traderlink_coaching_direct_purchases').get()).toEqual({n:1});expect(f.db.prepare('SELECT count(*) n FROM traderlink_coaching_direct_purchase_funding').get()).toEqual({n:0});expect(boundary.checkout).not.toHaveBeenCalled();
 });
 it('requires a genuine accepted new pack for the new checkout intent',()=>{
  const f=fixture();expect(()=>requireAcceptedRepurchase(f.db,{actorUserId:f.student,enrollmentId:f.enrollmentId,agreementId:f.rootId})).toThrow();const p=f.propose();expect(()=>requireAcceptedRepurchase(f.db,{actorUserId:f.student,enrollmentId:f.enrollmentId,agreementId:p.ack.agreementId})).toThrow();f.accept();expect(()=>requireAcceptedRepurchase(f.db,{actorUserId:f.coach,enrollmentId:f.enrollmentId,agreementId:p.ack.agreementId})).toThrow();
 });
 it('routes both explicit checkout intents to one canonical purchase (synthetic adapter, no provider/funding)',async()=>{
  const f=fixture();f.propose();const a=f.accept();boundary.db=f.db;boundary.actor=f.student;
  for(const intent of ['begin_checkout','begin_pack_checkout']){
   const response=await POST(new Request('https://test.invalid/api/coaching/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({intent,protocol:PACK_REPURCHASE_PROTOCOL,requestId:randomUUID(),enrollmentId:f.enrollmentId,agreementId:a.agreementId})}));expect(response.status).toBe(200);
  }
  const ids=boundary.checkout.mock.calls.map(call=>call[0].purchaseId);expect(ids).toHaveLength(2);expect(new Set(ids).size).toBe(1);expect(ids[0]).toBe(createHash('sha256').update(JSON.stringify(['sandbox',f.student,f.enrollmentId,a.agreementId,'initial-purchase-v1'])).digest('hex'));
 });
 it('V2 proves atomic rollback only after unwind, with exact original payload binding',()=>{
  const f=fixture(),q=f.status().quote!,raw={protocol:PACK_REPURCHASE_PROTOCOL,requestId:randomUUID(),intent:'propose_pack_repurchase',...q.expectation,expectedQuoteFingerprint:'f'.repeat(64)},before=f.snapshot();
  let caught:unknown;try{f.act(f.coach,raw);}catch(error){caught=error;}
  expect(caught).toBeInstanceOf(PackActionRollbackRejection);
  expect((caught as PackActionRollbackRejection).binding).toEqual({actorUserId:f.coach,requestId:raw.requestId,intent:raw.intent,enrollmentId:f.enrollmentId,payloadSha256:createHash('sha256').update(JSON.stringify(raw)).digest('hex')});
  expect(f.db.inTransaction).toBe(false);expect(f.snapshot()).toEqual(before);
 });
 it('V2 keeps nested transaction, failed proof read and existing receipt errors unknown',()=>{
  const f=fixture(),q=f.status().quote!,raw={protocol:PACK_REPURCHASE_PROTOCOL,requestId:randomUUID(),intent:'propose_pack_repurchase',...q.expectation,expectedQuoteFingerprint:'f'.repeat(64)};
  f.db.transaction(()=>{try{f.act(f.coach,raw);throw Error('Expected refusal');}catch(error){expect(error).not.toBeInstanceOf(PackActionRollbackRejection);expect(f.db.inTransaction).toBe(true);}}).immediate();
  const prepare=f.db.prepare.bind(f.db),spy=vi.spyOn(f.db,'prepare').mockImplementation((sql:string)=>{if(sql==='SELECT 1 FROM traderlink_coaching_action_receipts WHERE actor_user_id=? AND request_id=?')throw Error('Synthetic read unavailable');return prepare(sql);});
  try{f.act(f.coach,raw);throw Error('Expected refusal');}catch(error){expect(error).not.toBeInstanceOf(PackActionRollbackRejection);}spy.mockRestore();
  const prior=f.propose();try{f.act(f.coach,{...prior.raw,expectedPlanRevision:99});throw Error('Expected refusal');}catch(error){expect(error).not.toBeInstanceOf(PackActionRollbackRejection);}
 });
 it('V2 publishes a raw-byte-bound rejection only after wrapper close succeeds',async()=>{
  const f=fixture(),q=f.status().quote!,raw={protocol:PACK_REPURCHASE_PROTOCOL,requestId:randomUUID(),intent:'propose_pack_repurchase',...q.expectation,expectedQuoteFingerprint:'f'.repeat(64)};
  boundary.db=f.db;boundary.actor=f.coach;const body=JSON.stringify(raw,null,2)+'\n',hash=createHash('sha256').update(body).digest('hex');
  const response=await POST(new Request('https://test.invalid/api/coaching/action',{method:'POST',headers:{'content-type':'application/json'},body}));
  expect(response.status).toBe(400);const value=await response.json();expect(validatePackRejection(value,raw,hash)).toBe(true);expect(value.bodySha256).not.toBe(createHash('sha256').update(JSON.stringify(raw)).digest('hex'));
  boundary.closeError=true;const closeFailure=await POST(new Request('https://test.invalid/api/coaching/action',{method:'POST',headers:{'content-type':'application/json'},body}));
  expect(closeFailure.status).toBe(400);expect((await closeFailure.json()).kind).toBeUndefined();expect(f.db.prepare('SELECT count(*) n FROM traderlink_coaching_action_receipts').get()).toEqual({n:0});
 });
 it('V2 keeps committed action and original receipt after a response-close failure, and retries exactly',async()=>{
  const f=fixture(),q=f.status().quote!,raw={protocol:PACK_REPURCHASE_PROTOCOL,requestId:randomUUID(),intent:'propose_pack_repurchase',...q.expectation};boundary.db=f.db;boundary.actor=f.coach;boundary.closeError=true;
  const send=()=>POST(new Request('https://test.invalid/api/coaching/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(raw)}));
  const first=await send();expect(first.status).toBe(400);expect((await first.json()).kind).toBeUndefined();
  const saved=f.status().pending!;expect(saved).not.toBeNull();expect(f.db.prepare('SELECT count(*) n FROM traderlink_coaching_action_receipts').get()).toEqual({n:1});
  boundary.closeError=false;const retry=await send();expect(retry.status).toBe(200);expect(validatePackAcknowledgement(await retry.json(),{requestId:raw.requestId,kind:'proposed',enrollmentId:f.enrollmentId,agreementId:saved.agreementId})).toBe(true);expect(f.repo.agreements(f.enrollmentId,f.coach)).toHaveLength(2);
 });
 it('V2 rolls back action writes before a sanitized rejection and never labels provider failure as rollback',async()=>{
  const f=fixture(),q=f.status().quote!,before=f.snapshot();f.db.exec("CREATE TRIGGER synthetic_receipt_failure BEFORE INSERT ON traderlink_coaching_action_receipts BEGIN SELECT RAISE(ABORT,'Synthetic internal driver failure'); END");
  expect(()=>f.action(f.coach,'propose_pack_repurchase',q.expectation)).toThrow(PackActionRollbackRejection);expect(f.snapshot()).toEqual(before);
  boundary.db=f.db;boundary.actor=f.student;boundary.checkout.mockRejectedValueOnce(new Error('Synthetic unknown provider operation'));
  const response=await POST(new Request('https://test.invalid/api/coaching/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({intent:'begin_checkout',enrollmentId:f.enrollmentId,agreementId:f.rootId})}));
  expect(response.status).toBe(400);expect((await response.json()).kind).toBeUndefined();expect(boundary.checkout).toHaveBeenCalledOnce();
 });
 it('V2 checkout access denial uses plain copy and stays UNKNOWN for both intents',async()=>{
  const f=fixture(2,2500);f.propose();const accepted=f.accept();boundary.db=f.db;boundary.actor=f.student;
  for(const intent of ['begin_checkout','begin_pack_checkout']){
   boundary.checkout.mockRejectedValueOnce(new TraderLinkPlatformError('TRADERLINK_WORKSPACE_ACCESS_DENIED'));
   const response=await POST(new Request('https://test.invalid/api/coaching/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({intent,protocol:PACK_REPURCHASE_PROTOCOL,requestId:randomUUID(),enrollmentId:f.enrollmentId,agreementId:accepted.agreementId})}));
   expect(response.status).toBe(403);const value=await response.json();expect(value.kind).toBeUndefined();expect(value.error).toContain('Reopen the accepted agreement');expect(value.error).not.toMatch(/TRADERLINK_|SQLITE|native|ticket/);
  }
 });

});
