// @vitest-environment node
import type Database from 'better-sqlite3';
import { beforeEach,describe,expect,it,vi } from 'vitest';
const state=vi.hoisted(()=>({included:false,owner:false,legacy:'not_subscribed',schema:true,read:vi.fn()}));
vi.mock('./platform-membership-access',()=>({evaluateMembershipFeature:()=>({mode:'enforced',allowed:state.included,ownerBypass:state.owner}),hasPlatformMembershipFeature:()=>state.included}));
vi.mock('../billing/whop-ai-review-entitlement-repository',()=>({isWhopAiReviewEntitlementSchemaAvailable:()=>state.schema,WhopAiReviewEntitlementRepository:class{readAccess(){state.read();return {state:state.legacy}}}}));
import { CoachAiReviewRequestService } from '../../../coach/server/coach-ai-review-request-service';
import { CoachAiReviewProviderControlsRepository } from '../../../coach/server/coach-ai-review-provider-controls-repository';
import { hasAiReviewGenerationAccess,assertAiReviewGenerationAccess } from './membership-ai-review-access';
import { CoachAiReviewWhopPaidAccessPolicyV2 } from '../../../coach/server/coach-ai-review-whop-paid-access-policy';
import type { WorkspaceAccessScope } from '../../contracts/workspace-access-scope';
const db={} as Database.Database,scope={userId:'member'} as WorkspaceAccessScope;
beforeEach(()=>{state.included=false;state.owner=false;state.legacy='not_subscribed';state.schema=true;state.read.mockClear()});
describe('AI Review generation admission',()=>{
 it('accepts a plan/add-on without Whop configuration or a linked Whop identity',()=>{state.included=true;state.schema=false;expect(hasAiReviewGenerationAccess(db,'member')).toBe(true);expect(new CoachAiReviewWhopPaidAccessPolicyV2(db,{NODE_ENV:"test"}).read(scope)).toBe('available');expect(state.read).not.toHaveBeenCalled()});
 it('preserves confirmed active legacy access',()=>{state.legacy='active';expect(hasAiReviewGenerationAccess(db,'member')).toBe(true)});
 it.each(['not_linked','not_subscribed','conflict'])('rejects unavailable legacy state %s',legacy=>{state.legacy=legacy;expect(()=>assertAiReviewGenerationAccess(db,'member')).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');expect(new CoachAiReviewWhopPaidAccessPolicyV2(db,{NODE_ENV:"test"}).read(scope)).toBe('not_connected')});
 it('allows global readiness without authorizing an individual account',()=>{const policy=new CoachAiReviewWhopPaidAccessPolicyV2(db,{NODE_ENV:"test"});expect(policy.read()).toBe('available');expect(policy.read(scope)).toBe('not_connected')});
 it('preserves the existing operator bypass and denies a missing legacy schema',()=>{state.schema=false;expect(hasAiReviewGenerationAccess(db,'member')).toBe(false);state.owner=true;expect(hasAiReviewGenerationAccess(db,'member')).toBe(true)});
 it('rejects provider reservation and dispatch before any budget or credential work',()=>{
  const prepare=vi.fn(()=>{throw Error('Unexpected database mutation')});
  const controls=new CoachAiReviewProviderControlsRepository({prepare} as unknown as Database.Database);
  expect(()=>controls.reserveReviewGeneration(scope,{attemptId:'test',reviewKind:'weekly',providerInputText:'test',maxOutputTokens:1})).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');
  expect(()=>controls.reserveReviewGenerationV2(scope,{attemptId:'test',reviewKind:'weekly',providerInputText:'test',maxOutputTokens:1})).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');
  expect(()=>controls.markProviderStarted(scope,'test')).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');
  expect(()=>controls.markProviderStartedV2(scope,'test')).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');
  expect(prepare).not.toHaveBeenCalled();
 });

 it('denies a direct manual request before reading or creating any snapshot',()=>{
  const prepare=vi.fn(()=>{throw Error('Unexpected database access')});
  const service=new CoachAiReviewRequestService({prepare} as unknown as Database.Database);
  expect(()=>service.requestManual(scope,{reviewKind:'weekly',periodStartDate:'2026-10-05',periodEndDate:'2026-10-11'})).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');
  expect(prepare).not.toHaveBeenCalled();
 });

});
