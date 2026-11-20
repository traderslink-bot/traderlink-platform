// @vitest-environment node
import {randomUUID} from 'node:crypto';
import type Database from 'better-sqlite3';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {openPristinePlatformTestDatabase} from '@/src/test/pristine-platform-test-database';
import {PlatformUserRepository} from '@/src/modules/platform/server/identity/platform-user-repository';
import {PlatformAuthenticationRepository} from '@/src/modules/platform/server/authentication/platform-authentication-repository';
import {PlatformWorkspaceRepository} from '@/src/modules/platform/server/identity/platform-workspace-repository';
import {JournalAccountRepository} from '@/src/modules/journal/server/accounts/journal-account-repository';
import {PlatformSessionRepository} from '@/src/modules/platform/server/authentication/platform-session-repository';
import {PlatformSessionService,TRADERLINK_PLATFORM_SESSION_COOKIE} from '@/src/modules/platform/server/authentication/platform-session-service';
import {readTraderLinkPlatformSessionToken} from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import {hasWatchlistDashboardNavigationAccessInDatabase} from '@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access';
import {IndependentCheckoutInvocation} from './independent-coaching-checkout-authority';
import {requireCoachingPilotRequestIdentity} from './coaching-pilot-request-identity';
import {beginIndependentCoachingCheckout} from './independent-coaching-checkout';
import {CoachingWhopDirectClient} from './coaching-whop-direct-client';
import {CoachingPaymentIdentityRepository} from './coaching-payment-identity-repository';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import type {CoachingAgreementTerms} from '../contracts/coaching-agreements';
import {createHash} from 'node:crypto';

