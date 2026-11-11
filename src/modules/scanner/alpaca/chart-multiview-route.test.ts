import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const setup=vi.hoisted(()=>({user:'user-a',directory:'',allowed:true,privateChart:true}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access',()=>({hasWatchlistDashboardNavigationAccess:()=>setup.privateChart}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformRequestIdentity:()=>{if(!setup.user)throw Error('unauthenticated');return {scope:{userId:setup.user}};}}));
vi.mock('@/src/modules/platform/server/authentication/platform-mutation-request-security',()=>({requirePlatformMutationRequest:()=>{if(!setup.allowed)throw Error('csrf');}}));
vi.mock('@/src/modules/platform/server/database/platform-database-config',()=>({resolvePlatformDatabaseConfig:()=>({databasePath:join(setup.directory,'test.sqlite')})}));
import {GET,POST} from '@/app/api/charts/layout/route';
beforeEach(()=>{setup.user='user-a';setup.allowed=true;setup.privateChart=true;setup.directory=mkdtempSync(join(tmpdir(),'chart-pref-route-'));});afterEach(()=>rmSync(setup.directory,{recursive:true,force:true}));
const request=(body:unknown)=>new Request('http://localhost/api/charts/layout?workspace=main',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});

const get = (workspace="main") => GET(new Request(`http://localhost/api/charts/layout?workspace=${workspace}`));
it("saves layout per user and workspace without changing a different workspace",async()=>{
 const original=await(await get()).json();
 const layout={version:1,groups:[{id:"ticker-1",symbol:"OMH",panels:[{id:"chart-1",timeframe:"1m"},{id:"chart-2",timeframe:"5m"}]}],selectedPanel:"chart-1"};
 expect((await POST(request({...original,layout}))).status).toBe(200);
 expect((await(await get()).json()).layout).toEqual(layout);
 expect((await(await get("scanner")).json()).layout.groups).toEqual([]);
 setup.user="user-b";expect((await(await get()).json()).revision).toBe(0);
 expect((await POST(request({...original,layout}))).status).toBe(409);
});
it("keeps authentication, permission, mutation, size and conflict gates on layout writes",async()=>{
 const original=await(await get()).json();
 setup.allowed=false;expect((await POST(request(original))).status).toBe(403);setup.allowed=true;
 expect((await POST(request({...original,layout:{...original.layout,admin:true}}))).status).toBe(400);
 expect((await POST(request({...original,padding:"x".repeat(10000)}))).status).toBe(400);
 expect((await POST(request(original))).status).toBe(200);expect((await POST(request(original))).status).toBe(409);
 setup.user="";expect((await get()).status).toBe(401);setup.user="user-a";
 setup.privateChart=false;expect((await get()).status).toBe(403);
 expect((await get("invalid")).status).toBe(400);
});
