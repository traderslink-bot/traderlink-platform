// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/internal/stock-screeners-live/route";
import { type TraderLinkPlatformRequestIdentity } from "../platform/server/authentication/require-platform-request-scope";
import { DEFAULT_DEFINITION, type Candidate, type MarketPack, type MarketSession, type Snapshot } from "./contracts";
import type { LiveScreenerFrame } from "./live-screener-book";
import { LiveScreenerPublisher } from "./live-screener-publisher";
import { createRun, getRun } from "./service";

const start = Date.parse("2026-11-17T14:30:00Z");
const now = start + 20_000;
const window = { start, end: start + 390 * 60_000, session: "regular" as const };
const token = "stage-fixture-private-publisher-token";
const identity = { mode:"platform_session", scope:{ userId:"stage-live-validation" } } as TraderLinkPlatformRequestIdentity;
const baseRow: Candidate = { symbol:"ABC", exchange:"NYSE", priceAt:start+1_000,
  values:{ price:10, change:25, high:11, low:7, cap:50_000_000, volume:25000, sessionVwap:8,
    vwapPosition:1, vwapDistance:25, vwapCross:1 } };
const ingress = (body?: unknown, key = token) => POST(new Request("https://staging.example/api/internal/stock-screeners-live", {
  method:"POST", headers:{ Authorization:"Bearer " + key, "Content-Type":"application/json" }, body: JSON.stringify(body),
}));
const first: LiveScreenerFrame = { ...window, generation:now-100, sequence:1, sentAt:now, reset:true,
  rows:[{ symbol:"ABC",price:12,priceAt:now-1_000,vwap:9 }] };

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

it("delivers live deltas to the ordinary run, keeps completed fields, and falls back after the worker stops", async () => {
  const root = mkdtempSync(join(tmpdir(), "screeners-live-ingress-"));
  const dir = join(root, "stock-screeners-v1");
  vi.useFakeTimers({ toFake:["Date"] });
  vi.setSystemTime(now);
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH",join(root,"staging-fixture.sqlite"));
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN",token);
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER","1");
  const snapshots = Object.fromEntries((["regular","premarket","after_hours","last_regular"] as const).map(session => [
    session, { version:2, date:"2026-11-17", universeDate:"2026-11-17", capturedAt:now, asOf:start+1_000, session,
      closed:session!=="regular", source:"Alpaca SIP", partial:false, rows:[baseRow] } satisfies Snapshot,
  ])) as Record<MarketSession,Snapshot>;
  try {
    mkdirSync(dir);
    writeFileSync(join(dir,"market.json"),JSON.stringify({latest:"regular",snapshots} satisfies MarketPack));
    expect((await ingress(first,"wrong")).status).toBe(404);
    expect((await ingress({...first, rows:[first.rows[0],first.rows[0]]})).status).toBe(400);
    expect((await ingress({...first, reset:false})).status).toBe(409);
    expect((await ingress(first)).status).toBe(204);

    const run = await createRun(identity,DEFAULT_DEFINITION);
    expect(run.rows[0].values).toMatchObject({ price:12,change:50,high:12,low:7,fromHigh:0,
      cap:50_000_000,volume:25000,sessionVwap:9,vwapPosition:1,vwapCross:1 });
    expect(run.rows[0].priceAt).toBe(now-1_000);
    expect((await ingress({...first,reset:false,sequence:3})).status).toBe(409);

    expect((await ingress({...first,reset:false,sequence:2,rows:[{symbol:"ABC",price:null,priceAt:null,vwap:null}]})).status).toBe(204);
    const cleared = await createRun(identity,DEFAULT_DEFINITION);
    expect(cleared.rows[0].values.sessionVwap).toBeUndefined();
    expect(cleared.rows[0].values.price).toBe(10);
    expect(cleared.rows[0].values.vwapCross).toBe(1);
    expect(getRun(identity,run.id,1,DEFAULT_DEFINITION.sort).rows[0].values.price).toBe(12);
    expect((await createRun(identity,{...DEFAULT_DEFINITION,session:"last_regular"})).rows[0].values.price).toBe(10);

    vi.setSystemTime(now+4_001);
    expect((await createRun(identity,DEFAULT_DEFINITION)).rows[0].values.sessionVwap).toBe(8);
    vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER","0");
    expect((await ingress(first)).status).toBe(404);
    expect((await createRun(identity,DEFAULT_DEFINITION)).rows[0].values.price).toBe(10);
  } finally {
    rmSync(root,{recursive:true,force:true});
  }
});

it("resends the latest full book after an ambiguous timeout or a Railway restart", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const frames: LiveScreenerFrame[]=[];
  const transport = vi.fn(async (_url, options: RequestInit) => {
    frames.push(JSON.parse(options.body as string));
    if (frames.length === 2) throw Error("connection_lost");
    if (frames.length === 4) return new Response(null,{status:409});
    return new Response(null,{status:204});
  }) as typeof fetch;
  const client = new LiveScreenerPublisher({ origin:"https://staging.example", token, window, signal:new AbortController().signal }, transport);
  try {
    client.start();
    client.offer(first.rows);
    await client.flush();
    client.offer([{symbol:"ABC",price:13,priceAt:now,vwap:10}]);
    await client.flush();
    await client.flush();
    expect(frames.map(({reset,sequence})=>[reset,sequence])).toEqual([[true,1],[false,2],[true,3]]);
    expect(frames[2].rows[0].price).toBe(13);
    client.offer([{symbol:"ABC",price:14,priceAt:now,vwap:10}]);
    await client.flush();
    await client.flush();
    expect(frames.map(({reset,sequence})=>[reset,sequence])).toEqual([[true,1],[false,2],[true,3],[false,4],[true,4]]);
    expect(frames[4].rows[0].price).toBe(14);
  } finally {
    client.clear();
  }
});
