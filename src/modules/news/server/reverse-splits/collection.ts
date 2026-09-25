import "server-only";
import { record, type SplitMarketData } from "./contracts";
import { ReverseSplitAcquisitionService } from "./acquisition";
import { getSplitMarketData } from "./market-data";
import { latestRegularCloseDate, type SplitCalendar } from "./messages";
import { ReverseSplitRepository } from "./repository";
import type { ReverseSplitConfiguration } from "./configuration";

export class ReverseSplitCollectionService {
  constructor(
    private readonly repository: ReverseSplitRepository,
    private readonly configuration: ReverseSplitConfiguration,
    private readonly calendar: SplitCalendar,
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async refreshOneMarketSnapshot(): Promise<Readonly<{ ticker: string | null; failure: string | null }>> {
    const now = this.now();
    const expectedCloseDate = latestRegularCloseDate(now, this.calendar);
    const claim = this.repository.claimRuntime("market_refresh", now.toISOString());
    if (!claim) return { ticker: null, failure: null };
    const state = record(claim.state);
    if (typeof state?.nextAt === "string" && state.nextAt > now.toISOString()) {
      this.repository.completeRuntime(claim, claim.state, now.toISOString());
      return { ticker: null, failure: null };
    }
    let ticker: string | null = null;
    try {
      ticker = this.repository.nextMarketTicker(expectedCloseDate, now.toISOString());
      if (!ticker) {
        this.repository.completeRuntime(claim, { nextAt: new Date(now.getTime() + 60_000).toISOString() }, now.toISOString());
        return { ticker: null, failure: null };
      }
      const market: SplitMarketData = await getSplitMarketData({ ticker, token: this.configuration.eodhdToken,
        expectedCloseDate, now, fetcher: this.fetcher });
      const finishedAt = this.now().toISOString();
      const saved = this.repository.completeMarketSnapshot(claim, ticker, market, finishedAt);
      return { ticker, failure: saved ? null : "market_refresh_lease_expired" };
    } catch {
      const finishedAt = this.now();
      this.repository.completeRuntime(claim, { nextAt: new Date(finishedAt.getTime() + 5 * 60_000).toISOString(), failure: "market_refresh_failed" }, finishedAt.toISOString());
      return { ticker, failure: "market_refresh_failed" };
    }
  }

  async runOnce(): Promise<Readonly<{ failures: readonly string[]; processed: string }>> {
    const acquisition = new ReverseSplitAcquisitionService(this.repository, this.configuration.secUserAgent, this.fetcher, this.now);
    const date = this.calendar.marketDateAt(this.now());
    const claim = this.repository.claimRuntime("collection_turn", this.now().toISOString());
    if (!claim) return { failures: [], processed: "idle" };
    const storedTurn = record(claim.state)?.turn;
    const turn = typeof storedTurn === "number" && Number.isSafeInteger(storedTurn) && storedTurn >= 0 ? storedTurn % 6 : 0;
    if (!this.repository.completeRuntime(claim, { turn: (turn + 1) % 6 }, this.now().toISOString())) return { failures: [], processed: "idle" };
    if (turn === 2 || turn === 5) {
      const result = await acquisition.processOneSource();
      return { failures: result.outcome === "failed" ? [result.reason] : [], processed: result.outcome };
    }
    const result = turn === 0 ? await acquisition.discoverNasdaq()
      : turn === 1 ? await acquisition.discoverSec(date)
        : turn === 3 ? await this.refreshOneMarketSnapshot() : await acquisition.discoverSec(date, "backfill");
    return { failures: result.failure ? [result.failure] : [], processed: ["nasdaq", "sec", "source", "market", "backfill"][turn] };
  }
}
