// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import type { LiveScannerRow, ScannerActiveHalt, ScannerReadModel } from "../../live/contracts";
import { EMPTY_SCAN, type SavedScan } from "../definition";
import { readSavedCustomScans, writeSavedCustomScans } from "../saved";
import { createMasterScannerMatches, type MasterScanRecipient } from "./master-scan-matches";
import { changeScanShare } from "./shared-scan-store";
import { presetMasterFacts, projectMarketEventMatches, savedMasterFacts } from "./master-scan-match-evaluation";
import { CustomScanMarket } from "../market";
import type { MasterScanFacts } from "./master-scan-match-store";

const fixtures: string[] = [];
const initialTime = Date.parse("2026-11-25T15:00:00.000Z");
const alice = { userId: "alice", workspaceId: "traders" };
const bob = { userId: "bob", workspaceId: "traders" };
const other = { userId: "alice", workspaceId: "other" };
const scan: SavedScan = { id: "d4d47433-dbee-4fda-956e-f711cfae49e8", name: "Small caps", definition: EMPTY_SCAN };

afterEach(() => fixtures.splice(0).forEach(directory => rmSync(directory, { recursive: true, force: true })));

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "master-scan-test-"));
  fixtures.push(directory);
  const saved = join(directory, "saved");
  const data = join(directory, "events");
  let now = initialTime;
  let revision = 7;
  let current: MasterScanFacts | null = null;
  let valid = true;
  const blocked = new Set<string>();
  const emitters = new Set<() => void>();
  const sample = vi.fn(async () => current);
  const verifyEvidence = vi.fn(async () => valid);
  const dependencies: Parameters<typeof createMasterScannerMatches>[0] = {
    directory: data, savedDirectory: saved, now: () => now, presetRevision: () => revision,
    readIdentity(recipient: MasterScanRecipient) {
      if (blocked.has(JSON.stringify(recipient))) return null;
      const identity: TraderLinkPlatformRequestIdentity = {
        scope: { ...recipient, workspaceRole: "member", activeAccountId: null, allowedAccountIds: [] },
        sessionId: null, mode: "platform_session", displayName: null, discord: null,
      };
      return identity;
    },
    allowScanner: () => true, allowNews: () => true, cachedEvidence: () => true, verifyEvidence,
    open: (_source, changed) => {
      emitters.add(changed);
      return { close: () => { emitters.delete(changed); }, sample };
    },
  };
  const set = (symbol: string | null = null, coverage: MasterScanFacts["coverage"] = "complete") => {
    now += 1000;
    current = { coverage, session: "regular", detectedAtUtc: new Date(now).toISOString(),
      matches: symbol ? [{ instrumentId: "NASDAQ:" + symbol, symbol, observedAtUtc: new Date(now - 1).toISOString(),
        reasonCodes: ["price-rising"], ...(symbol === "LEVEL" ? { privateLevels: ["internal-level-id"] } : {}) }] : [] };
  };
  return { saved, producer: createMasterScannerMatches(dependencies), sample, verifyEvidence, set,
    reopen: () => createMasterScannerMatches(dependencies), bumpPreset: () => { revision++; },
    advance: (ms: number) => { now += ms; }, disconnect: () => { current = null; },
    block: (recipient: MasterScanRecipient) => blocked.add(JSON.stringify(recipient)), emitters,
    rejectEvidence: () => { valid = false; },
  };
}

