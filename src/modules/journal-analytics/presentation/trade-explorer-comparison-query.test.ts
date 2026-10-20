import {describe,it,expect} from 'vitest';
import {comparisonQueryFromExplorerQuery} from '@/app/(dashboard)/analytics/trade-explorer/trade-explorer-comparison-model';
import {normalizeAnalyticsLabPlatformQuery} from '@/app/(dashboard)/analytics/lab/analytics-lab-platform-query';
import type {AnalyticsLabPlatformQuery} from '@/app/(dashboard)/analytics/lab/analytics-lab-platform-types';

describe('comparison submission from the shared Explorer model',()=>{
 it('submits valid base filters when the model also carries Journal annotation filters',()=>{
  const query={expectedAccountSelectionRef:'selection-reference',metricId:'total_trades',grouping:'total',moneyBasis:'gross',currency:'USD',symbol:null,direction:null,tradeClassification:null,provenance:null,outcome:null,entryWeekday:null,entrySession:null,entryTimeBucketMinutes:30,entryTimeBucket:null,startDate:'2026-10-13',endDate:'2026-10-16',minimumHoldingSeconds:'1',maximumHoldingSeconds:null,minimumEnteredQuantity:null,maximumEnteredQuantity:null,minimumPositionQuantity:null,maximumPositionQuantity:null,minimumEntryNotional:null,maximumEntryNotional:null,evidenceRows:50,tagId:null,untaggedOnly:false,noteState:null,reviewIncompleteOnly:false,ruleId:null,ruleVersionId:null,ruleStatus:null,dayNoteState:null,dayRuleId:null,dayRuleVersionId:null,dayRuleStatus:null} as const;
  expect(()=>normalizeAnalyticsLabPlatformQuery(query)).toThrow();
  const submission=comparisonQueryFromExplorerQuery(query as AnalyticsLabPlatformQuery);
  expect(normalizeAnalyticsLabPlatformQuery(submission)).toEqual(submission);
  expect(submission.startDate).toBe(query.startDate);expect(submission.endDate).toBe(query.endDate);
  expect(submission.minimumHoldingSeconds).toBe('1');expect(submission.expectedAccountSelectionRef).toBe('selection-reference');
  expect(submission).not.toHaveProperty('tagId');
 });
});
