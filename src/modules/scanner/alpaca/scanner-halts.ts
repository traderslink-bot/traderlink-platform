import "server-only";
import { requestAlpacaGateway } from "./client";
import { alpacaHaltRow } from "./halt-rows";
import { easternClock } from "../live/sessions";
import { scannerUniverseSymbolEligible } from "../live/universe-validation";
import type { ScannerActiveHalt } from "../live/contracts";
import type { AlpacaTradingStatus } from "./trading-status";

const NASDAQ_CARD_CODES = new Set(["T1", "T2", "T5", "T6", "T12", "LUDP", "LUDS"]);
const CTA_EQUIVALENT_CODES = new Set(["P", "D", "A", "M"]);

function allowedCardReason(status: AlpacaTradingStatus): boolean {
  const code = status.reasonCode?.trim().toUpperCase();
  if (!code) return false;
  if (status.tape === "C" || status.tape === "O") return NASDAQ_CARD_CODES.has(code);
  return (status.tape === "A" || status.tape === "B") && CTA_EQUIVALENT_CODES.has(code);
}

let pending: Promise<readonly ScannerActiveHalt[]> | undefined;
let expiresAt = 0;

/** Share one bounded gateway read across scanner SSE clients. */
export function readActiveAlpacaScannerHalts(): Promise<readonly ScannerActiveHalt[]> {
  const now = Date.now();
  if (pending && now < expiresAt) return pending;
  expiresAt = Number.POSITIVE_INFINITY;
  pending = loadActiveHalts(now).finally(() => { expiresAt = Date.now() + 1000; });
  return pending;
}

async function loadActiveHalts(now: number): Promise<readonly ScannerActiveHalt[]> {
  const data = await requestAlpacaGateway("halts", new URLSearchParams(), process.env, AbortSignal.timeout(2500)) as {
    feed?: string; connected?: boolean; statusesSubscribed?: boolean; statuses?: AlpacaTradingStatus[];
  } | null;
  if (!data || data.feed !== "sip" || data.connected !== true || data.statusesSubscribed !== true || !Array.isArray(data.statuses)) {
    throw Error("alpaca_halt_status_unavailable");
  }
  const date = easternClock(now).date;
  return data.statuses.flatMap(status => {
    if (!status || status.halted !== true || typeof status.symbol !== "string" || !scannerUniverseSymbolEligible(status.symbol) || !allowedCardReason(status)) return [];
    const time = Date.parse(status.haltedAt ?? status.pauseObservedAt ?? status.observedAt);
    if (!Number.isFinite(time) || time > now || easternClock(time).date !== date) return [];
    const row = alpacaHaltRow(status);
    if (!row) return [];
    if ((status.tape === "C" || status.tape === "O") && row.reasonCode === "T1" &&
      clockSecond(row.haltTimeEt) === "07:50:00" && process.env.TRADERLINK_INCLUDE_NASDAQ_0750_T1_HALTS !== "true") return [];
    return [row];
  }).sort((a,b) => b.haltTimeEt.localeCompare(a.haltTimeEt) || a.ticker.localeCompare(b.ticker));
}

type ExchangeResumeSchedule = Pick<ScannerActiveHalt, "ticker" | "haltTimeEt" | "quoteTimeEt" | "tradeTimeEt">;

function clockSecond(time: string | null): string | undefined {
  return time?.match(/^(\d{1,2}:\d{2}:\d{2})(?:\.\d+)?$/u)?.[1].padStart(8, "0");
}

/** The exchange schedule can annotate a current pause, never create or clear one. */
export function enrichAlpacaResumeSchedule(
  active: readonly ScannerActiveHalt[], todaySchedule: readonly ExchangeResumeSchedule[],
): readonly ScannerActiveHalt[] {
  return active.map(halt => {
    const started = clockSecond(halt.haltTimeEt);
    if (!started) return halt;
    const matches = todaySchedule.filter(row => row.ticker === halt.ticker && clockSecond(row.haltTimeEt) === started);
    if (matches.length !== 1) return halt;
    const schedule = matches[0];
    const planned = (time: string | null) => {
      const second = clockSecond(time);
      return second && second >= started ? time : null;
    };
    const quoteTimeEt = halt.quoteTimeEt ? null : planned(schedule.quoteTimeEt);
    const tradeTimeEt = halt.tradeTimeEt ? null : planned(schedule.tradeTimeEt);
    return {
      ...halt,
      ...(quoteTimeEt ? { quoteTimeEt, quoteTimeScheduled: true } : {}),
      ...(tradeTimeEt ? { tradeTimeEt, tradeTimeScheduled: true } : {}),
    };
  });
}