it("records ordered scoped snapshots, rejects evidence swaps, and replays the original run after restart", async () => {
  const f = fixture();
  const source = f.producer.resolveMasterScanSource(alice, { kind: "preset", id: "gainers" })!.source;
  expect(f.producer.listMasterScanSources(alice)).toHaveLength(6);
  f.set();
  const baseline = await f.producer.captureMasterScanMatches(alice, source);
  expect(baseline).toMatchObject({ sequence: 1, coverage: "complete", matches: [] });
  f.set("NANO", "partial");
  const positive = (await f.producer.captureMasterScanMatches(alice, source))!;
  expect(positive).toMatchObject({ sequence: 2, coverage: "partial" });
  if (positive.coverage === "unavailable") throw Error("Missing match");
  const [match] = positive.matches;
  expect(await f.producer.captureMasterScanMatches(alice, source)).toBeNull();
  expect(f.producer.readMasterScanMatchEvidence(bob, source, match)).toBeNull();
  expect(f.producer.readMasterScanMatchEvidence(other, source, match)).toBeNull();
  expect(f.producer.readMasterScanMatchEvidence(alice, source, { ...match, instrumentId: "NASDAQ:SWAP" })).toBeNull();
  expect(f.producer.readMasterScanMatchEvidence(alice, source, { ...match, observedAtUtc: "2026-11-25T15:00:10.000Z" })).toBeNull();
  expect(await f.producer.verifyMasterScanMatchEvidence(alice, source, match))
    .toEqual({ symbol: "NANO", reasonCodes: ["price-rising"] });
  const afterRestart = f.reopen();
  expect(afterRestart.readMasterScanMatches(alice, source, 1)).toEqual({
    state: "allowed", continuity: "continuous", events: [positive], latest: positive,
  });
  expect(afterRestart.readMasterScanMatches(alice, source, 7).continuity).toBe("gap");
  f.advance(8 * 86_400_000);
  expect(afterRestart.readMasterScanMatchEvidence(alice, source, match)).toBeNull();
  expect(afterRestart.readMasterScanMatches(alice, source, 1).continuity).toBe("gap");
  f.set("NEW");
  expect(await afterRestart.captureMasterScanMatches(alice, source)).toMatchObject({ sequence: 3 });
});

it("keeps a private saved scan version through renames and unrelated edits, then rotates it on a rule edit and revert", async () => {
  const f = fixture();
  let book = writeSavedCustomScans(f.saved, alice.userId, { revision: 0, scans: [scan] });
  const selection = { kind: "saved", id: scan.id } as const;
  expect(f.producer.resolveMasterScanSource(bob, selection)).toBeNull();
  const offered = f.producer.resolveMasterScanSource(alice, selection)!;
  book = writeSavedCustomScans(f.saved, alice.userId, { ...book, scans: [
    { ...scan, name: "Renamed" }, { ...scan, id: "73b96b37-7c12-46dc-b093-018f58c3f074", name: "Different setup" },
  ] });
  expect(f.producer.resolveMasterScanSource(alice, selection)).toEqual({ title: "Renamed", source: offered.source });
  expect(readSavedCustomScans(f.saved, alice.userId)).toEqual(book);
  f.set("LEVEL");
  const published = (await f.producer.captureMasterScanMatches(alice, offered.source))!;
  if (published.coverage === "unavailable") throw Error("Missing match");
  const match = published.matches[0];
  expect(JSON.stringify(published)).not.toContain("internal-level-id");
  f.rejectEvidence();
  expect(await f.producer.verifyMasterScanMatchEvidence(alice, offered.source, match)).toBeNull();
  book = writeSavedCustomScans(f.saved, alice.userId, { ...book, scans: [
    { ...scan, definition: { ...EMPTY_SCAN, rules: [{ metric: "price", minimum: 3, maximum: null }] } },
  ] });
  expect(f.producer.resolveMasterScanAccess(alice, offered.source)).toBe("review-required");
  expect(f.producer.readMasterScanMatchEvidence(alice, offered.source, match)).toBeNull();
  writeSavedCustomScans(f.saved, alice.userId, { ...book, scans: [scan] });
  expect(f.producer.resolveMasterScanAccess(alice, offered.source)).toBe("review-required");
});

