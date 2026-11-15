import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CoachingStudentReviewPreferences} from '../../../../app/coaching-student-review-preferences';
import {describe,it,expect} from 'vitest';
import {earlierTradeAllowed,studentReviewPreferences,coachTradeDateAllowed} from './coaching-student-review-preferences';
import {CoachingSubmissionLimitError,requestSubmissionLimits,requireSubmissionAllowance,submissionPeriod} from './coaching-request-submission-limits';
import {parseCoachingPlanConfiguration} from './coaching-plan-configuration';
describe('student control over earlier trades',()=>{
 it('defaults to student choice and never grants coach lookback implicitly',()=>{
  expect(studentReviewPreferences(undefined)).toEqual({olderTrades:'student_only'});
  expect(earlierTradeAllowed(undefined,'2020-01-01',false)).toBe(false);
  expect(earlierTradeAllowed(undefined,'2020-01-01',true)).toBe(true);
  expect(earlierTradeAllowed(undefined,'2020-01-01',false,true)).toBe(true);
 });
 it('offers preferences on the student form and keeps accepted preferences read-only',()=>{
  const render=(props:Parameters<typeof CoachingStudentReviewPreferences>[0])=>renderToStaticMarkup(React.createElement(CoachingStudentReviewPreferences,props));
  expect(render({})).toContain('Who chooses older trades?');
  expect(render({value:{olderTrades:'earliest_date',earliestDate:'2026-10-01'}})).toContain('name="earliestTradeDate"');
  const accepted=render({readOnly:true,value:{olderTrades:'earliest_date',earliestDate:'2026-10-01'}});expect(accepted).toContain('2026-10-01');expect(accepted).not.toContain('<input');
 });
 it('enforces the exact date the student approved',()=>{
  const preference=studentReviewPreferences('earliest_date','2026-10-01');
  expect(earlierTradeAllowed(preference,'2026-09-30',false)).toBe(false);
  expect(earlierTradeAllowed(preference,'2026-10-01',false)).toBe(true);
  expect(coachTradeDateAllowed(preference,'2026-09-30','2026-09-01',false)).toBe(false);
  expect(coachTradeDateAllowed(preference,'2026-09-30','2026-09-01',false,true)).toBe(true);
  expect(()=>studentReviewPreferences('earliest_date','2026-02-30')).toThrow();
 });
});
describe('on-request submission limits',()=>{
 const period={start:'2026-11-02',end:'2026-11-08'},at='2026-11-05T18:00:00.000Z';
 it('permits split batches and counts the entire period',()=>{
  expect(()=>requireSubmissionAllowance({perPeriod:7},7,at,period,[])).not.toThrow();
  expect(()=>requireSubmissionAllowance({perPeriod:7},2,at,period,[{at:'2026-11-02T18:00:00Z',quantity:6}])).toThrow('1 trade remains');
 });
 it('makes the daily cap optional and counts submitted trades rather than trading dates',()=>{
  expect(()=>requireSubmissionAllowance({perPeriod:7},7,at,period,[])).not.toThrow();
  expect(()=>requireSubmissionAllowance({perPeriod:7,perDay:2},2,at,period,[{at,quantity:1}])).toThrow('daily limit');
  expect(()=>requireSubmissionAllowance({perPeriod:7,perDay:2},2,at,period,[{at:'2026-11-04T18:00:00Z',quantity:1}])).not.toThrow();
 });
 it('uses Eastern calendar days and Monday renewal, including DST',()=>{
  expect(submissionPeriod('2026-11-09T04:59:00Z','weekly','2026-10-19')).toEqual({start:'2026-11-02',end:'2026-11-08'});
  expect(submissionPeriod('2026-11-09T05:00:00Z','weekly','2026-10-19')).toEqual({start:'2026-11-09',end:'2026-11-15'});
 });
 it('validates and preserves optional limits through the saved plan parser',()=>{
  expect(requestSubmissionLimits({perPeriod:7})).toEqual({perPeriod:7});
  expect(()=>requestSubmissionLimits({perPeriod:7,perDay:8})).toThrow();
  expect(parseCoachingPlanConfiguration({about:'',offers:{trade_review:{details:'',resources:[],submissionLimits:{perPeriod:7,perDay:2}}}}).offers.trade_review?.submissionLimits).toEqual({perPeriod:7,perDay:2});
 });
});

it.each([
 {limit:'daily',format:'recurring',quantity:1,used:2,perPeriod:3,perDay:2,message:/daily limit/},
 {limit:'period',format:'recurring',quantity:2,used:2,perPeriod:3,perDay:2,message:/trade reviews available for this period.*1 trade remains/},
 {limit:'pack',format:'pack',quantity:1,used:2,perPeriod:2,perDay:undefined,message:/All trade reviews in this pack have been used/},
] as const)('identifies the $limit rejection and provides a student-safe message',({limit,format,quantity,used,perPeriod,perDay,message})=>{
 const at='2026-11-14T19:00:00.000Z',period={start:'2026-11-09',end:'2026-11-15'};
 let error:unknown;
 try{requireSubmissionAllowance({perPeriod,perDay},quantity,at,period,[{at,quantity:used}],format);}
 catch(caught){error=caught;}
 expect(error).toBeInstanceOf(CoachingSubmissionLimitError);
 expect(error).toMatchObject({limit,message:expect.stringMatching(message)});
});
