// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import type { TraderLinkPlatformRequestIdentity } from "../platform/server/authentication/require-platform-request-scope";
import { DEFAULT_DEFINITION } from "./contracts";
import { previewPack } from "./fixture";
import { createRun, getRun } from "./service";
import { publishScreenerPack } from "./provider-pack-store";
import { validateMarketPack } from "./snapshot-file";
import { decodeScreenerPrivatePack, decodeScreenerPrivatePackAsync, encodeScreenerPrivatePack } from "./private-publication-wire";
import { GET } from "@/app/api/stock-screeners/route";

const browser = vi.hoisted(() => ({ user: "correction-one" }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: () => ({ mode: "platform_session", scope: { userId: browser.user } }),
  requireTraderLinkPlatformAuthenticatedRequestIdentity: () => ({ mode: "platform_session", scope: { userId: browser.user } }),
}));
vi.mock("@/src/modules/market-data/server/market-tools-dashboard-access", () => ({ hasStockScreenersDashboardAccess: () => true }));

const selection = { provider: "alpaca", revision: 0 } as const;
const identity = (userId: string) => ({ mode: "platform_session", scope: { userId } }) as TraderLinkPlatformRequestIdentity;
function market(revision?: string, generation?: number) {
  const pack = { ...previewPack(Date.now(), 60), selection, ...(revision ? { correctionRevision: revision } : {}),
    ...(generation === undefined ? {} : { correctionGeneration: generation }) };
  for (const snapshot of Object.values(pack.snapshots)) {
    snapshot.source = "Alpaca SIP";
    for (const row of snapshot.rows) delete row.values.pressReleaseAge;
  }
  return pack;
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("invalidates corrected results for both accounts immediately, preserving ordinary updates and the 30-minute lifetime", async () => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(Date.parse("2026-11-27T15:00:00Z"));
  const folder = mkdtempSync(join(tmpdir(), "screener-corrected-runs-")), directory = join(folder, "stock-screeners-v1");
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(folder, "fixture.sqlite"));
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER", "0");
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_ENABLED", "1");
  const network = vi.fn(() => { throw Error("unexpected_network"); }); vi.stubGlobal("fetch", network);
  try {
    await publishScreenerPack(directory, market(), selection);
    const owners = [identity("correction-one"), identity("correction-two")];
    const old = await Promise.all(owners.map(owner => createRun(owner, DEFAULT_DEFINITION)));
    await publishScreenerPack(directory, market("0".repeat(64), 0), selection);
    for (const [index, owner] of owners.entries()) expect(getRun(owner, old[index].id, 1, DEFAULT_DEFINITION.sort).id).toBe(old[index].id);
    vi.setSystemTime(Date.now() + 31 * 60_000);
    await publishScreenerPack(directory, market(), selection);
    for (const [index, owner] of owners.entries()) {
      expect(getRun(owner, old[index].id, 2, { metric: "ticker", dir: "asc" }).page).toBe(2);
      expect(getRun(owner, old[index].id, 1, { metric: "price", dir: "desc" }).id).toBe(old[index].id);
    }
    expect(() => getRun(owners[1], old[0].id, 1, DEFAULT_DEFINITION.sort)).toThrow("run_expired");
    const corrected = market("a".repeat(64), 7);
    corrected.snapshots.regular.rows[0].values.high = 7.41;
    await publishScreenerPack(directory, corrected, selection);
    for (const [index, owner] of owners.entries()) expect(() => getRun(owner, old[index].id, 1, DEFAULT_DEFINITION.sort)).toThrow("run_corrected");
    expect(() => getRun(owners[1], old[0].id, 1, DEFAULT_DEFINITION.sort)).toThrow("run_expired");
    const request = () => new Request("https://fixture.invalid/api/stock-screeners?run=" + old[0].id + "&page=1&sort=ticker&dir=asc");
    browser.user = "correction-one";
    const correctedResponse = await GET(request());
    expect(correctedResponse.status).toBe(409);
    expect(await correctedResponse.json()).toEqual({ error: "run_corrected" });
    browser.user = "correction-two";
    const foreignResponse = await GET(request());
    expect(foreignResponse.status).toBe(404);
    expect(await foreignResponse.json()).toEqual({ error: "run_expired" });
    const fresh = await Promise.all(owners.map(owner => createRun(owner, DEFAULT_DEFINITION)));
    expect(fresh[0].capturedAt).toBe(Date.now());
    expect(fresh[0].rows).toEqual(fresh[1].rows);
    await publishScreenerPack(directory, market("a".repeat(64), 8), selection);
    for (const [index, owner] of owners.entries()) expect(getRun(owner, fresh[index].id, 2, DEFAULT_DEFINITION.sort).id).toBe(fresh[index].id);
    await expect(publishScreenerPack(directory, market("f".repeat(64), 6), selection)).rejects.toThrow("screener_correction_superseded");
    for (const [index, owner] of owners.entries()) expect(getRun(owner, fresh[index].id, 1, DEFAULT_DEFINITION.sort).id).toBe(fresh[index].id);
    await publishScreenerPack(directory, market("b".repeat(64), 9), selection);
    for (const [index, owner] of owners.entries()) expect(() => getRun(owner, fresh[index].id, 1, DEFAULT_DEFINITION.sort)).toThrow("run_corrected");
    await expect(publishScreenerPack(directory, market(), selection)).rejects.toThrow("screener_pack_correction_missing");
    const current = await createRun(owners[0], DEFAULT_DEFINITION);
    await publishScreenerPack(directory, market("d".repeat(64), 9), selection);
    expect(getRun(owners[0], current.id, 1, DEFAULT_DEFINITION.sort).id).toBe(current.id);
    expect(network).not.toHaveBeenCalled();
  } finally { rmSync(folder, { recursive: true, force: true }); }
});

it("transports the opaque correction identity through both neutral decoders and retains legacy compatibility", async () => {
  const token = "correction-fixture-private-token-0123456789";
  const pack = market("c".repeat(64), 3);
  const wire = encodeScreenerPrivatePack(pack, selection, false, token);
  expect(JSON.stringify(wire)).toContain('"historyRevision"');
  expect(JSON.stringify(wire)).not.toContain('"correctionRevision"');
  for (const decoded of [decodeScreenerPrivatePack(wire, selection, token), await decodeScreenerPrivatePackAsync(wire, selection, token)]) {
    expect(validateMarketPack(decoded.pack, Date.now(), selection).correctionRevision).toBe(pack.correctionRevision);
    expect(validateMarketPack(decoded.pack, Date.now(), selection).correctionGeneration).toBe(3);
  }
  expect(validateMarketPack(market(), Date.now(), selection).correctionRevision).toBeUndefined();
  expect(() => validateMarketPack({ ...pack, correctionRevision: "bad" }, Date.now(), selection)).toThrow("market_pack_invalid");
  expect(() => validateMarketPack({ ...pack, correctionGeneration: -1 }, Date.now(), selection)).toThrow("market_pack_invalid");
});