it("pins a shared publication and refuses queued evidence when a grant changes during final verification", async () => {
  const f = fixture();
  const book = writeSavedCustomScans(f.saved, alice.userId, { revision: 0, scans: [scan] });
  const grant = changeScanShare(f.saved, alice.userId, { operation: "publish", mode: "filters", revision: book.revision, scanId: scan.id, expectedId: null })!;
  const offer = f.producer.resolveMasterScanSource(bob, { kind: "shared", id: grant.id })!;
  expect(offer.source.version).toMatch(/^publication-1:[a-f0-9]{64}$/u);
  expect(JSON.stringify(offer)).not.toContain(grant.id);
  expect(f.reopen().listMasterScanSources(bob)).toContainEqual(offer);
  expect(f.producer.listMasterScanSources(alice)).not.toContainEqual(offer);
  expect(f.producer.resolveMasterScanSource(alice, { kind: "shared", id: offer.source.version })).toBeNull();
  expect(f.producer.resolveMasterScanAccess(alice, offer.source)).toBe("access-lost");
  expect(f.producer.resolveMasterScanAccess(bob, { ...offer.source, version: grant.id })).toBe("access-lost");
  f.set("NANO");
  const delivery = (await f.producer.captureMasterScanMatches(bob, offer.source))!;
  if (delivery.coverage === "unavailable") throw Error("Missing match");
  const [match] = delivery.matches;
  expect(f.producer.readMasterScanMatchEvidence(alice, offer.source, match)).toBeNull();
  let replacement = "";
  f.verifyEvidence.mockImplementationOnce(async () => {
    replacement = changeScanShare(f.saved, alice.userId, { operation: "publish", mode: "results", revision: book.revision,
      scanId: scan.id, expectedId: grant.id })!.id;
    return true;
  });
  expect(await f.producer.verifyMasterScanMatchEvidence(bob, offer.source, match)).toBeNull();
  expect(f.producer.readMasterScanMatches(bob, offer.source)).toMatchObject({ state: "access-lost", events: [] });
  expect(f.producer.listMasterScanSources(bob)).not.toContainEqual(offer);
  const restored = f.producer.resolveMasterScanSource(bob, { kind: "shared", id: replacement })!;
  expect(restored.source.scanId).toBe(offer.source.scanId);
  expect(restored.source.version).not.toBe(offer.source.version);
  expect(f.producer.readMasterScanMatches(bob, restored.source).events).toEqual([]);
  expect(f.producer.readMasterScanMatchEvidence(bob, restored.source, match)).toBeNull();
  f.block(bob);
  expect(f.producer.resolveMasterScanAccess(bob, restored.source)).toBe("access-lost");
});

it("stops a live subscription on a revision change, and records unavailability without an exit", async () => {
  const f = fixture();
  const source = f.producer.resolveMasterScanSource(alice, { kind: "preset", id: "momentum" })!.source;
  const observe = vi.fn();
  const release = f.producer.openMasterScanMatches(alice, source, observe);
  try {
    f.set("NANO");
    await vi.waitFor(() => expect(observe).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ sequence: 1 })));
    f.advance(1000);
    f.disconnect();
    for (const changed of f.emitters) changed();
    await vi.waitFor(() => expect(observe).toHaveBeenLastCalledWith(expect.objectContaining({ coverage: "unavailable", sequence: 2 })));
    f.bumpPreset();
    for (const changed of f.emitters) changed();
    await vi.waitFor(() => expect(f.emitters.size).toBe(0));
    expect(f.producer.readMasterScanMatches(alice, source)).toMatchObject({ state: "review-required", events: [] });
  } finally { release(); }
});

it("rejects a capture if the recipient loses access while evaluation is in progress", async () => {
  const f = fixture();
  const source = f.producer.resolveMasterScanSource(bob, { kind: "preset", id: "losers" })!.source;
  f.sample.mockImplementationOnce(async () => {
    f.block(bob);
    return { coverage: "complete", detectedAtUtc: new Date(initialTime).toISOString(), session: "regular", matches: [] };
  });
  expect(await f.producer.captureMasterScanMatches(bob, source)).toBeNull();
  expect(f.producer.readMasterScanMatches(bob, source).state).toBe("access-lost");
});

it("keeps built-in ranking, excludes early Momentum, and marks ranked truncation partial", () => {
  const at = new Date(initialTime).toISOString();
  const row = (symbol: string): LiveScannerRow => ({
    symbol, exchange: "NASDAQ", company: symbol, price: 1.25, sessionGain: 25,
    volume: 150_000, dollarVolume: 187_500, marketCap: 8_000_000, marketCapAtCollection: 8_000_000,
    float: 1_000_000, relativeVolume: 3, dayHigh: 1.3, dayLow: 1, offHighPercent: -4,
    floatRetrievedAtUtc: at, spreadPercent: 1, providerAtUtc: at, receivedAtUtc: at,
    activity: { oneMinuteGain: 4, fiveMinuteGain: 20, oneMinuteVolume: 1000, oneMinuteDollarVolume: 1250,
      fiveMinuteVolume: 5000, fiveMinuteVolumeSpike: 2, volumeAcceleration: 3 }, reasons: [], news: [], momentumState: "active",
    momentumHit: { tier: "confirmed", number: 1, startedAtUtc: at, signals: ["volume_ignition"] },
  });
  const gainers = { rows: [row("VIVS"), row("CHSN")], total: 3, focus: [] };
  const momentum = { rows: [], total: 2, focus: [], momentumSections: {
    confirmed: [row("AKAN")], early: [row("VIVS")], confirmedTotal: 1, earlyTotal: 1,
  } };
  const model = { status: "ready", session: "regular", tradingDate: "2026-11-25", updatedAtUtc: at,
    universeCount: 5, receivedCount: 5, missingSymbols: [], missingFloatCount: 0, issues: [], gainers, momentum } as const satisfies ScannerReadModel;
  const top = presetMasterFacts("gainers", model, initialTime);
  expect(top?.coverage).toBe("partial");
  expect(top?.matches.map(match => match.symbol)).toEqual(["VIVS", "CHSN"]);
  const confirmed = presetMasterFacts("momentum", model, initialTime);
  expect(confirmed?.coverage).toBe("complete");
  expect(confirmed?.matches.map(match => match.symbol)).toEqual(["AKAN"]);
  expect(presetMasterFacts("gainers", model, initialTime + 600_000)).toBeNull();
});

