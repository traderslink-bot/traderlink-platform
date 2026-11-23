// @vitest-environment node
import { expect, it, vi } from "vitest";
import MarketChartsPage from "@/app/(dashboard)/charts/page";

const state = vi.hoisted(() => ({
  identity: { mode: "platform_session", scope: { userId: "fixture-user" }, discord: null },
  evidence: vi.fn(),
  admitted: vi.fn(),
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw Error("chart-not-found"); } }));
vi.mock("@/app/dashboard-template", () => ({ DashboardPage: () => null }));
vi.mock("@/app/(dashboard)/charts/market-chart-workspace", () => ({ MarketChartWorkspace: () => null }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformPageIdentity: () => state.identity,
}));
vi.mock("@/src/modules/market-data/server/chart-dashboard-access", () => ({
  hasChartsDashboardAccess: state.admitted,
}));
vi.mock("@/src/modules/scanner/custom/server/scanner-chart-evidence", () => ({
  resolveScannerChartEvidence: state.evidence,
}));

it("checks standalone Charts before rendering or resolving a matched-chart reference", async () => {
  const evidence = "b2a02a2e-ecaf-4bdb-af0d-94213050de09";
  const searchParams = Promise.resolve({ evidence });
  state.admitted.mockReturnValue(false);
  await expect(MarketChartsPage({ searchParams })).rejects.toThrow("chart-not-found");
  expect(state.admitted).toHaveBeenCalledWith(state.identity);
  expect(state.evidence).not.toHaveBeenCalled();

  state.admitted.mockReturnValue(true);
  state.evidence.mockResolvedValue({ state: "unavailable" });
  await expect(MarketChartsPage({ searchParams })).resolves.toBeTruthy();
  expect(state.evidence).toHaveBeenCalledWith(state.identity, evidence);
});
