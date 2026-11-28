import "server-only";

import { requestAlpacaGateway } from "@/src/modules/scanner/alpaca/client";
import type { AlpacaQuoteReply } from "@/src/modules/scanner/alpaca/scanner-snapshots";
import type { AlpacaSessionState } from "@/src/modules/scanner/alpaca/session-book";
import type { ScannerSession } from "@/src/modules/scanner/live/contracts";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import { snapshotBatches } from "@/src/modules/scanner/live/snapshots";
import type { WorkspaceMoomooQuote, WorkspaceQuoteSession } from "../workspace-moomoo-quotes";

type Sessions = AlpacaSessionState["sessions"];
export type WorkspaceQuoteCorrection = {
  affected: ReadonlySet<ScannerSession>;
  activeCorrectionEnd: number;
  totals?: Sessions;
};

export function workspaceCorrectedSessions(minutes: readonly number[], session: WorkspaceQuoteSession) {
  const affected = new Set<ScannerSession>();
  let activeCorrectionEnd = 0;
  for (const minute of minutes) {
    const clock = easternClock(minute * 1000);
    if (clock.date !== session.date || clock.minute < 240 || clock.minute >= session.regularCloseMinute + 240) continue;
    const period = clock.minute < 570 ? "premarket" : clock.minute < session.regularCloseMinute ? "regular" : "after_hours";
    affected.add(period);
    if (period === session.session) activeCorrectionEnd = Math.max(activeCorrectionEnd, (minute + 60) * 1000);
  }
  return { affected, activeCorrectionEnd };
}

export async function readWorkspaceCorrectedTotals(symbols: readonly string[], session: WorkspaceQuoteSession, signal: AbortSignal) {
  const totals = new Map<string, Sessions>();
  for (const batch of snapshotBatches(symbols)) {
    const query = new URLSearchParams({
      symbols: batch.join(","), sessions: "1", regularClose: String(session.regularCloseMinute),
    });
    const result = await requestAlpacaGateway("quotes", query, process.env, signal) as AlpacaQuoteReply | null;
    if (result?.feed !== "sip") throw Error("workspace_correction_feed_unavailable");
    for (const symbol of batch) {
      const book = result.sessionTotals?.[symbol];
      if (book?.complete && book.date === session.date && book.regularClose === session.regularCloseMinute
        && book.correctionRevision && Number.isSafeInteger(book.correctionRevision) && book.correctionRevision > 0) {
        totals.set(symbol, book.sessions);
      }
    }
  }
  return totals;
}

export function projectWorkspaceCorrectedQuote(quote: WorkspaceMoomooQuote, session: ScannerSession,
  { affected, totals }: WorkspaceQuoteCorrection): WorkspaceMoomooQuote {
  const pre = affected.has("premarket");
  const regular = affected.has("regular") && session !== "premarket";
  const post = affected.has("after_hours") && session === "after_hours";
  if (!pre && !regular && !post) return quote;

  const periods = session === "premarket" ? ["premarket"] as const
    : session === "regular" ? ["premarket", "regular"] as const
      : ["premarket", "regular", "after_hours"] as const;
  // Moomoo's original day extrema can still contain the corrected print.
  const nativeHighs = { premarket: quote.premarketHigh, regular: quote.regularHigh, after_hours: quote.postMarketHigh };
  const highs = totals ? periods.flatMap(period => {
    const high = affected.has(period) ? totals[period]?.high : nativeHighs[period] ?? totals[period]?.high;
    return high ?? [];
  }) : [];
  const lows = periods.flatMap(period => totals?.[period]?.low ?? []);
  return {
    ...quote,
    premarketHigh: pre ? totals?.premarket?.high ?? null : quote.premarketHigh,
    regularHigh: regular ? totals?.regular?.high ?? null : quote.regularHigh,
    postMarketHigh: post ? totals?.after_hours?.high ?? null : quote.postMarketHigh,
    premarketVolume: pre ? totals?.premarket?.volume ?? null : quote.premarketVolume,
    regularVolume: regular ? totals?.regular?.volume ?? null : quote.regularVolume,
    postMarketVolume: post ? totals?.after_hours?.volume ?? null : quote.postMarketVolume,
    dayHigh: highs.length ? Math.max(...highs) : null,
    dayLow: lows.length ? Math.min(...lows) : null,
    sessionTurnover: affected.has(session) ? totals?.[session]?.dollarVolume ?? null : quote.sessionTurnover,
    regularClose: regular && session === "after_hours" ? totals?.regular?.price ?? null : quote.regularClose,
  };
}
