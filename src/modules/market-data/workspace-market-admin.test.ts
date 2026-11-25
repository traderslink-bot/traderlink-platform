// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { GET, PUT } from "@/app/api/admin/trading-workspace/route";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import { DEFAULT_WORKSPACE_MARKET_SETTINGS } from "./workspace-market-settings";

vi.mock("server-only", () => ({}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: (headers: Headers) => ({ owner: headers.get("x-owner-fixture") === "1" }),
}));
vi.mock("@/src/modules/market-data/server/candle-history-owner", () => ({
  hasCandleHistoryOwnerAccess: (identity: { owner: boolean }) => identity.owner,
}));

const route = "http://localhost/api/admin/trading-workspace";
const owner = { "x-owner-fixture": "1" };
const sameOrigin = { host: "localhost", origin: "http://localhost", "sec-fetch-site": "same-origin", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" };
afterEach(() => vi.unstubAllEnvs());

it("serves and saves the private workspace configuration through the owner and same-origin boundaries", async () => {
  const directory = mkdtempSync(join(tmpdir(), "workspace-admin-settings-"));
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(directory, "platform.sqlite"));
  try {
    expect(GET(new Request(route)).status).toBe(404);
    const initial = GET(new Request(route, { headers: owner }));
    expect(await initial.json()).toEqual(DEFAULT_WORKSPACE_MARKET_SETTINGS);
    const settings = { ...DEFAULT_WORKSPACE_MARKET_SETTINGS, brokerAudience: "review", cardTransport: "rest", cardRefreshMs: 3000 };
    const body = JSON.stringify(settings);
    expect((await PUT(new Request(route, { method: "PUT", headers: sameOrigin, body }))).status).toBe(404);
    expect((await PUT(new Request(route, { method: "PUT", headers: owner, body }))).status).toBe(403);
    const save = await PUT(new Request(route, { method: "PUT", headers: { ...owner, ...sameOrigin }, body }));
    expect(save.status).toBe(200);
    expect(await save.json()).toEqual({ ...settings, revision: 1 });
    expect((await PUT(new Request(route, { method: "PUT", headers: { ...owner, ...sameOrigin }, body }))).status).toBe(409);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