it("captures the actual saved evaluator's complete multi-page results with safe projected evidence", () => {
  const at = new Date(initialTime).toISOString();
  const market = new CustomScanMarket();
  const rows = Array.from({ length: 56 }, (_, i) => ({
    symbol: "D" + i, exchange: "NASDAQ" as const, price: i + 1, volume: 1000, dollarVolume: 1000,
    marketCap: 20_000_000, float: 2_000_000, dayChange: i, belowHigh: 0, observedAt: initialTime,
  }));
  const empty = { rows: [], total: 0, focus: [] };
  const model = { status: "ready", session: "regular", tradingDate: "2026-11-25", updatedAtUtc: at,
    universeCount: rows.length, receivedCount: rows.length, missingSymbols: [], missingFloatCount: 0, issues: [],
    gainers: empty, momentum: empty } as const satisfies ScannerReadModel;
  market.set("open", initialTime, "fixture", rows, new Set(rows.map(row => row.symbol)));
  const definition = { ...EMPTY_SCAN, rules: [{ metric: "price" as const, minimum: 2, maximum: null }] };
  const result = savedMasterFacts(definition, market, model, initialTime);
  expect(result?.coverage).toBe("complete");
  expect(result?.matches).toHaveLength(55);
  expect(result?.matches[0]).toEqual({ instrumentId: "NASDAQ:D55", symbol: "D55", observedAtUtc: at, reasonCodes: [] });
  expect(result?.matches.at(-1)?.symbol).toBe("D1");
  market.set("open", initialTime, "fixture", rows, new Set([...rows.map(row => row.symbol), "MISSING"]));
  expect(savedMasterFacts(definition, market, model, initialTime)?.coverage).toBe("partial");
});

it("reports the same halt window as the card and falls back to the eligible PR after resumption", () => {
  const model = { status: "ready", tradingDate: "2026-11-19", session: "regular" } as const;
  const at = (clock: string) => Date.parse(model.tradingDate + "T" + clock + "-05:00");
  const halt: ScannerActiveHalt = { ticker: "VIVS", id: "pause", market: "NASDAQ",
    haltTimeEt: "10:00:00.123456", tradeTimeEt: "10:09:00", quoteTimeEt: "10:08:00",
    reasonCode: "LUDP", reason: "Volatility pause", halted: true };
  const articles = [{ ticker: "VIVS", id: "pr", publishedAt: "2026-11-19T13:05:00Z", marketCap: "10M" }];
  const stocks = new Map([["VIVS", "NASDAQ"]]);
  const read = (timestamp: number, row = halt, unavailable = false) =>
    projectMarketEventMatches(model, timestamp, articles, 200e6, stocks, [row], unavailable);
  for (const time of [at("10:00:00.122"), at("10:09:00"), at("10:09:00.001")]) {
    expect(read(time)).toMatchObject({ coverage: "complete", matches: [{ eventId: "pr" }] });
  }
  for (const time of [at("10:00:00.123"), at("10:08:00"), at("10:08:59.999")]) {
    expect(read(time)).toMatchObject({ coverage: "complete",
      matches: [{ eventId: "pause", observedAtUtc: "2026-11-19T15:00:00.123Z" }] });
  }
  expect(read(at("11:00:00.123"), { ...halt, tradeTimeEt: null }).matches[0].eventId).toBe("pr");
  expect(read(at("10:01:00"), { ...halt, haltedAtUtc: "2026-11-18T15:00:00Z" }).matches[0].eventId).toBe("pr");
  expect(read(at("10:01:00"), halt, true).coverage).toBe("partial");
  expect(read(at("10:01:00"), { ...halt, haltTimeEt: "unknown" })).toMatchObject({
    coverage: "partial", matches: [{ eventId: "pr" }],
  });
});
