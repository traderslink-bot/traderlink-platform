// @vitest-environment node
import Database from 'better-sqlite3';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {IndependentCoachingReviewImages} from './independent-coaching-review-images';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import {independentCoachingStatements} from './independent-coaching-storage';
import {studentTradeReplacementPeriod} from '../contracts/coaching-student-trade-replacement';
import type {CoachingAgreementTerms} from '../contracts/coaching-agreements';
vi.mock('./coaching-commercial-access',()=>({requireCoachCommercialAccess:vi.fn()}));
vi.mock('./coaching-student-platform-access',()=>({requireStandaloneStudentCoachingAccess:vi.fn()}));
vi.mock('./independent-coaching-trade-eligibility',()=>({independentCoachingUnavailableTrades:()=>new Set()}));
const databases:Database.Database[]=[];
afterEach(()=>{vi.restoreAllMocks();for(const db of databases.splice(0))db.close();});
function fixture(perDay?:number,format?:'recurring'|'pack',startDate:string|null=null,deliveryDayCount?:'calendar'|'weekdays'){
 const db=new Database(':memory:');databases.push(db);db.pragma('foreign_keys=OFF');for(const statement of independentCoachingStatements)db.exec(statement);
 db.prepare("INSERT INTO traderlink_coaching_reviews(review_id,enrollment_id,agreement_id,plan_item_id,occurrence_index,kind,status,created_at_utc,updated_at_utc) VALUES('first','enrollment','agreement','item',0,'trade','awaiting_submission','2026-11-02T12:00:00Z','2026-11-02T12:00:00Z')").run();
 const repo=new IndependentCoachingRepository(db);
 vi.spyOn(repo,'enrollment').mockReturnValue({coach_user_id:'coach',student_user_id:'student',status:'active'} as ReturnType<typeof repo.enrollment>);
 const terms:CoachingAgreementTerms={planId:'plan',planRevision:1,planName:'Trade requests',description:'',priceAmountMinor:0,currency:'USD',billingCadence:'weekly',paymentInstructions:'',requiredDiscordRoleId:null,autoArchiveAfterDays:null,customIntervalDays:null,startDate,dueTimeUtc:'17:00',tradeReviewSelectionPolicy:{version:1,mode:'require_quantity_when_available',planItemIds:['item']},builderConfig:{about:'',offers:{trade_review:{details:'',resources:[],...(deliveryDayCount?{deliveryDayCount}:{}),...(format?{tradeReviewFormat:format,reviewSchedule:'on_request' as const}:{}),submissionLimits:{perPeriod:7,...(perDay===undefined?{}:{perDay})}}}},items:[{planItemId:'item',itemType:'trade_review',frequency:format==='pack'?'once':'weekly',coveragePeriod:'single_item',quantity:7,dueOffsetDays:5,timelineEnabled:false,selectionMode:'student',ordinal:0,followUpDays:0,measurementKind:'trades',plannedMinutes:null,reviewDepth:'standard'}]};
 vi.spyOn(repo,'agreements').mockReturnValue([{agreementId:'agreement',acceptedAtUtc:'2026-11-02T12:00:00Z',terms}] as unknown as ReturnType<typeof repo.agreements>);
 vi.spyOn(repo,'journalAccess').mockReturnValue({missing:[],accountId:'account',accountAvailable:true,reviewAccountMismatch:false,scopes:['trades']});
 vi.spyOn(repo,'studentContext').mockReturnValue({notes:null,goals:{body:'Goal',revision:1},history:[]});
 const send=(reviewId:string,ids:string[],atUtc:string)=>repo.submitReview({reviewId,actorUserId:'student',roundTripIds:ids,selectedDays:[],atUtc,verifySelection:values=>values.map(id=>({roundTripId:id,logicalTradeId:id,tradingDate:'2026-10-01'}))});
 const next=()=>String((db.prepare("SELECT review_id FROM traderlink_coaching_reviews WHERE status='awaiting_submission' ORDER BY occurrence_index LIMIT 1").get() as {review_id:string}).review_id);
 return {db,repo,send,next,terms};
}
describe('independent request batches',()=>{
 it('supports several batches with individual deadlines, daily limits and a shared period allowance',()=>{
  const {db,send,next}=fixture(2);
  send('first',['a'],'2026-11-02T18:00:00.000Z');
  const second=next();expect(second).not.toBe('first');
  expect(()=>send(second,['b','c'],'2026-11-02T19:00:00.000Z')).toThrow('daily limit');
  send(second,['b'],'2026-11-02T19:00:00.000Z');
  send(next(),['c','d'],'2026-11-03T18:00:00.000Z');send(next(),['e','f'],'2026-11-04T18:00:00.000Z');send(next(),['g'],'2026-11-05T18:00:00.000Z');
  expect(()=>send(next(),['h'],'2026-11-05T19:00:00.000Z')).toThrow('period allowance');
  expect(db.prepare("SELECT due_at_utc FROM traderlink_coaching_reviews WHERE review_id='first'").get()).toEqual({due_at_utc:'2026-11-07T18:00:00.000Z'});
 });
 it('allows seven trades in one batch when the daily cap is omitted and renews weekly',()=>{
  const {send,next}=fixture();send('first',['a','b','c','d','e','f','g'],'2026-11-02T18:00:00.000Z');
  expect(()=>send(next(),['h'],'2026-11-03T18:00:00.000Z')).toThrow('period allowance');
  expect(()=>send(next(),['h'],'2026-11-09T18:00:00.000Z')).not.toThrow();
 });
});


