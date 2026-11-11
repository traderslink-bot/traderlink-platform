// @vitest-environment node
import { appendFile,mkdtemp,readFile,stat,writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe,expect,it } from "vitest";
import Database from "better-sqlite3";
import type { LiveScannerRow, NormalizedSnapshot } from "../contracts";
import { initialConfiguration } from "../settings";
import { scannerConfigurationHash,scannerFilterFailures,scannerMomentumScore } from "./decision-trace";
import { SCANNER_AUDIT_SCHEMA_VERSION,type ScannerAuditCycle,type ScannerAuditDecision } from "./contracts";
import { ScannerAuditRecorder,ScannerAuditStore } from "./server/audit-store";

const NOW=Date.parse("2026-11-02T15:00:00Z"),configuration={...initialConfiguration(),enabled:true};
function snapshot(symbol="AAA"):NormalizedSnapshot{return {symbol,company:`Synthetic ${symbol}`,session:"regular",tradingDate:"2026-11-02",
  providerAt:NOW,receivedAt:NOW,price:1,baseline:0.9,volume:1_000_000,dollarVolume:2_000_000,bid:0.99,ask:1.01,
  marketCap:10_000_000,dayHigh:1.2,dayLow:0.8,providerVolumeRatio:4};}
function row():LiveScannerRow{return {symbol:"AAA",exchange:"NASDAQ",company:"Synthetic AAA",price:1,sessionGain:11.1,
  volume:1_000_000,dollarVolume:2_000_000,marketCap:10_000_000,marketCapAtCollection:10_000_000,float:500_000,
  relativeVolume:4,dayHigh:1.2,dayLow:0.8,offHighPercent:-16.67,floatRetrievedAtUtc:new Date(NOW).toISOString(),
  spreadPercent:2,providerAtUtc:new Date(NOW).toISOString(),receivedAtUtc:new Date(NOW).toISOString(),activity:{oneMinuteGain:3,
    fiveMinuteGain:6,oneMinuteVolume:100_000,oneMinuteDollarVolume:200_000,fiveMinuteVolume:300_000,fiveMinuteVolumeSpike:3,
    volumeAcceleration:4},reasons:[],news:[]};}
function decision(symbol="AAA"):ScannerAuditDecision{const value=row();return {symbol,exchange:"NASDAQ",marketCapAtCollection:10_000_000,observation:snapshot(symbol),
  activity:value.activity,float:value.float,floatRetrievedAtUtc:value.floatRetrievedAtUtc,sessionGain:value.sessionGain,
  spreadPercent:value.spreadPercent,offHighPercent:value.offHighPercent,relativeVolume:value.relativeVolume,gainerFailures:[],momentumFailures:[],
  gainerRank:1,momentumRank:1,gainerDisplayed:true,momentumDisplayed:true,
  momentumScore:scannerMomentumScore(value,configuration.momentum.focus,configuration.momentum.filters.regular)};}
function cycle(id="cycle-1",decisions:readonly ScannerAuditDecision[]=[decision()]):ScannerAuditCycle{return {schemaVersion:SCANNER_AUDIT_SCHEMA_VERSION,
  cycleId:id,runtimeInstanceId:"runtime-1",tradingDate:"2026-11-02",session:"regular",scheduledAt:NOW,completedAt:NOW,universeSourceDate:"2026-11-02",
  universeCount:decisions.length,universeHash:"b".repeat(64),configuration,configurationHash:"a".repeat(64),status:"ready",issues:[],missingSymbols:[],batches:[],decisions};}

