// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ owner: false }));
vi.mock("@/src/modules/platform/server/administration/platform-admin-authorization", () => ({
  requireJournalAdminScope: () => { if (!state.owner) throw new Error("denied"); return {}; },
}));
vi.mock("@/src/modules/platform/server/database/open-platform-database", () => ({ openPlatformDatabase: () => ({ close: () => {} }) }));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({ withReadonlyPlatformDatabase: (_: unknown, read: (db: object) => unknown) => read({}) }));
vi.mock("./level-analysis-delivery-repository", () => ({ LevelAnalysisDeliveryRepository: class { get() { return { id: "lad_1234567890abcdef", rawPayload: { private: true } }; } } }));
vi.mock("./level-analysis-delivery-service", () => ({ LevelAnalysisDeliveryService: class { ingest() { return { status: "accepted" }; } } }));
vi.mock("./level-analysis-delivery-request", () => ({ readBoundedLevelAnalysisDeliveryPayload: async () => ({}), readConfiguredLevelAnalysisProviders: () => ["synthetic"] }));
vi.mock("./level-analysis-http", () => ({ levelAnalysisRawDebugEnabled: () => true, requireConfiguredLevelAnalysisProviders: () => ["synthetic"], levelAnalysisErrorResponse: () => Response.json({ ok: false }, { status: 403 }) }));
import { POST } from "@/app/api/level-analysis/deliveries/route";
import { GET } from "@/app/api/admin/level-analysis/deliveries/[deliveryId]/raw/route";
beforeEach(() => { state.owner = false; });
describe("global Level Analysis authority", () => {
  it("denies ordinary members ingestion and raw diagnostics even with debugging enabled", async () => {
    expect((await POST(new Request("https://app.example.test/api/level-analysis/deliveries", { method: "POST" }))).status).toBe(403);
    expect((await GET(new Request("https://app.example.test/raw"), { params: Promise.resolve({ deliveryId: "lad_1234567890abcdef" }) })).status).toBe(403);
  });
  it("preserves privileged ingestion and diagnostic behavior", async () => {
    state.owner = true;
    expect((await POST(new Request("https://app.example.test/api/level-analysis/deliveries", { method: "POST" }))).status).toBe(200);
    expect((await GET(new Request("https://app.example.test/raw"), { params: Promise.resolve({ deliveryId: "lad_1234567890abcdef" }) })).status).toBe(200);
  });
});
