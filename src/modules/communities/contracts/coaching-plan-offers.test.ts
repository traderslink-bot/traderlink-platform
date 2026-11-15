import {describe,expect,it} from 'vitest';
import {PLAN_OFFERS,initialOfferSettings,offerSummary} from '@/app/(dashboard)/communities/coaching-plan-offers';
import {coachingReviewFollowUpItem,type CoachingAgreementTerms} from './coaching-agreements';
import type {TraderLinkCommunityCoachingPlanItem} from './traderlink-community-platform-contracts';
import {independentCoachingServicePresentation} from './independent-coaching';

function item(planItemId:string,itemType:TraderLinkCommunityCoachingPlanItem['itemType'],followUpDays:number):TraderLinkCommunityCoachingPlanItem{
 return {planItemId,itemType,frequency:'weekly',coveragePeriod:'single_item',quantity:1,dueOffsetDays:2,selectionMode:'coach_or_student',followUpDays,measurementKind:'reviews',plannedMinutes:null,timelineEnabled:true,reviewDepth:'standard',ordinal:0,focusAreas:[]};
}
function terms(items:readonly TraderLinkCommunityCoachingPlanItem[]):CoachingAgreementTerms{
 return {planId:'plan',planRevision:1,planName:'Plan',description:'',priceAmountMinor:0,currency:'USD',billingCadence:'weekly',paymentInstructions:'',requiredDiscordRoleId:null,autoArchiveAfterDays:null,items,startDate:null,customIntervalDays:null,dueTimeUtc:'18:00'};
}

describe('coaching plan offer follow-up configuration',()=>{
 it('keeps the historical standalone offer out of new selection while retaining its contract',()=>{
  const legacy=PLAN_OFFERS.find(offer=>offer.type==='review_follow_up');
  expect(legacy?.legacyOnly).toBe(true);
  expect(PLAN_OFFERS.filter(offer=>!offer.legacyOnly).some(offer=>offer.type==='review_follow_up')).toBe(false);
 });

 it('attaches follow-up to an individual review summary only when included',()=>{
  const review=PLAN_OFFERS.find(offer=>offer.type==='trade_review')!;
  const settings=initialOfferSettings(review);
  expect(offerSummary(review,settings)).not.toContain('Follow-up: 3 days after the review');
  expect(offerSummary(review,{...settings,followUpEnabled:true})).toContain('Follow-up: 3 days after the review');
 });

 it('labels trading-day plan terms without requiring tooltips',()=>{
  const review=PLAN_OFFERS.find(offer=>offer.type==='trading_day_review')!;
  const summary=offerSummary(review,{...initialOfferSettings(review),quantity:'2'});
  expect(summary).toEqual(expect.arrayContaining([
   'Frequency: Weekly',
   'Trading days reviewed: 2',
   'Work reviewed: Selected trading days',
   'Review due: 5 days after the submission cutoff',
   'Trade limit: 5 trades per day',
   'Review includes: Trade evaluations and an overall trading-day assessment',
  ]));
 });

 it('explains what trade and performance reviews include',()=>{
  const trade=PLAN_OFFERS.find(offer=>offer.type==='trade_review')!;
  const performance=PLAN_OFFERS.find(offer=>offer.type==='performance_review')!;
  expect(offerSummary(trade,initialOfferSettings(trade))).toEqual([
   'Offer: Recurring Trade Reviews',
   'Schedule: Scheduled reviews',
   'Frequency: Weekly',
   'Trades reviewed: 10',
   'Work reviewed: Selected trades',
   'Review due: 5 days after the submission cutoff',
   'Trades chosen by: Coach or student',
   'Review includes: Individual trade evaluations and written coach feedback',
   'Delivery days: Calendar days (including weekends)',
   'Trading dates: Monday–Friday',
   'Submission cutoff: Friday evening',
  ]);
  const performanceSummary=offerSummary(performance,initialOfferSettings(performance));
  expect(performanceSummary.indexOf('Resources: Analytics reports')).toBeLessThan(performanceSummary.indexOf('Review includes: Performance analytics, a period-wide evaluation and written coach feedback'));
 });

 it('authorizes only the exact review item and preserves the historical fallback',()=>{
  const trade=item('trade','trade_review',5),performance=item('performance','performance_review',0),legacy=item('legacy','review_follow_up',3);
  expect(coachingReviewFollowUpItem(terms([trade,performance]),'trade')).toBe(trade);
  expect(coachingReviewFollowUpItem(terms([trade,performance]),'performance')).toBeUndefined();
  expect(coachingReviewFollowUpItem(terms([performance,legacy]),'performance')).toBe(legacy);
 });

 it('discloses an attached review follow-up in the student-facing agreement',()=>{
  const trade=item('trade','trade_review',5),agreement=terms([trade]);
  expect(independentCoachingServicePresentation(agreement,trade).details).toContain('Follow-up window: 5 days after the student marks the review read');
 });
});
