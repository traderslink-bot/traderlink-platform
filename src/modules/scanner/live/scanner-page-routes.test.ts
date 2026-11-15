import {existsSync} from 'node:fs';
import { beforeEach, expect, it, vi } from 'vitest';
import {createElement, type ReactNode} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const auth = vi.hoisted(() => ({ identity: vi.fn(), access: vi.fn() }));
const stock = vi.hoisted(() => ({ enabled: vi.fn(), saved: vi.fn() }));

vi.mock("@/src/modules/stock-screeners/service", () => ({
  stockScreenersDirectory: () => "/synthetic/screeners",
  stockScreenersEnabled: stock.enabled,
}));
vi.mock("@/src/modules/stock-screeners/saved-store", () => ({ readSaved: stock.saved }));
vi.mock("@/app/(dashboard)/screeners/stock-screener-workspace", () => ({
  StockScreenerWorkspace: () => createElement("div", null, "stock-screener-workspace"),
}));

vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformPageIdentity:auth.identity}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access',()=>({hasWatchlistDashboardNavigationAccess:auth.access}));
vi.mock('next/navigation',()=>({notFound:()=>{throw Error('not_found')}}));
vi.mock('@/app/dashboard-template',()=>({DashboardPage:({children}:{children:ReactNode})=>createElement('main',null,children),DashboardSecondaryAction:({children,href}:{children:ReactNode;href:string})=>createElement('a',{href},children),DashboardPanel:({children,title}:{children:ReactNode;title:string})=>createElement('section',null,createElement('h1',null,title),children)}));
vi.mock('@/app/(dashboard)/screeners/live-screeners-client',()=>({LiveScreenersClient:({admin}:{admin?:boolean})=> createElement('div',null,admin?'scanner-admin-controls':'continuous-workspace')}));
vi.mock('@/app/(dashboard)/admin/screeners/audit/scanner-audit-client',()=>({ScannerAuditClient:()=>createElement('div',null,'audit-controls')}));
vi.mock('@/app/(dashboard)/screeners/workspace/live-screeners-client',()=>({LiveScreenersClient:()=>createElement('div',null,'trading-workspace')}));
import TradingWorkspacePage from '@/app/(dashboard)/trading-workspace/page';
import ScannerAdminPage,{metadata as adminMetadata} from '@/app/(dashboard)/admin/scanners/page';
import ScannerAuditPage from '@/app/(dashboard)/admin/scanners/audit/page';
import ScannersPage,{metadata as scannerMetadata} from '@/app/(dashboard)/scanners/page';
import ScreenersPage,{metadata as screenerMetadata} from '@/app/(dashboard)/screeners/page';
import {DASHBOARD_NAVIGATION_HREFS,DASHBOARD_ROUTE_TITLES,dashboardHelpTarget} from '@/app/dashboard-navigation';
const loadScreeners = () => ScreenersPage({ searchParams: Promise.resolve({}) });

beforeEach(() => {
  auth.identity.mockReset().mockResolvedValue({
    mode: "local_development", scope: { userId: "fixture-owner" },
  });
  auth.access.mockReset().mockReturnValue(true);
  stock.enabled.mockReset().mockReturnValue(true);
  stock.saved.mockReset().mockReturnValue({ revision: 0, defaultId: null, screens: [] });
});

it("serves continuous Scanners and the separate Stock Screeners workspace", async () => {
  const scanner = renderToStaticMarkup(await ScannersPage());
  const screener = renderToStaticMarkup(await loadScreeners());
  expect(scanner).toContain("continuous-workspace");
  expect(scanner).not.toContain("stock-screener-workspace");
  expect(screener).toContain("stock-screener-workspace");
  expect(screener).not.toContain("continuous-workspace");
  expect(stock.saved).toHaveBeenCalledOnce();
  expect(stock.saved).toHaveBeenCalledWith("/synthetic/screeners/saved", "fixture-owner");
  expect(scannerMetadata.title).toBe("Scanners | TraderLink Platform");
  expect(screenerMetadata.title).toBe("Screeners | TraderLink Platform");
});

it("requires the existing page access on both routes and the Stock Screeners gate on Screeners", async () => {
  stock.enabled.mockReturnValue(false);
  await expect(loadScreeners()).rejects.toThrow("not_found");
  expect(renderToStaticMarkup(await ScannersPage())).toContain("continuous-workspace");

  stock.enabled.mockReturnValue(true);
  auth.access.mockReturnValue(false);
  await expect(ScannersPage()).rejects.toThrow("not_found");
  await expect(loadScreeners()).rejects.toThrow("not_found");

  auth.identity.mockRejectedValue(Error("authentication_required"));
  await expect(ScannersPage()).rejects.toThrow("authentication_required");
  await expect(loadScreeners()).rejects.toThrow("authentication_required");
  expect(stock.saved).not.toHaveBeenCalled();
});

it('keeps distinct navigation destinations and binds live scanner help to Scanners',()=>{
 expect(DASHBOARD_NAVIGATION_HREFS).toContain('/scanners');expect(DASHBOARD_NAVIGATION_HREFS).toContain('/screeners');
 expect(DASHBOARD_ROUTE_TITLES['/scanners']).toBe('Scanners');expect(DASHBOARD_ROUTE_TITLES['/screeners']).toBe('Screeners');expect(dashboardHelpTarget('/scanners')?.href).toBe('/help/tools/live-screeners');expect(dashboardHelpTarget('/screeners')).toBeNull();
});

it('moves guarded admin and audit pages with navigation and keeps old page routes absent',async()=>{
 const admin=renderToStaticMarkup(await ScannerAdminPage());expect(admin).toContain('scanner-admin-controls');expect(admin).toContain('href="/admin/scanners/audit"');
 expect(renderToStaticMarkup(await ScannerAuditPage())).toContain('audit-controls');expect(adminMetadata.title).toBe('Scanner Admin | TraderLink Platform');
 expect(DASHBOARD_NAVIGATION_HREFS).toContain('/admin/scanners');expect(DASHBOARD_NAVIGATION_HREFS).not.toContain('/admin/screeners');expect(DASHBOARD_ROUTE_TITLES['/admin/scanners']).toBe('Scanner Admin');expect(dashboardHelpTarget('/admin/scanners')?.href).toBe('/help/tools/live-screeners');
 for(const path of ['app/(dashboard)/admin/screeners/page.tsx','app/(dashboard)/admin/screeners/audit/page.tsx'])expect(existsSync(path)).toBe(false);
 auth.access.mockReturnValue(false);await expect(ScannerAdminPage()).rejects.toThrow('not_found');await expect(ScannerAuditPage()).rejects.toThrow('not_found');
 auth.identity.mockRejectedValue(Error('authentication_required'));await expect(ScannerAdminPage()).rejects.toThrow('authentication_required');await expect(ScannerAuditPage()).rejects.toThrow('authentication_required');
});

it('admits only the existing Watchlist admins to Trading Workspace',async()=>{
 expect(renderToStaticMarkup(await TradingWorkspacePage())).toContain('trading-workspace');
 auth.access.mockReturnValue(false);
 await expect(TradingWorkspacePage()).rejects.toThrow('not_found');
 auth.identity.mockRejectedValue(Error('authentication_required'));
 await expect(TradingWorkspacePage()).rejects.toThrow('authentication_required');
 expect(DASHBOARD_NAVIGATION_HREFS).toContain('/trading-workspace');
});
