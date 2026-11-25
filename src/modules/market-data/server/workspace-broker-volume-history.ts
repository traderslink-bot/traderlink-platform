import "server-only";

import { easternDayStart } from "@/src/modules/scanner/alpaca/candles";
import { sameTimeSessionVolumeRatio } from "@/src/modules/scanner/custom/same-time-relative-volume";
import { historyCalendar } from "@/src/modules/scanner/live/scanner-indicator-calculation";
import type { WorkspaceQuoteSession } from "../workspace-moomoo-quotes";
import { MoomooChartHistory } from "./moomoo-chart-history";
import type { WorkspaceMoomooConnection } from "./workspace-moomoo-access";

const DAY = 86_400_000;

export const workspaceVolumeThrough = (now: number) => Math.floor((now - 6000) / 900_000) * 900_000;

export async function readWorkspaceRelativeVolume(symbol: string, context: WorkspaceQuoteSession,
  through: number, connection: WorkspaceMoomooConnection, signal: AbortSignal) {
  const today = Date.parse(`${context.date}T12:00:00Z`);
  const firstDate = new Date(today - 7 * DAY).toISOString().slice(0, 10);
  const start = easternDayStart((today - 7 * DAY) / 1000) * 1000;
  const history = new MoomooChartHistory(request => connection.request(request, signal));
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
