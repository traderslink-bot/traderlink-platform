// @vitest-environment node
import { expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({identity:vi.fn(),redirect:vi.fn((location:string)=>{throw new Error('redirect:'+location);})}));
vi.mock('next/navigation',()=>({redirect:mocks.redirect}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformPageIdentity:mocks.identity}));
vi.mock('@/src/modules/news/server/press-release-dashboard-access',()=>({hasPressReleaseDashboardAccess:()=>true}));
vi.mock('@/src/modules/platform/server/database/open-readonly-platform-database',()=>({withReadonlyPlatformDatabase:()=>{throw new Error('Unexpected database access');}}));
vi.mock('@/src/modules/news/server/press-release-dashboard-repository',()=>({PressReleaseDashboardRepository:class{}}));
vi.mock('../../../../app/dashboard-template',()=>({DashboardPage:()=>null,DashboardPanel:()=>null,DashboardUnavailableState:()=>null}));
vi.mock('../../../../app/(dashboard)/press-releases/press-release-feed',()=>({PressReleaseFeed:()=>null}));
import Page from '../../../../app/(dashboard)/press-releases/[[...channel]]/page';
it.each(['news-filtered','market-cap','market-cap/under-30m','market-cap/30m-50m','market-cap/50m-100m','market-cap/100m-300m','market-cap/300m-500m'])('redirects legacy %s preserving only the article deep link',async path=>{
 await expect(Page({params:Promise.resolve({channel:path.split('/')}),searchParams:Promise.resolve({article:'safe-id'})})).rejects.toThrow('redirect:/press-releases?article=safe-id');
 expect(mocks.identity).not.toHaveBeenCalled();
});
it('does not accept a repeated article query as an identifier',async()=>{
 await expect(Page({params:Promise.resolve({channel:['news-filtered']}),searchParams:Promise.resolve({article:['one','two']})})).rejects.toThrow('redirect:/press-releases');
});

it('exposes one unified Press Releases navigation destination',async()=>{
 const {DASHBOARD_NAVIGATION_HREFS}=await import('@/app/dashboard-navigation');
 expect(DASHBOARD_NAVIGATION_HREFS.filter(href=>href.startsWith('/press-releases'))).toEqual(['/press-releases']);
});
