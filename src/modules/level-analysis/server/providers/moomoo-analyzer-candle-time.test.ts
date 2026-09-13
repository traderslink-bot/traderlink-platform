import assert from "node:assert/strict";
import { test } from "vitest";
import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { TrendMomentumHistoryRepository } from "../trend-momentum-history-repository";
import { moomooV1AnalyzerCandles } from "./moomoo-analyzer-candle-time";
import { aggregateIndicatorHistory } from "@/src/lib/trade-candle-analysis/trend-momentum-history";
import { aggregateCompleteExecutionTimeframeCandles } from "@/src/lib/trade-candle-analysis/execution-pattern-context";
import { validateDailyTradeExecutionCandles } from "../daily-trade-execution-candle-validation";

const start = Date.parse("2026-09-04T08:00:00Z") / 1000;
const receipt = (minute: number, price = "10") => Object.freeze({ time: start + minute * 60,
  openDecimal: price, highDecimal: price, lowDecimal: price, closeDecimal: price,
  volumeDecimal: "100", turnoverDecimal: String(Number(price) * 100) });

test("v1 receipt view shifts exactly once, preserves raw facts and includes the final completed minute", () => {
  const raw = Object.freeze([receipt(0), receipt(1), receipt(960), receipt(961)]);
  const before = JSON.stringify(raw);
  const result = moomooV1AnalyzerCandles(raw, { start, endExclusive: start + 960 * 60 });
  assert.deepEqual(result.map(c => c.time), [start, start + 959 * 60]);
  assert.equal(JSON.stringify(raw), before);
  assert.deepEqual({ ...result[0], time: raw[1].time }, raw[1]);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result[0]));
});

test("five-minute aggregation includes minute five in the first bucket and excludes the forming bucket", () => {
  const raw = Array.from({ length: 15 }, (_, i) => receipt(i + 1, String(i + 1)));
  const normalized = moomooV1AnalyzerCandles(raw, { start, endExclusive: start + 900 });
  const candles = normalized.map(c => ({ time: c.time, open: +c.openDecimal, high: +c.highDecimal,
    low: +c.lowDecimal, close: +c.closeDecimal, volume: +c.volumeDecimal, turnover: +c.turnoverDecimal! }));
  const input = { candles, completedRanges: [{ start, endExclusive: start + 900 }], asOf: start + 900 };
  const five = aggregateIndicatorHistory(input, "5m");
  assert.deepEqual(five.map(c => [c.time, c.open, c.close, c.volume]),
    [[start, 1, 5, 500], [start + 300, 6, 10, 500], [start + 600, 11, 15, 500]]);
  assert.equal(aggregateIndicatorHistory({ ...input, asOf: start + 899 }, "5m").length, 2);
  assert.equal(five.reduce((sum, c) => sum + c.volume, 0), 1500);
  const fifteen = aggregateCompleteExecutionTimeframeCandles(candles, "15m");
  assert.deepEqual(fifteen.map(c => [c.time, c.open, c.close, c.volume]), [[start, 1, 15, 1500]]);
  assert.equal(aggregateCompleteExecutionTimeframeCandles(candles.slice(0, -1), "15m").length, 0);
});

test("execution inside a minute uses that minute, not the previous native end label", () => {
  const raw = [receipt(1, "10"), receipt(2, "20")];
  const candles = moomooV1AnalyzerCandles(raw, { start, endExclusive: start + 120 });
  const events = [{ eventId: "entry", sequence: 1, kind: "entry" as const,
    executedAtUtc: new Date((start + 62) * 1000).toISOString(), priceDecimal: "20", quantityDecimal: "1", feesDecimal: "0" }];
  assert.equal(validateDailyTradeExecutionCandles({ candles, direction: "long", events }).length, 0);
  assert.equal(validateDailyTradeExecutionCandles({ candles: raw, direction: "long", events }).length, 1);
  assert.equal(events[0].executedAtUtc, "2026-09-04T08:01:02.000Z");
  for (const [offset, price] of [[59, "10"], [60, "20"], [62, "20"]] as const) {
    const boundaryEvents = [{ ...events[0], executedAtUtc: new Date((start + offset) * 1000).toISOString(), priceDecimal: price }];
    assert.equal(validateDailyTradeExecutionCandles({ candles, direction: "long", events: boundaryEvents }).length, 0);
    const wrongMinute = [{ ...boundaryEvents[0], priceDecimal: price === "10" ? "20" : "10" }];
    assert.equal(validateDailyTradeExecutionCandles({ candles, direction: "long", events: wrongMinute }).length, 1);
  }
});

test("invalid timestamp and range fail explicitly rather than guessing a convention", () => {
  assert.throws(() => moomooV1AnalyzerCandles([{ ...receipt(1), time: start + 61 }],
    { start, endExclusive: start + 120 }), /end_timestamp_invalid/);
  assert.throws(() => moomooV1AnalyzerCandles([], { start, endExclusive: start }), /range_invalid/);
});

test("saved v1 history is normalized on scoped reads without changing immutable JSON or digest", () => {
  const db = new Database(":memory:");
  try {
    db.exec(`CREATE TABLE level_analysis_indicator_history_requests(history_request_id,logical_trade_job_id,acquisition_id,
      requested_start_seconds,requested_end_seconds,attempt_number,status,failure_reason,candles_json,candle_sha256,created_at_utc,completed_at_utc);
      CREATE TABLE level_analysis_manual_retry_history_requests AS SELECT *, NULL AS retry_request_id FROM level_analysis_indicator_history_requests WHERE 0;
      CREATE TABLE level_analysis_logical_trade_jobs(logical_trade_job_id,user_id,workspace_id,account_id,market_session_set_id);
      CREATE TABLE level_analysis_market_session_sets(market_session_set_id,provider_symbol,provider_key,provider_adapter_version);
      INSERT INTO level_analysis_logical_trade_jobs VALUES('job','user','workspace','account','session');
      INSERT INTO level_analysis_market_session_sets VALUES('session','TEST','moomoo_history_kline','moomoo_history_kline_v1');`);
    const raw = JSON.stringify([receipt(1), receipt(5), receipt(15)]);
    const sha = createHash("sha256").update(raw).digest("hex");
    db.prepare("INSERT INTO level_analysis_indicator_history_requests VALUES('request','job','acquisition',?,?,1,'complete',NULL,?,?, '2026-09-04T09:00:00.000Z','2026-09-04T09:00:01.000Z')").run(start, start + 900, raw, sha);
    const repository = new TrendMomentumHistoryRepository(db);
    const scope = { userId: "user", workspaceId: "workspace", accountId: "account", workspaceRole: "owner" as const };
    const result = repository.compatibleEvidence(scope, "TEST", start, start + 900);
    assert.deepEqual(result.candles.map(c => c.time), [start, start + 240, start + 840]);
    assert.deepEqual(result.ranges, [{ start, endExclusive: start + 900 }]);
    assert.deepEqual(db.prepare("SELECT candles_json,candle_sha256 FROM level_analysis_indicator_history_requests").get(), { candles_json: raw, candle_sha256: sha });
    assert.equal(repository.compatibleEvidence({ ...scope, accountId: "other" }, "TEST", start, start + 900).candles.length, 0);
    db.exec("UPDATE level_analysis_market_session_sets SET provider_adapter_version='unknown'");
    assert.equal(repository.compatibleEvidence(scope, "TEST", start, start + 900).candles.length, 0);
  } finally { db.close(); }
});
