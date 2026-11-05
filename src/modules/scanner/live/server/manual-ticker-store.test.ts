import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe,expect,it } from "vitest";
import { ManualTickerStore } from "./manual-ticker-store";

describe("manual scanner ticker store",()=>{
  it("persists normalized symbols and removes them independently of the imported universe",async()=>{const directory=await mkdtemp(join(tmpdir(),"manual-scanner-")),store=new ManualTickerStore(join(directory,"tickers.json"));
    expect(await store.list()).toEqual([]);expect(await store.add(" aapl ","NASDAQ",Date.parse("2026-11-05T15:00:00Z"))).toEqual([{symbol:"AAPL",exchange:"NASDAQ",addedAtUtc:"2026-11-05T15:00:00.000Z"}]);
    expect(await store.add("AAPL","NASDAQ")).toHaveLength(1);expect(await store.remove("AAPL")).toEqual([]);
  });
  it("rejects malformed symbols",async()=>{const directory=await mkdtemp(join(tmpdir(),"manual-scanner-")),store=new ManualTickerStore(join(directory,"tickers.json"));await expect(store.add("bad ticker","NASDAQ")).rejects.toThrow("scanner_manual_ticker_invalid");});
});