it('records the student preference on acceptance, rejects coach acceptance and keeps accepted preferences fixed',()=>{
 const {repo,db}=fixture();const terms=repo.agreements('enrollment','student')[0].terms;
 db.prepare("INSERT INTO traderlink_coaching_accepted_terms VALUES('agreement','enrollment',1,'proposed',?,'2026-11-02T12:00:00.000Z',NULL)").run(JSON.stringify(terms));
 vi.spyOn(repo,'createAgreedWork').mockReturnValue([]);
 expect(()=>repo.acceptAgreement('enrollment','agreement','coach','2026-11-02T13:00:00.000Z',undefined,{olderTrades:'earliest_date',earliestDate:'2020-01-01'})).toThrow('Only the student');
 repo.acceptAgreement('enrollment','agreement','student','2026-11-02T13:00:00.000Z',undefined,{olderTrades:'earliest_date',earliestDate:'2026-10-01'});
 repo.acceptAgreement('enrollment','agreement','student','2026-11-02T14:00:00.000Z',undefined,{olderTrades:'earliest_date',earliestDate:'2020-01-01'});
 const saved=db.prepare("SELECT terms_json FROM traderlink_coaching_accepted_terms WHERE agreement_id='agreement'").get() as {terms_json:string};
 expect(JSON.parse(saved.terms_json).studentReviewPreferences).toEqual({olderTrades:'earliest_date',earliestDate:'2026-10-01'});
});


