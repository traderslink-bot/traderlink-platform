// @vitest-environment node
import { EventEmitter } from "node:events";
import type { ServerResponse } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LivePriceHub, type LivePriceFrame } from "./live-price-hub";
function response(){ const emitter=new EventEmitter();return Object.assign(emitter,{writeHead:vi.fn(),write:vi.fn(),end:vi.fn(),destroy:vi.fn(),destroyed:false,writableLength:0}); }
function frames(value:ReturnType<typeof response>):LivePriceFrame[]{return value.write.mock.calls.flatMap(([message])=>String(message).startsWith("event: prices")?[JSON.parse(String(message).split("data: ")[1])]:[]);}
afterEach(()=>vi.useRealTimers());
describe("shared SIP price protocol",()=>{
 it("keeps independent leases, source timestamps, ordering and no-trade heartbeat",async()=>{
  vi.useFakeTimers();vi.setSystemTime(Date.parse("2026-11-09T15:30:00Z"));
  const changed=vi.fn(),hub=new LivePriceHub(changed,async()=>{}),first=response(),second=response();
  try{
   hub.add(["AAA"],first as unknown as ServerResponse);hub.add(["AAA","BBB"],second as unknown as ServerResponse);hub.state(true);
   hub.observe("AAA",{p:2,t:"2026-11-09T15:30:00.123456789Z",c:["@"],z:"C"});
   hub.observe("AAA",{p:1,t:"2026-11-09T15:30:00.123456788Z",c:["@"],z:"C"});
   hub.observe("AAA",{p:100,t:"2026-11-09T15:30:01Z",c:["I"],z:"C"});
   await vi.advanceTimersByTimeAsync(250);
   const latest=frames(first).at(-1)!;
   expect(latest.prices.AAA).toEqual({price:2,providerObservedAt:"2026-11-09T15:30:00.123456789Z",receiptAt:Date.parse("2026-11-09T15:30:00Z")});expect(latest.emittedAt-latest.prices.AAA.receiptAt).toBeGreaterThanOrEqual(0);expect(latest.emittedAt-latest.prices.AAA.receiptAt).toBeLessThanOrEqual(250);
   first.emit("close");expect(hub.symbols()).toEqual(["AAA","BBB"]);
   await vi.advanceTimersByTimeAsync(5000);expect(frames(second).at(-1)).toMatchObject({kind:"status",connected:true,prices:{}});
   hub.state(false);expect(frames(second).at(-1)).toMatchObject({connected:false,prices:{}});
   hub.state(true);expect(frames(second).at(-1)!.prices).toEqual({});
   second.emit("close");expect(hub.symbols()).toEqual([]);expect(changed).toHaveBeenCalledTimes(4);
  }finally{hub.close();}
 });
 it("disconnects slow consumers without holding another consumer",async()=>{
  vi.useFakeTimers();const hub=new LivePriceHub(()=>{},async()=>{}),slow=response(),fast=response();
  try{hub.add(["AAA"],slow as unknown as ServerResponse);hub.add(["AAA"],fast as unknown as ServerResponse);slow.writableLength=2_000_001;hub.state(true);expect(slow.destroy).toHaveBeenCalled();expect(frames(fast).at(-1)?.connected).toBe(true);}finally{hub.close();}
 });
});

it("preserves the actual session-boundary trade time and stays healthy through a zero-trade halt",async()=>{
 vi.useFakeTimers();vi.setSystemTime(Date.parse("2026-11-09T14:30:00Z"));
 const hub=new LivePriceHub(()=>{},async()=>{}),client=response();
 try{
  hub.add(["AAA"],client as unknown as ServerResponse);hub.state(true);
  hub.observe("AAA",{p:1,t:"2026-11-09T14:29:59.999999999Z",c:["@"],z:"C"});
  await vi.advanceTimersByTimeAsync(250);
  expect(frames(client).at(-1)!.prices.AAA.providerObservedAt).toBe("2026-11-09T14:29:59.999999999Z");
  hub.observe("AAA",{p:2,t:"2026-11-09T14:30:00.100000001Z",c:["@"],z:"C"});
  await vi.advanceTimersByTimeAsync(250);
  expect(frames(client).at(-1)!.prices.AAA).toMatchObject({price:2,providerObservedAt:"2026-11-09T14:30:00.100000001Z"});
  await vi.advanceTimersByTimeAsync(15000);
  const status=frames(client).at(-1)!;expect(status).toMatchObject({connected:true,kind:"status",prices:{}});
 }finally{hub.close();}
});
