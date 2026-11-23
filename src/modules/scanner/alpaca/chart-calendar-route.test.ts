// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({authenticated:true,access:true,sharedChart:true,gateway:vi.fn(),selection:{provider:"alpaca",revision:0}}));
vi.mock('@/src/modules/market-data/server/chart-dashboard-access',()=>({hasSharedChartDataAccess:()=>state.sharedChart}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformRequestIdentity:()=>{if(!state.authenticated)throw Error();return {};}}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access',()=>({hasWatchlistDashboardNavigationAccess:()=>state.access}));
vi.mock('./client',()=>({requestAlpacaGateway:state.gateway}));
vi.mock('@/src/modules/market-data/server/provider-settings',()=>({marketDataSelection:()=>({...state.selection})}));
import {GET} from '@/app/api/charts/calendar/route';
import {browserDataSession} from '@/src/modules/market-data/server/browser-data-session';
const request=(year='2027')=>new Request('http://local/api/charts/calendar?year='+year);
beforeEach(()=>{state.authenticated=true;state.access=true;state.sharedChart=true;state.gateway.mockReset();state.selection={provider:"alpaca",revision:0};});
it('requires authenticated chart access before requesting calendar facts',async()=>{
 state.authenticated=false;expect((await GET(request())).status).toBe(401);expect(state.gateway).not.toHaveBeenCalled();
});
it('rejects malformed inputs and unverified upstream calendars',async()=>{
 expect((await GET(request('invalid'))).status).toBe(400);expect(state.gateway).not.toHaveBeenCalled();state.gateway.mockResolvedValue({available:false});expect((await GET(request())).status).toBe(503);
});
it('returns the requested normalized year to signed-in accounts outside the scanner allowlist',async()=>{
 state.access=false;
 const sessions=Array.from({length:252},(_,n)=>({date:new Date(Date.UTC(2027,0,1+n)).toISOString().slice(0,10),open:'09:30',close:'16:00',private:'excluded'}));
 state.gateway.mockResolvedValue({available:true,start:'2027-01-01',end:'2027-12-31',sessions,private:'excluded'});const response=await GET(request());expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('private, no-store');const body=await response.json();expect(body.sessions).toHaveLength(252);expect(body).not.toHaveProperty('private');expect(body.sessions[0]).not.toHaveProperty('private');expect(state.gateway.mock.calls[0][0]).toBe('calendar');expect(state.gateway.mock.calls[0][1].toString()).toBe('year=2027');
});

it('rejects an outdated source before reading data and a source changed during the read',async()=>{
 const generation=browserDataSession('charts',{provider:'alpaca',revision:1}).generation;
 const stale=new Request('http://local/api/charts/calendar?year=2027&generation='+generation);
 expect((await GET(stale)).status).toBe(409);expect(state.gateway).not.toHaveBeenCalled();
 // Use an actual complete normalized calendar so the stale-source check is exercised.
 state.gateway.mockImplementation(async()=>{state.selection={provider:"alpaca",revision:2};return {available:true,start:'2027-01-01',end:'2027-12-31',sessions:Array.from({length:252},(_,n)=>({date:new Date(Date.UTC(2027,0,1+n)).toISOString().slice(0,10),open:'09:30',close:'16:00'}))};});
 expect((await GET(request())).status).toBe(409);
});

it('rejects retired routing parameters with the same response before either provider is called',async()=>{
 const legacy=new Request('http://local/api/charts/calendar?year=2027&provider=alpaca&providerRevision=0');
 for(const selection of [{provider:'alpaca',revision:0},{provider:'moomoo',revision:1}]){
  state.selection=selection;
  const response=await GET(legacy);
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({error:'provider_changed'});
 }
 expect(state.gateway).not.toHaveBeenCalled();
});

it('rejects old neutral generations before calendar I/O, including switching back to the original source',async()=>{
 const generation=browserDataSession('charts',{provider:'alpaca',revision:0}).generation;
 const stale=new Request('http://local/api/charts/calendar?year=2027&generation='+generation);
 state.selection={provider:'moomoo',revision:1};
 expect((await GET(stale)).status).toBe(409);
 state.selection={provider:'alpaca',revision:2};
 expect((await GET(stale)).status).toBe(409);expect(state.gateway).not.toHaveBeenCalled();
});

it("skips the provider when the signed-in member has no chart access", async () => {
  state.sharedChart = false;
  expect((await GET(new Request("https://app.example/api/charts/calendar?year=2026"))).status).toBe(403);
  expect(state.gateway).not.toHaveBeenCalled();
});
