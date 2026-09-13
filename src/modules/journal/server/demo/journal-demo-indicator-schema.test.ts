import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import Database from "better-sqlite3";
import { test } from "vitest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";
import { JournalDemoMaterializer } from "./journal-demo-materializer";
import { resolveCurrentJournalDemoFinancialPack } from "./journal-demo-pack-contract";
import { refreshJournalDemoTradeIndicators } from "./journal-demo-indicator-refresh";
import { DailyTradeAnalyzerRepository } from "@/src/modules/level-analysis/server/daily-trade-analyzer-repository";
import { LogicalTradeAnalyzerRepository } from "@/src/modules/level-analysis/server/logical-trade-analyzer-repository";
import { newYorkExtendedSession } from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";
import { JournalLogicalTradeRepository } from "../logical-trades/journal-logical-trade-repository";

test("real schema persists Demo indicators without changing executions or repeating revisions",()=>{
  // Entirely disposable in-memory schema. Synthetic prior bars below test
  // persistence only; they are not market-data or numerical acceptance evidence.
  const db=new Database(":memory:");db.pragma("foreign_keys = ON");
  const userId="10000000-0000-4000-8000-000000000001";
  const workspaceId="10000000-0000-4000-8000-000000000002";
  const now=new Date("2026-09-13T12:00:00.000Z");
  try{
    runPlatformMigrations(db,{now:()=>now});
    new PlatformUserRepository(db,{allowedAuthProviders:["development_local"]}).createUser({userId,authProvider:"development_local",authSubject:"demo_schema_test",displayName:"Test",createdAtUtc:now.toISOString(),updatedAtUtc:now.toISOString()});
    new PlatformWorkspaceRepository(db).createWorkspaceWithOwner({workspaceId,ownerUserId:userId,displayName:"Test",defaultTradingTimezone:"America/New_York",createdAtUtc:now.toISOString()});
    // Immutable bundled base pack needs no external/database-only candle files.
    const result=new JournalDemoMaterializer(db,{now:()=>now,resolvePack:()=>resolveCurrentJournalDemoFinancialPack()}).materializeForWorkspace({baseCurrency:"USD",createdForUserId:userId,tradingTimezone:"America/New_York",workspaceId});
    assert.equal(result.state,"materialized");assert.ok(result.accountId);
    const scope={userId,workspaceId,accountId:result.accountId,workspaceRole:"owner" as const};
    const candidate=db.prepare<[],{round_trip_id:string}>("SELECT round_trip_id FROM journal_round_trip_daily_trade_analyses ORDER BY round_trip_id LIMIT 1").get()!;
    const original=JSON.stringify(db.prepare("SELECT * FROM journal_execution_versions ORDER BY execution_version_id").all());
    const run=()=>refreshJournalDemoTradeIndicators(db,{scope,roundTripId:candidate.round_trip_id,now});
    assert.equal(run().status,"refreshed");
    const partial=new LogicalTradeAnalyzerRepository(db).readCurrentByRoundTrip(scope,candidate.round_trip_id);
    assert.equal(partial?.analyzed?.trendMomentum?.historyOutcome,"history_unavailable");
    assert.ok(partial?.analyzed?.trendMomentum?.executions.some(event=>event.oneMinute?.ema20!==null&&event.oneMinute?.ema20!==undefined));
    assert.equal(run().status,"unchanged");
    const legacy=new DailyTradeAnalyzerRepository(db);
    const target=legacy.findEligibleTarget(scope,candidate.round_trip_id)!;assert.ok(target);
    const previousDate=new Date(Date.parse(target.tradingDateNewYork+"T12:00:00Z")-86400000).toISOString().slice(0,10);
    const session=newYorkExtendedSession(previousDate)!;
    const bars=Array.from({length:960},(_,i)=>({time:session.startTime+(i+1)*60,openDecimal:"2",highDecimal:"2.1",lowDecimal:"1.9",closeDecimal:"2",volumeDecimal:"100",turnoverDecimal:"200"}));
    legacy.materializeVerifiedSession({candles:bars,completedAtUtc:now.toISOString(),coverageEndUtc:new Date(session.endTime*1000).toISOString(),provider:{key:"moomoo_history_kline",adapterVersion:"moomoo_history_kline_v1"},providerExchangeTimezone:"America/New_York",providerUtcOffsetSeconds:-14400,requestedStartUtc:new Date(session.startTime*1000).toISOString(),requestedEndUtc:new Date(session.endTime*1000).toISOString(),sha256:createHash("sha256").update(JSON.stringify(bars)).digest("hex"),target:{...target,tradingDateNewYork:previousDate}});
    assert.equal(run().status,"refreshed");
    const saved=new LogicalTradeAnalyzerRepository(db).readCurrentByRoundTrip(scope,candidate.round_trip_id);
    assert.equal(saved?.status,"ready");assert.equal(saved?.analyzed?.trendMomentum?.calculationVersion,"trade_indicator_context_v3");
    const versions=db.prepare("SELECT count(*) AS n FROM journal_logical_trade_daily_analysis_versions").get();
    assert.equal(run().status,"unchanged");
    assert.deepEqual(db.prepare("SELECT count(*) AS n FROM journal_logical_trade_daily_analysis_versions").get(),versions);
    // Exercise an actual two-round-trip user-defined group through the same
    // storage contracts, not mocked target events or persistence methods.
    const other=db.prepare<[],{round_trip_id:string}>("SELECT round_trip_id FROM journal_round_trip_daily_trade_analyses ORDER BY round_trip_id").all()
      .filter(row=>row.round_trip_id!==candidate.round_trip_id)
      .map(row=>legacy.findEligibleTarget(scope,row.round_trip_id))
      .find(row=>row?.providerSymbol===target.providerSymbol&&row.tradingDateNewYork===target.tradingDateNewYork);
    assert.ok(other);
    const logical=new JournalLogicalTradeRepository(db);
    const first=logical.findByRoundTripId(scope,candidate.round_trip_id)!;
    const second=logical.findByRoundTripId(scope,other.roundTripId)!;
    assert.ok(first.logicalTradeId);assert.ok(second);
    const members=[...first.members,...second.members].sort((a,b)=>a.openedAtUtc.localeCompare(b.openedAtUtc));
    db.transaction(()=>{
      logical.removeActiveMemberships(scope,[first.logicalTradeId!]);
      logical.createVersion({scope,logicalTradeId:first.logicalTradeId!,priorRevision:first.revision,
        members,tradeStyle:"day",changeKind:"merged",timestamp:now.toISOString()});
    }).immediate();
    const membershipBefore=JSON.stringify(logical.findByRoundTripId(scope,candidate.round_trip_id)!.members);
    assert.equal(run().status,"refreshed");
    const combined=new LogicalTradeAnalyzerRepository(db).readCurrentByRoundTrip(scope,candidate.round_trip_id)!;
    assert.equal(combined.analyzed?.trendMomentum?.executions.length,target.events.length+other.events.length);
    assert.equal(new LogicalTradeAnalyzerRepository(db).readCurrentByRoundTrip(scope,other.roundTripId)?.analysisVersionId,combined.analysisVersionId);
    assert.equal(JSON.stringify(logical.findByRoundTripId(scope,candidate.round_trip_id)!.members),membershipBefore);
    assert.equal(run().status,"unchanged");
    assert.equal(JSON.stringify(db.prepare("SELECT * FROM journal_execution_versions ORDER BY execution_version_id").all()),original);
    assert.deepEqual(db.pragma("foreign_key_check"),[]);
  }finally{db.close();}
},60000);
