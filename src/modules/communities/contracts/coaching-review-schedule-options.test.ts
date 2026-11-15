import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {CoachingPlanOfferEditor} from '../../../../app/coaching-plan-offer-editor';
import {PLAN_OFFERS,initialOfferSettings,offerSummary} from '../../../../app/(dashboard)/communities/coaching-plan-offers';

describe('explicit review schedule setup',()=>{
 it.each(['trade_review','trading_day_review','performance_review'])('%s explains each deadline trigger and keeps turnaround editable on request',type=>{
  const offer=PLAN_OFFERS.find(offer=>offer.type===type)!;
  const value=initialOfferSettings(offer);
  const markup=(timeline:boolean)=>renderToStaticMarkup(React.createElement(CoachingPlanOfferEditor,{offer,value:{...value,timeline},onChange:()=>{},onRemove:()=>{}}));
  expect(markup(true)).toContain(type==='performance_review'?'Review the work after the period ends.':'Early submission does not');
  expect(markup(false)).toContain(type==='performance_review'?'When the student sends you work':'The student sends their');
  expect(markup(false)).toContain('Deliver within (days)');
  if(type==='trade_review')expect(markup(false)).toContain('Maximum trades submitted per day');
  expect(offerSummary(offer,{...value,timeline:false,dueDays:'5'})).toContain('Review due: 5 days after submission');
  expect(offerSummary(offer,{...value,timeline:true,dueDays:'5'})).toContain(type==='performance_review'?'Review due: 5 days after the scheduled period ends':'Review due: 5 days after the submission cutoff');
 });
});
