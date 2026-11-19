// @vitest-environment node
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {NextRequest} from "next/server";

// Only the origin guard runs here; unrelated authorization/database ports stay unopened.
vi.mock("../community-request-access",()=>({requireCommunityRequestAccess:vi.fn()}));
vi.mock("../community-channel-readership",()=>({readCommunityViewerChannels:vi.fn()}));
vi.mock("../traderlink-community-repository",()=>({TraderLinkCommunityRepository:vi.fn()}));
vi.mock("./community-stats-repository",()=>({communityStatsStorageReady:vi.fn()}));

import {assertStatsSameOrigin} from "./community-stats-access";

const publicOrigin="https://app.traderslink.pro";
function request(origin:string|null=publicOrigin,site="same-origin",extra:Record<string,string>={}){
  const headers=new Headers({host:"app.traderslink.pro","sec-fetch-site":site,...extra});
  if(origin!==null)headers.set("origin",origin);
  return new NextRequest("http://0.0.0.0:8080/api/communities/traderslink-tests/stats",{method:"POST",headers});
}
beforeEach(()=>{
  vi.stubEnv("NODE_ENV","production");
  vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN",undefined);
  vi.stubEnv("DISCORD_REDIRECT_URI",`${publicOrigin}/api/auth/discord/callback`);
});
afterEach(()=>vi.unstubAllEnvs());

describe("Stats mutation origin behind the production proxy",()=>{
  it("accepts the configured OAuth public origin when Railway supplies an internal request URL",()=>{
    expect(()=>assertStatsSameOrigin(request())).not.toThrow();
  });
  it("uses the explicit trusted public origin when configured",()=>{
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN",publicOrigin);
    vi.stubEnv("DISCORD_REDIRECT_URI",undefined);
    expect(()=>assertStatsSameOrigin(request())).not.toThrow();
    expect(()=>assertStatsSameOrigin(request("https://other.example"))).toThrow();
  });
  it("rejects missing Origin and cross-site requests even when the origin matches",()=>{
    expect(()=>assertStatsSameOrigin(request(null))).toThrow();
    expect(()=>assertStatsSameOrigin(request(publicOrigin,"cross-site"))).toThrow();
  });
  it("does not trust forged request or forwarded hosts as the public origin",()=>{
    expect(()=>assertStatsSameOrigin(request("https://attacker.example","same-origin",{
      host:"attacker.example","x-forwarded-host":"attacker.example","x-forwarded-proto":"https",
    }))).toThrow();
  });
  it("fails closed without either trusted production origin configuration",()=>{
    vi.stubEnv("DISCORD_REDIRECT_URI",undefined);
    expect(()=>assertStatsSameOrigin(request())).toThrow();
  });
  it.each([
    "http://app.traderslink.pro/api/auth/discord/callback",
    "https://app.traderslink.pro/other",
    "https://user@app.traderslink.pro/api/auth/discord/callback",
    "https://app.traderslink.pro/api/auth/discord/callback?other=1",
  ])("rejects an unsafe callback configuration: %s",callback=>{
    vi.stubEnv("DISCORD_REDIRECT_URI",callback);
    expect(()=>assertStatsSameOrigin(request())).toThrow();
  });
  it("rejects unsafe explicit production origin configuration",()=>{
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN","http://localhost:8080");
    expect(()=>assertStatsSameOrigin(request())).toThrow();
  });
  it("preserves explicitly configured development loopback access",()=>{
    vi.stubEnv("NODE_ENV","development");
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN","http://127.0.0.1:3032");
    expect(()=>assertStatsSameOrigin(new Request("http://localhost:3032/api/stats",{
      method:"POST",headers:{origin:"http://127.0.0.1:3032","sec-fetch-site":"same-origin"},
    }))).not.toThrow();
  });
  it("does not consume or change the original settings request body",async()=>{
    const body=JSON.stringify({discordEnabled:true,expectedRevision:0});
    const original=new Request("http://localhost:8080/api/stats",{
      method:"POST",headers:{origin:publicOrigin,"sec-fetch-site":"same-origin"},body,
    });
    assertStatsSameOrigin(original);
    expect(original.bodyUsed).toBe(false);
    expect(await original.text()).toBe(body);
  });
});
