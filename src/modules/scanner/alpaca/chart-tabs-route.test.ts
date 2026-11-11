import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const setup=vi.hoisted(()=>({user:'user-a',directory:'',allowed:true,privateChart:true}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access',()=>({hasWatchlistDashboardNavigationAccess:()=>setup.privateChart}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformRequestIdentity:()=>{if(!setup.user)throw Error('unauthenticated');return {scope:{userId:setup.user}};}}));
vi.mock('@/src/modules/platform/server/authentication/platform-mutation-request-security',()=>({requirePlatformMutationRequest:()=>{if(!setup.allowed)throw Error('csrf');}}));
vi.mock('@/src/modules/platform/server/database/platform-database-config',()=>({resolvePlatformDatabaseConfig:()=>({databasePath:join(setup.directory,'test.sqlite')})}));
import {GET,POST} from '@/app/api/charts/tabs/route';
import {initialChartTabs,MAX_CHART_TABS_BYTES} from './chart-tabs';
import {singleChart} from './chart-multiview';
import {writeChartMultiview} from './chart-multiview-store';
beforeEach(()=>{setup.user='user-a';setup.allowed=true;setup.privateChart=true;setup.directory=mkdtempSync(join(tmpdir(),'chart-pref-route-'));});afterEach(()=>rmSync(setup.directory,{recursive:true,force:true}));
const request=(body:unknown)=>new Request('http://localhost/api/charts/layout?workspace=main',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});

const get=()=>GET(new Request('http://localhost/api/charts/tabs'));
it("migrates legacy main layout without modifying it; saves tabs with user isolation and CAS",async()=>{
 const legacy=singleChart("SMX","5m");writeChartMultiview(join(setup.directory,'chart-multiview-v1','main'),setup.user,0,legacy);
 const original=await(await get()).json();expect(original.layout.tabs[0].layout).toEqual(legacy);
 const layout=initialChartTabs(singleChart("OMH"));layout.tabs.push({id:"other",name:"Mixed",layout:singleChart("SMX")});
 expect((await POST(request({...original,layout}))).status).toBe(200);expect((await(await get()).json()).layout).toEqual(layout);
 expect((await POST(request({...original,layout}))).status).toBe(409);
 setup.user="user-b";expect((await(await get()).json()).revision).toBe(0);expect((await POST(request({...original,layout}))).status).toBe(409);
});
it("enforces private-owner access, mutation, size and strict payload validation",async()=>{
 const original=await(await get()).json();setup.allowed=false;expect((await POST(request(original))).status).toBe(403);setup.allowed=true;
 expect((await POST(request({...original,layout:{...original.layout,admin:true}}))).status).toBe(400);
 expect((await POST(request({...original,padding:"x".repeat(MAX_CHART_TABS_BYTES)}))).status).toBe(400);
 setup.user="";expect((await get()).status).toBe(401);setup.user="user-a";setup.privateChart=false;const response=await get();expect(response.status).toBe(200);expect((await POST(request(await response.json()))).status).toBe(200);
});
