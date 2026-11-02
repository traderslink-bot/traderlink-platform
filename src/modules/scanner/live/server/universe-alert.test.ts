// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendScannerUniverseAlert } from "./universe-alert";

afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
describe("scanner universe alerts",()=>{
  it.each([undefined,"false"])("keeps every scanner delivery disabled when control is %s",async enabled=>{
    vi.useFakeTimers();vi.setSystemTime(new Date("2026-11-05T15:00:00Z"));
    const fetch=vi.fn();vi.stubGlobal("fetch",fetch);
    const environment={NODE_ENV:"test",TRADERLINK_SCANNER_DELIVERY_ENABLED:enabled,WATCHLIST_OWNER_REVIEW_DISCORD_WEBHOOK_URL:"https://discord.com/api/webhooks/123/synthetic_token"} satisfies NodeJS.ProcessEnv;
    await sendScannerUniverseAlert({kind:"missing",tradingDate:"2026-11-05",sourceDate:null,count:0,environment});
    await sendScannerUniverseAlert({kind:"recovered",tradingDate:"2026-11-05",sourceDate:"2026-11-05",count:1251,environment});
    expect(fetch).not.toHaveBeenCalled();
  });
  it("waits until 3:15 AM ET and sends one missing alert",async()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date("2026-11-02T08:14:00Z"));
    const fetch=vi.fn<(input:RequestInfo|URL,init?:RequestInit)=>Promise<Response>>(async()=>new Response("{}",{status:200}));vi.stubGlobal("fetch",fetch);
    const environment={NODE_ENV:"test",TRADERLINK_SCANNER_DELIVERY_ENABLED:"true",WATCHLIST_OWNER_REVIEW_DISCORD_WEBHOOK_URL:"https://discord.com/api/webhooks/123/synthetic_token"} satisfies NodeJS.ProcessEnv;
    const input={kind:"missing" as const,tradingDate:"2026-11-02",sourceDate:"2026-10-30",count:1251,environment};
    await sendScannerUniverseAlert(input);expect(fetch).not.toHaveBeenCalled();
    vi.setSystemTime(new Date("2026-11-02T08:15:00Z"));await sendScannerUniverseAlert(input);await sendScannerUniverseAlert(input);
    expect(fetch).toHaveBeenCalledTimes(1);expect(String(fetch.mock.calls[0]?.[1]?.body)).toContain("continuing with the 2026-10-30 list");
  });
  it("sends recovery only after this process delivered a missing alert",async()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date("2026-11-03T08:15:00Z"));
    const fetch=vi.fn<(input:RequestInfo|URL,init?:RequestInit)=>Promise<Response>>(async()=>new Response("{}",{status:200}));vi.stubGlobal("fetch",fetch);
    const environment={NODE_ENV:"test",TRADERLINK_SCANNER_DELIVERY_ENABLED:"true",WATCHLIST_OWNER_REVIEW_DISCORD_WEBHOOK_URL:"https://discord.com/api/webhooks/123/synthetic_token"} satisfies NodeJS.ProcessEnv;
    await sendScannerUniverseAlert({kind:"recovered",tradingDate:"2026-11-03",sourceDate:"2026-11-03",count:1200,environment});
    expect(fetch).not.toHaveBeenCalled();
    await sendScannerUniverseAlert({kind:"missing",tradingDate:"2026-11-03",sourceDate:"2026-11-02",count:1190,environment});
    await sendScannerUniverseAlert({kind:"recovered",tradingDate:"2026-11-03",sourceDate:"2026-11-03",count:1200,environment});
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("alerts when the first-ever universe upload is missing",async()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date("2026-11-04T08:15:00Z"));
    const fetch=vi.fn<(input:RequestInfo|URL,init?:RequestInit)=>Promise<Response>>(async()=>new Response("{}",{status:200}));vi.stubGlobal("fetch",fetch);
    await sendScannerUniverseAlert({kind:"missing",tradingDate:"2026-11-04",sourceDate:null,count:0,
      environment:{NODE_ENV:"test",TRADERLINK_SCANNER_DELIVERY_ENABLED:"true",WATCHLIST_OWNER_REVIEW_DISCORD_WEBHOOK_URL:"https://discord.com/api/webhooks/123/synthetic_token"}});
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0]?.[1]?.body)).toContain("No earlier stock list is available yet");
  });
});
