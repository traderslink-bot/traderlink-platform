import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import type { TraderLinkPlatformRequestIdentity } from "../platform/server/authentication/require-platform-request-scope";
import { DEFAULT_DEFINITION } from "./contracts";
import { previewPack } from "./fixture";
import { createRun, getRun } from "./service";
import { MARKET_PACK_MAX_AGE_MS } from "./snapshot-file";

function market(size: number) {
  const pack = previewPack(Date.now(), size);
  for (const snapshot of Object.values(pack.snapshots)) {
    snapshot.source = "Alpaca SIP";
    for (const row of snapshot.rows) delete row.values.pressReleaseAge;
  }
  return JSON.stringify(pack);
}

it("uses the last valid market snapshot until a replacement recovers or the snapshot expires", async () => {
  const root = mkdtempSync(join(tmpdir(), "stock-screeners-snapshot-"));
  const directory = join(root, "stock-screeners-v1");
  const file = join(directory, "market.json");
  const initialTime = Date.parse("2026-11-14T17:00:00Z");
  const identity = { mode: "platform_session", scope: { userId: "market-fixture" } } as TraderLinkPlatformRequestIdentity;
  const publish = (content: string) => {
    writeFileSync(file + ".tmp", content, { mode: 0o600 });
    renameSync(file + ".tmp", file);
  };
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(initialTime);
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(root, "market-fixture.sqlite"));
  try {
    mkdirSync(directory, { mode: 0o700 });
    publish(market(3));
    const first = await createRun(identity, DEFAULT_DEFINITION);
    expect(first).toMatchObject({ capturedAt: initialTime, source: "Alpaca SIP", total: 2, partial: false });

    vi.setSystemTime(initialTime + 6_000);
    publish("invalid snapshot");
    const corrupted = await createRun(identity, DEFAULT_DEFINITION);
    expect(corrupted).toMatchObject({ capturedAt: first.capturedAt, source: first.source, partial: true, snapshotFallback: true, rows: first.rows });
    expect(getRun(identity, first.id, 1, DEFAULT_DEFINITION.sort).partial).toBe(false);

    vi.setSystemTime(initialTime + 12_000);
    rmSync(file);
    const missing = await createRun(identity, DEFAULT_DEFINITION);
    expect(missing).toMatchObject({ capturedAt: first.capturedAt, partial: true, snapshotFallback: true, total: first.total });

    const recoveredAt = initialTime + 18_000;
    vi.setSystemTime(recoveredAt);
    publish(market(4));
    expect(await createRun(identity, DEFAULT_DEFINITION)).toMatchObject({ capturedAt: recoveredAt, total: 3, partial: false });

    // A warm reader must not reuse a snapshot from a different data directory.
    vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(root, "other", "market-fixture.sqlite"));
    await expect(createRun(identity, DEFAULT_DEFINITION)).rejects.toThrow();
    vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(root, "market-fixture.sqlite"));

    rmSync(file);
    vi.setSystemTime(recoveredAt + MARKET_PACK_MAX_AGE_MS - 1);
    expect(await createRun(identity, DEFAULT_DEFINITION)).toMatchObject({ capturedAt: recoveredAt, snapshotFallback: true });
    vi.setSystemTime(recoveredAt + MARKET_PACK_MAX_AGE_MS + 1);
    await expect(createRun(identity, DEFAULT_DEFINITION)).rejects.toThrow();
  } finally {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    rmSync(root, { recursive: true, force: true });
  }
});

