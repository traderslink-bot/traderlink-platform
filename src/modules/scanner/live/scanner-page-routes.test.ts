import {existsSync} from 'node:fs';
import { beforeEach, expect, it, vi } from 'vitest';
import {createElement, type ReactNode} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const auth=vi.hoisted(()=>({identity:vi.fn(),access:vi.fn()}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformPageIdentity:auth.identity}));
vi.mock('@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access',()=>({hasWatchlistDashboardNavigationAccess:auth.access}));
vi.mock('next/navigation',()=>({notFound:()=>{throw Error('not_found')}}));
vi.mock('@/app/dashboard-template',()=>({DashboardPage:({children}:{children:ReactNode})=>createElement('main',null,children),DashboardSecondaryAction:({children,href}:{children:ReactNode;href:string})=>createElement('a',{href},children),DashboardPanel:({children,title}:{children:ReactNode;title:string})=>createElement('section',null,createElement('h1',null,title),children)}));
vi.mock('@/app/(dashboard)/screeners/live-screeners-client',()=>({LiveScreenersClient:({admin}:{admin?:boolean})=> createElement('div',null,admin?'scanner-admin-controls':'continuous-workspace')}));
vi.mock('@/app/(dashboard)/admin/screeners/audit/scanner-audit-client',()=>({ScannerAuditClient:()=>createElement('div',null,'audit-controls')}));
import ScannerAdminPage,{metadata as adminMetadata} from '@/app/(dashboard)/admin/scanners/page';
import ScannerAuditPage from '@/app/(dashboard)/admin/scanners/audit/page';
import ScannersPage,{metadata as scannerMetadata} from '@/app/(dashboard)/scanners/page';
import ScreenersPage,{metadata as screenerMetadata} from '@/app/(dashboard)/screeners/page';
import {DASHBOARD_NAVIGATION_HREFS,DASHBOARD_ROUTE_TITLES,dashboardHelpTarget} from '@/app/dashboard-navigation';
beforeEach(()=>{auth.identity.mockReset().mockResolvedValue({mode:'local_development'});auth.access.mockReset().mockReturnValue(true)});
it('serves the continuous workspace only at Scanners and a separate non-running Screeners placeholder',async()=>{
 expect(renderToStaticMarkup(await ScannersPage())).toContain('continuous-workspace');
 const placeholder=renderToStaticMarkup(await ScreenersPage());expect(placeholder).toContain('coming soon');expect(placeholder).not.toContain('continuous-workspace');
 expect(scannerMetadata.title).toBe('Scanners | TraderLink Platform');expect(screenerMetadata.title).toBe('Screeners | TraderLink Platform');
});
it('preserves the same page access check for both routes',async()=>{
 auth.access.mockReturnValue(false);await expect(ScannersPage()).rejects.toThrow('not_found');await expect(ScreenersPage()).rejects.toThrow('not_found');
 auth.identity.mockRejectedValue(Error('authentication_required'));await expect(ScannersPage()).rejects.toThrow('authentication_required');await expect(ScreenersPage()).rejects.toThrow('authentication_required');
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
