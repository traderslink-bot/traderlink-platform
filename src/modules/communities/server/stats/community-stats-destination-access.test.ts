// @vitest-environment node
// Genuine session repositories with runtime DB-open port isolated. Dashboard and
// selected-account commercial gates are not qualified by these session controls.
import type Database from 'better-sqlite3';
import {randomUUID} from 'node:crypto';
import {afterEach,describe,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({db:null as Database.Database|null}));
vi.mock('../../../platform/server/database/open-platform-database',async original=>({...await original<typeof import('../../../platform/server/database/open-platform-database')>(),withPlatformDatabase:(_options:unknown,operation:(db:Database.Database)=>unknown)=>operation(state.db!)}));
vi.mock('../community-owner-review-request-identity',()=>({requireCommunityOwnerReviewIdentity:(identity:unknown)=>identity}));
vi.mock('../../../platform/server/authentication/require-platform-request-scope',async original=>{
 const actual=await original<typeof import('../../../platform/server/authentication/require-platform-request-scope')>();
 return {...actual,requireTraderLinkPlatformRequestIdentity:actual.requireTraderLinkPlatformAuthenticatedRequestIdentity};
});
import {TraderLinkCommunityRepository} from '../traderlink-community-repository';
import {openPristinePlatformTestDatabase} from '@/src/test/pristine-platform-test-database';
import {PlatformUserRepository} from '../../../platform/server/identity/platform-user-repository';
import {PlatformWorkspaceRepository} from '../../../platform/server/identity/platform-workspace-repository';
import {PlatformAuthenticationRepository} from '../../../platform/server/authentication/platform-authentication-repository';
import {PlatformSessionRepository} from '../../../platform/server/authentication/platform-session-repository';
import {PlatformSessionService,TRADERLINK_PLATFORM_SESSION_COOKIE} from '../../../platform/server/authentication/platform-session-service';
import {platformAuthCookieName} from '../../../platform/server/authentication/platform-auth-cookies';
import {requireTraderLinkPlatformAuthenticatedRequestIdentity} from '../../../platform/server/authentication/require-platform-request-scope';
import {revalidateCommunityStatsRequest,readCommunityStatsJson,hasCommunityStatsOwnAccess} from './community-stats-access';
function actor(){
 const db=state.db!,userId=randomUUID(),workspaceId=randomUUID(),subject=`${userId}@example.test`,at=new Date().toISOString();
 new PlatformUserRepository(db,{allowedAuthProviders:['email']}).createUser({userId,authProvider:'email',authSubject:subject,displayName:'Synthetic actor',createdAtUtc:at,updatedAtUtc:at});
 new PlatformAuthenticationRepository(db).linkIdentity({userId,authProvider:'email',authSubject:subject,linkedByUserId:userId,timestamp:at});
 new PlatformWorkspaceRepository(db).createWorkspaceWithOwner({workspaceId,ownerUserId:userId,displayName:'Synthetic',defaultTradingTimezone:'UTC',createdAtUtc:at});
 const session=new PlatformSessionService(new PlatformSessionRepository(db)).createForIdentity({userId,authProvider:'email',authSubject:subject});
 const request=new Request('https://app.traderslink.pro/api/communities/unit/stats',{headers:{cookie:`${platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)}=${session.token}`}});
 return {userId,request,sessionId:session.session.sessionId};
}
afterEach(()=>{state.db?.close();state.db=null;vi.unstubAllEnvs();vi.restoreAllMocks();});
describe('original native session revalidation',()=>{
 it('accepts the same current session but refuses its revocation after an await',async()=>{
  state.db=openPristinePlatformTestDatabase();vi.stubEnv('NODE_ENV','production');const a=actor();
  const original=requireTraderLinkPlatformAuthenticatedRequestIdentity(a.request.headers);
  await Promise.resolve();new PlatformSessionRepository(state.db).revokeActiveSessionForUser({userId:a.userId,sessionId:a.sessionId,timestamp:new Date().toISOString()});
  expect(()=>revalidateCommunityStatsRequest(a.request,original)).toThrow();
 });
 it('refuses a different actual session/actor instead of trusting retained userId',()=>{
  state.db=openPristinePlatformTestDatabase();vi.stubEnv('NODE_ENV','production');const a=actor(),b=actor();
  const original=requireTraderLinkPlatformAuthenticatedRequestIdentity(a.request.headers);
  expect(()=>revalidateCommunityStatsRequest(a.request,original)).not.toThrow();
  expect(()=>revalidateCommunityStatsRequest(b.request,original)).toThrow();
 });
 it('bounds the original request bytes without trusting Content-Length',async()=>{
  const request=new Request('https://app.traderslink.pro',{method:'POST',headers:{'content-type':'application/json'},body:' '.repeat(1501)});
  await expect(readCommunityStatsJson(request,1500)).rejects.toThrow();
 });
 it('preserves explicit own grant plus legacy capability; a destination-only or export grant cannot create entry',()=>{
  state.db=openPristinePlatformTestDatabase();state.db.pragma('foreign_keys=OFF');
  const community=randomUUID(),user=randomUUID(),at=new Date().toISOString();
  state.db.prepare("INSERT INTO community_stats_settings(community_id,created_at_utc,updated_at_utc,own_content_user_ids_json,export_user_ids_json) VALUES(?,?,?,?,?)").run(community,at,at,JSON.stringify([user]),JSON.stringify([user]));
  let capabilities:ReturnType<TraderLinkCommunityRepository['requireCapability']>['capabilities']=['community.view'];
  vi.spyOn(TraderLinkCommunityRepository.prototype,'requireCapability').mockImplementation(()=>({communityId:community,userId:user,isOwner:false,membershipStatus:'active',capabilities}));
  expect(hasCommunityStatsOwnAccess(state.db,community,user)).toBe(false);
  capabilities=['community.view','community.alerts.create'];expect(hasCommunityStatsOwnAccess(state.db,community,user)).toBe(true);
  state.db.prepare("UPDATE community_stats_settings SET own_content_user_ids_json='[]'").run();expect(hasCommunityStatsOwnAccess(state.db,community,user)).toBe(false);
 });

});
