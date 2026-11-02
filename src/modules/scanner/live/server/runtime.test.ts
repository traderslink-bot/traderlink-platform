// @vitest-environment node
import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(()=>({ feeds:0,starts:0,audits:0,providers:0,failStart:false }));
vi.mock("../../../platform/server/database/platform-database-config",()=>({
  resolvePlatformDatabaseConfig:({environment}:{environment:NodeJS.ProcessEnv})=>({databasePath:environment.TRADERLINK_PLATFORM_DB_PATH}),
}));
vi.mock("./live-feed",()=>({
  LiveScannerFeed:class {
    status="disabled";
    constructor(){calls.feeds++;}
    read(){return{status:this.status};}
  },
  startLiveScannerFeed:(feed:{status:string})=>{
    calls.starts++;
    if(calls.failStart)throw Error("isolated startup failure");
    feed.status="ready";
  },
}));
vi.mock("../audit/server/audit-store",()=>({
  ScannerAuditStore:class {constructor(){calls.audits++;}},
  ScannerAuditRecorder:class {health(){return{state:"complete"};}},
}));
vi.mock("./settings-store",()=>({ScannerSettingsStore:class {
  floatCache(){return{read:async()=>null,write:async()=>{}};}
}}));
vi.mock("./universe-store",()=>({UniverseStore:class {}}));
vi.mock("../../../watchlist/server/moomoo-watchlist-candle-bridge",()=>({
  withWatchlistIndicatorMoomooAccess:()=>{calls.providers++;throw Error("No provider effects authorized in unit tests");},
}));

function environment():NodeJS.ProcessEnv{return{
  TRADERLINK_PLATFORM_DB_PATH:`/tmp/scanner-runtime-unit-${randomUUID()}/platform.sqlite`,
  TRADERLINK_LIVE_SCREENERS_ENABLED:"true",TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED:"true",
};}

describe("scanner runtime across independently loaded Next bundles",()=>{
  it("returns the worker's running feed to a reloaded API module without a second worker or audit writer",async()=>{
    const env=environment(),before={...calls};
    const worker=await import("./runtime");
    worker.startConfiguredLiveScannerRuntime(env);
    const settings=worker.scannerSettingsStore(env),audit=worker.scannerAuditRecorder(env);
    vi.resetModules();
    const api=await import("./runtime");
    expect(api.readLiveScannerRuntime(env).status).toBe("ready");
    expect(api.scannerSettingsStore(env)).toBe(settings);
    expect(api.scannerAuditRecorder(env)).toBe(audit);
    api.startConfiguredLiveScannerRuntime(env);
    expect(calls.feeds-before.feeds).toBe(1);
    expect(calls.starts-before.starts).toBe(1);
    expect(calls.audits-before.audits).toBe(1);
    expect(calls.providers-before.providers).toBe(0);
  });
  it("also shares the feed when an API read happens before worker startup",async()=>{
    const env=environment(),api=await import("./runtime"),before={...calls};
    expect(api.readLiveScannerRuntime(env).status).toBe("disabled");
    vi.resetModules();
    const worker=await import("./runtime");
    worker.startConfiguredLiveScannerRuntime(env);
    expect(api.readLiveScannerRuntime(env).status).toBe("ready");
    expect(calls.feeds-before.feeds).toBe(1);
    expect(calls.starts-before.starts).toBe(1);
  });
  it("does not mix isolated database roots or start anything when feature flags are off",async()=>{
    const runtime=await import("./runtime"),a=environment(),b=environment(),before={...calls};
    runtime.startConfiguredLiveScannerRuntime({...a,TRADERLINK_LIVE_SCREENERS_ENABLED:"false"});
    expect(calls.feeds).toBe(before.feeds);
    expect(calls.starts).toBe(before.starts);
    runtime.startConfiguredLiveScannerRuntime(a);
    expect(runtime.readLiveScannerRuntime(b).status).toBe("disabled");
    expect(runtime.readLiveScannerRuntime(a).status).toBe("ready");
  });
  it("allows a genuine startup exception to be retried, without keeping a false started marker",async()=>{
    const runtime=await import("./runtime"),env=environment(),before=calls.starts;
    calls.failStart=true;
    try{expect(()=>runtime.startConfiguredLiveScannerRuntime(env)).toThrow("isolated startup failure");}
    finally{calls.failStart=false;}
    runtime.startConfiguredLiveScannerRuntime(env);
    expect(runtime.readLiveScannerRuntime(env).status).toBe("ready");
    expect(calls.starts-before).toBe(2);
  });
  it("shares the Moomoo request queue across bundles and separates isolated ledgers",async()=>{
    const env=environment();
    const worker=await import("../../../platform/server/broker-connections/moomoo-shared-transport");
    const original=worker.getMoomooSharedTransport(env);
    vi.resetModules();
    const api=await import("../../../platform/server/broker-connections/moomoo-shared-transport");
    expect(api.getMoomooSharedTransport(env)).toBe(original);
    expect(api.getMoomooSharedTransport(environment())).not.toBe(original);
    expect(calls.providers).toBe(0);
  });
});
