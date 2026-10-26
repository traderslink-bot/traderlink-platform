// @vitest-environment node
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { beforeAll,describe,it,expect,vi,afterEach } from 'vitest';
import { runPlatformMigrations } from '../database/run-platform-migrations';
import { PlatformMembershipRepository } from '../membership/platform-membership-repository';
import { MoomooConnectionRepository } from './moomoo-connection-repository';
import { decryptMoomooCredentials } from './moomoo-connection-credentials';
import { refreshMoomooAccessToken } from './moomoo-oauth';
import { MoomooConnectionAccessService } from './moomoo-connection-access-service';
vi.mock('./moomoo-connection-credentials',()=>({decryptMoomooCredentials:vi.fn(()=>({accessToken:'synthetic-access',refreshToken:'synthetic-refresh'})),loadMoomooCredentialKeyConfiguration:vi.fn(()=>({})),encryptMoomooCredentials:vi.fn()}));
vi.mock('./moomoo-oauth',()=>({getMoomooOAuthConfig:vi.fn(),refreshMoomooAccessToken:vi.fn()}));
let schema:Buffer;
beforeAll(()=>{const db=new Database(':memory:');db.pragma('foreign_keys=ON');runPlatformMigrations(db);schema=db.serialize();db.close()},30000);
afterEach(()=>vi.clearAllMocks());
function fixture(limit?:number|null){const db=new Database(schema);db.pragma('foreign_keys=ON');const user=randomUUID(),at=new Date().toISOString();db.prepare("INSERT INTO platform_users VALUES (?,'test',?,'QA','active',?,?)").run(user,user,at,at);const membership=new PlatformMembershipRepository(db);membership.synchronizeBuiltInFeatures(user,at);
// These admission cases test enforced limits explicitly; the deployment's
// default-off rollout must not silently determine fixture semantics.
db.prepare("INSERT INTO platform_membership_feature_policies VALUES ('broker.connections','enforced',?,?)").run(user,at);
if(limit!==undefined){const plan=membership.createPlan({actorUserId:user,planKey:'qa-broker-'+randomUUID(),name:'QA brokers',visibility:'unlisted',features:[{featureKey:'broker.connections',limitValue:limit}],atUtc:at});membership.publishPlanVersion({actorUserId:user,planVersionId:plan.planVersionId,atUtc:at});membership.grantEntitlement({actorUserId:user,userId:user,planVersionId:plan.planVersionId,sourceType:'free_plan',sourceRef:'qa-broker',startsAtUtc:at,endsAtUtc:null,atUtc:at});}
const scopes=[0,1].map(()=>{const workspaceId=randomUUID();db.prepare("INSERT INTO platform_workspaces VALUES (?,'QA','UTC','active',?,?)").run(workspaceId,at,at);return {userId:user,workspaceId,workspaceRole:'owner' as const,allowedAccountIds:[],activeAccountId:null}});const repo=new MoomooConnectionRepository(db);const seed=(index:number)=>db.prepare("INSERT INTO platform_broker_connections VALUES (?,?,?,'moomoo','active','qa','abcdefghijklmnop','cipher','abcdefghijklmnop',?,'[\"trade:read\"]',?,?,NULL)").run(randomUUID(),user,scopes[index].workspaceId,new Date(Date.parse(at)+86400000).toISOString(),new Date(Date.parse(at)+index).toISOString(),new Date(Date.parse(at)+index).toISOString());return {db,user,scopes,repo,seed,at}}
describe('broker membership admission',()=>{
  it.each([undefined,0])('denies missing/zero allowance before decrypting or refreshing (%s)',async limit=>{const f=fixture(limit);try{f.seed(0);await expect(new MoomooConnectionAccessService(f.repo).accessToken(f.scopes[0])).rejects.toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');expect(()=>f.repo.assertAuthorizationAllowed(f.scopes[1])).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');expect(decryptMoomooCredentials).not.toHaveBeenCalled();expect(refreshMoomooAccessToken).not.toHaveBeenCalled();}finally{f.db.close()}});
  it('preserves old connections but limits use to the oldest allowed slot on downgrade',()=>{const f=fixture(1);try{f.seed(0);f.seed(1);expect(()=>f.repo.assertAccessAllowed(f.scopes[0])).not.toThrow();expect(()=>f.repo.assertAccessAllowed(f.scopes[1])).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');expect(f.db.prepare('SELECT COUNT(*) n FROM platform_broker_connections').get()).toEqual({n:2});}finally{f.db.close()}});
  it('allows unlimited slots and respects an explicit off rollout policy',()=>{const f=fixture(null);try{f.seed(0);f.seed(1);for(const scope of f.scopes)expect(()=>f.repo.assertAccessAllowed(scope)).not.toThrow();f.db.prepare("UPDATE platform_membership_entitlements SET status='revoked'").run();f.db.prepare("UPDATE platform_membership_feature_policies SET enforcement_mode='off',updated_by_user_id=?,updated_at_utc=? WHERE feature_key='broker.connections'").run(f.user,f.at);expect(()=>f.repo.assertAccessAllowed(f.scopes[1])).not.toThrow();}finally{f.db.close()}});
  it('allows an included member to use its token without an unnecessary provider refresh',async()=>{const f=fixture(1);try{f.seed(0);expect(await new MoomooConnectionAccessService(f.repo).accessToken(f.scopes[0])).toBe('synthetic-access');expect(refreshMoomooAccessToken).not.toHaveBeenCalled()}finally{f.db.close()}});

});
