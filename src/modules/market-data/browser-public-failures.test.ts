// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state=vi.hoisted(()=>({authenticated:true,allowed:true,plan:true,fail:true}));
const failed=()=>{throw Error('Alpaca gateway https://private.finnhub.io?token=private-value moomoo');};
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformRequestIdentity:()=>{if(!state.authenticated)throw Error('private-value');return{mode:'platform_session',scope:{userId:'fixture'}};}}));
vi.mock('@/src/modules/market-data/server/market-tools-dashboard-access',()=>({hasMarketToolsDashboardReadAccess:()=>state.allowed}));
vi.mock('@/src/modules/news/server/press-release-dashboard-access',()=>({hasPressReleaseDashboardAccess:()=>false}));
vi.mock('@/src/modules/company/server/company-market-data',()=>({companyUniverseEntry:async()=>{if(state.fail)failed();return{symbol:'SHFS'};},readCompanyTechnicals:async()=>({symbol:'SHFS',stats:{price:.029,change:4.69}}),readCompanyYearRange:async()=>({high:1,low:.01})}));
vi.mock('@/src/modules/company/server/company-snapshot',()=>({companySymbol:(s:string)=>s==='SHFS'?s:null,readCompanySnapshot:async()=>({companyProfile:{name:'Company'}})}));
vi.mock('@/src/lib/live-watchlist/live-watchlist-auth',()=>({authorizeWatchlistMemberRequest:async()=>state.authenticated?{ok:true,principal:{platformUserId:'fixture'}}:{ok:false,error:'Sign in required',status:401}}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-feature-access',()=>({readWatchlistFeatureAccess:()=>({tickerDetails:state.plan,indicators:state.plan,tradeAnalysis:state.plan})}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-analysis-visibility',()=>({canViewPrivateWatchlistTicker:()=>state.allowed,canViewWatchlistTicker:()=>state.allowed,canViewWatchlistAnalysisPrices:()=>true}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-indicators-visibility',()=>({canViewWatchlistIndicators:()=>state.allowed&&state.plan}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-levels-visibility',()=>({canViewWatchlistLevels:()=>true}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-plan-policy',()=>({readWatchlistUpgradeLinks:()=>({ticker:'/plans'})}));
vi.mock('@/src/lib/live-watchlist/live-watchlist-store',()=>({LiveWatchlistStore:class {listSymbols=async()=>failed();getSymbol=async()=>failed();getHealth=async()=>({marketDataStatus:'closed'});},validIndicatorPublicationIdentity:()=>true}));
vi.mock('@/src/modules/watchlist/server/indicators/indicator-refresh-runtime',()=>({readCachedWatchlistIndicators:()=>failed()}));
vi.mock('@/src/lib/live-watchlist/live-watchlist-events',()=>({createLiveWatchlistStream:()=>failed()}));
import { GET as company } from '@/app/api/company/details/route';
import { GET as technicals } from '@/app/api/company/technicals/route';
import { GET as list } from '@/app/api/live-watchlist/route';
import { GET as detail } from '@/app/api/live-watchlist/symbols/[symbol]/route';
import { GET as indicators } from '@/app/api/live-watchlist/symbols/[symbol]/indicators/route';
import { GET as history } from '@/app/api/live-watchlist/symbols/[symbol]/analysis-history/route';
import { GET as stream } from '@/app/api/live-watchlist/stream/route';
const request=()=>new NextRequest('https://app.example/api?symbol=SHFS');
const context=()=>({params:Promise.resolve({symbol:'SHFS'})});
afterEach(()=>{state.authenticated=true;state.allowed=true;state.plan=true;state.fail=true;});

it('contains storage/upstream errors in actual member routes without returning messages, URLs, headers or stack traces',async()=>{
 const responses=await Promise.all([company(request()),technicals(request()),list(request()),detail(request(),context()),indicators(request(),context()),history(request(),context()),stream(request())]);
 for(const response of responses){expect(response.status).toBe(503);expect(response.headers.get('cache-control')).toContain('no-store');expect(response.headers.get('x-content-type-options')).toBe('nosniff');const body=await response.json();expect(Object.keys(body)).toEqual(['error']);expect(JSON.stringify(body)).not.toMatch(/alpaca|moomoo|finnhub|private-value|https:|stack/i);}
});
it('preserves login, member gates and successful technical values rather than turning every response into a failure',async()=>{
 state.authenticated=false;expect((await company(request())).status).toBe(401);expect((await detail(request(),context())).status).toBe(401);
 state.authenticated=true;state.plan=false;expect((await indicators(request(),context())).status).toBe(403);
 state.allowed=false;expect((await technicals(request())).status).toBe(404);
 state.allowed=true;state.fail=false;const response=await technicals(request());expect(response.status).toBe(200);expect(await response.json()).toEqual({symbol:'SHFS',stats:{price:.029,change:4.69}});
});
