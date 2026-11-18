// @vitest-environment node
import { Readable } from "node:stream";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { afterEach, expect, it, vi } from "vitest";
import { config } from "@/proxy";
import { POST } from "@/app/api/internal/stock-screeners-pack/route";
import { previewPack } from "./fixture";
import { validateMarketPack } from "./snapshot-file";

const require = createRequire(import.meta.url);
const { getCloneableBody } = require("next/dist/server/body-streams") as {
  getCloneableBody(source: Readable): { cloneBodyStream(): Readable };
};
const { unstable_doesMiddlewareMatch } = require("next/dist/experimental/testing/server/middleware-testing-utils") as {
  unstable_doesMiddlewareMatch(input: { config: { matcher: string[] }; url: string }): boolean;
};
const url = "https://app.traderslink.pro/api/internal/stock-screeners-pack";
const token = "isolated-body-size-regression-test-token";
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it("keeps the stream-upload endpoint outside proxy cloning and preserves matching everywhere else", () => {
  for (const path of ["/api/internal/stock-screeners-pack", "/api/internal/stock-screeners-pack/"])
    expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(false);
  for (const path of ["/", "/workspace", "/help", "/ai-reviews", "/api/cron/ai-reviews", "/api/internal/stock-screeners-live",
    "/api/internal/stock-screeners-pack-other", "/api/internal/stock-screeners-pack/extra"])
    expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(true);
});

it("publishes a validated large pack through the route and reproduces the old proxy's JSON truncation", async () => {
  const root = mkdtempSync(join(tmpdir(), "screeners-large-body-"));
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(root, "isolated.sqlite"));
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER", "1");
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN", token);
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  const now = Date.now(), selection = { provider: "alpaca", revision: 0 } as const;
  const pack = previewPack(now, 2_501);
  pack.selection = selection;
  for (const snapshot of Object.values(pack.snapshots)) {
    snapshot.source = "Alpaca SIP";
    for (const row of snapshot.rows) delete row.values.pressReleaseAge;
  }
  validateMarketPack(pack, now, selection);
  const body = Buffer.from(JSON.stringify({ ...selection, pack }));
  expect(body.byteLength).toBeGreaterThan(10 * 1024 * 1024);
  const source = Readable.from((function* () {
    for (let offset = 0; offset < body.length; offset += 65_536) yield body.subarray(offset, offset + 65_536);
  })());
  const pieces: Buffer[] = [];
  for await (const piece of getCloneableBody(source).cloneBodyStream()) pieces.push(piece);
  const truncated = Buffer.concat(pieces);
  expect(truncated.length).toBe(10 * 1024 * 1024);
  expect(() => JSON.parse(truncated.toString())).toThrow();
  try {
    const send = (payload: Buffer, key = token) => POST(new Request(url, { method: "POST",
      headers: { Authorization: "Bearer " + key }, body: new Uint8Array(payload) }));
    expect((await send(truncated)).status).toBe(400);
    expect(warning).toHaveBeenCalledWith("screeners_pack_rejected", { stage: "body", bytes: truncated.length, code: "invalid_json" });
    expect((await send(body, "wrong")).status).toBe(404);
    expect((await send(body)).status).toBe(204);
    const saved = JSON.parse(readFileSync(join(root, "stock-screeners-v1", "market-alpaca-0.json"), "utf8"));
    expect(saved.snapshots.last_regular.rows).toHaveLength(2_501);
    expect(saved.snapshots.after_hours.asOf).toBe(pack.snapshots.after_hours.asOf);
    expect(saved.selection).toEqual(selection);
    expect((await send(Buffer.from(JSON.stringify({ ...selection, revision: 1, pack })))).status).toBe(409);
    const invalid = { ...pack, snapshots: { ...pack.snapshots,
      regular: { ...pack.snapshots.regular, asOf: pack.snapshots.regular.capturedAt + 1 } } };
    expect((await send(Buffer.from(JSON.stringify({ ...selection, pack: invalid })))).status).toBe(400);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

it("still stops an authenticated upload at the existing 128 MiB streaming bound", async () => {
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER", "1");
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN", token);
  const chunk = new Uint8Array(1024 * 1024);
  let sent = 0, cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ pull(controller) {
    if (sent++ < 130) controller.enqueue(chunk);
    else controller.close();
  }, cancel() { cancelled = true; } });
  const request = new Request(url, { method: "POST", headers: { Authorization: "Bearer " + token }, body: stream, duplex: "half" } as RequestInit);
  expect((await POST(request)).status).toBe(413);
  expect(cancelled).toBe(true);
});