it('keeps a fixed pack exhausted after the next week and month',()=>{
 const {send,next}=fixture(undefined,'pack');send('first',['a','b','c','d','e','f','g'],'2026-11-02T18:00:00.000Z');
 expect(()=>send(next(),['h'],'2026-12-09T18:00:00.000Z')).toThrow('pack have been used');
});
it('renews new recurring requests from the agreed service start rather than the next Monday',()=>{
 const {send,next}=fixture(undefined,'recurring','2026-11-04');send('first',['a','b','c','d','e','f','g'],'2026-11-04T18:00:00.000Z');
 expect(()=>send(next(),['h'],'2026-11-09T18:00:00.000Z')).toThrow('this period');
 expect(()=>send(next(),['h'],'2026-11-11T18:00:00.000Z')).not.toThrow();
});
it('saves the student-selected schedule as the actual accepted service, including trade selection',()=>{
 const {repo,db}=fixture(undefined,'recurring','2026-11-02'),source=repo.agreements('enrollment','student')[0].terms;
 const offered={...source,items:source.items.map(item=>({...item,timelineEnabled:true,selectionMode:'coach' as const})),builderConfig:{...source.builderConfig!,offers:{trade_review:{...source.builderConfig!.offers.trade_review!,reviewSchedule:'student_choice' as const}}}};
 db.prepare("INSERT INTO traderlink_coaching_accepted_terms VALUES('agreement','enrollment',1,'proposed',?,'2026-11-02T12:00:00.000Z',NULL)").run(JSON.stringify(offered));
 vi.spyOn(repo,'createAgreedWork').mockReturnValue([]);
 expect(()=>repo.acceptAgreement('enrollment','agreement','student','2026-11-02T13:00:00.000Z')).toThrow('Choose scheduled reviews');
 repo.acceptAgreement('enrollment','agreement','student','2026-11-02T13:00:00.000Z',undefined,undefined,{'item':'on_request'});
 const row=db.prepare("SELECT terms_json FROM traderlink_coaching_accepted_terms WHERE agreement_id='agreement'").get() as {terms_json:string};
 expect(JSON.parse(row.terms_json).items[0]).toMatchObject({timelineEnabled:false,selectionMode:'student'});
 expect(JSON.parse(row.terms_json).builderConfig.offers.trade_review.reviewSchedule).toBe('on_request');
});

it('persists a weekday request deadline from the accepted offer',()=>{
 const {db,send}=fixture(undefined,'recurring',null,'weekdays');send('first',['a'],'2026-11-06T18:00:00.000Z');
 expect(db.prepare("SELECT due_at_utc FROM traderlink_coaching_reviews WHERE review_id='first'").get()).toEqual({due_at_utc:'2026-11-13T18:00:00.000Z'});
});


it('accepts early scheduled trade submission and preserves the Friday commitment',()=>{
 const {repo,db}=fixture(),source=repo.agreements('enrollment','student')[0].terms;
 const terms={...source,startDate:'2026-11-09',items:source.items.map(item=>({...item,timelineEnabled:true})),builderConfig:{about:'',offers:{trade_review:{details:'',resources:[],weeklySchedule:'monday' as const,submissionSchedule:'weekend_choice' as const,deliveryDayCount:'weekdays' as const}}}};
 vi.mocked(repo.agreements).mockReturnValue([{agreementId:'agreement',acceptedAtUtc:'2026-11-09T12:00:00Z',terms}] as unknown as ReturnType<typeof repo.agreements>);
 db.prepare("INSERT INTO traderlink_coaching_accepted_terms VALUES('agreement','enrollment',1,'accepted',?,'2026-11-09T12:00:00Z','2026-11-09T12:00:00Z')").run(JSON.stringify(terms));
 db.prepare("UPDATE traderlink_coaching_reviews SET period_start='2026-11-09',period_end='2026-11-13',due_at_utc='2026-11-20T18:00:00.000Z' WHERE review_id='first'").run();
 expect(repo.review('first','student').earlySubmissionAllowed).toBe(true);
 repo.submitReview({reviewId:'first',actorUserId:'student',roundTripIds:['a','b','c','d','e','f','g'],selectedDays:[],atUtc:'2026-11-10T18:00:00.000Z',verifySelection:ids=>ids.map(id=>({roundTripId:id,logicalTradeId:id,tradingDate:'2026-11-09'})),tradeReviewEligibleCount:()=>7});
 expect(db.prepare("SELECT due_at_utc,status FROM traderlink_coaching_reviews WHERE review_id='first'").get()).toEqual({due_at_utc:'2026-11-20T18:00:00.000Z',status:'ready'});
});
it('permits explicit day submission early, while refusing a future selected day',()=>{
 const {repo,db}=fixture(),source=repo.agreements('enrollment','student')[0].terms;
 const terms={...source,startDate:'2026-11-09',items:source.items.map(item=>({...item,itemType:'trading_day_review' as const,quantity:1,timelineEnabled:true})),builderConfig:{about:'',offers:{trading_day_review:{details:'',resources:[],weeklySchedule:'monday' as const,submissionSchedule:'weekend_choice' as const,deliveryDayCount:'weekdays' as const,tradeCap:{basis:'per_day' as const,quantity:1}}}}};
 vi.mocked(repo.agreements).mockReturnValue([{agreementId:'agreement',acceptedAtUtc:'2026-11-09T12:00:00Z',terms}] as unknown as ReturnType<typeof repo.agreements>);
 db.prepare("INSERT INTO traderlink_coaching_accepted_terms VALUES('agreement','enrollment',1,'accepted',?,'2026-11-09T12:00:00Z','2026-11-09T12:00:00Z')").run(JSON.stringify(terms));
 db.prepare("UPDATE traderlink_coaching_reviews SET kind='trading_day',period_start='2026-11-09',period_end='2026-11-13',due_at_utc='2026-11-20T18:00:00.000Z' WHERE review_id='first'").run();
 const submit=(atUtc:string)=>repo.submitReview({reviewId:'first',actorUserId:'student',roundTripIds:['a'],selectedDays:['2026-11-09'],atUtc,verifySelection:()=>[{roundTripId:'a',logicalTradeId:'a',tradingDate:'2026-11-09'}]});
 expect(()=>submit('2026-11-08T18:00:00.000Z')).toThrow('in the future');
 expect(()=>submit('2026-11-09T21:00:00.000Z')).not.toThrow();
 expect(repo.review('first','student').dueAtUtc).toBe('2026-11-20T18:00:00.000Z');
});

