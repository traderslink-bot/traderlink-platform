// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import type { WorkspaceAccessScope } from "../../platform/contracts/workspace-access-scope";
const fixture = vi.hoisted(() => ({ included: false, provider: vi.fn(), close: vi.fn() }));
vi.mock("@/src/modules/platform/server/database/open-platform-database", () => ({ openPlatformDatabase: () => ({ close: fixture.close }) }));
vi.mock("@/src/modules/platform/server/membership/platform-membership-generation-allowance", () => ({ readGenerationAllowance: () => ({ included: fixture.included, remaining: 0, resetsAtUtc: null, resetDays: null }) }));
vi.mock("./stock-levels-runtime-client", () => ({ requestStockLevels: fixture.provider }));
import { getStockLevels } from "./stock-levels-service";
beforeEach(() => { fixture.included = false; fixture.provider.mockReset(); fixture.close.mockReset(); });
it.each([false,true])("blocks excluded generation before runtime with legacy exemption=%s", async noRequestLimit => {
  const result = await getStockLevels({ userId: "member" } as WorkspaceAccessScope,"AAPL",{ noRequestLimit });
  expect(result).toMatchObject({state:"unavailable",code:"limit_reached",membership:{included:false,remaining:0}});
  expect(fixture.provider).not.toHaveBeenCalled();expect(fixture.close).toHaveBeenCalled();
});
it("blocks an exhausted included allowance before runtime",async()=>{
 fixture.included=true;
 expect(await getStockLevels({userId:"member"} as WorkspaceAccessScope,"AAPL",{noRequestLimit:true})).toMatchObject({state:"unavailable",code:"limit_reached",membership:{included:true,remaining:0}});
 expect(fixture.provider).not.toHaveBeenCalled();
});