// Only the runtime OPEN is substituted. The actual facade, parser, native
// session repository, Journal derivation, pilot predicate, helper, service and
// client execute against isolated SQLite. This is NOT installed-native or real
// provider acceptance; every HTTP response below is explicit synthetic data.
const boundary=vi.hoisted(()=>({db:null as Database.Database|null}));
vi.mock('@/src/modules/platform/server/database/open-platform-database',()=>({withPlatformDatabase:(_options:unknown,operation:(db:Database.Database)=>unknown)=>{if(boundary.db!.inTransaction)throw Error('Normal facade opened a second writer');return operation(boundary.db!);}}));
vi.mock('@/src/modules/platform/server/database/open-readonly-platform-database',()=>({withReadonlyPlatformDatabase:(_options:unknown,operation:(db:Database.Database)=>unknown)=>operation(boundary.db!)}));
const databases:Database.Database[]=[],at='2026-11-20T05:10:00.000Z',identityKey='synthetic-unit-only-not-a-provider-key',subject='123456789012345678';
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date(at));vi.stubEnv('NODE_ENV','development');vi.stubEnv('TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_SESSIONS','true');vi.stubEnv('TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD','false');vi.stubEnv('DISCORD_GUILD_ID','987654321098765432');vi.stubEnv('TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT',subject);});
afterEach(()=>{for(const db of databases.splice(0))db.close();boundary.db=null;vi.useRealTimers();vi.unstubAllEnvs();});
type Stage='account'|'product'|'variant'|'variant_read'|'fees'|'checkout';
function fixture(){
 const db=openPristinePlatformTestDatabase();databases.push(db);boundary.db=db;
 const coach=randomUUID(),student=randomUUID(),workspace=randomUUID(),account=randomUUID(),context=randomUUID(),plan=randomUUID(),enrollment=randomUUID(),agreement=randomUUID(),service=randomUUID();
 const users=new PlatformUserRepository(db,{allowedAuthProviders:['discord']}),auth=new PlatformAuthenticationRepository(db);
 for(const [userId,authSubject] of [[coach,'223456789012345678'],[student,subject]]){users.createUser({userId,authProvider:'discord',authSubject,displayName:'Synthetic trader',createdAtUtc:at,updatedAtUtc:at});auth.linkIdentity({userId,authProvider:'discord',authSubject,linkedByUserId:userId,timestamp:at});}
 new PlatformWorkspaceRepository(db).createWorkspaceWithOwner({workspaceId:workspace,ownerUserId:student,displayName:'Synthetic workspace',defaultTradingTimezone:'America/New_York',createdAtUtc:at});
 new JournalAccountRepository(db).createAccount({accountId:account,workspaceId:workspace,displayName:'Isolated QA',baseCurrency:'USD',tradingTimezone:'America/New_York',status:'active',createdByUserId:student,createdAtUtc:at,updatedAtUtc:at});
 const terms:CoachingAgreementTerms={planId:plan,planRevision:1,planName:'Synthetic pack',description:'',priceAmountMinor:2500,currency:'USD',billingCadence:'one_time',paymentInstructions:'',requiredDiscordRoleId:null,autoArchiveAfterDays:null,startDate:null,customIntervalDays:null,dueTimeUtc:'18:00',builderConfig:{about:'',offers:{trade_review:{details:'',resources:[],tradeReviewFormat:'pack',reviewSchedule:'on_request',submissionLimits:{perPeriod:3,perDay:2}}},payment:{method:'whop',billingIntervalDays:null,serviceOccurrences:{trade_review:1}}},items:[{planItemId:service,itemType:'trade_review',frequency:'once',coveragePeriod:'single_item',quantity:3,dueOffsetDays:5,selectionMode:'student',followUpDays:0,measurementKind:'trades',plannedMinutes:null,timelineEnabled:false,reviewDepth:'standard',ordinal:0,focusAreas:[]}]};
 db.prepare('INSERT INTO traderlink_coaching_contexts VALUES(?,?,?,?,?)').run(context,coach,JSON.stringify({displayName:'Synthetic coach'}),at,at);
 db.prepare("INSERT INTO traderlink_coaching_plans VALUES(?,?,1,'active',?,?)").run(plan,context,at,at);db.prepare('INSERT INTO traderlink_coaching_plan_versions VALUES(?,1,?,?)').run(plan,JSON.stringify(terms),at);
 db.prepare("INSERT INTO traderlink_coaching_enrollments VALUES(?,?,?,?,'active',?,?)").run(enrollment,context,plan,student,at,at);db.prepare("INSERT INTO traderlink_coaching_accepted_terms VALUES(?,?,1,'accepted',?,?,?)").run(agreement,enrollment,JSON.stringify(terms),at,at);
 const identities=new CoachingPaymentIdentityRepository(db,'sandbox',identityKey);identities.linkUser(coach,'user_coach',at);identities.linkUser(student,'user_student',at);
 const nativeAccount={id:'biz_fixture',owner:{id:'user_coach'},parent_account:{id:'biz_platform'}};identities.verifyMerchant(coach,'biz_platform',nativeAccount,at);
 const sessions=new PlatformSessionService(new PlatformSessionRepository(db),{now:()=>new Date(),createToken:()=> 'C'.repeat(43),ttlMs:60_000});
 const created=sessions.createForIdentity({userId:student,authProvider:'discord',authSubject:subject});
 const headers=new Headers({cookie:`${TRADERLINK_PLATFORM_SESSION_COOKIE}=${created.token}`,host:'test.invalid'});
 const purchaseId=createHash('sha256').update(JSON.stringify(['sandbox',student,enrollment,agreement,'initial-purchase-v1'])).digest('hex');
 const requests:{stage:Stage;method:string;key:string|null;body:unknown}[]=[];
 let effect:(stage:Stage)=>void=()=>{},productCount=0,conflictProduct=false,largeProduct=false;
 const transport:typeof fetch=async(url,init)=>{
  expect(db.inTransaction).toBe(false);const path=new URL(String(url)).pathname,method=init?.method??'GET';
  const stage:Stage=path.endsWith('/fees')?'fees':path.endsWith('/checkout_configurations')?'checkout':path.endsWith('/products')?'product':path.endsWith('/variants')?'variant':path.includes('/variants/')?'variant_read':'account';
  requests.push({stage,method,key:new Headers(init?.headers).get('Idempotency-Key'),body:init?.body?JSON.parse(String(init.body)):null});
  await Promise.resolve();effect(stage);
  const value=stage==='account'?nativeAccount:stage==='product'?{id:largeProduct?'prod_'+ 'x'.repeat(3000):conflictProduct&&productCount++>0?'prod_conflict':'prod_fixture'}:stage==='variant'?{id:'plan_fixture'}:stage==='variant_read'?{id:'plan_fixture',account:{id:'biz_fixture'},product:{id:'prod_fixture'},currency:'usd',initial_price_due:{amount:'25.00',currency:'USD'},plan_type:'one_time',billing_period:null,renewal_price:0}:stage==='fees'?{account_id:'biz_fixture',parent_account_id:'biz_platform',markups:{payments:{percentage:0,fixed:{amount:'0.00'}}}}:{id:'checkout_fixture',account_id:'biz_fixture',purchase_url:'https://sandbox.whop.com/synthetic-fixture-no-send'};
  return Response.json(value);
 };
 const client=new CoachingWhopDirectClient({environment:'sandbox',apiVersionDate:'2026-10-24',apiKey:'synthetic-no-provider',applicationOrigin:'https://test.invalid'},transport);
 const withDatabase=<T>(fn:(db:Database.Database)=>T)=>{if(db.inTransaction)throw Error('Nested outer open');return fn(db);};
 const invocation=()=>IndependentCheckoutInvocation.fromRequest(headers,requireCoachingPilotRequestIdentity(headers),withDatabase);
 const begin=(value=invocation())=>beginIndependentCoachingCheckout({withDatabase,client,invocation:value,environment:'sandbox',identityKey,platformAccountId:'biz_platform',actorUserId:student,enrollmentId:enrollment,agreementId:agreement,purchaseId,commission:{policyVersion:'synthetic-zero',basisPoints:0},atUtc:at});
 const events=()=>db.prepare("SELECT * FROM traderlink_coaching_events WHERE kind LIKE 'checkout_%_observed_v1' ORDER BY kind").all() as {event_id:string;actor_user_id:string;enrollment_id:string;object_id:string;kind:string}[];
 const count=(table:string)=>(db.prepare(`SELECT count(*) n FROM ${table}`).get() as {n:number}).n;
 return {db,coach,student,workspace,account,enrollment,agreement,terms,headers,sessions,created,purchaseId,requests,begin,invocation,events,count,setEffect:(fn:(stage:Stage)=>void)=>{effect=fn;},conflictingProducts:()=>{conflictProduct=true;},oversizedProduct:()=>{largeProduct=true;}};
}

