import "server-only";

import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

import { DailyTradeAnalyzerRepository } from "./daily-trade-analyzer-repository";
import { MoomooDailyTradeKlineMarketDataProvider } from "./providers/moomoo-daily-trade-kline-market-data-provider";
import { LogicalTradeAnalyzerRepository } from "./logical-trade-analyzer-repository";
import { LogicalTradeMoomooAnalyzerWorker } from "./logical-trade-moomoo-analyzer-worker";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import { LogicalTradeAnalyzerNotificationService } from "./logical-trade-analyzer-notification-service";
import { TrendMomentumHistoryRepository } from "./trend-momentum-history-repository";
import { TrendMomentumHistoryService } from "./trend-momentum-history-service";

const phaseLogStateKey = "__traderlinkDailyAnalyzerPhaseLog" as const;
type PhaseLogProcessState = typeof globalThis & {
  [phaseLogStateKey]?: { windowStart: number; normalCount: number; severeCount: number };
};

function logAnalyzerPhases(phases: Readonly<{
  start_epoch_ms: number;
  end_epoch_ms: number;
  total_ms: number;
  wall_clock_drift_ms: number;
  db_open_ms: number | null;
  setup_ms: number | null;
  run_one_ms: number | null;
  claim_start_epoch_ms: number | null;
  claim_end_epoch_ms: number | null;
  claim_next_ms: number | null;
  db_close_ms: number;
}>): void {
  try {
    const longestPhase = Math.max(
      phases.db_open_ms ?? 0, phases.setup_ms ?? 0, phases.run_one_ms ?? 0,
      phases.claim_next_ms ?? 0, phases.db_close_ms,
    );
    if (phases.total_ms < 1_000 && longestPhase < 250) return;
    const processState = globalThis as PhaseLogProcessState;
    const budget = (processState[phaseLogStateKey] ??= {
      windowStart: 0, normalCount: 0, severeCount: 0,
    });
    if (phases.end_epoch_ms - budget.windowStart >= 60_000) {
      budget.windowStart = phases.end_epoch_ms;
      budget.normalCount = 0;
      budget.severeCount = 0;
    }
    const severe = phases.total_ms >= 5_000 || (phases.claim_next_ms ?? 0) >= 2_000;
    if (severe) {
      if (budget.severeCount >= 12) return;
      budget.severeCount++;
    } else {
      if (budget.normalCount >= 12) return;
      budget.normalCount++;
    }
    console.info(`daily_trade_analyzer_phase_timing ${JSON.stringify(phases)}`);
  } catch { /* A timing log cannot affect analyzer work. */ }
}

/** Runs one account-isolated Trade Analyzer job inside the sole Platform process. */
export async function runDailyTradeAnalyzerOnce(): Promise<boolean> {
  const startEpochMs = Date.now();
  const started = performance.now();
  let dbOpenMs: number | null = null;
  let setupMs: number | null = null;
  let runOneMs: number | null = null;
  let claimStartEpochMs: number | null = null;
  let claimEndEpochMs: number | null = null;
  let claimNextMs: number | null = null;
  let database: ReturnType<typeof openPlatformDatabase> | undefined;
  try {
    const openStarted = performance.now();
    try { database = openPlatformDatabase({ mode: "runtime" }); }
    finally { dbOpenMs = performance.now() - openStarted; }
    const connections = new MoomooConnectionRepository(database);
    const allowances = new SharedAnalyzerAllowanceRepository(database);
    const providerFor = async (scope: import("@/src/modules/platform/contracts/workspace-access-scope").AccountScope, completeHistory = false) => {
      const accessToken = await new MoomooConnectionAccessService(connections).accessToken({
        ...scope,
        allowedAccountIds: [scope.accountId],
        activeAccountId: scope.accountId,
      });
      return new MoomooDailyTradeKlineMarketDataProvider(() => Promise.resolve(accessToken), fetch, { completeHistory });
    };
    const dailyRepository = new DailyTradeAnalyzerRepository(database);
    const worker = new LogicalTradeMoomooAnalyzerWorker(
      new LogicalTradeAnalyzerRepository(database), dailyRepository, allowances, providerFor,
      new LogicalTradeAnalyzerNotificationService(database),
      undefined,
      new TrendMomentumHistoryService(new TrendMomentumHistoryRepository(database), allowances, (scope) => providerFor(scope, true)),
      (timing) => {
        claimStartEpochMs = timing.startEpochMs;
        claimEndEpochMs = timing.endEpochMs;
        claimNextMs = timing.durationMs;
      },
    );
    setupMs = performance.now() - started - (dbOpenMs ?? 0);
    const runStarted = performance.now();
    try { return await worker.runOne(); }
    finally { runOneMs = performance.now() - runStarted; }
  } finally {
    const closeStarted = performance.now();
    try { database?.close(); } finally {
      const dbCloseMs = performance.now() - closeStarted;
      try {
        const endEpochMs = Date.now();
        const totalMs = performance.now() - started;
        const rounded = (value: number | null): number | null => value === null ? null : Number(value.toFixed(1));
        logAnalyzerPhases({
          start_epoch_ms: startEpochMs,
          end_epoch_ms: endEpochMs,
          total_ms: Number(totalMs.toFixed(1)),
          wall_clock_drift_ms: Number((endEpochMs - startEpochMs - totalMs).toFixed(1)),
          db_open_ms: rounded(dbOpenMs),
          setup_ms: rounded(setupMs),
          run_one_ms: rounded(runOneMs),
          claim_start_epoch_ms: claimStartEpochMs,
          claim_end_epoch_ms: claimEndEpochMs,
          claim_next_ms: rounded(claimNextMs),
          db_close_ms: Number(dbCloseMs.toFixed(1)),
        });
      } catch { /* A timing log cannot affect analyzer work. */ }
    }
  }
}
