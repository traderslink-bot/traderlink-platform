// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ scope: vi.fn(), pageScope: vi.fn(), read: vi.fn() }));
vi.mock("../authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestScope: mocks.scope,
  requireTraderLinkPlatformPageScope: mocks.pageScope,
}));
vi.mock("@/src/modules/level-analysis/server/trend-momentum-pattern-runtime", () => ({ withSavedPatternRuntime: mocks.read }));
import { platformFailure } from "../database/platform-migration-contract";
import { requireMembershipPreviewPageScope } from "./platform-membership-page-access";
import { GET as trades } from "@/app/api/platform/trade-analyzer/analyzed-trades/route";
import { GET as occurrences } from "@/app/api/platform/trade-analyzer/candle-patterns/occurrences/route";
import { GET as replay } from "@/app/api/platform/trade-analyzer/candle-patterns/replay/route";
const deny = () => platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED", { reason: "membership_feature_required", feature: "trade_analyzer.analysis" });
beforeEach(() => vi.resetAllMocks());
describe("Analysis-specific API admission", () => {
  it.each([trades, occurrences, replay])("blocks before saved results are loaded", async handler => {
    mocks.scope.mockImplementation(deny);
    const response = await handler(new Request("https://app.example.test/api?direction=long"));
    expect(response.status).toBe(403);
    expect(mocks.scope).toHaveBeenCalledWith(expect.any(Headers), { membershipFeatures: ["trade_analyzer.analysis"] });
    expect(mocks.read).not.toHaveBeenCalled();
    expect(JSON.stringify(await response.json())).not.toContain("analysisVersionId");
  });
  it.each([trades, occurrences, replay])("admits the Analysis product without general Analytics", async handler => {
    const scope = { userId: "member", workspaceId: "workspace", activeAccountId: "account" };
    mocks.scope.mockReturnValue(scope);
    // Skip result population here: this check verifies admission ordering only.
    mocks.read.mockResolvedValue({ analysis: null });
    await handler(new Request("https://app.example.test/api?direction=long"));
    expect(mocks.read).toHaveBeenCalledWith(scope, expect.any(Object), expect.any(Function));
  });
});
describe("visible denied page", () => {
  it("returns a demo signal only for an actual membership denial", async () => {
    mocks.pageScope.mockImplementation(deny);
    expect(await requireMembershipPreviewPageScope("trade_analyzer.analysis")).toBeNull();
  });
  it("does not disguise authentication, storage or account failures as demos", async () => {
    const error = new Error("storage unavailable");
    mocks.pageScope.mockRejectedValue(error);
    await expect(requireMembershipPreviewPageScope("trade_analyzer.analysis")).rejects.toBe(error);
  });
  it("preserves the authenticated allowed scope", async () => {
    const scope = { userId: "member" };
    mocks.pageScope.mockResolvedValue(scope);
    expect(await requireMembershipPreviewPageScope("trade_analyzer.analysis")).toBe(scope);
  });
});
