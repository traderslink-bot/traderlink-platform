import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { PlatformOperationalEventRepository } from "@/src/modules/platform/server/administration/platform-operational-event-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { DailyTradeAnalyzerRepository } from "./daily-trade-analyzer-repository";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import { MoomooDailyTradeKlineMarketDataProvider } from "./providers/moomoo-daily-trade-kline-market-data-provider";
import { newYorkExtendedSession } from "./daily-trade-analyzer-session";
import { openReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { ownerMarketDataMessage } from "../owner-market-data-messages";

const KEY = "moomoo_history_kline";
const ADAPTER = "moomoo_history_kline_v1";
const POLICY = "america_new_york_extended_0400_2000_v1";
const diagnosticRef = (versionId: string) => createHash("sha256").update(`owner-market-data:${versionId}`).digest("hex");

export function validOwnerMarketRequest(value: unknown): value is { symbol: string; date: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return Object.keys(row).length === 2 && typeof row.symbol === "string" &&
    /^[A-Z][A-Z0-9.-]{0,15}$/u.test(row.symbol) && typeof row.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/u.test(row.date) && Number.isFinite(Date.parse(`${row.date}T12:00:00Z`)) &&
    new Date(`${row.date}T12:00:00Z`).toISOString().slice(0, 10) === row.date;
}

/** Public market facts only. Authorization is mandatory in the page/API before calling. */
export function readOwnerMarketData(symbol?: string, date?: string, offset = 0, result = "all") {
  const database = openReadonlyPlatformDatabase();
  try {
    const rows = database.prepare(`SELECT s.market_session_set_id AS id, s.provider_symbol AS symbol,
      s.trading_date_new_york AS date, s.current_status AS status,
      v.candle_sha256 AS checksum, v.retrieved_at_utc AS retrievedAt,
      v.requested_start_utc AS requestedStart, v.requested_end_utc AS requestedEnd,
      s.current_coverage_end_utc AS coverageEnd,
      (SELECT MIN(candle_time_utc_seconds) FROM level_analysis_market_session_candles c WHERE c.market_session_set_version_id = s.current_version_id) AS firstTime,
      (SELECT MAX(candle_time_utc_seconds) FROM level_analysis_market_session_candles c WHERE c.market_session_set_version_id = s.current_version_id) AS lastTime,
      latest.outcome AS latestOutcome, latest.failure_reason_code AS failure,
      latest.retrieved_at_utc AS lastAttempt,
      (SELECT COUNT(*) FROM level_analysis_market_session_candles c
        WHERE c.market_session_set_version_id = s.current_version_id) AS bars
      FROM level_analysis_market_session_sets s
      LEFT JOIN level_analysis_market_session_set_versions v ON v.market_session_set_version_id = s.current_version_id
      INNER JOIN level_analysis_market_session_set_versions latest ON latest.market_session_set_id = s.market_session_set_id
        AND latest.revision_number = (SELECT MAX(x.revision_number) FROM level_analysis_market_session_set_versions x
          WHERE x.market_session_set_id = s.market_session_set_id)
      WHERE s.provider_key = ? AND s.provider_adapter_version = ? AND s.interval = '1m'
        AND s.session_policy = ? AND (? IS NULL OR s.provider_symbol = ?)
        AND (? IS NULL OR s.trading_date_new_york = ?)
        AND (? = 'all' OR (? = 'success' AND latest.outcome = 'ready' AND (latest.failure_reason_code IS NULL OR latest.failure_reason_code = 'saved_session_retained'))
          OR (? = 'failed' AND (latest.outcome <> 'ready' OR (latest.failure_reason_code IS NOT NULL AND latest.failure_reason_code <> 'saved_session_retained'))))
      ORDER BY s.trading_date_new_york DESC, s.provider_symbol LIMIT 100 OFFSET ?`)
      .all(KEY, ADAPTER, POLICY, symbol ?? null, symbol ?? null, date ?? null, date ?? null, result, result, result, offset) as Array<{
        id: string; symbol: string; date: string; status: string; checksum: string | null;
        retrievedAt: string | null; requestedStart: string | null; requestedEnd: string | null;
        coverageEnd: string | null; firstTime: number | null; lastTime: number | null;
        latestOutcome: string | null; failure: string | null; lastAttempt: string | null; bars: number;
      }>;
    const repository = new DailyTradeAnalyzerRepository(database);
    return rows.map(({ id, failure, ...row }) => ({ ...row, failure: ownerMarketDataMessage(failure),
      requestStatus: row.latestOutcome === "ready" && (!failure || failure === "saved_session_retained") ? "success" : "failed",
      attempts: (database.prepare(`SELECT market_session_set_version_id AS versionId, retrieved_at_utc AS at, outcome, failure_reason_code AS reason, requested_start_utc AS requestedStart, requested_end_utc AS requestedEnd FROM level_analysis_market_session_set_versions WHERE market_session_set_id = ? ORDER BY revision_number DESC LIMIT 20`).all(id) as Array<{ versionId: string; at: string; outcome: string; reason: string | null; requestedStart: string; requestedEnd: string }>).map(({ versionId, reason, ...attempt }) => {
        const evidence = database.prepare(`SELECT safe_counts_json AS counts FROM platform_operational_events WHERE operation_kind = 'background_job' AND operation_ref_sha256 = ? AND outcome_code = 'owner_market_data_request' LIMIT 1`).get(diagnosticRef(versionId)) as { counts: string } | undefined;
        return { ...attempt, code: reason, message: ownerMarketDataMessage(reason), diagnostics: evidence ? JSON.parse(evidence.counts) as Record<string, number> : null };
      }),
      ...(symbol && date ? { candles: repository.readCurrentCandles(id) } : {}),
    }));
  } finally { database.close(); }
}

export async function requestOwnerMarketData(input: { symbol: string; date: string }) {
  const session = newYorkExtendedSession(input.date);
  if (!session) throw new Error("invalid_session");
  const database = openPlatformDatabase({ mode: "runtime" });
  const repository = new DailyTradeAnalyzerRepository(database);
  const iso = (seconds: number) => new Date(seconds * 1000).toISOString();
  let id: string | undefined;
  let diagnostics: Readonly<Record<string, number>> = { credential_available: 0, requests_sent: 0, responses_received: 0 };
  // The normal worker owns its leases. Restore the exact value inside the same
  // immediate transaction because persistMarketSession clears it even for evidence.
  const persist = (input: Parameters<DailyTradeAnalyzerRepository["persistMarketSession"]>[0]) => database.transaction(() => {
    const before = database.prepare("SELECT lease_expires_at_utc AS lease FROM level_analysis_market_session_sets WHERE market_session_set_id = ?").get(id!) as { lease: string | null };
    const current = repository.readCurrentCandles(id!);
    const existingEnd = repository.currentSessionCoverageEnd(id!);
    const incomingTimes = new Set(input.candles.map((candle) => candle.time));
    const promote = input.outcome === "ready" && current.every((candle) => incomingTimes.has(candle.time)) &&
      (!existingEnd || input.coverageEndUtc >= existingEnd);
    const versionId = repository.persistMarketSession({ ...input, failureReasonCode: input.failureReasonCode ?? (input.outcome === "ready" && !promote ? "saved_session_retained" : null), promoteCurrent: false });
    new PlatformOperationalEventRepository(database).append({
      operationKind: "background_job", operationRefSha256: diagnosticRef(versionId),
      state: input.outcome === "ready" && !input.failureReasonCode?.startsWith("partial:") ? "completed" : "failed",
      outcomeCode: "owner_market_data_request", applicationVersion: null, safeCounts: diagnostics,
      evidenceSha256: null, startedAtUtc: input.completedAtUtc, completedAtUtc: input.completedAtUtc, createdAtUtc: input.completedAtUtc,
    });
    if (promote) database.prepare(`UPDATE level_analysis_market_session_sets SET current_version_id = ?, current_coverage_end_utc = ?, current_status = 'ready' WHERE market_session_set_id = ?`).run(versionId, input.coverageEndUtc, id!);
    database.prepare("UPDATE level_analysis_market_session_sets SET lease_expires_at_utc = ? WHERE market_session_set_id = ?").run(before.lease, id!);
    return promote;
  }).immediate();
  try {
    const now = new Date().toISOString();
    database.prepare(`INSERT INTO level_analysis_market_session_sets (
      market_session_set_id, provider_key, provider_adapter_version, provider_symbol, exchange_identity,
      trading_date_new_york, interval, session_policy, current_version_id, current_coverage_end_utc,
      current_status, lease_expires_at_utc, created_at_utc, updated_at_utc)
      VALUES (?, ?, ?, ?, 'unknown', ?, '1m', ?, NULL, NULL, 'queued', NULL, ?, ?)
      ON CONFLICT(provider_key, provider_adapter_version, provider_symbol, exchange_identity,
        trading_date_new_york, interval, session_policy) DO NOTHING`)
      .run(randomUUID(), KEY, ADAPTER, input.symbol, input.date, POLICY, now, now);
    id = (database.prepare(`SELECT market_session_set_id AS id FROM level_analysis_market_session_sets
      WHERE provider_key = ? AND provider_adapter_version = ? AND provider_symbol = ?
        AND exchange_identity = 'unknown' AND trading_date_new_york = ? AND interval = '1m' AND session_policy = ?`)
      .get(KEY, ADAPTER, input.symbol, input.date, POLICY) as { id: string }).id;
    const saveFailure = (reason: string) => {
      persist({ marketSessionSetId: id!, candles: [], completedAtUtc: new Date().toISOString(),
        coverageEndUtc: iso(session.endTime), requestedStartUtc: iso(session.startTime), requestedEndUtc: iso(session.endTime),
        failureReasonCode: reason, outcome: "provider_unavailable", providerExchangeTimezone: null,
        providerUtcOffsetSeconds: null, sha256: null, promoteCurrent: repository.readCurrentCandles(id!).length === 0 });
      return { ok: false as const, message: ownerMarketDataMessage(reason) };
    };
    const scope = new SharedAnalyzerAllowanceRepository(database).designatedScope();
    if (!scope) return saveFailure("shared_connection_unavailable");
    let token: string;
    try {
      token = await new MoomooConnectionAccessService(new MoomooConnectionRepository(database)).accessToken({
        ...scope, allowedAccountIds: [scope.accountId], activeAccountId: scope.accountId,
      });
    } catch { return saveFailure("shared_connection_unavailable"); }
    diagnostics = { ...diagnostics, credential_available: 1 };
    const requestStarted = Math.floor(Date.now() / 60000) * 60;
    const result = await new MoomooDailyTradeKlineMarketDataProvider(() => Promise.resolve(token), fetch, { strictOwnerSession: true, onDiagnostics: (counts) => { diagnostics = counts; } }).fetch({
      symbol: input.symbol, interval: "1m", includeExtendedHours: true,
      startTime: session.startTime, endTime: session.endTime,
    });
    if (!result.ok) {
      if (result.partialCandles?.length && result.partialSha256) {
        persist({ marketSessionSetId: id, candles: result.partialCandles, completedAtUtc: new Date().toISOString(),
          coverageEndUtc: iso(session.startTime), requestedStartUtc: iso(session.startTime), requestedEndUtc: iso(session.endTime),
          failureReasonCode: `partial:${result.failureReasonCode}`, outcome: "ready", providerExchangeTimezone: result.exchangeTimezone,
          providerUtcOffsetSeconds: result.utcOffsetSeconds, sha256: result.partialSha256 });
        return { ok: false as const, message: ownerMarketDataMessage(`partial:${result.failureReasonCode}`) };
      }
      return saveFailure(result.failureReasonCode);
    }
    const promoted = persist({ marketSessionSetId: id, candles: result.candles,
      completedAtUtc: new Date().toISOString(), coverageEndUtc: iso(Math.max(session.startTime, Math.min(session.endTime, requestStarted))),
      requestedStartUtc: iso(session.startTime), requestedEndUtc: iso(session.endTime),
      failureReasonCode: null, outcome: "ready", providerExchangeTimezone: result.exchangeTimezone,
      providerUtcOffsetSeconds: result.utcOffsetSeconds, sha256: result.normalizedCandleSha256 });
    return { ok: true as const, bars: result.candles.length, message: promoted ? "Candles saved." : ownerMarketDataMessage("saved_session_retained") };
  } catch {
    if (id) {
      try {
        persist({ marketSessionSetId: id, candles: [], completedAtUtc: new Date().toISOString(),
          coverageEndUtc: iso(session.endTime), requestedStartUtc: iso(session.startTime), requestedEndUtc: iso(session.endTime),
          failureReasonCode: "application_request_failed", outcome: "provider_unavailable", providerExchangeTimezone: null,
          providerUtcOffsetSeconds: null, sha256: null });
        return { ok: false as const, message: ownerMarketDataMessage("application_request_failed") };
      } catch { /* A database failure cannot be truthfully promised persisted. */ }
    }
    return { ok: false as const, message: ownerMarketDataMessage("persistence_failed") };
  } finally { database.close(); }
}
