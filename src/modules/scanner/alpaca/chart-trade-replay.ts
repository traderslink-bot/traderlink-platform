import { createPriceMovementSeries, type OrderedChartTrade, type PriceMovementKind } from "./chart-price-movement";

type TradePosition = OrderedChartTrade & { position: number };
type Snapshot = {
  kind: "snapshot";
  stream: string;
  through: number;
  trades: readonly TradePosition[];
};
type Batch = {
  kind: "batch";
  stream: string;
  after: number;
  through: number;
  trades: readonly TradePosition[];
};
export type ReplayFrame = Snapshot | Batch | { kind: "reset"; stream: string };
const maxReplayTrades = 100_000;

/** A gap discards the entire projection until the producer sends a complete snapshot. */
export function createChartTradeReplay(kind: PriceMovementKind, step: number) {
  let projection = createPriceMovementSeries(kind, step);
  let lastTrade: TradePosition | undefined;
  let stream: string | null = null;
  let cursor = 0;

  return (frame: ReplayFrame) => {
    // A discontinuity clears the chart until another complete snapshot arrives.
    function reset() {
      projection = createPriceMovementSeries(kind, step);
      lastTrade = undefined;
      stream = null;
      cursor = 0;
      return { status: "needs_snapshot" as const };
    }

    if (frame.kind !== "snapshot" && stream !== null && frame.stream !== stream) return { status: "ignored" as const };
    if (frame.kind === "reset" || (frame.kind === "batch" && (stream === null || frame.after !== cursor))) return reset();
    const after = frame.kind === "snapshot" ? 0 : frame.after;
    if (!Number.isSafeInteger(frame.through) || frame.through !== after + frame.trades.length ||
        frame.trades.some((trade, index) => trade.position !== after + index + 1)) return reset();

    if (frame.through > maxReplayTrades) return reset();
    try {
      if (frame.kind === "snapshot") {
        projection = createPriceMovementSeries(kind, step);
        lastTrade = undefined;
      }
      for (const trade of frame.trades) projection.append(trade);
      const bars = projection.bars();
      lastTrade = frame.trades.at(-1) ?? lastTrade;
      stream = frame.stream;
      cursor = frame.through;
      return { status: "ready" as const, bars, lastTrade, cursor };
    } catch {
      return reset();
    }
  };
}

export function readChartTradeReplayFrame(value: unknown): ReplayFrame {
  if (!value || typeof value !== "object" || !("kind" in value) || !("stream" in value) ||
      typeof value.stream !== "string" || !value.stream.length || value.stream.length > 128) throw Error("invalid_trade_frame");
  const { kind, stream } = value;
  if (kind === "reset") return { kind, stream };
  if ((kind !== "snapshot" && kind !== "batch") || !("through" in value) ||
      typeof value.through !== "number" || !("trades" in value) || !Array.isArray(value.trades) ||
      value.trades.length > maxReplayTrades) throw Error("invalid_trade_frame");
  const trades: TradePosition[] = value.trades.map(trade => {
    if (!trade || typeof trade !== "object" || !Number.isSafeInteger(trade.position) ||
        typeof trade.time !== "string" || trade.time.length > 32 ||
        typeof trade.price !== "number" || !Number.isFinite(trade.price) || trade.price <= 0) throw Error("invalid_trade_frame");
    return { position: trade.position, time: trade.time, price: trade.price };
  });
  if (kind === "snapshot") return { kind, stream, through: value.through, trades };
  if (!("after" in value) || typeof value.after !== "number") throw Error("invalid_trade_frame");
  return { kind, stream, after: value.after, through: value.through, trades };
}
