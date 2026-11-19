// @vitest-environment node
import Database from 'better-sqlite3';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import {IndependentCoachingReviewFollowUp} from './independent-coaching-review-follow-up';
vi.mock('./coaching-commercial-access',()=>({requireCoachCommercialAccess:vi.fn()}));
const dbs:Database.Database[]=[];
afterEach(()=>{vi.restoreAllMocks();dbs.splice(0).forEach(db=>db.close());});
function fixture(items:{planItemId:string;itemType:string;followUpDays:number}[]){
 const db=new Database(':memory:');dbs.push(db);db.exec(`CREATE TABLE traderlink_coaching_review_follow_up(review_id TEXT PRIMARY KEY,viewed_at_utc TEXT,follow_up_due_at_utc TEXT,completed_at_utc TEXT);CREATE TABLE traderlink_coaching_review_replies(reply_id TEXT,review_id TEXT,author_user_id TEXT,body TEXT,created_at_utc TEXT);CREATE TABLE platform_users(user_id TEXT,display_name TEXT);`);
 vi.spyOn(IndependentCoachingRepository.prototype,'review').mockReturnValue({reviewId:'review',enrollmentId:'enrollment',agreementId:'accepted',planItemId:'review-item',status:'delivered'} as ReturnType<IndependentCoachingRepository['review']>);
 vi.spyOn(IndependentCoachingRepository.prototype,'enrollment').mockReturnValue({coach_user_id:'coach',student_user_id:'student',status:'active'} as ReturnType<IndependentCoachingRepository['enrollment']>);
 vi.spyOn(IndependentCoachingRepository.prototype,'agreements').mockReturnValue([{agreementId:'accepted',terms:{items}}] as unknown as ReturnType<IndependentCoachingRepository['agreements']>);
 return new IndependentCoachingReviewFollowUp(db);
}
const now='2026-11-18T12:00:00.000Z';
describe('agreed per-review follow-up',()=>{
 it.each(['trade_review','trading_day_review','performance_review'])('uses %s own accepted follow-up days and read trigger',itemType=>{
  const follow=fixture([{planItemId:'review-item',itemType,followUpDays:3}]);expect(follow.read('review','student',now)).toMatchObject({included:true,canReply:false,windowEndsAtUtc:null});follow.markRead('review','student',now);expect(follow.read('review','student',now)).toMatchObject({included:true,canReply:true,windowEndsAtUtc:'2026-11-21T12:00:00.000Z'});expect(follow.read('review','student','2026-11-22T12:00:00.000Z').canReply).toBe(false);
 });
 it('does not borrow follow-up from a different review service',()=>{const follow=fixture([{planItemId:'review-item',itemType:'trade_review',followUpDays:0},{planItemId:'other-review',itemType:'performance_review',followUpDays:7}]);expect(follow.read('review','student',now)).toMatchObject({included:false,canReply:false});});
 it('preserves legacy separate follow-up and prefers the bound service when present',()=>{const follow=fixture([{planItemId:'review-item',itemType:'trade_review',followUpDays:3},{planItemId:'legacy',itemType:'review_follow_up',followUpDays:7}]);follow.markRead('review','student',now);expect(follow.read('review','student',now).windowEndsAtUtc).toBe('2026-11-21T12:00:00.000Z');});
 it('retains legacy global follow-up on older agreements',()=>{const follow=fixture([{planItemId:'review-item',itemType:'trade_review',followUpDays:0},{planItemId:'legacy',itemType:'review_follow_up',followUpDays:7}]);follow.markRead('review','student',now);expect(follow.read('review','student',now).windowEndsAtUtc).toBe('2026-11-25T12:00:00.000Z');});
 it('keeps student-only read and coach-only completion boundaries',()=>{const follow=fixture([{planItemId:'review-item',itemType:'performance_review',followUpDays:3}]);expect(()=>follow.markRead('review','coach',now)).toThrow('Only the student');expect(()=>follow.complete('review','student',now)).toThrow('Only the coach');});
});
