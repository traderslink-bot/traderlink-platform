// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ allowed: false, pdf: vi.fn(), denied: new Error("membership_required") }));
vi.mock("../authentication/require-platform-request-scope", () => ({ requireTraderLinkPlatformRequestScope: (_headers: Headers, options: { membershipFeatures: string[] }) => { expect(options.membershipFeatures).toEqual(["analytics.exports", "analytics.trade_explorer"]); if (!fixture.allowed) throw fixture.denied; return { userId: "member" }; } }));
vi.mock("./platform-membership-access", () => ({ isMembershipAccessDenied: (e: unknown) => e === fixture.denied, membershipFeatureDeniedResponse: () => Response.json({ code: "membership_required" }, { status: 403 }) }));
vi.mock("@/app/(dashboard)/analytics/trade-explorer/trade-explorer-pdf-report", () => ({ createTradeExplorerPdfReport: fixture.pdf }));
import { POST } from "@/app/api/platform/journal/analytics/trade-explorer-report/route";
beforeEach(() => { fixture.allowed = false; fixture.pdf.mockReset().mockResolvedValue({ bytes: Buffer.from("%PDF-test"), filename: "qa.pdf" }); });
it("denies before parsing or generating a report", async () => {
  const request = new Request("http://localhost/api/platform/journal/analytics/trade-explorer-report", { method: "POST" });
  const parse = vi.spyOn(request, "json");
  const response = await POST(request);
  expect(response.status).toBe(403); expect(await response.json()).toEqual({ code: "membership_required" });
  expect(parse).not.toHaveBeenCalled(); expect(fixture.pdf).not.toHaveBeenCalled();
});
it("returns a permitted report as a private PDF download", async () => {
  fixture.allowed = true;
  const response = await POST(new Request("http://localhost/api/platform/journal/analytics/trade-explorer-report", { method: "POST", body: "{}" }));
  expect(response.status).toBe(200); expect(response.headers.get("content-type")).toBe("application/pdf"); expect(response.headers.get("cache-control")).toContain("no-store"); expect(await response.text()).toBe("%PDF-test");
});
