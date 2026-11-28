// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { closedScannerStudySession } from "../../market-data/candle-history/scanner-study-session";
import { CandleHistoryStore } from "../../market-data/candle-history/store";
import type { CandleArchiveRead, CandleArchiveReply } from "../../market-data/candle-history/transport";
import { decodeGatewayWire, gatewayWireUrl } from "../../market-data/transport/gateway-wire";
import { createAlpacaGateway } from "../alpaca/gateway";
import { ArchiveStudies } from "./archive-studies";

const seconds = (instant: string) => Date.parse(instant) / 1000;

it.each([
  ["2026-11-26", "2026-11-25", "2026-11-26T01:00Z", false], // Thanksgiving
  ["2026-11-28", "2026-11-27", "2026-11-27T22:00Z", true], // shortened Friday
  ["2026-04-03", "2026-04-02", "2026-04-03T00:00Z", true], // Good Friday
  ["2026-09-07", "2026-09-04", "2026-09-05T00:00Z", true], // Labor Day
] as const)("resolves the extended close and completed week for %s", (date, basisFrom, close, weekFinished) => {
  expect(closedScannerStudySession(date)).toEqual({ basisFrom, close: seconds(close), weekFinished });
});

it.each(["2026-11-27", "2040-11-24"])("requires the exact split date on open or unverified %s", date => {
  expect(closedScannerStudySession(date)).toBeUndefined();
});

it.each([
  ["2026-11-26T21:00Z", "2026-11-25", "2026-11-23T05:00Z"],
  ["2026-11-28T21:00Z", "2026-11-27", "2026-11-27T22:00Z"],
  ["2026-04-03T21:00Z", "2026-04-02", "2026-04-03T00:00Z"],
])("stops weekly Scanner reads at the completed week as of %s", async (instant, basisDate, expected) => {
  const read = vi.fn(async (q: CandleArchiveRead): Promise<CandleArchiveReply> => ({
    ...q, basisDate, state: "ready", bars: [],
  }));
  const studies = new ArchiveStudies(read, () => {});
  studies.value("GMM", "1W", "smaDistance", 20, Date.parse(instant));
  expect(read).toHaveBeenCalledWith(expect.objectContaining({ frame: "1D", end: seconds(expected) }));
});

it("reads the stock and benchmark through the Scanner gateway on Thanksgiving and rechecks on reopening", async () => {
  const directory = mkdtempSync(join(tmpdir(), "scanner-holiday-"));
  const path = join(directory, "archive.sqlite");
  const store = new CandleHistoryStore(path);
  const at = Date.parse("2026-11-26T21:00Z");
  const close = seconds("2026-11-26T01:00Z");
  const basis = "a".repeat(64);
  const range = { frame: "1D" as const, session: "daily" as const, start: close - 200 * 86400, end: close };
  const bars = [23, 24, 25].map((d, i) => ({
    time: seconds(`2026-11-${d}T05:00Z`), open: 1, low: 1, high: 3, close: i + 1, volume: 10,
  }));
  for (const symbol of ["CLRO", "SPY"]) {
    store.updateBasis(symbol, "2026-11-25", basis);
    store.saveVerified([{ ...range, symbol, basis, bars }]);
  }
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(at);
  const gateway = createAlpacaGateway({ keyId: "test", secretKey: "test", token: "test", candleHistoryReadPath: path });
  try {
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`;
    async function read(q: CandleArchiveRead, scanner = true): Promise<CandleArchiveReply> {
      const params = new URLSearchParams({ ...q, start: String(q.start), end: String(q.end) });
      if (scanner) params.set("purpose", "scanner");
      const response = await fetch(gatewayWireUrl(origin, "candle-history", params), {
        headers: { Authorization: "Bearer test" },
      });
      expect(response.status).toBe(200);
      return decodeGatewayWire("candle-history", await response.json()) as CandleArchiveReply;
    }
    const q = { ...range, symbol: "CLRO" };
    const changed = vi.fn();
    const studies = new ArchiveStudies(read, changed);
    studies.value("CLRO", "1D", "returnVsSpy", 2, at);
    await vi.waitFor(() => expect(changed).toHaveBeenCalled());
    expect(studies.value("CLRO", "1D", "returnVsSpy", 2, at)).toBe(0);
    studies.invalidateCorrectedSymbol("SPY");
    expect(studies.value("CLRO", "1D", "returnVsSpy", 2, at)).toBeNull();
    await vi.waitFor(() => expect(studies.value("CLRO", "1D", "returnVsSpy", 2, at)).toBe(0));
    expect(await read(q)).toMatchObject({ state: "ready", basisDate: "2026-11-25", bars });
    expect(await read(q, false)).toEqual({ state: "miss" });
    expect(await read({ ...q, start: q.start - 1 })).toEqual({ state: "miss" });
    expect(await read({ ...q, end: q.end + 1 })).toEqual({ state: "miss" });
    for (const disallowed of ["2026-11-24", "2026-11-27"]) {
      store.updateBasis(q.symbol, disallowed, basis);
      expect(await read(q)).toEqual({ state: "miss" });
    }
    store.updateBasis(q.symbol, "2026-11-26", basis);
    expect(await read(q)).toMatchObject({ state: "ready", basisDate: "2026-11-26" });
    vi.setSystemTime(Date.parse("2026-11-27T11:00Z"));
    expect(await read(q)).toEqual({ state: "miss" });
  } finally {
    gateway.close();
    gateway.server.closeAllConnections();
    vi.useRealTimers();
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
