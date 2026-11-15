import Database from 'better-sqlite3';
import {describe,expect,it} from 'vitest';
import {defaultCoachingCommercialPolicy} from '../contracts/coaching-commercial-policy';
import {readCoachCommercialAccess,requireCoachCommercialAccess} from './coaching-commercial-access';
import {requireStandaloneStudentCoachingAccess} from './coaching-student-platform-access';

const coachUserId='00000000-0000-4000-8000-000000000001';
const atUtc='2026-11-03T15:00:00.000Z';

describe('standalone coaching beta access',()=>{
 it('starts with no commission or coach subscription prerequisite',()=>{
  expect(defaultCoachingCommercialPolicy('platform')).toEqual({version:1,policyVersion:'initial-platform-v2',scope:'platform',commissionEnabled:false,commissionBasisPoints:0,coachSubscriptionRequired:false});
 });

 it('lets an authenticated user start outside coaching without community or payment setup',()=>{
  const database=new Database(':memory:');
  const access=readCoachCommercialAccess(database,{coachUserId,scope:'platform',atUtc});
  expect(access).toMatchObject({allowed:true,scope:'platform',commissionRequired:false,subscriptionRequired:false,reason:'ready'});
  expect(requireCoachCommercialAccess(database,{coachUserId,scope:'platform',atUtc}).allowed).toBe(true);
  database.close();
 });

 it('lets a student request coaching without a paid platform coaching entitlement',()=>{
  const database=new Database(':memory:');
  expect(()=>requireStandaloneStudentCoachingAccess(database,'00000000-0000-4000-8000-000000000002',atUtc)).not.toThrow();
  database.close();
 });
});