describe("scanner audit evidence",()=>{
  it("records every failed gate and the exact score components",()=>{const value=row(),filters={...configuration.momentum.filters.regular,
    minimumPrice:2,minimumVolume:2_000_000,maximumSpreadPercent:1};
    expect(scannerFilterFailures(value,filters)).toEqual(["price_below_minimum","volume_below_minimum","spread_above_maximum"]);
    expect(scannerFilterFailures({...value,float:null},{...filters,maximumFloat:1})).toEqual(["price_below_minimum","volume_below_minimum","spread_above_maximum"]);
    const score=scannerMomentumScore(value,configuration.momentum.focus,configuration.momentum.filters.regular);
    expect(score.total).toBeCloseTo(score.price+score.volumeAcceleration+score.relativeVolume+score.dollarVolume+score.spread);
    expect(scannerConfigurationHash(configuration)).toHaveLength(64);
    expect(scannerConfigurationHash(configuration)).toBe(scannerConfigurationHash(JSON.parse(JSON.stringify(configuration))));
  });
  it("persists compressed evidence, health sizing and a restart-readable ticker timeline",async()=>{
    const root=await mkdtemp(join(tmpdir(),"scanner-audit-"));let store=await ScannerAuditStore.create(root);
    await store.record(cycle());store.close();store=await ScannerAuditStore.create(root);
    const health=store.health({queueDepth:0,droppedCycles:0,lastError:null});
    expect(health.cyclesToday).toBe(1);expect(health.observationsToday).toBe(1);expect(health.evidenceBytesToday).toBeGreaterThan(0);
    expect(health.projectedTwentyDayBytes).toBeGreaterThan(0);
    const page=await store.timeline("2026-11-02","AAA");expect(page.points).toHaveLength(1);expect(page.points[0].decision.momentumRank).toBe(1);store.close();
  });
  it("handles a production-sized synthetic cycle without losing decisions",async()=>{
    const root=await mkdtemp(join(tmpdir(),"scanner-audit-size-"));const store=await ScannerAuditStore.create(root);
    const decisions=Array.from({length:1251},(_,index)=>decision(`T${index}`));await store.record(cycle("sized",decisions));
    const health=store.health({queueDepth:0,droppedCycles:0,lastError:null});expect(health.observationsToday).toBe(1251);
    expect(health.bytesPerObservation).toBeGreaterThan(0);expect(health.bytesPerObservation).toBeLessThan(1500);store.close();
  });
  it("refuses corrupted evidence instead of returning an invented timeline",async()=>{
    const root=await mkdtemp(join(tmpdir(),"scanner-audit-corrupt-"));const store=await ScannerAuditStore.create(root);await store.record(cycle());
    const path=join(root,"2026-11-02","regular","15.jsonl.gz"),bytes=await readFile(path);bytes[8]^=0xff;await writeFile(path,bytes);
    await expect(store.timeline("2026-11-02","AAA")).rejects.toThrow("scanner_audit_evidence_corrupt");store.close();
  });
  it("keeps a queue-overflow coverage gap visible after restart",async()=>{
    const root=await mkdtemp(join(tmpdir(),"scanner-audit-gap-"));let store=await ScannerAuditStore.create(root);
    const recorder=new ScannerAuditRecorder(store,0);await recorder.setRecording(true);recorder.enqueue(cycle());expect(store.health({queueDepth:0,droppedCycles:0,lastError:null}).droppedCycles).toBe(1);
    store.close();store=await ScannerAuditStore.create(root);expect(store.health({queueDepth:0,droppedCycles:0,lastError:null}).state).toBe("degraded");store.close();
  });
  it("defaults recording off, persists the setting, and deletes only audit history",async()=>{
    const root=await mkdtemp(join(tmpdir(),"scanner-audit-controls-"));
    await writeFile(join(root,"keep.txt"),"keep");
    let store=await ScannerAuditStore.create(root);
    await store.record(cycle("existing"));
    let recorder=new ScannerAuditRecorder(store);
    expect(recorder.recordingState().enabled).toBe(false);
    recorder.enqueue(cycle("disabled"));
    expect((await recorder.timeline("2026-11-02","AAA")).points).toHaveLength(1);
    await recorder.setRecording(true);
    store.close();
    store=await ScannerAuditStore.create(root);
    recorder=new ScannerAuditRecorder(store);
    expect(recorder.recordingState().enabled).toBe(true);
    await recorder.setRecording(false);
    await recorder.deleteHistory();
    expect(recorder.recordingState().enabled).toBe(false);
    expect((await recorder.timeline("2026-11-02","AAA")).points).toHaveLength(0);
    await expect(stat(join(root,"2026-11-02"))).rejects.toMatchObject({code:"ENOENT"});
    expect(await readFile(join(root,"keep.txt"),"utf8")).toBe("keep");
    store.close();
  });
  it("is idempotent for a repeated cycle and reports an unindexed evidence tail after restart",async()=>{
    const root=await mkdtemp(join(tmpdir(),"scanner-audit-recovery-"));let store=await ScannerAuditStore.create(root);const value=cycle();
    await store.record(value);const path=join(root,"2026-11-02","regular","15.jsonl.gz"),before=(await stat(path)).size;
    await store.record(value);expect((await stat(path)).size).toBe(before);store.close();await appendFile(path,Buffer.from("orphan"));
    store=await ScannerAuditStore.create(root);expect(store.health({queueDepth:0,droppedCycles:0,lastError:null}).state).toBe("degraded");store.close();
  });
  it("retains nonqualifying state so a ticker re-entry is recorded",async()=>{
    const root=await mkdtemp(join(tmpdir(),"scanner-audit-reentry-"));const store=await ScannerAuditStore.create(root);
    const out={...decision(),gainerRank:null,momentumRank:null,gainerDisplayed:false,momentumDisplayed:false};
    await store.record(cycle("enter"));await store.record({...cycle("leave",[out]),completedAt:NOW+5_000});
    await store.record({...cycle("reenter"),completedAt:NOW+10_000});store.close();
    const db=new Database(join(root,"audit-control.sqlite"),{readonly:true});
    const codes=(db.prepare(`SELECT event_code FROM scanner_audit_candidate_events ORDER BY at_utc,event_code`).all() as {event_code:string}[]).map(value=>value.event_code);
    expect(codes).toContain("momentum_left");expect(codes.filter(value=>value==="momentum_entered")).toHaveLength(1);db.close();
  });
  it("marks health missing when an active scanner stops producing audit cycles",async()=>{
    const root=await mkdtemp(join(tmpdir(),"scanner-audit-stale-"));const store=await ScannerAuditStore.create(root);await store.record(cycle());
    const health=store.health({queueDepth:0,droppedCycles:0,lastError:null,expectedActive:true,now:NOW+20_001});
    expect(health.state).toBe("missing");expect(health.lastError).toBe("audit_cycle_stale");store.close();
  });
  it("summarizes daily decisions and pages the latest rejection state without overlap",async()=>{
    const root=await mkdtemp(join(tmpdir(),"scanner-audit-review-"));const store=await ScannerAuditStore.create(root);
    const rejected=Array.from({length:120},(_,index)=>({...decision(`R${String(index).padStart(3,"0")}`),gainerFailures:["price_below_minimum"],
      momentumFailures:["recent_price_move_below_minimum"],gainerRank:null,momentumRank:null,gainerDisplayed:false,momentumDisplayed:false}));
    await store.record(cycle("review",rejected));const review=store.dailyReview("2026-11-02");
    expect(review.sessions).toMatchObject([{session:"regular",cycles:1,observations:120,gainerQualified:0,momentumQualified:0}]);
    expect(review.rejectionReasons).toContainEqual({scanner:"momentum",reason:"recent_price_move_below_minimum",count:120});
    const first=await store.rejections("2026-11-02",{scanner:"momentum",limit:50});expect(first.rows).toHaveLength(50);expect(first.nextCursor).toBe("review:R049");
    await store.record({...cycle("newer",rejected.slice(0,10)),completedAt:NOW+5_000});
    const second=await store.rejections("2026-11-02",{scanner:"momentum",limit:50,cursor:first.nextCursor??undefined});expect(second.rows).toHaveLength(50);
    expect(second.rows.every(value=>value.cycleId==="review")).toBe(true);
    expect(new Set([...first.rows,...second.rows].map(value=>value.decision.symbol)).size).toBe(100);store.close();
  });
  it("recalculates a stored decision score from its recorded inputs",async()=>{
    const root=await mkdtemp(join(tmpdir(),"scanner-audit-recalculate-"));const store=await ScannerAuditStore.create(root);await store.record(cycle());
    const point=(await store.timeline("2026-11-02","AAA")).points[0],expected=scannerMomentumScore(row(),configuration.momentum.focus,configuration.momentum.filters.regular);
    expect(point.decision.momentumScore).toEqual(expected);expect(point.decision.gainerFailures).toEqual(scannerFilterFailures(row(),configuration.gainers.filters.regular));store.close();
  });
});