it("keeps up to 64 runs per process and evicts the oldest when a new run needs space", async () => {
  const root = mkdtempSync(join(tmpdir(), "stock-screeners-run-cache-"));
  const directory = join(root, "stock-screeners-v1");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-14T17:00:00Z"));
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(root, "market-fixture.sqlite"));
  const owner = (index: number) => ({
    mode: "platform_session", scope: { userId: `run-cache-fixture-${index}` },
  }) as TraderLinkPlatformRequestIdentity;
  try {
    mkdirSync(directory, { mode: 0o700 });
    writeFileSync(join(directory, "market.json"), market(3), { mode: 0o600 });
    const first = await createRun(owner(0), DEFAULT_DEFINITION);
    for (let index = 1; index < 64; index++) await createRun(owner(index), DEFAULT_DEFINITION);
    expect(getRun(owner(0), first.id, 1, DEFAULT_DEFINITION.sort).id).toBe(first.id);

    const newest = await createRun(owner(64), DEFAULT_DEFINITION);
    expect(() => getRun(owner(0), first.id, 1, DEFAULT_DEFINITION.sort)).toThrow("run_expired");
    expect(getRun(owner(64), newest.id, 1, DEFAULT_DEFINITION.sort).id).toBe(newest.id);
  } finally {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    rmSync(root, { recursive: true, force: true });
  }
});

it("picks up live worker updates within a quarter second without changing pinned results", async () => {
  const root = mkdtempSync(join(tmpdir(), "stock-screeners-live-"));
  const directory = join(root, "stock-screeners-v1");
  const file = join(directory, "market.json");
  const initial = Date.parse("2026-11-14T17:00:00Z");
  const identity = { mode: "platform_session", scope: { userId: "live-market-fixture" } } as TraderLinkPlatformRequestIdentity;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(root, "market-fixture.sqlite"));
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER", "1");
  try {
    vi.setSystemTime(initial);
    mkdirSync(directory, { mode: 0o700 });
    writeFileSync(file, market(3), { mode: 0o600 });
    const first = await createRun(identity, DEFAULT_DEFINITION);
    vi.setSystemTime(initial + 150);
    writeFileSync(file + ".next", market(4), { mode: 0o600 });
    renameSync(file + ".next", file);
    expect((await createRun(identity, DEFAULT_DEFINITION)).capturedAt).toBe(initial);

    vi.setSystemTime(initial + 250);
    const fresh = await createRun(identity, DEFAULT_DEFINITION);
    expect(fresh.capturedAt).toBe(initial + 150);
    expect(fresh.total).toBe(3);
    expect(getRun(identity, first.id, 1, DEFAULT_DEFINITION.sort).total).toBe(2);
  } finally {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    rmSync(root, { recursive: true, force: true });
  }
});

it("offers the completed after-hours snapshot overnight while retaining the regular close", async () => {
  const root = mkdtempSync(join(tmpdir(), "stock-screeners-overnight-"));
  const directory = join(root, "stock-screeners-v1");
  const file = join(directory, "market.json");
  const now = Date.parse("2026-11-17T02:00:00Z");
  const identity = { mode: "platform_session", scope: { userId: "overnight-fixture" } } as TraderLinkPlatformRequestIdentity;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(root, "market.sqlite"));
  try {
    mkdirSync(directory, { mode: 0o700 });
    const pack = JSON.parse(market(4));
    expect(pack.latest).toBe("last_regular");
    expect(pack.snapshots.after_hours.date).toBe(pack.snapshots.last_regular.date);
    writeFileSync(file, JSON.stringify(pack));
    expect(await createRun(identity, DEFAULT_DEFINITION)).toMatchObject({
      session: "after_hours", closed: true, partial: false, asOf: Date.parse("2026-11-17T01:00:00Z"),
    });
    expect(await createRun(identity, { ...DEFAULT_DEFINITION, session: "last_regular" })).toMatchObject({
      session: "last_regular", closed: true, partial: false, asOf: Date.parse("2026-11-16T21:00:00Z"),
    });
    for (const row of pack.snapshots.after_hours.rows) delete row.values.price;
    writeFileSync(file + ".next", JSON.stringify(pack));
    renameSync(file + ".next", file);
    vi.setSystemTime(now + 6500);
    expect(await createRun(identity, DEFAULT_DEFINITION)).toMatchObject({ session: "last_regular", closed: true });
  } finally {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    rmSync(root, { recursive: true, force: true });
  }
});
