import "server-only";

import { readAlpacaTradeCorrectionEvidence, readAlpacaTradeRevisions } from "@/src/modules/scanner/alpaca/client";
import { easternDayStart } from "@/src/modules/scanner/alpaca/candles";
import { sameTimeSessionVolumeRatio } from "@/src/modules/scanner/custom/same-time-relative-volume";
import { historyCalendar } from "@/src/modules/scanner/live/scanner-indicator-calculation";
import { snapshotBatches } from "@/src/modules/scanner/live/snapshots";
import type { WorkspaceQuoteSession } from "../workspace-moomoo-quotes";
import { MoomooChartHistory } from "./moomoo-chart-history";
import type { WorkspaceMoomooConnection } from "./workspace-moomoo-access";

const DAY = 86_400_000;

export const workspaceVolumeThrough = (now: number) => Math.floor((now - 6000) / 900_000) * 900_000;

const volumeLookback = (date: string) => easternDayStart((Date.parse(`${date}T12:00:00Z`) - 7 * DAY) / 1000) * 1000;

export async function readWorkspaceVolumeRevisions(symbols: readonly string[], date: string, through: number, signal: AbortSignal) {
  const revisions = new Map<string, string>();
  const start = volumeLookback(date);
  for (const batch of snapshotBatches(symbols)) {
    const result = await readAlpacaTradeRevisions({ symbols: batch, start, end: through }, process.env, signal);
    for (const [symbol, entry] of Object.entries(result.symbols)) {
      if (entry?.revision) revisions.set(symbol, entry.revision);
    }
  }
  return revisions;
}

export async function readWorkspaceRelativeVolume(symbol: string, context: WorkspaceQuoteSession,
  through: number, connection: WorkspaceMoomooConnection, signal: AbortSignal) {
  const today = Date.parse(`${context.date}T12:00:00Z`);
  const firstDate = new Date(today - 7 * DAY).toISOString().slice(0, 10);
  const start = volumeLookback(context.date);
  const history = new MoomooChartHistory(request => connection.request(request, signal), Date.now,
    range => readAlpacaTradeCorrectionEvidence(range, process.env, signal));
  const [result, calendar] = await Promise.all([
    history.history({ symbol, timeframe: "15Min", start, end: through, adjustment: "split" }),
    history.calendar(firstDate, context.date),
  ]);
  if (!calendar.available || !result.complete || result.basisDate !== context.date || !result.bars.length
    || result.bars.some(bar => bar.time % 900 !== 0)) return null;
  const stride = 6;
  const packed = new Float64Array(result.bars.length * stride);
  for (const [index, bar] of result.bars.entries()) {
    packed[index * stride] = bar.time;
    packed[index * stride + 5] = bar.volume;
  }
  return sameTimeSessionVolumeRatio(packed, stride, through, result.bars[0].time * 1000, context.session, historyCalendar(calendar));
}
