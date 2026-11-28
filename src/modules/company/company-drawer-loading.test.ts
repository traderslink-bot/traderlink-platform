// @vitest-environment jsdom

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { afterEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  companyRead: vi.fn<(kind: string, key?: string) => Promise<unknown>>(async () => null),
  newsRead: vi.fn(() => []),
  marketAccess: true,
  newsAccess: true,
  chartsAccess: false,
  scannerMember: true,
  marketSymbol: false,
  recordsRead: vi.fn(async () => null),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/src/lib/news/company-data-gateway", () => ({ readCompanyData: fixture.companyRead, readCompanyRecords: fixture.recordsRead }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: () => ({ mode:"platform_session", scope:{} }),
}));
vi.mock("@/src/modules/market-data/server/market-tools-dashboard-access", () => ({
  hasSharedWorkspaceAccess: () => fixture.marketAccess,
}));
vi.mock("@/src/modules/market-data/server/chart-dashboard-access", () => ({
  hasChartsDashboardAccess: () => fixture.chartsAccess,
}));
vi.mock("@/src/modules/company/server/company-market-data", () => ({
  companyUniverseEntry: async () => fixture.scannerMember ? { symbol:"TEST" } : undefined,
  hasCompanyMarketSymbol: async () => fixture.marketSymbol,
}));
vi.mock("@/src/modules/news/server/press-release-dashboard-access", () => ({
  hasPressReleaseDashboardAccess: () => fixture.newsAccess,
}));
vi.mock("@/src/modules/news/server/press-release-dashboard-repository", () => ({
  PressReleaseDashboardRepository: class { list=fixture.newsRead; },
}));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: (_options:unknown, read:(database:unknown)=>unknown) => read({}),
}));
vi.mock("@/app/dashboard-ui", () => ({
  DashboardPanel: ({ children }: { children:ReactNode }) => createElement("section", null, children),
}));
vi.mock("@/app/(dashboard)/screeners/scanner-ticker-details", () => ({ ScannerTickerDetails: () => null }));
vi.mock("@/app/(dashboard)/charts/shared-chart-data", () => ({
  sharedChartStream: () => ({ close() {}, addEventListener() {}, reconnectIfClosed() {} }),
}));
import { GET } from "@/app/api/company/details/route";
import { ScannerCompanyDrawer } from "@/app/(dashboard)/screeners/workspace/scanner-company-drawer";

const request = (view?:string) => new Request("https://fixture.invalid/api/company/details?symbol=TEST"+(view?"&view="+view:""));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  fixture.marketAccess = true;
  fixture.newsAccess = true;
  fixture.chartsAccess = false;
  fixture.scannerMember = true;
  fixture.marketSymbol = false;
  fixture.companyRead.mockReset().mockResolvedValue(null);
  vi.unstubAllEnvs();
});

it("loads overview metrics without SEC or News, while retaining full details and independent News access", async () => {
  expect((await GET(request("overview"))).status).toBe(200);
  expect(fixture.companyRead.mock.calls.map(([kind])=>kind)).toEqual(["profile","metrics"]);
  expect(fixture.newsRead).not.toHaveBeenCalled();

  fixture.companyRead.mockClear();
  expect((await GET(request("news"))).status).toBe(200);
  expect(fixture.companyRead).not.toHaveBeenCalled();
  expect(fixture.newsRead).toHaveBeenCalledOnce();

  fixture.newsAccess = false;
  expect(await (await GET(request("news"))).json()).toEqual({ news:[] });
  expect(fixture.newsRead).toHaveBeenCalledOnce();
  expect((await GET(request())).status).toBe(200);
  expect(fixture.companyRead.mock.calls.map(([kind])=>kind)).toContain("directory");

  fixture.marketAccess = false;
  expect((await GET(request("overview"))).status).toBe(404);
  expect((await GET(request("news"))).status).toBe(404);
});

