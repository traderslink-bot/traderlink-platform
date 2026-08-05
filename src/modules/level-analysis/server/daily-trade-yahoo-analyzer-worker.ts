import { analyzeDailyTrade } from "./daily-trade-analyzer";
import { DailyTradeAnalyzerRepository } from "./daily-trade-analyzer-repository";
import { availableSessionEnd, newYorkExtendedSession } from "./daily-trade-analyzer-session";
import type { MarketDataProvider } from "../contracts/candle-review-contracts";

const RETRY_DELAY_MILLISECONDS = 5 * 60 * 1000;

function containsEveryExecutionMinute(
  candles: readonly { time: number }[],
  executedAtUtc: readonly { executedAtUtc: string }[],
): boolean {
  const candleTimes = new Set(candles.map((candle) => candle.time));
  return executedAtUtc.every((event) => {
    const milliseconds = Date.parse(event.executedAtUtc);
    return Number.isFinite(milliseconds) && candleTimes.has(Math.floor(milliseconds / 60_000) * 60);
  });
}

export class DailyTradeYahooAnalyzerWorker {
  constructor(
    private readonly repository: DailyTradeAnalyzerRepository,
    private readonly provider: MarketDataProvider,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async runOne(): Promise<boolean> {
    const now = this.now();
    const job = this.repository.claimNextJob(now);
    if (!job) return false;
    const session = newYorkExtendedSession(job.target.tradingDateNewYork);
    const desiredEndSeconds = Math.floor(Date.parse(job.desiredCoverageEndUtc) / 1000);
    const availableEnd = session ? availableSessionEnd(session, now) : null;
    if (!session || availableEnd === null || !Number.isFinite(desiredEndSeconds)) {
      this.repository.finishJob(job.jobId, "expired", now);
      return true;
    }
    const requestEnd = Math.min(availableEnd, desiredEndSeconds);
    const currentCoverage = this.repository.currentSessionCoverageEnd(job.marketSessionSetId);
    let candles = this.repository.readCurrentCandles(job.marketSessionSetId);
    let sessionVersionId = this.repository.currentSessionVersionId(job.marketSessionSetId);
    if (!currentCoverage || Date.parse(currentCoverage) / 1000 < requestEnd) {
      const completedAt = this.now();
      const result = await this.provider.fetch({
        symbol: job.target.providerSymbol,
        interval: "1m",
        startTime: session.startTime,
        endTime: requestEnd,
        includeExtendedHours: true,
      });
      if (!result.ok) {
        sessionVersionId = this.repository.persistMarketSession({
          candles: [],
          completedAtUtc: completedAt.toISOString(),
          coverageEndUtc: new Date(requestEnd * 1000).toISOString(),
          failureReasonCode: result.failureReasonCode,
          marketSessionSetId: job.marketSessionSetId,
          outcome: result.code === "provider_unavailable" ? "provider_unavailable" : "no_coverage",
          providerExchangeTimezone: result.exchangeTimezone,
          providerUtcOffsetSeconds: result.utcOffsetSeconds,
          requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
          requestedEndUtc: new Date(requestEnd * 1000).toISOString(),
          sha256: null,
        });
        this.repository.persistAnalysis({ analyzed: { eventSnapshots: [], finalExitPaths: [] }, marketSessionSetVersionId: sessionVersionId,
          scope: job.scope, status: result.code === "provider_unavailable" ? "provider_unavailable" : "no_coverage", target: job.target, now: completedAt });
        this.repository.finishJob(job.jobId, result.code === "provider_unavailable" ? "provider_unavailable" : "no_coverage", completedAt);
        return true;
      }
      if (!containsEveryExecutionMinute(result.candles, job.target.events)) {
        sessionVersionId = this.repository.persistMarketSession({
          candles: result.candles,
          completedAtUtc: completedAt.toISOString(),
          coverageEndUtc: new Date(requestEnd * 1000).toISOString(),
          failureReasonCode: null,
          marketSessionSetId: job.marketSessionSetId,
          outcome: "ready",
          providerExchangeTimezone: result.exchangeTimezone,
          providerUtcOffsetSeconds: result.utcOffsetSeconds,
          requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
          requestedEndUtc: new Date(requestEnd * 1000).toISOString(),
          sha256: result.normalizedCandleSha256,
        });
        this.repository.persistAnalysis({
          analyzed: { eventSnapshots: [], finalExitPaths: [] },
          marketSessionSetVersionId: sessionVersionId,
          scope: job.scope,
          status: "no_coverage",
          target: job.target,
          now: completedAt,
        });
        this.repository.finishJob(job.jobId, "no_coverage", completedAt);
        return true;
      }
      sessionVersionId = this.repository.persistMarketSession({
        candles: result.candles,
        completedAtUtc: completedAt.toISOString(),
        coverageEndUtc: new Date(requestEnd * 1000).toISOString(),
        failureReasonCode: null,
        marketSessionSetId: job.marketSessionSetId,
        outcome: "ready",
        providerExchangeTimezone: result.exchangeTimezone,
        providerUtcOffsetSeconds: result.utcOffsetSeconds,
        requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
        requestedEndUtc: new Date(requestEnd * 1000).toISOString(),
        sha256: result.normalizedCandleSha256,
      });
      candles = result.candles;
    }
    if (!containsEveryExecutionMinute(candles, job.target.events)) {
      const completedAt = this.now();
      this.repository.persistAnalysis({
        analyzed: { eventSnapshots: [], finalExitPaths: [] },
        marketSessionSetVersionId: sessionVersionId,
        scope: job.scope,
        status: "no_coverage",
        target: job.target,
        now: completedAt,
      });
      this.repository.finishJob(job.jobId, "no_coverage", completedAt);
      return true;
    }
    const analyzedAt = this.now();
    this.repository.persistAnalysis({
      analyzed: analyzeDailyTrade({ candles, dailyRanges: [], direction: job.target.direction, events: job.target.events }),
      marketSessionSetVersionId: sessionVersionId,
      scope: job.scope,
      status: "ready",
      target: job.target,
      now: analyzedAt,
    });
    if (requestEnd >= desiredEndSeconds) this.repository.finishJob(job.jobId, "completed", analyzedAt);
    else this.repository.rescheduleJob(job.jobId, new Date(Math.min(desiredEndSeconds * 1000, now.getTime() + RETRY_DELAY_MILLISECONDS)), analyzedAt);
    return true;
  }
}
