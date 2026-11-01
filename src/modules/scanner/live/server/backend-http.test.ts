import { describe, expect, it, vi } from "vitest";
import { initialConfiguration } from "../settings";
import type { ScannerReadModel } from "../contracts";
import { handleLiveScannerGet, handleScannerFloatsGet, handleScannerSettings } from "./backend-http";

const model: ScannerReadModel = { status: "disabled", tradingDate: "2026-10-30", session: null, updatedAtUtc: null,
  universeCount: 0, receivedCount: 0, missingSymbols: [], missingFloatCount: 0,
  gainers: { rows: [],focus: [],total: 0 }, momentum: { rows: [],focus: [],total: 0 }, issues: [] };
const request = (method: "GET"|"POST", value?: unknown, headers?: HeadersInit) => new Request("https://app.traderslink.pro/api/test",{
  method, headers: { "content-type": "application/json",...headers }, body: value === undefined ? undefined : JSON.stringify(value),
});

describe("live scanner HTTP", () => {
  it("returns indistinguishable 404 before reading for an unauthorized member", async () => {
    const read = vi.fn(() => model);
    const response = await handleLiveScannerGet(request("GET"),{ member: () => false,read });
    expect(response.status).toBe(404); expect(read).not.toHaveBeenCalled();
  });
  it("returns an authenticated private no-store read model", async () => {
    const response = await handleLiveScannerGet(request("GET"),{ member: () => true,read: () => model });
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("private, no-store");
    expect(await response.json()).toEqual(model);
  });
  it("suppresses private read failures", async () => {
    const response = await handleLiveScannerGet(request("GET"),{ member: () => true,read: () => { throw Error("/private/path"); } });
    expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain("private");
  });
});

describe("scanner settings HTTP", () => {
  const configuration = initialConfiguration();
  it("does not read owner settings before authorization", async () => {
    const read = vi.fn(async () => configuration);
    const response = await handleScannerSettings(request("GET"),{ owner: () => false,mutation: () => false,configuration: read,save: vi.fn() });
    expect(response.status).toBe(404); expect(read).not.toHaveBeenCalled();
  });
  it("requires mutation proof before owner checks and storage", async () => {
    const owner = vi.fn(() => true), save = vi.fn();
    const response = await handleScannerSettings(request("POST",{}),{ owner,mutation: () => false,configuration: async () => configuration,save });
    expect(response.status).toBe(404); expect(owner).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();
  });
  it("returns owner settings", async () => {
    const response = await handleScannerSettings(request("GET"),{ owner: () => true,mutation: () => false,
      configuration: async () => configuration,save: vi.fn() });
    expect(response.status).toBe(200); expect((await response.json()).configuration).toEqual(configuration);
  });
  it("saves independent customized main and focus counts", async () => {
    const customized = { ...configuration, gainers: { ...configuration.gainers,displayLimit: 31,
      focus: { ...configuration.gainers.focus,maximumStocks: 7 } } };
    const save = vi.fn(async () => customized);
    const response = await handleScannerSettings(request("POST",{ expectedRevision: 0,configuration: customized }),{
      owner: () => true,mutation: () => true,configuration: async () => configuration,save });
    expect(response.status).toBe(200); expect(save).toHaveBeenCalledWith(customized,0);
    expect((await response.json()).configuration.gainers.focus.maximumStocks).toBe(7);
  });
  it("rejects malformed and oversized settings without saving", async () => {
    const save = vi.fn();
    const dependencies = { owner: () => true,mutation: () => true,configuration: async () => configuration,save };
    expect((await handleScannerSettings(new Request("https://app.traderslink.pro/api/test",{ method: "POST",body: "{" }),dependencies)).status).toBe(400);
    expect((await handleScannerSettings(request("POST",{}, { "content-length": "40000" }),dependencies)).status).toBe(413);
    expect(save).not.toHaveBeenCalled();
  });
  it("reports revision conflicts without exposing errors", async () => {
    const response = await handleScannerSettings(request("POST",{ expectedRevision: 0,configuration }),{
      owner: () => true,mutation: () => true,configuration: async () => configuration,
      save: async () => { throw Error("scanner_settings_conflict"); } });
    expect(response.status).toBe(409); expect(await response.json()).toEqual({ code: "scanner_settings_conflict" });
  });
});

describe("scanner float HTTP",()=>{
  const floatFact={ shares:760_000,retrievedAtUtc:"2026-10-30T14:00:00.000Z" };
  it("does not read cached floats before owner authorization",async()=>{
    const read=vi.fn(async()=>({ tradingDate:"2026-10-30",floats:{} }));
    const response=await handleScannerFloatsGet(new Request("https://app.traderslink.pro/api/admin/screeners/floats?symbols=SLGB"),{ owner:()=>false,read });
    expect(response.status).toBe(404);expect(read).not.toHaveBeenCalled();
  });
  it("returns only the requested owner float facts",async()=>{
    const read=vi.fn(async()=>({ tradingDate:"2026-10-30",floats:{ SLGB:floatFact } }));
    const response=await handleScannerFloatsGet(new Request("https://app.traderslink.pro/api/admin/screeners/floats?symbols=SLGB,SLGB"),{ owner:()=>true,read });
    expect(response.status).toBe(200);expect(read).toHaveBeenCalledWith(["SLGB"]);
    expect(await response.json()).toEqual({ tradingDate:"2026-10-30",floats:{ SLGB:floatFact } });
  });
  it("rejects malformed symbols and suppresses private read failures",async()=>{
    const read=vi.fn(async()=>{throw Error("/private/scanner/floats.json");});
    expect((await handleScannerFloatsGet(new Request("https://app.traderslink.pro/api/admin/screeners/floats?symbols=bad"),{ owner:()=>true,read })).status).toBe(400);
    const response=await handleScannerFloatsGet(new Request("https://app.traderslink.pro/api/admin/screeners/floats?symbols=SLGB"),{ owner:()=>true,read });
    expect(response.status).toBe(503);expect(JSON.stringify(await response.json())).not.toContain("private");
  });
});
