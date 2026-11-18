// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  authenticate: vi.fn(), billing: vi.fn(), staging: vi.fn(), database: vi.fn(),
  sandbox: vi.fn(), runtime: vi.fn(), configuration: vi.fn(),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/src/modules/communities/server/community-owner-review-request-identity", () => ({
  requireCommunityOwnerReviewPageIdentity: state.authenticate,
}));
vi.mock("./partner-alert-stripe-billing-runtime", () => ({ readPartnerAlertStripeBillingConfiguration: state.billing }));
vi.mock("./partner-alert-isolated-staging", () => ({ readPartnerAlertIsolatedStaging: state.staging }));
vi.mock("./partner-alert-stripe-sandbox-runtime", () => ({ partnerAlertStripeSandbox: state.sandbox }));
vi.mock("./partner-alert-request-runtime", () => ({ withPartnerAlertRequestRuntime: state.runtime }));
vi.mock("./partner-alert-catalog-runtime-configuration", () => ({
  readPartnerAlertCatalogRuntimeConfiguration: state.configuration,
  resolvePartnerAlertWhopReadEnvironment: vi.fn(),
}));
vi.mock("./partner-alert-catalog-checkout", () => ({ createPartnerAlertCatalogCheckoutRuntime: vi.fn() }));
vi.mock("./partner-alert-catalog-read", () => ({
  qualifyPartnerAlertCatalogCheckout: vi.fn(), readPartnerAlertCatalogCandidates: vi.fn(),
  readPartnerAlertStripeCatalogCandidates: vi.fn(),
}));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  openReadonlyPlatformDatabase: state.database,
}));
vi.mock("@/app/(dashboard)/partner-channels/partner-channel-catalog", () => ({ PartnerChannelCatalog: () => null }));
import catalogPage from "@/app/(dashboard)/partner-channels/page";

beforeEach(() => {
  vi.resetAllMocks();
  state.authenticate.mockResolvedValue({ scope: { userId: "selected-owner" } });
  state.staging.mockReturnValue({ origin: "https://stage.example.test" });
  state.database.mockImplementation(() => { throw new Error("database sentinel"); });
});

describe("catalog unavailable page boundary", () => {
  it.each([undefined, { environment: "live" }])("renders unavailable before storage or runtime for staging billing %j", async billing => {
    state.billing.mockReturnValue(billing);
    const element = await catalogPage();
    expect(element.props).toMatchObject({ catalogStatus: "unavailable", premiumStatus: "unavailable", items: [] });
    expect(state.database).not.toHaveBeenCalled();
    expect(state.runtime).not.toHaveBeenCalled();
    expect(state.configuration).not.toHaveBeenCalled();
  });

  it("authenticates before classifying stage or reading billing", async () => {
    state.authenticate.mockRejectedValue(new Error("denied"));
    await expect(catalogPage()).rejects.toThrow("denied");
    expect(state.billing).not.toHaveBeenCalled();
    expect(state.staging).not.toHaveBeenCalled();
    expect(state.sandbox).not.toHaveBeenCalled();
    expect(state.database).not.toHaveBeenCalled();
  });

  it("preserves malformed staging refusal", async () => {
    state.staging.mockImplementation(() => { throw new Error("invalid stage"); });
    await expect(catalogPage()).rejects.toThrow("invalid stage");
    expect(state.database).not.toHaveBeenCalled();
  });

  it.each(["sandbox", "live"])("retains normal qualified %s catalog path", async environment => {
    state.billing.mockReturnValue({ environment });
    if (environment === "live") state.staging.mockReturnValue(null);
    await expect(catalogPage()).rejects.toThrow("database sentinel");
    expect(state.database).toHaveBeenCalledOnce();
  });
});
