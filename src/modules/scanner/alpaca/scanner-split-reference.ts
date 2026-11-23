import { easternClock } from "../live/sessions";
import type { AlpacaSplitHistory } from "./chart-vwap-events";
import type { SplitAdjustedPreviousClose } from "./previous-close";
import { PREVIOUS_CLOSE_TTL_MS } from "./previous-close";
import type { AlpacaHistoryResult, AlpacaRestData } from "./rest-data";
import type { AlpacaTradingStatus } from "./trading-status";
import { verifyDailySplitAdjustment } from "./verified-daily-split";

const retryDelayMs = 30_000;

type ReferenceCheck = {
  key: string;
  attemptedAt: number;
  verified?: SplitAdjustedPreviousClose;
};

function observedDailyBar(result: AlpacaHistoryResult, symbol: string, date: string,
  adjustment: "raw" | "split", time: number) {
  return result.symbol === symbol && result.basisDate === date && result.feed === "sip" &&
    result.adjustment === adjustment && result.complete && result.nextPageToken === null &&
    result.bars.length === 1 && result.bars[0].time === time ? result.bars[0] : undefined;
}

/** Verify affected prior closes separately from the ordinary Scanner history cache. */
export class ScannerSplitReference {
  private readonly latest = new Map<string, ReferenceCheck>();
  private readonly effective = new Map<string, AlpacaSplitHistory>();
  private effectiveDate?: string;
  private pending = 0;

  constructor(
    private readonly rest: Pick<AlpacaRestData, "history">,
    private readonly splitHistory: (symbol: string) => Promise<AlpacaSplitHistory>,
    private readonly onChange: (symbol: string) => void,
    private readonly now = Date.now,
  ) {}

  remember(history: AlpacaSplitHistory) {
    const date = easternClock(this.now()).date;
    if (history.basisDate !== date) return;
    if (date !== this.effectiveDate) {
      this.effective.clear();
      this.effectiveDate = date;
    }
    if (history.events.some(event => event.effectiveDate === date) &&
      this.effective.get(history.symbol)?.revision !== history.revision) {
      this.effective.set(history.symbol, history);
      this.onChange(history.symbol);
    }
  }

  read(reference: SplitAdjustedPreviousClose | null, status: AlpacaTradingStatus | null) {
    if (!reference) return null;
    const { symbol, basisDate, barAt } = reference;
    const haltTime = status?.symbol === symbol && status.reasonCode === "M1" ? Date.parse(status.haltedAt ?? "") : NaN;
    const haltDate = Number.isFinite(haltTime) ? easternClock(haltTime).date : undefined;
    const barDate = easternClock(barAt).date;
    const crossedHalt = haltDate && barDate <= haltDate && haltDate < basisDate ? haltDate : undefined;
    const scheduled = this.effectiveDate === basisDate && barDate < basisDate ? this.effective.get(symbol) : undefined;
    if (!crossedHalt && !scheduled) return reference;

    const now = this.now();
    const key = JSON.stringify([crossedHalt, scheduled?.revision, basisDate, barAt]);
    const stored = this.latest.get(symbol);
    if (stored?.key === key) {
      if (stored.verified && now - stored.verified.fetchedAt < PREVIOUS_CLOSE_TTL_MS) return stored.verified;
      if (now - stored.attemptedAt < retryDelayMs) return null;
    }
    if (this.pending >= 1) return null;
    const check: ReferenceCheck = { key, attemptedAt: now };
    this.latest.delete(symbol);
    this.latest.set(symbol, check);
    if (this.latest.size > 256) this.latest.delete(this.latest.keys().next().value!);
    this.pending++;
    void this.verify(symbol, basisDate, barAt, barDate, crossedHalt ?? barDate, scheduled).then(verified => {
      if (!verified || this.latest.get(symbol) !== check) return;
      check.verified = verified;
      this.onChange(symbol);
    }).catch(() => {
      // A delayed corporate action or provider correction stays unverified until retry.
    }).finally(() => { this.pending--; });
    return null;
  }

  private async verify(symbol: string, date: string, barAt: number, barDate: string,
    afterDate: string, scheduled?: AlpacaSplitHistory) {
    const history = scheduled ?? await this.splitHistory(symbol);
    if (history.symbol !== symbol || history.basisDate !== date) return;
    const actions = history.events.filter(event => event.effectiveDate > barDate && event.effectiveDate <= date);
    if (!actions.some(event => event.effectiveDate > afterDate)) return;
    const request = { symbol, timeframe: "1Day" as const, start: barAt, end: barAt + 59_999 };
    const raw = observedDailyBar(await this.rest.history({ ...request, adjustment: "raw" }, true),
      symbol, date, "raw", barAt / 1000);
    const adjusted = observedDailyBar(await this.rest.history(request, true), symbol, date, "split", barAt / 1000);
    const fetchedAt = this.now();
    if (!raw || !adjusted || easternClock(fetchedAt).date !== date || !verifyDailySplitAdjustment(raw, adjusted,
      barDate, actions.map(event => ({ exDate: event.effectiveDate, oldRate: event.oldShares, newRate: event.newShares })))) return;
    return { symbol, barAt, basisDate: date, price: adjusted.close, high: adjusted.high,
      low: adjusted.low, adjustment: "split" as const, fetchedAt };
  }
}
