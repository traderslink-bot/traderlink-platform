import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {createTraderLinkCommunityReviewFixture} from '../server/traderlink-community-review-fixture';
vi.mock('@/app/(dashboard)/communities/community-actions',()=>({markCommunityReviewViewedAction:()=>{},replyCommunityReviewAction:()=>{},updateCommunityReviewActionItemAction:()=>{}}));
vi.mock('@/app/(dashboard)/communities/student-review-submission',()=>({StudentReviewSubmission:()=>null}));
vi.mock('@/app/(dashboard)/communities/student-review-existing-trades',()=>({StudentReviewExistingTrades:()=>null}));
vi.mock('@/app/(dashboard)/communities/student-review-existing-days',()=>({StudentReviewExistingDays:()=>null}));
vi.mock('@/app/(dashboard)/communities/coaching-review-goals',()=>({CoachingReviewGoals:()=>null}));
vi.mock('@/app/(dashboard)/communities/coaching-review-cap-resolution',()=>({CoachingReviewCapResolution:()=>null}));
import {StudentCoachingReview} from '@/app/(dashboard)/communities/student-coaching-review';
function render(problem:string|null=null,paused=false,completed=false){
 const snapshot=createTraderLinkCommunityReviewFixture('student');
 const review={...snapshot.tradeReviews[0],agreedService:null,deliveredAtUtc:'2026-11-18T12:00:00.000Z',viewedAtUtc:'2026-11-18T12:01:00.000Z',deliveryState:completed?'completed' as const:'viewed' as const,followUpProblem:problem};
 return renderToStaticMarkup(React.createElement(StudentCoachingReview,{snapshot,review,isReview:false,paused}));
}
describe('Community per-review reply controls',()=>{
 it('shows the agreed reply field without a separate general-messaging capability',()=>expect(render()).toContain('Question or reply'));
 it.each(['Follow-up is not included in this agreement.','The follow-up period for this review has ended.'])('explains an unavailable review window: %s',problem=>{const html=render(problem);expect(html).toContain(problem);expect(html).not.toContain('Question or reply');});
 it('keeps replies closed after completion or while access is paused',()=>{expect(render(null,true)).not.toContain('Question or reply');expect(render(null,false,true)).not.toContain('Question or reply');});
});
