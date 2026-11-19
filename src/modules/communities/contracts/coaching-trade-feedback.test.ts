import {describe,it,expect} from 'vitest';
import {defaultTradeEvaluationTemplate,type TradeEvaluation} from './coaching-trade-evaluation';
import {readCoachingTradeFeedback,writeCoachingTradeFeedback,validateCoachingTradeFeedback,coachingTradeFeedbackComplete} from './coaching-trade-feedback';

const template=defaultTradeEvaluationTemplate();
const complete:TradeEvaluation={templateVersion:template.version,answers:Object.fromEntries(template.criteria.map(field=>[field.id,3])),whatWorked:'Controlled risk.',whatToImprove:'Plan the exit.',nextAction:'Write the stop before entry.'};
const encode=(evaluation:TradeEvaluation)=>writeCoachingTradeFeedback({summary:'',focus:{},evaluation});
describe('Community feedback honors accepted evaluation definitions',()=>{
 it('retains historical plain and versioned summary feedback without changing its completion rule',()=>{
  expect(readCoachingTradeFeedback('Original coach feedback')).toEqual({summary:'Original coach feedback',focus:{}});
  const text=writeCoachingTradeFeedback({summary:'Original summary',focus:{risk:'Original risk feedback'}});
  expect(coachingTradeFeedbackComplete(text,['risk'])).toBe(true);
  expect(coachingTradeFeedbackComplete(text,['risk'],template)).toBe(false);
  expect(readCoachingTradeFeedback(text)).toEqual({summary:'Original summary',focus:{risk:'Original risk feedback'}});
 });
 it('saves a valid partial draft but does not fulfill missing ratings or required written responses',()=>{
  const partial={...complete,answers:{},whatWorked:''};
  expect(readCoachingTradeFeedback(validateCoachingTradeFeedback(encode(partial),template)).evaluation).toEqual(partial);
  expect(coachingTradeFeedbackComplete(encode(partial),[],template)).toBe(false);
  expect(coachingTradeFeedbackComplete(encode({...complete,nextAction:''}),[],template)).toBe(false);
  expect(coachingTradeFeedbackComplete(encode(complete),[],template)).toBe(true);
 });
 it('rejects a different accepted version, extra criteria and old-client summary overwrites',()=>{
  expect(()=>validateCoachingTradeFeedback(encode({...complete,templateVersion:template.version+1}),template)).toThrow('accepted evaluation template version');
  expect(()=>validateCoachingTradeFeedback(encode({...complete,answers:{...complete.answers,unagreed:3}}),template)).toThrow('agreed evaluation fields');
  expect(()=>validateCoachingTradeFeedback('Legacy summary from an older open tab',template)).toThrow('existing feedback is unchanged');
 });
});
