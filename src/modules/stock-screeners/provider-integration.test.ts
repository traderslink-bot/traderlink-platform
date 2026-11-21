// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { POST as upload } from "@/app/api/internal/stock-screeners-pack/route";
import { POST as live } from "@/app/api/internal/stock-screeners-live/route";
import type { TraderLinkPlatformRequestIdentity } from "../platform/server/authentication/require-platform-request-scope";
import { DEFAULT_DEFINITION, type MarketPack, type MarketSession, type ScreenerProviderSelection, type Snapshot } from "./contracts";
import { screenerPackFilename } from "./provider-pack-store";
import { createRun, getRun } from "./service";

const root = mkdtempSync(join(tmpdir(), "screeners-provider-"));
const token = "isolated-screeners-worker-fixture-token";
const start = Date.parse("2026-11-17T14:30:00Z"), now = start + 62 * 60_000;
const owner = (userId: string) => ({ mode: "platform_session", scope: { userId } }) as TraderLinkPlatformRequestIdentity;
const request = (path: string, value: unknown, authorization = token) => new Request("https://stage.example/api/internal/" + path, {
  method: "POST", headers: { Authorization: "Bearer " + authorization }, body: JSON.stringify(value),
});
function pack(selection: ScreenerProviderSelection, price = 10): MarketPack {
  const snapshots = Object.fromEntries((["premarket", "regular", "after_hours", "last_regular"] as MarketSession[]).map(session => [session, {
    version: 2, source: selection.provider === "alpaca" ? "Alpaca SIP" : "Moomoo", session,
    date: "2026-11-17", universeDate: "2026-11-17", asOf: now - 60_000, capturedAt: now,
    closed: session !== "regular", partial: false,
    rows: Array.from({ length: 55 }, (_, i) => ({ symbol: "A" + String(i).padStart(2, "0"), exchange: "NASDAQ",
      priceAt: now - 60_000, values: { price: price + i, cap: 20_000_000, sessionVwap: price - 1,
        or5High: price - 0.5, or5Low: price - 2, or5Position: 1, vwapPosition: 1, volume: 1_000 } })),
  } satisfies Snapshot])) as Record<MarketSession, Snapshot>;
  return { selection, latest: "regular", snapshots };
}
function select(selection: ScreenerProviderSelection) {
  const folder = join(root, "market-data-providers-v1", "screeners");
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "provider.json"), JSON.stringify(selection));
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

it("switches both accounts, isolates stale uploads/live books, and preserves immutable sorting and paging", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(root, "fixture.sqlite"));
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER", "1");
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN", token);
  const directory = join(root, "stock-screeners-v1");
  mkdirSync(directory);
  const alpaca = { provider: "alpaca", revision: 0 } as const;
  const moomoo = { provider: "moomoo", revision: 1 } as const;
  const returned = { provider: "alpaca", revision: 2 } as const;
  const first = pack(alpaca);
  delete first.selection;
  writeFileSync(join(directory, "market.json"), JSON.stringify(first));
  const frame = { session: "regular", start, end: start + 390 * 60_000, generation: now - 10_000,
    sequence: 1, sentAt: now, reset: true, rows: [{ symbol: "A00", price: 100, priceAt: now - 1_000, vwap: 90, vwapAt: now - 1_000 }] };
  try {
    const original = await createRun(owner("one"), DEFAULT_DEFINITION);
    expect(original.source).toBe("TradersLink");
    expect((await live(request("stock-screeners-live", frame))).status).toBe(204);
    select(moomoo);
    await expect(createRun(owner("one"), DEFAULT_DEFINITION)).rejects.toThrow();
    expect((await live(request("stock-screeners-live", { ...frame, sequence: 2 }))).status).toBe(409);
    expect((await upload(request("stock-screeners-pack", { ...alpaca, pack: pack(alpaca) }))).status).toBe(409);
    expect((await upload(request("stock-screeners-pack", { ...moomoo, pack: pack(moomoo, 20) }, "wrong"))).status).toBe(404);
    expect((await upload(request("stock-screeners-pack", { ...moomoo, pack: pack(alpaca) }))).status).toBe(400);
    expect((await upload(request("stock-screeners-pack", { ...moomoo, pack: pack(moomoo, 20) }))).status).toBe(204);
    expect((await upload(request("stock-screeners-pack", { ...moomoo, initial: true, pack: pack(moomoo, 500) }))).status).toBe(204);
    for (const user of [owner("one"), owner("two")]) {
      const result = await createRun(user, DEFAULT_DEFINITION);
      expect(result.source).toBe("TradersLink");
      expect(result.total).toBe(55);
      expect(result.rows.find(row => row.symbol === "A00")?.values.price).toBe(20);
    }
    expect((await live(request("stock-screeners-live", { ...frame, ...moomoo }))).status).toBe(204);
    const rules = { ...DEFAULT_DEFINITION, rules: [{ metric: "or5Position", operator: "eq", value: 1 }] as const,
      groups: [[{ metric: "vwapPosition", operator: "eq", value: 1 }]] as const };
    const a = await createRun(owner("one"), { ...rules, rules: [...rules.rules], groups: rules.groups.map(group => [...group]) });
    const b = await createRun(owner("two"), DEFAULT_DEFINITION);
    expect(a.rows.find(row => row.symbol === "A00")?.values.price).toBe(100);
    expect(a.live?.vwapAt).toBe(now - 1_000);
    expect(() => getRun(owner("two"), a.id, 1, DEFAULT_DEFINITION.sort)).toThrow("run_expired");

    select(returned);
    await expect(createRun(owner("one"), DEFAULT_DEFINITION)).rejects.toThrow();
    expect((await upload(request("stock-screeners-pack", { ...moomoo, pack: pack(moomoo) }))).status).toBe(409);
    expect((await live(request("stock-screeners-live", { ...frame, ...moomoo, sequence: 2 }))).status).toBe(409);
    expect((await upload(request("stock-screeners-pack", { ...returned, pack: pack(returned, 30) }))).status).toBe(204);
    const resumed = await createRun(owner("one"), DEFAULT_DEFINITION);
    expect(resumed.rows.find(row => row.symbol === "A00")?.values.price).toBe(30);
    expect((await live(request("stock-screeners-live", frame))).status).toBe(409);
    expect((await live(request("stock-screeners-live", { ...frame, ...returned }))).status).toBe(204);

    vi.setSystemTime(now + 31 * 60_000);
    for (const [identity, run] of [[owner("one"), a], [owner("two"), b]] as const) {
      expect(getRun(identity, run.id, 2, { metric: "ticker", dir: "asc" }).rows).toHaveLength(5);
      expect(getRun(identity, run.id, 1, { metric: "price", dir: "desc" }).source).toBe("TradersLink");
    }
    expect(screenerPackFilename(returned)).toBe("market-alpaca-2.json");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
