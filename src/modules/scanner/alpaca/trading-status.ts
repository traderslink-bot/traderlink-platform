import { chartSymbol } from "./candles";
import { priceObservationOrder } from "./live-price-hub";

export type AlpacaTradingStatus = Readonly<{
  symbol: string; halted: boolean; haltedAt: string | null; observedAt: string;
  statusCode: string; reasonCode: string; reason: string; tape: string;
  quoteResumedAt?: string | null; tradeResumedAt?: string | null; pauseObservedAt?: string;
}>;

/** SIP status is authoritative: a quotation-only period is not trading resumption. */
export class AlpacaTradingStatusBook {
  private values = new Map<string, AlpacaTradingStatus>();
  private lifecycles = new Map<string, AlpacaTradingStatus>();
  private postHaltTrades = new Map<string, { time: string; price: number }>();
  private resumedByTrade = new Map<string, string>();

  observeTrade(symbol: string, time: string, price: number): boolean {
    const pause = this.values.get(symbol);
    if (!pause?.halted || this.resumedByTrade.has(symbol) || !Number.isFinite(Date.parse(time))
      || !Number.isFinite(price) || price <= 0
      || priceObservationOrder(time) <= priceObservationOrder(pause.pauseObservedAt ?? pause.observedAt)) return false;
    const previous = this.postHaltTrades.get(symbol);
    if (previous && priceObservationOrder(time) <= priceObservationOrder(previous.time)) return false;
    this.postHaltTrades.set(symbol, { time, price });
    if (!previous || previous.price === price) return false;
    this.resumedByTrade.set(symbol, time);
    this.postHaltTrades.delete(symbol);
    return true;
  }

  observe(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    if (row.T !== "s" || typeof row.S !== "string" || typeof row.sc !== "string"
      || typeof row.z !== "string" || typeof row.t !== "string" || !Number.isFinite(Date.parse(row.t))) return false;
    let symbol: string;
    try { symbol = chartSymbol(row.S); } catch { return false; }
    const prior = this.values.get(symbol);
    if (prior && priceObservationOrder(row.t) <= priceObservationOrder(prior.observedAt)) return false;
    const utp = row.z === "C" || row.z === "O", cta = row.z === "A" || row.z === "B";
    const halt = utp ? row.sc === "H" || row.sc === "P" : cta && row.sc === "2";
    const resume = utp ? row.sc === "T" : cta && row.sc === "3";
    const quotationOnly = utp && row.sc === "Q";
    if (!halt && !resume && !quotationOnly) return false;
    // A quotation-only message still means trading is paused, including when
    // subscription began after the initial halt message.
    const tradeResume = this.resumedByTrade.get(symbol);
    const newHalt = halt && tradeResume !== undefined
      && priceObservationOrder(row.t) > priceObservationOrder(tradeResume);
    const continuingPause = prior?.halted && !newHalt;
    if (!continuingPause || resume) {
      this.postHaltTrades.delete(symbol);
      this.resumedByTrade.delete(symbol);
    }
    const halted = halt || quotationOnly;
    const reasonCode = (halt || !continuingPause) && typeof row.rc === "string" ? row.rc.trim() : "";
    const reason = (halt || !continuingPause) && typeof row.rm === "string" ? row.rm.trim() : "";
    const continuingReason = continuingPause && (!reasonCode || reasonCode === prior.reasonCode);
    const next: AlpacaTradingStatus = {
      symbol, halted, haltedAt: halt ? continuingPause && prior.haltedAt ? prior.haltedAt : row.t
        : quotationOnly ? prior?.halted ? prior.haltedAt : null : prior?.haltedAt ?? null,
      pauseObservedAt: halted ? continuingPause ? prior.pauseObservedAt ?? prior.observedAt : row.t : prior?.pauseObservedAt,
      observedAt: row.t, statusCode: row.sc, tape: row.z,
      reasonCode: halted ? reasonCode || (continuingPause ? prior.reasonCode : "unknown") : prior?.reasonCode ?? "unknown",
      reason: halted
        ? reason || (continuingReason ? prior.reason : typeof row.sm === "string" ? row.sm : "Trading paused")
        : prior?.reason ?? "Trading resumed",
      quoteResumedAt: quotationOnly ? row.t : halt ? null : prior?.quoteResumedAt ?? null,
      tradeResumedAt: resume ? row.t : null,
    };
    this.values.set(symbol, next);
    if(next.haltedAt)this.lifecycles.set(`${symbol}:${next.haltedAt}`,next);
    return true;
  }
  read(symbol: string): AlpacaTradingStatus | null {
    const status = this.values.get(symbol);
    const tradeResumedAt = this.resumedByTrade.get(symbol);
    return status && tradeResumedAt ? { ...status, halted: false, tradeResumedAt } : status ?? null;
  }
  all(): readonly AlpacaTradingStatus[] {
    return [...this.values.keys()].map(symbol => this.read(symbol)!);
  }
  events(): readonly AlpacaTradingStatus[] { return [...this.lifecycles.values()]; }
}