function replaceInput(old='a',next='c'){
 return {reviewId:'first',actorUserId:'student',removeRoundTripId:old,replacementRoundTripId:next,atUtc:'2026-11-02T19:00:00.000Z',verifySelection:(ids:readonly string[])=>ids.map(id=>({roundTripId:id,logicalTradeId:id,tradingDate:'2026-10-01'}))};
}
it('replaces one untouched submitted trade after opening it, without moving dates or consuming another allowance',()=>{
 const {repo,db,send,next}=fixture(2);send('first',['a','b'],'2026-11-02T18:00:00.000Z');
 const original=repo.review('first','student');repo.review('first','coach');
 repo.replaceStudentTrade(replaceInput());
 expect(repo.reviewTrades('first','student').map(row=>row.roundTripId).sort()).toEqual(['b','c']);
 expect(repo.review('first','student')).toMatchObject({dueAtUtc:original.dueAtUtc,submittedAtUtc:original.submittedAtUtc,status:original.status});
 expect(()=>send(next(),['d'],'2026-11-02T20:00:00.000Z')).toThrow('daily limit');
 expect(JSON.parse((db.prepare("SELECT object_id FROM traderlink_coaching_events WHERE kind='student_trade_replaced'").get() as {object_id:string}).object_id)).toMatchObject({from:'a',to:'c'});
});
it('locks only a trade with a saved draft, keeps that lock after clearing, and rejects a stale coach save',()=>{
 const {repo,send}=fixture();send('first',['a','b'],'2026-11-02T18:00:00.000Z');
 const baseline=repo.reviewEditorModel('first','coach').baselines!;
 const saved=repo.saveReviewTrade({reviewId:'first',actorUserId:'coach',roundTripId:'b',feedback:{overall:'Partial coach draft'},expectedFingerprint:baseline.trades.find(row=>row.roundTripId==='b')!.fingerprint,atUtc:'2026-11-02T18:30:00.000Z'});
 repo.saveReviewTrade({reviewId:'first',actorUserId:'coach',roundTripId:'b',feedback:{},expectedFingerprint:saved.fingerprint,atUtc:'2026-11-02T18:31:00.000Z'});
 expect(()=>repo.replaceStudentTrade(replaceInput('b','d'))).toThrow('coach may have saved');
 expect(()=>repo.replaceStudentTrade(replaceInput('a','c'))).not.toThrow();
 expect(()=>repo.saveReviewTrade({reviewId:'first',actorUserId:'coach',roundTripId:'a',feedback:{overall:'Stale text'},expectedFingerprint:baseline.trades.find(row=>row.roundTripId==='a')!.fingerprint,atUtc:'2026-11-02T20:00:00.000Z'})).toThrow('selected');
 expect(repo.reviewTrades('first','student').map(row=>row.roundTripId).sort()).toEqual(['b','c']);
});
it('does not lock untouched trades when saving only an overall draft with unchanged empty trade targets',()=>{
 const {repo,send}=fixture();send('first',['a','b'],'2026-11-02T18:00:00.000Z');const baseline=repo.reviewEditorModel('first','coach').baselines!;
 repo.saveReview({reviewId:'first',actorUserId:'coach',draft:{overall:'Overall draft'},expectedFingerprint:baseline.fingerprint,tradeFeedback:baseline.trades.map(row=>({roundTripId:row.roundTripId,feedback:{},completed:false,expectedFingerprint:row.fingerprint})),atUtc:'2026-11-02T18:30:00.000Z'});
 expect(repo.studentTradeReplacementState('first','student').selected.every(row=>row.canReplace)).toBe(true);
 repo.replaceStudentTrade(replaceInput());
});
it('rejects duplicates, invalid choices, revoked access, other actors and closed reviews atomically',()=>{
 const {repo,db,send}=fixture();send('first',['a','b'],'2026-11-02T18:00:00.000Z');
 expect(()=>repo.replaceStudentTrade(replaceInput('a','b'))).toThrow('another eligible');
 expect(()=>repo.replaceStudentTrade({...replaceInput(),verifySelection:()=>[]})).toThrow('distinct eligible');
 expect(()=>repo.replaceStudentTrade({...replaceInput(),verifySelection:ids=>ids.map(id=>({roundTripId:id,logicalTradeId:id==='c'?'a':id,tradingDate:'2026-10-01'}))})).toThrow('different Journal trade');
 expect(()=>repo.replaceStudentTrade({...replaceInput(),actorUserId:'coach'})).toThrow('unavailable');
 vi.mocked(repo.journalAccess).mockReturnValueOnce({missing:['trades'],accountId:'account',accountAvailable:true,reviewAccountMismatch:false,scopes:[]});
 expect(()=>repo.replaceStudentTrade(replaceInput())).toThrow('Journal access');
 expect(repo.reviewTrades('first','student').map(row=>row.roundTripId)).toEqual(['a','b']);
 db.prepare("UPDATE traderlink_coaching_reviews SET status='delivered' WHERE review_id='first'").run();
 expect(()=>repo.replaceStudentTrade(replaceInput())).toThrow('unavailable');
});
it('replaces trading-day selections only within the same submitted day',()=>{
 const {repo,db}=fixture(),source=repo.agreements('enrollment','student')[0].terms;
 const terms={...source,items:source.items.map(item=>({...item,itemType:'trading_day_review' as const,quantity:1})),builderConfig:{about:'',offers:{trading_day_review:{details:'',resources:[],tradeCap:{basis:'per_day' as const,quantity:1}}}}};
 vi.mocked(repo.agreements).mockReturnValue([{...repo.agreements('enrollment','student')[0],terms}]);
 db.prepare("UPDATE traderlink_coaching_reviews SET kind='trading_day' WHERE review_id='first'").run();
 repo.submitReview({reviewId:'first',actorUserId:'student',roundTripIds:['a'],selectedDays:['2026-10-01'],atUtc:'2026-11-02T18:00:00.000Z',verifySelection:()=>[{roundTripId:'a',logicalTradeId:'a',tradingDate:'2026-10-01'}]});
 expect(()=>repo.replaceStudentTrade({...replaceInput(),verifySelection:ids=>ids.map(id=>({roundTripId:id,logicalTradeId:id,tradingDate:id==='a'?'2026-10-01':'2026-10-02'}))})).toThrow('same selected trading day');
 expect(repo.reviewTrades('first','student').map(row=>row.roundTripId)).toEqual(['a']);
 expect(()=>repo.replaceStudentTrade(replaceInput())).not.toThrow();
 expect(repo.review('first','student').selectedDays).toEqual(['2026-10-01']);
});

