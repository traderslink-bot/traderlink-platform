// @vitest-environment node
import Database from 'better-sqlite3';
import {afterEach,describe,expect,it} from 'vitest';
import {coachingReviewFollowUpProblem,requireFollowUpWindow} from './coaching-service-limits';
const opened:Database.Database[]=[];
afterEach(()=>opened.splice(0).forEach(db=>db.close()));
const readAt='2026-11-18T12:00:00.000Z';
function fixture(kind='performance_review',days=3,legacyDays?:number){
 const db=new Database(':memory:');opened.push(db);
 db.exec(`CREATE TABLE traderlink_community_coaching_trade_reviews(review_id TEXT,relationship_id TEXT,community_id TEXT,viewed_at_utc TEXT);
 CREATE TABLE traderlink_community_coaching_agreements(agreement_id TEXT,relationship_id TEXT,community_id TEXT,terms_json TEXT);
 CREATE TABLE traderlink_community_coaching_occurrences(agreement_id TEXT,item_key TEXT,work_id TEXT,work_type TEXT,community_id TEXT);
 CREATE TABLE traderlink_community_coaching_review_events(review_id TEXT,community_id TEXT,details_json TEXT,occurred_at_utc TEXT);`);
 const items=[{planItemId:'own',itemType:kind,followUpDays:days},{planItemId:'other',itemType:'performance_review',followUpDays:7}];
 if(legacyDays!==undefined)items.push({planItemId:'legacy',itemType:'review_follow_up',followUpDays:legacyDays});
 db.prepare('INSERT INTO traderlink_community_coaching_agreements VALUES(?,?,?,?)').run('original','relationship','community',JSON.stringify({items}));
 db.prepare('INSERT INTO traderlink_community_coaching_trade_reviews VALUES(?,?,?,?)').run('review','relationship','community',readAt);
 db.prepare('INSERT INTO traderlink_community_coaching_occurrences VALUES(?,?,?,?,?)').run('original','own','review','review','community');
 return db;
}
describe('Community accepted per-review follow-up',()=>{
 it.each(['trade_review','trading_day_review','performance_review'])('honors %s own three-day window without a separate messaging service',kind=>{
  const db=fixture(kind);expect(()=>requireFollowUpWindow(db,'relationship','review',readAt)).not.toThrow();
  expect(coachingReviewFollowUpProblem(db,'relationship','review','2026-11-21T11:59:59.000Z')).toBeNull();
  expect(coachingReviewFollowUpProblem(db,'relationship','review','2026-11-21T12:00:00.001Z')).toContain('has ended');
 });
 it('does not borrow another review service follow-up',()=>expect(coachingReviewFollowUpProblem(fixture('trading_day_review',0),'relationship','review',readAt)).toContain('not included'));
 it('starts after the student reads the review',()=>{const db=fixture();db.exec('UPDATE traderlink_community_coaching_trade_reviews SET viewed_at_utc=NULL');expect(coachingReviewFollowUpProblem(db,'relationship','review',readAt)).toContain('Mark the review as read');});
 it('uses the bound review days before an older global follow-up service',()=>expect(coachingReviewFollowUpProblem(fixture('performance_review',3,7),'relationship','review','2026-11-22T12:00:00.000Z')).toContain('has ended'));
 it('retains old accepted separate-service follow-up',()=>expect(coachingReviewFollowUpProblem(fixture('trade_review',0,7),'relationship','review','2026-11-22T12:00:00.000Z')).toBeNull());
 it('rejects an unbound review and a different relationship',()=>{const db=fixture();expect(coachingReviewFollowUpProblem(db,'other-relationship','review',readAt)).toContain('unavailable');db.exec('DELETE FROM traderlink_community_coaching_occurrences');expect(coachingReviewFollowUpProblem(db,'relationship','review',readAt)).toContain('original agreement');});
});
