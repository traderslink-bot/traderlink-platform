// @vitest-environment node
import Database from 'better-sqlite3';
import { expect, it, vi } from 'vitest';
vi.mock('../../platform/server/membership/platform-membership-repository',()=>({PlatformMembershipRepository:class {readEffectiveAccess(){return {booleanFeatures:[],limits:{},sources:[]};}}}));
import { evaluateMembershipFeature } from '../../platform/server/membership/platform-membership-access';
import { NEWS_FILTERS_FEATURE } from '../contracts/press-release-filters';
it('keeps the owner-approved rollout open until an actual enforced policy is selected',()=>{
 const db=new Database(':memory:');try{
  expect(evaluateMembershipFeature(db,'reader',NEWS_FILTERS_FEATURE)).toMatchObject({mode:'off',allowed:true});
  db.exec('CREATE TABLE platform_membership_feature_policies(feature_key TEXT,enforcement_mode TEXT)');
  expect(evaluateMembershipFeature(db,'reader',NEWS_FILTERS_FEATURE)).toMatchObject({mode:'off',allowed:true});
  db.prepare('INSERT INTO platform_membership_feature_policies VALUES(?,?)').run(NEWS_FILTERS_FEATURE,'off');
  expect(evaluateMembershipFeature(db,'reader',NEWS_FILTERS_FEATURE)).toMatchObject({mode:'off',allowed:true});
  db.prepare('UPDATE platform_membership_feature_policies SET enforcement_mode=?').run('enforced');
  expect(evaluateMembershipFeature(db,'reader',NEWS_FILTERS_FEATURE)).toMatchObject({mode:'enforced',allowed:false});
 }finally{db.close();}
});