it('rolls back the original selection if storing the replacement fails',()=>{
 const {repo,db,send}=fixture();send('first',['a','b'],'2026-11-02T18:00:00.000Z');const original=repo.review('first','student');
 db.exec("CREATE TRIGGER reject_student_replacement BEFORE INSERT ON traderlink_coaching_review_trades WHEN NEW.round_trip_id='c' BEGIN SELECT RAISE(ABORT,'replacement rejected'); END");
 expect(()=>repo.replaceStudentTrade(replaceInput())).toThrow('replacement rejected');
 expect(repo.reviewTrades('first','student').map(row=>row.roundTripId)).toEqual(['a','b']);expect(repo.review('first','student').dueAtUtc).toBe(original.dueAtUtc);
 expect(db.prepare("SELECT count(*) n FROM traderlink_coaching_events WHERE kind='student_trade_replaced'").get()).toEqual({n:0});
});
it('keeps a trade protected after the coach saves and removes a chart image',()=>{
 const {repo,db,send}=fixture();send('first',['a','b'],'2026-11-02T18:00:00.000Z');
 vi.spyOn(IndependentCoachingRepository.prototype,'enrollment').mockReturnValue({coach_user_id:'coach',student_user_id:'student',status:'active'} as ReturnType<typeof repo.enrollment>);
 vi.spyOn(IndependentCoachingRepository.prototype,'journalAccess').mockReturnValue({missing:[],accountId:'account',accountAvailable:true,reviewAccountMismatch:false,scopes:['trades']});
 const images=new IndependentCoachingReviewImages(db),image=images.add({reviewId:'first',actorUserId:'coach',roundTripId:'a',filename:'chart.jpg',mediaType:'image/jpeg',content:Buffer.from([255,216]),atUtc:'2026-11-02T18:20:00.000Z'});images.remove(image,'coach');
 expect(()=>repo.replaceStudentTrade(replaceInput())).toThrow('coach may have saved');
 expect(repo.studentTradeReplacementState('first','student').selected.find(row=>row.roundTripId==='b')?.canReplace).toBe(true);
});

it('replacement uses the agreed scheduled window when selected-trade dates are not stored',()=>{
 const {terms}=fixture();
 const item={...terms.items[0],timelineEnabled:true,coveragePeriod:'calendar_week' as const};
 const scheduled={...terms,startDate:'2026-11-02',builderConfig:{about:'',offers:{trade_review:{details:'',resources:[],weeklySchedule:'monday' as const,submissionSchedule:'weekend_choice' as const,deliveryDayCount:'weekdays' as const}}},items:[item]};
 expect(studentTradeReplacementPeriod(scheduled,item,{occurrenceIndex:0,submittedAtUtc:'2026-11-02T18:00:00.000Z',periodStart:null,periodEnd:null,selectedDays:[],kind:'trade'},'2026-11-04T18:00:00.000Z')).toEqual({start:'2026-11-02',end:'2026-11-06'});
 expect(studentTradeReplacementPeriod(scheduled,item,{occurrenceIndex:0,submittedAtUtc:'2026-11-02T18:00:00.000Z',periodStart:'2026-11-03',periodEnd:'2026-11-03',selectedDays:['2026-11-03'],kind:'trading_day'},'2026-11-04T18:00:00.000Z')).toEqual({start:'2026-11-03',end:'2026-11-03'});
});