it("serves an off-roster issuer on demand with persisted reads enabled", async () => {
  vi.stubEnv("TRADERLINK_COMPANY_PERSISTED_READS", "1");
  fixture.scannerMember = false;
  fixture.marketAccess = false;
  fixture.chartsAccess = true;
  fixture.companyRead.mockImplementation(async kind => {
    if(kind === "directory")return {0:{ticker:"TEST",cik_str:1000,title:"Large Corp"}};
    if(kind === "profile")return {ticker:"TEST",name:"Large Corp",marketCapitalization:1000};
    if(kind === "submissions")return {filings:{recent:{filingDate:[]}}};
    return null;
  });

  const overview = await GET(request("overview"));
  expect(overview.status).toBe(200);
  expect(await overview.json()).toMatchObject({
    scannerMember:false, company:{symbol:"TEST",cik:1000,profile:{marketCapitalization:1000}},
  });
  expect(fixture.companyRead.mock.calls.map(([kind])=>kind)).toEqual(["profile","directory","metrics"]);

  const full = await GET(request("company"));
  expect(full.status).toBe(200);
  expect(await full.json()).toMatchObject({scannerMember:false,company:{name:"Large Corp",filingsAvailable:true}});
  expect(fixture.companyRead).toHaveBeenCalledWith("facts","CIK0000001000.json");
  expect(fixture.recordsRead).not.toHaveBeenCalled();

  fixture.scannerMember = true;
  fixture.companyRead.mockClear();
  const rosterResult = await GET(request("overview"));
  expect(await rosterResult.json()).toMatchObject({scannerMember:true,company:{symbol:"TEST"}});
  expect(fixture.recordsRead).toHaveBeenCalledWith(["TEST"]);
  expect(fixture.companyRead).not.toHaveBeenCalled();
});

it("accepts a market-supported symbol without an issuer profile and rejects an unresolved symbol", async () => {
  fixture.scannerMember = false;
  expect((await GET(request("overview"))).status).toBe(404);
  fixture.marketSymbol = true;
  const response=await GET(request("overview"));
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({scannerMember:false,company:{symbol:"TEST"}});
});

it.each([true,false])("loads the same drawer and shows Scanner fields based on membership (%s)", async scannerMember => {
  const previous = Reflect.get(globalThis, "IS_REACT_ACT_ENVIRONMENT");
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  const container=document.createElement("div");
  document.body.append(container);
  const root=createRoot(container);
  const overview = Promise.withResolvers<Response>();
  const company = Promise.withResolvers<Response>();
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url=String(input);
    if(url.includes("view=overview"))return overview.promise;
    if(url.includes("view=company"))return company.promise;
    if(url.includes("view=news"))return Response.json({news:[{id:"headline",title:"Fixture headline",date:"2026-11-23",href:"/press-releases"}]});
    if(url.includes("/technicals?"))return Response.json({days:[],row:null,scannerMember,scannerSignals:scannerMember?["Top Gainers"]:[]});
    if(url.includes("/charts/bars?"))return Response.json({frame:"5m",readings:[]});
    throw Error("Unexpected fetch: "+url);
  });
  vi.stubGlobal("fetch",fetch);
  const button=(label:string)=>[...document.querySelectorAll<HTMLElement>('[role="tab"]')].find(tab=>tab.textContent===label)!;
  const urls=()=>fetch.mock.calls.map(([url])=>String(url));
  const select=(label:string)=>act(async()=>{button(label).click();});
  try {
    await act(async()=>{
      root.render(createElement(ThemeProvider,{theme:createTheme()},
        createElement(ScannerCompanyDrawer,{symbol:"TEST",onClose:()=>{}})));
    });
    await act(async()=>{ await vi.dynamicImportSettled(); });
    expect(document.querySelector('[role="dialog"] h1')?.textContent).toBe("TEST");
    expect(button("Technicals").getAttribute("aria-selected")).toBe("true");
    expect(urls()).toContain("/api/company/technicals?symbol=TEST");
    expect(urls().filter(url=>url.includes("/api/company/details?"))).toEqual(["/api/company/details?symbol=TEST&view=overview"]);
    expect(urls().some(url=>url.includes("/charts/bars?"))).toBe(false);

    await select("Profile");
    expect(document.body.textContent).toContain("Loading company details…");
    expect(urls()).toContain("/api/company/details?symbol=TEST&view=company");
    expect(urls()).not.toContain("/api/company/details?symbol=TEST&view=news");
    await select("News");
    expect(document.body.textContent).toContain("Fixture headline");
    expect(urls()).toContain("/api/company/details?symbol=TEST&view=news");

    await act(async()=>{
      overview.resolve(Response.json({scannerMember,company:{symbol:"TEST"}}));
      company.resolve(Response.json({scannerMember,company:{symbol:"TEST",name:"Fixture Company",financials:[],filings:[]}}));
    });
    expect(Boolean(button("Levels"))).toBe(scannerMember);
    await select("Technicals");
    expect(document.body.textContent?.includes("Top Gainers")).toBe(scannerMember);
    expect(document.body.textContent?.includes("Relative Vol")).toBe(scannerMember);
    expect(document.body.textContent?.includes("5min Vol spike")).toBe(scannerMember);
    expect(document.body.textContent).toContain("Day high");
    await select("Financials");
    expect(document.body.textContent).toContain("Reported financials");
    expect(urls().filter(url=>url.endsWith("view=company"))).toHaveLength(1);
  } finally {
    await act(async()=>{ root.unmount(); });
    container.remove();
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", previous);
  }
});
