import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { test } from "vitest";
import { readJournalDemoIndicatorReceipts } from "./journal-demo-indicator-receipts";
import { prepareJournalDemoTrendMomentum } from "./journal-demo-trend-momentum-analysis";

function fixture() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE level_analysis_market_session_sets(
    market_session_set_id TEXT PRIMARY KEY,provider_symbol TEXT,trading_date_new_york TEXT,
    provider_key TEXT,provider_adapter_version TEXT,exchange_identity TEXT,interval TEXT,session_policy TEXT);
    CREATE TABLE level_analysis_market_session_set_versions(
    market_session_set_version_id TEXT PRIMARY KEY,market_session_set_id TEXT,requested_start_utc TEXT,
    requested_end_utc TEXT,candle_sha256 TEXT,outcome TEXT,retrieved_at_utc TEXT,failure_reason_code TEXT);
    CREATE TABLE level_analysis_market_session_candles(market_session_set_version_id TEXT,
    candle_time_utc_seconds INTEGER,open_decimal TEXT,high_decimal TEXT,low_decimal TEXT,
    close_decimal TEXT,volume_decimal TEXT,turnover_decimal TEXT);`);
  const add = (id: string, date: string, options: { symbol?: string; adapter?: string; end?: string; outcome?: string } = {}) => {
    db.prepare(`INSERT INTO level_analysis_market_session_sets VALUES(?,?,?,?,?,'unknown','1m','america_new_york_extended_0400_2000_v1')`)
      .run(id,options.symbol ?? "TEST",date,"moomoo_history_kline",options.adapter ?? "moomoo_history_kline_v1");
    db.prepare(`INSERT INTO level_analysis_market_session_set_versions VALUES(?,?,?,?,?,?,?,NULL)`)
      .run(id,id,`${date}T08:00:00.000Z`,options.end ?? `${date}T23:00:00.000Z`,"a".repeat(64),options.outcome ?? "ready",`${date}T23:59:00.000Z`);
    db.prepare(`INSERT INTO level_analysis_market_session_candles VALUES(?,?,'2','2.1','1.9','2','100','200')`)
      .run(id,Date.parse(`${date}T08:01:00.000Z`)/1000);
  };
  return { db, add };
}

test("Demo reader pins original core and excludes wrong identity, future and out-of-bound sessions", () => {
  const { db, add }=fixture();
  try {
    add("core","2026-08-21"); add("replacement","2026-08-21");
    add("prior","2026-08-20"); add("wrong-symbol","2026-08-19",{symbol:"OTHER"});
    add("wrong-adapter","2026-08-18",{adapter:"other"}); add("failed","2026-08-17",{outcome:"provider_unavailable"});
    add("future","2026-08-24"); add("old","2026-07-01");
    const before=db.prepare("SELECT total_changes() AS n").get();
    const found=readJournalDemoIndicatorReceipts(db,{symbol:"TEST",tradingDateNewYork:"2026-08-21",coreVersionId:"core"});
    assert.deepEqual(found?.evidence.map(row=>row.versionId),["prior","core"]);
    assert.equal(found?.receipts[1].candles[0].time,Date.parse("2026-08-21T08:01:00Z")/1000);
    assert.deepEqual(db.prepare("SELECT total_changes() AS n").get(),before);
    assert.equal(readJournalDemoIndicatorReceipts(db,{symbol:"OTHER",tradingDateNewYork:"2026-08-21",coreVersionId:"core"}),null);
  } finally { db.close(); }
});

test("Demo reader selects one prior revision with the widest recorded range", () => {
  const { db, add }=fixture();
  try {
    add("core","2026-08-21"); add("shorter","2026-08-20",{end:"2026-08-20T15:00:00.000Z"}); add("wider","2026-08-20");
    const found=readJournalDemoIndicatorReceipts(db,{symbol:"TEST",tradingDateNewYork:"2026-08-21",coreVersionId:"core"});
    assert.deepEqual(found?.evidence.map(row=>row.versionId),["wider","core"]);
  } finally { db.close(); }
});

test("partial ready receipts cannot prove core, prior or supplementary coverage", () => {
  const { db, add }=fixture();
  try {
    add("core","2026-08-21",{end:"2026-08-21T15:00:00.000Z"});
    add("partial-tail","2026-08-21");
    add("prior-valid","2026-08-20",{end:"2026-08-20T15:00:00.000Z"});
    add("prior-partial","2026-08-20");
    db.prepare("UPDATE level_analysis_market_session_set_versions SET failure_reason_code='partial:invalid_rows' WHERE market_session_set_version_id IN ('partial-tail','prior-partial')").run();
    const input={symbol:"TEST",tradingDateNewYork:"2026-08-21",coreVersionId:"core"};
    assert.deepEqual(readJournalDemoIndicatorReceipts(db,input)?.evidence.map(row=>row.versionId),["prior-valid","core"]);
    assert.equal(readJournalDemoIndicatorReceipts(db,{...input,coreVersionId:"partial-tail"}),null);
    db.prepare("UPDATE level_analysis_market_session_set_versions SET failure_reason_code='partial:invalid_rows' WHERE market_session_set_version_id='prior-valid'").run();
    assert.deepEqual(readJournalDemoIndicatorReceipts(db,input)?.evidence.map(row=>row.versionId),["core"]);
  } finally { db.close(); }
});

test("Demo reader extends a partial core without replacing it and rejects conflicting overlaps", () => {
  const { db, add }=fixture();
  try {
    add("core","2026-08-21",{end:"2026-08-21T15:00:00.000Z"});
    add("full","2026-08-21");
    const input={symbol:"TEST",tradingDateNewYork:"2026-08-21",coreVersionId:"core"};
    const selected=readJournalDemoIndicatorReceipts(db,input)!;
    assert.deepEqual(selected.evidence.map(row=>row.versionId),["core","full"]);
    const target={symbol:"TEST",tradingDateNewYork:"2026-08-21",direction:"long" as const,
      events:[{kind:"entry" as const,eventId:"entry",sequence:1,executedAtUtc:"2026-08-21T14:00:00Z",priceDecimal:"2",quantityDecimal:"1",feesDecimal:"0"},
        {kind:"final_exit" as const,eventId:"exit",sequence:2,executedAtUtc:"2026-08-21T16:00:00Z",priceDecimal:"2",quantityDecimal:"1",feesDecimal:"0"}]};
    assert.equal(prepareJournalDemoTrendMomentum({...target,receipts:[selected.receipts[0]]}).status,"session_history_missing");
    assert.equal(prepareJournalDemoTrendMomentum({...target,receipts:selected.receipts}).status,"prepared");
    db.prepare("UPDATE level_analysis_market_session_candles SET close_decimal='2.01' WHERE market_session_set_version_id='full'").run();
    assert.throws(()=>prepareJournalDemoTrendMomentum({...target,receipts:readJournalDemoIndicatorReceipts(db,input)!.receipts}),/conflict/);
  } finally { db.close(); }
});

test("ready metadata without saved candles cannot establish completed history", () => {
  const { db, add }=fixture();
  try {
    add("core","2026-08-21");
    db.prepare("DELETE FROM level_analysis_market_session_candles").run();
    assert.throws(()=>readJournalDemoIndicatorReceipts(db,{symbol:"TEST",tradingDateNewYork:"2026-08-21",coreVersionId:"core"}),/saved_candles_missing/);
  } finally { db.close(); }
});

test("known excluded-row prior receipt is retained as partial, never promoted to complete core", () => {
  const { db, add }=fixture();
  try {
    add("core","2026-08-21"); add("prior","2026-08-20");
    db.prepare("UPDATE level_analysis_market_session_set_versions SET failure_reason_code='partial:moomoo_rows_excluded' WHERE market_session_set_version_id='prior'").run();
    const found=readJournalDemoIndicatorReceipts(db,{symbol:"TEST",tradingDateNewYork:"2026-08-21",coreVersionId:"core"});
    assert.deepEqual(found?.evidence.map(row=>row.versionId),["prior","core"]);
    assert.equal(found?.receipts[0].complete,false);
    assert.equal(found?.receipts[1].complete,true);
    assert.equal(readJournalDemoIndicatorReceipts(db,{symbol:"TEST",tradingDateNewYork:"2026-08-20",coreVersionId:"prior"}),null);
    add("complete-prior","2026-08-20",{end:"2026-08-20T15:00:00.000Z"});
    assert.deepEqual(readJournalDemoIndicatorReceipts(db,{symbol:"TEST",tradingDateNewYork:"2026-08-21",coreVersionId:"core"})?.evidence.map(row=>row.versionId),["complete-prior","core"]);
  } finally { db.close(); }
});
