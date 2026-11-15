import {describe,expect,it} from 'vitest';
import {defaultTradeEvaluationTemplate,parseTradeEvaluationTemplate,tradeWrittenFields} from './coaching-trade-evaluation';
import {defaultPerformanceTemplate,parsePerformanceTemplate} from './coaching-performance-evaluation';
import {defaultDaySessionReview} from './coaching-trading-day-evaluation';

const expected={
 nextAction:"Describe the specific action or change the student should focus on during the next review period.\n\nExplain what the student should do differently, how to apply it to future trades, and what successful execution would look like. Keep the guidance clear, practical, and achievable, focusing on the most important improvement identified in the review.",
 whatWorked:"Describe the successful decisions, behaviors, and strategies the student demonstrated during the review period.\n\nExplain what the student did well, why those actions were effective, and how they contributed to better trading decisions or execution. Highlight positive habits, improvements from previous reviews, and specific examples worth repeating in future trades.",
 whatToImprove:"Describe the most important areas where the student's trading decisions, execution, or discipline could improve.\n\nExplain what needs improvement, why it matters, and how the student could approach similar situations more effectively in future trades. Focus on constructive, actionable feedback that helps the student recognize mistakes, correct weaknesses, and develop more consistent trading habits.",
};
describe('new coaching plan feedback instructions',()=>{
 it.each(['Trade','Trading-day','Performance'] as const)('starts %s with the exact owner-provided instructions',kind=>{
  const template=kind==='Performance'?parsePerformanceTemplate(defaultPerformanceTemplate()):parseTradeEvaluationTemplate({...defaultTradeEvaluationTemplate(),...(kind==='Trading-day'?{daySessionReview:defaultDaySessionReview()}: {})});
  for(const [id,guidance] of Object.entries(expected))expect(template.writtenFeedback?.fields.find(field=>field.id===id)?.guidance).toBe(guidance);
 });
 it('does not insert new instructions into an older template without written-field configuration',()=>{
  const {writtenFeedback,reviewDesign,...legacy}=defaultTradeEvaluationTemplate();void writtenFeedback;void reviewDesign;
  expect(tradeWrittenFields(parseTradeEvaluationTemplate(legacy)).every(field=>field.guidance===undefined)).toBe(true);
 });
 it('keeps a saved coach customization and keeps newly created templates independent',()=>{
  const first=defaultTradeEvaluationTemplate();const edited={...first,writtenFeedback:{...first.writtenFeedback!,fields:first.writtenFeedback!.fields.map(field=>({...field,guidance:'My saved instructions'}))}};
  expect(parseTradeEvaluationTemplate(edited).writtenFeedback?.fields.every(field=>field.guidance==='My saved instructions')).toBe(true);
  expect(defaultTradeEvaluationTemplate().writtenFeedback?.fields[0].guidance).toBe(expected.whatWorked);
 });
});
