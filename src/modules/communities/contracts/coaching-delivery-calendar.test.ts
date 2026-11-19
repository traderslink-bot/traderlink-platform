import {describe,it,expect} from 'vitest';
import {addDeliveryDays,nextReviewMonday} from './coaching-delivery-calendar';
import {coachingPeriod,coachingReviewCoverage,type CoachingAgreementTerms} from './coaching-agreements';
import {submissionDeadline} from './coaching-review-timing';
import {chooseStudentReviewSchedules,requireFutureCoachingReviewWeek,withTradeReviewStartDate} from './coaching-review-schedule-choice';
import {parseCoachingPlanConfiguration} from './coaching-plan-configuration';
const item={planItemId:'day',itemType:'trading_day_review' as const,frequency:'weekly' as const,coveragePeriod:'single_item' as const,quantity:1,dueOffsetDays:6,selectionMode:'coach_or_student' as const,followUpDays:0,measurementKind:'trading_days' as const,plannedMinutes:null,timelineEnabled:true,reviewDepth:'complete_day' as const,ordinal:0};
const terms=(modern=true,count:'calendar'|'weekdays'='calendar'):CoachingAgreementTerms=>({planId:'plan',planRevision:1,planName:'Day reviews',description:'',priceAmountMinor:0,currency:'USD',billingCadence:'weekly',paymentInstructions:'',requiredDiscordRoleId:null,autoArchiveAfterDays:null,startDate:'2026-11-03',customIntervalDays:null,dueTimeUtc:'18:00',items:[item],...(modern?{builderConfig:{about:'',offers:{trading_day_review:{details:'',resources:[],weeklySchedule:'monday',deliveryDayCount:count}}}}:{})});
describe('agreed Monday weeks and delivery days',()=>{
 it('checks the same future-week boundary before proposing without changing legacy or request schedules',()=>{
  const proposed={...terms(),startDate:'2026-11-09'};
  expect(()=>requireFutureCoachingReviewWeek(proposed,'2026-11-10T15:00:00.000Z')).toThrow('first review week has already started');
  expect(()=>requireFutureCoachingReviewWeek(proposed,'2026-11-09T15:00:00.000Z')).not.toThrow();
  expect(()=>requireFutureCoachingReviewWeek(terms(false),'2026-11-10T15:00:00.000Z')).not.toThrow();
  expect(()=>requireFutureCoachingReviewWeek({...proposed,items:[{...item,timelineEnabled:false}]},'2026-11-10T15:00:00.000Z')).not.toThrow();
  expect(proposed.startDate).toBe('2026-11-09');
 });
 it('starts a Tuesday signup on the next Monday, retaining consecutive full weeks',()=>{
  expect(nextReviewMonday('2026-11-03')).toBe('2026-11-09');expect(nextReviewMonday('2026-11-09')).toBe('2026-11-09');
  expect(coachingPeriod(terms(),item,0)).toEqual({start:'2026-11-09',end:'2026-11-15',dueAtUtc:'2026-11-21T18:00:00.000Z'});
  expect(coachingPeriod(terms(),item,1)?.start).toBe('2026-11-16');
 });
 it('skips weekends for scheduled deadlines only when the coach chooses weekdays',()=>{
  expect(coachingPeriod(terms(true,'weekdays'),item,0)?.dueAtUtc).toBe('2026-11-23T18:00:00.000Z');
  expect(addDeliveryDays('2026-12-24',1,'weekdays')).toBe('2026-12-25');
 });
 it('uses the accepted delivery count for requests across weekends and retains calendar timestamps',()=>{
  expect(submissionDeadline('2026-11-06T23:30:00.000Z',1,'weekdays')).toBe('2026-11-09T23:30:00.000Z');
  expect(submissionDeadline('2026-11-06T23:30:00.000Z',1,'calendar')).toBe('2026-11-07T23:30:00.000Z');
  expect(submissionDeadline('2026-10-30T20:00:00.000Z',1,'weekdays')).toBe('2026-11-02T20:00:00.000Z');
 });
 it('uses the current selected trading week for new calendar-week coverage',()=>{
  const base=terms(),modern={...base,builderConfig:{...base.builderConfig!,offers:{trading_day_review:{...base.builderConfig!.offers.trading_day_review!,submissionSchedule:'weekend_choice' as const}}}},calendarItem={...item,coveragePeriod:'calendar_week' as const};
  const period=coachingPeriod(modern,calendarItem,0)!;expect(coachingReviewCoverage(modern,calendarItem,period)).toEqual({start:'2026-11-09',end:'2026-11-13'});
 });
 it('keeps two-week cycles aligned to Monday and starts Sunday signups the following day',()=>{
  const fortnight={...item,frequency:'every_two_weeks' as const};expect(coachingPeriod({...terms(),items:[fortnight]},fortnight,0)?.end).toBe('2026-11-22');
  expect(nextReviewMonday('2026-11-08')).toBe('2026-11-09');
 });
 it('lets the student choose requests immediately rather than waiting for the offered Monday',()=>{
  const trade={...item,itemType:'trade_review' as const},source={...terms(),startDate:'2026-11-09',items:[trade],builderConfig:{about:'',offers:{trade_review:{details:'',resources:[],weeklySchedule:'monday' as const,reviewSchedule:'student_choice' as const}}}};
  const accepted=chooseStudentReviewSchedules(source,{day:'on_request'},'2026-11-03T15:00:00.000Z');expect(accepted.startDate).toBe('2026-11-03');expect(accepted.items[0].timelineEnabled).toBe(false);
 });
 it('leaves legacy accepted start dates and deadlines unchanged',()=>{expect(coachingPeriod(terms(false),item,0)).toEqual({start:'2026-11-03',end:'2026-11-09',dueAtUtc:'2026-11-15T18:00:00.000Z'});});
 it('prepares dated independent proposals and rejects expired first weeks before acceptance',()=>{
  const proposal=withTradeReviewStartDate({...terms(),startDate:null},'2026-11-03T15:00:00.000Z');expect(proposal.startDate).toBe('2026-11-09');
  expect(()=>chooseStudentReviewSchedules(proposal,{},'2026-11-10T15:00:00.000Z')).toThrow('first review week has already started');
  expect(chooseStudentReviewSchedules(proposal,{},'2026-11-09T15:00:00.000Z')).toBe(proposal);
 });
 it('retains policies through validated config and rejects unknown modes',()=>{
  expect(parseCoachingPlanConfiguration(terms().builderConfig).offers.trading_day_review).toMatchObject({weeklySchedule:'monday',deliveryDayCount:'calendar'});
  expect(()=>parseCoachingPlanConfiguration({about:'',offers:{trading_day_review:{details:'',resources:[],deliveryDayCount:'market'}}})).toThrow();
 });
});
