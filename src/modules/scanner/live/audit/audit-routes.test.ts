// @vitest-environment node
import { beforeEach,describe,expect,it,vi } from "vitest";

const state=vi.hoisted(()=>({allowed:false,authFails:false}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope",()=>({
  requireTraderLinkPlatformRequestIdentity:()=>{if(state.authFails)throw Error("session_missing");return {mode:"platform_session"};},
}));
vi.mock("@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access",()=>({
  hasWatchlistDashboardNavigationAccess:()=>state.allowed,
}));
vi.mock("@/src/modules/scanner/live/server/runtime",()=>({
  readScannerAuditHealth:()=>({state:"missing"}),
  scannerAuditRecorder:()=>({
    dailyReview:(date:string)=>{if(date!=="2026-11-02")throw Error("scanner_audit_query_invalid");return {tradingDate:date,sessions:[],rejectionReasons:[]};},
    timeline:()=>Promise.resolve({points:[],nextBeforeUtc:null}),
    rejections:()=>Promise.resolve({rows:[],nextCursor:null}),
  }),
}));

import { GET as daily } from "@/app/api/admin/screeners/audit/daily/route";
import { GET as health } from "@/app/api/admin/screeners/audit/health/route";
import { GET as rejections } from "@/app/api/admin/screeners/audit/rejections/route";
import { GET as timeline } from "@/app/api/admin/screeners/audit/timeline/route";

describe("scanner audit owner routes",()=>{
  beforeEach(()=>{state.allowed=false;state.authFails=false;});
  it("hides every audit endpoint from a user without owner access",async()=>{
    const requests=[health(new Request("http://local/api/admin/screeners/audit/health")),daily(new Request("http://local/api/admin/screeners/audit/daily?date=2026-11-02")),
      timeline(new Request("http://local/api/admin/screeners/audit/timeline?date=2026-11-02&symbol=AAA")),rejections(new Request("http://local/api/admin/screeners/audit/rejections?date=2026-11-02&scanner=momentum"))];
    for(const response of await Promise.all(requests))expect(response.status).toBe(404);
  });
  it("returns owner data with private no-store caching and validates query input",async()=>{
    state.allowed=true;const response=await daily(new Request("http://local/api/admin/screeners/audit/daily?date=2026-11-02"));
    expect(response.status).toBe(200);expect(response.headers.get("cache-control")).toContain("private");
    expect((await daily(new Request("http://local/api/admin/screeners/audit/daily?date=bad"))).status).toBe(400);
    expect((await rejections(new Request("http://local/api/admin/screeners/audit/rejections?date=2026-11-02&scanner=bad"))).status).toBe(400);
  });
  it("hides missing or expired authentication on every endpoint",async()=>{
    state.authFails=true;const requests=[health(new Request("http://local/api/admin/screeners/audit/health")),daily(new Request("http://local/api/admin/screeners/audit/daily?date=2026-11-02")),
      timeline(new Request("http://local/api/admin/screeners/audit/timeline?date=2026-11-02&symbol=AAA")),rejections(new Request("http://local/api/admin/screeners/audit/rejections?date=2026-11-02&scanner=momentum"))];
    for(const response of await Promise.all(requests))expect(response.status).toBe(404);
  });
});
