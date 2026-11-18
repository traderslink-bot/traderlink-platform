import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
vi.mock("@/src/modules/platform/server/database/platform-database-config", () => ({ resolvePlatformDatabaseConfig: ({ environment }: { environment: NodeJS.ProcessEnv }) => ({ databasePath: environment.TEST_MARKET_DATA_DB }) }));
import { changeMarketDataProvider, marketDataProvider, marketDataSelection, MARKET_DATA_FEATURES } from "./server/provider-settings";

it("defaults every feature to Alpaca and persists isolated revisioned selections across reads", async () => {
  const root = await mkdtemp(join(tmpdir(), "market-provider-"));
  const env: NodeJS.ProcessEnv = { NODE_ENV: "test", TEST_MARKET_DATA_DB: join(root, "platform.sqlite"), TRADERLINK_MARKET_DATA_PROVIDER: "moomoo" };
  try {
    for (const feature of MARKET_DATA_FEATURES) expect(marketDataProvider(feature, env)).toBe("alpaca");
    expect(await changeMarketDataProvider("charts", 0, "moomoo", env)).toEqual({ provider: "moomoo", revision: 1 });
    expect(marketDataSelection("charts", env)).toEqual({ provider: "moomoo", revision: 1 });
    expect(marketDataProvider("screeners", env)).toBe("alpaca");
    expect((await stat(join(root, "market-data-providers-v1/charts/provider.json"))).mode & 0o777).toBe(0o600);
    await expect(changeMarketDataProvider("charts", 0, "alpaca", env)).rejects.toThrow("provider_selection_conflict");
    expect(await changeMarketDataProvider("charts", 1, "alpaca", env)).toEqual({ provider: "alpaca", revision: 2 });
    expect(marketDataProvider("charts", env)).toBe("alpaca");
  } finally { await rm(root, { recursive: true, force: true }); }
});
it("allows only one concurrent selection change and rejects malformed revisions", async () => {
  const root = await mkdtemp(join(tmpdir(), "market-provider-race-"));
  const env: NodeJS.ProcessEnv = { NODE_ENV: "test", TEST_MARKET_DATA_DB: join(root, "platform.sqlite") };
  try {
    const results = await Promise.allSettled([changeMarketDataProvider("charts", 0, "moomoo", env), changeMarketDataProvider("charts", 0, "moomoo", env)]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(marketDataSelection("charts", env).revision).toBe(1);
    await expect(changeMarketDataProvider("charts", -1, "alpaca", env)).rejects.toThrow("invalid_provider_selection");
  } finally { await rm(root, { recursive: true, force: true }); }
});
