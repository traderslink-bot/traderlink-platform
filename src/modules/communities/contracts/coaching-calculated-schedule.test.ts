import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {reviewScheduleExample,CoachingReviewScheduleSummary} from '../../../../app/coaching-review-schedule-summary';
import {PLAN_OFFERS,initialOfferSettings} from '../../../../app/(dashboard)/communities/coaching-plan-offers';
import {reviewTimingProblem} from './coaching-review-timing';
const value=initialOfferSettings(PLAN_OFFERS.find(offer=>offer.type==='trade_review')!);
describe('calculated coach review schedule',()=>{
 it('counts five weekdays from the Sunday submission cutoff and selects Monday–Friday trades',()=>{
  expect(reviewScheduleExample({...value,deliveryDayCount:'weekdays'},'trade_review','2026-11-09')).toEqual({start:'2026-11-09',end:'2026-11-13',submissionDate:'2026-11-15',dueAtUtc:'2026-11-20T18:00:00.000Z'});
 });
 it('counts five calendar days from Friday when weekend reviewing is included',()=>{
  expect(reviewScheduleExample({...value,deliveryDayCount:'calendar'},'trading_day_review','2026-11-09')).toEqual({start:'2026-11-09',end:'2026-11-13',submissionDate:'2026-11-13',dueAtUtc:'2026-11-18T18:00:00.000Z'});
 });
 it('computes two full trading weeks and the second Sunday rather than a single week',()=>{
  expect(reviewScheduleExample({...value,frequency:'every_two_weeks',deliveryDayCount:'weekdays'},'trade_review','2026-11-09')).toEqual({start:'2026-11-09',end:'2026-11-20',submissionDate:'2026-11-22',dueAtUtc:'2026-11-27T18:00:00.000Z'});
 });
 it('recalculates for another duration and handles monthly boundaries without hardcoded weekdays',()=>{
  expect(reviewScheduleExample({...value,dueDays:'1',deliveryDayCount:'calendar'},'trade_review','2026-11-09')?.dueAtUtc).toBe('2026-11-14T18:00:00.000Z');
  expect(reviewScheduleExample({...value,frequency:'monthly',deliveryDayCount:'weekdays'},'trade_review','2026-11-09')).toEqual({start:'2026-11-09',end:'2026-12-08',submissionDate:'2026-12-08',dueAtUtc:'2026-12-15T18:00:00.000Z'});
 });
 it('shows the selection actor and early-start guidance while clearly identifying example dates',()=>{
  const student=renderToStaticMarkup(React.createElement(CoachingReviewScheduleSummary,{value:{...value,selection:'student'},type:'trade_review'}));
  expect(student).toContain('Your student submits their trades');expect(student).toContain('Actual dates will be shown in the agreement.');expect(student).toContain('You may start reviewing as soon as');
  const coach=renderToStaticMarkup(React.createElement(CoachingReviewScheduleSummary,{value:{...value,selection:'coach'},type:'trading_day_review'}));expect(coach).toContain('Choose the trades');
 });
 it('does not delay a submitted new-policy review to the end of the selection window',()=>{
  const base={deliveryState:'draft' as const,status:'requested' as const,periodEnd:'2026-11-13',dueAtUtc:'2026-11-20T18:00:00Z',timing:{availableAtUtc:null,awaitingSubmission:false,submittedAtUtc:'2026-11-10T18:00:00Z',turnaroundDays:5,scheduled:true,earlySubmissionAllowed:true}};
  expect(reviewTimingProblem(base,'2026-11-10T19:00:00Z')).toBeNull();
  expect(reviewTimingProblem({...base,timing:{...base.timing,earlySubmissionAllowed:false}},'2026-11-10T19:00:00Z')).toContain('Available to start');
  expect(reviewTimingProblem({...base,timing:{...base.timing,awaitingSubmission:true}},'2026-11-10T19:00:00Z')).toBe('Awaiting student submission');
 });
});
