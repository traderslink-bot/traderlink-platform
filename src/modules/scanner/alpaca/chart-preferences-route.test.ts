import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const setup=vi.hoisted(()=>({user:'user-a',directory:'',allowed:true,privateChart:true}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access',()=>({hasWatchlistDashboardNavigationAccess:()=>setup.privateChart}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformRequestIdentity:()=>{if(!setup.user)throw Error('unauthenticated');return {scope:{userId:setup.user}};}}));
vi.mock('@/src/modules/platform/server/authentication/platform-mutation-request-security',()=>({requirePlatformMutationRequest:()=>{if(!setup.allowed)throw Error('csrf');}}));
vi.mock('@/src/modules/platform/server/database/platform-database-config',()=>({resolvePlatformDatabaseConfig:()=>({databasePath:join(setup.directory,'test.sqlite')})}));
import {GET,POST} from '@/app/api/charts/preferences/route';
beforeEach(()=>{setup.user='user-a';setup.allowed=true;setup.privateChart=true;setup.directory=mkdtempSync(join(tmpdir(),'chart-pref-route-'));});afterEach(()=>rmSync(setup.directory,{recursive:true,force:true}));
const request=(body:unknown)=>new Request('http://localhost/api/charts/preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
it('round-trips account preferences and keeps separate users isolated',async()=>{
 const original=await (await GET(new Request('http://localhost/api'))).json();const value={...original,preferences:{...original.preferences,grid:false,scalePriceOnly:true,indicators:[{id:'vwap',type:'VWAP',period:20,color:'#123456',width:2,calculationTimeframe:'4h',waitForClose:true,offset:2,timeframes:['1m','5m']}]}};
 expect((await POST(request(value))).status).toBe(200);expect((await (await GET(new Request('http://localhost/api'))).json()).preferences).toEqual(value.preferences);
 setup.user='user-b';const other=(await (await GET(new Request('http://localhost/api'))).json()).preferences;expect(other.grid).toBe(true);expect(other.indicators).toEqual([]);expect(other.scalePriceOnly).toBeUndefined();expect((await POST(request(value))).status).toBe(409);
});
it('rejects unauthenticated, cross-origin foundation failures and stale revisions',async()=>{
 const original=await (await GET(new Request('http://localhost/api'))).json();setup.allowed=false;expect((await POST(request(original))).status).toBe(403);setup.allowed=true;
 expect((await POST(request(original))).status).toBe(200);expect((await POST(request(original))).status).toBe(409);setup.user='';expect((await POST(request(original))).status).toBe(401);
});
it('rejects invalid and oversized settings without changing stored preferences',async()=>{
 const original=await (await GET(new Request('http://localhost/api'))).json();expect((await POST(request({...original,preferences:{...original.preferences,upColor:'bad'}}))).status).toBe(400);
 expect((await POST(request({...original,padding:'x'.repeat(70000)}))).status).toBe(400);expect((await (await GET(new Request('http://localhost/api'))).json()).revision).toBe(0);
});

it('allows signed-in accounts outside the scanner allowlist to save chart preferences',async()=>{
 setup.privateChart=false;
 const response=await GET(new Request('http://localhost/api'));
 expect(response.status).toBe(200);
 expect((await POST(request(await response.json()))).status).toBe(200);
});
