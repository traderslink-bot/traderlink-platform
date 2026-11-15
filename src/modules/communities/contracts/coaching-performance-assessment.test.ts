import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {defaultPerformanceTemplate,withRequiredPerformanceAssessment,parsePerformanceTemplate,performanceProgress,PERFORMANCE_CRITERIA,PERFORMANCE_ASSESSMENT_ID,PERFORMANCE_ASSESSMENT_TITLE,PERFORMANCE_ASSESSMENT_GUIDANCE} from './coaching-performance-evaluation';
import {PerformanceTemplateEditor,PerformanceTemplateSummary} from '@/app/(member)/coaching/performance-template-editor';

describe('required Performance period assessment',()=>{
 it('selects all six criteria for new plans without changing a saved narrower selection',()=>{
  const template=defaultPerformanceTemplate();expect(template.criteria.map(criterion=>criterion.id)).toEqual(PERFORMANCE_CRITERIA.map(criterion=>criterion.id));expect(new Set(template.criteria.map(criterion=>criterion.id)).size).toBe(6);
  const narrower={...template,criteria:[template.criteria[0]],periodDesign:{version:1 as const,journalEvidence:false,overallGoals:false}};
  expect(withRequiredPerformanceAssessment(parsePerformanceTemplate(narrower)).criteria).toHaveLength(1);
 });

 it('uses the owner title and instructions as an enabled required written field',()=>{
  const template=parsePerformanceTemplate(defaultPerformanceTemplate());
  expect(template.writtenFeedback?.fields.find(field=>field.id===PERFORMANCE_ASSESSMENT_ID)).toMatchObject({title:'Overall written assessment for the review period.',guidance:"Evaluate the student's overall progress toward their trading goals during the review period.\nDescribe improvements in trading performance, decision-making, execution, risk management, and consistency. Highlight areas where the student has made meaningful progress, identify goals that still require attention, and explain how their development compares with previous reviews. Provide a balanced assessment of their strengths, ongoing challenges, and overall direction as a trader.",enabled:true,required:true});
  expect(template.periodDesign.overallGoals).toBe(false);
 });
 it('blocks completion until the actual assessment response is provided',()=>{
  const template=defaultPerformanceTemplate(),evaluation={templateVersion:template.version,answers:Object.fromEntries(template.criteria.map(criterion=>[criterion.id,5])),whatWorked:'Good decisions',whatToImprove:'Improve risk',nextAction:'Follow the plan',writtenAnswers:{}};
  expect(performanceProgress(evaluation,template).ready).toBe(false);
  expect(performanceProgress({...evaluation,writtenAnswers:{[PERFORMANCE_ASSESSMENT_ID]:'Overall progress assessment'}},template).ready).toBe(true);
 });
 it('renders the required card with other written feedback and removes the separate goals checkbox',()=>{
  const template=defaultPerformanceTemplate(),html=renderToStaticMarkup(React.createElement(PerformanceTemplateEditor,{value:template,onChange:()=>{}}));
  expect(html).toContain(PERFORMANCE_ASSESSMENT_TITLE);expect(html).toContain('Required');expect(html).not.toContain('Progress toward goals (overall written assessment)');expect(html).not.toContain('Include custom field');
  const summary=document.createElement('div');summary.innerHTML=renderToStaticMarkup(React.createElement(PerformanceTemplateSummary,{template}));expect(summary.textContent).toContain(PERFORMANCE_ASSESSMENT_GUIDANCE.split('\n')[0]);
 });
 it('normalizes editable offers without overwriting their customized instructions or other fields',()=>{
  const original=defaultPerformanceTemplate(),edited={...original,writtenFeedback:{...original.writtenFeedback!,fields:original.writtenFeedback!.fields.map(field=>field.id===PERFORMANCE_ASSESSMENT_ID?{...field,guidance:'Coach instructions',enabled:false,required:false}:field)}};
  const configured=withRequiredPerformanceAssessment(edited);expect(configured.writtenFeedback?.fields.find(field=>field.id===PERFORMANCE_ASSESSMENT_ID)).toMatchObject({guidance:'Coach instructions',enabled:true,required:true});expect(edited.writtenFeedback.fields.find(field=>field.id===PERFORMANCE_ASSESSMENT_ID)?.enabled).toBe(false);
 });
 it('does not add a new requirement when reading an older accepted snapshot',()=>{
  const template=defaultPerformanceTemplate(),legacy={...template,writtenFeedback:{...template.writtenFeedback!,fields:template.writtenFeedback!.fields.filter(field=>field.id!==PERFORMANCE_ASSESSMENT_ID)},periodDesign:{...template.periodDesign,overallGoals:true}};
  const parsed=parsePerformanceTemplate(legacy);expect(parsed.writtenFeedback?.fields.some(field=>field.id===PERFORMANCE_ASSESSMENT_ID)).toBe(false);expect(parsed.periodDesign.overallGoals).toBe(true);
 });
});
