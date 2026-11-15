import {describe,expect,it} from 'vitest';
import {initialOfferSettings,PLAN_OFFERS,standaloneReviewOfferConfiguration,standaloneReviewOfferSettings} from '@/app/(dashboard)/communities/coaching-plan-offers';
import {parseCoachingPlanConfiguration} from './coaching-plan-configuration';
describe('standalone review schedule persistence',()=>{
 it.each(['trade_review','trading_day_review'] as const)('round-trips weekday delivery for %s',type=>{
  const defaults=initialOfferSettings(PLAN_OFFERS.find(offer=>offer.type===type)!);
  const config=parseCoachingPlanConfiguration({about:'',offers:{[type]:{details:'',resources:[],...standaloneReviewOfferConfiguration(type,{...defaults,deliveryDayCount:'weekdays'})}}});
  expect(standaloneReviewOfferSettings(config.offers[type])).toMatchObject({weeklySchedule:'monday',submissionSchedule:'weekend_choice',deliveryDayCount:'weekdays'});
 });
 it.each([{format:'pack',schedule:'on_request'},{format:'recurring',schedule:'on_request'},{format:'recurring',schedule:'student_choice'}] as const)('preserves $format/$schedule, total and daily limits',({format,schedule})=>{
  const defaults=initialOfferSettings(PLAN_OFFERS.find(offer=>offer.type==='trade_review')!);
  const config=parseCoachingPlanConfiguration({about:'',offers:{trade_review:{details:'',resources:[],...standaloneReviewOfferConfiguration('trade_review',{...defaults,tradeReviewFormat:format,reviewSchedule:schedule,quantity:'7',maxTradesSubmittedPerDay:'2'})}}});
  expect(config.offers.trade_review?.submissionLimits).toEqual({perPeriod:7,perDay:2});
  expect(standaloneReviewOfferSettings(config.offers.trade_review)).toMatchObject({tradeReviewFormat:format,reviewSchedule:schedule,maxTradesSubmittedPerDay:'2'});
 });
});