describe('V2 original checkout invocation and returned facts (synthetic transport only)',()=>{
 it('uses real app-only identity/scope with zero Community memberships and completes the original order once',async()=>{
  const f=fixture();expect(f.count('traderlink_communities')).toBe(0);expect(f.count('platform_discord_memberships')).toBe(0);expect(f.count('traderlink_coaching_journal_access')).toBe(0);
  const result=await f.begin();expect(result.purchaseId).toBe(f.purchaseId);expect(f.requests.filter(x=>x.method==='POST').map(x=>x.stage)).toEqual(['product','variant','checkout']);expect(f.events()).toHaveLength(2);
  expect(f.count('traderlink_coaching_direct_purchases')).toBe(1);expect(f.count('traderlink_coaching_direct_checkouts')).toBe(1);expect(f.count('traderlink_coaching_direct_purchase_funding')).toBe(0);
  const before=f.events();expect(await f.begin()).toEqual(result);expect(f.events()).toEqual(before);expect(f.requests.filter(x=>x.method==='POST')).toHaveLength(3);
 });
 it.each<Stage>(['account','product','variant','variant_read','fees','checkout'])('denies NEW requests after revocation during %s while settling returned results',async stage=>{
  const f=fixture();f.setEffect(s=>{if(s===stage)f.sessions.revoke(f.created.token);});await expect(f.begin()).rejects.toThrow();
  expect(f.requests.at(-1)?.stage).toBe(stage);expect(f.count('traderlink_coaching_direct_checkouts')).toBe(stage==='checkout'?1:0);
  expect(f.events()).toHaveLength(stage==='account'?0:stage==='product'?1:2);
  for(const e of f.events()){expect(e.actor_user_id).toBe(f.student);expect(e.enrollment_id).toBe(f.enrollment);expect(JSON.parse(e.object_id)).toMatchObject({purchaseId:f.purchaseId,agreementId:f.agreement,environment:'sandbox',merchantAccountId:'biz_fixture'});expect(e.object_id).not.toMatch(/cookie|token|purchase_url|apiKey|providerPayload/);}
 });
 it.each(['expires','expiry_extended','identity','workspace','merchant','accepted_terms','linked_identity','commercial','funding','purchase'] as const)('refuses changed original %s after an await',async kind=>{
  const f=fixture(),late=['funding','purchase'].includes(kind);f.setEffect(stage=>{
   if(stage!==(late?'fees':'product'))return;
   if(kind==='expires')vi.setSystemTime(new Date(Date.parse(at)+60_001));
   if(kind==='expiry_extended')f.db.prepare('UPDATE platform_auth_sessions SET expires_at_utc=? WHERE session_id=?').run('2027-01-01T00:00:00.000Z',f.created.session.sessionId);
   if(kind==='identity')f.db.prepare("UPDATE platform_auth_identities SET status='revoked' WHERE user_id=?").run(f.student);
   if(kind==='workspace')f.db.prepare("UPDATE platform_workspace_memberships SET role='member' WHERE user_id=?").run(f.student);
   if(kind==='merchant')f.db.prepare("UPDATE traderlink_coaching_merchant_connections SET status='disconnected'").run();
   if(kind==='accepted_terms')f.db.prepare('UPDATE traderlink_coaching_accepted_terms SET terms_json=? WHERE agreement_id=?').run(JSON.stringify({...f.terms,priceAmountMinor:3000}),f.agreement);
   if(kind==='linked_identity')f.db.prepare("UPDATE traderlink_coaching_whop_identities SET provider_user_ref_hmac='different' WHERE user_id=?").run(f.student);
   if(kind==='commercial')f.db.prepare("INSERT INTO traderlink_coaching_commercial_policies VALUES('platform','platform',1,?,?,?)").run(JSON.stringify({version:1,policyVersion:'changed',scope:'platform',commissionEnabled:false,commissionBasisPoints:0,coachSubscriptionRequired:false}),f.coach,at);
   if(kind==='funding'){f.db.prepare("INSERT INTO traderlink_coaching_direct_payment_bindings VALUES('sandbox','biz_fixture','pay_fixture',?)").run(f.purchaseId);f.db.prepare("INSERT INTO traderlink_coaching_direct_purchase_funding VALUES(?,'sandbox','biz_fixture','pay_fixture',?)").run(f.purchaseId,at);}
   if(kind==='purchase'){const row=f.db.prepare('SELECT snapshot_json FROM traderlink_coaching_direct_purchases WHERE purchase_id=?').get(f.purchaseId) as {snapshot_json:string};f.db.prepare('UPDATE traderlink_coaching_direct_purchases SET snapshot_json=? WHERE purchase_id=?').run(JSON.stringify({...JSON.parse(row.snapshot_json),createdAtUtc:'2026-11-20T05:09:00.000Z'}),f.purchaseId);}
  });await expect(f.begin()).rejects.toThrow();expect(f.requests.at(-1)?.stage).toBe(late?'fees':'product');expect(f.count('traderlink_coaching_direct_checkouts')).toBe(0);expect(f.events()).toHaveLength(late?2:1);
 });
 it('retains a product across revoked invocation; only an explicit new genuine invocation may continue with the same original keys',async()=>{
  const f=fixture(),original=f.invocation();f.setEffect(s=>{if(s==='product')f.sessions.revoke(f.created.token);});await expect(f.begin(original)).rejects.toThrow();expect(f.events()).toHaveLength(1);
  const newSession=new PlatformSessionService(new PlatformSessionRepository(f.db),{createToken:()=> 'D'.repeat(43),now:()=>new Date(),ttlMs:60_000}).createForIdentity({userId:f.student,authProvider:'discord',authSubject:subject});
  await expect(f.begin(original)).rejects.toThrow();f.headers.set('cookie',`${TRADERLINK_PLATFORM_SESSION_COOKIE}=${newSession.token}`);f.setEffect(()=>{});expect((await f.begin()).purchaseId).toBe(f.purchaseId);
  expect(f.requests.filter(x=>x.stage==='product')).toHaveLength(1);expect(f.requests.find(x=>x.stage==='variant')?.key).toBe(`coaching-variant:${f.agreement}`);expect(f.requests.find(x=>x.stage==='checkout')?.key).toBe(`coaching-checkout:${f.purchaseId}`);
 });
 it('accepts exact duplicate observations and rejects conflicting returned IDs instead of ignoring them',async()=>{
  const duplicate=fixture();const successes=await Promise.all([duplicate.begin(),duplicate.begin()]);expect(successes[0]).toEqual(successes[1]);expect(duplicate.events()).toHaveLength(2);
  const conflict=fixture();conflict.conflictingProducts();const result=await Promise.allSettled([conflict.begin(),conflict.begin()]);expect(result.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect(result.filter(x=>x.status==='rejected')).toHaveLength(1);expect(conflict.events()).toHaveLength(2);expect(conflict.events().every(e=>JSON.parse(e.object_id).productId==='prod_fixture')).toBe(true);
 });
 it('keeps persistence failures unknown and does not dispatch the next stage or allocate replacement keys',async()=>{
  const f=fixture();f.db.exec("CREATE TRIGGER synthetic_observation_failure BEFORE INSERT ON traderlink_coaching_events BEGIN SELECT RAISE(ABORT,'Synthetic persistence unavailable'); END");
  await expect(f.begin()).rejects.toThrow();expect(f.requests.filter(x=>x.method==='POST')).toHaveLength(1);expect(f.requests.at(-1)?.key).toBe(`coaching-product:${f.agreement}`);expect(f.events()).toHaveLength(0);expect(f.count('traderlink_coaching_direct_purchases')).toBe(0);
 });
 it('refuses oversized provider identifiers without storing raw responses or dispatching another stage',async()=>{
  const f=fixture();f.oversizedProduct();await expect(f.begin()).rejects.toThrow();expect(f.requests.at(-1)?.stage).toBe('product');expect(f.requests.at(-1)?.key).toBe(`coaching-product:${f.agreement}`);expect(f.events()).toHaveLength(0);expect(f.count('traderlink_coaching_direct_purchases')).toBe(0);
 });
 it('does not resurrect erased original parents in order to preserve a returned product',async()=>{
  const f=fixture();f.setEffect(s=>{if(s==='product'){f.db.prepare('DELETE FROM traderlink_coaching_accepted_terms WHERE agreement_id=?').run(f.agreement);f.db.prepare('DELETE FROM traderlink_coaching_enrollments WHERE enrollment_id=?').run(f.enrollment);}});
  await expect(f.begin()).rejects.toThrow();expect(f.requests.at(-1)?.stage).toBe('product');expect(f.count('traderlink_coaching_enrollments')).toBe(0);expect(f.events()).toHaveLength(0);
 });
 it('filters internal observations before the public history limit without exposing their IDs',()=>{
  const f=fixture(),put=f.db.prepare('INSERT INTO traderlink_coaching_events VALUES(?,?,?,?,?,?)');
  put.run(randomUUID(),f.enrollment,f.student,'agreement_accepted','human','2026-11-20T04:00:00.000Z');
  for(let i=0;i<101;i++)put.run(randomUUID(),f.enrollment,f.student,i%2?'checkout_product_observed_v1':'checkout_variant_observed_v1',JSON.stringify({productId:'private_internal_fixture'}),at);
  expect(new IndependentCoachingRepository(f.db).studentContext(f.enrollment,f.student).history).toEqual([{kind:'agreement_accepted',atUtc:'2026-11-20T04:00:00.000Z'}]);
 });
 it('uses the canonical cookie reader/default-deny pilot rule and refuses a JSON-supplied invocation',async()=>{
  const f=fixture();expect(readTraderLinkPlatformSessionToken(f.headers)).toBe(f.created.token);expect(()=>readTraderLinkPlatformSessionToken(new Headers({cookie:`${TRADERLINK_PLATFORM_SESSION_COOKIE}=a; ${TRADERLINK_PLATFORM_SESSION_COOKIE}=b`}))).toThrow();
  expect(()=>readTraderLinkPlatformSessionToken(new Headers({cookie:`${TRADERLINK_PLATFORM_SESSION_COOKIE}=%ZZ`}))).toThrow();
  const real=requireCoachingPilotRequestIdentity(f.headers);expect(hasWatchlistDashboardNavigationAccessInDatabase(f.db,real,{NODE_ENV:'development'})).toBe(false);
  await expect(f.begin(JSON.parse('{"actorUserId":"fake"}') as IndependentCheckoutInvocation)).rejects.toThrow('original authenticated');expect(f.requests).toHaveLength(0);
 });
});
