// @vitest-environment node
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { GET } from "@/app/api/internal/company/v1/roster/route";
import { TRADERLINK_PLATFORM_DB_PATH_ENV } from "@/src/modules/platform/server/database/platform-database-config";

it("exports the accepted roster through a holiday with a verifiable session calendar", async () => {
  const root = await mkdtemp(join(tmpdir(), "company-roster-export-"));
  const token = "local-test-only-".repeat(3);
  const request = (credential?: string) => new Request("http://localhost/api/internal/company/v1/roster", {
    headers: credential ? { Authorization: "Bearer " + credential } : {},
  });
  try {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-26T15:00:00Z"));
    vi.stubEnv(TRADERLINK_PLATFORM_DB_PATH_ENV, join(root, "test.sqlite"));
    vi.stubEnv("TRADERLINK_COMPANY_ROSTER_READ_TOKEN", "");
    expect((await GET(request())).status).toBe(503);
    vi.stubEnv("TRADERLINK_COMPANY_ROSTER_READ_TOKEN", token);
    expect((await GET(request("wrong"))).status).toBe(401);
    expect((await GET(request(token))).status).toBe(503);
    const directory = join(root, "scanner-live-v1");
    await mkdir(directory);
    const acceptedAtUtc = "2026-11-25T13:00:00.000Z";
    const record = { version: 1, tradingDate: "2026-11-25", acceptedAtUtc,
      lastCollectionAtUtc: acceptedAtUtc, latestUploadCount: 2, sourceHashes: ["a".repeat(64)],
      stocks: ["VIVS", "CLRO"].map(symbol => ({ symbol, exchange: "NASDAQ", marketCapAtCollection: 2_000_000 })) };
    const file = join(directory, "2026-11-25.json");
    await writeFile(file, JSON.stringify(record));
    const response = await GET(request(token));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ sourceDate: record.tradingDate, acceptedAtUtc, tickers: ["CLRO", "VIVS"] });
    const { from, through, tradingDates, digest } = data.calendar;
    expect(tradingDates).toContain("2026-11-27");
    expect(tradingDates).not.toContain("2026-11-26");
    expect(digest).toBe(createHash("sha256").update(JSON.stringify({ from, through, tradingDates })).digest("hex"));
    expect(await (await GET(request(token))).json()).toEqual(data);
    await writeFile(file, "{");
    expect((await GET(request(token))).status).toBe(503);
  } finally {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  }
});
