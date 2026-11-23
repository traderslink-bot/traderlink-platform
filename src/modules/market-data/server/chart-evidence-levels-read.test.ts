// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { readOwnedChartLevelMap } from "./chart-evidence-levels-read";

const fixture = vi.hoisted(() => ({ path: "" }));
vi.mock("../../platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase(_options: unknown, read: (database: Database.Database) => unknown) {
    const connection = new Database(fixture.path, { readonly: true, fileMustExist: true });
    try { return read(connection); }
    finally { connection.close(); }
  },
}));

const owner = (userId: string) => ({ mode: "platform_session", scope: { userId } }) as TraderLinkPlatformRequestIdentity;
const now = 1_795_000_000_000;
const map = (symbol: string, referencePrice = 10) => JSON.stringify({
  symbol, referencePrice, referencePriceAsOf: now - 2_000, calculatedAt: now - 1_000,
  cacheStatus: "hit", levelMap: null, fullLadderCard: null, nearestSupportResistanceCard: null,
});

let directory: string;
let writer: Database.Database;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "chart-levels-read-"));
  fixture.path = join(directory, "test.sqlite");
  writer = new Database(fixture.path);
  writer.exec(`CREATE TABLE platform_stock_levels_saved_maps (
    saved_map_id TEXT PRIMARY KEY, user_id TEXT, symbol TEXT, map_json TEXT, updated_at_ms INTEGER, expires_at_ms INTEGER
  )`);
  const insert = writer.prepare("INSERT INTO platform_stock_levels_saved_maps VALUES (?, ?, ?, ?, ?, ?)");
  insert.run("own", "a", "AAPL", map("AAPL"), now - 10, now + 10);
  insert.run("older", "a", "AAPL", map("AAPL", 9), now - 20, now + 5);
  insert.run("other-user", "b", "AAPL", map("AAPL"), now - 5, now + 10);
  insert.run("other-symbol", "a", "MSFT", map("MSFT"), now - 5, now + 10);
  insert.run("expired", "a", "AAPL", map("AAPL"), now - 1, now);
});
afterEach(() => {
  writer.close();
  rmSync(directory, { recursive: true, force: true });
});

describe("owner-scoped read-only chart Levels lookup", () => {
  it("selects one eligible current row and links an exact owner/symbol/revision", () => {
    const result = readOwnedChartLevelMap(owner("a"), "AAPL", undefined, now);
    expect(result).toMatchObject({ saved: { savedMapId: "own" }, publishedAt: (now - 10) / 1_000, expiresAt: (now + 10) / 1_000 });
    expect(result?.reference.revision).toMatch(/^[a-f0-9]{64}$/u);
    const reference = result!.reference;
    expect(readOwnedChartLevelMap(owner("a"), "AAPL", reference, now)).toEqual(result);
    expect(readOwnedChartLevelMap(owner("b"), "AAPL", reference, now)).toBeUndefined();
    expect(readOwnedChartLevelMap(owner("a"), "MSFT", reference, now)).toBeUndefined();
    expect(readOwnedChartLevelMap(owner("a"), "AAPL", reference, now + 10)).toBeUndefined();
  });

  it("rejects a refresh under the same map ID and leaves the expired record untouched", () => {
    const original = readOwnedChartLevelMap(owner("a"), "AAPL", undefined, now)!.reference;
    writer.prepare("UPDATE platform_stock_levels_saved_maps SET map_json = ? WHERE saved_map_id = ?").run(map("AAPL", 11), "own");
    expect(readOwnedChartLevelMap(owner("a"), "AAPL", original, now)).toBeUndefined();
    expect(readOwnedChartLevelMap(owner("a"), "AAPL", undefined, now)?.saved.map.referencePrice).toBe(11);
    expect(writer.prepare("SELECT saved_map_id FROM platform_stock_levels_saved_maps ORDER BY saved_map_id")
      .pluck().all()).toEqual(["expired", "older", "other-symbol", "other-user", "own"]);
  });
});
