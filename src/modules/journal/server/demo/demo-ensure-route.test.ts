import { beforeEach, expect, test, vi } from "vitest";
const mocks=vi.hoisted(()=>({security:vi.fn(),scope:vi.fn(),lifecycle:vi.fn(),account:vi.fn(),pack:vi.fn(),refresh:vi.fn(),activate:vi.fn(),findActive:vi.fn()}));
vi.mock("@/src/modules/platform/server/authentication/journal-mutation-request-security",()=>({requireJournalMutationRequest:mocks.security}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope",()=>({requireTraderLinkPlatformRequestScope:mocks.scope}));
vi.mock("@/src/modules/platform/server/database/open-platform-database",()=>({withPlatformDatabase:(_options:unknown,callback:(db:unknown)=>unknown)=>callback({})}));
vi.mock("./journal-demo-account-repository",()=>({JournalDemoAccountRepository:class{findLifecycleForUser=mocks.lifecycle;findAccountForUser=mocks.account;findPackApplication=mocks.pack;}}));
vi.mock("./journal-demo-materializer",()=>({JournalDemoMaterializer:class{refreshExistingAnalysis=mocks.refresh;}}));
vi.mock("./journal-demo-account-activation-service",()=>({JournalDemoAccountActivationService:class{activateForWorkspace=mocks.activate;}}));
vi.mock("../accounts/journal-account-repository",()=>({JournalAccountRepository:class{findActiveAccount=mocks.findActive;}}));
import { POST } from "@/app/api/platform/journal/demo/ensure/route";
import { JOURNAL_DEMO_CURRENT_VERSION_ID } from "./journal-demo-current-version";
const scope={userId:"owner",workspaceId:"workspace",workspaceRole:"owner",activeAccountId:"real"};
beforeEach(()=>{
  Object.values(mocks).forEach(mock=>mock.mockReset());mocks.scope.mockReturnValue(scope);
  mocks.account.mockReturnValue({accountId:"demo",demoPackVersionId:JOURNAL_DEMO_CURRENT_VERSION_ID});
  mocks.refresh.mockReturnValue({changed:true,nextAfter:"next"});
});
const request=()=>new Request("https://app.traderslink.pro/api/platform/journal/demo/ensure?after=cursor",{method:"POST"});
test("existing current pack receives a bounded refresh without rematerializing facts",async()=>{
  const result=await POST(request());expect(result.status).toBe(200);
  expect(await result.json()).toEqual({status:"ready",changed:true,nextAfter:"next"});
  expect(mocks.refresh).toHaveBeenCalledWith(scope,"cursor");expect(mocks.activate).not.toHaveBeenCalled();
  expect(result.headers.get("cache-control")).toBe("no-store");
});
test("cleared Demo never activates or refreshes",async()=>{
  mocks.lifecycle.mockReturnValue({state:"cleared"});const result=await POST(request());
  expect(await result.json()).toEqual({status:"cleared",changed:false});expect(mocks.refresh).not.toHaveBeenCalled();expect(mocks.activate).not.toHaveBeenCalled();
});
test("non-owner and failed mutation security cannot reach Demo refresh",async()=>{
  mocks.scope.mockReturnValue({...scope,workspaceRole:"member"});expect((await POST(request())).status).toBe(403);
  mocks.security.mockImplementation(()=>{throw new Error("denied");});expect((await POST(request())).status).toBe(403);
  expect(mocks.refresh).not.toHaveBeenCalled();
});
test("new materialization starts the same saved-only bounded pass",async()=>{
  mocks.account.mockReturnValue(null);mocks.findActive.mockReturnValue({baseCurrency:"USD",tradingTimezone:"America/New_York"});
  mocks.activate.mockReturnValue({state:"materialized"});expect((await POST(request())).status).toBe(200);
  expect(mocks.activate).toHaveBeenCalledTimes(1);expect(mocks.refresh).toHaveBeenCalledWith(scope,"cursor");
});
