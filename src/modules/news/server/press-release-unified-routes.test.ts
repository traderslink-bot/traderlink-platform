// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({identity:vi.fn(),redirect:vi.fn((location:string)=>{throw new Error('redirect:'+location);})}));
vi.mock('next/navigation',()=>({redirect:mocks.redirect}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformPageIdentity:mocks.identity}));
vi.mock('@/src/modules/news/server/press-release-dashboard-access',()=>({hasPressReleaseDashboardAccess:()=>true}));
vi.mock('@/src/modules/platform/server/database/open-readonly-platform-database',()=>({withReadonlyPlatformDatabase:()=>{throw new Error('Unexpected database access');}}));
vi.mock('@/src/modules/news/server/press-release-dashboard-repository',()=>({PressReleaseDashboardRepository:class{}}));
vi.mock('../../../../app/dashboard-template',()=>({DashboardPage:()=>null,DashboardPanel:()=>null,DashboardUnavailableState:()=>null}));
vi.mock('../../../../app/(dashboard)/press-releases/press-release-feed',()=>({PressReleaseFeed:()=>null}));
import Page from '../../../../app/(dashboard)/press-releases/[[...channel]]/page';
it.each(['market-cap','market-cap/under-30m','market-cap/30m-50m','market-cap/50m-100m','market-cap/100m-300m','market-cap/300m-500m'])('redirects legacy %s preserving only the article deep link',async path=>{
 await expect(Page({params:Promise.resolve({channel:path.split('/')}),searchParams:Promise.resolve({article:'safe-id'})})).rejects.toThrow('redirect:/press-releases?article=safe-id');
 expect(mocks.identity).not.toHaveBeenCalled();
});
it('does not accept a repeated article query as an identifier',async()=>{
 await expect(Page({params:Promise.resolve({channel:['market-cap']}),searchParams:Promise.resolve({article:['one','two']})})).rejects.toThrow('redirect:/press-releases');
});

beforeEach(()=>{vi.clearAllMocks();});
it('restores scanner entry through normal authentication without redirecting to the all-news feed',async()=>{
 mocks.identity.mockRejectedValueOnce(new Error('Authenticated scanner entry'));
 await expect(Page({params:Promise.resolve({channel:['news-filtered']}),searchParams:Promise.resolve({})})).rejects.toThrow('Authenticated scanner entry');
 expect(mocks.redirect).not.toHaveBeenCalled();expect(mocks.identity).toHaveBeenCalledOnce();
});
it('keeps unified Press Releases in Market News and restores only PR Scanner in Trading Tools',async()=>{
 const {DASHBOARD_MAIN_NAVIGATION_GROUPS}=await import('@/app/dashboard-navigation');
 const tools=DASHBOARD_MAIN_NAVIGATION_GROUPS.find(group=>group.id==='stockTools')!;
 const news=DASHBOARD_MAIN_NAVIGATION_GROUPS.find(group=>group.id==='pressReleases')!;
 expect(tools.items.find(item=>'href' in item&&item.href==='/press-releases/news-filtered')?.label).toBe('PR Scanner');
 expect(news.items.flatMap(item=>'href' in item&&item.href.startsWith('/press-releases')?[item.href]:[])).toEqual(['/press-releases']);
});
