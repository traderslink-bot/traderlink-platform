// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { handleUniverseImport } from "./universe-import-handler";
import { UniverseStore } from "./universe-store";
import type { UniverseUpload } from "../contracts";

const NOW = Date.parse("2026-11-02T09:00:00Z");
const TOKEN = "synthetic-import-token-"+"x".repeat(32);
const directories: string[] = [];
async function temporary(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(),"traderlink-scanner-import-synthetic-")); directories.push(directory); return directory;
}
afterEach(async () => { await Promise.all(directories.splice(0).map(directory => rm(directory,{ recursive: true,force: true }))); });
function upload(csv = "symbol,exchange,market_cap\nAAA,NASDAQ,10000000"): UniverseUpload {
  const count = csv.trim().split("\n").length-1;
  return { tradingDate: "2026-11-02",csv,metadata: { completeness_status: "complete",source_url: "https://stockanalysis.com/stocks/screener/",
    collection_started_at_utc: "2026-11-02T08:00:00Z",collection_finished_at_utc: "2026-11-02T08:01:00Z",
    displayed_total: count,extracted_unique_count: count,applied_filters: { exchanges: ["NASDAQ","NYSE"],market_cap_max: 100_000_000 } } };
}
function request(value: unknown = upload(), headers: Record<string,string> = {}): Request {
  return new Request("https://example.invalid/api/scanner/universe/import",{ method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`,"content-type": "application/json",...headers },body: JSON.stringify(value) });
}
const configured = { environment: { NODE_ENV:"test",TRADERLINK_SCANNER_UNIVERSE_IMPORT_TOKEN: TOKEN } satisfies NodeJS.ProcessEnv,now: () => NOW,isTradingDate: () => true };

describe("authenticated bounded scanner import", () => {
  it("fails closed when unconfigured and authenticates before consuming body or creating storage", async () => {
    const save = vi.fn();
    expect((await handleUniverseImport(request(),{ ...configured,environment: { NODE_ENV:"test" },save })).status).toBe(503);
    const wrong = request(undefined,{ authorization: "Bearer "+"y".repeat(50) });
    expect((await handleUniverseImport(wrong,{ ...configured,save })).status).toBe(401);
    expect(wrong.bodyUsed).toBe(false); expect(save).not.toHaveBeenCalled();
  });
  it("refuses unsupported media, malformed/oversize bodies and slow streams before save", async () => {
    const save = vi.fn();
    expect((await handleUniverseImport(request(upload(),{ "content-type": "text/plain" }),{ ...configured,save })).status).toBe(415);
    const malformed = new Request("https://example.invalid/",{ method: "POST",headers: { authorization: `Bearer ${TOKEN}`,"content-type": "application/json" },body: "{" });
    expect((await handleUniverseImport(malformed,{ ...configured,save })).status).toBe(400);
    expect((await handleUniverseImport(request("x".repeat(769_000)),{ ...configured,save })).status).toBe(413);
    const stream = new ReadableStream<Uint8Array>({ start() {} });
    const slow = new Request("https://example.invalid/",{ method: "POST",headers: { authorization: `Bearer ${TOKEN}`,"content-type": "application/json" },body: stream,duplex: "half" } as RequestInit);
    expect((await handleUniverseImport(slow,{ ...configured,save,bodyTimeoutMs: 5 })).status).toBe(408);
    expect(save).not.toHaveBeenCalled();
  });
  it("rejects partial/count mismatches, wrong dates, closed days and unavailable calendars without writes", async () => {
    const save = vi.fn();
    expect((await handleUniverseImport(request({ ...upload(),metadata: { ...upload().metadata,displayed_total: 1251 } }),{ ...configured,save })).status).toBe(400);
    const old = { ...upload(),tradingDate: "2026-11-01",metadata: { ...upload().metadata,collection_started_at_utc: "2026-11-01T09:00:00Z",collection_finished_at_utc: "2026-11-01T09:01:00Z" } };
    expect((await handleUniverseImport(request(old),{ ...configured,save })).status).toBe(409);
    expect((await handleUniverseImport(request(),{ ...configured,save,isTradingDate: () => false })).status).toBe(409);
    expect((await handleUniverseImport(request(),{ ...configured,save,isTradingDate: () => { throw Error("synthetic calendar unavailable"); } })).status).toBe(503);
    expect(save).not.toHaveBeenCalled();
  });
  it("returns no private path or raw filesystem error when configuration/storage fails", async () => {
    const response = await handleUniverseImport(request(),{ ...configured,save: async () => { throw Error("synthetic-secret-private-path"); } });
    expect(response.status).toBe(503); expect(await response.text()).not.toContain("synthetic-secret");
  });
  it("creates a dated list and makes exact retries safe across store instances", async () => {
    const root = await temporary(), store = new UniverseStore(join(root,"scanner-live-v1"));
    const first = await handleUniverseImport(request(),{ ...configured,save: (value,at) => store.import(value,at) });
    expect(first.status).toBe(201);
    expect(await first.json()).toMatchObject({ retainedCount: 1,uploadCount: 1,idempotent: false,tradingDate: "2026-11-02" });
    const secondStore = new UniverseStore(store.directory);
    const repeated = await handleUniverseImport(request(),{ ...configured,save: (value,at) => secondStore.import(value,at) });
    expect(repeated.status).toBe(200); expect((await repeated.json()).idempotent).toBe(true);
    expect(first.headers.get("cache-control")).toContain("no-store");
    expect((await secondStore.read("2026-11-02"))?.stocks[0].symbol).toBe("AAA");
    expect(await secondStore.read("2026-11-03")).toBeNull();
    expect(await readdir(store.directory)).toHaveLength(2);
    for (const file of await readdir(store.directory)) expect((await stat(join(store.directory,file))).mode & 0o777).toBe(0o600);
  });
  it("uses the validated DB parent for default persistence without opening/creating a database", async () => {
    const root = await temporary();
    const result = await handleUniverseImport(request(),{ ...configured,environment: { ...configured.environment,TRADERLINK_PLATFORM_DB_PATH: join(root,"synthetic.sqlite") } });
    expect(result.status).toBe(201);
    expect(await readdir(root)).toEqual(["scanner-live-v1"]);
  });
});

describe("single-writer durable daily universe", () => {
  it("retains the latest successful universe when a newer trading-day file is absent", async () => {
    const directory = join(await temporary(),"lists"), store = new UniverseStore(directory);
    await store.import(upload(),NOW);
    expect((await store.readLatestOnOrBefore("2026-11-03"))?.tradingDate).toBe("2026-11-02");
    expect(await store.readLatestOnOrBefore("2026-11-01")).toBeNull();
  });
  it("serializes concurrent store instances without losing either qualifying member", async () => {
    const root = await temporary(), directory = join(root,"lists");
    await Promise.all([new UniverseStore(directory).import(upload(),NOW),new UniverseStore(directory).import(upload("symbol,exchange,market_cap\nBBB,NYSE,20000000"),NOW)]);
    expect((await new UniverseStore(directory).read("2026-11-02"))?.stocks.map(row => row.symbol)).toEqual(["AAA","BBB"]);
    expect((await readdir(directory)).filter(name => name.endsWith(".tmp"))).toHaveLength(0);
  });
  it("does not persist arbitrary client metadata or credentials", async () => {
    const directory = join(await temporary(),"lists"), store = new UniverseStore(directory);
    await store.import({ ...upload(),metadata: { ...upload().metadata,upload_token: "synthetic-never-save-me" } },NOW);
    for (const file of await readdir(directory)) expect(await readFile(join(directory,file),"utf8")).not.toContain("synthetic-never-save-me");
  });
  it("preserves a good list when the next input is incomplete or conflicts on venue", async () => {
    const directory = join(await temporary(),"lists"), store = new UniverseStore(directory);
    await store.import(upload(),NOW);
    const before = await readFile(join(directory,"2026-11-02.json"),"utf8");
    await expect(store.import({ ...upload(),metadata: { ...upload().metadata,completeness_status: "partial" } },NOW)).rejects.toThrow();
    await expect(store.import(upload("symbol,exchange,market_cap\nAAA,NYSE,10000000"),NOW)).rejects.toThrow("exchange_conflict");
    expect(await readFile(join(directory,"2026-11-02.json"),"utf8")).toBe(before);
  });
  it("recovers after an interrupted canonical write using existing immutable evidence", async () => {
    const directory = join(await temporary(),"lists"), store = new UniverseStore(directory);
    await store.import(upload(),NOW);
    await rm(join(directory,"2026-11-02.json")); // Synthetic crash fixture, never runtime recovery/deletion.
    const result = await new UniverseStore(directory).import(upload(),NOW);
    expect(result.universe.stocks).toHaveLength(1); expect(await readdir(directory)).toHaveLength(2);
  });
  it("fails closed on corrupt daily data, malicious fields or symlinked storage", async () => {
    const root = await temporary(), directory = join(root,"lists"), store = new UniverseStore(directory);
    await store.import(upload(),NOW);
    const good = await store.read("2026-11-02");
    await writeFile(join(directory,"2026-11-02.json"),"{bad");
    await expect(store.read("2026-11-02")).rejects.toThrow();
    await writeFile(join(directory,"2026-11-02.json"),JSON.stringify({ ...good,stocks: [{ symbol: "AAA,NASDAQ,1\nBBB",exchange: "NASDAQ",marketCapAtCollection: 1 }] }));
    await expect(store.read("2026-11-02")).rejects.toThrow("storage_invalid");
    const real = join(root,"real"); await symlink(directory,real);
    await expect(new UniverseStore(real).read("2026-11-02")).rejects.toThrow("path_invalid");
    await expect(store.read("../../elsewhere")).rejects.toThrow("date_invalid");
  });
  it("never overwrites conflicting immutable evidence after a partial crash", async () => {
    const directory = join(await temporary(),"lists"), store = new UniverseStore(directory);
    await store.import(upload(),NOW);
    const evidence = (await readdir(directory)).find(file => file !== "2026-11-02.json")!;
    await writeFile(join(directory,evidence),"{}");
    await rm(join(directory,"2026-11-02.json"));
    await expect(new UniverseStore(directory).import(upload(),NOW)).rejects.toThrow("evidence_conflict");
    expect(await readFile(join(directory,evidence),"utf8")).toBe("{}");
    expect(await store.read("2026-11-02")).toBeNull();
  });
});
