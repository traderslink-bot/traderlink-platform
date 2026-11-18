// @vitest-environment node
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
vi.mock('@/src/modules/platform/contracts/platform-ai-launch-state',()=>({areTraderLinkPlatformAiFeaturesEnabled:()=>false}));
import {proxy} from '../../../../../proxy';
const stage={NODE_ENV:'production',TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE:'disabled_isolated_staging',
 RAILWAY_PROJECT_ID:'49fc9197-07c9-45c7-b528-57d0393c2cca',RAILWAY_ENVIRONMENT_ID:'9e079dd4-f3f3-4872-9b00-adbd3000c485',
 RAILWAY_SERVICE_ID:'4d264aca-510c-4f5e-bc28-e89e526b8008',
 TRADERLINK_PLATFORM_PUBLIC_ORIGIN:'https://traderlink-platform-staging-staging.up.railway.app',
 TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT:'11111,22222'};
beforeEach(()=>{for(const [key,value] of Object.entries(stage))vi.stubEnv(key,value);});
afterEach(()=>vi.unstubAllEnvs());
const request=(path:string,method='GET')=>new NextRequest('http://0.0.0.0:8080'+path,{method});
it.each(['/api/billing/whop/connect','/api/billing/whop/callback'])('passes only the classified stage identity %s to native route authorization',path=>{
 const response=proxy(request(path));expect(response.headers.get('x-middleware-next')).toBe('1');
 expect(response.headers.get('x-middleware-request-x-traderlink-page-path')).toBe(path);
});
it.each(Object.keys(stage))('keeps coming-soon without exact stage field %s',key=>{
 vi.stubEnv(key,'wrong');expect(proxy(request('/api/billing/whop/connect')).status).toBe(503);
});
it.each(['11111','11111,11111','11111,22222,33333','11111,not-a-subject'])('refuses invalid cohort selector %s',value=>{
 vi.stubEnv('TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT',value);expect(proxy(request('/api/billing/whop/callback')).status).toBe(503);
});
it.each(['/api/billing/whop','/api/billing/whop/connect/other','/api/billing/whop/disconnect','/api/webhooks/whop','/api/coach/chat','/api/coach/latest','/api/cron/ai-reviews'])('preserves other coming-soon guards for %s',path=>{
 expect(proxy(request(path)).status).toBe(503);
});
it('does not permit mutations or production through staging classification',()=>{
 expect(proxy(request('/api/billing/whop/connect','POST')).status).toBe(503);
 vi.stubEnv('TRADERLINK_PLATFORM_PUBLIC_ORIGIN','https://app.traderslink.pro');
 expect(proxy(request('/api/billing/whop/connect')).status).toBe(503);
 expect(proxy(request('/api/billing/whop/callback')).status).toBe(503);
});
