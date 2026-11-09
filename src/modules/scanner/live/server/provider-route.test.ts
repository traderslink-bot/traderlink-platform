// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({identity:vi.fn(),access:vi.fn(),mutation:vi.fn(),read:vi.fn(),change:vi.fn()}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformRequestIdentity:mocks.identity}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access',()=>({hasWatchlistDashboardNavigationAccess:mocks.access}));
vi.mock('@/src/modules/platform/server/authentication/platform-mutation-request-security',()=>({requirePlatformMutationRequest:mocks.mutation}));
vi.mock('@/src/modules/scanner/live/server/scanner-connection',()=>({scannerConnection:mocks.read}));
vi.mock('@/src/modules/scanner/live/server/runtime',()=>({changeScannerConnection:mocks.change}));
import {GET,POST} from '@/app/api/admin/screeners/provider/route';
beforeEach(()=>{Object.values(mocks).forEach(mock=>mock.mockReset());mocks.identity.mockReturnValue({});mocks.access.mockReturnValue(true);mocks.read.mockReturnValue({provider:'alpaca',revision:0,moomooAvailable:false});mocks.change.mockResolvedValue({provider:'alpaca',revision:1});});
const request=(body:unknown)=>new Request('https://app.example/api/admin/screeners/provider',{method:'POST',body:JSON.stringify(body)});
it('protects provider reads and changes with the existing owner and mutation boundaries',async()=>{
 mocks.access.mockReturnValue(false);expect((await GET(new Request('https://app.example/api'))).status).toBe(404);expect((await POST(request({provider:'alpaca',revision:0}))).status).toBe(404);expect(mocks.change).not.toHaveBeenCalled();
 mocks.access.mockReturnValue(true);mocks.mutation.mockImplementation(()=>{throw Error()});expect((await POST(request({provider:'alpaca',revision:0}))).status).toBe(403);expect(mocks.change).not.toHaveBeenCalled();
});
it('validates provider and revision, returns no credentials and reports a concurrent change',async()=>{
 expect((await GET(new Request('https://app.example/api'))).headers.get('cache-control')).toContain('no-store');
 expect((await POST(request({provider:'other',revision:0}))).status).toBe(400);expect(mocks.change).not.toHaveBeenCalled();
 expect((await POST(request({provider:'alpaca',revision:0}))).status).toBe(200);expect(mocks.change).toHaveBeenCalledWith('alpaca',0);
 mocks.change.mockRejectedValue(Error('scanner_connection_conflict'));expect((await POST(request({provider:'moomoo',revision:0}))).status).toBe(409);
});
