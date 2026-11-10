// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({authenticated:true,access:true,gateway:vi.fn()}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformRequestIdentity:()=>{if(!state.authenticated)throw Error();return {};}}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access',()=>({hasWatchlistDashboardNavigationAccess:()=>state.access}));
vi.mock('./client',()=>({requestAlpacaGateway:state.gateway}));
import {GET} from '@/app/api/charts/calendar/route';
const request=(year='2027')=>new Request('http://local/api/charts/calendar?year='+year);
beforeEach(()=>{state.authenticated=true;state.access=true;state.gateway.mockReset();});
it('requires authenticated chart access before requesting calendar facts',async()=>{
 state.authenticated=false;expect((await GET(request())).status).toBe(401);state.authenticated=true;state.access=false;expect((await GET(request())).status).toBe(403);expect(state.gateway).not.toHaveBeenCalled();
});
it('rejects malformed inputs and unverified upstream calendars',async()=>{
 expect((await GET(request('invalid'))).status).toBe(400);expect(state.gateway).not.toHaveBeenCalled();state.gateway.mockResolvedValue({available:false});expect((await GET(request())).status).toBe(503);
});
it('returns only the requested normalized year with private no-store caching',async()=>{
 const sessions=Array.from({length:252},(_,n)=>({date:new Date(Date.UTC(2027,0,1+n)).toISOString().slice(0,10),open:'09:30',close:'16:00',private:'excluded'}));
 state.gateway.mockResolvedValue({available:true,start:'2027-01-01',end:'2027-12-31',sessions,private:'excluded'});const response=await GET(request());expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('private, no-store');const body=await response.json();expect(body.sessions).toHaveLength(252);expect(body).not.toHaveProperty('private');expect(body.sessions[0]).not.toHaveProperty('private');expect(state.gateway.mock.calls[0][0]).toBe('calendar');expect(state.gateway.mock.calls[0][1].toString()).toBe('year=2027');
});
