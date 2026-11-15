// @vitest-environment node
import Database from 'better-sqlite3';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import type {CoachingAgreementTerms} from '../contracts/coaching-agreements';
vi.mock('./independent-coaching-trade-eligibility',()=>({independentCoachingUnavailableTrades:()=>new Set()}));
const databases:Database.Database[]=[];
afterEach(()=>{vi.restoreAllMocks();for(const db of databases.splice(0))db.close();});
function fixture(scheduled:boolean){
 const db=new Database(':memory:');databases.push(db);
 db.exec(`CREATE TABLE traderlink_coaching_reviews(review_id TEXT PRIMARY KEY,journal_account_id TEXT,period_start TEXT,period_end TEXT,selected_days_json TEXT,submitted_at_utc TEXT,due_at_utc TEXT,status TEXT,updated_at_utc TEXT);
 CREATE TABLE traderlink_coaching_review_trades(review_id TEXT,round_trip_id TEXT,logical_trade_id TEXT,updated_at_utc TEXT);
 CREATE TABLE traderlink_coaching_review_goals(review_id TEXT PRIMARY KEY,body TEXT,revision INTEGER,at TEXT);
 CREATE TABLE traderlink_coaching_events(id TEXT,enrollment TEXT,actor TEXT,kind TEXT,object TEXT,at TEXT);`);
 db.prepare("INSERT INTO traderlink_coaching_reviews VALUES('review',NULL,'2026-10-19','2026-10-25','[]',NULL,?,'awaiting_submission',NULL)").run(scheduled?'2026-10-30T17:00:00.000Z':null);
 const repo=new IndependentCoachingRepository(db);
 const review={reviewId:'review',enrollmentId:'enrollment',agreementId:'agreement',planItemId:'item',occurrenceIndex:0,kind:'performance' as const,journalAccountId:null,periodStart:'2026-10-19',periodEnd:'2026-10-25',dueAtUtc:scheduled?'2026-10-30T17:00:00.000Z':null,submittedAtUtc:null,status:'awaiting_submission' as const,selectedDays:[],draft:{},delivered:null,deliveredAtUtc:null};
 vi.spyOn(repo,'review').mockReturnValue(review);
 vi.spyOn(repo,'enrollment').mockReturnValue({coach_user_id:'coach',student_user_id:'student',status:'active'} as ReturnType<typeof repo.enrollment>);
 const terms={startDate:'2026-10-19',dueTimeUtc:'17:00',items:[{planItemId:'item',itemType:'performance_review',frequency:'weekly',coveragePeriod:'previous_7_days',quantity:1,dueOffsetDays:5,timelineEnabled:scheduled,selectionMode:'not_applicable'}]} as unknown as CoachingAgreementTerms;
 vi.spyOn(repo,'agreements').mockReturnValue([{agreementId:'agreement',terms}] as unknown as ReturnType<typeof repo.agreements>);
 vi.spyOn(repo,'journalAccess').mockReturnValue({missing:[],accountId:'account'} as unknown as ReturnType<typeof repo.journalAccess>);
 vi.spyOn(repo,'studentContext').mockReturnValue({notes:null,goals:{body:'Goal',revision:1},history:[]});
 return {repo,db};
}
describe('independent scheduled versus requested deadlines',()=>{
 it.each([true,false])('scheduled=%s uses its own deadline trigger',scheduled=>{
  const {repo,db}=fixture(scheduled);
  repo.submitReview({reviewId:'review',actorUserId:'student',roundTripIds:[],selectedDays:[],atUtc:'2026-10-27T12:00:00.000Z',verifySelection:()=>[]});
  expect(db.prepare("SELECT due_at_utc FROM traderlink_coaching_reviews WHERE review_id='review'").get()).toEqual({due_at_utc:scheduled?'2026-10-30T17:00:00.000Z':'2026-11-01T12:00:00.000Z'});
 });
});
