import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {CoachingTradeReviewSetup} from '../../../../app/coaching-trade-review-setup';
import {CoachingStudentReviewSchedule} from '../../../../app/coaching-student-review-schedule';
import {PLAN_OFFERS,initialOfferSettings,effectiveOfferSettings,offerSummary,type OfferSettings} from '../../../../app/(dashboard)/communities/coaching-plan-offers';
import {chooseStudentReviewSchedules,validateTradeReviewOffer,withTradeReviewStartDate} from './coaching-review-schedule-choice';
import {parseCoachingPlanConfiguration} from './coaching-plan-configuration';
import {requireSubmissionAllowance,submissionPeriodForOffer} from './coaching-request-submission-limits';
import type {CoachingAgreementTerms} from './coaching-agreements';
const offer=PLAN_OFFERS.find(offer=>offer.type==='trade_review')!,defaults=initialOfferSettings(offer);
function markup(patch:Partial<OfferSettings>={}){return renderToStaticMarkup(React.createElement(CoachingTradeReviewSetup,{value:{...defaults,...patch},onChange:()=>{}}));}
function terms():CoachingAgreementTerms{return {planId:'plan',planRevision:1,planName:'Trade reviews',description:'',priceAmountMinor:0,currency:'USD',billingCadence:'monthly',paymentInstructions:'',requiredDiscordRoleId:null,autoArchiveAfterDays:null,startDate:'2026-11-02',customIntervalDays:null,dueTimeUtc:'17:00',items:[{planItemId:'trade-service',ordinal:0,itemType:'trade_review',frequency:'weekly',coveragePeriod:'single_item',quantity:10,dueOffsetDays:5,selectionMode:'coach',followUpDays:0,measurementKind:'trades',plannedMinutes:null,timelineEnabled:true,reviewDepth:'standard'}],builderConfig:{about:'',offers:{trade_review:{details:'',resources:[],tradeReviewFormat:'recurring',reviewSchedule:'student_choice',submissionLimits:{perPeriod:10,perDay:2}}}}};}
describe('readable recurring and pack setup',()=>{
 it('pairs plain questions with compact fields and offers only the three recurring periods',()=>{
  const html=markup();expect(html).toContain('How many trades do you want to review');expect(html).toContain('Recurring period');expect(html).toContain('Weekly');expect(html).not.toContain('value="once"');expect(html).not.toContain('value="custom"');expect(html).toContain('data-review-setup-row');expect(html).toContain('aria-describedby');
 });
 it('shows trade choice for scheduled reviews and optional submission limits for requests',()=>{
  expect(markup()).toContain('Trades chosen by');expect(markup()).not.toContain('aria-label="Maximum trades submitted per day"');
  const request=markup({timeline:false,reviewSchedule:'on_request'});expect(request).not.toContain('Trades chosen by');expect(request).toContain('aria-label="Maximum trades submitted per day"');expect(request).toContain('The student sends their trades');
  expect(effectiveOfferSettings('trade_review',{...defaults,timeline:false,selection:'coach'}).selection).toBe('student');
 });
 it('uses a fixed pack quantity, no recurring-period or schedule field, and no automatic renewal',()=>{
  const pack=effectiveOfferSettings('trade_review',{...defaults,tradeReviewFormat:'pack',reviewSchedule:'scheduled',quantity:'10'});
  expect(pack).toMatchObject({frequency:'once',timeline:false,selection:'student',reviewSchedule:'on_request'});
  const html=markup(pack);expect(html).toContain('The pack does not renew.');expect(html).toContain('Trade reviews in pack');expect(html).not.toContain('aria-label="Recurring period"');expect(html).not.toContain('aria-label="Review schedule"');expect(offerSummary(offer,pack)).toContain('Reviews in pack: 10');
 });
 it('shows both conditional questions when the coach lets the student choose',()=>{
  const html=markup({reviewSchedule:'student_choice'});expect(html).toContain('Trades chosen by');expect(html).toContain('Maximum trades submitted per day');expect(html).toContain('The student chooses which one they prefer');
 });
});
describe('saved student schedule choices',()=>{
 it('requires a choice and resolves only schedules the coach actually offered',()=>{
  const proposed=terms(),before=JSON.stringify(proposed);expect(()=>chooseStudentReviewSchedules(proposed)).toThrow('Choose scheduled reviews');
  const request=chooseStudentReviewSchedules(proposed,{'trade-service':'on_request'});expect(request.items[0]).toMatchObject({timelineEnabled:false,selectionMode:'student'});expect(request.builderConfig?.offers.trade_review?.reviewSchedule).toBe('on_request');
  const scheduled=chooseStudentReviewSchedules(proposed,{'trade-service':'scheduled'});expect(scheduled.items[0]).toMatchObject({timelineEnabled:true,selectionMode:'coach'});expect(JSON.stringify(proposed)).toBe(before);
  expect(chooseStudentReviewSchedules(scheduled,{'trade-service':'on_request'})).toBe(scheduled);
 });
 it('renders the student choice inside the acceptance form with an item-specific field',()=>{const html=renderToStaticMarkup(React.createElement(CoachingStudentReviewSchedule,{terms:terms()}));expect(html).toContain('name="reviewSchedule:trade-service"');expect(html).toContain('Your review schedule');});
 it('preserves metadata through parsing and rejects inconsistent pack payloads',()=>{
  const source=terms();expect(parseCoachingPlanConfiguration(source.builderConfig).offers.trade_review?.reviewSchedule).toBe('student_choice');expect(()=>validateTradeReviewOffer(source)).not.toThrow();
  const invalid={...source,builderConfig:{about:'',offers:{trade_review:{details:'',resources:[],tradeReviewFormat:'pack' as const,reviewSchedule:'on_request' as const,submissionLimits:{perPeriod:10}}}}};expect(()=>validateTradeReviewOffer(invalid)).toThrow('fixed quantity');
 });
 it('sets an explicit start in a new independent scheduled proposal without changing old agreements',()=>{const source=terms();expect(withTradeReviewStartDate({...source,startDate:null},'2026-11-05T18:00:00.000Z').startDate).toBe('2026-11-02');expect(withTradeReviewStartDate(source,'2026-11-05T18:00:00.000Z')).toBe(source);});
});
describe('pack and recurring consumption periods',()=>{
 it('starts new recurring request periods on the agreed service date, not a forced Monday',()=>{expect(submissionPeriodForOffer('2026-11-10T18:00:00Z','weekly','2026-11-04',null,'recurring')).toEqual({start:'2026-11-04',end:'2026-11-10'});expect(submissionPeriodForOffer('2026-11-11T18:00:00Z','weekly','2026-11-04',null,'recurring')).toEqual({start:'2026-11-11',end:'2026-11-17'});});
 it('keeps monthly service dates across short months',()=>{expect(submissionPeriodForOffer('2026-03-30T18:00:00Z','monthly','2026-01-31',null,'recurring')).toEqual({start:'2026-02-28',end:'2026-03-30'});});
 it('never replenishes a pack merely because time has passed',()=>{const period=submissionPeriodForOffer('2027-03-01T18:00:00Z','once','2026-11-04',null,'pack');expect(()=>requireSubmissionAllowance({perPeriod:10},1,'2027-03-01T18:00:00Z',period,[{at:'2026-11-04T18:00:00Z',quantity:10}],'pack')).toThrow('pack have been used');});
});
