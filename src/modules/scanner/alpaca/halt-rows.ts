import type { ScannerActiveHalt } from "../live/contracts";
import type { AlpacaTradingStatus } from "./trading-status";

export function alpacaHaltRow(status: AlpacaTradingStatus, includeResumed=false): ScannerActiveHalt | null {
  if (!status.halted && (!includeResumed || !status.haltedAt)) return null;
  const haltedAt = Date.parse(status.haltedAt ?? status.pauseObservedAt ?? status.observedAt);
  if (!Number.isFinite(haltedAt)) return null;
  const haltTimeEt = status.haltedAt ? new Intl.DateTimeFormat("en-US", {timeZone:"America/New_York",hour:"2-digit",minute:"2-digit",second:"2-digit",fractionalSecondDigits:3,hourCycle:"h23"}).format(haltedAt) : "—";
  const market = status.tape === "C" || status.tape === "O" ? "NASDAQ" : "NYSE";
  const time=(at:string|null|undefined)=>at?new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"2-digit",minute:"2-digit",second:"2-digit",fractionalSecondDigits:3,hourCycle:"h23"}).format(Date.parse(at)):null;
  return {source:"alpaca",halted:status.halted,id:`alpaca:${status.symbol}:${status.haltedAt ?? `unknown:${status.pauseObservedAt ?? status.observedAt}`}`,ticker:status.symbol,market,chartExchange:market,
    haltTimeEt,reasonCode:status.reasonCode,reason:status.reason,quoteTimeEt:time(status.quoteResumedAt),tradeTimeEt:time(status.tradeResumedAt)};
}
