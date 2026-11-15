import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {CoachingAgreementPanel} from '@/app/(dashboard)/communities/coaching-agreement-panel';
import {createTraderLinkCommunityReviewFixture} from '../server/traderlink-community-review-fixture';
vi.mock('@/app/(dashboard)/communities/community-actions',()=>({coachingAgreementAction:()=>{}}));
import {coachingRequiredAccess} from './coaching-required-access';
import {defaultTradeEvaluationTemplate} from './coaching-trade-evaluation';
import {defaultPerformanceTemplate} from './coaching-performance-evaluation';
import {defaultDaySessionReview} from './coaching-trading-day-evaluation';
import {TradeEvaluationTemplateEditor} from '@/app/(member)/coaching/evaluation-template-editor';
import {PerformanceTemplateEditor} from '@/app/(member)/coaching/performance-template-editor';
import {CoachingJournalSharingPrompt} from '@/app/coaching-journal-sharing-prompt';

describe('student-controlled supporting Journal evidence',()=>{
 it.each(['trade_review','trading_day_review','performance_review'] as const)('%s does not require notes or tags even with Journal focus configured',itemType=>{
  const scopes=coachingRequiredAccess([{itemType,focusAreas:['journal','rules'],reviewDepth:'complete_day'}],{about:'',offers:{performance_review:{details:'',resources:[],includeDayJournal:true}}});
  expect(scopes).toContain('trades');expect(scopes).toContain('analytics');expect(scopes).toContain('rules');
  for(const optional of ['trade_notes','tags','journal_notes'])expect(scopes).not.toContain(optional);
 });
 it('preserves required evidence for legacy services explicitly sold as Journal reviews',()=>{
  expect(coachingRequiredAccess([{itemType:'journal_review',focusAreas:[],reviewDepth:'standard'}])).toEqual(expect.arrayContaining(['trade_notes','tags']));
 });
 it('removes the coach evidence toggle from Trade, Trading-day and Performance setup',()=>{
  const base=defaultTradeEvaluationTemplate(),trade={...base,reviewDesign:{version:1 as const,journalEvidence:true}};
  for(const element of [React.createElement(TradeEvaluationTemplateEditor,{value:trade,onChange:()=>{}}),React.createElement(TradeEvaluationTemplateEditor,{value:{...trade,daySessionReview:defaultDaySessionReview()},onChange:()=>{}}),React.createElement(PerformanceTemplateEditor,{value:defaultPerformanceTemplate(),onChange:()=>{}})])expect(renderToStaticMarkup(element)).not.toContain('Consider shared Journal notes and tags');
 });
 it('offers sharing before acceptance and an explicit action afterwards without granting access',()=>{
  const before=renderToStaticMarkup(React.createElement(CoachingJournalSharingPrompt,{}));expect(before).toContain('After accepting this agreement');expect(before).toContain('You choose what to share');
  const after=renderToStaticMarkup(React.createElement(CoachingJournalSharingPrompt,{href:'#sharing'}));expect(after).toContain('href="#sharing"');expect(after).toContain('Choose Journal sharing');expect(after).not.toContain('checked');
 });
});

it.each(['trade_review','trading_day_review','performance_review','private_session','group_lesson','questions','student_check_in','custom_task'] as const)('prompts the student to choose sharing for a %s agreement',itemType=>{
 const snapshot=createTraderLinkCommunityReviewFixture('student'),relationship=snapshot.relationships.find(r=>r.studentUserId===snapshot.viewer.userId)!,plan=snapshot.plans.find(p=>p.planId===relationship.planId)!;
 const item={...plan.items[0],itemType};
 const terms={planId:plan.planId,planRevision:1,planName:plan.name,description:plan.description,priceAmountMinor:0,currency:'USD',billingCadence:'monthly',paymentInstructions:'',requiredDiscordRoleId:null,autoArchiveAfterDays:null,items:[item],startDate:'2026-11-02',customIntervalDays:null,dueTimeUtc:'17:00'};
 const agreement={agreementId:'test-agreement',relationshipId:relationship.relationshipId,revision:1,status:'proposed' as const,terms,proposedAtUtc:'2026-11-01T00:00:00.000Z',acceptedAtUtc:null};
 const html=renderToStaticMarkup(React.createElement(CoachingAgreementPanel,{snapshot:{...snapshot,coachingAgreements:[agreement]},relationshipId:relationship.relationshipId}));
 expect(html).toContain('Choose your Journal sharing');expect(html).toContain('Choose Journal sharing');expect(html).toContain('section=sharing');
});
